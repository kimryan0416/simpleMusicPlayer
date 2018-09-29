var database = [], queue = [];

/* Youtube Setup - If no online connection detected, then all youtube embedded entries are not available */
var onlineConnection = false;
function onYouTubeIframeAPIReady() {
	console.log("YouTube API Ready");
	onlineConnection = true;
}

/*
// currentSong = current song ID
// currentAlbum = current Album ID
// currentAlbumArtist = current Album Artist ID
// currentMediaType = audio(0), video(1), or YouTube Embed(2) - default = -1
*/
var currentSong = -1, currentAlbum = -1, currentAlbumArtist = -1, currentMediaType = -1;

/*
// paused = if the current media is paused - applies only to audio and video (not YouTube Embed)
// loop = loop media boolean (1 = true, 0 = false)
// shuffle = shuffle media boolean (1 = true, 0 = false)
// dynamic_lyrics_toggle = should lyrics dynamically follow media? - applies only to audio and video (not YouTube Embed)
*/
var paused = true, loop = 1, shuffle = 0, dynamic_lyrics_toggle = false;

/*
// globalPlayer = reference to either audio player or video player - UNUSED RIGHT NOW
// audio_player = object containing all 
*/
var globalPlayer, audio_player, video_player, editForm, editAlbumArtForm, embedForm, iconEdit, iconEditSet = 0, left_close = false;



var dynamic_lyrics_starting_times;
var current_time = "-3599999", current_time_index = -1, current_medium = -1;
var screenHeight = window.innerHeight;
var lyricsHeight, scrollToLyrics = true, lockLyricScroll = false;
/*var source;*/
var search_element, search_options_element, search_text, search_option, searching_boolean = true, search_matches = [];
var loopStagesDefault = ["assets/repeat_0.png", "assets/repeat_1.png", "assets/repeat_all.png"];
var loopStagesWhite = ["assets/repeat_0_white.png", "assets/repeat_1_white.png", "assets/repeat_all_white.png"];
var shuffleStages = ["assets/shuffle_0_white.png", "assets/shuffle_1_white.png"];
var edit_form_options = ["details", "lyrics", "art"];

function readableDuration(milliseconds) {
    /* Get the duration or current time of a song in minutes:seconds instead of just seconds	*/
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

/* assuming time is in the format of seconds.milliseconds */
function milliseconds(seconds) {return Math.floor(seconds*1000); }
function revertFromMilliseconds(millisec) {	return millisec / 1000;	}

function onTimeUpdate(track) {
	var curMillisec = milliseconds(track.currentTime);
	var curTime = readableDuration(curMillisec);
	if (curMillisec > audio_player.end_padding) {
		nextAudio();
		return;
	}
	audio_player.curTime.text(curTime);
	audio_player.time_slider.val(curMillisec);

	if (dynamic_lyrics_toggle && scrollToLyrics) {
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

function onTimeUpdateVideo(track) {
	var curMillisec = milliseconds(track.currentTime);
	var curTime = readableDuration(curMillisec);
	if (curMillisec > video_player.end_padding) {
		nextAudio();
		return;
	}
	video_player.timeDisplay.text(curTime);
	video_player.time_slider.val((track.currentTime / track.duration) * 100);

	if (dynamic_lyrics_toggle && scrollToLyrics) {
		if (current_time_index == -1) {
			video_player.lyrics.find(".selected").removeClass("selected");
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
			if ( (curMillisec > dynamic_lyrics_starting_times[current_time_index+1]) || (curMillisec < dynamic_lyrics_starting_times[current_time_index]) ) {
				video_player.lyrics.find(".selected").removeClass("selected");
				current_time_index = -1;
				current_time = "-3599999";
			}
		}

		if ( !$(".lyric_segment_"+current_time).hasClass("selected") ) $("#video_lyrics_inner_container .lyric_segment_"+current_time).addClass("selected");
	}
}

function reloadMedia() {
	var data = "type=get";
	$.ajax({
		url: "scripts/testScript.php",
		data: data,
		type: "post",
		dataType: "json"
	}).done(function(response) {
		if (response.success) {
			for (var i = 0; i < response.files.length; i++) {	updatePart(i);	}
			if (reloadPage) $(document).ajaxStop(function() { location.reload(true); });
		} else {
			alert("Something went wrong");
			$(document).ajaxStop(function() { location.reload(true); });
		}
	}).fail(function(jqXHR, textStatus, errorThrown) {
		alert('ERRORS @ Stage 1: ' + errorThrown);
		location.reload(true);
	});
}

function updatePart(song_id) {
	var data = "id="+song_id;
	$.ajax({
		url: "scripts/updateMedia.php", 
		data: data, 
		type: 'POST', 
		dataType: 'json'
	}).done(function(response) {
		if (!response.success) {
			alert(response.message);
			$(document).ajaxStop(function() { location.reload(true); });
		}
	}).fail(function(jqXHR, textStatus, errorThrown) {
		alert('ERRORS @ Updating Songs: ' + errorThrown);
		location.reload(true);
	});
}

function openMedia(id, newQueue = false) {
	console.log(id);
	var data = database[id];
	preparePlayer(data);
	if (data.medium == 0) prepareAudio(data);
	else if (data.medium == 2) prepareLocalVideo(data);
	if (newQueue) loadQueue();
}

function getAllMedia(updateCurrentPlayer = false, print = true, scrollTo = -1) {
	console.log("Updating Current Player: " + updateCurrentPlayer + "\nPrint Media into Left Content: " + print + "\nScroll to a particular song: " + scrollTo);
	$.ajax({
		url: "scripts/getAllMedia.php",  
		type: 'GET', 
		dataType: 'json'
	}).done(function(response) {
		if (response.success) {
			setDatabaseInScript(response["raw_data"]);
			if (print) {
				$("#left_content").empty().hide();
				printMedia(response["sorted_data"], updateCurrentPlayer, scrollTo);
			}
			if (!onlineConnection) $(".song[data-medium=1]").remove();
		} 
		else alert(response.message);
	}).fail(function(jqXHR, textStatus, errorThrown) {
		alert('ERRORS @ Getting All Media: ' + errorThrown);
		location.reload(true);
	}).always(function() {	
		$("#left_content").show();
	});
}
function setDatabaseInScript(raw) {
	database = raw;
	console.log(database);
}


function printMedia(sortedDatabase, updateCurrentPlayer = false, scrollTo = -1) {
	var html, h1, albumHTML, albumHeader, albumArtContainer, albumArt, albumArtLabel, h2, fragment;
	for(var index in sortedDatabase) {
			html = document.createElement("div");
			html.className = "album_artist_div";		

			h1 = document.createElement("h1");
			h1.className = "album_artist_name";
			h1.innerHTML = sortedDatabase[index]['name'];
			html.appendChild(h1);

			for(var album in sortedDatabase[index]["albums"]) {
				albumHTML = document.createElement("div");
				albumHTML.className ="album";

				albumHeader = document.createElement("div");
				albumHeader.className = "album_header";

					albumArtContainer = document.createElement("div");
					albumArtContainer.className = "album_image_container";

						albumArt = document.createElement("img");
						albumArt.className = "album_image";
						albumArt.setAttribute("src", sortedDatabase[index]["albums"][album]["art"]+"#"+ new Date().getTime());
						albumArt.setAttribute("alt", "");

						albumArtLabel = document.createElement("div");
						albumArtLabel.className = "addAlbumArt_button";
						albumArtLabel.setAttribute("data-id", sortedDatabase[index]["albums"][album]["id"]);

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
					fragment.setAttribute("id", d["id"]);
					fragment.setAttribute("data-id", d["id"]);
					fragment.setAttribute("data-medium", d["medium"]);
					if (d["medium"] == 1) fragment.innerHTML = "<img class=\"video_icon\" src=\"assets/youtube.png\" alt=\"YouTube\"><span class=\"video_title\">"+d["title"]+"</span><span class=\"video_artist\">"+d["artist"]+"</span><img class=\"song_options\" src=\"assets/options.png\" alt=\"Song Options\">";
					else fragment.innerHTML = "<span class=\"song_title\">"+d["title"]+"</span><span class=\"song_artist\">"+d["artist"]+"</span><img class=\"song_options\" src=\"assets/options.png\" alt=\"Song Options\">";
					albumHTML.appendChild(fragment);
				});
				html.appendChild(albumHTML);
			}
			document.getElementById("left_content").appendChild(html);
	};
	if ( scrollTo != -1 ) {
		var elmnt = document.getElementById(scrollTo);
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
		dataType: 'json'
	}).done(function(response) {
		if (response.success) {
			var arr = response.info;
			if (current_medium == 2) {
				video_player.start_padding = arr['start_padding'];
				video_player.end_padding = arr['end_padding'];
				video_player.lyrics.empty();
				if (response.info.dynamic_lyrics_toggle == 1) {
					video_player.lyrics.html(arr["lyrics"]);
					dynamic_lyrics_toggle = true;
					dynamic_lyrics_starting_times = arr["dynamic_lyrics_starting_times"];
					lockLyricScroll = false;
					if (video_player.autoscroll.hasClass("locked")) video_player.autoscroll.removeClass("locked");
					if (scrollToLyrics) {
						if (!video_player.autoscroll.hasClass("active")) video_player.autoscroll.addClass("active");
					} else {
						if (video_player.autoscroll.hasClass("active")) video_player.autoscroll.removeClass("active");
					}
				}
			} else if (current_medium == 1) {
				video_player.lyrics.empty();
				if (response.info.dynamic_lyrics_toggle == 1) {
					video_player.lyrics.html(arr["lyrics"]);
					dynamic_lyrics_toggle = true;
					dynamic_lyrics_starting_times = arr["dynamic_lyrics_starting_times"];
					lockLyricScroll = false;
					if (video_player.autoscroll.hasClass("locked")) video_player.autoscroll.removeClass("locked");
					if (scrollToLyrics) {
						if (!video_player.autoscroll.hasClass("active")) video_player.autoscroll.addClass("active");
					} else {
						if (video_player.autoscroll.hasClass("active")) video_player.autoscroll.removeClass("active");
					}
				}
			} else {
				preparePlayer(arr);
			}
			$("#left_content").find(".song[data-id='"+arr["id"]+"']").addClass("selected");
			if (loop == 2) createLoop(currentAlbum, currentSong, currentAlbumArtist, shuffle);
		} 
		else alert(response.message);
	}).fail(function(jqXHR, textStatus, errorThrown) {
		alert('ERRORS @ Opening Media: ' + errorThrown);
		location.reload(true);
	});
}

