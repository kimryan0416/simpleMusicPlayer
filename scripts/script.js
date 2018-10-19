var globalPlayer, editAlbumArtForm, embedForm, addMediaForm, audio_player, video_player;
var screenHeight = window.innerHeight;
var loopStagesDefault = ["assets/repeat_0.png", "assets/repeat_1.png", "assets/repeat_all.png"];
var loopStagesWhite = ["assets/repeat_0_white.png", "assets/repeat_1_white.png", "assets/repeat_all_white.png"];
var shuffleStagesDefault = ["assets/shuffle_0.png", "assets/shuffle_1.png"];
var shuffleStagesWhite = ["assets/shuffle_0_white.png", "assets/shuffle_1_white.png"];

/* Youtube Setup - If no online connection detected, then all youtube embedded entries are not available */
var onlineConnection = false;
function onYouTubeIframeAPIReady() {
	console.log("YouTube API Ready");
	onlineConnection = true;
}

function isArray(a) {	return Object.prototype.toString.call(a) === "[object Array]";	}

function formatBytes(a,b){if(0==a)return"0 Bytes";var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]}

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

function ajaxCall(ajaxParams, callback, errorCallback = null, printLog=false, returnType = 'json') {
	$.ajax(ajaxParams).done(function(response){
		if (returnType == 'json') {
			if (response.success) callback(response);
			else if (errorCallback != null) errorCallback(response);
			else alert(response.message);
		} else {
			callback(response);
		}
	}).fail(function(jqXHR, textStatus, errorThrown){
		alert('AJAX Error:\n'+ajaxParams.url+'\n'+errorThrown);
	}).always(function(response) {
		if (printLog) console.log(response);
	});
}

