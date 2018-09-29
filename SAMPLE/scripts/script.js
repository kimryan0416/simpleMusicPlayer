var sortedDatabase = [];
var queue = [];
var currentSong = -1, currentAlbum = -1, currentAlbumArtist = -1;
var paused = true, loop = 1, shuffle = 0, dynamic_lyrics_toggle = false;
var player, editForm, embedForm, iconEdit, iconEditSet = 0;
var dynamic_lyrics_starting_times;
//var dynamic_lyrics_ending_times; 
var current_time = "-3599999", current_time_index = -1;
var screenHeight = window.innerHeight;
var lyricsHeight, scrollToLyrics = true;
var addAlbumArt_id;

function readableDuration(milliseconds) {
    // Get the duration or current time of a song in minutes:seconds instead of just seconds
    var sec = milliseconds / 1000;
    var min = Math.floor(sec/60);
    min = min >= 10 ? min : '0' + min;
    sec = Math.floor(sec % 60);
    sec = sec >= 10 ? sec : '0' + sec; 
    var milli = Math.floor(milliseconds%1000);
    milli = milli >= 100 ? milli : '0' + milli;
    milli = milli >= 10 ? milli : '0' + milli;
    return min + ":" + sec + "." + milli;
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

	if (dynamic_lyrics_toggle) {
		if (current_time_index == -1) {
			$(".lyric_segment.selected").removeClass("selected");
			for (var i = dynamic_lyrics_starting_times.length - 1; i >= 0; i--) {
				if ( curMillisec >= dynamic_lyrics_starting_times[i] ) {
					current_time_index = i;
					current_time = dynamic_lyrics_starting_times[i];
					break;
				} else {
					current_time_index = -1;
					current_time = "-3599999";
				}
			}
		} else {
			if ( curMillisec > dynamic_lyrics_starting_times[current_time_index+1] ) {
				$(".lyric_segment.selected").removeClass("selected");
				current_time_index++;
				current_time = dynamic_lyrics_starting_times[current_time_index];
			}
		}

		if ( !$(".lyric_segment_"+current_time).hasClass("selected") ) {
			$(".lyric_segment_"+current_time).addClass("selected");
			if (scrollToLyrics) {
				var elmnt = document.querySelector(".lyric_segment_"+current_time);
				if (elmnt != null) {
					document.getElementById("player_lyrics").scrollTo({
					    'behavior': 'smooth',
						'top': elmnt.offsetTop - (lyricsHeight/2) + (elmnt.offsetHeight/2)
					});	
				}
			}
		}
	}
}

function reloadMedia() {
	var data = "type=get";
	$.ajax({
		url: "scripts/testScript.php",
		data: data,
		type: "post",
		dataType: "json",
		success: function(response, textStatus, jqXHR) {
			if (response.success) {
				for (var i = 0; i < response.files.length; i++) {	updatePart(i);	}
				if (reloadPage) $(document).ajaxStop(function() { location.reload(true); });
			} else {
				alert("Something went wrong");
				$(document).ajaxStop(function() { location.reload(true); });
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			// Handle errors here
			alert('ERRORS @ Stage 1: ' + errorThrown);
			location.reload(true);
		}
	});
}

function updatePart(song_id) {
	var data = "id="+song_id;
	$.ajax({
		url: "scripts/updateMedia.php", 
		data: data, 
		type: 'POST', 
		dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (!response.success) {
				alert(response.message);
				$(document).ajaxStop(function() { location.reload(true); });
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS @ Updating Songs: ' + errorThrown);
			location.reload(true);
		}
	});
}

function openMedia(id, newQueue = false) {
	var data = "id="+id;
	$.ajax({
		url: "scripts/getMediaInfo.php", 
		data: data, 
		type: 'POST', 
		dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (response.success) {
				preparePlayer(response.info);
				if (response.info.medium == 0) {
					prepareAudio(response.info);
				}
				if (newQueue) {
					loadQueue();
				}
			} 
			else alert(response.message);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS @ Opening Media: ' + errorThrown);
			location.reload(true);
		}
	});
}

function getAllMedia(updateCurrentPlayer = false, print = true, scrollTo = -1, deleted = false) {
	$.ajax({
		url: "scripts/getAllMedia.php",  
		type: 'GET', 
		dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (response.success) {
				setDatabaseInScript(response.data);
				if (print) {
					$("#left_content").empty();
					printMedia(updateCurrentPlayer, scrollTo, deleted);
				}
			} 
			else alert(response.message);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS @ Getting All Media: ' + errorThrown);
			location.reload(true);
		}
	});
}
function setDatabaseInScript(arr) {
	sortedDatabase = arr;
	console.log(sortedDatabase);
}


