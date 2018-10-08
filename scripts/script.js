//var database = [];

/* Youtube Setup - If no online connection detected, then all youtube embedded entries are not available */
var onlineConnection = false;
function onYouTubeIframeAPIReady() {
	console.log("YouTube API Ready");
	onlineConnection = true;
}

function isArray(a) {	return Object.prototype.toString.call(a) === "[object Array]";	}

/* creates new HTML elements and returns them - otherwise returns a 'false' */
function make(desc) {
	// Probably a good idea to check if 'desc' is an array, but this can be done later;
	if ( !isArray(desc) ) return false;
	var tag = desc[0], attributes = desc[1];
	var el = document.createElement(tag);
	var start = 1;
	if ( (attributes!=null) && (typeof attributes === 'object') && !isArray(attributes) ) {
		for (var attr in attributes) {
			if (attr == 'class') el.className = attributes[attr];
			else if (attr == 'checked') el.checked = attributes[attr];
			else if (attr == 'html') el.innerHTML = attributes[attr];
			else el.setAttribute(attr, attributes[attr]);
		}
		start = 2;
	}
	for (var i = start; i < desc.length; i++) {
		if (isArray(desc[i])) el.appendChild(make(desc[i]));
		else el.appendChild(document.createTextNode(desc[i]));
	}
	return el;
}

/* Get the duration or current time of a song in minutes:seconds instead of just seconds	*/
function readableDuration(milliseconds) {
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
function milliseconds(seconds) {
	return Math.floor(seconds*1000);
}
function revertFromMilliseconds(millisec) {
	return millisec / 1000;
}

function setBackground(img, backgroundElement = null, blur = 3) {
	var canvas = ( backgroundElement && backgroundElement.tagName === 'CANVAS' ) ? backgroundElement : make(['canvas',{style:'position:absolute;width:100%;height:100%;top:0;bottom:0;left:0;right:0;background-color:transparent;'}]);
	var ctx = canvas.getContext('2d');
	ctx.filter = 'blur('+blur+'px)';
	var imgObj = new Image();
	imgObj.src = img + '#' + new Date().getTime();
	imgObj.onload = function() {
		ctx.drawImage(	imgObj,	canvas.width / 2 - imgObj.width / 2,	canvas.height / 2 - imgObj.height / 2);
	}
	return canvas;
}

var globalPlayer, audio_player, video_player, editForm, editAlbumArtForm, embedForm, iconEdit, iconEditSet = 0, left_close = false;
var screenHeight = window.innerHeight;
var search_element, searchResults, search_options_element, search_text, search_option, searching_boolean = true, search_matches = [];
var loopStagesDefault = ["assets/repeat_0.png", "assets/repeat_1.png", "assets/repeat_all.png"];
var loopStagesWhite = ["assets/repeat_0_white.png", "assets/repeat_1_white.png", "assets/repeat_all_white.png"];
var shuffleStagesDefault = ["assets/shuffle_0.png", "assets/shuffle_1.png"];
var shuffleStagesWhite = ["assets/shuffle_0_white.png", "assets/shuffle_1_white.png"];

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
	$.ajax({
		url: 'scripts/getAllMedia.php',  
		type: 'GET', 
		dataType: 'json'
	}).done(function(response) {
		if (response.success) {
			setDatabaseInScript(response['raw_data']);
			if (print) {
				globalPlayer.leftSongs.innerHTML = '';
				globalPlayer.leftSongs.style.display = 'none';
				printMedia(response['sorted_data'], updateCurrentPlayer, scrollTo);
			}
			setTimeout(function() {
				if (!onlineConnection) $('.song[data-medium=1]').remove();
			}, 500);
		} 
		else alert(response.message);
	}).fail(function(jqXHR, textStatus, errorThrown) {
		alert('ERRORS @ Getting All Media: ' + errorThrown);
		location.reload(true);
	}).always(function() {	
		$(globalPlayer.leftSongs).show();	
	});
}
function setDatabaseInScript(raw) {
	globalPlayer.database = raw;
	console.log(globalPlayer.database);
}