function getImageArt(id) {
	var data = "id="+id;
	$.ajax({
		url: "scripts/getImageArt.php?get", 
		data: data, 
		type: 'POST', 
		dataType: 'html'
	}).done(function(response) {
		var img;
		if ( response && response != "data:;charset=utf-8;base64," ) {
			audio_player.art.attr("src", response);
			audio_player.background.attr("src", response);
			img = response;
		} else {
			audio_player.art.attr("src", "media_player/assets/default_album_art.jpg");
			audio_player.background.attr("src", "media_player/assets/default_album_art.jpg");
			img = "default";
		}
		saveMediaArt(id, img);
	}).fail(function(jqXHR, textStatus, errorThrown) {	
		alert('ERRORS: ' + textStatus);
	});
}
function showLyrics() {	audio_player.player_and_lyrics.toggleClass("showLyrics");	}


function saveMediaArt(id, img) {
	var data = "id="+id+"&img="+encodeURI(img);
	$.ajax({
		url: "scripts/updateMediaArt.php", 
		data: data, 
		type: 'POST', 
		dataType: 'html'
	}).done(function(response) {
		if (!response.success) alert(response.message);	
	}).fail(function(jqXHR, textStatus, errorThrown) {	
		alert('ERRORS @ Saving Media Art: ' + errorThrown);
	});
}

function createLoop(albumId, songId, albumArtistId, shuffle) {
	var data = "albumId="+albumId+"&songId="+songId+"&albumArtistId="+albumArtistId+"&shuffle="+shuffle;
	$.ajax({
		url: "scripts/createLoop.php", 
		data: data, 
		type: 'POST', 
		dataType: 'json'
	}).done(function(response) {
		if (response.success) addToLoop(response.loop);
		else alert("Ajax returned error: " + response.message);
	}).fail(function(jqXHR, textStatus, errorThrown) {	
		alert('ERRORS @ CREATING LOOP: ' + errorThrown);
	});
}
function addToLoop(arr) {
	if (arr.length > 0) {
		var ind = arr.indexOf(parseInt(currentSong));
		for (var i = ind; i < arr.length; i++) {
			queue.push(arr[i]);
		}
		if (ind != 0) {
			for (var k = 0; k < ind; k++) {
				queue.push(arr[k]);
			}
		}
	}
	console.log(queue);
}

function loadQueue() {
	queue = [];
	if (loop == 2) {
		createLoop(currentAlbum, currentSong, currentAlbumArtist, shuffle);
	}
	else queue.push(currentSong);
	console.log(queue);
}


/*  ------  */
/*  Audio Functions  */
/*  ------  */

function preparePlayer(arr) {
	console.log(arr);
	currentSong = arr["id"];
	console.log(currentSong);
	currentAlbum = arr["album_id"];
	current_time_index = -1;
	current_time = "-3599999";
	current_medium = parseInt(arr["medium"]);
	abortVideo();
	abortAudio();
	abortLocalVideo();
	currentAlbumArtist = arr["album_artist_id"];
	audio_player.background.attr("src", arr["art"]+"#"+ new Date().getTime());
	if (current_medium == 1) {
		audio_player.music.addClass("closed");
		video_player.container.removeClass("closed");
		video_player.title.html(arr["title"]);
		video_player.artist.html(arr["artist"]);
		if (arr["dynamic_lyrics_toggle"] == 0) {
			video_player.lyrics.empty();
			dynamic_lyrics_toggle = false;
			dynamic_lyrics_starting_times = null;
			lockLyricScroll = true;
			if (video_player.autoscroll.hasClass("active")) video_player.autoscroll.removeClass("active");
			if (!video_player.autoscroll.hasClass("locked")) video_player.autoscroll.addClass("locked");
		} else {
			video_player.lyrics.html(arr["lyrics"]);
			dynamic_lyrics_toggle = true;
			dynamic_lyrics_starting_times = arr["dynamic_lyrics_starting_times"];
			lockLyricScroll = false;
			if (video_player.autoscroll.hasClass("locked")) video_player.autoscroll.removeClass("locked");
			if (scrollToLyrics) {
				if (!video_player.autoscroll.hasClass("active")) video_player.autoscroll.addClass("active");
			} else {
				if (video_player.autoscroll.hasClass("active")) video_player.autoscroll.removeClass("active");
			}
		}
		var setLoopForVideo = (loop == 1) ? 1 : 0;
		video_player.player = new YT.Player('video_embed', {
			width: 600,
			height: 400,
			videoId: arr['url'],
			playerVars: {
				controls:0,
				rel:0
			},
			events: {
				onReady: initialize_video,
				onStateChange: function(e) {
					if (e.data === YT.PlayerState.ENDED && loop == 1) video_player.player.playVideo(); 
				}
			}
		});
	} else if (current_medium == 2) {
		audio_player.music.addClass("closed");
		video_player.container.removeClass("closed");
		video_player.title.html(arr["title"]);
		video_player.artist.html(arr["artist"]);
		video_player.start_padding = arr["start_padding"];
		video_player.end_padding = arr["end_padding"];
		if (arr["dynamic_lyrics_toggle"] == 0) {
			video_player.lyrics.empty();
			dynamic_lyrics_toggle = false;
			dynamic_lyrics_starting_times = null;
			lockLyricScroll = true;
			if (video_player.autoscroll.hasClass("active")) video_player.autoscroll.removeClass("active");
			if (!video_player.autoscroll.hasClass("locked")) video_player.autoscroll.addClass("locked");
		} else {
			video_player.lyrics.html(arr["lyrics"]);
			dynamic_lyrics_toggle = true;
			dynamic_lyrics_starting_times = arr["dynamic_lyrics_starting_times"];
			lockLyricScroll = false;
			if (video_player.autoscroll.hasClass("locked")) video_player.autoscroll.removeClass("locked");
			if (scrollToLyrics) {
				if (!video_player.autoscroll.hasClass("active")) video_player.autoscroll.addClass("active");
			} else {
				if (video_player.autoscroll.hasClass("active")) video_player.autoscroll.removeClass("active");
			}
		}
	} else {
		video_player.container.addClass("closed");
		audio_player.music.removeClass("closed");
		if (arr["art"] == null) getImageArt(arr["id"]);
		else {
			audio_player.art.attr("src", arr["art"]+"#"+ new Date().getTime());
			audio_player.background.attr("src", arr["art"]+"#"+ new Date().getTime());
		}
		audio_player.title.removeClass("smallerTitle");
		audio_player.title.html(arr["title"]);
		if (audio_player.title.height() > 100) player.title.addClass("smallerTitle");
		audio_player.artist.html(arr["artist"]);
		if (audio_player.canPlay == true) {
			audio_player.lyrics.html(arr["lyrics"]);
			lyricsHeight = audio_player.lyrics.height();
		} 
		else audio_player.lyrics.html("<span class='lyric_segment noText'></span><span class='lyric_segment'>Loading Audio...</span><span class='lyric_segment noText'></span>");
		audio_player.start_padding = arr["start_padding"];
		audio_player.end_padding = arr["end_padding"];
		if (arr["dynamic_lyrics_toggle"] == 0) {
			dynamic_lyrics_toggle = false;
			dynamic_lyrics_starting_times = null;
			lockLyricScroll = true;
			if (audio_player.autoscroll.hasClass("active")) audio_player.autoscroll.removeClass("active");
			if (!audio_player.autoscroll.hasClass("locked")) audio_player.autoscroll.addClass("locked");
		} else {
			dynamic_lyrics_toggle = true;
			dynamic_lyrics_starting_times = arr["dynamic_lyrics_starting_times"];
			lockLyricScroll = false;
			if (audio_player.autoscroll.hasClass("locked")) audio_player.autoscroll.removeClass("locked");
			if (scrollToLyrics) {
				if (!audio_player.autoscroll.hasClass("active")) audio_player.autoscroll.addClass("active");
			} else {
				if (audio_player.autoscroll.hasClass("active")) audio_player.autoscroll.removeClass("active");
			}
		}
	}
}
function resetPlayerAfterEdit() {
	/*
	abortAudio();
	abortVideo();
	abortLocalVideo();
	*/
	audio_player.music.removeClass("closed");
	audio_player.art.attr("src", "assets/default_album_art.jpg");
	audio_player.background.attr("src", "assets/default_album_art.jpg");
	audio_player.title.removeClass("smallerTitle");
	audio_player.title.html("Choose a Song");
	audio_player.artist.html("Artist");
	audio_player.lyrics.html("<span class='lyric_segment noText'></span><span class='lyric_segment'><i>Lyrics go Here</i></span><span class='lyric_segment'></span>");
	audio_player.duration.text("--:--");
	audio_player.curTime.text("--:--");
	audio_player.time_slider.val(0);
	audio_player.play.removeClass("hiddenControl");
	audio_player.pause.addClass("hiddenControl");
	currentSong = -1;
	currentAlbumArtist = -1;
	currentAlbum = -1;
	queue = [];
	dynamic_lyrics_toggle = false;
	dynamic_lyrics_starting_times = null;
	audio_player.canPlay = false;
	current_time_index = -1;
	current_time = "-3599999";
	current_medium = -1;
	audio_player.start_padding = 0;
	audio_player.end_padding = 3599999;
	video_player.start_padding = 0;
	video_player.end_padding = 3599999;
	video_player.play_button.removeClass("hiddenControl");
	video_player.pause_button.addClass("hiddenControl");
	video_player.duration.text("--:--");
	video_player.timeDisplay.text("--:--");
	video_player.time_slider.val(0);
	video_player.container.addClass("closed");

}

