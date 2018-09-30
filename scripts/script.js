//var database = [];

/* Youtube Setup - If no online connection detected, then all youtube embedded entries are not available */
var onlineConnection = false;
function onYouTubeIframeAPIReady() {
	console.log("YouTube API Ready");
	onlineConnection = true;
}

var globalPlayer, audio_player, video_player, editForm, editAlbumArtForm, embedForm, iconEdit, iconEditSet = 0, left_close = false;
var screenHeight = window.innerHeight;
var search_element, search_options_element, search_text, search_option, searching_boolean = true, search_matches = [];
var loopStagesDefault = ["assets/repeat_0.png", "assets/repeat_1.png", "assets/repeat_all.png"];
var loopStagesWhite = ["assets/repeat_0_white.png", "assets/repeat_1_white.png", "assets/repeat_all_white.png"];
var shuffleStagesDefault = ["assets/shuffle_0.png", "assets/shuffle_1.png"];
var shuffleStagesWhite = ["assets/shuffle_0_white.png", "assets/shuffle_1_white.png"];
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

function onTimeUpdate(track, embedTime = null) {
	var curMillisec, curTime;
	if (globalPlayer.currentMediaType == 1) curMillisec = embedTime * 1000;
	else curMillisec = milliseconds(track.currentTime);
	curTime = readableDuration(curMillisec);
	if (curMillisec > globalPlayer.endPadding) return nextMedia();

	globalPlayer.currentPlayer.timeDisplay.text(curTime);
	if (globalPlayer.currentMediaType == 1 && !globalPlayer.currentPlayer.lock_time_slider) globalPlayer.currentPlayer.timeSlider.val(curMillisec);
	else globalPlayer.currentPlayer.timeSlider.val(curMillisec);
	if (globalPlayer.dynamic_lyrics_toggle && globalPlayer.scrollToLyrics) {
		if (globalPlayer.current_time_index == -1) {
			$(".lyric_segment.selected").removeClass("selected");
			for (var i = globalPlayer.dynamic_lyrics_starting_times.length - 1; i >= 0; i--) {
				if ( curMillisec >= globalPlayer.dynamic_lyrics_starting_times[i] ) {
					globalPlayer.current_time_index = i;
					globalPlayer.current_time = globalPlayer.dynamic_lyrics_starting_times[i];
					break;
				} else {
					globalPlayer.current_time_index = -1;
					globalPlayer.current_time = "-3599999";
				}
			}
		} else {
			if ( (curMillisec > globalPlayer.dynamic_lyrics_starting_times[globalPlayer.current_time_index+1]) || (curMillisec < globalPlayer.dynamic_lyrics_starting_times[globalPlayer.current_time_index]) ) {
				$(".lyric_segment.selected").removeClass("selected");
				if (globalPlayer.currentMediaType == 0) {
					globalPlayer.current_time_index++;
					globalPlayer.current_time = globalPlayer.dynamic_lyrics_starting_times[globalPlayer.current_time_index];
				} else {
					globalPlayer.current_time_index = -1;
					globalPlayer.current_time = "-3599999";
				}
			}
		}

		if ( !$(".lyric_segment_"+globalPlayer.current_time).hasClass("selected") ) {
			globalPlayer.currentPlayer.lyrics.find(".lyric_segment_"+globalPlayer.current_time).addClass("selected");
			if (globalPlayer.currentMediaType == 0) {
				var elmnt = document.querySelector(".lyric_segment_"+globalPlayer.current_time);
				if (elmnt != null) {
					document.getElementById("player_lyrics").scrollTo({
					    'behavior': 'smooth',
						'top': elmnt.offsetTop - (globalPlayer.lyricsHeight/2) + (elmnt.offsetHeight/2)
					});	
				}
			}
		}
	}
}


