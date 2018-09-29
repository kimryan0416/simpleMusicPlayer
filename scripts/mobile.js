var paused = true;
var database = [];
var sorted_database = [];
var current_media_id;
var current_album_artist_id, current_album_artist_name;
var current_album_id, current_album_name;
var player;
var queue = [], shuffle = false, loop = 1;
var screenHeight = window.innerHeight;
var loopStages = ["assets/repeat_0_white.png", "assets/repeat_1_white.png", "assets/repeat_all_white.png"];
var shuffleStages = ["assets/shuffle_0_white.png", "assets/shuffle_1_white.png"];
var search_element, search_options_element, search_text, search_option, searching_boolean = true, search_matches = [];

function readableDuration(milliseconds) {
    // Get the duration or current time of a song in minutes:seconds instead of just seconds
    var sec = milliseconds / 1000;
    var min = Math.floor(sec/60);
    min = min >= 10 ? min : '0' + min;
    sec = Math.floor(sec % 60);
    sec = sec >= 10 ? sec : '0' + sec; 
    /*
    var milli = Math.floor(milliseconds%1000);
    milli = milli >= 100 ? milli : '0' + milli;
    milli = milli >= 10 ? milli : '0' + milli;
    */
    return min + ":" + sec;
}
function milliseconds(seconds) {
	// assuming time is in the format of seconds.milliseconds
	var milli = seconds*1000;
	return Math.floor(milli);
}
function revertFromMilliseconds(millisec) {
	return millisec / 1000;
}
function onTimeUpdate(track) {
	var curMillisec = milliseconds(track.currentTime);
	var curTime = readableDuration(curMillisec);
	if (curMillisec > player.end_padding) {
		nextAudio();
		return;
	}
	player.curTime.text(curTime);
	player.time_slider.val(curMillisec);
}


function getAllMedia(print = false) {
	$.ajax({
		url: "scripts/get_all_media_mobile.php",  
		type: 'GET', 
		dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (response.success) {
				setDatabaseInScript(response["raw_data"], response["sorted_data"]);
				if (print) {
					$("#content").empty().hide();
					printMedia(response["sorted_data"], updateCurrentPlayer, scrollTo, deleted);
				}
			} 
			else alert(response.message);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS @ Getting All Media: ' + errorThrown);
			location.reload(true);
		},
		complete: function() {
			$("#content").show();
		}
	});
}

function setDatabaseInScript(data, sorted) {
	database = data;
	sorted_database = sorted;
	console.log(database);
	console.log(sorted);
}