function prepareAudio(arr) {
	$(audio_player.audio).attr("src", arr["url"]);
	audio_player.duration.html(arr["duration"]);
	loadAudio(arr["id"], arr["url"], arr["lyrics"]);
	if (milliseconds($(audio_player.audio).prop("currentTime")) < audio_player.start_padding ) $(audio_player.audio).prop("currentTime", revertFromMilliseconds(audio_player.start_padding));
	audio_player.time_slider.attr("max", audio_player.end_padding);
    audio_player.time_slider.val(milliseconds($(audio_player.audio).prop("currentTime")));
    audio_player.time_slider.val(audio_player.start_padding);
}

function prepareLocalVideo(arr) {
	$(video_player.local).attr("src", arr["url"]);
	video_player.duration.html(arr["duration"]);
	loadLocalVideo(arr["id"], arr["url"], arr["lyrics"]);
	if (milliseconds($(video_player.local).prop("currentTime")) < video_player.start_padding ) $(video_player.local).prop("currentTime", revertFromMilliseconds(video_player.start_padding));
    video_player.time_slider.val(video_player.start_padding);
}

function abortAudio(id) {
	pauseAudio();
	$(audio_player.audio).bind('abort');
	$(audio_player.audio).trigger('abort');
	$(audio_player.audio).attr("src", "");
	paused = true;
}
function abortLocalVideo(id) {
	pauseLocalVideo();
	$(video_player.local).bind('abort');
	$(video_player.local).trigger('abort');
	$(video_player.local).attr('src','');
	paused = true;
}

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

function loadAudio(id, url, lyrics){
	/* Forces audio to load into the player, as well as make the time slider for the song appear - used usually prior to starting a song */
	$(audio_player.audio).bind("load");
	$(audio_player.audio).trigger('load');
	audio_player.audio.oncanplay = function() {
    	if (!audio_player.canPlay) {
    		audio_player.lyrics.html("");
			audio_player.lyrics.html(lyrics);
	    	lyricsHeight = audio_player.lyrics.height();
			audio_player.canPlay = true;
    	}
    }
}

function loadLocalVideo(id, url, lyrics) {
	$(video_player.local).bind('load');
	$(video_player.local).trigger('load');
	video_player.local.oncanplay = function() {
		if (!video_player.canPlay) {
			video_player.lyrics.html('');
			video_player.lyrics.html(lyrics);
			video_player.canPlay = true;
		}
	}
}

function trackCurrentTime() {	console.log(this.currentTime);	}

function setSource(buffer) {
	source = context.createBufferSource(); /* creates a sound source */
	source.buffer = buffer;                /* tell the source which sound to play */
	source.connect(context.destination);   /* connect the source to the context's destination (the speakers) */
}

function startAudio(time) {
	/* Starts the audio, also causes the pause button to appear and the start button to disappear */
	$(audio_player.audio).trigger('play');
	/* source.start(time);   */
	if (paused) {
		audio_player.play.addClass("hiddenControl");
		audio_player.pause.removeClass("hiddenControl");
		paused = false;
	}
}

function startLocalVideo(time) {
	$(video_player.local).trigger('play');
	if (paused) {
		video_player.play_button.addClass("hiddenControl");
		video_player.pause_button.removeClass("hiddenControl");
		paused = false;
	}
}

function pauseAudio(){
	/*
	Opposite of startAudio()
	//var now = source.currentTime;
	//source.stop(now);
	*/
	$(audio_player.audio).trigger('pause');
	audio_player.pause.addClass("hiddenControl");
	audio_player.play.removeClass("hiddenControl");
	paused = true;
}

function pauseLocalVideo() {
	$(video_player.local).trigger('pause');
	if (!paused) {
		video_player.pause_button.addClass("hiddenControl");
		video_player.play_button.removeClass("hiddenControl");
		paused = true;
	}
}

function forwardAudio(){
	/* Causes the song to advance by 5 seconds, also adjusts the time slider appropriately */
	pauseAudio();
	$(audio_player.audio).prop("currentTime", $(audio_player.audio).prop("currentTime")+5);
	audio_player.time_slider.val( milliseconds($(audio_player.audio).prop("currentTime")) );
	current_time_index = -1;
	current_time = "-3599999";
	if (milliseconds($(audio_player.audio).prop("currentTime")) > audio_player.end_padding) nextAudio();
	else startAudio();
}

function forwardLocalVideo() {
	pauseLocalVideo();
	$(video_player.local).prop('currentTime', $(video_player.local).prop('currentTime')+5);
	video_player.time_slider.val( ($(video_player.local).prop('currentTime') / $(video_player.local).prop('duration')) * 100 );
	current_time_index = -1;
	current_time = "-3599999";
	if ( $(video_player.local).prop('currentTime') > video_player.end_padding ) nextAudio();
	else startLocalVideo();
}

function backwardAudio(){
	/* Same as forwardAudio(), except moves back 5 seconds */
	pauseAudio();
	$(audio_player.audio).prop("currentTime",$(audio_player.audio).prop("currentTime")-5);
	audio_player.time_slider.val( milliseconds($(audio_player.audio).prop("currentTime")) );
	current_time_index = -1;
	current_time = "-3599999";
	if (milliseconds($(audio_player.audio).prop("currentTime")) < audio_player.start_padding) previousAudio();
	else startAudio();
}

function backwardLocalVideo() {
	pauseLocalVideo();
	$(video_player.local).prop('currentTime', $(video_player.local).prop('currentTime')-5);
	video_player.time_slider.val( ( $(video_player.local).prop('currentTime') / $(video_player.local).prop('duration')) * 100 );
	current_time_index = -1;
	current_time = "-3599999";
	if ( $(video_player.local).prop('currentTime') < video_player.start_padding ) previousAudio();
	else startLocalVideo();
}

