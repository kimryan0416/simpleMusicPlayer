var database = [];
var player;
var screenHeight = window.innerHeight;
var loopStages = ['assets/repeat_0_white.png', 'assets/repeat_1_white.png', 'assets/repeat_all_white.png'];
var shuffleStages = ['assets/shuffle_0_white.png', 'assets/shuffle_1_white.png'];
var search_element, search_options_element, search_text, search_option, searching_boolean = true, search_matches = [];

function readableDuration(milliseconds) {
    var sec = milliseconds / 1000;
    var min = Math.floor(sec/60);
    min = min >= 10 ? min : '0' + min;
    sec = Math.floor(sec % 60);
    sec = sec >= 10 ? sec : '0' + sec; 
    return min + ":" + sec;
}

// assuming time is in the format of seconds.milliseconds
function milliseconds(seconds) {	return Math.floor(seconds*1000);	}
function revertFromMilliseconds(millisec) {	return parseInt(millisec) / 1000; }

function onTimeUpdate(track) {
	var curMillisec = milliseconds(track.currentTime);
	var curTime = readableDuration(curMillisec);
	if (curMillisec >= player.end_padding) return nextAudio();
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
				setDatabaseInScript(response["raw_data"]);
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
		complete: function() {	$("#content").show();	}
	});
}

function setDatabaseInScript(data) {	
	database = data;
	console.log(database);
}

function prePrepareMedia(id) {
	var data = database[id];
	$(player.html).attr("src", data["url"]);
	player.start_padding = data["start_padding"];
	player.end_padding = data["end_padding"];
	player.time_slider.attr("max", player.end_padding);
    player.time_slider.val(player.start_padding);

    player.canPlay = false;
    player.lyrics.text("Loading Audio...");
    player.lyrics_content = data["lyrics"];
}
function postPrepareMedia(data) {
	player.art.attr("src", data["art"]);
	player.title.html(data["title"]);
	player.artist.html(data["artist"]);
	player.duration.text(data["duration"]);
}