function openMedia(id, newQueue = false) {
	var data = globalPlayer.database[id];
	preparePlayer(data);
	if (data.medium == 0 || data.medium == 2) prepareLocalMedia(data);
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
	}).always(function() {	$("#left_content").show();	});
}
function setDatabaseInScript(raw) {
	globalPlayer.database = raw;
	console.log(globalPlayer.database);
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
		$(document.getElementById("song_"+globalPlayer.currentSong)).addClass("selected");
		if (updateCurrentPlayer) updateCurrent();
	}
}
function updateCurrent() {
	console.log('updateCurrent');
	var data = "id="+globalPlayer.currentSong;
	$.ajax({
		url: "scripts/getMediaInfo.php", 
		data: data, 
		type: 'POST', 
		dataType: 'json'
	}).done(function(response) {
		if (response.success) {
			var arr = response.info;
			if (globalPlayer.currentMediaType == 2) {
				globalPlayer.startPadding = arr['start_padding'];
				globalPlayer.endPadding = arr['end_padding'];
				video_player.lyrics.empty();
				if (response.info.dynamic_lyrics_toggle == 1) {
					video_player.lyrics.html(arr["lyrics"]);
					globalPlayer.dynamic_lyrics_toggle = true;
					globalPlayer.dynamic_lyrics_starting_times = arr["dynamic_lyrics_starting_times"];
					globalPlayer.lockLyricScroll = false;
					if (video_player.autoscrollButton.hasClass("locked")) video_player.autoscrollButton.removeClass("locked");
					if (globalPlayer.scrollToLyrics) {
						if (!video_player.autoscrollButton.hasClass("active")) video_player.autoscrollButton.addClass("active");
					} else {
						if (video_player.autoscrollButton.hasClass("active")) video_player.autoscrollButton.removeClass("active");
					}
				}
			} 
			else if (globalPlayer.currentMediaType == 1) {
				video_player.lyrics.empty();
				if (response.info.dynamic_lyrics_toggle == 1) {
					video_player.lyrics.html(arr["lyrics"]);
					globalPlayer.dynamic_lyrics_toggle = true;
					globalPlayer.dynamic_lyrics_starting_times = arr["dynamic_lyrics_starting_times"];
					globalPlayer.lockLyricScroll = false;
					if (video_player.autoscrollButton.hasClass("locked")) video_player.autoscrollButton.removeClass("locked");
					if (globalPlayer.scrollToLyrics) {
						if (!video_player.autoscrollButton.hasClass("active")) video_player.autoscrollButton.addClass("active");
					} else {
						if (video_player.autoscrollButton.hasClass("active")) video_player.autoscrollButton.removeClass("active");
					}
				}
			} 
			else {
				globalPlayer.currentAlbum = arr["album_id"];
				globalPlayer.currentAlbumArtist = arr["album_artist_id"];
				globalPlayer.background.attr("src", arr["art"]+"#"+ new Date().getTime());
				globalPlayer.currentPlayer.art.attr("src", arr["art"]+"#"+ new Date().getTime());
				globalPlayer.currentPlayer.title.html(arr["title"]);
				if (globalPlayer.currentPlayer.title.height() > 100) globalPlayer.currentPlayer.title.addClass("smallerTitle");
				else globalPlayer.currentPlayer.title.removeClass("smallerTitle");
				globalPlayer.currentPlayer.artist.html(arr["artist"]);
				globalPlayer.currentPlayer.lyrics.html(arr["lyrics"]);
				globalPlayer.lyricsHeight = globalPlayer.currentPlayer.lyrics.height();
				globalPlayer.startPadding = arr["start_padding"];
				globalPlayer.endPadding = arr["end_padding"];
				if (arr["dynamic_lyrics_toggle"] == 0) {
					globalPlayer.dynamic_lyrics_toggle = false;
					globalPlayer.dynamic_lyrics_starting_times = null;
					globalPlayer.lockLyricScroll = true;
					if (globalPlayer.currentPlayer.autoscrollButton.hasClass("active")) globalPlayer.currentPlayer.autoscrollButton.removeClass("active");
					if (!globalPlayer.currentPlayer.autoscrollButton.hasClass("locked")) globalPlayer.currentPlayer.autoscrollButton.addClass("locked");
				} else {
					globalPlayer.dynamic_lyrics_toggle = true;
					globalPlayer.dynamic_lyrics_starting_times = arr["dynamic_lyrics_starting_times"];
					globalPlayer.lockLyricScroll = false;
					if (globalPlayer.currentPlayer.autoscrollButton.hasClass("locked")) globalPlayer.currentPlayer.autoscrollButton.removeClass("locked");
					if (globalPlayer.scrollToLyrics) {
						if (!globalPlayer.currentPlayer.autoscrollButton.hasClass("active")) globalPlayer.currentPlayer.autoscrollButton.addClass("active");
					} else {
						if (globalPlayer.currentPlayer.autoscrollButton.hasClass("active")) globalPlayer.currentPlayer.autoscrollButton.removeClass("active");
					}
				}

				//preparePlayer(arr);
			}
			$("#left_content").find(".song[data-id='"+arr["id"]+"']").addClass("selected");
			if (globalPlayer.loop == 2) createLoop(globalPlayer.currentAlbum, globalPlayer.currentSong, globalPlayer.currentAlbumArtist, globalPlayer.shuffle);
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
			console.log("Image art found with Base64");
			audio_player.art.attr("src", response);
			globalPlayer.background.attr("src", response);
			img = response;
		} else {
			console.log("Image Art Not Found - Using Default");
			audio_player.art.attr("src", "media_player/assets/default_album_art.jpg");
			globalPlayer.background.attr("src", "media_player/assets/default_album_art.jpg");
			img = "default";
		}
		saveMediaArt(id, img);
	}).fail(function(jqXHR, textStatus, errorThrown) {	alert('ERRORS: ' + textStatus);	});
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
		console.log(response);
		//if ( !response.success ) alert(response.message);	
	}).fail(function(jqXHR, textStatus, errorThrown) {	alert('ERRORS @ Saving Media Art: ' + errorThrown);	});
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
	}).fail(function(jqXHR, textStatus, errorThrown) {	alert('ERRORS @ CREATING LOOP: ' + errorThrown);	});
}
function addToLoop(arr) {
	globalPlayer.queue.length = 0;
	if (arr.length > 0) {
		var ind = arr.indexOf(parseInt(globalPlayer.currentSong));
		for (var i = ind; i < arr.length; i++) {	
			globalPlayer.queue.push(arr[i]);		
		}
		if (ind != 0) {	for (var k = 0; k < ind; k++) {	
			globalPlayer.queue.push(arr[k]);	}	
		}
	}
	console.log(globalPlayer.queue);
}

function loadQueue() {
	if (globalPlayer.loop == 2) {
		createLoop(globalPlayer.currentAlbum, globalPlayer.currentSong, globalPlayer.currentAlbumArtist, globalPlayer.shuffle);
	}
	else {
		globalPlayer.queue = [globalPlayer.currentSong];
		console.log(globalPlayer.queue);
	}
}


/*  ------  */
/*  Audio Functions  */
/*  ------  */