function nextAudio() {
	if (current_medium == 0) {
		pauseAudio();
		audio_player.canPlay = false;
	} else if (current_medium == 2) {
		pauseLocalVideo();
		video_player.canPlay = false;
	}
	var savedId = queue[0];
	current_time_index = -1;
	current_time = "-3599999";
	$("#left_content").find(".selected").removeClass("selected");
	queue.shift();
	if (loop == 0) {
		if (current_medium == 1) {
			video_player.pause_button.addClass("hiddenControl");
			video_player.play_button.removeClass("hiddenControl");
		} else if (current_medium == 2) {
			video_player.pause_button.addClass("hiddenControl");
			video_player.play_button.removeClass("hiddenControl");
			paused = true;
		} else {
			audio_player.pause.addClass("hiddenControl");
			audio_player.play.removeClass("hiddenControl");
			paused = true;
		}
	} else if (loop == 1) {
		queue.push(savedId);
		if (current_medium == 1) {
			video_player.player.seekTo(0);
		} else if (current_medium == 2) {
			$(video_player.local).prop('currentTime', revertFromMilliseconds(video_player.start_padding));
			video_player.canPlay = true;
			startLocalVideo();
		} else {
			$(audio_player.audio).prop("currentTime", revertFromMilliseconds(audio_player.start_padding));
			audio_player.canPlay = true;
			startAudio();
		}
		$("#left_content").find(".song[data-id='"+queue[0]+"']").addClass("selected");
	} else {
		if (queue.length == 0) openMedia(savedId);
		else openMedia(queue[0]);
		if (current_medium == 0) {
			audio_player.start_padding = 0;
			audio_player.end_padding = 3599999;
			startAudio();
		} else if (current_medium == 2) {
			video_player.start_padding = 0;
			video_player.end_padding = 3599999;
			startLocalVideo();
		}
		queue.push(savedId);
		$("#left_content").find(".song[data-id='"+queue[0]+"']").addClass("selected");
	}
}

function previousAudio() {
	if (current_medium == 0) {
		pauseAudio();
		audio_player.canPlay = false;
	} else if (current_medium == 2) {
		pauseLocalVideo();
		video_player.canPlay = false;
	}
	var savedId = queue[0];
	current_time_index = -1;
	current_time = "-3599999";
	$("#left_content").find(".selected").removeClass("selected");
	console.log(loop);
	if (loop == 0) {
		queue.shift();
		if (current_medium == 1) {
			video_player.pause_button.addClass("hiddenControl");
			video_player.play_button.removeClass("hiddenControl");
		} else if (current_medium == 2) {
			video_player.pause_button.addClass("hiddenControl");
			video_player.play_button.removeClass("hiddenControl");
			paused = true;
		} else {
			audio_player.pause.addClass("hiddenControl");
			audio_player.play.removeClass("hiddenControl");
			paused = true;
		}
	} else if (loop == 1) {
		queue.shift();
		queue.push(savedId);
		if (current_medium == 1) {
			video_player.player.seekTo(0);
		} else if (current_medium == 2) {
			timeAdjustLocalVideo(video_player.start_padding);
			video_player.canPlay = true;
			startLocalVideo();
		} else {
			timeAdjust(audio_player.start_padding);
			audio_player.canPlay = true;
			startAudio();
		}
		$("#left_content").find(".song[data-id='"+queue[0]+"']").addClass("selected");
	} else { // loop == 2, or all
		savedId = queue[queue.length-1];
		queue.splice(queue.length-1, 1);
		openMedia(savedId);
		if (current_medium == 0) {
			audio_player.start_padding = 0;
			audio_player.end_padding = 3599999;
			startAudio();
		} else if (current_medium == 2) {
			video_player.start_padding = 0;
			video_player.end_padding = 3599999;
			startLocalVideo();
		}
		queue.unshift(savedId);
		$("#left_content").find(".song[data-id='"+queue[0]+"']").addClass("selected");
	}
}

function timeAdjust(time) {
	/* time is in milliseconds */
    /* Adjusts the current time of the audio - works in tandem with other functions, isn't called simply by clicking on an element */
	pauseAudio();
	if ( parseInt(time) < parseInt(audio_player.start_padding) ) time = audio_player.start_padding;
	else if ( parseInt(time) > parseInt(audio_player.end_padding) ) time = audio_player.end_padding;
    $(audio_player.audio).prop("currentTime", revertFromMilliseconds(time));
    current_time_index = -1;
    current_time = "-3599999";
	startAudio();
}

function timeAdjustLocalVideo(time) {
	pauseLocalVideo();
	console.log(parseInt(time) + " | " + parseInt(video_player.start_padding) );

	if ( parseInt(time) < parseInt(video_player.start_padding) ) time = video_player.start_padding;
	else if ( parseInt(time) > parseInt(video_player.end_padding) ) time = video_player.end_padding;
    $(video_player.local).prop("currentTime", revertFromMilliseconds(time));
    current_time_index = -1;
    current_time = "-3599999";
	startLocalVideo();
}

function volumeAdjust(volume) {
	audio_player.volume.val(volume);
	// Based on the position of the volume slider, the volume of the player and the volume icon will change
	if (volume == 0) 		audio_player.volume_image.attr("src", "assets/mute.png");
	else if (volume < 33) 	audio_player.volume_image.attr("src", "assets/volume_1.png");
	else if (volume < 66) 	audio_player.volume_image.attr("src", "assets/volume_2.png");
	else 					audio_player.volume_image.attr("src", "assets/volume_3.png");
	var vol = volume/100;
    $(audio_player.audio).prop("volume",vol);
}

function volumeAdjustLocalVideo(volume) {
	video_player.volume_slider.val(volume)
	// Based on the position of the volume slider, the volume of the player and the volume icon will change
	if (volume == 0) 		video_player.volume_image.attr("src", "assets/mute_white.png");
	else if (volume < 33) 	video_player.volume_image.attr("src", "assets/volume_1_white.png");
	else if (volume < 66) 	video_player.volume_image.attr("src", "assets/volume_2_white.png");
	else 					video_player.volume_image.attr("src", "assets/volume_3_white.png");
	var vol = volume/100;
	$(video_player.local).prop('volume', vol);
}

function autoscrollToggle() {
	if (!lockLyricScroll) {
		if ( audio_player.autoscroll.hasClass("active") ) {
			audio_player.autoscroll.removeClass("active");
			audio_player.lyrics.find(".selected").removeClass('selected');
		} 
		else audio_player.autoscroll.addClass("active");
		scrollToLyrics = !scrollToLyrics;
	}
}