function onTimeUpdate(track, embedTime = null) {
	var curMillisec, curTime;
	if (globalPlayer.currentMediaType == 1) curMillisec = embedTime * 1000;
	else curMillisec = milliseconds(track.currentTime);
	if (curMillisec > globalPlayer.endPadding) return nextMedia();
	
	curTime = readableDuration(curMillisec);
	globalPlayer.currentPlayer.timeDisplay.text(curTime);
	if (globalPlayer.currentMediaType == 1 && !globalPlayer.currentPlayer.lock_time_slider) globalPlayer.currentPlayer.timeSlider.val(curMillisec);
	else globalPlayer.currentPlayer.timeSlider.val(curMillisec);

	if (globalPlayer.dynamic_lyrics_toggle && globalPlayer.scrollToLyrics && globalPlayer.dynamic_lyrics_starting_times != null && !globalPlayer.ignoreOnTimeUpdate) {
		if ( (curMillisec < globalPlayer.current_time) || (curMillisec >= globalPlayer.dynamic_lyrics_starting_times[globalPlayer.current_time_index + 1]) ) {
			$('.lyric_segment.selected').removeClass('selected');
			globalPlayer.ignoreOnTimeUpdate = true;
			var tempIndex = -1;
			var i = (curMillisec < globalPlayer.current_time) ? 0 : globalPlayer.current_time_index + 1;
			for ( i; i < globalPlayer.dynamic_lyrics_starting_times.length; i++) {
				tempIndex = i;
				if ( (curMillisec >= globalPlayer.dynamic_lyrics_starting_times[i]) && (curMillisec < globalPlayer.dynamic_lyrics_starting_times[i+1]) ) {
					break;
				}
			}
			globalPlayer.current_time_index = tempIndex;
			globalPlayer.current_time = (tempIndex > -1) ? globalPlayer.dynamic_lyrics_starting_times[tempIndex] : -1;
		}
		if (globalPlayer.ignoreOnTimeUpdate == true && globalPlayer.current_time != -1 && globalPlayer.current_time_index != -1) {
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
		globalPlayer.ignoreOnTimeUpdate = false;
	}
}

function openMedia(id, newQueue = false) {
	var data = globalPlayer.database[id];
	preparePlayer(data);
	if (data.medium == 0 || data.medium == 2) prepareLocalMedia(data);
	if (newQueue) loadQueue();
}

function getAllMedia(update = false, print = true, scrollTo = -1) {
	ajaxCall({url:'scripts/simpleMusicPlayer.php?get=1',data:'online='+onlineConnection,type:'POST',dataType: 'json'},function(response) {
		globalPlayer.database = response['data']['raw_data'];
		console.log(globalPlayer.database);
		if (print) {
			printMedia(response['data']['sorted_data']);
		}
		if (scrollTo != -1) {
			var elmnt = document.getElementById(scrollTo);
			elmnt.classList.add('edited');
			globalPlayer.leftSongs.scrollTo({
			    'behavior': 'smooth',
			    'top': elmnt.offsetTop - (screenHeight/2) + (elmnt.offsetHeight/2)
			});
			if (document.getElementById(globalPlayer.currentSong)) document.getElementById(globalPlayer.currentSong).classList.add('selected');
			if (update) updateCurrent();
		} 
	},function(response) {
		alert(response.message);
		console.log(response);
	});
}

function printMedia(sortedDatabase) {
	globalPlayer.leftSongs.innerHTML = '';
	var html, albumHTML, albumSongList;
	for (var index in sortedDatabase) {
		html = make(['div',{class:'container albumArtist'},['div',{class:'item albumArtist'},['h1',sortedDatabase[index]['name']] ]]);
		for(var album in sortedDatabase[index]['albums']) {
			albumHTML = make(['div',{class:'container album',id:'album_'+album},['div',{class:'item album'},['div',{class:'container albumArt'},['img',{class:'item albumArt',src:sortedDatabase[index]['albums'][album]['art']+'#'+ new Date().getTime(),alt:''}],['span',{class:'item addAlbumArt_button','data-id':sortedDatabase[index]['albums'][album]['id']},'Change Artwork']],['h2',album]]]);
			albumSongList = make(['div',{class:'container albumSongList'}]);
			sortedDatabase[index]['albums'][album]['songs'].forEach(function(d, index) {
				var songToAppend = make(['div',{class:'item song', id:d['id'], 'data-id':d['id'], 'data-medium':d['medium']}]);
				if (d['medium'] == 1) songToAppend.appendChild(make(['img',{class:'item icon',src:'assets/youtube.png',alt:'YouTube'}]));
				else if (d['medium'] == 2) songToAppend.appendChild(make(['img',{class:'item icon',src:'assets/video.png',alt:'Video'}]));
				songToAppend.appendChild(make(['div',{class:'container text'},['span',{class:'item title'},d['title']],['span',{class:'item artist'},d['artist']]]));
				songToAppend.appendChild(make(['img',{class:'item options',src:'assets/options.png',alt:'Song Options'}]));
				albumSongList.appendChild(songToAppend);
			});
			albumHTML.appendChild(albumSongList);
			html.appendChild(albumHTML);
		}
		globalPlayer.leftSongs.appendChild(html);
	}
}

function updateCurrent() {
	ajaxCall({url:'scripts/simpleMusicPlayer.php?get=2',data:'id='+globalPlayer.currentSong,type:'POST',dataType: 'json'},function(response) {
		var arr = response['data']['info'];

		if (globalPlayer.currentMediaType == 2) {
			globalPlayer.startPadding = arr['start_padding'];
			globalPlayer.endPadding = arr['end_padding'];
			video_player.lyrics.empty();
			if (response.info.dynamic_lyrics_toggle == 1) {
				video_player.lyrics.html(arr['lyrics']);
				globalPlayer.dynamic_lyrics_toggle = true;
				globalPlayer.dynamic_lyrics_starting_times = arr['dynamic_lyrics_starting_times'];
				globalPlayer.lockLyricScroll = false;
				if (video_player.autoscrollButton.hasClass('locked')) video_player.autoscrollButton.removeClass('locked');
				if (globalPlayer.scrollToLyrics && !video_player.autoscrollButton.hasClass('active')) video_player.autoscrollButton.addClass('active');
				else if (video_player.autoscrollButton.hasClass('active')) video_player.autoscrollButton.removeClass('active');
			}
		} 
		else if (globalPlayer.currentMediaType == 1) {
			video_player.lyrics.empty();
			if (response.info.dynamic_lyrics_toggle == 1) {
				video_player.lyrics.html(arr['lyrics']);
				globalPlayer.dynamic_lyrics_toggle = true;
				globalPlayer.dynamic_lyrics_starting_times = arr['dynamic_lyrics_starting_times'];
				globalPlayer.lockLyricScroll = false;
				if (video_player.autoscrollButton.hasClass('locked')) video_player.autoscrollButton.removeClass('locked');
				if (globalPlayer.scrollToLyrics && !video_player.autoscrollButton.hasClass('active')) video_player.autoscrollButton.addClass('active');
				else if (video_player.autoscrollButton.hasClass('active')) video_player.autoscrollButton.removeClass('active');
			}
		} 
		else {
			globalPlayer.currentAlbum = arr['album_id'];
			globalPlayer.currentAlbumArtist = arr['album_artist_id'];
			setBackground(arr['art'], globalPlayer.background);

			globalPlayer.currentPlayer.art.attr('src', arr['art']+'#'+ new Date().getTime());
			globalPlayer.currentPlayer.title.html(arr['title']);
			globalPlayer.currentPlayer.artist.html(arr['artist']);
			globalPlayer.currentPlayer.lyrics.html(arr['lyrics']);
			globalPlayer.lyricsHeight = globalPlayer.currentPlayer.lyrics.height();
			globalPlayer.startPadding = arr['start_padding'];
			globalPlayer.endPadding = arr['end_padding'];
			if (arr['dynamic_lyrics_toggle'] == 0) {
				globalPlayer.dynamic_lyrics_toggle = false;
				globalPlayer.dynamic_lyrics_starting_times = null;
				globalPlayer.lockLyricScroll = true;
				if (globalPlayer.currentPlayer.autoscrollButton.hasClass('active')) globalPlayer.currentPlayer.autoscrollButton.removeClass('active');
				if (!globalPlayer.currentPlayer.autoscrollButton.hasClass('locked')) globalPlayer.currentPlayer.autoscrollButton.addClass('locked');
			} else {
				globalPlayer.dynamic_lyrics_toggle = true;
				globalPlayer.dynamic_lyrics_starting_times = arr['dynamic_lyrics_starting_times'];
				globalPlayer.lockLyricScroll = false;
				if (globalPlayer.currentPlayer.autoscrollButton.hasClass('locked')) globalPlayer.currentPlayer.autoscrollButton.removeClass('locked');
				if (globalPlayer.scrollToLyrics && !globalPlayer.currentPlayer.autoscrollButton.hasClass('active')) globalPlayer.currentPlayer.autoscrollButton.addClass('active');
				else if (globalPlayer.currentPlayer.autoscrollButton.hasClass('active')) globalPlayer.currentPlayer.autoscrollButton.removeClass('active');
			}
		}

		document.getElementById(arr['id']).classList.add('selected');
		if (globalPlayer.loop == 2) createLoop(globalPlayer.currentAlbum, globalPlayer.currentSong, globalPlayer.currentAlbumArtist, globalPlayer.shuffle);
	});
}

function getImageArt(id) {
	ajaxCall({url: "scripts/simpleMusicPlayer.php?get=9",data:'id='+id,type:'POST',dataType:'html'},function(response) {
		var img;
		console.log(response);
		if ( response && response != "data:;charset=utf-8;base64," ) {
			console.log("Image art found with Base64");
			audio_player.art.attr("src", response);
			setBackground(response, globalPlayer.background);
			img = response;
		} else {
			console.log("Image Art Not Found - Using Default");
			audio_player.art.attr("src", "assets/default_album_art.jpg");
			setBackground('assets/default_album_art.jpg', globalPlayer.background);
			img = "assets/default_album_art.jpg";
		}
		saveMediaArt(id,img);
	},null,false,'html');
}
function showLyrics() {	audio_player.player_and_lyrics.toggleClass("showLyrics");	}

function saveMediaArt(id,img) {
	ajaxCall({url: 'scripts/simpleMusicPlayer.php?get=7',data:'id='+id+'&img='+encodeURI(img), type: 'POST', dataType: 'html'}, function(response) {
		return;
	},function(response) {
		console.log(response);
	});
}

function createLoop(albumId, songId, albumArtistId, shuffle) {
	var data = 'albumId='+albumId+'&songId='+songId+'&albumArtistId='+albumArtistId+'&shuffle='+shuffle;
	ajaxCall({url:'scripts/simpleMusicPlayer.php?get=10',data: data,type: 'POST',dataType: 'json'},function(response) {
		addToLoop(response['data']);
	},function(response) {	
		alert(response.message);
		console.log(response.data);
	});
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
	console.log(arr);
	globalPlayer.currentPlayer = null;

	globalPlayer.currentSong = arr["id"];
	globalPlayer.currentAlbum = arr["album_id"];
	globalPlayer.current_time_index = -1;
	globalPlayer.current_time = -1;
	globalPlayer.currentMediaType = parseInt(arr["medium"]);
	globalPlayer.currentAlbumArtist = arr["album_artist_id"];

	if (globalPlayer.currentMediaType == 1) {
		audio_player.container.addClass("closed");
		video_player.container.removeClass("closed");
		globalPlayer.mediaContainer.addClass('video');
		globalPlayer.currentPlayer = video_player;
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
		volumeAdjust(globalPlayer.volume);
	} else {
		video_player.container.addClass('closed');
		audio_player.container.removeClass('closed');
		globalPlayer.mediaContainer.removeClass('video');
		setBackground(arr['art'], globalPlayer.background);
		globalPlayer.currentPlayer = audio_player;
		if (arr['art'] == null) getImageArt(arr['id']);
		else {
			globalPlayer.currentPlayer.art.attr('src', arr['art']+'#'+ new Date().getTime());
			setBackground(arr['art'], globalPlayer.background);
		}
		volumeAdjust(globalPlayer.volume);
	}
	globalPlayer.currentPlayer.title.html(arr['title']);
	globalPlayer.currentPlayer.artist.html(arr["artist"]);

	globalPlayer.currentPlayer.lyrics.html('');
	globalPlayer.startPadding = arr['start_padding'];
	globalPlayer.endPadding = arr['end_padding'];

	if (arr['dynamic_lyrics_toggle'] == 0) {
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
		globalPlayer.currentPlayer.shuffleButton.attr('src', shuffleStagesWhite[globalPlayer.shuffle]);
		globalPlayer.currentPlayer.loopButton.attr('src',loopStagesWhite[globalPlayer.loop]);
	} else {
		globalPlayer.currentPlayer.shuffleButton.attr('src', shuffleStagesDefault[globalPlayer.shuffle]);
		globalPlayer.currentPlayer.loopButton.attr('src',loopStagesDefault[globalPlayer.loop]);
	}
}
function prepareLocalMedia(arr) {
	$(globalPlayer.currentPlayer.html).attr("src", arr["url"]+'?date='+new Date().getTime());
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
	globalPlayer.current_time = -1;
	$(".lyric_segment.selected").removeClass("selected");
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
	globalPlayer.current_time = -1;
	$(".lyric_segment.selected").removeClass("selected");
	pauseMedia();

	var savedId = globalPlayer.queue[0];
	var curSel = globalPlayer.leftSongs.querySelector('.selected');
	curSel.remove('selected');

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
function search(text) {
	var searchMatches = {};
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

function initializeEditMediaForm(I) {
	var F = {};

	/* --- VARIALBE/REFERENCE SETUP --- */
	F.status = (I && I.status) ? I.status : false;
	F.close = (I && I.close) ? I.close : $('#closeEdit');
	F.form = (I && I.form) ? I.form : $('#editMediaForm');
	F.songId = (I && I.songId) ? I.songId : $('#id_edit');
	F.medium = (I && I.medium) ? I.medium : $('#medium_edit');
	F.title = (I && I.title) ? I.title : $('#titleEdit');
	F.artist = (I && I.artist) ? I.artist : $('#artistEdit');
	F.artDisplay = (I && I.artDisplay) ? I.artDisplay : $('#editArtDisplay');
	F.artEdit = (I && I.artEdit) ? I.artEdit : $('#editArtOverlay');
	F.art = (I && I.art) ? I.art : $('#artEdit');
	F.alternativeArtContainer = (I && I.alternativeArtContainer) ? I.alternativeArtContainer : $('#editArtAlternativesContainer');
	F.alternativeArtActivator = (I && I.alternativeArtActivator) ? I.alternativeArtActivator : $('#editArtAlternativesActivator');
	F.alternativeArtArray = (I && I.alternativeArtArray) ? I.alternativeArtArray : null;
	F.album = (I && I.album) ? I.album : $('#albumEdit');
	F.albumArtist = (I && I.albumArtist) ? I.albumArtist : $('#albumArtistEdit');
	F.composer = (I && I.composer) ? I.composer : $('#composerEdit');
	F.paddingContainer = ( I && I.paddingContainer) ? I.paddingContainer : $('#editPaddingContainer');
	F.startPadding = (I && I.startPadding) ? I.startPadding : $('#startPaddingEdit');
	F.endPadding = (I && I.endPadding) ? I.endPadding : $('#endPaddingEdit');
	F.videoIdContainer = (I && I.videoIdContainer) ? I.videoIdContainer : $('#editVideoIdContainer');
	F.videoId = (I && I.videoId) ? I.videoId : $('#videoIdEdit');
	F.lyrics_types = (I && I.lyrics_types) ? I.lyrics_types : $('#song_edit_lyrics_type_container');
	F.lyricsSettings = (I && I.lyricsSettings) ? I.lyricsSettings : $('#editLyricsSettings');
	F.lyricsSettingsSimple = (I && I.lyricsSettingsSimple) ? I.lyricsSettingsSimple : $('#editLyricsSimpleLabel');
	F.lyricsSettingsDynamic = (I && I.lyricsSettingsDynamic) ? I.lyricsSettingsDynamic : $('#editLyricsDynamicLabel');
	F.lyricsSettingsSimpleRadio = (I && I.lyricsSettingsSimpleRadio) ? I.lyricsSettingsSimpleRadio : document.getElementById('editLyricsSimpleRadio');
	F.lyricsSettingsDynamicRadio = (I && I.lyricsSettingsDynamicRadio) ? I.lyricsSettingsDynamicRadio : document.getElementById('editLyricsDynamicRadio');
	F.lyricsSimpleContainer = (I && I.lyricsSimpleContainer) ? I.lyricsSimpleContainer : $('#editLyricsSimpleContainer');
	F.simpleLyrics = (I && I.simpleLyrics) ? I.simpleLyrics : $('#simple_lyrics_edit');
	F.lyricsDynamicContainer = (I && I.lyricsDynamicContainer) ? I.lyricsDynamicContainer : $('#editLyricsDynamicContainer');
	F.dynamicLyricsInnerContainer = (I && I.dynamicLyricsInnerContainer) ? I.dynamicLyricsInnerContainer : $('#dynamicLyricsEditInnerContainer');
	F.dynamicLyricsIndex = -1;
	F.dynamicLyricsPrevTime = '00:00';
	F.dynamicLyricsAddSegment = (I && I.dynamicLyricsAddSegment) ? I.dynamicLyricsAddSegment : $('#dynamicLyricsEditAdd');
	F.convertLyricsActivator = (I && I.convertLyricsActivator) ? I.convertLyricsActivator : $('#convertLyricsActivator');
	F.openedLyrics = 0;
	F.iconEdit = null;
	F.iconEditSet = 0;
	F.submit = (I && I.submit) ? I.submit : $('#submitEdit');
	F.delete = (I && I.delete) ? I.delete : $('#deleteSong');

	/* --- FUNCTIONS --- */
	F.openForm = (I && I.openForm) ? I.openForm : function() {
		F.form.show();
		F.status = true;
	}
	F.closeForm = (I && I.closeForm) ? I.closeForm : function() {
		F.form.hide();
		F.status = false;
		F.iconEdit = null
		F.iconEditSet = 0;
	}
	F.startEdit = (I && I.startEdit) ? I.startEdit : function(id) {
		F.form[0].reset();
		F.ajax({url:'scripts/simpleMusicPlayer.php?get=3',data:'id='+id,type:'POST',dataType: 'json'},function(response) {
			F.prepareEdit(response['data']['info']);
		});
	}
	F.make = (I && I.make) ? I.make : function(desc) {
		if ( !F.isArray(desc) ) return false;
		var tag = desc[0], attributes = desc[1];
		var el = document.createElement(tag);
		var start = 1;
		if ( (attributes!=null) && (typeof attributes === 'object') && !F.isArray(attributes) ) {
			for (var attr in attributes) {
				switch(attr){
					case 'class':
						el.className = attributes[attr];
						break;
					case 'checked':
						el.checked = attributes[attr];
						break;
					case 'html':
						el.innerHTML = attributes[attr];
						break;
					default:
						el.setAttribute(attr, attributes[attr]);
				}
			}
			start = 2;
		}
		for (var i = start; i < desc.length; i++) {
			if (F.isArray(desc[i])) el.appendChild(make(desc[i]));
			else el.appendChild(document.createTextNode(desc[i]));
		}
		return el;
	}
	F.ajax = (I && I.ajax) ? I.ajax : function(ajaxParams, callback, errorCallback = null, printLog=false, returnType = 'json') {
		$.ajax(ajaxParams).done(function(response){
			if (returnType == 'json') {
				if (response.success) callback(response);
				else if (errorCallback != null) errorCallback(response);
				else alert(response.message);
			} else {
				callback(response);
			}
		}).fail(function(jqXHR, textStatus, errorThrown){
			alert('AJAX Error:\n'+ajaxParams.url+'\n'+errorThrown);
		}).always(function(response) {
			if (printLog) console.log(response);
		});
	}
	F.prepareEdit = (I && I.prepareEdit) ? I.prepareEdit : function(arr) {
		F.iconEditSet = 0;
		F.iconEdit = null;

		F.songId.val(arr.id);
		F.medium.val(arr.medium);

		F.title.val(arr.title);
		F.artist.val(arr.artist);
		F.album.val(arr.album_name);
		F.albumArtist.val(arr.album_artist_name);
		F.composer.val(arr.composer);

		F.alternativeArtContainer.find('.item').remove();
		F.alternativeArtActivator.show();
		F.artDisplay.attr('src', (arr.art != null) ? arr.art +'#'+ new Date().getTime() : 'assets/default_album_art.jpg');
	
		if ( arr.medium == 0 ) {
			F.videoIdContainer.hide();
			F.lyricsSettings.show();
			F.convertLyricsActivator.show();

			F.paddingContainer.show();
			F.startPadding.val(arr.start_padding);
			F.endPadding.val(arr.end_padding);

			F.simpleLyrics.text(arr.simpleLyrics);
			F.dynamicLyricsInnerContainer.empty();
			var seg = arr.dynamicLyrics;
			if (seg.length > 0) {
				for (var lyricSeg in seg) {
					F.dynamicLyricsIndex = parseInt(lyricSeg);
					F.dynamicLyricsInnerContainer[0].appendChild(F.dynamicLyricSegmentForEdit(lyricSeg, seg[lyricSeg]['time'], seg[lyricSeg]['style'], seg[lyricSeg]['no_text'], seg[lyricSeg]['text']));
				}
			}
			if (arr.dynamic_lyrics_toggle == 1) {
				F.lyricsSettingsSimpleRadio.checked = false;
				F.lyricsSettingsDynamicRadio.checked = true;
				F.lyricsSimpleContainer.removeClass('selected');
				F.lyricsDynamicContainer.addClass('selected');
				F.convertLyricsActivator.text('=> Import from Simple Lyrics');
				F.openedLyrics = 1;
			} else {
				F.lyricsSettingsSimpleRadio.checked = true;
				F.lyricsSettingsDynamicRadio.checked = false;
				F.lyricsSimpleContainer.addClass('selected');
				F.lyricsDynamicContainer.removeClass('selected');
				F.convertLyricsActivator.text('Import from Dynamic Lyrics <=');
				F.openedLyrics = 0;
			}
		}
		else {
			F.paddingContainer.hide();

			if (arr.medium == 1) {
				F.videoId.val(arr.url);
				F.videoIdContainer.show();
			} else {
				F.videoIdContainer.hide();
			}
			F.lyricsSettings.hide();
			F.lyricsSettingsSimpleRadio.checked = false;
			F.lyricsSettingsDynamicRadio.checked = true;
			F.lyricsSimpleContainer.removeClass('selected');
			F.lyricsDynamicContainer.addClass('selected');
			F.convertLyricsActivator.hide();
			F.openedLyrics = 1;
			var seg = arr.dynamicLyrics;
			if (seg.length > 0) {
				for (var lyricSeg in seg) {
					F.dynamicLyricsIndex = parseInt(lyricSeg);
					F.dynamicLyricsInnerContainer[0].appendChild(F.dynamicLyricSegmentForEdit(lyricSeg, seg[lyricSeg]['time'], seg[lyricSeg]['style'], seg[lyricSeg]['no_text'], seg[lyricSeg]['text']));
				}
			}
		}
	}
	F.auto_grow = function() {
		this.style.height = '20px';
		this.style.height = (this.scrollHeight)+'px';
	}
	F.convertLyrics = function() {
		var current = F.openedLyrics;
		var allSegments = [];
		var thisString = '';
		if (current == 0) {
			$.each($('#editMediaForm .dynamicLyricsEdit'), function(d,elmnt) {
				allSegments.push(elmnt.value);
			});
			thisString = allSegments.join('\n');
			F.simpleLyrics.empty().val(thisString);
			return;
		}
		else if (current == 1) {
			thisString = F.simpleLyrics.val();
			allSegments = thisString.split('\n\n');
			F.dynamicLyricsInnerContainer.empty();
			allSegments.forEach(function(d,index) {
				F.dynamicLyricsInnerContainer[0].appendChild(F.dynamicLyricSegmentForEdit(index, '', '', '', d));
				F.dynamicLyricsIndex = index;
			});
			return;
		}
		else return;
	}
	F.setBackground = (I && I.setBackground) ? I.setBackground : function(img, backgroundElement = null, blur = 3) {
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
	F.populateAlternativeArtContainer = function() {
		F.ajax({url:'scripts/simpleMusicPlayer.php?get=4',type:'GET',dataType:'json'},function(response) {
			if (response['data']['data'] != null) {
				F.alternativeArtContainer.find('.item').remove();
				F.alternativeArtArray = response.data;
				F.alternativeArtActivator.hide();
				var html, img, input, label;
				for (var index in response['data']['data']) {
					img = ( response['data']['data'][index].startsWith('data') ) ? response['data']['data'][index] : response['data']['data'][index]+'?'+new Date().getTime();
					html = F.make(['div',{class:'item alternate'},['img',{class:'item previewItem',src:img,alt:''}]]);
					input = F.make(['input',{type:'radio',class:'inputRadio alternateRadio',id:'alternate_art_'+index,name:'alternate_art',value:index}]);
					input.addEventListener('change',function() {
						F.iconEdit = null;
						F.iconEditSet = 0;
					});
					label = F.make(['label',{for:'alternate_art_'+index,class:'item previewLabel hover','data-id':index}]);
					label.addEventListener('click',function() {
						F.iconEdit = null;
						F.iconEditSet = 0;
						var alternative_id = $(this).attr('data-id');
						F.artDisplay.attr('src', F.alternativeArtArray[alternative_id]);
					});
					html.appendChild(input)
					html.append(label);
					F.alternativeArtContainer.append(html);
	       		}	
	       	} 
	       	else F.alternativeArtActivator.text('No alternate album art available');
		});
	}

	F.removeLyricSegment = (I && I.removeLyricSegment) ? I.removeLyricSegment : function(segId) {
		F.lyricsDynamicContainer.find('#dynamic_lyrics_segment_'+segId).remove();	
	}
	F.addLyricSegment = (I && I.addLyricSegment) ? I.addLyricSegment : function() {
		F.dynamicLyricsIndex = parseInt(F.dynamicLyricsIndex) + 1;
		F.dynamicLyricsInnerContainer[0].appendChild(F.dynamicLyricSegmentForEdit(F.dynamicLyricsIndex, '', '', false, ''));
	}
	F.dynamicLyricSegmentForEdit = (I && I.dynamicLyricSegmentForEdit) ? I.dynamicLyricSegmentForEdit : function(id, time = '', style = '', notext = true, text = '') {
		/*
		var lyricSegHTML = F.make(
			[
				'div',
				{id:'dynamic_lyrics_segment_'+id,class:'item dynamicSegment'},
				['span',{class:'cancel dynamicLyricsSegmentRemove','data-id':id},'X'],
				[
					'div',
					{class:'container dynamicSegment'},
					['span',{class:'item dynamicSegmentItem hover dynamicLyricsSegmentAddAbove'},'Add Segment Above'],
					[
						'div',
						{class:'item dynamicSegmentItem'},
						['input',{class:'item inputText dynamicLyricsTime',type:'text',name:'dynamic_lyrics_times[]',placeholder:'Start Time',value:time}],
						['input',{class:'item inputText dynamicLyricsStyle',type:'text',name:'dynamic_lyrics_styles[]',placeholder:'Color',value:style}]
					],
					[
						'div',
						{class:'item dynamicSegmentItem'},
						['input',{id:'dynamic_lyrics_notext_'+id+'Hidden',type:'hidden',value:'0',name:'dynamic_lyrics_notexts[]'}],
						['input',{id:'dynamic_lyrics_notext_'+id,class:'inputRadio dynamicLyricsNotext',type:'checkbox',value:'1',name:'dynamic_lyrics_notexts[]',checked:notext}],
						['label',{class:'item inputLabel noTextLabel hover',for:'dynamic_lyrics_notext_'+id},'No Text']
					],
					[
						'div',
						{class:'item dynamicSegmentItem'},
						['textarea',{class:'item editInput dynamicLyricsEdit',name:'dynamic_lyrics_edits[]',placeholder:'Lyric Segment',rows:'4',html:text}]
					],
					[
						'span',
						{'class':'item dynamicSegmentItem hover dynamicLyricsSegmentAddBelow'},
						'Add Segment Below'
					]
				]
			]
		);
		*/
		var lyricSegHTML = F.make(['div',{id:'dynamic_lyrics_segment_'+id,class:'item dynamicSegment'}]);
		var removeSeg = F.make(['span',{class:'cancel dynamicLyricsSegmentRemove','data-id':id},'X']);
		removeSeg.addEventListener('click',function() {
			F.removeLyricSegment($(this).attr('data-id'));
		});

		var lyricInnerSeg = F.make(['div',{class:'container dynamicSegment'}]);
		var arr = [
			F.make(['span',{class:'item dynamicSegmentItem hover dynamicLyricsSegmentAddAbove'},'Add Segment Above']),
			F.make(['div',{class:'item dynamicSegmentItem'},['input',{class:'item inputText dynamicLyricsTime',type:'text',name:'dynamic_lyrics_times[]',placeholder:'Start Time',value:time}],['input',{class:'item inputText dynamicLyricsStyle',type:'text',name:'dynamic_lyrics_styles[]',placeholder:'Color',value:style}]]),
			F.make(['div',{class:'item dynamicSegmentItem'},['input',{id:'dynamic_lyrics_notext_'+id+'Hidden',type:'hidden',value:'0',name:'dynamic_lyrics_notexts[]'}],['input',{id:'dynamic_lyrics_notext_'+id,class:'inputRadio dynamicLyricsNotext',type:'checkbox',value:'1',name:'dynamic_lyrics_notexts[]',checked:notext}],['label',{class:'item inputLabel noTextLabel hover',for:'dynamic_lyrics_notext_'+id},'No Text']]),
			F.make(['div',{class:'item dynamicSegmentItem'},['textarea',{class:'item editInput dynamicLyricsEdit',name:'dynamic_lyrics_edits[]',placeholder:'Lyric Segment',rows:'4',html:text}]]),
			F.make(['span',{'class':'item dynamicSegmentItem hover dynamicLyricsSegmentAddBelow'},'Add Segment Below'])
		];
		arr[0].addEventListener('click',function() {
			F.dynamicLyricsIndex += 1;
			var newSeg = F.dynamicLyricSegmentForEdit(F.dynamicLyricsIndex);
			$(newSeg).insertBefore($(this).parent().parent());
		});
		arr[arr.length-1].addEventListener('click',function() {
			F.dynamicLyricsIndex += 1;
			var newSeg = F.dynamicLyricSegmentForEdit(F.dynamicLyricsIndex);
			$(newSeg).insertAfter($(this).parent().parent());
		});

		lyricSegHTML.appendChild(removeSeg);
		arr.forEach(el=>{
			lyricInnerSeg.appendChild(el);
		});
		lyricSegHTML.appendChild(lyricInnerSeg);

		F.dynamicLyricsPrevTime = time;
		return lyricSegHTML;
	}

	F.prepareIconEdit = function(event) {
		F.iconEdit = event.target.files;
		F.iconEditSet = 1;
		var url = event.target.value;
		var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
		if (event.target.files && event.target.files[event.target.files.length-1] && (ext == 'PNG' || ext == 'png' || ext == 'jpeg' || ext == 'jpg' || ext == 'JPEG' || ext == 'JPG')) {
			var reader = new FileReader();
			reader.readAsDataURL(event.target.files[event.target.files.length-1]);
			reader.onload = function (e) {	
				F.artDisplay.attr('src', e.target.result);
			}
		} 
		else F.artDisplay.attr('src', 'assets/default_album_art.jpg');
	}
	F.editIcon = function(event) {
		event.stopPropagation(); 	// Stop stuff happening
		event.preventDefault(); 	// Totally stop stuff happening

		// Create a formdata object and add the files
		var data = new FormData();
		$.each(F.iconEdit, function(key, value) {
			data.append(key,value);
		});

		// processData: false 	<= 	Don't process the files - in other words, don't turn the icons into strings
		// contentType: false 	<=	Set content type to false as jQuery will tell the server its a query string request
		F.ajax({url:'scripts/simpleMusicPlayer.php?get=5&icon=1&change='+F.iconEditSet+'&id='+F.songId.val(),type:'POST',data:data,dataType:'json',cache:false,processData:false,contentType:false},function(response) {
			F.submitEdit(event, F.iconEditSet, F.songId.val());
		});
	}
	F.submitEdit = function(event, iconUploaded=0, id, reload = 0, close = false, deleted = false) {
		F.form.find('.dynamicLyricsNotext').each(function(d, obj) {
			var thisId = obj.id;
			if (obj.checked) document.getElementById(thisId+'Hidden').disabled = true;
			else document.getElementById(thisId+'Hidden').disabled = false;
		});
		var formData = F.form.serialize();
		F.ajax({url: 'scripts/simpleMusicPlayer.php?get=5&song=1&edit='+id+'&reload='+reload+'&iconUploaded='+iconUploaded,type:'POST',data:formData,dataType:'json',cache:false},function(response) {
			F.iconEdit = null;
			F.iconEditSet = 0;
			if (id == globalPlayer.currentSong) {
				if (reload == 1) F.resetPlayerAfterEdit();
				F.updateCurrent();
			}
			alert("Media successfully edited!");
		},function(response) {
			alert(response['message']);
		});
	}
	F.resetPlayerAfterEdit = function() {
		F.setBackground('assets/default_player_background.jpg', globalPlayer.background);

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
	F.updateCurrent = (I && I.updateCurrent) ? I.updateCurrent : function() {
		F.ajax({url:'scripts/simpleMusicPlayer.php?get=2',data:'id='+globalPlayer.currentSong,type:'POST',dataType: 'json'},function(response) {
			var arr = response['data']['info'];

			if (globalPlayer.currentMediaType == 2) {
				globalPlayer.startPadding = arr['start_padding'];
				globalPlayer.endPadding = arr['end_padding'];
				video_player.lyrics.empty();
				if (response.info.dynamic_lyrics_toggle == 1) {
					video_player.lyrics.html(arr['lyrics']);
					globalPlayer.dynamic_lyrics_toggle = true;
					globalPlayer.dynamic_lyrics_starting_times = arr['dynamic_lyrics_starting_times'];
					globalPlayer.lockLyricScroll = false;
					if (video_player.autoscrollButton.hasClass('locked')) video_player.autoscrollButton.removeClass('locked');
					if (globalPlayer.scrollToLyrics && !video_player.autoscrollButton.hasClass('active')) video_player.autoscrollButton.addClass('active');
					else if (video_player.autoscrollButton.hasClass('active')) video_player.autoscrollButton.removeClass('active');
				}
			} 
			else if (globalPlayer.currentMediaType == 1) {
				video_player.lyrics.empty();
				if (response.info.dynamic_lyrics_toggle == 1) {
					video_player.lyrics.html(arr['lyrics']);
					globalPlayer.dynamic_lyrics_toggle = true;
					globalPlayer.dynamic_lyrics_starting_times = arr['dynamic_lyrics_starting_times'];
					globalPlayer.lockLyricScroll = false;
					if (video_player.autoscrollButton.hasClass('locked')) video_player.autoscrollButton.removeClass('locked');
					if (globalPlayer.scrollToLyrics && !video_player.autoscrollButton.hasClass('active')) video_player.autoscrollButton.addClass('active');
					else if (video_player.autoscrollButton.hasClass('active')) video_player.autoscrollButton.removeClass('active');
				}
			} 
			else {
				globalPlayer.currentAlbum = arr['album_id'];
				globalPlayer.currentAlbumArtist = arr['album_artist_id'];
				setBackground(arr['art'], globalPlayer.background);

				globalPlayer.currentPlayer.art.attr('src', arr['art']+'#'+ new Date().getTime());
				globalPlayer.currentPlayer.title.html(arr['title']);
				globalPlayer.currentPlayer.artist.html(arr['artist']);
				globalPlayer.currentPlayer.lyrics.html(arr['lyrics']);
				globalPlayer.lyricsHeight = globalPlayer.currentPlayer.lyrics.height();
				globalPlayer.startPadding = arr['start_padding'];
				globalPlayer.endPadding = arr['end_padding'];
				if (arr['dynamic_lyrics_toggle'] == 0) {
					globalPlayer.dynamic_lyrics_toggle = false;
					globalPlayer.dynamic_lyrics_starting_times = null;
					globalPlayer.lockLyricScroll = true;
					if (globalPlayer.currentPlayer.autoscrollButton.hasClass('active')) globalPlayer.currentPlayer.autoscrollButton.removeClass('active');
					if (!globalPlayer.currentPlayer.autoscrollButton.hasClass('locked')) globalPlayer.currentPlayer.autoscrollButton.addClass('locked');
				} else {
					globalPlayer.dynamic_lyrics_toggle = true;
					globalPlayer.dynamic_lyrics_starting_times = arr['dynamic_lyrics_starting_times'];
					globalPlayer.lockLyricScroll = false;
					if (globalPlayer.currentPlayer.autoscrollButton.hasClass('locked')) globalPlayer.currentPlayer.autoscrollButton.removeClass('locked');
					if (globalPlayer.scrollToLyrics && !globalPlayer.currentPlayer.autoscrollButton.hasClass('active')) globalPlayer.currentPlayer.autoscrollButton.addClass('active');
					else if (globalPlayer.currentPlayer.autoscrollButton.hasClass('active')) globalPlayer.currentPlayer.autoscrollButton.removeClass('active');
				}
			}

			document.getElementById(arr['id']).classList.add('selected');
			if (globalPlayer.loop == 2) createLoop(globalPlayer.currentAlbum, globalPlayer.currentSong, globalPlayer.currentAlbumArtist, globalPlayer.shuffle);
		});
	}

	/* --- CLICK EVENTS --- */
	F.alternativeArtActivator.on('click', F.populateAlternativeArtContainer);
	F.dynamicLyricsAddSegment.on('click', F.addLyricSegment);
	F.lyricsSettingsSimple.on('click', function() {
		F.lyricsDynamicContainer.removeClass('selected');
		F.lyricsSimpleContainer.addClass('selected');
		F.convertLyricsActivator.text('Import from Dynamic Lyrics <=');
		F.openedLyrics = 0;
	});
	F.lyricsSettingsDynamic.on('click', function() {
		F.lyricsSimpleContainer.removeClass('selected');
		F.lyricsDynamicContainer.addClass('selected');
		F.convertLyricsActivator.text('=> Import from Simple Lyrics');
		F.openedLyrics = 1;
	});
	F.convertLyricsActivator.on('click',F.convertLyrics);
	F.dynamicLyricsInnerContainer.on('change focus keyup keydown paste cut', '.dynamicLyricsEdit', F.auto_grow);
	F.art.on('change', F.prepareIconEdit);
	F.delete.on('click', function() {	
		F.submitEdit(null, null, F.songId.val(), 1, true, true);	
	});
	F.submit.on('click', F.editIcon);

	return F;
}
function openEdit() {
	$(globalPlayer.leftSongs).hide();
	embedForm.closeForm();
	editAlbumArtForm.closeForm();
	addMediaForm.closeForm();

	editMediaForm.openForm();

	if ( !video_player.lyrics_parent.hasClass("lock") )	video_player.lyrics_parent.addClass("lock");
	if ( !video_player.controls_container.hasClass("lock") ) video_player.controls_container.addClass("lock");
	if (!globalPlayer.leftOpen) {
		$('#left').removeClass('closed');
		$('#main').removeClass('wide');
	}
}
function closeEdit() {
	getAllMedia(false,true);
	setTimeout(()=>{
		if (!globalPlayer.leftOpen && !embedForm.status && !addMediaForm.status && !editAlbumArtForm.status ) {
			$('#left').addClass('closed');
			$('#main').addClass('wide');
		}
		if ( video_player.lyrics_parent.hasClass("lock") )	video_player.lyrics_parent.removeClass("lock");
		if ( video_player.controls_container.hasClass("lock") ) video_player.controls_container.removeClass("lock");

		editMediaForm.closeForm();

		$(globalPlayer.leftSongs).show();
	},500);
}

function initializeEditAlbumArtForm(I) {
	var F = {};
	
	/* --- VARIALBE/REFERENCE SETUP --- */
	F.status = (I && I.status) ? I.status : false;
	F.close = (I && I.close) ? I.close : $('#closeAlbumArtEdit');
	F.form = (I && I.form) ? I.form : $('#editAlbumArtForm');
	F.display = (I && I.display) ? I.display : document.getElementById('editAlbumArtDisplay');
	F.new_upload_input = (I && I.new_upload_input) ? I.new_upload_input : document.getElementById('edit_album_art_form_input');
	F.alternativesContainer = (I && I.alternativesContainer) ? I.alternativesContainer : $('#editAlbumArtAlternativesContainer');
	F.array = null;
	F.id = -1;
	F.iconEdit = null;
	F.iconEditSet = -1;

	/* --- FUNCTIONS --- */
	F.openForm = (I && I.openForm) ? I.openForm : function() {
		F.form.show()
		F.status = true;
	}
	F.closeForm = (I && I.closeForm) ? I.closeForm : function() {
		F.form.hide();
		F.status = false;
		F.id = -1;
		F.iconEdit = null;
		F.iconEditSet = -1;
	}
	F.ajax = (I && I.ajax) ? I.ajax : function(ajaxParams, callback, errorCallback = null, printLog=false, returnType = 'json') {
		$.ajax(ajaxParams).done(function(response){
			if (returnType == 'json') {
				if (response.success) callback(response);
				else if (errorCallback != null) errorCallback(response);
				else alert(response.message);
			} else {
				callback(response);
			}
		}).fail(function(jqXHR, textStatus, errorThrown){
			alert('AJAX Error:\n'+ajaxParams.url+'\n'+errorThrown);
		}).always(function(response) {
			if (printLog) console.log(response);
		});
	}
	F.make = (I && I.make) ? I.make : function(desc) {
		if ( !F.isArray(desc) ) return false;
		var tag = desc[0], attributes = desc[1];
		var el = document.createElement(tag);
		var start = 1;
		if ( (attributes!=null) && (typeof attributes === 'object') && !F.isArray(attributes) ) {
			for (var attr in attributes) {
				switch(attr){
					case 'class':
						el.className = attributes[attr];
						break;
					case 'checked':
						el.checked = attributes[attr];
						break;
					case 'html':
						el.innerHTML = attributes[attr];
						break;
					default:
						el.setAttribute(attr, attributes[attr]);
				}
			}
			start = 2;
		}
		for (var i = start; i < desc.length; i++) {
			if (F.isArray(desc[i])) el.appendChild(make(desc[i]));
			else el.appendChild(document.createTextNode(desc[i]));
		}
		return el;
	}
	F.startAlbumArtEdit = (I && I.startAlbumArtEdit) ? I.startAlbumArtEdit : function(album_id) {
		F.ajax({url:'scripts/simpleMusicPlayer.php?get=4',type:'POST',data:'albumId='+album_id,dataType:'json'},function(response) {
			F.display.src = (response['data']['art'] != null) ?  response['data']['art'] :  'assets/default_album_art.jpg#' + new Date().getTime();
			if ( F.array != response['data']['data'] ) {
				F.alternativesContainer.empty();
				F.array = response['data']['data'];
				var alternativeHtml, alternativeLabel;
				for (var index in response['data']['data']) {
					alternativeHtml = F.make(['div',{class:'item alternate'},['img',{class:'item previewItem',src:response['data']['data'][index],alt:''}],['input',{type:'radio',class:'inputRadio alternateRadio',id:'alternate_art_for_album_art_edit_'+index,name:'alternate_art_for_album_art_edit',value:index}]]);
					alternativeLabel = F.make(['label',{for:'alternate_art_for_album_art_edit_'+index,class:'item previewLabel hover alternateAlbumArtLabel','data-id':index}]);
					alternativeLabel.addEventListener('click',function() {
						F.iconEdit = null;
						F.iconEditSet = 0;
						var alternative_id = this.getAttribute('data-id');
						F.display.src = F.array[alternative_id];
					});
					alternativeHtml.appendChild(alternativeLabel);
					F.alternativesContainer.append(alternativeHtml);
				}
			}
			F.iconEdit = null;
			F.iconEditSet = -1;
			F.id = album_id;
		},true);
	}
	F.prepareAlbumArtEdit = (I && I.prepareAlbumArtEdit) ? I.prepareAlbumArtEdit : function(event) {
		var url = event.target.value;
		var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
		var extensions = ['png', 'jpeg', 'jpg']
		if (event.target.files && event.target.files[event.target.files.length-1] && (extensions.indexOf(ext) > -1 )) {
			var reader = new FileReader();
			reader.onload = function (e) {
				var srcData = e.target.result; // <--- data: base64
				F.display.src = srcData;	
			}
			reader.readAsDataURL(event.target.files[event.target.files.length-1]);
			F.iconEdit = event.target.files;
			console.log(event.target.files);
			F.iconEditSet = 1;
		} 
		else {
			F.display.src = 'assets/default_album_art.jpg';
			alert("That image is not a proper image file (jpg or png)");
		}
	}
	F.submitAlbumArtEdit = (I && I.submitAlbumArtEdit) ? I.submitAlbumArtEdit : function(event) {
		event.stopPropagation();
		event.preventDefault();
		var data, performAjax;
		if ( F.iconEditSet == -1 ) {
			// A new image was not selected
			alert('A new image was not chosen.\nPlease select a new image or close out of the edit screen.');
			return;
		} else if (F.iconEditSet == 0) {
			// An alternative art was used, and a new art was not uploaded
			data = F.form.serialize();
			F.ajax({url:'scripts/simpleMusicPlayer.php?get=6&album_id='+F.id+'&iconEditSet='+F.iconEditSet,data:data,type:'POST',dataType:'json'},function(response) {
				alert('Existing album art successfully selected!');
			},function(response) {
				console.log(response);
			});
		}
		else if (F.iconEditSet == 1) {
			data = new FormData();
			$.each(F.iconEdit, function(key, value) {
				data.append(key, value);
			});
			F.ajax({url:'scripts/simpleMusicPlayer.php?get=6&album_id='+F.id+'&iconEditSet='+F.iconEditSet,data:data,type:'POST',dataType:'json',cache:false,processData:false,contentType:false},function(response) {
				alert('New album art successfully uploaded!')
			});
		}
		else {
			// We wanted to upload a new file, but a new file was not set
			alert('You wished to upload a new file...\nBut a new file was not set.');
			return;
		}
	}

	/* --- CLICK EVENTS --- */
	F.new_upload_input.addEventListener('change',F.prepareAlbumArtEdit);
	F.form.on("submit", F.submitAlbumArtEdit);

	return F;
}
function openAlbumArtEdit() {
	$(globalPlayer.leftSongs).hide();
	embedForm.closeForm();
	editMediaForm.closeForm();
	addMediaForm.closeForm();
	
	editAlbumArtForm.openForm();

	if (!globalPlayer.leftOpen) {
		$('#left').removeClass('closed');
		$('#main'),removeClass('wide');
	}
}
function closeAlbumArtEdit() {
	getAllMedia(false,true);
	setTimeout(()=>{
		if (!globalPlayer.leftOpen && !embedForm.status && !addMediaForm.status && !editMediaForm.status ) {
			$('#left').addClass('closed');
			$('#main').addClass('wide');
		}
		editAlbumArtForm.closeForm();
		$(globalPlayer.leftSongs).show();

	},500);
}

function initializeEmbedForm(I) {
	var F = {};

	/* --- VARIALBE/REFERENCE SETUP --- */
	F.status = (I && I.status != null && typeof I.status === 'boolean') ? I.status : false;
	F.form = (I && I.form) ? I.form : $("#embedInputForm");
	F.open = (I && I.open) ? I.open : $("#openEmbed");
	F.close = (I && I.close) ? I.close : $("#closeEmbed");
	F.totalError = (I && I.totalError) ? I.totalError : $("#embedTotalError");

	/* --- FUNCTIONS --- */
	F.ajax = (I && I.ajax) ? I.ajax : function(ajaxParams, callback, errorCallback = null, printLog=false, returnType = 'json') {
		$.ajax(ajaxParams).done(function(response){
			if (returnType == 'json') {
				if (response.success) callback(response);
				else if (errorCallback != null) errorCallback(response);
				else alert(response.message);
			} else {
				callback(response);
			}
		}).fail(function(jqXHR, textStatus, errorThrown){
			alert('AJAX Error:\n'+ajaxParams.url+'\n'+errorThrown);
		}).always(function(response) {
			if (printLog) console.log(response);
		});
	}
	F.openForm = (I && I.openForm) ? I.openForm : function() {
		F.form.find('.textInput').val('');
		F.form.find(".inputError").text('');
		F.form.show();
		F.status = true;
	}
	F.closeForm = (I && I.closeForm) ? I.closeForm : function() {
		F.form.find('.textInput').val('');
		F.form.hide();
		F.status = false;
	}
	F.submitEmbed = function(event) {
		event.stopPropagation(); 	// Stop stuff happening
		event.preventDefault(); 	// Totally stop stuff happening
		var data = F.form.serialize();
		F.ajax({url:'scripts/simpleMusicPlayer.php?get=8&input=1',type:'POST',data: data,dataType:'json'},function(response){
			alert('Successfully Inserted New Embed!');
		},function(response){
			console.log(response);
			F.totalError.text(response.message).addClass('opened');
			if ( response['data']['inputErrors'] != null ) {
				for (var error_type in response['data']['inputErrors']) {
					F.form.find('#embed_'+error_type+'_Error').text(response['data']['inputErrors'][error_type]);
				}
			}
			else alert(response['message']);
		});
	}

	/* --- CLICK EVENTS --- */
	F.form.on("submit", F.submitEmbed);
	F.totalError.on('click focus', function() {
		this.classList.remove("opened");
	});

	return F;
}
function openEmbed() {
	$(globalPlayer.leftSongs).hide();

	editMediaForm.closeForm();
	editAlbumArtForm.closeForm()
	addMediaForm.closeForm();

	embedForm.openForm();

	if (!globalPlayer.leftOpen) {
		$('#left').removeClass('closed');
		$('#main').removeClass('closed');
	}
}
function closeEmbed() {
	getAllMedia(false,true);
	setTimeout(()=>{
		if (!editMediaForm.status && !editAlbumArtForm.status && !addMediaForm.status && !globalPlayer.leftOpen) {
			$('#left').addClass('closed');
			$('#main').addClass('wide');
		}
		embedForm.closeForm();
		$(globalPlayer.leftSongs).show();
	},500);
}

function initializeAddMediaForm(I) {
	var F = {};

	/* --- VARIALBE/REFERENCE SETUP --- */
	F.status = (I && I.status != null && typeof I.status === 'boolean') ? I.status : false;
	F.open = (I && I.open) ? I.open : $('#openAddMediaForm');
	F.close = (I && I.close) ? I.close : $('#closeAddMediaForm');
	F.form = (I && I.form) ? I.form : $('#addMediaForm');
	F.input = (I && I.input) ? I.input : document.getElementById('addMediaFormInput');
	F.submit = (I && I.submit) ? I.submit : $('#addMediaFormSubmit');
	F.dropArea = (I && I.dropArea) ? I.dropArea : document.getElementById('addMediaDropArea');
	F.files = {};

	/* --- FUNCTIONS --- */
	F.isArray = (I && I.isArray) ? I.isArray : function (a) {	return Object.prototype.toString.call(a) === "[object Array]";	}
	F.formatBytes = (I && I.formatBytes) ? I.formatBytes : function(a,b) {
		if(0==a) return"0 Bytes";
		var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));
		return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]
	}
	F.make = (I && I.make) ? I.make : function(desc) {
		if ( !F.isArray(desc) ) return false;
		var tag = desc[0], attributes = desc[1];
		var el = document.createElement(tag);
		var start = 1;
		if ( (attributes!=null) && (typeof attributes === 'object') && !F.isArray(attributes) ) {
			for (var attr in attributes) {
				switch(attr){
					case 'class':
						el.className = attributes[attr];
						break;
					case 'checked':
						el.checked = attributes[attr];
						break;
					case 'html':
						el.innerHTML = attributes[attr];
						break;
					default:
						el.setAttribute(attr, attributes[attr]);
				}
			}
			start = 2;
		}
		for (var i = start; i < desc.length; i++) {
			if (F.isArray(desc[i])) el.appendChild(make(desc[i]));
			else el.appendChild(document.createTextNode(desc[i]));
		}
		return el;
	}
	F.openForm = (I && I.openForm) ? I.openForm : function() {
		F.form.show();
		F = true;
	}
	F.closeForm = (I && I.closeForm) ? I.closeForm : function() {
		F.form.hide();
		F.status = false;
		F.files = {};
		$('.addMediaItem').remove();
		return;
	}
	F.addMedia = function(event) {
		event.stopPropagation();
		event.preventDefault();

		var newFilesArray = [];
		for (var key in F.files) {
			newFilesArray.push(F.files[key]);
		}

		var promises = [], successes = [], failures = [];
		var temp, tempFile, tempHtml, typeImage;
		$.each(newFilesArray, function(key, value) {
			let temp = new FormData();
			let tempFile = value['FILE'];
			let tempHtml = value['HTML'];
			temp.append('file',tempFile);
			let typeImage = ( tempFile.type.startsWith('video') ) ? 'assets/video.png' : 'assets/audio.png';
			tempHtml.querySelector('.addMediaArtInner img').src = 'assets/loading.gif';
			if (tempHtml.classList.contains('failed')) tempHtml.classList.remove('failed');

			var request = $.ajax({url:'scripts/simpleMusicPlayer.php?get=11',type:'POST',data:temp,dataType:'json',cache:false,processData:false,contentType:false})
				.done(function(response){
					if(response.success) successes.push(tempFile.size+'|'+tempFile.lastModified);
					else failures.push(value);
					tempHtml.querySelector('.addMediaArtInner img').src = typeImage;
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					console.log(errorThrown);
				});
			promises.push(request);
		});
		$.when.apply(null,promises).done(function() {
			var toPrint = false;
			if (successes.length > 0) {
				console.log("Successfully Added Files:");
				console.log(successes);
				F.removeFiles(successes);
			}
			if (failures.length > 0) {
				console.log("Failed To Add Files:");
				console.log(failures);
				var failString = '';
				failures.forEach(file=>{
					failString += tempFile.name + '\n';
					tempHtml.classList.add('failed');
				});
				alert('Failed to add the following files:\n'+failString + '\nMost common reasons include:\n- File size exceeds 96 Megabytes\n- The file is a format not recognized by the player');
			}
		});
	}
	F.handleDrop = function(e) {
		var dt = e.dataTransfer;
		var files = dt.files;
		F.addFiles(files);
	}
	F.addFiles = function(files) {
		var type, size, modified, name, fileObject;
		([...files]).forEach(file=>{
			type = file.type;
			size = file.size;
			modified = file.lastModified;
			name = file.name;
			if ( !type.startsWith('audio') && !type.startsWith('video') ) {
				alert('The following file could not be uploaded:\n"'+name+'"\nReason: File is neither an audio or video file');
				return;
			}
			fileObject = {'FILE':file,'HTML':F.previewFile(file)};
			F.dropArea.appendChild(fileObject.HTML);
			F.files[size+'|'+modified] = fileObject;
		});
		console.log(F.files);
	}
	F.removeFiles = function(ids) {
		//ids is an array containing the 'id's of the files they want to remove, with the 'id's being the indexes of the files inside addMediaForm.files object list
		console.log(ids);
		console.log(F.files);
		ids.forEach(id=>{
			F.files[id].HTML.outerHTML = '';
			delete F.files[id];
		});
		console.log(F.files);
	}
	F.previewFile = function(file) {
		var name = file.name;
		var modified = file.lastModified;
		var size = file.size;
		var type = file.type;
		var typeImage = (type.startsWith('video')) ? 'assets/video.png' : 'assets/audio.png';
		var addMediaItem = F.make(['div',{class:'addMediaItem',id:'addMediaItem_'+size+'|'+modified},['div',{class:'addMediaArt'},['div',{class:'addMediaArtInner'},['img',{src:typeImage,alt:''}]]],['div',{class:'addMediaText'},['span',{class:'addMediaTitle'},name],['span',{class:'addMediaSize'},F.formatBytes(size)]]]);
		var cancelElement = F.make(['span',{class:'cancel addMediaItemCancel','data-id':size+'|'+modified},'X']);
		cancelElement.addEventListener('click',function() {
			var id = this.getAttribute('data-id');
			F.removeFiles([id]);
		});
		addMediaItem.appendChild(cancelElement);
		return addMediaItem;
	}
	function preventDefaults (e) {
		e.preventDefault();
		e.stopPropagation();
	}
	function highlight(e) {
		F.dropArea.classList.add('highlight');
	}
	function unhighlight(e) {
		F.dropArea.classList.remove('highlight');
	}

	/* --- MISC. SETUP --- */
	['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
		F.dropArea.addEventListener(eventName, preventDefaults, false);
	});
	['dragenter', 'dragover'].forEach(eventName => {
		F.dropArea.addEventListener(eventName, highlight, false);
	});
	['dragleave', 'drop'].forEach(eventName => {
		F.dropArea.addEventListener(eventName, unhighlight, false);
	});

	/* --- CLICK EVENTS --- */
	F.input.addEventListener('change',function() {
		F.addFiles(this.files);
	},false);
	F.dropArea.addEventListener('drop',F.handleDrop,false);
	F.form.on('submit',F.addMedia);

	return F;
}
function openAdd() {
	$(globalPlayer.leftSongs).hide();
	editMediaForm.closeForm();
	editAlbumArtForm.form.hide();
	embedForm.closeForm();
	
	addMediaForm.openForm();

	if (!globalPlayer.leftOpen) {
		$('#left').removeClass('closed');
		$('#main').removeClass('closed');
	}
}
function closeAdd() {
	getAllMedia(false, true);
	setTimeout(()=>{
		if (!editMediaForm.status && !editAlbumArtForm.status && !embedForm.status && !globalPlayer.leftOpen) {
			$('#left').addClass('closed');
			$('#main').addClass('wide');
		}
		addMediaForm.closeForm();
		$(globalPlayer.leftSongs).show();
	},500);
}

$(document).ready(function() {
	/* Setting Global Variables */
	globalPlayer = {
		leftSongs:document.getElementById('leftSongs'),
		leftOpen:true,
		leftToggle:$('#toggleLeft'),
		background:document.getElementById('background'),
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
		//current_time:"-3599999",
		current_time:-1,
		current_time_index:-1,
		ignoreOnTimeUpdate:false,
		startPadding:0,
		endPadding:3599999,
		canPlay:false,
		volume:100,
		lyricsHeight:0,
		database: [],
		queue: [],
		searchResults:document.getElementById('searchResults'),
		searchElement:document.getElementById('searchInput'),
		searchFindings: {}
	};
	editMediaForm = initializeEditMediaForm({
		make:make,
		ajax:ajaxCall,
		setBackground:setBackground,
		updateCurrent:updateCurrent
	});
	editAlbumArtForm = initializeEditAlbumArtForm({
		make:make,
		ajax:ajaxCall
	}),
	embedForm = initializeEmbedForm({
		ajax:ajaxCall
	});
	addMediaForm = initializeAddMediaForm({
		isArray:isArray,
		make:make
	});
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

	/* Initialization Functions */
	globalPlayer.currentPlayer = audio_player;
	setTimeout(function(){
		getAllMedia();
	},500);

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
	globalPlayer.leftToggle.on('click',function() {
		$('#left').toggleClass('closed');
		$('#main').toggleClass('wide');
		globalPlayer.leftOpen = !globalPlayer.leftOpen;
	});
	

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
	$(document).on("click", ".item.options", function(event) {
		event.stopPropagation();
		
		var parent = $(this).parent();
		var curId = parent.attr("data-id");
		var curEditingId = editMediaForm.songId.val();
		if (!editMediaForm.status) {
			editMediaForm.startEdit(curId);
			setTimeout(()=>{
				openEdit();
			},500);
		}
		else if (globalPlayer.currentSong != curId) {
			if (curEditingId != curId) F.startEdit(curId);
			else closeEdit();
		} else {
			if (curEditingId != curId) F.startEdit(curId);
			else closeEdit();
		}
	});

	$(globalPlayer.searchElement).on('focus', function(e) {
		if (Object.keys(globalPlayer.searchFindings).length > 0) globalPlayer.searchResults.classList.add('show')
	}).on('blur',function(e) {
		setTimeout(function(){
			globalPlayer.searchResults.classList.remove('show');
		}, 200);
	});
	globalPlayer.searchElement.addEventListener('keyup', function(e){
		if (e.keyCode == 13) return;
		else if (globalPlayer.searchElement.value.length >= 3) {
			globalPlayer.searchFindings = search(globalPlayer.searchElement.value);
			$(globalPlayer.searchResults).empty();
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
					globalPlayer.searchResults.appendChild(albumContainer);
				}
				globalPlayer.searchResults.classList.add('show');
  			}
  		} 
  		else globalPlayer.searchResults.classList.remove('show');
	});
	$(document).on('click','.searchSong', function() {
		console.log('searchSong');
		var id = $(this).attr('data-id');
		var medium = $(this).attr('data-medium');
		openSong(id, medium);
	});

	/* Edit Album Art Form-related functions */
	$(document).on("click", ".addAlbumArt_button", function() {
		editAlbumArtForm.startAlbumArtEdit( parseInt($(this).attr("data-id")) );	
		openAlbumArtEdit();
	});
	editAlbumArtForm.close.on('click',closeAlbumArtEdit);

	/* Embed Form-related functions */
	embedForm.open.on("click", openEmbed);
	embedForm.close.on("click", closeEmbed);

	/* Add Media Form-related Click Events */
	addMediaForm.open.on('click',openAdd);
	addMediaForm.close.on('click',closeAdd);


	/* Edit Form-related functions */
	audio_player.optionsButton.on('click', function() {
		if (!editMediaForm.status) {
			editMediaForm.startEdit(globalPlayer.currentSong);
			setTimeout(()=>{
				openEdit();
			},500);
		}
		else {
			if (editMediaForm.songId.val() != globalPlayer.currentSong) editMediaForm.startEdit(globalPlayer.currentSong);
			else closeEdit();
		}
	});
	editMediaForm.close.on('click', closeEdit);


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
    	if (!editMediaForm.status) {
    		editMediaForm.startEdit(globalPlayer.currentSong);
    		setTimeout(()=>{
    			openEdit();
    		},500);
    	}
		else {
			var curId = editMediaForm.songId.val();
			if (curId != globalPlayer.currentSong) editMediaForm.startEdit(globalPlayer.currentSong);
			else closeEdit();
		}
    });
	video_player.autoscrollButton.on('click', videoAutoscrollToggle);
});