function preparePlayer(arr) {
	abortMedia();
	globalPlayer.currentPlayer = null;

	globalPlayer.currentSong = arr["id"];
	globalPlayer.currentAlbum = arr["album_id"];
	globalPlayer.current_time_index = -1;
	globalPlayer.current_time = "-3599999";
	globalPlayer.currentMediaType = parseInt(arr["medium"]);
	globalPlayer.currentAlbumArtist = arr["album_artist_id"];

	if (globalPlayer.currentMediaType == 1) {
		audio_player.container.addClass("closed");
		video_player.container.removeClass("closed");
		globalPlayer.mediaContainer.addClass('video');
		globalPlayer.currentPlayer = video_player;
		globalPlayer.currentPlayer.title.html(arr["title"]);
		var setLoopForVideo = (globalPlayer.loop == 1) ? 1 : 0;
		globalPlayer.currentPlayer.player = new YT.Player('video_embed', {
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
					if (e.data === YT.PlayerState.ENDED) {
						if (globalPlayer.loop == 1) globalPlayer.currentPlayer.player.playVideo();
						else nextMedia();
					}
				}
			}
		});
	} else if (globalPlayer.currentMediaType == 2) {
		audio_player.container.addClass("closed");
		video_player.container.removeClass("closed");
		globalPlayer.mediaContainer.addClass('video');
		globalPlayer.currentPlayer = video_player;
		globalPlayer.currentPlayer.title.html(arr["title"]);
		globalPlayer.currentPlayer.title.removeClass("smallerTitle");
		volumeAdjust(globalPlayer.volume);
	} else {
		video_player.container.addClass("closed");
		audio_player.container.removeClass("closed");
		globalPlayer.mediaContainer.removeClass('video');
		globalPlayer.background.attr("src", arr["art"]+"#"+ new Date().getTime());
		globalPlayer.currentPlayer = audio_player;
		if (arr["art"] == null) getImageArt(arr["id"]);
		else {
			globalPlayer.currentPlayer.art.attr("src", arr["art"]+"#"+ new Date().getTime());
			globalPlayer.background.attr("src", arr["art"]+"#"+ new Date().getTime());
		}
		globalPlayer.currentPlayer.title.html(arr["title"]);
		if (globalPlayer.currentPlayer.title.height() > 100) globalPlayer.currentPlayer.title.addClass("smallerTitle");
		volumeAdjust(globalPlayer.volume);
	}

	globalPlayer.currentPlayer.artist.html(arr["artist"]);
	globalPlayer.currentPlayer.lyrics.html("");
	globalPlayer.startPadding = arr["start_padding"];
	globalPlayer.endPadding = arr["end_padding"];

	if (arr["dynamic_lyrics_toggle"] == 0) {
		globalPlayer.dynamic_lyrics_toggle = false;
		globalPlayer.dynamic_lyrics_starting_times = null;
		globalPlayer.lockLyricScroll = true;
		if (globalPlayer.currentPlayer.autoscrollButton.hasClass("active")) globalPlayer.currentPlayer.autoscrollButton.removeClass("active");
		if (!globalPlayer.currentPlayer.autoscrollButton.hasClass("locked")) globalPlayer.currentPlayer.autoscrollButton.addClass("locked");
	} else {
		globalPlayer.dynamic_lyrics_toggle = true;
		globalPlayer.dynamic_lyrics_starting_times = arr["dynamic_lyrics_starting_times"];
		globalPlayer.lockLyricScroll = false;
		if (globalPlayer.currentPlayer.autoscrollButton.hasClass("locked")) globalPlayer.currentPlayer.autoscrollButton.removeClass("locked");
		if (globalPlayer.scrollToLyrics) {
			if (!globalPlayer.currentPlayer.autoscrollButton.hasClass("active")) globalPlayer.currentPlayer.autoscrollButton.addClass("active");
		} else {
			if (globalPlayer.currentPlayer.autoscrollButton.hasClass("active")) globalPlayer.currentPlayer.autoscrollButton.removeClass("active");
		}

		if (globalPlayer.currentMediaType == 1 || globalPlayer.currentMediaType == 2) {
			globalPlayer.currentPlayer.lyrics.html(arr["lyrics"]);
		} else {
			if (globalPlayer.canPlay == true) {
				globalPlayer.currentPlayer.lyrics.html(arr["lyrics"]);
				globalPlayer.lyricsHeight = globalPlayer.currentPlayer.lyrics.height();
			} 
			else {
				globalPlayer.currentPlayer.lyrics.html("<span class='lyric_segment noText'></span><span class='lyric_segment'>Loading Audio...</span><span class='lyric_segment noText'></span>");
				globalPlayer.lyricsHeight = globalPlayer.currentPlayer.lyrics.height();
			}

		}
	}
	
	if (globalPlayer.currentMediaType == 1 || globalPlayer.currentMediaType == 2) {
		globalPlayer.currentPlayer.shuffleImage.attr("src", shuffleStagesWhite[globalPlayer.shuffle]);
		globalPlayer.currentPlayer.loopImage.attr("src",loopStagesWhite[globalPlayer.loop]);
	} else {
		globalPlayer.currentPlayer.shuffleImage.attr("src", shuffleStagesDefault[globalPlayer.shuffle]);
		globalPlayer.currentPlayer.loopImage.attr("src",loopStagesDefault[globalPlayer.loop]);
	}

}
function resetPlayerAfterEdit() {
	console.log("resetPlayerAfterEdit");
	globalPlayer.background.attr("src", "assets/default_album_art.jpg");

	globalPlayer.currentPlayer.title.removeClass("smallerTitle");
	globalPlayer.currentPlayer.title.html("Choose a Song");
	globalPlayer.currentPlayer.artist.html("Artist");
	globalPlayer.currentPlayer.lyrics.empty();
	globalPlayer.currentPlayer.durationDisplay.text("--:--");
	globalPlayer.currentPlayer.timeDisplay.text("--:--");
	globalPlayer.currentPlayer.timeSlider.val(0);
	globalPlayer.currentPlayer.playButton.removeClass("hiddenControl");
	globalPlayer.currentPlayer.pauseButton.addClass("hiddenControl");

	globalPlayer.currentSong = -1;
	globalPlayer.currentAlbumArtist = -1;
	globalPlayer.currentAlbum = -1;
	globalPlayer.dynamic_lyrics_toggle = false;
	globalPlayer.dynamic_lyrics_starting_times = null;
	globalPlayer.canPlay = false;
	globalPlayer.current_time_index = -1;
	globalPlayer.current_time = "-3599999";
	globalPlayer.currentMediaType = -1;
	globalPlayer.startPadding = 0;
	globalPlayer.endPadding = 3599999;	
	globalPlayer.queue.length = 0;

	if (globalPlayer.currentMediaType == 0) {
		globalPlayer.currentPlayer.container.removeClass("closed");
		globalPlayer.currentPlayer.art.attr("src", "assets/default_album_art.jpg");
		globalPlayer.currentPlayer.lyrics.html("<span class='lyric_segment noText'></span><span class='lyric_segment'><i>Lyrics go Here</i></span><span class='lyric_segment'></span>");
	} else {
		globalPlayer.currentPlayer.container.addClass("closed");
		audio_player.playButton.removeClass("hiddenControl");
		audio_player.pauseButton.addClass("hiddenControl");
	}
}