function prepareMedia(id) {
	var data = database[id];
	$(player.audio).attr("src", data["url"]);
	player.art.attr("src", data["art"]);
	player.title.html(data["title"]);
	player.artist.html(data["artist"]);
	player.duration.text(data["duration"]);
	player.start_padding = data["start_padding"];
	player.end_padding = data["end_padding"];
	player.time_slider.attr("max", player.end_padding);
    player.time_slider.val(milliseconds($(player.audio).prop("currentTime")));
    player.time_slider.val(player.start_padding);
    player.canPlay = false;
    player.lyrics.text("Loading Audio...");
    player.lyrics_content = data["lyrics"];
}
function loadMedia() {
	$(player.audio).bind("load");
	$(player.audio).trigger("load");
	player.time_slider.attr("max", player.end_padding);
    player.time_slider.val(milliseconds($(player.audio).prop("currentTime")));
    player.time_slider.val(player.start_padding);
    player.audio.oncanplay = function() {
    	if (!player.canPlay) {
			player.lyrics.html(player.lyrics_content);
			player.canPlay = true;
    	}
    }
}
function abortAudio(id) {
	pauseAudio();
	$(player.audio).bind('abort');
	$(player.audio).trigger('abort');
	paused = true;
}
function playAudio() {
	$(player.audio).trigger("play");
	if (paused) {
		paused = false;
		player.play.addClass("hiddenControl");
		player.pause.removeClass("hiddenControl");
	}
}
function pauseAudio() {
	$(player.audio).trigger("pause");
	if (!paused) {
		paused = true;
		player.pause.addClass("hiddenControl");
		player.play.removeClass("hiddenControl");
	}
}
function backFiveAudio() {
	// Same as forwardAudio(), except moves back 5 seconds
	pauseAudio();
	$(player.audio).prop("currentTime", $(player.audio).prop("currentTime") - 5);
	player.time_slider.val( milliseconds($(player.audio).prop("currentTime")) );
	if (milliseconds($(player.audio).prop("currentTime")) < player.start_padding) previousAudio();
	else playAudio();
}
function forwardFiveAudio(){
	// Causes the song to advance by 5 seconds, also adjusts the time slider appropriately
	pauseAudio();
	$(player.audio).prop("currentTime", $(player.audio).prop("currentTime")+5);
	player.time_slider.val( milliseconds($(player.audio).prop("currentTime")) );
	if (milliseconds($(player.audio).prop("currentTime")) > player.end_padding) nextAudio();
	else playAudio();
}
function nextAudio() {
	pauseAudio();
	var savedId = queue[0];
	player.canPlay = false;
	queue.shift();
	if (loop == 0) {
		player.pause.addClass("hiddenControl");
		player.play.removeClass("hiddenControl");
		paused = true;
	} else if (loop == 1) {
		queue.push(savedId);
		player.canPlay = true;
		$(player.audio).prop("currentTime", revertFromMilliseconds(player.start_padding));
		playAudio();
	} else {
		player.start_padding = 0;
		player.end_padding = 3599999;
		if (queue.length == 0) {
			prepareMedia(savedId);
		} else {
			prepareMedia(queue[0]);
		}
		loadMedia();
		playAudio();
		queue.push(savedId);
	}
}
function previousAudio() {
	pauseAudio();
	var savedId = queue[0];
	player.canPlay = false;
	if (loop == 0) {
		queue.shift();
		player.pause.addClass("hiddenControl");
		player.play.removeClass("hiddenControl");
		paused = true;
	} else if (loop == 1) {
		queue.shift();
		queue.push(savedId);
		player.canPlay = true;
		timeAdjust(player.start_padding);
		playAudio();
	} else {
		savedId = queue[queue.length-1];
		queue.splice(queue.length-1, 1);
		player.start_padding = 0;
		player.end_padding = 3599999;
		if (queue.length == 0) {
			prepareMedia(savedId);
		} else {
			prepareMedia(queue[0]);
		}
		loadMedia();
		startAudio();
		queue.unshift(savedId);
	}
}
function timeAdjust(time) {
	// time is in milliseconds
    // Adjusts the current time of the audio - works in tandem with other functions, isn't called simply by clicking on an element
	pauseAudio();
	if ( parseInt(time) < parseInt(player.start_padding) ) {
		console.log("Reverting to start padding: " + player.start_padding);
		time = player.start_padding;
	}
	else if ( parseInt(time) > parseInt(player.end_padding) ) {
		console.log("Reverting to end padding: " + player.end_padding);
		time = player.end_padding;
	}
    $(player.audio).prop("currentTime", revertFromMilliseconds(time));
	playAudio();
}
function volumeAdjust(volume) {
	player.volume.val(volume);
	var vol = volume/100;
    $(player.audio).prop("volume",vol);
}