function startEdit(id) {
	editForm.form[0].reset();
	var data = "id="+id;
	$.ajax({
		url: "scripts/getMediaInfoForEdit.php", 
		data: data, 
		type: 'POST', 
		dataType: 'json'
	}).done(function(response) {
		if (response.success) prepareEdit(response.info);
		else alert(response.message);
	}).fail(function(jqXHR, textStatus, errorThrown) {
		alert('ERRORS @ Opening Media For Edit: ' + errorThrown);
	}).always(openEdit);
}
function prepareEdit(arr) {
	iconEditSet = 0;
	editForm.title.val(arr.title);
	editForm.songId.val(arr.id);
	editForm.medium.val(arr.medium);
	editForm.artist.val(arr.artist);
	editForm.album.val(arr.album_name);
	editForm.album_artist.val(arr.album_artist_name);
	editForm.composer.val(arr.composer);
	editForm.alternative_art_container.find(".alternate_art_container").remove();
	editForm.simple_lyrics_container.removeClass("selected");
	editForm.dynamic_lyrics_container.removeClass("selected");
	editForm.dynamic_lyrics_inner_container.empty();
	editForm.alternative_art_array = null;
	editForm.dynamic_lyrics_index = -1;
	editForm.dynamic_lyrics_prev_time = "00:00";
	if (arr.medium == 1) {
		video_player.lyrics_parent.addClass("lock");
		video_player.controls_container.addClass("lock");
		editForm.alternative_art_activator.hide();
		editForm.art_display.addClass("hidden");
		editForm.art.addClass("hidden");
		editForm.art_temp = null;
		editForm.art_edit.addClass("hidden");
		editForm.padding_container.addClass("hidden");
		editForm.lyrics_types.addClass("hidden");
		editForm.video_id_container.removeClass("hidden");
		editForm.video_id.val(arr.url);
		editForm.dynamic_lyrics_container.addClass("selected");
		editForm.dynamic_lyrics_radio.prop("checked", true);
		editForm.simple_lyrics_radio.prop("checked", false);
		var seg = arr.lyrics;
		if (seg.length > 0) {
			for (var lyric_seg in seg) {
				editForm.dynamic_lyrics_index = parseInt(lyric_seg);
				dynamicLyricSegmentForEdit(lyric_seg, seg[lyric_seg]["time"], seg[lyric_seg]["style"], seg[lyric_seg]["no_text"], seg[lyric_seg]["text"]);
			}
		}
		if ( !$("#edit_media_nav_art").hasClass("hidden") ) $("#edit_media_nav_art").addClass("hidden");
	} else {
		editForm.alternative_art_activator.show().text("Use other media's artwork");
		editForm.art_display.removeClass("hidden");
		editForm.art.removeClass("hidden");
		editForm.art_edit.removeClass("hidden");
		editForm.video_id_container.addClass("hidden");
		if (arr.art != null) {
			editForm.art_temp = arr.art +"#"+ new Date().getTime();
			editForm.art_display.attr("src", editForm.art_temp);
		}
		editForm.padding_container.removeClass("hidden");
		if ( $("#edit_media_nav_art").hasClass("hidden") )  $("#edit_media_nav_art").removeClass("hidden");
		editForm.start_padding.val(arr.start_padding);
		editForm.end_padding.val(arr.end_padding);
		editForm.lyrics_types.removeClass("hidden");
		editForm.dynamic_lyrics_radio.removeClass("hidden");
		editForm.simple_lyrics_radio.removeClass("hidden");
		if (arr.medium == 2) {
			editForm.lyrics_types.addClass("hidden");
			editForm.dynamic_lyrics_container.addClass("selected");
			editForm.dynamic_lyrics_radio.prop("checked", true);
			editForm.simple_lyrics_radio.prop("checked", false);
			var seg = arr.lyrics;
			if (seg.length > 0) {
				for (var lyric_seg in seg) {
					editForm.dynamic_lyrics_index = parseInt(lyric_seg);
					dynamicLyricSegmentForEdit(lyric_seg, seg[lyric_seg]["time"], seg[lyric_seg]["style"], seg[lyric_seg]["no_text"], seg[lyric_seg]["text"]);
				}
			}
		} else {
			if (arr.dynamic_lyrics_toggle == 1) {
				editForm.dynamic_lyrics_container.addClass("selected");
				var seg = arr.lyrics;
				if (seg.length > 0) {
					for (var lyric_seg in seg) {
						editForm.dynamic_lyrics_index = parseInt(lyric_seg);
						dynamicLyricSegmentForEdit(lyric_seg, seg[lyric_seg]["time"], seg[lyric_seg]["style"], seg[lyric_seg]["no_text"], seg[lyric_seg]["text"]);
					}
				}
				editForm.dynamic_lyrics_radio.prop("checked",true);
				editForm.simple_lyrics_radio.prop("checked",false);
			} else {
				editForm.simple_lyrics_container.addClass("selected");
				editForm.simple_lyrics.text(arr.lyrics);
				editForm.simple_lyrics_radio.prop("checked", true);
				editForm.dynamic_lyrics_radio.prop("checked",false);
			}
		}
	}
}
function dynamicLyricSegmentForEdit(id, time = "", style = "", notext = true, text = "") {
	var lyric_seg_html, inner_remove, inner_div, notext_div, notext_input, inner_textarea, numLines;
	lyric_seg_html = $('<div/>', {
		'id':'dynamic_lyrics_segment_'+id,	'class':'dynamic_lyrics_segment'
	}).appendTo(editForm.dynamic_lyrics_inner_container);

		$('<span/>', {
			'class':'dynamic_lyrics_segment_remove',	'data-id':id
		}).text("X").appendTo(lyric_seg_html);
							
		inner_div = $('<div/>', {
			'class':'dynamic_lyrics_segment_settings'
		}).appendTo(lyric_seg_html);

			$('<input>', {
				'class':'dynamic_lyrics_time',	'type':'text',	'name':'dynamic_lyrics_times['+id+']',	'placeholder':'Start Time',	'value':time
			}).appendTo(inner_div);
			editForm.dynamic_lyrics_prev_time = time;
										
			$('<input>', {
				'class':'dynamic_lyrics_style',	'type':'text',	'name':'dynamic_lyrics_styles['+id+']',	'placeholder':'Color',	'value':style
			}).appendTo(inner_div);

			notext_div = $('<div/>', {
				'class':'dynamic_lyrics_notext_container'
			}).appendTo(inner_div);
										
				notext_input = $('<input>', {
					'id':'dynamic_lyrics_notext_'+id,	'class':'dynamic_lyrics_notext',	'type':'checkbox',	'name':'dynamic_lyrics_notexts['+id+']'
				}).appendTo(notext_div);
				if ( notext ) notext_input.prop("checked", true);
	
				$('<label/>', {	
					'class':'dynamic_lyrics_notext_label',	'for':'dynamic_lyrics_notext_'+id
				}).text("No Text").appendTo(notext_div);
										
				inner_textarea = $('<textarea/>', {	
					'class':'dynamic_lyrics_edit',	'name':'dynamic_lyrics_edits['+id+']',	'placeholder':'Lyric Segment',	'rows':'1'	
				}).html(text).appendTo(lyric_seg_html);
				numLines = text.split("\r\n");
				inner_textarea.height((13*numLines.length)+"px");
}
function removeLyricSegment(seg_id) {	editForm.dynamic_lyrics_container.find("#dynamic_lyrics_segment_"+seg_id).remove();	}
function addLyricSegment() {
	editForm.dynamic_lyrics_index = parseInt(editForm.dynamic_lyrics_index) + 1;
	dynamicLyricSegmentForEdit(editForm.dynamic_lyrics_index, editForm.dynamic_lyrics_prev_time);
	editForm.dynamic_lyrics_index = parseInt(editForm.dynamic_lyrics_index) + 1;
	dynamicLyricSegmentForEdit(editForm.dynamic_lyrics_index, "", "", false, "");
}
function openEdit() {
	editForm.parent.addClass("opened");
	editForm.close.addClass("opened");
	editForm.form.addClass("opened");
	editAlbumArtForm.form.removeClass("opened");
	audio_player.container.addClass("right_opened");
	editForm.status = true;
}
function closeEdit() {
	editForm.parent.removeClass("opened");
	editForm.close.removeClass("opened");
	editForm.form.removeClass("opened");
	editAlbumArtForm.form.removeClass("opened");
	audio_player.container.removeClass("right_opened");
	editForm.status = false;
	iconEdit = null
	iconEditSet = 0;
	editAlbumArtForm.status = false;
	editAlbumArtForm.id = -1;
	editAlbumArtForm.iconEdit = null;
	editAlbumArtForm.iconEditSet = -1;
	if ( video_player.lyrics_parent.hasClass("lock") )	video_player.lyrics_parent.removeClass("lock");
	if ( video_player.controls_container.hasClass("lock") ) video_player.controls_container.removeClass("lock");
}
function auto_grow(element) {
    element.style.height = "20px";
    element.style.height = (element.scrollHeight)+"px";
}
function editIcon(event) {
	console.log("Balls");
	event.stopPropagation(); 	/* Stop stuff happening */
	event.preventDefault(); 	/* Totally stop stuff happening */
	/* Create a formdata object and add the files */
	var data = new FormData();
	$.each(iconEdit, function(key, value) {
    	data.append(key, value);
	});
    $.ajax({
    	url: "scripts/mediaEdit.php?icon=1&change="+iconEditSet+"&id="+editForm.songId.val(),	// ?files ensures that the "$_GET" in song_icon_upload.php runs properly
    	type: 'POST',
    	data: data,
    	cache: false,
    	dataType: 'json',
    	processData: false, 	// Don't process the files - in other words, don't turn the icons into strings
    	contentType: false, 	// Set content type to false as jQuery will tell the server its a query string request
    	success: function(response, textStatus, jqXHR) {
    		console.log(response);
    		if (response.success) submitEdit(event, editForm.songId.val());
    		else alert("Error on Editing Media:\n" + response.message);
    	},
    	error: function(jqXHR, textStatus, errorThrown) {	alert('AJAX Error on Editing Media Icon:\n' + textStatus);	}
	});
}
function submitEdit(event, id, reload = 0, close = false, deleted = false) {
   	var formData = editForm.form.serialize();
	$.ajax({
		url: 'scripts/mediaEdit.php?song=1&edit='+id+'&reload='+reload,
		type: 'POST',
		data: formData,
		cache: false,
		dataType: 'json'
	}).done(function(response) {
		console.log(response);
		if (response.success) {
			if (close) closeEdit();
			var flag = false;
			if (id == currentSong) {
				if (reload == 1) resetPlayerAfterEdit();
				else flag = true;
			}
			if (deleted) id = -1;
			getAllMedia(flag, true, id);
		} 
		else alert('Error on Editing Media:\n' + response.message);
	}).fail(function(jqXHR, textStatus, errorThrown) {	
		alert('AJAX Error on Editing Media:\n' + textStatus);
	});
}