function prepareLocalMedia(arr) {
	$(globalPlayer.currentPlayer.html).attr("src", arr["url"]);
	globalPlayer.currentPlayer.durationDisplay.html(arr["duration"]);
	loadLocalMedia(arr["id"], arr["url"], arr["lyrics"]);
	if (milliseconds($(globalPlayer.currentPlayer.html).prop("currentTime")) < globalPlayer.startPadding ) $(globalPlayer.html).prop("currentTime", revertFromMilliseconds(globalPlayer.startPadding));
	globalPlayer.currentPlayer.timeSlider.attr("max", globalPlayer.endPadding);
    globalPlayer.currentPlayer.timeSlider.val(milliseconds($(globalPlayer.currentPlayer.html).prop("currentTime")));
    globalPlayer.currentPlayer.timeSlider.val(globalPlayer.startPadding);
}

function abortMedia() {
	pauseMedia();
	if (globalPlayer.currentMediaType == 1) {
		clearInterval(globalPlayer.currentPlayer.embedTimeUpdateInterval);
		globalPlayer.currentPlayer.embedTimeUpdateInterval = null;
		globalPlayer.currentPlayer.player.a.remove();
		globalPlayer.currentPlayer.player = null;
		$("#video_embed_inner_container").find("#video_embed").remove();
		$("#video_embed_inner_container").append("<div id='video_embed'></div>");
	}
	else {
		$(globalPlayer.currentPlayer.html).bind('abort');
		$(globalPlayer.currentPlayer.html).trigger('abort');
		$(globalPlayer.currentPlayer.html).attr("src", "");
	}
	globalPlayer.currentPlayer.pauseButton.addClass("hiddenControl");
	globalPlayer.currentPlayer.playButton.removeClass("hiddenControl");
	globalPlayer.paused = true;
	globalPlayer.dynamic_lyrics_starting_times = null;
	globalPlayer.canPlay = false;
	globalPlayer.current_time_index = -1;
	globalPlayer.current_time = "-3599999";
	globalPlayer.startPadding = 0;
	globalPlayer.endPadding = 3599999;	
}

function loadLocalMedia(id, url, lyrics){
	$(globalPlayer.currentPlayer.html).bind("load");
	$(globalPlayer.currentPlayer.html).trigger('load');
	globalPlayer.currentPlayer.html.oncanplay = function() {
    	if (!globalPlayer.canPlay) {
			globalPlayer.currentPlayer.lyrics.html(lyrics);
			if (globalPlayer.currentMediaType == 0) globalPlayer.lyricsHeight = globalPlayer.currentPlayer.lyrics.height();
			globalPlayer.canPlay = true;
    	}
    }
}

function startMedia(time) {
	if(globalPlayer.currentMediaType == 1) globalPlayer.currentPlayer.player.playVideo();
	else $(globalPlayer.currentPlayer.html).trigger('play');
	if (globalPlayer.paused) {
		globalPlayer.currentPlayer.playButton.addClass("hiddenControl");
		globalPlayer.currentPlayer.pauseButton.removeClass("hiddenControl");
		globalPlayer.paused = false;
	}
}

function pauseMedia(){
	if(globalPlayer.currentMediaType == 1 && globalPlayer.currentPlayer.player.pauseVideo() != null ) globalPlayer.currentPlayer.player.pauseVideo();
	else $(globalPlayer.currentPlayer.html).trigger('pause');
	globalPlayer.currentPlayer.pauseButton.addClass("hiddenControl");
	globalPlayer.currentPlayer.playButton.removeClass("hiddenControl");
	globalPlayer.paused = true;
}


function forwardMedia(){
	pauseMedia();
	globalPlayer.current_time_index = -1;
	globalPlayer.current_time = "-3599999";
	var newTime;
	if (globalPlayer.currentMediaType == 1) {
		newTime = video_player.player.getCurrentTime() + 5;
		globalPlayer.currentPlayer.player.seekTo(newTime);
		globalPlayer.currentPlayer.timeSlider.val( milliseconds(newTime) );
	} else {
		newTime = $(globalPlayer.currentPlayer.html).prop("currentTime")+5;
		$(globalPlayer.currentPlayer.html).prop("currentTime", newTime);
		globalPlayer.currentPlayer.timeSlider.val( milliseconds(newTime) );
	}
	if (milliseconds(newTime) > globalPlayer.endPadding) nextMedia();
	else startMedia();
}