function printMedia(sortedDatabase, updateCurrentPlayer = false, scrollTo = -1) {
	var html, albumHTML, albumSongList;
	for (var index in sortedDatabase) {
		html = make([ 'div', { class:'album_artist_div' }, [ 'h1', {class:'album_artist_name'}, sortedDatabase[index]['name'] ] ]);
		for(var album in sortedDatabase[index]['albums']) {
			albumHTML = make(['div',{class:'album'},['div',{class:'album_header'},['div',{class:'album_image_container'},['img',{class:'album_image',src:sortedDatabase[index]['albums'][album]['art']+'#'+ new Date().getTime(),alt:''}],['div',{class:'addAlbumArt_button','data-id':sortedDatabase[index]['albums'][album]['id']}]],['div',{class:'albumArtistContainer'},['h2',album]]]]);
			albumSongList = make(['div',{class:'albumSongList'}]);
			sortedDatabase[index]['albums'][album]['songs'].forEach(function(d, index) {
				var attributes = { class:'song', id:d['id'], 'data-id':d['id'], 'data-medium':d['medium']}
				if (d['medium'] == 1) albumSongList.appendChild( make([ 'div', attributes, [ 'img', { class:'video_icon', src:'assets/youtube.png', alt:'YouTube' } ], [ 'span', { class:'video_title' }, d['title'] ], [ 'span', { class:'video_artist' }, d['artist'] ], [ 'img', { class:'song_options', src:'assets/options.png', alt:'Song Options' } ] ]) );
				else albumSongList.appendChild( make([ 'div', attributes, [ 'span', { class:'song_title' }, d['title'] ], [ 'span', { class:'song_artist' }, d['artist'] ], [ 'img', { class:'song_options', src:'assets/options.png', alt:'Song Options' } ] ]));
			});
			albumHTML.appendChild(albumSongList);
			html.appendChild(albumHTML);
		}
		globalPlayer.leftSongs.appendChild(html);
	}
	if ( scrollTo != -1 ) {
		var elmnt = document.getElementById(scrollTo);
		$(elmnt).addClass("edited");
		globalPlayer.leftSongs.scrollTo({
		    'behavior': 'smooth',
		    'top': elmnt.offsetTop - (screenHeight/2) + (elmnt.offsetHeight/2)
		});
		$(document.getElementById(globalPlayer.currentSong)).addClass("selected");
		if (updateCurrentPlayer) updateCurrent();
	}
}
function updateCurrent() {
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
				setBackground(arr["art"], globalPlayer.background);

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
			document.getElementById(arr['id']).classList.add('selected');
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
			setBackground(response, globalPlayer.background);
			img = response;
		} else {
			console.log("Image Art Not Found - Using Default");
			audio_player.art.attr("src", "media_player/assets/default_album_art.jpg");
			setBackground('assets/default_album_art.jpg', globalPlayer.background);
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
	}).fail(function(jqXHR, textStatus, errorThrown) {	alert('ERRORS @ Saving Media Art: ' + errorThrown);	});
}

function createLoop(albumId, songId, albumArtistId, shuffle) {
	var data = 'albumId='+albumId+'&songId='+songId+'&albumArtistId='+albumArtistId+'&shuffle='+shuffle;
	$.ajax({
		url: 'scripts/createLoop.php', 
		data: data, 
		type: 'POST', 
		dataType: 'json'
	}).done(function(response) {
		if (response.success) addToLoop(response.loop);
		else alert('Ajax returned error: ' + response.message);
	}).fail(function(jqXHR, textStatus, errorThrown) {	alert('ERRORS @ CREATING LOOP: ' + errorThrown);	});
}
function addToLoop(arr) {
	globalPlayer.queue.length = 0;
	if (arr.length > 0) {
		var ind = arr.indexOf(parseInt(globalPlayer.currentSong));
		for (var i = ind; i < arr.length; i++) globalPlayer.queue.push(arr[i]);		
		if (ind != 0) for (var k = 0; k < ind; k++) globalPlayer.queue.push(arr[k]);
	}
	console.log(globalPlayer.queue);
}

function loadQueue() {
	if (globalPlayer.loop == 2) createLoop(globalPlayer.currentAlbum, globalPlayer.currentSong, globalPlayer.currentAlbumArtist, globalPlayer.shuffle);
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
		setBackground(arr["art"], globalPlayer.background);
		globalPlayer.currentPlayer = audio_player;
		if (arr["art"] == null) getImageArt(arr["id"]);
		else {
			globalPlayer.currentPlayer.art.attr("src", arr["art"]+"#"+ new Date().getTime());
			setBackground(arr["art"], globalPlayer.background);
		}
		globalPlayer.currentPlayer.title.html(arr["title"]);
		if (globalPlayer.currentPlayer.title.height() > 100) globalPlayer.currentPlayer.title.addClass("smallerTitle");
		volumeAdjust(globalPlayer.volume);
	}

	globalPlayer.currentPlayer.artist.html(arr["artist"]);
	globalPlayer.currentPlayer.lyrics.html('');
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
		globalPlayer.currentPlayer.shuffleButton.attr("src", shuffleStagesWhite[globalPlayer.shuffle]);
		globalPlayer.currentPlayer.loopButton.attr("src",loopStagesWhite[globalPlayer.loop]);
	} else {
		globalPlayer.currentPlayer.shuffleButton.attr("src", shuffleStagesDefault[globalPlayer.shuffle]);
		globalPlayer.currentPlayer.loopButton.attr("src",loopStagesDefault[globalPlayer.loop]);
	}
}
function resetPlayerAfterEdit() {
	setBackground('assets/default_player_background.jpg', globalPlayer.background);

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
	var curSel = globalPlayer.leftSongs.querySelectorAll('.selected')[0];
	if (curSel.length > 0) curSel[0].classList.remove('selected');
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
		document.getElementById(globalPlayer.queue[0]).classList.add('selected');
	} else {
		if (globalPlayer.queue.length == 0) openMedia(savedId);
		else openMedia(globalPlayer.queue[0]);
		if (globalPlayer.currentMediaType == 0 || globalPlayer.currentMediaType == 2) startMedia();
		globalPlayer.queue.push(savedId);
		document.getElementById(globalPlayer.queue[0]).classList.add('selected');
	}
}