function prepareMedia(id) {
	var data = database[id];
	$(player.html).attr("src", data["url"]);
	player.art.attr("src", data["art"]);
	player.title.html(data["title"]);
	player.artist.html(data["artist"]);
	player.duration.text(data["duration"]);
	player.start_padding = data["start_padding"];
	player.end_padding = data["end_padding"];
	player.time_slider.attr("max", player.end_padding);
    player.time_slider.val(milliseconds($(player.html).prop("currentTime")));
    player.time_slider.val(player.start_padding);
    player.canPlay = false;
    player.lyrics.text("Loading Audio...");
    player.lyrics_content = data["lyrics"];
}
function loadMedia() {
	$(player.html).bind("load");
	$(player.html).trigger("load");
	player.time_slider.attr("max", player.end_padding);
    //player.time_slider.val(milliseconds($(player.html).prop("currentTime")));
    player.time_slider.val(player.start_padding);
    player.html.oncanplay = function() {
    	if (!player.canPlay) {
			player.lyrics.html(player.lyrics_content);
			player.canPlay = true;
    	}
    }
}
function abortAudio(id) {
	pauseAudio();
	$(player.html).bind('abort');
	$(player.html).trigger('abort');
	player.paused = true;
}
function playAudio() {
	$(player.html).trigger("play");
	if (player.paused) {
		player.paused = false;
		player.playButton.addClass("hiddenControl");
		player.pauseButton.removeClass("hiddenControl");
	}
}
function pauseAudio() {
	$(player.html).trigger("pause");
	if (!player.paused) {
		player.paused = true;
		player.pauseButton.addClass("hiddenControl");
		player.playButton.removeClass("hiddenControl");
	}
}
function backFiveAudio() {
	// Same as forwardAudio(), except moves back 5 seconds
	pauseAudio();
	$(player.html).prop("currentTime", $(player.html).prop("currentTime") - 5);
	player.time_slider.val( milliseconds($(player.html).prop("currentTime")) );
	if (milliseconds($(player.html).prop("currentTime")) < player.start_padding) previousAudio();
	else playAudio();
}
function forwardFiveAudio(){
	// Causes the song to advance by 5 seconds, also adjusts the time slider appropriately
	pauseAudio();
	$(player.html).prop("currentTime", $(player.html).prop("currentTime")+5);
	player.time_slider.val( milliseconds($(player.html).prop("currentTime")) );
	if (milliseconds($(player.html).prop("currentTime")) > player.end_padding) nextAudio();
	else playAudio();
}
function nextAudio() {
	pauseAudio();
	var savedId = player.queue[0];
	player.canPlay = false;
	player.queue.shift();
	if (player.loop == 0) {
		player.pauseButton.addClass("hiddenControl");
		player.playButton.removeClass("hiddenControl");
		player.paused = true;
	} else if (player.loop == 1) {
		player.queue.push(savedId);
		player.canPlay = true;
		$(player.html).prop("currentTime", revertFromMilliseconds(player.start_padding));
		playAudio();
	} else {
		player.start_padding = 0;
		player.end_padding = 3599999;
		if (player.queue.length == 0) {
			prepareMedia(savedId);
		} else {
			prepareMedia(player.queue[0]);
		}
		loadMedia();
		playAudio();
		player.queue.push(savedId);
	}
}
function previousAudio() {
	pauseAudio();
	var savedId = player.queue[0];
	player.canPlay = false;
	if (player.loop == 0) {
		player.queue.shift();
		player.pauseButton.addClass("hiddenControl");
		player.playButton.removeClass("hiddenControl");
		player.paused = true;
	} else if (player.loop == 1) {
		player.queue.shift();
		player.queue.push(savedId);
		player.canPlay = true;
		timeAdjust(player.start_padding);
		playAudio();
	} else {
		savedId = player.queue[player.queue.length-1];
		player.queue.splice(player.queue.length-1, 1);
		player.start_padding = 0;
		player.end_padding = 3599999;
		if (player.queue.length == 0) {
			prepareMedia(savedId);
		} else {
			prepareMedia(player.queue[0]);
		}
		loadMedia();
		startAudio();
		player.queue.unshift(savedId);
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
    $(player.html).prop("currentTime", revertFromMilliseconds(time));
	playAudio();
}


function loadQueue() {
	player.queue = [];
	if (player.loop == 2) createLoop(player.currentAlbumID, player.currentMediaID, player.currentAlbumArtistID, player.shuffle);
	else player.queue.push(player.currentMediaID);
	console.log(player.queue);
}
function createLoop(albumId, songId, albumArtistId, shuffle) {
	var data = "albumId="+albumId+"&songId="+songId+"&albumArtistId="+albumArtistId+"&shuffle="+shuffle;
	$.ajax({
		url: "scripts/createLoop.php", 
		data: data, 
		type: 'POST', 
		dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (response.success) addToLoop(response.loop);
			else alert("ERROR with creating loop: " + response.message);
		},
		error: function(jqXHR, textStatus, errorThrown) {	alert('AJAX ERRORS WITH CREATING LOOP: ' + errorThrown);	}
	});
}
function addToLoop(arr) {
	if (arr.length > 0) {
		var ind = arr.indexOf(player.currentMediaID);
		for (var i = ind; i < arr.length; i++) {
			player.queue.push(arr[i]);
		}
		if (ind != 0) {
			for (var k = 0; k < ind; k++) {
				player.queue.push(arr[k]);
			}
		}
	}
}
function toggleLoop() {
	player.loop = ( player.loop == 2 ) ? 0 : player.loop + 1;
	player.loopButton.attr("src", loopStages[player.loop]);
	loadQueue();
}
function toggleShuffle() {
	player.shuffle = (player.shuffle == 1) ? 0 : 1;
	player.shuffleButton.attr("src", shuffleStages[player.shuffle]);
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
	player.currentMediaID = id;
	player.currentAlbumID = al;

	prePrepareMedia(player.currentMediaID);
	loadMedia();
	if (milliseconds($(player.html).prop("currentTime")) < player.startPadding ) $(player.html).prop("currentTime", revertFromMilliseconds(player.startPadding));

	var data = "id="+id;
	$.ajax({
		url: "scripts/getMediaMobile.php",  
		type: 'POST',
		data: data, 
		dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			console.log(response);
			if (response.success) {
				postPrepareMedia(response['data']);
				
				openPlayer();
				playAudio();
			} 
			else alert(response.message);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS @ Getting Specifc Media: ' + errorThrown);
		}
	});

}

function toggleLyrics() {	player.lyricsContainer.toggleClass("lyrics_open");	}

$(document).ready(function() {
	player = {
		html: document.getElementById("audio"),
		title: $("#player_title"),
		artist: $("#player_artist"),
		art: $("#player_art"),
		lyrics: $("#player_lyrics"),
		lyricsContainer: $("#player_art_and_lyrics"),
		lyrics_content: "",
		backButton: $("#back_to_albums"),
		curTime: $("#curTime"),
		duration: $("#duration"),
		time_slider: $("#time_slider"),
		previousButton: $("#previous"),
		nextButton: $("#next"),
		backFiveButton: $("#backFive"),
		forwardFiveButton: $("#forwardFive"),
		playButton: $("#play"),
		pauseButton: $("#pause"),
		loopButton: $("#repeat"),
		shuffleButton: $("#shuffle"),
		start_padding: 0, 
		end_padding: 3599999,
		canPlay: false,
		queue: [],
		paused: true,
		loop: 1,
		shuffle: 0,
		currentMediaID: null,
		currentAlbumID: null,
		currentAlbumArtistID: null
	};

	getAllMedia();
	$(player.html).prop("volume",0.5);

	player.time_slider.on("input", function() { 	timeAdjust( $(this).val() );	});

	player.playButton.on("click", playAudio);
	player.pauseButton.on("click", pauseAudio);

	player.backFiveButton.on("click", backFiveAudio);
	player.forwardFiveButton.on("click", forwardFiveAudio);

	player.previousButton.on("click", previousAudio);
	player.nextButton.on("click", nextAudio);

	player.loopButton.on("click", toggleLoop);
	player.shuffleButton.on("click", toggleShuffle);

	player.backButton.on("click", closePlayer);
	player.lyricsContainer.on("click", toggleLyrics);

	$(player.html).on("ended", nextAudio);

});