function backwardMedia(){
	pauseMedia();
	globalPlayer.current_time_index = -1;
	globalPlayer.current_time = "-3599999";
	var newTime;
	if (globalPlayer.currentMediaType == 1) {
		newTime = newTime = video_player.player.getCurrentTime() - 5
		globalPlayer.currentPlayer.player.seekTo(newTime);
		globalPlayer.currentPlayer.timeSlider.val( milliseconds(newTime) );
	}
	else {
		newTime = $(globalPlayer.currentPlayer.html).prop("currentTime") - 5;
		$(globalPlayer.currentPlayer.html).prop("currentTime",newTime);
		globalPlayer.currentPlayer.timeSlider.val( milliseconds($(globalPlayer.currentPlayer.html).prop("currentTime")-5) );
	}
	if (milliseconds(newTime) < globalPlayer.startPadding) previousMedia();
	else startMedia();
}

function nextMedia() {
	globalPlayer.canPlay = false;
	globalPlayer.current_time_index = -1;
	globalPlayer.current_time = "-3599999";
	pauseMedia();
	
	var savedId = globalPlayer.queue[0];
	$("#left_content").find(".selected").removeClass("selected");
	globalPlayer.queue.shift();

	if (globalPlayer.loop == 0) {
		globalPlayer.currentPlayer.pauseButton.addClass("hiddenControl");
		globalPlayer.currentPlayer.playButton.removeClass("hiddenControl");
		globalPlayer.paused = true;
	} else if (globalPlayer.loop == 1) {
		globalPlayer.queue.push(savedId);
		if (globalPlayer.currentMediaType == 1) {
			globalPlayer.currentPlayer.player.seekTo(0);
		} else {
			$(globalPlayer.currentPlayer.html).prop('currentTime', revertFromMilliseconds(globalPlayer.startPadding));
			globalPlayer.canPlay = true;
			startMedia();
		}
		$("#left_content").find(".song[data-id='"+globalPlayer.queue[0]+"']").addClass("selected");
	} else {
		if (globalPlayer.queue.length == 0) openMedia(savedId);
		else openMedia(globalPlayer.queue[0]);
		if (globalPlayer.currentMediaType == 0 || globalPlayer.currentMediaType == 2) startMedia();
		globalPlayer.queue.push(savedId);
		$("#left_content").find(".song[data-id='"+globalPlayer.queue[0]+"']").addClass("selected");
	}
}

function previousMedia() {
	globalPlayer.canPlay = false;
	globalPlayer.current_time_index = -1;
	globalPlayer.current_time = "-3599999";
	pauseMedia();

	var savedId = globalPlayer.queue[0];
	$("#left_content").find(".selected").removeClass("selected");

	if (globalPlayer.loop == 0) {
		globalPlayer.queue.shift();
		globalPlayer.currentPlayer.pauseButton.addClass("hiddenControl");
		globalPlayer.currentPlayer.playButton.removeClass("hiddenControl");
		globalPlayer.paused = true;
	} else if (globalPlayer.loop == 1) {
		globalPlayer.queue.shift();
		globalPlayer.queue.push(savedId);
		if (globalPlayer.currentMediaType == 1) {
			globalPlayer.currentPlayer.player.seekTo(0);
		} else {
			timeAdjust(globalPlayer.startPadding);
			globalPlayer.canPlay = true;
			startMedia();
		}
		$("#left_content").find(".song[data-id='"+globalPlayer.queue[0]+"']").addClass("selected");
	} else { // loop == 2, or all
		savedId = globalPlayer.queue[globalPlayer.queue.length-1];
		globalPlayer.queue.splice(globalPlayer.queue.length-1, 1);
		openMedia(savedId);
		if (globalPlayer.currentMediaType == 0 || globalPlayer.currentMediaType == 2) startMedia();
		globalPlayer.queue.unshift(savedId);
		$("#left_content").find(".song[data-id='"+globalPlayer.queue[0]+"']").addClass("selected");
	}
}

function timeAdjust(time) {
	/* time is in milliseconds */
    /* Adjusts the current time of the audio - works in tandem with other functions, isn't called simply by clicking on an element */
	pauseMedia();
	var thisTime = time;

	if ( parseInt(thisTime) < parseInt(globalPlayer.startPadding) ) thisTime = globalPlayer.startPadding;
	else if ( parseInt(thisTime) > parseInt(globalPlayer.endPadding) ) thisTime = globalPlayer.endPadding;
    $(globalPlayer.currentPlayer.html).prop("currentTime", revertFromMilliseconds(thisTime));
    globalPlayer.current_time_index = -1;
    globalPlayer.current_time = "-3599999";
	startMedia();
}


function volumeAdjust(volume) {
	globalPlayer.currentPlayer.volumeSlider.val(volume);
	globalPlayer.volume = volume;
	if (volume == 0) 		globalPlayer.currentPlayer.volumeImage.attr("src", "assets/mute.png");
	else if (volume < 33) 	globalPlayer.currentPlayer.volumeImage.attr("src", "assets/volume_1.png");
	else if (volume < 66) 	globalPlayer.currentPlayer.volumeImage.attr("src", "assets/volume_2.png");
	else 					globalPlayer.currentPlayer.volumeImage.attr("src", "assets/volume_3.png");
	if (globalPlayer.currentMediaType == 1) globalPlayer.currentPlayer.player.setVolume(volume);
	else $(globalPlayer.currentPlayer.html).prop("volume", volume/100 );
}