function previousMedia() {
	globalPlayer.canPlay = false;
	globalPlayer.current_time_index = -1;
	globalPlayer.current_time = "-3599999";
	pauseMedia();

	var savedId = globalPlayer.queue[0];
	var curSel = globalPlayer.leftSongs.querySelectorAll('.selected')[0];
	curSel.classList.remove('selected');

	if (globalPlayer.loop == 0) {
		globalPlayer.queue.shift();
		globalPlayer.currentPlayer.pauseButton.addClass("hiddenControl");
		globalPlayer.currentPlayer.playButton.removeClass("hiddenControl");
		globalPlayer.paused = true;
	} else if (globalPlayer.loop == 1) {
		globalPlayer.queue.shift();
		globalPlayer.queue.push(savedId);
		if (globalPlayer.currentMediaType == 1) globalPlayer.currentPlayer.player.seekTo(0);
		else {
			timeAdjust(globalPlayer.startPadding);
			globalPlayer.canPlay = true;
			startMedia();
		}
		document.getElementById(globalPlayer.queue[0]).classList.add('selected');
	} else { // loop == 2, or all
		savedId = globalPlayer.queue[globalPlayer.queue.length-1];
		globalPlayer.queue.splice(globalPlayer.queue.length-1, 1);
		openMedia(savedId);
		if (globalPlayer.currentMediaType == 0 || globalPlayer.currentMediaType == 2) startMedia();
		globalPlayer.queue.unshift(savedId);
		document.getElementById(globalPlayer.queue[0]).classList.add('selected');
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
		console.log(response);
		if (response.success) prepareEdit(response.info);
		else alert(response.message);
	}).fail(function(jqXHR, textStatus, errorThrown) {
		alert('ERRORS @ Opening Media For Edit: ' + errorThrown);
	}).always(openEdit);
}
function prepareEdit(arr) {
	iconEditSet = 0;
	iconEdit = null;

	editForm.songId.val(arr.id);
	editForm.medium.val(arr.medium);
	editForm.title.val(arr.title);
	editForm.artist.val(arr.artist);
	editForm.album.val(arr.album_name);
	editForm.album_artist.val(arr.album_artist_name);
	editForm.composer.val(arr.composer);

	if (arr.art != null) editForm.art_temp = arr.art +"#"+ new Date().getTime();
	else editForm.art_temp = "assets/default_album_art.jpg";
	editForm.art_display.attr("src", editForm.art_temp);
	if ( arr.medium == 0 ) {
		editForm.video_id_container.hide();
		editForm.lyricsSettings.show();
		editForm.convertLyricsActivator.show();

		editForm.padding_container.show();
		editForm.start_padding.val(arr.start_padding);
		editForm.end_padding.val(arr.end_padding);

		editForm.simple_lyrics.text(arr.simpleLyrics);
		var seg = arr.dynamicLyrics;
		editForm.dynamic_lyrics_inner_container.empty();
		if (seg.length > 0) {
			console.log(seg);
			for (var lyric_seg in seg) {
				console.log(seg);
				editForm.dynamic_lyrics_index = parseInt(lyric_seg);
				editForm.dynamic_lyrics_inner_container[0].appendChild(dynamicLyricSegmentForEdit(lyric_seg, seg[lyric_seg]["time"], seg[lyric_seg]["style"], seg[lyric_seg]["no_text"], seg[lyric_seg]["text"]));
			}
		}

		if (arr.dynamic_lyrics_toggle == 1) {
			editForm.lyricsSettingsSimpleRadio.checked = false;
			editForm.lyricsSettingsDynamicRadio.checked = true;
			editForm.lyricsSimpleContainer.removeClass('selected');
			editForm.lyricsDynamicContainer.addClass('selected');
			editForm.convertLyricsActivator.text('=> Import from Simple Lyrics');
			editForm.openedLyrics = 1;
		} else {
			editForm.lyricsSettingsSimpleRadio.checked = true;
			editForm.lyricsSettingsDynamicRadio.checked = false;
			editForm.lyricsSimpleContainer.addClass('selected');
			editForm.lyricsDynamicContainer.removeClass('selected');
			editForm.convertLyricsActivator.text('Import from Dynamic Lyrics <=');
			editForm.openedLyrics = 0;
		}
	}
	else {

		editForm.padding_container.hide();

		if (arr.medium == 1) {
			editForm.video_id.val(arr.url);
			editForm.video_id_container.show();
		} else {
			editForm.video_id_container.hide();
		}
		editForm.lyricsSettings.hide();
		editForm.lyricsSettingsSimpleRadio.checked = false;
		editForm.lyricsSettingsDynamicRadio.checked = true;
		editForm.lyricsSimpleContainer.removeClass('selected');
		editForm.lyricsDynamicContainer.addClass('selected');
		editForm.convertLyricsActivator.hide();
		editForm.openedLyrics = 1;
		var seg = arr.dynamicLyrics;
		if (seg.length > 0) {
			for (var lyric_seg in seg) {
				editForm.dynamic_lyrics_index = parseInt(lyric_seg);
				editForm.dynamic_lyrics_inner_container[0].appendChild(dynamicLyricSegmentForEdit(lyric_seg, seg[lyric_seg]["time"], seg[lyric_seg]["style"], seg[lyric_seg]["no_text"], seg[lyric_seg]["text"]));
			}
		}
	}
}
function convertLyrics() {
	var current = editForm.openedLyrics;
	var allSegments = [];
	var thisString = '';
	if (current == 0) {
		$.each($('#editMediaForm .dynamicLyricsEdit'), function(d,elmnt) {
			allSegments.push(elmnt.value);
		});
		thisString = allSegments.join('\n');
		editForm.simple_lyrics.empty().val(thisString);
		return;
	}
	else if (current == 1) {
		thisString = editForm.simple_lyrics.val();
		allSegments = thisString.split('\n\n');
		editForm.dynamic_lyrics_inner_container.empty();
		allSegments.forEach(function(d,index) {
			editForm.dynamic_lyrics_inner_container[0].appendChild(dynamicLyricSegmentForEdit(index, '', '', '', d));
			editForm.dynamic_lyrics_index = index;
		});
		return;
	}
	else return;
}
function dynamicLyricSegmentForEdit(id, time = "", style = "", notext = true, text = "") {
	var lyricSegHTML = make(
		[
			'div',
			{id:'dynamic_lyrics_segment_'+id,class:'segmentContainer dynamicLyricsSegment'},
			[
				'span',
				{'class':'dynamicLyricsSegmentAddAbove'},
				'Add Segment Above'
			],
			[
				'span',
				{class:'cancel dynamicLyricsSegmentRemove','data-id':id},
				'X'
			],
			[
				'div',
				{class:'segmentContainer dynamicLyricsSegmentSettings'},
				[
					'input',
					{class:'inputText dynamicLyricsTime',type:'text',name:'dynamic_lyrics_times[]',placeholder:'Start Time',value:time}
				],
				[
					'input',
					{class:'inputText dynamicLyricsStyle',type:'text',name:'dynamic_lyrics_styles[]',placeholder:'Color',value:style}
				],
			],
			[
				'div',
				{class:'segmentContainer dynamicLyricsSegmentSettings'},
				[
					'input',
					{id:'dynamic_lyrics_notext_'+id+'Hidden',type:'hidden',value:'0',name:'dynamic_lyrics_notexts[]'}
				],
				[
					'input',
					{id:'dynamic_lyrics_notext_'+id,class:'inputRadio dynamicLyricsNotext',type:'checkbox',value:'1',name:'dynamic_lyrics_notexts[]',checked:notext}
				],
				[
					'label',
					{class:'inputLabel dynamicLyricsNotextLabel',for:'dynamic_lyrics_notext_'+id},
					'No Text'
				]
			],
			[
				'div',
				{class:'segmentContainer innerContainer dynamicLyricsTextareaContainer'},
				[
					'textarea',
					{class:'editInput dynamicLyricsEdit',name:'dynamic_lyrics_edits[]',placeholder:'Lyric Segment',rows:'4',html:text}
				]
			],
			[
				'span',
				{'class':'dynamicLyricsSegmentAddBelow'},
				'Add Segment Below'
			]
		]
	);
	editForm.dynamic_lyrics_prev_time = time;
	return lyricSegHTML;
}
function removeLyricSegment(seg_id) {	editForm.lyricsDynamicContainer.find("#dynamic_lyrics_segment_"+seg_id).remove();	}
function addLyricSegment() {
	editForm.dynamic_lyrics_index = parseInt(editForm.dynamic_lyrics_index) + 1;
	editForm.dynamic_lyrics_inner_container[0].appendChild(dynamicLyricSegmentForEdit(editForm.dynamic_lyrics_index, "", "", false, ""));
}
function openEdit() {
	editForm.parent.removeClass("closed");
	editForm.form.show();
	editAlbumArtForm.form.hide();
	globalPlayer.mainContainer.addClass("right_opened");
	editForm.status = true;
}
function closeEdit() {
	editForm.parent.addClass("closed");
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
    		if (response.success) submitEdit(event, iconEditSet, editForm.songId.val());
    		else alert("Error on Editing Media:\n" + response.message);
    	},
    	error: function(jqXHR, textStatus, errorThrown) {	alert('AJAX Error on Editing Media Icon:\n' + errorThrown);	}
	});
}
function submitEdit(event, iconUploaded=0, id, reload = 0, close = false, deleted = false) {
	$('#editMediaForm .dynamicLyricsNotext').each(function(d, obj) {
		var thisId = obj.id;
		if (obj.checked) document.getElementById(thisId+'Hidden').disabled = true;
		else document.getElementById(thisId+'Hidden').disabled = false;
	});
   	var formData = editForm.form.serialize();
	$.ajax({
		url: 'scripts/mediaEdit.php?song=1&edit='+id+'&reload='+reload+'&iconUploaded='+iconUploaded,
		type: 'POST',
		data: formData,
		cache: false,
		dataType: 'json'
	}).done(function(response) {
		if (response.success) {
			iconEdit = null;
			iconEditSet = 0;
			if (close) closeEdit();
			else populateAlternativeArtContainer();
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
	closeEdit();
	setTimeout(function() {
		editAlbumArtForm.alternatives_container.empty();
		var data = 'get=1&albumId='+album_id;
		var grabAllArt = $.ajax({
			url: "scripts/getAllArtForEdit.php",
			dataType: 'json',
			data: data,
			type: 'POST'
		});
		$.when(grabAllArt).then(function(art) {
			if ( !art['success'] || art['success'] == false  || art['success']=='false' ) return alert("AJAX Error on Retrieving Album Art For Edit: " + art[0]['message']);
			editAlbumArtForm.temp = (art['art'] != null) ? art['art'] : 'assets/default_album_art.jpg';
			editAlbumArtForm.display.src = editAlbumArtForm.temp + '#' + new Date().getTime();
			if ( editAlbumArtForm.array != art['data'] ) {
				editAlbumArtForm.array = art['data'];
				var alternative_html;
				for (var index in art['data']) {
					alternative_html = make(
						[
							'div',
							{
								class:'item alternate_art_container_for_album_art_edit'
							},
							[
								'img',
								{
									class:'preview alternatePreview',
									src:art['data'][index],
									alt:''
								}
							],
							[
								'input',
								{
									type:'radio',
									class:'inputRadio alternateRadio',
									id:'alternate_art_for_album_art_edit_'+index,
									name:'alternate_art_for_album_art_edit',
									value:index
								}
							],
							[
								'label',
								{
									for:'alternate_art_for_album_art_edit_'+index,
									class:'previewLabel alternateLabel',
									'data-id':index
								}
							]
						]
					);
					/*)
					"<div class=\"alternate_art_container_for_album_art_edit\">
						<img class=\"alternatePreview\" src=\""+art['data'][index]+"\" alt=\"\">
						<input type=\"radio\" class=\"alternateRadio\" id=\"alternate_art_for_album_art_edit_"+index+"\" name=\"alternate_art_for_album_art_edit\" value=\""+index+"\">
						<label for=\"alternate_art_for_album_art_edit_"+index+"\" class=\"alternateLabel\" data-id=\""+index+"\"></label>
					</div>";
					*/
					editAlbumArtForm.alternatives_container.append(alternative_html);
				}
			}
		}).then(function() {
			editAlbumArtForm.iconEdit = null;
			editAlbumArtForm.iconEditSet = -1;
			editAlbumArtForm.id = album_id;
			openAlbumArtEdit();
		});
	},500);
}
function openAlbumArtEdit() {
	editAlbumArtForm.parent.removeClass("closed");
	editAlbumArtForm.form.show()
	editForm.form.hide();
	globalPlayer.mainContainer.addClass("right_opened");
	editAlbumArtForm.status = true;
}

/* closeAlbumArtEdit = closeEdit(), so no function is written for that */
function prepareAlbumArtEdit(event) {
	var url = event.target.value;
	var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
	var extensions = ['png', 'jpeg', 'jpg']
	if (event.target.files && event.target.files[event.target.files.length-1] && (extensions.indexOf(ext) > -1 )) {
		var reader = new FileReader();
		reader.onload = function (e) {
			var srcData = e.target.result; // <--- data: base64
			editAlbumArtForm.display.src = srcData;	
			//var newImage = document.createElement('img');
			//newImage.id = 'edit_album_art_form_display';
			//newImage.src = srcData;
			//editAlbumArtForm.displayParent.innerHTML = newImage.outerHTML;
			//var newBase = editAlbumArtForm.displayParent.childNodes[0].src;
			//if (newBase == null || extensions.indexOf(newBase.substring(newBase.lastIndexOf('.')+1).toLowerCase()) > -1 ) {
			//	editAlbumArtForm.iconEdit = event.target.files;
			//	editAlbumArtForm.iconEditSet = 1;
			//} else {
			//	editAlbumArtForm.iconEdit = newBase;
			//	editAlbumArtForm.iconEditSet = 2;
			//}
			//console.log(newBase);
		}
		reader.readAsDataURL(event.target.files[event.target.files.length-1]);
		editAlbumArtForm.iconEdit = event.target.files;
		editAlbumArtForm.iconEditSet = 1;
	} 
	else {
		editAlbumArtForm.display.src = 'assets/default_album_art.jpg';
		alert("That image is not a proper image file (jpg or png)");
	}
}
function submitAlbumArtEdit(event) {
	event.stopPropagation(); 	/* Stop stuff happening */
	event.preventDefault(); 	/* Totally stop stuff happening */
	var data, performAjax;
	if ( editAlbumArtForm.iconEditSet == -1 ) {
		/* A new image was not selected */
		alert('A new image was not chosen.\nPlease select a new image or close out of the edit screen.');
		return;
	} else if (editAlbumArtForm.iconEditSet == 0) {
		/* An alternative art was used, and a new art was not uploaded */
		data = editAlbumArtForm.form.serialize();
		performAjax = $.ajax({
			url: 'scripts/updateAlbumArt.php?album_id='+editAlbumArtForm.id+'&iconEditSet='+editAlbumArtForm.iconEditSet,
			type: 'POST',
			data: data,
			dataType: 'json'
		});
	}
	else if (editAlbumArtForm.iconEditSet == 1) {
		data = new FormData();
		$.each(editAlbumArtForm.iconEdit, function(key, value) {
			data.append(key, value);
		});
		performAjax = $.ajax({
			url: 'scripts/updateAlbumArt.php?album_id='+editAlbumArtForm.id+'&iconEditSet='+editAlbumArtForm.iconEditSet,
			type: 'POST',
			data: data,
			cache: false,
			dataType: 'json',
			processData: false,
			contentType: false
		});
	}
	else {
		/* We wanted to upload a new file, but a new file was not set */
		alert('You wished to upload a new file...\nBut a new file was not set.');
		return;
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
	embedForm.form.find('.textInput').val('');
	embedForm.form.find(".inputError").text('');
	embedForm.form.show();
	$(globalPlayer.leftSongs).hide();
	embedForm.status = true;
}
function closeEmbed() {
	embedForm.form.find("input[type=text], input[type=url]").val('');
	embedForm.form.hide();
	$(globalPlayer.leftSongs).show();
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
			embedForm.total_error.text(response.message).addClass('opened');
			if ( response.errors != null ) {
				for (var error_type in response.errors) {
					embedForm.form.find('#embed_'+error_type+'_Error').text(response['errors'][error_type]);
				}
			}
		}
	}).fail(function(jqXHR, textStatus, errorThrown) {	
		alert('AJAX Error on Inputting Embed Video:\n' + textStatus);
	});
}

function search(text) {
	searchMatches = {};
	var searchText = text.toLowerCase();
	for (var id in globalPlayer.database) {
		if ( globalPlayer.database[id]["title"].toLowerCase().includes(searchText) ) {
			if ( typeof searchMatches[globalPlayer.database[id]['album']] === 'undefined' ) searchMatches[globalPlayer.database[id]['album']] = [];
			searchMatches[globalPlayer.database[id]['album']].push({
				'id':globalPlayer.database[id]['id'],
				'medium':globalPlayer.database[id]['medium'],
				'title':globalPlayer.database[id]['title'],
				'artist':globalPlayer.database[id]['artist'],
				'art':globalPlayer.database[id]['art']
			});
		}
	}
	return searchMatches;
}

function populateAlternativeArtContainer() {
	editForm.alternative_art_container.find('.alternate').remove();
	var data = 'get=1';
	$.ajax({
		url: 'scripts/getAllArtForEdit.php',
		dataType: 'json',
		data: data,
		type: 'POST'
	}).done(function(response) {
        if (response.success) {
        	if (response.data != null) {
        		editForm.alternative_art_array = response.data;
       			editForm.alternative_art_activator.hide();
        		var html;
        		for (var index in response.data) {
        			html = make(['div',{class:'item'},['img',{class:'preview',src:response["data"][index]+'?'+new Date().getTime(),alt:''}],['input',{type:'radio',class:'inputRadio alternateRadio',id:'alternate_art_'+index,name:'alternate_art',value:index}],['label',{for:'alternate_art_'+index,class:'previewLabel','data-id':index}]]);
					editForm.alternative_art_container.append(html);
       			}	
       		} 
       		else $(this).text('No alternate album art available');
		}
		else alert(response.message);
	}).fail(function(jqXHR, textStatus, errorThrown) {	alert('ERRORS @ Adding New Media: ' + errorThrown);	});
}

function initialize_video() {
	globalPlayer.currentPlayer.durationDisplay.text(formatTime( globalPlayer.currentPlayer.player.getDuration() ));
	globalPlayer.currentPlayer.loopButton.attr('src', loopStagesWhite[globalPlayer.loop]);
	globalPlayer.currentPlayer.timeSlider.attr('max', milliseconds(globalPlayer.currentPlayer.player.getDuration()));
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
		leftSongs:document.getElementById('leftSongs'),
		leftEmbedForm:document.getElementById('embedInputForm'),
		mainContainer:$("#main"),
		background: document.getElementById('background'),
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
		queue: [],
		searchFindings: {}
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
		shuffleButton: $("#shuffle"),
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
		shuffleButton: $("#video_shuffle"),
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
		form: $("#editMediaForm"),
		songId: $("#id_edit"),
		medium: $("#medium_edit"),
		title: $("#titleEdit"),
		artist: $("#artistEdit"),
		art_display: $("#editArtDisplay"),
		art_edit: $("#editArtOverlay"),
		art: $("#artEdit"),
		art_temp: null,
		alternative_art_container: $("#editArtAlternativesContainer"),
		alternative_art_activator: $("#editArtAlternativesActivator"),
		alternative_art_array: null,
		album: $("#albumEdit"),
		album_artist: $("#albumArtistEdit"),
		composer: $("#composerEdit"),
		padding_container: $("#editPaddingContainer"),
		start_padding: $("#startPaddingEdit"),
		end_padding: $("#endPaddingEdit"),
		video_id_container: $("#editVideoIdContainer"),
		video_id: $("#videoIdEdit"),
		lyrics_types: $("#song_edit_lyrics_type_container"),
		lyricsSettings: $("#editLyricsSettings"),
		lyricsSettingsSimple: $("#editLyricsSimpleLabel"),
		lyricsSettingsDynamic: $("#editLyricsDynamicLabel"),
		lyricsSettingsSimpleRadio: document.getElementById('editLyricsSimpleRadio'),
		lyricsSettingsDynamicRadio: document.getElementById('editLyricsDynamicRadio'),
		lyricsSimpleContainer: $("#editLyricsSimpleContainer"),
		simple_lyrics: $("#simple_lyrics_edit"),
		lyricsDynamicContainer: $("#editLyricsDynamicContainer"),
		dynamic_lyrics_inner_container: $("#dynamicLyricsEditInnerContainer"),
		dynamic_lyrics_index: -1,
		dynamic_lyrics_prev_time: "00:00",
		dynamic_lyrics_add_segment: $("#dynamicLyricsEditAdd"),
		convertLyricsActivator: $('#convertLyricsActivator'),
		openedLyrics:0,
		submit: $("#submitEdit")
	};
	editAlbumArtForm = {
		status: false,
		parent: $("#right"),
		close: $("#closeEdit"),
		form: $("#editAlbumArtForm"),
		display: document.getElementById('editAlbumArtDisplay'),
		new_upload_input: $("#edit_album_art_form_input"),
		alternatives_container: $('#editAlbumArtAlternativesContainer'),
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
		total_error: $("#embedTotalError"),
		form: $("#embedInputForm")
	};

	/* Initialization Functions */
	globalPlayer.currentPlayer = audio_player;
	getAllMedia(false, true, -1);

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

	var toggles = document.getElementsByClassName('toggle');
	function toggleParent() {
		console.log(this);
		var parent = this.parentNode;
		if (parent.classList.contains('closed')) parent.classList.remove('closed');
		else {
			if (parent.id == 'right') closeEdit();
			else parent.classList.add('closed');
		}
	}
	for (var i = 0; i < toggles.length; i++) {
		toggles[i].addEventListener('click',toggleParent,false);
	}

	$(document).on("click", ".song", function() {
		var id = $(this).attr("data-id");
		var medium = $(this).attr("data-medium");
		openSong(id, medium);
	});
	function openSong(id, medium) {
		var selected = globalPlayer.leftSongs.getElementsByClassName('selected')[0];
		if (selected) selected.classList.remove('selected');
		var toSelect = globalPlayer.leftSongs.querySelector('.song[data-id="'+id+'"][data-medium="'+medium+'"]');
		if (toSelect) {
			toSelect.classList.add('selected');
			openMedia(id, true);
			if (medium == 0 || medium == 2) {
				$(globalPlayer.currentPlayer.html).trigger('play'); 
				if (globalPlayer.paused) {
					globalPlayer.currentPlayer.playButton.addClass("hiddenControl");
					globalPlayer.currentPlayer.pauseButton.removeClass("hiddenControl");
					globalPlayer.paused = false;
				}
			}
		} 
		else alert("Selected Song Apparently Doesn't Exist In the Left Bar!");
	}
	$(document).on("click", ".song_options", function(event) {
		event.stopPropagation();
		
		var parent = $(this).parent();
		var curId = parent.attr("data-id");
		var curEditingId = editForm.songId.val();
		if (!editForm.status) startEdit(curId);
		else if (globalPlayer.currentSong != curId) {
			if (curEditingId != curId) {
				closeEdit();
				setTimeout(function() {
					startEdit(curId);
				},500);
			}
			else closeEdit();
		} else {
			if (curEditingId != curId) {
				closeEdit();
				setTimeout(function() {
					startEdit(curId);
				},500);
			}
			else closeEdit();
		}
	});

	search_element = document.getElementById('searchInput');
	searchResults = document.getElementById('searchResults');
	$(search_element).on('focus', function(e) {
		if (Object.keys(globalPlayer.searchFindings).length > 0) document.getElementById('searchResults').classList.add('show')
	}).on('blur',function(e) {
		setTimeout(function(){
			document.getElementById('searchResults').classList.remove('show');
		}, 100);
	});
	search_element.addEventListener('keyup', function(e){
		if (e.keyCode == 13) return;
		else if (search_element.value.length >= 3) {
			globalPlayer.searchFindings = search(search_element.value);
			$("#searchResults").empty();
			var albumContainer, searchSongs, searchSong;
			if (Object.keys(globalPlayer.searchFindings).length > 0) {
				for(var alb in globalPlayer.searchFindings) {
					albumContainer = make(['div',{class:'dropdownItem'},['h5',alb]]);
					searchSongs = make(['div',{class:'searchAlbum'}]);
					globalPlayer.searchFindings[alb].forEach(function(val, index) {
						searchSong = make(['div',{class:'searchSong','data-id':val['id'],'data-medium':val['medium']},['div',{class:'searchSongArt'},['img',{src:val['art'],alt:val['title']}]],['div',{class:'searchSongText'},['span',{class:'searchSongTitle'},val['title']],['span',{class:'searchSongArtist'},val['artist']]]]);
						searchSongs.appendChild(searchSong);
					});
					albumContainer.appendChild(searchSongs);
					searchResults.appendChild(albumContainer);
				}
				document.getElementById('searchResults').classList.add('show');
  			}
  		} 
  		else document.getElementById('searchResults').classList.remove('show');
	});
	$(document).on('click','.searchSong', function() {
		var id = $(this).attr("data-id");
		var medium = $(this).attr('data-medium');
		openSong(id, medium);
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
			if (editForm.songId.val() != globalPlayer.currentSong) {
				closeEdit();
				setTimeout(function() {
					startEdit(globalPlayer.currentSong);
				}, 500);
			}
			else closeEdit();
		}
	});
	editForm.alternative_art_activator.on("click", populateAlternativeArtContainer);
	$(document).on("click", ".alternate .alternateLabel", function() {
		iconEdit = null;
		iconEditSet = 0;
		var alternative_id = $(this).attr("data-id");
		var new_art = editForm.alternative_art_array[alternative_id];
		editForm.art_display.attr("src", new_art)
	});
	editForm.art.on('change', prepareIconEdit);
	$(document).on('change','input[name=alternate_art]',function() {
		iconEdit = null;
		iconEditSet = 0;
	});
	function prepareIconEdit(event) {
		iconEdit = event.target.files;
		iconEditSet = 1;
		var url = event.target.value;
		var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
		if (event.target.files && event.target.files[event.target.files.length-1] && (ext == 'PNG' || ext == 'png' || ext == 'jpeg' || ext == 'jpg' || ext == 'JPEG' || ext == 'JPG')) {
			var reader = new FileReader();
			reader.readAsDataURL(event.target.files[event.target.files.length-1]);
			reader.onload = function (e) {	
				editForm.art_display.attr('src', e.target.result);
			}
		} 
		else editForm.art_display.attr('src', 'assets/default_album_art.jpg');
	}
	editForm.submit.on('click', function(e) { editIcon(e); });
	$(document).on("click", ".dynamicLyricsSegmentRemove", function() {
		removeLyricSegment($(this).attr('data-id'));
	});
	$(document).on('click', '.dynamicLyricsSegmentAddAbove', function() {
		editForm.dynamic_lyrics_index += 1;
		var newSeg = dynamicLyricSegmentForEdit(editForm.dynamic_lyrics_index);
		$(newSeg).insertBefore($(this).parent());
	});
	$(document).on('click', '.dynamicLyricsSegmentAddBelow', function() {
		editForm.dynamic_lyrics_index += 1;
		var newSeg = dynamicLyricSegmentForEdit(editForm.dynamic_lyrics_index);
		$(newSeg).insertAfter($(this).parent());
	});
	editForm.dynamic_lyrics_add_segment.on("click", function() {	addLyricSegment();	});
	editForm.lyricsSettingsSimple.on("click", function() {
		editForm.lyricsDynamicContainer.removeClass("selected");
		editForm.lyricsSimpleContainer.addClass("selected");
		editForm.convertLyricsActivator.text('Import from Dynamic Lyrics <=');
		editForm.openedLyrics = 0;
	});
	editForm.lyricsSettingsDynamic.on("click", function() {
		editForm.lyricsSimpleContainer.removeClass("selected");
		editForm.lyricsDynamicContainer.addClass("selected");
		editForm.convertLyricsActivator.text('=> Import from Simple Lyrics');
		editForm.openedLyrics = 1;
	});
	editForm.dynamic_lyrics_inner_container.on('change focus keyup keydown paste cut', '.dynamicLyricsEdit', function() {
		auto_grow(this);
	})
	editForm.convertLyricsActivator.on('click',convertLyrics);
	$('#deleteSong').on("click", function() {	submitEdit(null, null, editForm.songId.val(), 1, true, true);	});

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
	$(document).on("click", ".alternate_art_container_for_album_art_edit .alternateLabel", function() {
		editAlbumArtForm.iconEdit = null;
		editAlbumArtForm.iconEditSet = 0;
		var alternative_id = $(this).attr("data-id");
		var new_art = editAlbumArtForm.array[alternative_id];
		editAlbumArtForm.display.src = new_art;
	});

	/* Player-related functions */
	audio_player.playButton.on('click', startMedia);
	audio_player.pauseButton.on('click', pauseMedia);
	audio_player.loopButton.on("click", function() {
		globalPlayer.loop = (globalPlayer.loop == 2) ? 0 : globalPlayer.loop + 1;
		audio_player.loopButton.attr("src", loopStagesDefault[globalPlayer.loop]);
		loadQueue();
	});
	audio_player.shuffleButton.on("click", function(){
		globalPlayer.shuffle = (globalPlayer.shuffle == 1) ? 0 : 1;
		audio_player.shuffleButton.attr("src", shuffleStagesDefault[globalPlayer.shuffle]);
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
	    	var newTime = e.target.value;
			globalPlayer.currentPlayer.player.seekTo(revertFromMilliseconds(newTime));
			if ( unPauseVideo ) startMedia();
		} 
		else if (globalPlayer.currentMediaType == 2) timeAdjust( $(this).val() );
		video_player.lock_time_slider = false;
	});
	video_player.playButton.on('click', startMedia);
    video_player.pauseButton.on('click', pauseMedia);
    video_player.loopButton.on("click", function() {
    	globalPlayer.loop = ( globalPlayer.loop == 2 ) ? 0 : globalPlayer.loop + 1;
    	video_player.loopButton.attr("src", loopStagesWhite[globalPlayer.loop]);
    	if (globalPlayer.loop == 1 && globalPlayer.currentMediaType == 1) video_player.player.setLoop();
    	loadQueue();
    });
    video_player.shuffleButton.on("click", function(){
    	globalPlayer.shuffle = (globalPlayer.shuffle == 1) ? 0 : 1
		video_player.shuffleButton.attr("src", shuffleStagesWhite[globalPlayer.shuffle]);
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
			if (curId != globalPlayer.currentSong) {
				closeEdit();
				setTimeout(function() {
					startEdit(globalPlayer.currentSong);
				}, 500);
			}
			else closeEdit();
		}
    });
	video_player.autoscrollButton.on('click', videoAutoscrollToggle);
});