function printMedia(updateCurrentPlayer = false, scrollTo = -1, deleted = false) {
	if (typeof sortedDatabase === "undefined") {
		alert("Sorted Databse in Script Not Set!");
		return;
	}
	var html, h1, albumHTML, albumHeader, albumArtContainer, albumArt, albumArtLabel, h2, fragment;
	for(var index in sortedDatabase) {
		html = document.createElement("div");
		html.className = "album_artist_div";		// html = "<div class=\"album_artist_div\">";

		h1 = document.createElement("h1");
		h1.innerHTML = sortedDatabase[index]['name'];
		html.appendChild(h1);						// html += "<h1>"+sortedDatabase[index]['name']+"</h1>";

		for(var album in sortedDatabase[index]["albums"]) {
			albumHTML = document.createElement("div");
			albumHTML.className ="album";				// html += "<div class=\"album\">";

			albumHeader = document.createElement("div");
			albumHeader.className = "album_header";

				albumArtContainer = document.createElement("div");
				albumArtContainer.className = "album_image_container";

					albumArt = document.createElement("img");
					albumArt.className = "album_image";
					albumArt.setAttribute("src", sortedDatabase[index]["albums"][album]["art"]);
					albumArt.setAttribute("alt", "");

					albumArtLabel = document.createElement("label");
					albumArtLabel.className = "addAlbumArt_label";
					albumArtLabel.setAttribute("data-id", sortedDatabase[index]["albums"][album]["id"]);
					albumArtLabel.setAttribute("for", "addAlbumArt_input");

				albumArtContainer.appendChild(albumArt);
				albumArtContainer.appendChild(albumArtLabel);
				albumHeader.appendChild(albumArtContainer);

				h2 = document.createElement("h2");
				h2.innerHTML = album;
				albumHeader.appendChild(h2);

			albumHTML.appendChild(albumHeader);
			
			sortedDatabase[index]["albums"][album]["songs"].forEach(function(d, index) {
				fragment = document.createElement("div");
				fragment.className = "song";
				fragment.setAttribute("id", "song_"+d["id"]);
				fragment.setAttribute("data-id", d["id"]);
				fragment.setAttribute("data-medium", d["medium"]);
				if (d["medium"] == 1) {
					fragment.innerHTML =
					"<img class=\"video_icon\" src=\"assets/youtube.png\" alt=\"YouTube\">"+
					"<span class=\"video_title\">"+d["title"]+"</span>"+
					"<span class=\"video_artist\">"+d["artist"]+"</span>"+
					"<img class=\"song_options\" src=\"assets/options.png\" alt=\"Song Options\">"
				} else {
					fragment.innerHTML =
					"<span class=\"song_title\">"+d["title"]+"</span>"+
					"<span class=\"song_artist\">"+d["artist"]+"</span>"+
					"<img class=\"song_options\" src=\"assets/options.png\" alt=\"Song Options\">";
				}
				albumHTML.appendChild(fragment);
				/*
				html += "<div class=\"song\" data-id=\""+d["id"]+"\" data-medium=\""+d["medium"]+"\">";
				html += "<span class=\"song_title\">"+d["title"]+"</span>";
				html += "<span class=\"song_artist\">"+d["artist"]+"</span>";
				html += "<img class=\"song_options\" src=\"assets/options.png\" alt=\"Song Options\">";
				html += "</div>";
				*/
			});
			//html += "</div>";
			html.appendChild(albumHTML);
		}
		//html += "</div>";
		//$("#left_content").appendChild(html);
		document.getElementById("left_content").appendChild(html);
	};
	if (!deleted || scrollTo != -1) {
		var elmnt = document.getElementById("song_"+scrollTo);
		console.log(elmnt);
		$(elmnt).addClass("edited");
		document.getElementById("left_content").scrollTo({
		    'behavior': 'smooth',
		    'top': elmnt.offsetTop - (screenHeight/2) + (elmnt.offsetHeight/2)
		});
		$(document.getElementById("song_"+currentSong)).addClass("selected");
		if (updateCurrentPlayer) updateCurrent();
	}
}
function updateCurrent() {
	var data = "id="+currentSong;
	$.ajax({
		url: "scripts/getMediaInfo.php", 
		data: data, 
		type: 'POST', 
		dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (response.success) {
				var arr = response.info;
				preparePlayer(arr);
				$("#left_content").find(".song[data-id='"+arr["id"]+"']").addClass("selected");
				if (loop == 2) {
					createLoop(currentAlbum, currentSong, currentAlbumArtist, shuffle);
				}
			} 
			else alert(response.message);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS @ Opening Media: ' + errorThrown);
			location.reload(true);
		}
	});
}