function autoscrollToggle() {
	if (!globalPlayer.lockLyricScroll) {
		if ( audio_player.autoscrollButton.hasClass("active") ) {
			audio_player.autoscrollButton.removeClass("active");
			audio_player.lyrics.find(".selected").removeClass('selected');
		} 
		else audio_player.autoscrollButton.addClass("active");
		globalPlayer.scrollToLyrics = !globalPlayer.scrollToLyrics;
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
		editForm.video_id_container.addClass("hidden");
		editForm.padding_container.removeClass("hidden");
		editForm.start_padding.val(arr.start_padding);
		editForm.end_padding.val(arr.end_padding);
		editForm.lyrics_types.removeClass("hidden");
		editForm.dynamic_lyrics_radio.removeClass("hidden");
		editForm.simple_lyrics_radio.removeClass("hidden");
		if (arr.medium == 2) {
			if ( !$("#edit_media_nav_art").hasClass("hidden") )  $("#edit_media_nav_art").addClass("hidden");
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
			editForm.alternative_art_activator.show().text("Use other media's artwork");
			editForm.art_display.removeClass("hidden");
			editForm.art.removeClass("hidden");
			editForm.art_edit.removeClass("hidden");
			if ( $("#edit_media_nav_art").hasClass("hidden") )  $("#edit_media_nav_art").removeClass("hidden");
			if (arr.art != null) editForm.art_temp = arr.art +"#"+ new Date().getTime();
			else editForm.art_temp = "assets/default_album_art.jpg";
			editForm.art_display.attr("src", editForm.art_temp);
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
	lyric_seg_html = $('<div/>', {'id':'dynamic_lyrics_segment_'+id,	'class':'dynamic_lyrics_segment'}).appendTo(editForm.dynamic_lyrics_inner_container);
	
	$('<span/>', {'class':'dynamic_lyrics_segment_remove',	'data-id':id}).text("X").appendTo(lyric_seg_html);				
	inner_div = $('<div/>', {'class':'dynamic_lyrics_segment_settings'}).appendTo(lyric_seg_html);
	
	$('<input>', {'class':'dynamic_lyrics_time',	'type':'text',	'name':'dynamic_lyrics_times['+id+']',	'placeholder':'Start Time',	'value':time}).appendTo(inner_div);
	editForm.dynamic_lyrics_prev_time = time;							
	
	$('<input>', {'class':'dynamic_lyrics_style',	'type':'text',	'name':'dynamic_lyrics_styles['+id+']',	'placeholder':'Color',	'value':style}).appendTo(inner_div);

	notext_div = $('<div/>', {'class':'dynamic_lyrics_notext_container'}).appendTo(inner_div);
										
	notext_input = $('<input>', {'id':'dynamic_lyrics_notext_'+id,	'class':'dynamic_lyrics_notext',	'type':'checkbox',	'name':'dynamic_lyrics_notexts['+id+']'}).appendTo(notext_div);
	if ( notext ) notext_input.prop("checked", true);
	
	$('<label/>', {'class':'dynamic_lyrics_notext_label',	'for':'dynamic_lyrics_notext_'+id}).text("No Text").appendTo(notext_div);
										
	inner_textarea = $('<textarea/>', {'class':'dynamic_lyrics_edit',	'name':'dynamic_lyrics_edits['+id+']',	'placeholder':'Lyric Segment',	'rows':'1'}).html(text).appendTo(lyric_seg_html);
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
	globalPlayer.mainContainer.addClass("right_opened");
	editForm.status = true;
}
function closeEdit() {
	editForm.parent.removeClass("opened");
	editForm.close.removeClass("opened");
	editForm.form.removeClass("opened");
	editAlbumArtForm.form.removeClass("opened");
	globalPlayer.mainContainer.removeClass("right_opened");
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
    	error: function(jqXHR, textStatus, errorThrown) {	alert('AJAX Error on Editing Media Icon:\n' + errorThrown);	}
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
		if (response.success) {
			if (close) closeEdit();
			var flag = false;
			if (id == globalPlayer.currentSong) {
				if (reload == 1) resetPlayerAfterEdit();
				else flag = true;
			}
			if (deleted) id = -1;
			getAllMedia(flag, true, id);
		} 
		else alert('Error on Editing Media:\n' + response.message);
	}).fail(function(jqXHR, textStatus, errorThrown) {	alert('AJAX Error on Editing Media:\n' + textStatus);	});
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
		if ( thisArt[1] != "success" ) return alert("AJAX Error on Retrieving Album Art For Edit");
		else if ( allArt[1] != "success" ) return alert('AJAX errors w/ grabbing all art for album art edit');
		editAlbumArtForm.temp = (thisArt[0]["art"] != null) ? thisArt[0]["art"] : 'assets/default_album_art.jpg';
		editAlbumArtForm.display.attr("src", editAlbumArtForm.temp + "#" + new Date().getTime());
		if ( editAlbumArtForm.array != allArt[0]["data"] ) {
			editAlbumArtForm.array = allArt[0]["data"];
			var alternative_html;
			for (var index in allArt[0]["data"]) {
				alternative_html = "<div class=\"alternate_art_container_for_album_art_edit\"><img class=\"alternate_art_preview\" src=\""+allArt[0]["data"][index]+"\" alt=\"\"><input type=\"radio\" class=\"alternate_art_radio\" id=\"alternate_art_for_album_art_edit_"+index+"\" name=\"alternate_art_for_album_art_edit\" value=\""+index+"\"><label for=\"alternate_art_for_album_art_edit_"+index+"\" class=\"alternate_art_label\" data-id=\""+index+"\"></label></div>";
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
	globalPlayer.mainContainer.addClass("right_opened");
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
	for (var id in globalPlayer.database) {
		if ( globalPlayer.database[id]["title"].toLowerCase().includes(text.toLowerCase()) ) search_matches.push(id);
	}
	return search_matches.length > 0;
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
	}).fail(function(jqXHR, textStatus, errorThrown) {	alert('ERRORS @ Adding New Media: ' + textStatus);	});
}