function startAlbumArtEdit(album_id) {
	editAlbumArtForm.alternatives_container.empty();
	var grabAlbumArt = $.ajax({
		url: 'scripts/getAlbumArtForEdit.php?id='+album_id,
		type: 'GET',
		dataType: 'json'
	});
	var grabAllArt = $.ajax({
		url: "scripts/getAllArtForEdit.php?get=1",
		dataType: 'json'
	});
	$.when(grabAlbumArt, grabAllArt).then(function(thisArt, allArt) {
		if ( thisArt[1] != "success" ) {
			return alert("AJAX Error on Retrieving Album Art For Edit");
		} else if ( allArt[1] != "success" ) {
			return alert('AJAX errors w/ grabbing all art for album art edit');
		}
		editAlbumArtForm.temp = (thisArt[0]["art"] != null) ? thisArt[0]["art"] : 'assets/default_album_art.jpg';
		editAlbumArtForm.display.attr("src", editAlbumArtForm.temp + "#" + new Date().getTime());

		if ( editAlbumArtForm.array != allArt[0]["data"] ) {
			editAlbumArtForm.array = allArt[0]["data"];
			var alternative_html;
			for (var index in allArt[0]["data"]) {
				alternative_html = 
				"<div class=\"alternate_art_container_for_album_art_edit\"><img class=\"alternate_art_preview\" src=\""+allArt[0]["data"][index]+"\" alt=\"\"><input type=\"radio\" class=\"alternate_art_radio\" id=\"alternate_art_for_album_art_edit_"+index+"\" name=\"alternate_art_for_album_art_edit\" value=\""+index+"\"><label for=\"alternate_art_for_album_art_edit_"+index+"\" class=\"alternate_art_label\" data-id=\""+index+"\"></label></div>";
				editAlbumArtForm.alternatives_container.append(alternative_html);
			}
		}
	}).then(function() {
		editAlbumArtForm.iconEdit = null;
		editAlbumArtForm.iconEditSet = -1;
		editAlbumArtForm.id = album_id;
		openAlbumArtEdit();
	});
}
function openAlbumArtEdit() {
	editAlbumArtForm.parent.addClass("opened");
	editAlbumArtForm.close.addClass("opened");
	editAlbumArtForm.form.addClass("opened");
	editForm.form.removeClass("opened");
	audio_player.container.addClass("right_opened");
	editAlbumArtForm.status = true;
}
/* closeAlbumArtEdit = closeEdit(), so no function is written for that */
function prepareAlbumArtEdit(event) {
	var url = event.target.value;
	var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
	if (event.target.files && event.target.files[0] && (ext == "PNG" || ext == "png" || ext == "jpeg" || ext == "jpg" || ext == "JPEG" || ext == "JPG")) {
		var reader = new FileReader();
		reader.onload = function (e) {	editAlbumArtForm.display.attr('src', e.target.result);	}
		reader.readAsDataURL(event.target.files[0]);
		editAlbumArtForm.iconEdit = event.target.files;
		editAlbumArtForm.iconEditSet = 1;
	} 
	else {
		editAlbumArtForm.display.attr('src', 'assets/default_album_art.jpg');
		alert("That image is not a proper image file (jpg or png)");
	}
}
function submitAlbumArtEdit(event) {
	event.stopPropagation(); 	/* Stop stuff happening */
	event.preventDefault(); 	/* Totally stop stuff happening */
	var data, performAjax;
	if ( editAlbumArtForm.iconEditSet == -1 ) {
		/* A new image was not selected */
		alert("A new image was not chosen.\nPlease select a new image or close out of the edit screen.");
		return;
	} else if (editAlbumArtForm.iconEditSet == 0) {
		/* An alternative art was used, and a new art was not uploaded */
		data = editAlbumArtForm.form.serialize();
		performAjax = $.ajax({
			url: "scripts/updateAlbumArt.php?album_id="+editAlbumArtForm.id+"&iconEditSet="+editAlbumArtForm.iconEditSet,
			type: 'POST',
			data: data,
			dataType: 'json'
		});
	} else if ( editAlbumArtForm.iconEdit == null ) {
		/* We wanted to upload a new file, but a new file was not set */
		alert("You wished to upload a new file...\nBut a new file was not set.");
		return;
	}  else {
		data = new FormData();
		$.each(editAlbumArtForm.iconEdit, function(key, value) {
		    data.append(key, value);
		});
		performAjax = $.ajax({
			url: "scripts/updateAlbumArt.php?album_id="+editAlbumArtForm.id+"&iconEditSet="+editAlbumArtForm.iconEditSet,
			type: 'POST',
			data: data,
			cache: false,
			dataType: 'json',
			processData: false,
			contentType: false
		});
	}

	$.when(performAjax).then(function(response) {
		if (response.success) {
			closeEdit();
			getAllMedia();
	   	}
		else alert(response.message);
	});
}


function openEmbed() {
	embedForm.form.find(".video_input").val("");
	embedForm.form.find(".video_input_error").text("");
	embedForm.form.removeClass("closed");
	$("#left_content").addClass("closed");
	embedForm.status = true;
}
function closeEmbed() {
	embedForm.form.find("input[type=text], input[type=url]").val("");
	embedForm.form.addClass("closed");
	$("#left_content").removeClass("closed");
	embedForm.status = false;
}
function submitEmbed(event) {
	event.stopPropagation(); 	/* Stop stuff happening */
	event.preventDefault(); 	/* Totally stop stuff happening */
	var data = embedForm.form.serialize();
	$.ajax({
		url: 'scripts/embedInput.php?input=1',
		type: 'POST',
		data: data,
		dataType: 'json'
	}).done(function(response) {
		if (response.success) {
			closeEmbed();
			getAllMedia(false, true, response.info.id);
			populateAlternativeArtContainer();
		} 
		else {
			embedForm.total_error.text(response.message).addClass("opened");
			if ( response.errors != null ) {
				for (var error_type in response.errors) {
					embedForm.form.find("#video_input_"+error_type+"_error").text(response["errors"][error_type]);
				}
			}
		}
	}).fail(function(jqXHR, textStatus, errorThrown) {	
		alert('AJAX Error on Inputting Embed Video:\n' + textStatus);
	});
}

function search(text) {
	search_matches = [];
	for (var id in database) {
		if ( database[id]["title"].toLowerCase().includes(text.toLowerCase()) ) search_matches.push(id);
	}
	if (search_matches.length > 0) return true;
	else return false;
}

function populateAlternativeArtContainer() {
	console.log("clicked");
	editForm.alternative_art_container.find(".alternate_art_container").remove();
	$.ajax({
		url: "scripts/getAllArtForEdit.php?get=1",
		dataType: 'json'
	}).done(function(response) {
        if (response.success) {
        	if (response.data != null) {
        		editForm.alternative_art_array = response.data;
       			editForm.alternative_art_activator.hide();
        		var html;
        		for (var index in response.data) {
        			html = "<div class=\"alternate_art_container\"><img class=\"alternate_art_preview\" src=\""+response["data"][index]+"\" alt=\"\"><input type=\"radio\" class=\"alternate_art_radio\" id=\"alternate_art_"+index+"\" name=\"alternate_art\" value=\""+index+"\"><label for=\"alternate_art_"+index+"\" class=\"alternate_art_label\" data-id=\""+index+"\"></label></div>";
					editForm.alternative_art_container.append(html);
       			}	
       		} 
       		else $(this).text("No alternate album art available");
		}
		else alert(response.message);
	}).fail(function(jqXHR, textStatus, errorThrown) {	
		alert('ERRORS @ Adding New Media: ' + textStatus);
	});
}