function getImageArt(id) {
	var data = "id="+id;
	$.ajax({
		url: "scripts/getImageArt.php?get", data: data, type: 'POST', dataType: 'html',
		success: function(response, textStatus, jqXHR) {
			var img;
			if ( response && response != "data:;charset=utf-8;base64," ) {
				player.art.attr("src", response);
				player.background.attr("src", response);
				img = response;
			} else {
				player.art.attr("src", "media_player/assets/default_album_art.jpg");
				player.background.attr("src", "media_player/assets/default_album_art.jpg");
				img = "default";
			}
			saveMediaArt(id, img);
		},
		error: function(jqXHR, textStatus, errorThrown) {	
			alert('ERRORS: ' + textStatus);	
		}
	});
}
function showLyrics() {
	player.player_and_lyrics.toggleClass("showLyrics");
}



function saveMediaArt(id, img) {
	var data = "id="+id+"&img="+encodeURI(img);
	$.ajax({
		url: "scripts/updateMediaArt.php", 
		data: data, 
		type: 'POST', 
		dataType: 'html',
		success: function(response, textStatus, jqXHR) {
			console.log(response);
		},
		error: function(jqXHR, textStatus, errorThrown) {	
			alert('ERRORS: ' + errorThrown);	
		}
	});
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
		var ind = arr.indexOf(currentSong);
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

function loadQueue() {
	queue = [];
	if (loop == 2) createLoop(currentAlbum, currentSong, currentAlbumArtist, shuffle);
	else queue.push(currentSong);
	console.log(queue);
}


/*  ------  */
/*  Audio Functions  */
/*  ------  */
function preparePlayer(arr) {
	currentSong = arr["id"];
	currentAlbum = arr["album_id"];
	current_time_index = -1;
	current_time = "-3599999";
	currentAlbumArtist = arr["album_artist_id"];
	player.background.attr("src", arr["art"]+"#"+ new Date().getTime());
	if (arr["medium"] == 1) {
		abortAudio();
		player.music.addClass("closed");
		player.video.removeClass("closed");
		player.embed.attr("src", arr["url"]);
	} else {
		player.embed.attr("src", "");
		player.music.removeClass("closed");
		player.video.addClass("closed");
		if (arr["art"] == null) {
			getImageArt(arr["id"]);
		} else {
			player.art.attr("src", arr["art"]+"#"+ new Date().getTime());
			player.background.attr("src", arr["art"]+"#"+ new Date().getTime());
		}
		player.title.removeClass("smallerTitle");
		player.title.html(arr["title"]);
		if (player.title.height() > 100) {
			player.title.addClass("smallerTitle");
		}
		player.artist.html(arr["artist"]);
		if (player.canPlay == true) {
			player.lyrics.html(arr["lyrics"]);
			lyricsHeight = player.lyrics.height();
		} else {
			player.lyrics.html("<span class='lyric_segment noText'></span><span class='lyric_segment'>Loading Audio...</span><span class='lyric_segment noText'></span>");
		}
		player.start_padding = arr["start_padding"];
		player.end_padding = arr["end_padding"];
		if (arr["dynamic_lyrics"] == 0) {
			dynamic_lyrics_toggle = false;
			dynamic_lyrics_starting_times = null;
			//dynamic_lyrics_ending_times = null;
		} else {
			dynamic_lyrics_toggle = true;
			dynamic_lyrics_starting_times = arr["lyrics_starting_times"];
			//dynamic_lyrics_ending_times = arr["lyrics_ending_times"];
		}
	}
}
function resetPlayer() {
	console.log("Resetting Player");
	abortAudio();
	player.embed.attr("src", "");
	player.video.addClass("closed");
	player.music.removeClass("closed");
	player.art.attr("src", "assets/default_album_art.jpg");
	player.background.attr("src", "assets/default_album_art.jpg");
	player.title.removeClass("smallerTitle");
	player.title.html("Choose a Song");
	player.artist.html("Artist");
	player.lyrics.html("<span class='lyric_segment noText'></span><span class='lyric_segment'><i>Lyrics go Here</i></span><span class='lyric_segment'></span>");
	player.duration.text("--:--");
	player.curTime.text("--:--");
	player.time_slider.val(0);
	player.play.removeClass("hiddenControl");
	player.pause.addClass("hiddenControl");
	currentSong = -1;
	currentAlbumArtist = -1;
	currentAlbum = -1;
	queue = [];
	dynamic_lyrics_toggle = false;
	dynamic_lyrics_starting_times = null;
	//dynamic_lyrics_ending_times = null;
	current_time_index = -1;
	current_time = "-3599999";
	player.start_padding = 0;
	player.end_padding = 3599999;
	player.canPlay = false;
	player.embed.attr("src", "");
}



function prepareAudio(arr) {
	player.audio.attr("src", arr["url"]);
	player.duration.html(arr["duration"]);
	loadAudio(arr["id"], arr["lyrics"]);
	if (milliseconds(player.audio.prop("currentTime")) < player.start_padding ) player.audio.prop("currentTime", revertFromMilliseconds(player.start_padding));
	player.time_slider.attr("max", player.end_padding);
    //player.time_slider.val(player.audio.prop("currentTime"));
    player.time_slider.val(player.start_padding);
    startAudio();
}

function abortAudio(id) {
	pauseAudio();
	player.audio.bind('abort');
	player.audio.trigger('abort');
	paused = true;
}

function loadAudio(id, lyrics){
	// Forces audio to load into the player, as well as make the time slider for the song appear - used usually prior to starting a song
	player.audio.bind("load");
	player.audio.trigger('load');
	player.audio[0].oncanplay = function() {
    	if (!player.canPlay) {
    		player.lyrics.html("");
			player.lyrics.html(lyrics);
			console.log(lyrics)
	    	lyricsHeight = player.lyrics.height();
			player.canPlay = true;
			
    	}
    }
}

function startAudio(){
	// Starts the audio, also causes the pause button to appear and the start button to disappear
	player.audio.trigger('play');
	if (paused) {
		player.play.addClass("hiddenControl");
		player.pause.removeClass("hiddenControl");
		paused = false;
	}
}

function pauseAudio(){
	// Opposite of startAudio()
	player.audio.trigger('pause');
	player.pause.addClass("hiddenControl");
	player.play.removeClass("hiddenControl");
	paused = true;
}

function forwardAudio(){
	// Causes the song to advance by 5 seconds, also adjusts the time slider appropriately
	pauseAudio();
	player.audio.prop("currentTime", player.audio.prop("currentTime")+5);
	player.time_slider.val( milliseconds(player.audio.prop("currentTime")) );
	current_time_index = -1;
	current_time = "-3599999";
	if (milliseconds(player.audio.prop("currentTime")) > player.end_padding) nextAudio();
	else startAudio();
}

function backwardAudio(){
	// Same as forwardAudio(), except moves back 5 seconds
	pauseAudio();
	player.audio.prop("currentTime",player.audio.prop("currentTime")-5);
	player.time_slider.val( milliseconds(player.audio.prop("currentTime")) );
	current_time_index = -1;
	current_time = "-3599999";
	if (milliseconds(player.audio.prop("currentTime")) < player.start_padding) previousAudio();
	else startAudio();
}

function nextAudio() {
	pauseAudio();
	var savedId = queue[0];
	current_time_index = -1;
	current_time = "-3599999";
	player.canPlay = false
	$("#left_content").find(".selected").removeClass("selected");
	queue.shift();
	if (loop == 0) {
		player.pause.addClass("hiddenControl");
		player.play.removeClass("hiddenControl");
		paused = true;
	} else if (loop == 1) {
		queue.push(savedId);
		player.audio.prop("currentTime", revertFromMilliseconds(player.start_padding));
		player.canPlay = true;
		startAudio();
		$("#left_content").find(".song[data-id='"+queue[0]+"']").addClass("selected");
	} else {
		player.start_padding = 0;
		player.end_padding = 3599999;
		if (queue.length == 0) {
			openMedia(savedId);
		} else {
			openMedia(queue[0]);
		}
		queue.push(savedId);
		$("#left_content").find(".song[data-id='"+queue[0]+"']").addClass("selected");
	}
}

function previousAudio() {
	pauseAudio();
	var savedId = queue[0];
	current_time_index = -1;
	current_time = "-3599999";
	player.canPlay = false;
	$("#left_content").find(".selected").removeClass("selected");
	if (loop == 0) {
		queue.shift();
		player.pause.addClass("hiddenControl");
		player.play.removeClass("hiddenControl");
		paused = true;
	} else if (loop == 1) {
		queue.shift();
		queue.push(savedId);
		timeAdjust(player.start_padding);
		player.canPlay = true;
		startAudio();
		$("#left_content").find(".song[data-id='"+queue[0]+"']").addClass("selected");
	} else {
		savedId = queue[queue.length-1];
		queue.splice(queue.length-1, 1);
		player.start_padding = 0;
		player.end_padding = 3599999;
		if (queue.length == 0) {
			openMedia(savedId);
		} else {
			openMedia(queue[0]);
		}
		openMedia(savedId);
		queue.unshift(savedId);
		$("#left_content").find(".song[data-id='"+queue[0]+"']").addClass("selected");
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
    player.audio.prop("currentTime", revertFromMilliseconds(time));
    current_time_index = -1;
    current_time = "-3599999";
	startAudio();
}
function volumeAdjust(volume) {
	player.volume.val(volume);
	// Based on the position of the volume slider, the volume of the player and the volume icon will change
	if (volume == 0) 		player.volume_image.attr("src", "assets/mute.png");
	else if (volume < 33) 	player.volume_image.attr("src", "assets/volume_1.png");
	else if (volume < 66) 	player.volume_image.attr("src", "assets/volume_2.png");
	else 					player.volume_image.attr("src", "assets/volume_3.png");
	var vol = volume/100;
    player.audio.prop("volume",vol);
}
function autoscrollToggle() {
	if ( player.autoscroll.hasClass("deactivated") ){
		player.autoscroll.removeClass("deactivated");
		scrollToLyrics = true;
	} else {
		player.autoscroll.addClass("deactivated");
		scrollToLyrics = false;
	}
}



$(document).ready(function() {
	player = {
		container: $("#media_container"),
		music: $("#player_container"),
		video: $("#video_container"),
		embed: $("#video_embed"),
		audio: $("#audio"),
		player_and_lyrics: $("#player_art_and_lyrics"),
		art: $("#player_art"),
		background: $("#player_background"),
		title: $("#player_title"),
		artist: $("#player_artist"),
		lyrics: $("#player_lyrics"),
		duration: $("#duration"),
		curTime: $("#curTime"),
		time_slider: $("#time_slider"),
		volume: $("#volume"),
		volume_image: $("#volume_image"),
		play: $("#play"),
		pause: $("#pause"),
		previous: $("#previous"),
		next: $("#next"),
		loop: $("#repeat"),
		shuffle: $("#shuffle"),
		edit: $("#options"),
		autoscroll: $("#player_lyrics_autoscroll"),
		start_padding: 0, 
		end_padding: 3599999,
		canPlay: false
	};

	var loopStages = ["assets/repeat_0.png", "assets/repeat_1.png", "assets/repeat_all.png"];
	var shuffleStages = ["assets/shuffle_0.png", "assets/shuffle_1.png"];

	getAllMedia(false, false, -1);
	volumeAdjust(player.volume.val());

	$(document).on("click", ".song", function() {
		$("#left_content").find(".selected").removeClass("selected");
		$(this).addClass("selected");
		var songId = $(this).attr("data-id");
		openMedia(songId, true);
	});

	player.time_slider.on("input", function() { 
		timeAdjust( $(this).val() );
	});	// Moving the slider adjusts the audio's time
	player.volume.on( "input", function() { volumeAdjust($(this).val()); 	});
	player.audio.on("ended", nextAudio);
	player.previous.on("click", previousAudio);
	player.next.on("click", nextAudio);
	player.autoscroll.on("click", autoscrollToggle);

	player.loop.on("click", function() {
		loop++;
		if (loop == 3) loop = 0;
		$(this).attr("src", loopStages[loop]);
		loadQueue();
	});

	player.shuffle.on("click", function(){
		shuffle ++;
		if (shuffle == 2) shuffle = 0;
		$(this).attr("src", shuffleStages[shuffle]);
		loadQueue();
	});
});