function initialize_video() {
	globalPlayer.currentPlayer.durationDisplay.text(formatTime( globalPlayer.currentPlayer.player.getDuration() ));
	globalPlayer.currentPlayer.loopImage.attr("src", loopStagesWhite[globalPlayer.loop]);
	globalPlayer.currentPlayer.timeSlider.attr("max", milliseconds(globalPlayer.currentPlayer.player.getDuration()));
	globalPlayer.currentPlayer.timeDisplay.text( readableDuration(globalPlayer.currentPlayer.player.getCurrentTime() * 1000) );
	volumeAdjust(globalPlayer.volume);
	globalPlayer.startPadding = ( globalPlayer.startPadding != null && globalPlayer.startPadding >= 0 ) ? globalPlayer.startPadding : 0;
	globalPlayer.endPadding = ( globalPlayer.endPadding != null && globalPlayer.endPadding > 0 ) ? globalPlayer.endPadding : milliseconds(globalPlayer.currentPlayer.player.getDuration());
	clearInterval(globalPlayer.currentPlayer.embedTimeUpdateInterval);
	startMedia();
	globalPlayer.currentPlayer.embedTimeUpdateInterval = setInterval(function () {
        if (!globalPlayer.currentPlayer.lock_time_slider) onTimeUpdate(null, globalPlayer.currentPlayer.player.getCurrentTime())
    }, 100);
}

function formatTime(time){
    time = Math.round(time);
    var minutes = Math.floor(time / 60),
    seconds = time - minutes * 60;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    return minutes + ":" + seconds;
}

function videoAutoscrollToggle() {
	if (!globalPlayer.lockLyricScroll) {
		if ( video_player.autoscrollButton.hasClass("active") ) {
			video_player.autoscrollButton.removeClass("active");
			video_player.lyrics.find(".selected").removeClass('selected');
		} 
		else video_player.autoscrollButton.addClass("active");
		globalPlayer.scrollToLyrics = !globalPlayer.scrollToLyrics;
	}
}