function initialize_video() {
	video_player.duration.text(formatTime( video_player.player.getDuration() ));
	video_player.loop_image.attr("src", loopStagesWhite[loop]);
	videoVolumeAdjust(video_player.volume_slider.val());
	updateVideoTimerDisplay();
	updateVideoProgressBar();
	clearInterval(video_player.time_update_interval);
	console.log("Video Initialized");
	startThisVideo();
	video_player.time_update_interval = setInterval(function () {
        updateVideoTimerDisplay();
        updateVideoProgressBar();
        if (dynamic_lyrics_toggle && scrollToLyrics) {
        	updateVideoLyricsDisplay();
        }
    }, 100);
}
function abortVideo() {
	video_player.title.text("");
	video_player.artist.text("");
	video_player.timeDisplay.text("");
	video_player.duration.text("");
	video_player.time_interval = null;
	if (video_player.player != null) {
		video_player.player.a.remove();
		video_player.player = null;
	}
	video_player.paused = true;
	clearInterval(video_player.time_update_interval);
	video_player.pause_button.addClass("hiddenControl");
	video_player.play_button.removeClass("hiddenControl");
	$("#video_embed_inner_container").find("#video_embed").remove();
	$("#video_embed_inner_container").append("<div id='video_embed'></div>");
}
function updateVideoTimerDisplay() {
	video_player.timeDisplay.text( readableDuration(video_player.player.getCurrentTime() * 1000) );
}
function formatTime(time){
    time = Math.round(time);
    var minutes = Math.floor(time / 60),
    seconds = time - minutes * 60;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    return minutes + ":" + seconds;
}
function updateVideoProgressBar() {
	if ( !video_player.lock_time_slider ) {
		video_player.time_slider.val((video_player.player.getCurrentTime() / video_player.player.getDuration()) * 100);
	}
}
function updateVideoLyricsDisplay() {
	var curMillisec = video_player.player.getCurrentTime() * 1000;
	if (current_time_index == -1) {
		video_player.lyrics.find(".selected").removeClass("selected");
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
		if ( (curMillisec > dynamic_lyrics_starting_times[current_time_index+1]) || (curMillisec < dynamic_lyrics_starting_times[current_time_index]) ) {
			video_player.lyrics.find(".selected").removeClass("selected");
			current_time_index = -1;
			current_time = "-3599999";
		}
	}

	if ( !$(".lyric_segment_"+current_time).hasClass("selected") ) $("#video_lyrics_inner_container .lyric_segment_"+current_time).addClass("selected");
}
function startThisVideo() {
	if (current_medium == 1) video_player.player.playVideo();
	else if (current_medium == 2) startLocalVideo();

	if (video_player.paused) {
		video_player.play_button.addClass("hiddenControl");
		video_player.pause_button.removeClass("hiddenControl");
		video_player.paused = false;
	}
}
function pauseThisVideo() {
	if (current_medium == 1 ) video_player.player.pauseVideo();
	else if (current_medium == 2) pauseLocalVideo();

	if (!video_player.paused) {
		video_player.pause_button.addClass("hiddenControl");
		video_player.play_button.removeClass("hiddenControl");
		video_player.paused = true;
	}
}
function videoVolumeAdjust(volume) {
	if (current_medium == 1) video_player.player.setVolume(volume);
	else if (current_medium == 2) {
		var vol = volume/100;
		$(video_player.local).prop('volume', vol);
	}
	// Based on the position of the volume slider, the volume of the player and the volume icon will change
	if (volume == 0) 		video_player.volume_image.attr("src", "assets/mute_white.png");
	else if (volume < 33) 	video_player.volume_image.attr("src", "assets/volume_1_white.png");
	else if (volume < 66) 	video_player.volume_image.attr("src", "assets/volume_2_white.png");
	else 					video_player.volume_image.attr("src", "assets/volume_3_white.png");
}
function videoForwardFive(){
	if (current_medium == 1) {
		if ( video_player.player.getCurrentTime() + 5 < video_player.player.getDuration() ) {
			video_player.player.seekTo(video_player.player.getCurrentTime() + 5);
		}
		else nextAudio();
	} else if (current_medium == 2) forwardLocalVideo();
}
function videoBackFive(){
	if (current_medium == 1) {
		var newTime = (video_player.player.getCurrentTime() - 5 >= 0) ? video_player.player.getCurrentTime() - 5 : 0;
		video_player.player.seekTo(newTime);
	}
	else if (current_medium == 2) backwardLocalVideo();
}

function videoAutoscrollToggle() {
	if (!lockLyricScroll) {
		if ( video_player.autoscroll.hasClass("active") ) {
			video_player.autoscroll.removeClass("active");
			video_player.lyrics.find(".selected").removeClass('selected');
		} 
		else video_player.autoscroll.addClass("active");
		scrollToLyrics = !scrollToLyrics;
	}
}