function loadQueue() {
	queue = [];
	if (loop == 2) createLoop(current_album_id, current_media_id, current_album_artist_id, shuffle);
	else queue.push(current_media_id);
	console.log(queue);
}
function createLoop(albumId, songId, albumArtistId, shuffle) {
	var data = "albumId="+albumId+"&songId="+songId+"&albumArtistId="+albumArtistId+"&shuffle="+shuffle;
	console.log(data);
	$.ajax({
		url: "scripts/createLoop.php", 
		data: data, 
		type: 'POST', 
		dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (response.success) {
				console.log(response.loop);
				addToLoop(response.loop);
			}
			else alert("ERROR with creating loop: " + response.message);
		},
		error: function(jqXHR, textStatus, errorThrown) {	
			alert('AJAX ERRORS WITH CREATING LOOP: ' + errorThrown);	
		}
	});
}
function addToLoop(arr) {
	if (arr.length > 0) {
		var ind = arr.indexOf(current_media_id);
		for (var i = ind; i < arr.length; i++) {
			queue.push(arr[i]);
		}
		if (ind != 0) {
			for (var k = 0; k < ind; k++) {
				queue.push(arr[k]);
			}
		}
	}
}
function toggleLoop() {
	loop++;
	if (loop == 3) loop = 0;
	player.loop.attr("src", loopStages[loop]);
	loadQueue();
}
function toggleShuffle() {
	shuffle ++;
	if (shuffle == 2) shuffle = 0;
	player.shuffle.attr("src", shuffleStages[shuffle]);
	loadQueue();
}
function openPlayer() {
	$("#media_container").removeClass("selected");
	$("#player_container").addClass("selected");
	if (!$("#open_player").hasClass("opened")) {
		$("#open_player").addClass("opened");
	}
}
function closePlayer() {
	$("#player_container").removeClass("selected");
	$("#media_container").addClass("selected");
}
function songClicked(id, al, al_artist) {
	$("#media_contents").find(".searched").removeClass("searched");
	current_media_id = id;
	current_album_id = al;
	current_album_name = al_artist;

	prepareMedia(current_media_id);
	openPlayer();

	loadMedia();
	playAudio();
}
function toggleLyrics() {
	$("#player_art_and_lyrics").toggleClass("lyrics_open");
}
function search(text) {
	search_matches = [];
	for (var id in database) {
		if ( database[id]["title"].toLowerCase().includes(text.toLowerCase()) ) {
			search_matches.push(id);
		}
	}
	if (search_matches.length > 0) {
		return true;
	} else {
		return false;
	}
}

$(document).ready(function() {
	player = {
		audio: document.getElementById("audio"),
		title: $("#player_title"),
		artist: $("#player_artist"),
		art: $("#player_art"),
		lyrics: $("#player_lyrics"),
		lyrics_content: "",
		back: $("#back_to_albums"),
		curTime: $("#curTime"),
		duration: $("#duration"),
		time_slider: $("#time_slider"),
		previous: $("#previous"),
		next: $("#next"),
		backFive: $("#backFive"),
		forwardFive: $("#forwardFive"),
		play: $("#play"),
		pause: $("#pause"),
		loop: $("#repeat"),
		volume: $("#volume"),
		shuffle: $("#shuffle"),
		start_padding: 0, 
		end_padding: 3599999,
		canPlay: false
	};

	getAllMedia();
	volumeAdjust(player.volume.val());

	player.time_slider.on("input", function() { 
		timeAdjust( $(this).val() );
	});
	player.volume.on( "input", function() { volumeAdjust($(this).val()); 	});
	$(player.audio).on("ended", nextAudio);

	search_element = document.getElementById('search_input');
	search_element.addEventListener('keypress', function(e){
	  	if (e.keyCode == 13) {
	  		if ( searching_boolean ) {
	  			searching_boolean = false;
	  			search_text = search_element.value;
		  		if ( !search(search_text) ) {
		  			alert("No matches found");
		  			return;
		  		}
	  		}
	  		if (search_matches.length > 0) {
	  			$("#media_contents").find(".searched").removeClass("searched");
	  			var toSearch = search_matches[0];
		  		search_matches.shift();
		  		search_matches.push(toSearch);
		  		var potential_match = document.getElementById(toSearch);
				while( potential_match == null ) {
					toSearch =  search_matches[0];
					search_matches.shift();
					potential_match = document.getElementById(toSearch);
				}
				document.getElementById("media_contents").scrollTo({
					'behavior': 'smooth',
					'top': potential_match.offsetTop - (screenHeight/2) + (potential_match.offsetHeight/2)
				});
				$(potential_match).addClass("searched");
	  		}
	  	} else {
	  		searching_boolean = true;
	  	}
	});

});