$(document).ready(function() {
	/* Setting Global Variables */
	globalPlayer = {
		mainContainer:$("#main"),
		background: $("#player_background"),
		mediaContainer: $("#media_container"),
		currentPlayer:null,
		currentSong:-1,
		currentAlbum:-1,
		currentAlbumArtist:-1,
		currentMediaType:-1,
		scrollToLyrics:true,
		lockLyricScroll:false,
		paused:true,
		loop:1,
		shuffle:0,
		dynamic_lyrics_toggle:false,
		dynamic_lyrics_starting_times:null,
		current_time:"-3599999",
		current_time_index:-1,
		startPadding:0,
		endPadding:3599999,
		canPlay:false,
		volume:100,
		lyricsHeight:0,
		database: [],
		queue: []
	};
	audio_player = {
		container: $("#player_container"),
		html: document.getElementById("audio"),
		title: $("#player_title"),
		artist: $("#player_artist"),
		timeSlider: $("#time_slider"),
		timeDisplay: $("#curTime"),
		durationDisplay: $("#duration"),
		playButton: $("#play"),
		pauseButton: $("#pause"),
		previousButton: $("#previous"),
		nextButton: $("#next"),
		loopButton: $("#repeat"),
		loopImage: $("#repeat_image"),
		shuffleButton: $("#shuffle"),
		shuffleImage: $("#shuffle_image"),
		backFiveButton: $("#backFive"),
		forwardFiveButton: $("#forwardFive"),
		volumeSlider: $("#volume"),
		volumeImage: $("#volume_image"),
		optionsButton: $("#options"),
		autoscrollButton: $("#player_lyrics_autoscroll"),
		lyrics: $("#player_lyrics"),

		player_and_lyrics: $("#player_art_and_lyrics"),
		art: $("#player_art")
	};
	video_player = {
		container: $("#video_container"),
		html: document.getElementById("localVideo"),
		title: $("#video_title"),
		artist: $("#video_artist"),
		timeSlider: $("#video_time_slider"),
		timeDisplay: $("#video_curTime"),
		durationDisplay: $("#video_duration"),
		playButton: $("#video_play"),
		pauseButton: $("#video_pause"),
		previousButton: $("#video_previous"),
		nextButton: $("#video_next"),
		loopButton: $("#video_repeat"),
		loopImage: $("#video_repeat_image"),
		shuffleButton: $("#video_shuffle"),
		shuffleImage: $("#video_shuffle_image"),
		backFiveButton: $("#video_backFive"),
		forwardFiveButton: $("#video_forwardFive"),
		volumeSlider: $("#video_volume"),
		volumeImage: $("#video_volume_image"),
		optionsButton: $("#video_options"),
		autoscrollButton: $("#video_lyrics_autoscroll"),
		lyrics: $("#video_lyrics_inner_container"),

		player: null,
		embed: $("#video_embed"),
		lyrics_parent: $("#video_lyrics_container"),
		lock_time_slider: false,
		embedTimeUpdateInterval: null,
		controls_container: $("#video_extras_container")
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
	globalPlayer.currentPlayer = audio_player;
	getAllMedia(false, false, -1);

	/* User-related actions */
	window.onkeydown = function(e) {
		if ( e.keyCode == 32 && (e.target.tagName.toUpperCase() != 'INPUT') && (e.target.tagName.toUpperCase() != 'TEXTAREA') ) {
			e.preventDefault();
			if (globalPlayer.currentSong != -1) {
				if (globalPlayer.paused) startMedia();
				else pauseMedia();
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
			$(globalPlayer.currentPlayer.html).trigger('play'); 
			if (globalPlayer.paused) {
				globalPlayer.currentPlayer.playButton.addClass("hiddenControl");
				globalPlayer.currentPlayer.pauseButton.removeClass("hiddenControl");
				globalPlayer.paused = false;
			}
		} else if (medium == 2) {
			$(globalPlayer.currentPlayer.html).trigger('play');
			if (globalPlayer.paused) {
				globalPlayer.currentPlayer.playButton.addClass("hiddenControl");
				globalPlayer.currentPlayer.pauseButton.removeClass("hiddenControl");
				globalPlayer.paused = false;
			}
		}
	});
	$(document).on("click", ".song_options", function(event) {
		event.stopPropagation();
		var parent = $(this).parent();
		var curId = parent.attr("data-id");
		var curEditingId = editForm.songId.val();
		if (!editForm.status) startEdit(curId);
		else if (globalPlayer.currentSong != curId) {
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
			globalPlayer.mainContainer.addClass("left_opened");
			$(this).text("Close");
		} else {
			$("#left").addClass("closed");
			globalPlayer.mainContainer.removeClass("left_opened");
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
	audio_player.optionsButton.on("click", function() {
		if (!editForm.status) startEdit(globalPlayer.currentSong);
		else {
			var curId = editForm.songId.val();
			if (curId != globalPlayer.currentSong) startEdit(globalPlayer.currentSong);
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
	editForm.submit.on('click', function(e) { editIcon(e); });
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
		}).fail(function(jqXHR, textStatus, errorThrown) {	alert('ERRORS @ Adding New Media: ' + errorThrown);	});
	});
	$(document).on("click", ".addAlbumArt_button", function() {	startAlbumArtEdit( parseInt($(this).attr("data-id")) );	});	
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
	audio_player.playButton.on('click', startMedia);
	audio_player.pauseButton.on('click', pauseMedia);
	audio_player.loopButton.on("click", function() {
		globalPlayer.loop = (globalPlayer.loop == 2) ? 0 : globalPlayer.loop + 1;
		audio_player.loopImage.attr("src", loopStagesDefault[globalPlayer.loop]);
		loadQueue();
	});
	audio_player.shuffleButton.on("click", function(){
		globalPlayer.shuffle = (globalPlayer.shuffle == 1) ? 0 : 1;
		audio_player.shuffleImage.attr("src", shuffleStagesDefault[globalPlayer.shuffle]);
		loadQueue();
	});
	audio_player.volumeSlider.on( "input", function() { volumeAdjust($(this).val()); 	});
	audio_player.timeSlider.on("input", function() { 	timeAdjust( $(this).val() );	});	/* Moving the slider adjusts the audio's time */
	$(audio_player.html).on("ended", nextMedia);
	audio_player.previousButton.on("click", previousMedia);
	audio_player.nextButton.on("click", nextMedia);
	audio_player.forwardFiveButton.on("click", forwardMedia);
    audio_player.backFiveButton.on("click", backwardMedia);
	audio_player.autoscrollButton.on("click", autoscrollToggle);

	
	/* Video Player-related functions */
	video_player.timeSlider.on("mousedown touchstart", function(e) { video_player.lock_time_slider = true; });
	video_player.timeSlider.on('mouseup touchend', function (e) {
		if (globalPlayer.currentMediaType == 1) {
			var unPauseVideo = false;
			if (!globalPlayer.paused)	{
				pauseMedia();
				unPauseVideo = true;
			}
			//console.log(e.target.value);
	    	var newTime = e.target.value;
			globalPlayer.currentPlayer.player.seekTo(revertFromMilliseconds(newTime));
			if ( unPauseVideo ) startMedia();
		} else if (globalPlayer.currentMediaType == 2) {
			timeAdjust( $(this).val() );
		}
		video_player.lock_time_slider = false;
	});
	video_player.playButton.on('click', startMedia);
    video_player.pauseButton.on('click', pauseMedia);
    video_player.loopButton.on("click", function() {
    	globalPlayer.loop = ( globalPlayer.loop == 2 ) ? 0 : globalPlayer.loop + 1;
    	video_player.loopImage.attr("src", loopStagesWhite[globalPlayer.loop]);
    	if (globalPlayer.loop == 1 && globalPlayer.currentMediaType == 1) video_player.player.setLoop();
    	loadQueue();
    });
    video_player.shuffleButton.on("click", function(){
    	globalPlayer.shuffle = (globalPlayer.shuffle == 1) ? 0 : 1
		video_player.shuffleImage.attr("src", shuffleStagesWhite[globalPlayer.shuffle]);
		loadQueue();
	});
	video_player.volumeSlider.on( "input", function() { volumeAdjust($(this).val()); 	});
    video_player.previousButton.on("click", previousMedia);
    video_player.nextButton.on("click", nextMedia);
    video_player.forwardFiveButton.on("click", forwardMedia);
    video_player.backFiveButton.on("click", backwardMedia);
    video_player.optionsButton.on("click", function()  {
    	if (!editForm.status) startEdit(globalPlayer.currentSong);
		else {
			var curId = editForm.songId.val();
			if (curId != globalPlayer.currentSong) startEdit(globalPlayer.currentSong);
			else closeEdit();
		}
    });
    video_player.autoscrollButton.on('click', videoAutoscrollToggle);
});