$(document).ready(function() {
	/* Setting Global Variables */
	audio_player = {
		container: $("#main"),
		music: $("#player_container"),
		audio: document.getElementById("audio"),
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
		loop_image: $("#repeat_image"),
		shuffle: $("#shuffle"),
		shuffle_image: $("#shuffle_image"),
		edit: $("#options"),
		autoscroll: $("#player_lyrics_autoscroll"),
		start_padding: 0, 
		end_padding: 3599999,
		canPlay: false
	};
	video_player = {
		container: $("#video_container"),
		player: null,
		local: document.getElementById("localVideo"),
		embed: $("#video_embed"),
		title: $("#video_title"),
		artist: $("#video_artist"),
		lyrics_parent: $("#video_lyrics_container"),
		lyrics: $("#video_lyrics_inner_container"),
		timeDisplay: $("#video_curTime"),
		duration: $("#video_duration"),
		time_slider: $("#video_time_slider"),
		lock_time_slider: false,
		time_interval: null,
		play_button: $("#video_play"),
		pause_button: $("#video_pause"),
		paused: true,
		previous: $("#video_previous"),
		next: $("#video_next"),
		back_five: $("#video_backFive"),
		forward_five: $("#video_forwardFive"),
		volume_slider: $("#video_volume"),
		volume_image: $("#video_volume_image"),
		loop: $("#video_repeat"),
		loop_image: $("#video_repeat_image"),
		shuffle: $("#video_shuffle"),
		shuffle_image: $("#video_shuffle_image"),
		options: $("#video_options"),
		autoscroll: $("#video_lyrics_autoscroll"),
		controls_container: $("#video_extras_container"),
		start_padding:0,
		end_padding: 3599999,
		canPlay: false
	};
	editForm = {
		status: false,
		parent: $("#right"),
		close: $("#closeEdit"),
		form: $("#edit_media_form"),
		songId: $("#id_edit"),
		medium: $("#medium_edit"),
		title: $("#title_edit"),
		artist: $("#artist_edit"),
		art_display: $("#art_edit_display"),
		art_edit: $("#art_edit_overlay"),
		art: $("#art_edit"),
		art_temp: null,
		alternative_art_container: $("#song_edit_art_alternatives_inner_container"),
		alternative_art_activator: $("#song_edit_art_alternatives_inner_container_activator"),
		alternative_art_array: null,
		album: $("#album_edit"),
		album_artist: $("#albumArtist_edit"),
		composer: $("#composer_edit"),
		padding_container: $("#song_edit_padding_container"),
		start_padding: $("#start_padding_edit"),
		end_padding: $("#end_padding_edit"),
		video_id_container: $("#video_id_edit_container"),
		video_id: $("#video_id_edit"),
		lyrics_label: $("#song_edit_lyrics_label"),
		lyrics_types: $("#song_edit_lyrics_type_container"),
		simple_lyrics_radio: $("#lyric_dynamic_false"),
		simple_lyrics_container: $("#song_edit_lyrics_simple_container"),
		simple_lyrics: $("#simple_lyrics_edit"),
		dynamic_lyrics_radio: $("#lyric_dynamic_true"),
		dynamic_lyrics_container: $("#dynamic_lyrics_edit_container"),
		dynamic_lyrics_inner_container: $("#dynamic_lyrics_edit_inner_container"),
		dynamic_lyrics_index: -1,
		dynamic_lyrics_prev_time: "00:00",
		dynamic_lyrics_add_segment: $("#dynamic_lyrics_edit_add_segment"),
		submit: $("#submit_edit")
	};
	editAlbumArtForm = {
		status: false,
		parent: $("#right"),
		close: $("#closeEdit"),
		form: $("#edit_album_art_form"),
		display: $("#edit_album_art_form_display"),
		new_upload_input: $("#edit_album_art_form_input"),
		alternatives_container: $("#edit_album_art_form_art_alternatives_inner_container"),
		alternative_input: $("#edit_album_art_form_alternative_id"),
		array: null,
		temp: null,
		id: -1,
		iconEdit: null,
		iconEditSet: -1
	};
	embedForm = {
		status: false,
		open: $("#openEmbed"),
		close: $("#closeEmbed"),
		total_error: $("#video_input_total_error"),
		form: $("#video_input_form"),
		title: $("#video_title_input"),
		artist: $("#video_artist_input"),
		album: $("#video_album_input"),
		album_artist: $("#video_album_artist_input"),
		composer: $("#video_composer_input"),
		url: $("#video_url_input"),
		submit: $("#video_input_form_submit")
	};

	/* Initialization Functions */
	getAllMedia(false, false, -1);
	volumeAdjust(audio_player.volume.val());

	/* User-related actions */
	window.onkeydown = function(e) {
		if ( e.keyCode == 32 && (e.target.tagName.toUpperCase() != 'INPUT') && (e.target.tagName.toUpperCase() != 'TEXTAREA') ) {
			e.preventDefault();
			if (currentSong != -1) {
				if ( current_medium == 0 ) {
					if (paused) startAudio();
					else pauseAudio();
				}
				else if (current_medium == 1) {
					if (video_player.paused) startThisVideo();
					else pauseThisVideo();
				}
			}
		}
	};
	$(document).on("click", ".song", function() {
		$("#left_content").find(".selected").removeClass("selected");
		$("#left_content").find(".searched").removeClass("searched");
		$(this).addClass("selected");
		var id = $(this).attr("data-id");
		var medium = $(this).attr("data-medium");
		openMedia(id, true);
		if (medium == 0) {
			$(audio_player.audio).trigger('play'); 
			console.log("Playing Audio");
			if (paused) {
				audio_player.play.addClass("hiddenControl");
				audio_player.pause.removeClass("hiddenControl");
				paused = false;
			}
		} else if (medium == 2) {
			$(video_player.local).trigger('play');
			if (video_player.paused) {
				video_player.play_button.addClass("hiddenControl");
				video_player.pause_button.removeClass("hiddenControl");
				video_player.paused = false;
			}
		}
	});
	$(document).on("click", ".song_options", function(event) {
		event.stopPropagation();
		var parent = $(this).parent();
		var curId = parent.attr("data-id");
		var curEditingId = editForm.songId.val();
		if (!editForm.status) startEdit(curId);
		else if (currentSong != curId) {
			if (curEditingId != curId) startEdit(curId);
			else closeEdit();
		} else {
			if (curEditingId != curId) startEdit(curId);
			else closeEdit();
		}
	});
	$(document).on("click", "#left_close", function() {
		if (left_close) {
			$("#left").removeClass("closed");
			audio_player.container.addClass("left_opened");
			$(this).text("Close");
		} else {
			$("#left").addClass("closed");
			audio_player.container.removeClass("left_opened");
			$(this).text("Open");
		}
		left_close = !left_close;
	});
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
  				$("#left_content").find(".searched").removeClass("searched");
  				var toSearch = search_matches[0];
	  			search_matches.shift();
	  			search_matches.push(toSearch);
	  			var potential_match = document.getElementById(toSearch);
	  			while( potential_match == null ) {
	  				toSearch =  search_matches[0];
	  				search_matches.shift();
	  				potential_match = document.getElementById(toSearch);
	  			}
				document.getElementById("left_content").scrollTo({
		    		'behavior': 'smooth',
		    		'top': potential_match.offsetTop - (screenHeight/2) + (potential_match.offsetHeight/2)
				});
				$(potential_match).addClass("searched");
  			}
  		}
  		else searching_boolean = true;
	});

	/* Embed Form-related functions */
	embedForm.open.on("click", openEmbed);
	embedForm.close.on("click", closeEmbed);
	embedForm.form.on("submit", submitEmbed);
	embedForm.total_error.on("mouseleave", function() {	$(this).removeClass("opened");	});

	/* Edit Form-related functions */
	audio_player.edit.on("click", function() {
		if (!editForm.status) startEdit(currentSong);
		else {
			var curId = editForm.songId.val();
			if (curId != currentSong) startEdit(currentSong);
			else closeEdit();
		}
	});
	editForm.alternative_art_activator.on("click", populateAlternativeArtContainer);
	$(document).on("click", ".alternate_art_container .alternate_art_label", function() {
		iconEdit = null;
		iconEditSet = 0;
		var alternative_id = $(this).attr("data-id");
		var new_art = editForm.alternative_art_array[alternative_id];
		editForm.art_display.attr("src", new_art)
	});
	editForm.art.on('change', prepareIconEdit);
	function prepareIconEdit(event) {
		iconEdit = event.target.files;
		iconEditSet = 1;
		var url = event.target.value;
		var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
		if (event.target.files && event.target.files[0] && (ext == "PNG" || ext == "png" || ext == "jpeg" || ext == "jpg" || ext == "JPEG" || ext == "JPG")) {
			var reader = new FileReader();
			reader.onload = function (e) {	editForm.art_display.attr('src', e.target.result);	}
			reader.readAsDataURL(event.target.files[0]);
		} 
		else editForm.art_display.attr('src', 'assets/default_album_art.jpg');
	}
	editForm.submit.on('click', function(e) {
		console.log("Balls");
		editIcon(e);
	});
	editForm.close.on("click", closeEdit);
	$(document).on("click", ".dynamic_lyrics_segment_remove", function() {
		var seg_id = $(this).attr('data-id');
		removeLyricSegment(seg_id);
	});
	editForm.dynamic_lyrics_add_segment.on("click", function() {	addLyricSegment();	});
	editForm.simple_lyrics_radio.on("click", function() {
		editForm.dynamic_lyrics_container.removeClass("selected");
		editForm.simple_lyrics_container.addClass("selected");
	});
	editForm.dynamic_lyrics_radio.on("click", function() {
		editForm.simple_lyrics_container.removeClass("selected");
		editForm.dynamic_lyrics_container.addClass("selected");
	});
	editForm.dynamic_lyrics_inner_container.on('change keyup keydown paste cut', '.dynamic_lyrics_edit', function() {
		auto_grow(this);
	})
	$("#delete_song_submit").on("click", function() {	submitEdit(null, editForm.songId.val(), 1, true, true);	});
	$("#edit_media_form .edit_media_form_nav_item").on("click", function() {
		$("#edit_media_form_nav").find(".edit_media_form_nav_item.selected").removeClass("selected");
		$("#edit_media_form_contents").find(".edit_media_form_inner_contents.selected").removeClass("selected");
		var edit_form_id = $(this).attr("data-item");
		var edit_form_selected = edit_form_options[edit_form_id];
		$("#edit_media_nav_"+edit_form_selected).addClass("selected");
		$("#edit_media_form_"+edit_form_selected).addClass("selected");
	});

	/* Add Media-related functions */
	$("#addMedia").on("click", function() {
		$.ajax({
        	url: "scripts/mediaAdd.php?add=1",
        	dataType: 'json'
        }).done(function(response) {	
        	if (response.success) getAllMedia();
        	else alert(response.message);
		}).fail(function(jqXHR, textStatus, errorThrown) {	
			alert('ERRORS @ Adding New Media: ' + textStatus);
		});
	});
	$(document).on("click", ".addAlbumArt_button", function() {	
		startAlbumArtEdit( parseInt($(this).attr("data-id")) );
	});	
	$("#edit_album_art_form_input").on("change", prepareAlbumArtEdit);
	editAlbumArtForm.form.on("submit", submitAlbumArtEdit);
	$(document).on("click", ".alternate_art_container_for_album_art_edit .alternate_art_label", function() {
		console.log($(this).attr("data-id"));
		editAlbumArtForm.iconEdit = null;
		editAlbumArtForm.iconEditSet = 0;
		var alternative_id = $(this).attr("data-id");
		var new_art = editAlbumArtForm.array[alternative_id];
		editAlbumArtForm.display.attr("src", new_art);
	});

	/* Player-related functions */
	audio_player.time_slider.on("input", function() { 	timeAdjust( $(this).val() );	});	/* Moving the slider adjusts the audio's time */
	audio_player.volume.on( "input", function() { volumeAdjust($(this).val()); 	});
	$(audio_player.audio).on("ended", nextAudio);
	audio_player.previous.on("click", previousAudio);
	audio_player.next.on("click", nextAudio);
	audio_player.autoscroll.on("click", autoscrollToggle);
	audio_player.loop.on("click", function() {
		loop++;
		if (loop == 3) loop = 0;
		audio_player.loop_image.attr("src", loopStagesDefault[loop]);
		loadQueue();
	});
	audio_player.shuffle.on("click", function(){
		shuffle ++;
		if (shuffle == 2) shuffle = 0;
		audio_player.shuffle_image.attr("src", shuffleStages[shuffle]);
		loadQueue();
	});

	/* Video Player-related functions */
	video_player.time_slider.on("mousedown touchstart", function(e) {
		video_player.lock_time_slider = true;
	});
	video_player.time_slider.on('mouseup touchend', function (e) {
		if (current_medium == 1) {
			var restart_video = false;
			if (!video_player.paused)	{
				pauseThisVideo();
				restart_video = true;
			}
	    	var newTime = video_player.player.getDuration() * (e.target.value / 100);
			video_player.player.seekTo(newTime);
			if ( restart_video ) startThisVideo();
			video_player.lock_time_slider = false;
		} else if (current_medium == 2) {
			timeAdjustLocalVideo( $(this).val() * parseInt($(video_player.local).prop('duration')) * 10 );
		}
	});
	video_player.play_button.on('click', startThisVideo);
    video_player.pause_button.on('click', pauseThisVideo);
    video_player.volume_slider.on('input', function() {
    	videoVolumeAdjust($(this).val());
    });
    video_player.loop.on("click", function() {
    	loop++;
    	if (loop == 3) loop = 0;
    	video_player.loop_image.attr("src", loopStagesWhite[loop]);
    	if (loop == 1 && current_medium == 1) video_player.player.setLoop();
    	loadQueue();
    });
    video_player.shuffle.on("click", function(){
		shuffle ++;
		if (shuffle == 2) shuffle = 0;
		video_player.shuffle_image.attr("src", shuffleStages[shuffle]);
		loadQueue();
	});
    video_player.previous.on("click", previousAudio);
    video_player.next.on("click", nextAudio);
    video_player.forward_five.on("click", videoForwardFive);
    video_player.back_five.on("click", videoBackFive);
    video_player.options.on("click", function()  {
    	if (!editForm.status) startEdit(currentSong);
		else {
			var curId = editForm.songId.val();
			if (curId != currentSong) startEdit(currentSong);
			else closeEdit();
		}
    });
    video_player.autoscroll.on('click', videoAutoscrollToggle);
});



