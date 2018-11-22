var globalPlayer, editAlbumArtForm, embedForm, addMediaForm, audio_player, video_player;
var screenHeight = window.innerHeight;
var onlineConnection = false;
var mousePos = {
	x: 0,
	y: 0
};

/*
var wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: 'violet',
    progressColor: 'purple',
    barWidth:2
});
wavesurfer.load('media/1.m4a');
wavesurfer.on('ready', function () {
    //wavesurfer.play();
    console.log("balls");
});
*/

/* Youtube Setup - If no online connection detected, then all youtube embedded entries are not available */
function onYouTubeIframeAPIReady() {
	console.log("YouTube API Ready");
	onlineConnection = true;
}
function getMousePos(e) {
	return {x:e.clientX,y:e.clientY};
}
function setHeaderPos(headerPos = 'top', listPos = 'left') {
	var header = document.getElementById('bodyHeader');
	globalPlayer.headerPos = headerPos;
	header.classList.add('hidden');

	switch(headerPos) {
		case 'top':
			header.classList.remove('bottom');
			globalPlayer.listContainer.classList.remove('headerBottom');
			break;
		case 'bottom':
			header.classList.add('bottom');
			globalPlayer.listContainer.classList.add('headerBottom');
			break;
		default:
			header.classList.remove('bottom');
			globalPlayer.listContainer.classList.remove('headerBottom');
	}

	console.log(listPos);
	globalPlayer.listPos = listPos;
	switch(listPos) {
		case 'left':
			header.classList.remove('listRight');
			globalPlayer.listContainer.classList.add('left');
			globalPlayer.listContainer.classList.remove('right');
			break;
		case 'right':
			header.classList.add('listRight');
			globalPlayer.listContainer.classList.add('right');
			globalPlayer.listContainer.classList.remove('left');
			break;
		default:
			header.classList.remove('listRight');
			globalPlayer.listContainer.classList.add('left');
			globalPlayer.listContainer.classList.remove('right');
	}

	setTimeout(()=>{
		header.classList.remove('hidden');
	},300);
	return;
}
function isArray(a) {	return Object.prototype.toString.call(a) === "[object Array]";	}
function formatBytes(a,b){if(0==a)return"0 Bytes";var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]}
function make(desc) {
	// Probably a good idea to check if 'desc' is an array, but this can be done later;
	if ( !isArray(desc) ) return false;
	var tag = desc[0], attributes = desc[1];
	var el = document.createElement(tag);
	var start = 1;
	if ( (attributes!=null) && (typeof attributes === 'object') && !isArray(attributes) ) {
		for (var attr in attributes) {
			switch(attr) {
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
function milliseconds(seconds) {	return Math.floor(seconds*1000);	}
function revertFromMilliseconds(millisec) {	return millisec / 1000;	}

function setBackground(img, backgroundElement = null, blur = 3) {
	var canvas = ( backgroundElement && backgroundElement.tagName === 'CANVAS' ) ? backgroundElement : make(['canvas',{style:'position:absolute;width:100%;height:100%;top:0;bottom:0;left:0;right:0;background-color:transparent;'}]);
	var ctx = canvas.getContext('2d');
	if (img) {
		ctx.filter = 'blur('+blur+'px)';
		var imgObj = new Image();
		imgObj.src = (img.startsWith('data')) ? img : img + '#' + new Date().getTime();
		imgObj.onload = function() {
			ctx.drawImage(	imgObj,	canvas.width / 2 - imgObj.width / 2,	canvas.height / 2 - imgObj.height / 2);
		}
	} else {
		ctx.rect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = 'rgb(100,100,100)';
		ctx.fill();
	}
	return canvas;
}
function toggleFullScreen() {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen();
	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen(); 
		}
	}
}
/*
function ajaxCall(ajaxParams, callback, errorCallback = null, printLog=false, returnType = 'json') {
	$.ajax(ajaxParams).done(function(response){
		if (returnType == 'json') {
			if (response.success) callback(response);
			else if (errorCallback != null) errorCallback(response);
			else alert(response.message);
		} 
		else callback(response);
	}).fail(function(jqXHR, textStatus, errorThrown){
		alert('AJAX Error:\n'+ajaxParams.url+'\n'+errorThrown);
	}).always(function(response) {
		if (printLog) console.log(response);
	});
}
*/

function onTimeUpdate(track, embedTime = null) {
	var curMillisec, curTime;
	if (globalPlayer.currentMediaType == 1) curMillisec = embedTime * 1000;
	else curMillisec = milliseconds(track.currentTime);
	curTime = readableDuration(curMillisec);
	globalPlayer.controls.timeDisplay.innerHTML = curTime;
	if (curMillisec > globalPlayer.endPadding) return;

	if (globalPlayer.currentMediaType == 1 && !globalPlayer.currentPlayer.lock_time_slider) globalPlayer.controls.timeSlider.value = curMillisec;
	else globalPlayer.controls.timeSlider.value = curMillisec;

	if (globalPlayer.dynamic_lyrics_toggle && globalPlayer.scrollToLyrics && globalPlayer.dynamic_lyrics_starting_times != null && !globalPlayer.ignoreOnTimeUpdate) {
		if ( (curMillisec < globalPlayer.current_time) || (curMillisec >= globalPlayer.dynamic_lyrics_starting_times[globalPlayer.current_time_index + 1]) ) {
			document.querySelectorAll('.lyric_segment.selected').forEach(el=>{
				el.classList.remove('selected');
			});
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
			document.querySelectorAll('.lyric_segment_'+globalPlayer.current_time).forEach(el=>{
				el.classList.add('selected');
			})
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
function initializeSettings() {
	var xhr = new XMLHttpRequest();
	xhr.open('GET','scripts/simpleMusicPlayer.php?get=8');
	xhr.onload = function() {
		if (xhr.status === 200) {
			var response = JSON.parse(xhr.responseText);
			if (response.success) {
				var receivedSettings = response['data'];
				globalPlayer.loop = receivedSettings['loop'];
				globalPlayer.shuffle = receivedSettings['shuffle'];
				globalPlayer.volume = parseInt(receivedSettings['volume']);
				globalPlayer.headerPos = receivedSettings['headerPos'];
				globalPlayer.listPos = receivedSettings['listPos'];
				setLoop(globalPlayer.loop);
				setShuffle(globalPlayer.shuffle);
				volumeAdjust(globalPlayer.volume);
				setHeaderPos(globalPlayer.headerPos, globalPlayer.listPos);
			} else {
				alert(response.message);
				console.log(response);
			}
		} else {
			alert('Request failed.  Returned status of ' + xhr.status);
		}
	}
	xhr.send();
}
function getAllMedia(update = false, print = true, scrollTo = -1) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET','scripts/simpleMusicPlayer.php?get=1');
	xhr.onload = function() {
		if (xhr.status === 200) {
			var response = JSON.parse(xhr.responseText);
			if (response.success) {
				var raw = response['data']['list'];
				var unsorted = {}, sorted = {}, tempMedia = null;
				var receivedSettings = response['data']['settings'];
				if (!onlineConnection) {
					console.log('YouTube API not detected - force removal of embed media from current list');
					response['data']['embedIDs'].forEach(id=>{
						delete raw[id];
					});
				}
				globalPlayer.database = raw;

				if (globalPlayer.listContainer.classList.contains('closed')) globalPlayer.listContainer.classList.remove('closed');

				for (var id in raw) {
					let tempMedia = raw[id];
					unsorted[tempMedia.album_artist] = (typeof unsorted[tempMedia.album_artist] !== 'undefined') ? unsorted[tempMedia.album_artist] : {
						'name':tempMedia.album_artist,
						'type':null,
						'albums':{}
					};
					unsorted[tempMedia.album_artist]['albums'][tempMedia.album] = (typeof unsorted[tempMedia.album_artist]['albums'][tempMedia.album] !== 'undefined') ? unsorted[tempMedia.album_artist]['albums'][tempMedia.album] : {
						'id':tempMedia.album_id,
						'art':tempMedia.albumArt,
						'songs':[]
					};
					unsorted[tempMedia.album_artist]['albums'][tempMedia.album]['songs'].push({
						'id':tempMedia.id,
						'title':tempMedia.title,
						'artist':tempMedia.artist,
						'medium':tempMedia.medium,
						'url':tempMedia.url
					});
				}

				Object.keys(unsorted).sort().forEach(key=>{
					sorted[key] = unsorted[key];
				});

				if (print) {
					printMedia(sorted);
				}

				if (scrollTo != -1) {
					var elmnt = document.getElementById(scrollTo);
					elmnt.classList.add('edited');
					globalPlayer.listSongs.scrollTo({
					    'behavior': 'smooth',
					    'top': elmnt.offsetTop - (screenHeight/2) + (elmnt.offsetHeight/2)
					});
					if (document.getElementById(globalPlayer.currentSong)) document.getElementById(globalPlayer.currentSong).classList.add('selected');
					if (update) updateCurrent();
				}
			}
			else {
				alert(response.message);
				console.log(response);
			}
		}
		else {
			alert('Request failed.  Returned status of ' + xhr.status);
		}

	}
	xhr.send();
}

function printMedia(sortedDatabase) {

	function compareTitles(a,b) {
		if (a.title < b.title) return -1;
		if (a.title > b.title) return 1;
		return 0;
	}

	globalPlayer.listSongs.innerHTML = '';
	globalPlayer.listSongs.style.visibility = 'hidden';
	var html, keys, album, albumArt, albumHTML, innerAlbumHTML, albumArtHTML, addAlbumArButton, albumSongList, songToAppend, optionButton;
	for (var index in sortedDatabase) {
		html = make(['div',{class:'container albumArtist'},['div',{class:'item albumArtist'},['h1',sortedDatabase[index]['name']] ]]);
		let keys = Object.keys(sortedDatabase[index]['albums']);
		keys.sort();
		for(var i = 0; i < keys.length; i++) {
			let album = keys[i];
			let albumHTML = make(['div',{class:'container album',id:'album_'+album}]);
			let innerAlbumHTML = make(['div',{class:'item album'}]);
			let albumArt = (sortedDatabase[index]['albums'][album]['art'].startsWith('data')) ? sortedDatabase[index]['albums'][album]['art'] : sortedDatabase[index]['albums'][album]['art'] + '#'+ new Date().getTime();
			let albumArtHTML = make(['div',{class:'container albumArt'},['img',{class:'item albumArt',src:albumArt,alt:''}]]);
			let addAlbumArtButton = make(['span',{class:'item addAlbumArt_button','data-id':sortedDatabase[index]['albums'][album]['id']},'Change Artwork']);
			addAlbumArtButton.addEventListener('click',function() {
				editAlbumArtForm.startAlbumArtEdit( parseInt(this.dataset.id) );	
				openAlbumArtEdit();
			});
			albumArtHTML.appendChild(addAlbumArtButton);
			innerAlbumHTML.appendChild(albumArtHTML);
			innerAlbumHTML.appendChild(make(['h2',album]));
			albumHTML.appendChild(innerAlbumHTML);
			let albumSongList = make(['div',{class:'container albumSongList'}]);
			sortedDatabase[index]['albums'][album]['songs'].sort(compareTitles);
			sortedDatabase[index]['albums'][album]['songs'].forEach(function(d, index) {
				let songToAppend = make(['div',{class:'item song', id:d['id'], 'data-id':d['id'], 'data-medium':d['medium']}]);
				songToAppend.addEventListener('click', function() {
					var id = this.dataset.id;
					var medium = this.dataset.medium;
					songClicked(id, medium);
				});
				songToAppend.addEventListener('contextmenu', function(ev) {
					ev.preventDefault();
					globalPlayer.songToEdit = d['id'];
					globalPlayer.controls.contextMenu.style.top = mousePos.y - 5 + 'px';
					globalPlayer.controls.contextMenu.style.left = mousePos.x - 5 + 'px';
					globalPlayer.controls.contextMenu.style.display = 'block';
					return false;
				}, false);
				if (d['medium'] == 1) songToAppend.appendChild(make(['img',{class:'item icon',src:'assets/youtube.png',alt:'YouTube'}]));
				else if (d['medium'] == 2) songToAppend.appendChild(make(['img',{class:'item icon',src:'assets/video.png',alt:'Video'}]));
				songToAppend.appendChild(make(['div',{class:'container text'},['span',{class:'item title'},d['title']],['span',{class:'item artist'},d['artist']]]));
				albumSongList.appendChild(songToAppend);
			});
			albumHTML.appendChild(albumSongList);
			html.appendChild(albumHTML);
		}
		globalPlayer.listSongs.appendChild(html);
	}
	setTimeout(()=>{
		globalPlayer.listSongs.querySelectorAll('.container.albumArt').forEach(e=>{
			let thisHeight = e.clientHeight;
			let thisWidth = e.clientWidth;
			e.parentNode.style.minHeight = thisHeight + 'px';
			e.nextSibling.style.paddingLeft = thisWidth + 40 + 'px';
		});
		globalPlayer.listSongs.style.visibility = 'visible';
	},500);
}

function updateCurrent() {
	var xhr = new XMLHttpRequest();
	xhr.open('POST','scripts/simpleMusicPlayer.php?get=2');
	xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
	xhr.onload = function() {
		if (xhr.status === 200) {
			var response = JSON.parse(xhr.responseText);
			if (response.success) {
				var arr = response['data']['info'];

				globalPlayer.startPadding = arr['start_padding'];
				globalPlayer.endPadding = arr['end_padding'];
				globalPlayer.currentAlbum = arr['album_id'];
				globalPlayer.currentAlbumArtist = arr['album_artist_id'];
				
				globalPlayer.currentPlayer.title.innerHTML = arr['title'];
				globalPlayer.currentPlayer.artist.innerHTML = arr['artist'];
				while(globalPlayer.currentPlayer.lyrics.firstChild) globalPlayer.currentPlayer.lyrics.removeChild(globalPlayer.currentPlayer.lyrics.firstChild);
				globalPlayer.currentPlayer.lyrics.innerHTML = (arr['lyrics']) ? arr['lyrics'] : '';

				if (arr.dynamic_lyrics_toggle == 1) {
					globalPlayer.dynamic_lyrics_toggle = true;
					globalPlayer.dynamic_lyrics_starting_times = arr['dynamic_lyrics_starting_times'];
					globalPlayer.lyricScrollOff = false;
				}
				else if (globalPlayer.currentMediaType == 0) {
					globalPlayer.dynamic_lyrics_toggle = false;
					globalPlayer.dynamic_lyrics_starting_times = null;
					globalPlayer.lyricScrollOff = true;
				}

				if (globalPlayer.currentMediaType == 0) {
					if (!arr['lyrics']) globalPlayer.currentPlayer.lyrics.parentNode.style.display = 'none';
					else globalPlayer.currentPlayer.lyrics.parentNode.style.display = 'block';
					setBackground(arr['art'], globalPlayer.background);
					globalPlayer.currentPlayer.art.src = arr['art']+'#'+ new Date().getTime();
					globalPlayer.lyricsHeight = globalPlayer.currentPlayer.lyrics.clientHeight;
				}


				globalPlayer.controls.autoscrollButton.classList.remove('locked');
				if (globalPlayer.scrollToLyrics) globalPlayer.controls.autoscrollButton.classList.add('active');
				else globalPlayer.controls.autoscrollButton.classList.remove('active');

				document.getElementById(arr.id).classList.add('selected');
				if (globalPlayer.loop == 2) createLoop(globalPlayer.currentAlbum, globalPlayer.currentSong, globalPlayer.currentAlbumArtist, globalPlayer.shuffle);
			}
			else {
				alert(response.message);
				console.log(response);
			}
		}
		else alert('Request failed.  Returned status of ' + xhr.status);

	}
	xhr.send('id='+globalPlayer.currentSong);
}

function songClicked(id, medium) {
		var selected = globalPlayer.listSongs.getElementsByClassName('selected')[0];
		if (selected) selected.classList.remove('selected');
		openMedia(id,true);
		var toSelect = globalPlayer.listSongs.querySelector('.song[data-id="'+id+'"][data-medium="'+medium+'"]');
		if (toSelect) {
			toSelect.classList.add('selected');
			if (medium == 0 || medium == 2) {
				globalPlayer.currentPlayer.html.play(); 
				if (globalPlayer.paused) {
					globalPlayer.controls.playButton.classList.add('playing');
					globalPlayer.paused = false;
				}
			}
		} 
		else alert("Selected Song Apparently Doesn't Exist In the Left Bar!");
	}

function showLyrics() {	audio_player.player_and_lyrics.classList.toggle('showLyrics');	}

function createLoop(albumId, songId, albumArtistId, shuffle) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST','scripts/simpleMusicPlayer.php?get=10');
	xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
	xhr.onload = function() {
		if (xhr.status === 200) {
			var response = JSON.parse(xhr.responseText);
			if (response.success) {
				addToLoop(response['data']);
			}
			else {
				alert(response.message);
				console.log(response.data);
			}
		}
		else if (xhr.status !== 200) {
			alert('Request failed.  Returned status of ' + xhr.status);
		}
	};
	xhr.send('albumId='+albumId+'&shuffle='+shuffle);
}
function addToLoop(arr) {
	globalPlayer.queue.length = 0;
	if (arr && arr.length > 0) {
		var ind = arr.indexOf(parseInt(globalPlayer.currentSong));
		for (var i = ind + 1; i < arr.length; i++) globalPlayer.queue.push(arr[i]);		
		if (ind != 0) for (var k = 0; k < ind; k++) globalPlayer.queue.push(arr[k]);
		globalPlayer.queue.push(parseInt(globalPlayer.currentSong));
	}
	console.log(globalPlayer.queue);
}

function loadQueue() {
	if (globalPlayer.loop == 2) createLoop(globalPlayer.currentAlbum, globalPlayer.currentSong, globalPlayer.currentAlbumArtist, globalPlayer.shuffle);
	else console.log(globalPlayer.queue);
}
function setLoop(value) {
	globalPlayer.loop = (value != null && typeof value === 'number') ? value : (globalPlayer.loop == 2) ? 0 : globalPlayer.loop + 1;
	switch(globalPlayer.loop){
		case 0:
			globalPlayer.controls.loopButton.classList.remove('one');
			globalPlayer.controls.loopButton.classList.remove('all');
			break;
		case 1:
			globalPlayer.controls.loopButton.classList.add('one');
			globalPlayer.controls.loopButton.classList.remove('all');
			break;
		case 2:
			globalPlayer.controls.loopButton.classList.remove('one');
			globalPlayer.controls.loopButton.classList.add('all');
			break;
		default:
			console.log('globalPlayer.loop not a possible number');
	}
	loadQueue();
}
function setShuffle(value) {
	globalPlayer.shuffle = (value != null && typeof value === 'number') ? value : (globalPlayer.shuffle == 1) ? 0 : 1;
	if (globalPlayer.shuffle == 1) globalPlayer.controls.shuffleButton.classList.add('on');
	else globalPlayer.controls.shuffleButton.classList.remove('on');
	loadQueue();
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
	globalPlayer.current_time = -1;
	globalPlayer.currentMediaType = parseInt(arr["medium"]);
	globalPlayer.currentAlbumArtist = arr["album_artist_id"];

	while (audio_player.lyrics.firstChild) audio_player.lyrics.removeChild(audio_player.lyrics.firstChild);
	while (video_player.lyrics.firstChild) video_player.lyrics.removeChild(video_player.lyrics.firstChild);

	if (globalPlayer.currentMediaType == 0) {

		globalPlayer.mediaContainer.classList.remove('video');
		globalPlayer.currentPlayer = audio_player;
		volumeAdjust(globalPlayer.volume);
		setBackground(arr['art'], globalPlayer.background);
		globalPlayer.currentPlayer.art.src = (arr['art']) ? (arr['art'].startsWith('data')) ? arr['art'] : arr['art'] + '#'+new Date().getTime() : 'assets/default_album_art.jpg';
		globalPlayer.controls.autoscrollButton.innerText = 'Autoscroll';
		if (globalPlayer.canPlay == true) {
			globalPlayer.currentPlayer.lyrics.innerHTML = (arr['lyrics']) ? arr['lyrics'] : '';
			globalPlayer.lyricsHeight = globalPlayer.currentPlayer.lyrics.clientHeight;
		} 
		else {
			globalPlayer.currentPlayer.lyrics.innerHTML = "<span class='lyric_segment noText'></span><span class='lyric_segment'>Loading Audio...</span><span class='lyric_segment noText'></span>";
			globalPlayer.lyricsHeight = globalPlayer.currentPlayer.lyrics.clientHeight;
		}
		if (arr['lyrics'] == null) {
			globalPlayer.currentPlayer.lyrics.parentNode.style.display = 'none';
			globalPlayer.currentPlayer.art.parentNode.classList.add('wider');
		}
		else {
			globalPlayer.currentPlayer.art.parentNode.classList.remove('wider');
			globalPlayer.currentPlayer.lyrics.parentNode.style.display = 'block';
		}

	} else {

		globalPlayer.mediaContainer.classList.add('video');
		setBackground('assets/black.png', globalPlayer.background);
		globalPlayer.currentPlayer = video_player;

		globalPlayer.currentPlayer.lyrics.innerHTML = (arr['lyrics']) ? arr['lyrics'] : '';
		globalPlayer.controls.autoscrollButton.innerText = 'Lyrics Toggle';

		if (globalPlayer.currentMediaType == 1) {
			globalPlayer.currentPlayer.embedPlayer = new YT.Player('video_embed', {
				width: 600,
				height: 400,
				videoId: arr['url'],
				playerVars: {
					controls:0,
					rel:0
				},
				events: {
					onReady: initializeEmbed,
					onStateChange: function(e) {
						if (e.data === YT.PlayerState.ENDED) {
							if (globalPlayer.loop == 1) globalPlayer.currentPlayer.embedPlayer.playVideo();
							else nextMedia();
						}
					}
				}
			});
			globalPlayer.currentPlayer.embedContainer = document.getElementById('video_embed');
		} else {
			volumeAdjust(globalPlayer.volume);
		}
	}

	globalPlayer.currentPlayer.title.innerHTML = arr['title'];
	globalPlayer.currentPlayer.artist.innerHTML = arr["artist"];
	globalPlayer.startPadding = arr['start_padding'];
	globalPlayer.endPadding = arr['end_padding'];
	
	clearTimeout(globalPlayer.mouseTimeout);
	clearInterval(globalPlayer.mouseInterval);
	video_player.titleArtistContainer.style.opacity = 1;
	globalPlayer.controls.container.style.opacity = 1;

	if (arr['dynamic_lyrics_toggle'] == 0 || !arr['lyrics']) {
		globalPlayer.dynamic_lyrics_toggle = false;
		globalPlayer.dynamic_lyrics_starting_times = null;
		globalPlayer.lyricScrollOff = true;
		globalPlayer.controls.autoscrollButton.classList.add('locked');
		globalPlayer.controls.autoscrollButton.classList.remove('active');
	} else {
		globalPlayer.dynamic_lyrics_toggle = true;
		globalPlayer.dynamic_lyrics_starting_times = arr["dynamic_lyrics_starting_times"];
		globalPlayer.lyricScrollOff = false;
		console.log(globalPlayer.scrollToLyrics);
		globalPlayer.controls.autoscrollButton.classList.remove('locked');
		if (globalPlayer.scrollToLyrics) globalPlayer.controls.autoscrollButton.classList.add('active');
		else globalPlayer.controls.autoscrollButton.classList.remove('active');
	}
}
function abortMedia() {
	pauseMedia();
	if (globalPlayer.currentMediaType == 1) {
		clearInterval(globalPlayer.currentPlayer.embedTimeUpdateInterval);
		globalPlayer.currentPlayer.embedTimeUpdateInterval = null;
		globalPlayer.currentPlayer.embedContainer.outerHTML = '';
		globalPlayer.currentPlayer.embedContainer = make(['div',{id:'video_embed'}]);
		document.getElementById('video_embed_inner_container').appendChild(globalPlayer.currentPlayer.embedContainer);
		if (globalPlayer.currentPlayer.embedPlayer != null) {
			globalPlayer.currentPlayer.embedPlayer.a.remove();
			globalPlayer.currentPlayer.embedPlayer = null;
		}
	}
	else {
		globalPlayer.currentPlayer.html.pause();
		globalPlayer.currentPlayer.html.src = '';
	}
	globalPlayer.controls.playButton.classList.remove('playing');
	globalPlayer.paused = true;
	globalPlayer.dynamic_lyrics_starting_times = null;
	globalPlayer.canPlay = false;
	globalPlayer.current_time_index = -1;
	globalPlayer.current_time = -1;
	globalPlayer.startPadding = 0;
	globalPlayer.endPadding = 3599999;

	while (audio_player.lyrics.firstChild) audio_player.lyrics.removeChild(audio_player.lyrics.firstChild);
	while (video_player.lyrics.firstChild) video_player.lyrics.removeChild(video_player.lyrics.firstChild);
}

function prepareLocalMedia(arr) {
	globalPlayer.currentPlayer.html.src = arr['url']+'?date='+new Date().getTime();
	globalPlayer.controls.durationDisplay.innerHTML = arr['duration'];
	loadLocalMedia(arr['id'], arr['url'], arr['lyrics']);
	if (milliseconds(globalPlayer.currentPlayer.html.currentTime < globalPlayer.startPadding)) globalPlayer.currentPlayer.html.currentTime = revertFromMilliseconds(globalPlayer.startPadding);
	globalPlayer.controls.timeSlider.max = globalPlayer.endPadding;
	globalPlayer.controls.timeSlider.value = milliseconds(globalPlayer.currentPlayer.html.currentTime);
	globalPlayer.controls.timeSlider.value = globalPlayer.startPadding;
}

function loadLocalMedia(id, url, lyrics){
	evt = new Event('load')
	globalPlayer.currentPlayer.html.dispatchEvent(evt);
	globalPlayer.currentPlayer.html.oncanplay = function() {
    	if (!globalPlayer.canPlay) {
			globalPlayer.currentPlayer.lyrics.innerHTML = lyrics;
			if (globalPlayer.currentMediaType == 0) globalPlayer.lyricsHeight = globalPlayer.currentPlayer.lyrics.clientHeight;
			globalPlayer.canPlay = true;
    	}
    }
}

function startMedia() {
	if (globalPlayer.currentMediaType == 1) globalPlayer.currentPlayer.embedPlayer.playVideo();
	else globalPlayer.currentPlayer.html.play();
	globalPlayer.controls.playButton.classList.add('playing');
	globalPlayer.paused = false;
}
function pauseMedia(){
	if(globalPlayer.currentMediaType == 1 && globalPlayer.currentPlayer.embedPlayer != null ) globalPlayer.currentPlayer.embedPlayer.pauseVideo();
	else globalPlayer.currentPlayer.html.pause();
	globalPlayer.controls.playButton.classList.remove('playing');
	globalPlayer.paused = true;
}


function forwardMedia(){
	pauseMedia();
	var newTime;
	if (globalPlayer.currentMediaType == 1) {
		newTime = video_player.embedPlayer.getCurrentTime() + 5;
		globalPlayer.currentPlayer.embedPlayer.seekTo(newTime);
		globalPlayer.controls.timeSlider.value = milliseconds(newTime);
	} else {
		newTime =  globalPlayer.currentPlayer.html.currentTime + 5;
		globalPlayer.currentPlayer.html.currentTime = newTime;
		globalPlayer.controls.timeSlider.value = milliseconds(newTime);
	}
	if (milliseconds(newTime) > globalPlayer.endPadding) nextMedia();
	else startMedia();
}

function backwardMedia(){
	pauseMedia();
	var newTime;
	if (globalPlayer.currentMediaType == 1) {
		newTime = newTime = video_player.embedPlayer.getCurrentTime() - 5
		globalPlayer.currentPlayer.embedPlayer.seekTo(newTime);
		globalPlayer.controls.timeSlider.value = milliseconds(newTime);
	}
	else {
		newTime = globalPlayer.currentPlayer.html.currentTime - 5;
		globalPlayer.currentPlayer.html.currentTime = newTime;
		globalPlayer.controls.timeSlider.value = milliseconds(globalPlayer.currentPlayer.html.currentTime-5);
	}
	if (milliseconds(newTime) < globalPlayer.startPadding) previousMedia();
	else startMedia();
}

function nextMedia() {
	globalPlayer.canPlay = false;
	globalPlayer.current_time_index = -1;
	globalPlayer.current_time = -1;
	document.querySelectorAll('.lyric_segment.selected').forEach(seg=>{
		seg.classList.remove('selected');
	});
	pauseMedia();
	
	var curSel = document.querySelectorAll('.item.song.selected');
	if (curSel.length > 0) curSel.forEach(song=>{
		song.classList.remove('selected');
	});

	if (globalPlayer.loop == 0) {
		globalPlayer.controls.playButton.classList.remove('playing');
		globalPlayer.paused = true;
	} else if (globalPlayer.loop == 1) {
		if (globalPlayer.currentMediaType == 1) globalPlayer.currentPlayer.embedPlayer.seekTo(0);
		else {
			globalPlayer.currentPlayer.html.currentTime = revertFromMilliseconds(globalPlayer.startPadding);
			globalPlayer.canPlay = true;
			startMedia();
		}
		document.getElementById(globalPlayer.currentSong).classList.add('selected');
	} else {
		if (globalPlayer.queue.length == 0) {
			openMedia(globalPlayer.currentSong);
		}
		else {
			openMedia(globalPlayer.queue[0]);
			document.getElementById(globalPlayer.queue[0]).classList.add('selected');
			var savedId = globalPlayer.queue[0];
			globalPlayer.queue.splice(0, 1);
			globalPlayer.queue.push(savedId);
		}
		if (globalPlayer.currentMediaType == 0 || globalPlayer.currentMediaType == 2) startMedia();
	}
}

function previousMedia() {
	globalPlayer.canPlay = false;
	globalPlayer.current_time_index = -1;
	globalPlayer.current_time = -1;
	document.querySelectorAll('.lyric_segment.selected').forEach(seg=>{
		seg.classList.remove('selected');
	});
	pauseMedia();

	var curSel = document.querySelectorAll('.item.song.selected');
	if (curSel.length > 0) curSel.forEach(song=>{
		song.classList.remove('selected');
	});

	if (globalPlayer.loop == 0) {
		globalPlayer.currentPlayer.playButton.classList.remove('playing');
		globalPlayer.paused = true;
	} else if (globalPlayer.loop == 1) {
		if (globalPlayer.currentMediaType == 1) globalPlayer.currentPlayer.embedPlayer.seekTo(0);
		else {
			timeAdjust(globalPlayer.startPadding);
			globalPlayer.canPlay = true;
			startMedia();
		}
		document.getElementById(globalPlayer.currentSong).classList.add('selected');
	} else { // loop == 2, or all
		savedId = globalPlayer.queue[globalPlayer.queue.length - 1];
		globalPlayer.queue.splice(globalPlayer.queue.length - 1, 1);
		globalPlayer.queue.unshift(savedId);
		openMedia(globalPlayer.queue[globalPlayer.queue.length - 1]);
		document.getElementById(globalPlayer.queue[globalPlayer.queue.length - 1]).classList.add('selected');
		if (globalPlayer.currentMediaType == 0 || globalPlayer.currentMediaType == 2) startMedia();
	}
}

function timeAdjust(time) {
	/* time is in milliseconds */
    /* Adjusts the current time of the audio - works in tandem with other functions, isn't called simply by clicking on an element */
	pauseMedia();
	var thisTime = time;

	if ( parseInt(thisTime) < parseInt(globalPlayer.startPadding) ) thisTime = globalPlayer.startPadding;
	else if ( parseInt(thisTime) > parseInt(globalPlayer.endPadding) ) thisTime = globalPlayer.endPadding;
    if (globalPlayer.currentMediaType == 1) globalPlayer.currentPlayer.embedPlayer.seekTo(revertFromMilliseconds(thisTime)); 
    else globalPlayer.currentPlayer.html.currentTime = revertFromMilliseconds(thisTime);
	startMedia();
}


function volumeAdjust(volume) {
	globalPlayer.controls.volumeSlider.value = volume;
	globalPlayer.volume = volume;
	if (volume == 0) {
		globalPlayer.controls.volumeImage.classList.remove('half');
		globalPlayer.controls.volumeImage.classList.remove('full');
	}
	else if (volume <= 50) {
		globalPlayer.controls.volumeImage.classList.remove('full');
		globalPlayer.controls.volumeImage.classList.add('half');
	}
	else {
		globalPlayer.controls.volumeImage.classList.remove('half');
		globalPlayer.controls.volumeImage.classList.add('full');
	}
	if (globalPlayer.currentMediaType == 1) globalPlayer.currentPlayer.embedPlayer.setVolume(volume);
	else globalPlayer.currentPlayer.html.volume = volume/100;
}

function autoscrollToggle() {
	// First, check if lyric are even visible or not
	if (!globalPlayer.lyricScrollOff) {
		globalPlayer.scrollToLyrics = !globalPlayer.scrollToLyrics;
		// Flip scrollToLyrics from one boolean to another

		if ( !globalPlayer.scrollToLyrics ) {
			// If we flipped from TRUE to FALSE, then we must remove all '.selected' lyric segments currently active as well as flip the autoscroll button to its appropriate state
			globalPlayer.controls.autoscrollButton.classList.remove('active');
			globalPlayer.currentPlayer.lyrics.querySelectorAll('.selected').forEach(el=>{
				el.classList.remove('selected');
			});
		} 
		else {
			// If we flipped from FALSE to TRUE, then we must re-allow scrolling
			globalPlayer.controls.autoscrollButton.classList.add('active');
		}
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

function initializeEmbed() {
	globalPlayer.controls.durationDisplay.innerHTML = formatTime(globalPlayer.currentPlayer.embedPlayer.getDuration());
	globalPlayer.controls.timeSlider.max = milliseconds(globalPlayer.currentPlayer.embedPlayer.getDuration());
	globalPlayer.controls.timeDisplay.innerHTML = readableDuration(globalPlayer.currentPlayer.embedPlayer.getCurrentTime()*1000);
	globalPlayer.startPadding = ( globalPlayer.startPadding != null && globalPlayer.startPadding >= 0 ) ? globalPlayer.startPadding : 0;
	globalPlayer.endPadding = ( globalPlayer.endPadding != null && globalPlayer.endPadding > 0 ) ? globalPlayer.endPadding : milliseconds(globalPlayer.currentPlayer.embedPlayer.getDuration());
	volumeAdjust(globalPlayer.volume);
	clearInterval(globalPlayer.currentPlayer.embedTimeUpdateInterval);
	startMedia();
	globalPlayer.currentPlayer.embedTimeUpdateInterval = setInterval(function () {
        if (!globalPlayer.currentPlayer.lock_time_slider) onTimeUpdate(null, globalPlayer.currentPlayer.embedPlayer.getCurrentTime())
    }, 100);
}

function formatTime(time){
    time = Math.round(time);
    var minutes = Math.floor(time / 60),
    seconds = time - minutes * 60;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    return minutes + ":" + seconds;
}
function initializeEditMediaForm(I) {
	var F = {};

	/* --- VARIALBE/REFERENCE SETUP --- */
	F.status = (I && I.status) ? I.status : false;
	F.close = (I && I.close) ? I.close : document.getElementById('closeEdit');
	F.form = (I && I.form) ? I.form : document.getElementById('editMediaForm');
	F.songId = (I && I.songId) ? I.songId : document.getElementById('id_edit');
	F.medium = (I && I.medium) ? I.medium : document.getElementById('medium_edit');
	F.title = (I && I.title) ? I.title : document.getElementById('titleEdit');
	F.artist = (I && I.artist) ? I.artist : document.getElementById('artistEdit');
	F.artDisplay = (I && I.artDisplay) ? I.artDisplay : document.getElementById('editArtDisplay');
	F.art = (I && I.art) ? I.art : document.getElementById('artEdit');
	F.alternativeArtContainer = (I && I.alternativeArtContainer) ? I.alternativeArtContainer : document.getElementById('editArtAlternativesContainer');
	F.alternativeArtActivator = (I && I.alternativeArtActivator) ? I.alternativeArtActivator : document.getElementById('editArtAlternativesActivator');
	F.alternativeArtArray = (I && I.alternativeArtArray) ? I.alternativeArtArray : null;
	F.album = (I && I.album) ? I.album : document.getElementById('albumEdit');
	F.albumArtist = (I && I.albumArtist) ? I.albumArtist : document.getElementById('albumArtistEdit');
	F.composer = (I && I.composer) ? I.composer : document.getElementById('composerEdit');
	F.paddingContainer = ( I && I.paddingContainer) ? I.paddingContainer : document.getElementById('editPaddingContainer');
	F.startPadding = (I && I.startPadding) ? I.startPadding : document.getElementById('startPaddingEdit');
	F.endPadding = (I && I.endPadding) ? I.endPadding : document.getElementById('endPaddingEdit');
	F.videoIdContainer = (I && I.videoIdContainer) ? I.videoIdContainer : document.getElementById('editVideoIdContainer');
	F.videoId = (I && I.videoId) ? I.videoId : document.getElementById('videoIdEdit');
	F.lyricsSettings = (I && I.lyricsSettings) ? I.lyricsSettings : document.getElementById('editLyricsSettings');
	F.lyricsSettingsSimple = (I && I.lyricsSettingsSimple) ? I.lyricsSettingsSimple : document.getElementById('editLyricsSimpleLabel');
	F.lyricsSettingsDynamic = (I && I.lyricsSettingsDynamic) ? I.lyricsSettingsDynamic : document.getElementById('editLyricsDynamicLabel');
	F.lyricsSettingsSimpleRadio = (I && I.lyricsSettingsSimpleRadio) ? I.lyricsSettingsSimpleRadio : document.getElementById('editLyricsSimpleRadio');
	F.lyricsSettingsDynamicRadio = (I && I.lyricsSettingsDynamicRadio) ? I.lyricsSettingsDynamicRadio : document.getElementById('editLyricsDynamicRadio');
	F.lyricsSimpleContainer = (I && I.lyricsSimpleContainer) ? I.lyricsSimpleContainer : document.getElementById('editLyricsSimpleContainer');
	F.simpleLyrics = (I && I.simpleLyrics) ? I.simpleLyrics : document.getElementById('simple_lyrics_edit');
	F.lyricsDynamicContainer = (I && I.lyricsDynamicContainer) ? I.lyricsDynamicContainer : document.getElementById('editLyricsDynamicContainer');
	F.dynamicLyricsInnerContainer = (I && I.dynamicLyricsInnerContainer) ? I.dynamicLyricsInnerContainer : document.getElementById('dynamicLyricsEditInnerContainer');
	F.dynamicLyricsIndex = -1;
	F.dynamicLyricsAddSegment = (I && I.dynamicLyricsAddSegment) ? I.dynamicLyricsAddSegment : document.getElementById('dynamicLyricsEditAdd');
	F.convertLyricsActivator = (I && I.convertLyricsActivator) ? I.convertLyricsActivator : document.getElementById('convertLyricsActivator');
	F.submit = (I && I.submit) ? I.submit : document.getElementById('submitEdit');
	F.delete = (I && I.delete) ? I.delete : document.getElementById('deleteSong');
	F.openedLyrics = 0;
	F.iconEdit = null;

	/* --- FUNCTIONS --- */
	F.openForm = (I && I.openForm) ? I.openForm : function() {
		F.form.style.display = 'block';
		F.status = true;
	}
	F.closeForm = (I && I.closeForm) ? I.closeForm : function() {
		F.form.style.display = 'none';
		F.status = false;
		F.iconEdit = null
	}
	F.startEdit = (I && I.startEdit) ? I.startEdit : function(id) {
		F.form.reset();
		var xhr = new XMLHttpRequest();
		xhr.open('POST','scripts/simpleMusicPlayer.php?get=3');
		xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		xhr.onload = function() {
			if (xhr.status === 200) {
				var response = JSON.parse(xhr.responseText);
				if (response.success) {
					F.prepareEdit(response['data']['info']);
				}
				else {
					alert(response.message);
					console.log(response.data);
				}
			}
			else if (xhr.status !== 200) {
				alert('Request failed.  Returned status of ' + xhr.status);
			}
		};
		xhr.send('id='+id);
	}
	F.make = (I && I.make) ? I.make : make;
	F.updateCurrent = (I && I.updateCurrent) ? I.updateCurrent : updateCurrent;
	F.setBackground = (I && I.setBackground) ? I.setBackground : setBackground;

	F.prepareEdit = (I && I.prepareEdit) ? I.prepareEdit : function(arr) {
		F.iconEdit = null;

		F.songId.value = arr.id;
		F.medium.value = arr.medium;

		F.title.value = arr.title;
		F.artist.value = arr.artist;
		F.album.value = arr.album_name;
		F.albumArtist.value = arr.album_artist_name;
		F.composer.value = arr.composer;

		F.alternativeArtContainer.querySelectorAll('.item').forEach(item=>{
			item.parentNode.removeChild(item);
		});
		F.alternativeArtActivator.style.display = 'block';
		F.artDisplay.src = (arr.art != null) ? arr.art +'#'+ new Date().getTime() : 'assets/default_album_art.jpg';

		while (F.dynamicLyricsInnerContainer.firstChild) F.dynamicLyricsInnerContainer.removeChild(F.dynamicLyricsInnerContainer.firstChild);
	
		if ( arr.medium == 0 ) {
			F.videoIdContainer.style.display = 'none';
			F.lyricsSettings.style.display = 'block';
			F.convertLyricsActivator.style.display = 'block';

			F.paddingContainer.style.display = 'block';
			F.startPadding.value = arr.start_padding;
			F.endPadding.value = arr.end_padding;

			F.simpleLyrics.value = arr.simpleLyrics;
			var seg = arr.dynamicLyrics;
			if (seg.length > 0) {
				for (var lyricSeg in seg) {
					F.dynamicLyricsIndex = parseInt(lyricSeg);
					F.dynamicLyricsInnerContainer.appendChild(F.dynamicLyricSegmentForEdit(lyricSeg, seg[lyricSeg]['time'], seg[lyricSeg]['style'], seg[lyricSeg]['no_text'], seg[lyricSeg]['text']));
				}
			}
			if (arr.dynamic_lyrics_toggle == 1) {
				F.lyricsSettingsSimpleRadio.checked = false;
				F.lyricsSettingsDynamicRadio.checked = true;
				F.lyricsSimpleContainer.classList.remove('selected');
				F.lyricsDynamicContainer.classList.add('selected');
				F.convertLyricsActivator.innerHTML = '=> Import from Simple Lyrics';
				F.openedLyrics = 1;
			} else {
				F.lyricsSettingsSimpleRadio.checked = true;
				F.lyricsSettingsDynamicRadio.checked = false;
				F.lyricsSimpleContainer.classList.add('selected');
				F.lyricsDynamicContainer.classList.remove('selected');
				F.convertLyricsActivator.innerHTML = 'Import from Dynamic Lyrics <=';
				F.openedLyrics = 0;
			}
		}
		else {
			F.paddingContainer.style.display = 'none';

			if (arr.medium == 1) {
				F.videoId.value = arr.url;
				F.videoIdContainer.style.display = 'block';
			} 
			else F.videoIdContainer.style.display = 'none';
			F.lyricsSettings.style.display = 'none';
			F.lyricsSettingsSimpleRadio.checked = false;
			F.lyricsSettingsDynamicRadio.checked = true;
			F.lyricsSimpleContainer.classList.remove('selected');
			F.lyricsDynamicContainer.classList.add('selected');
			F.convertLyricsActivator.style.display = 'none';
			F.openedLyrics = 1;
			var seg = arr.dynamicLyrics;
			if (seg.length > 0) {
				for (var lyricSeg in seg) {
					F.dynamicLyricsIndex = parseInt(lyricSeg);
					F.dynamicLyricsInnerContainer.appendChild(F.dynamicLyricSegmentForEdit(lyricSeg, seg[lyricSeg]['time'], seg[lyricSeg]['style'], seg[lyricSeg]['no_text'], seg[lyricSeg]['text']));
				}
			}
		}
	}
	F.convertLyrics = function() {
		var current = F.openedLyrics;
		var allSegments = [];
		var thisString = '';
		if (current == 0) {
			F.form.querySelectorAll('.dynamicLyricsEdit').forEach(elmnt=>{
				allSegments.push(elmnt.value);
			});
			thisString = allSegments.join('\n');
			F.simpleLyrics.value = thisString;
			return;
		}
		else if (current == 1) {
			thisString = F.simpleLyrics.value;
			allSegments = thisString.split('\n\n');
			while (F.dynamicLyricsInnerContainer.firstChild) F.dynamicLyricsInnerContainer.removeChild(F.dynamicLyricsInnerContainer.firstChild);
			allSegments.forEach(function(d,index) {
				F.dynamicLyricsInnerContainer.appendChild(F.dynamicLyricSegmentForEdit(index, '', '', '', d));
				F.dynamicLyricsIndex = index;
			});
			return;
		}
		else return;
	}
	F.populateAlternativeArtContainer = function() {
		var xhr = new XMLHttpRequest();
		xhr.open('GET','scripts/simpleMusicPlayer.php?get=4');
		xhr.onload = function() {
			if (xhr.status === 200) {
				var response = JSON.parse(xhr.responseText);
				if (response.success) {
					if (response['data']['data'] != null) {
						F.alternativeArtContainer.querySelectorAll('.item').forEach(item=>{
							item.parentNode.removeChild(item);
						});
						F.alternativeArtArray = response.data;
						F.alternativeArtActivator.style.display = 'none';
						var html, img, input, label;
						for (var index in response['data']['data']) {
							img = ( response['data']['data'][index].startsWith('data') ) ? response['data']['data'][index] : response['data']['data'][index]+'?'+new Date().getTime();
							html = F.make(['div',{class:'item alternate'},['img',{class:'item previewItem',src:img,alt:''}]]);
							input = F.make(['input',{type:'radio',class:'inputRadio alternateRadio',id:'alternate_art_'+index,name:'alternate_art',value:index}]);
							input.addEventListener('change',function() {
								F.iconEdit = null;
							});
							label = F.make(['label',{for:'alternate_art_'+index,class:'item previewLabel hover','data-id':index}]);
							label.addEventListener('click',function() {
								F.iconEdit = null;
								var alternative_id = this.dataset.id;
								F.artDisplay.src = F.alternativeArtArray['data'][alternative_id];
							});
							html.appendChild(input)
							html.appendChild(label);
							F.alternativeArtContainer.appendChild(html);
			       		}	
					}
					else F.alternativeArtActivator.innerHTML = 'No alternate album art available';
				}
				else {
					alert(response.message);
					console.log(response.data);
				}
			}
			else if (xhr.status !== 200) {
				alert('Request failed.  Returned status of ' + xhr.status +'\n Status Text: ' + xhr.statusText);
			}
		}
		xhr.send();
	}

	F.removeLyricSegment = (I && I.removeLyricSegment) ? I.removeLyricSegment : function(segId) {
		var removeThis = document.getElementById('dynamic_lyrics_segment_'+segId);
		removeThis.parentNode.removeChild(removeThis);	
	}
	F.addLyricSegment = (I && I.addLyricSegment) ? I.addLyricSegment : function() {
		F.dynamicLyricsIndex = parseInt(F.dynamicLyricsIndex) + 1;
		F.dynamicLyricsInnerContainer.appendChild(F.dynamicLyricSegmentForEdit(F.dynamicLyricsIndex, '', '', false, ''));
	}
	F.dynamicLyricSegmentForEdit = (I && I.dynamicLyricSegmentForEdit) ? I.dynamicLyricSegmentForEdit : function(id, time = '', style = '', notext = true, text = '') {
		//var lyricSegHTML = F.make(['div',{id:'dynamic_lyrics_segment_'+id,class:'item dynamicSegment'},['span',{class:'cancel dynamicLyricsSegmentRemove','data-id':id},'X'],['div',{class:'container dynamicSegment'},['span',{class:'item dynamicSegmentItem hover dynamicLyricsSegmentAddAbove'},'Add Segment Above'],['div',{class:'item dynamicSegmentItem'},['input',{class:'item inputText dynamicLyricsTime',type:'text',name:'dynamic_lyrics_times[]',placeholder:'Start Time',value:time}],['input',{class:'item inputText dynamicLyricsStyle',type:'text',name:'dynamic_lyrics_styles[]',placeholder:'Color',value:style}]],['div',{class:'item dynamicSegmentItem'},['input',{id:'dynamic_lyrics_notext_'+id+'Hidden',type:'hidden',value:'0',name:'dynamic_lyrics_notexts[]'}],['input',{id:'dynamic_lyrics_notext_'+id,class:'inputRadio dynamicLyricsNotext',type:'checkbox',value:'1',name:'dynamic_lyrics_notexts[]',checked:notext}],['label',{class:'item inputLabel noTextLabel hover',for:'dynamic_lyrics_notext_'+id},'No Text']],['div',{class:'item dynamicSegmentItem'},['textarea',{class:'item editInput dynamicLyricsEdit',name:'dynamic_lyrics_edits[]',placeholder:'Lyric Segment',rows:'4',html:text}]],['span',{'class':'item dynamicSegmentItem hover dynamicLyricsSegmentAddBelow'},'Add Segment Below']]]);
		var lyricSegHTML = F.make(['div',{id:'dynamic_lyrics_segment_'+id,class:'item dynamicSegment'}]);
		var removeSeg = F.make(['span',{class:'cancel dynamicLyricsSegmentRemove','data-id':id},'X']);
		removeSeg.addEventListener('click',function() {
			F.removeLyricSegment(this.dataset.id);
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
			F.dynamicLyricsInnerContainer.insertBefore(newSeg,this.parentNode.parentNode);
		});
		arr[arr.length-1].addEventListener('click',function() {
			F.dynamicLyricsIndex += 1;
			var newSeg = F.dynamicLyricSegmentForEdit(F.dynamicLyricsIndex);
			F.dynamicLyricsInnerContainer.insertBefore(newSeg,this.parentNode.parentNode.nextSibling);
		});

		lyricSegHTML.appendChild(removeSeg);
		arr.forEach(el=>{
			lyricInnerSeg.appendChild(el);
		});
		lyricSegHTML.appendChild(lyricInnerSeg);

		return lyricSegHTML;
	}
	F.serializeArray = function(form) {
		var objects = [];  
		if (typeof form == 'object' && form.nodeName.toLowerCase() == 'form') {  
			var fields = form.getElementsByTagName("input");  
			for(var i=0;i<fields.length;i++){  
				objects[objects.length] = { name: fields[i].getAttribute('name'), value: fields[i].getAttribute('value') };  
			}  
		}  
		return objects;  
	}
	F.prepareIconEdit = function(event) {
		F.iconEdit = event.target.files[0];
		var url = event.target.value;
		var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
		if (event.target.files && event.target.files[event.target.files.length-1] && (ext == 'PNG' || ext == 'png' || ext == 'jpeg' || ext == 'jpg' || ext == 'JPEG' || ext == 'JPG')) {
			var reader = new FileReader();
			reader.readAsDataURL(event.target.files[event.target.files.length-1]);
			reader.onload = function (e) {	
				F.artDisplay.src = e.target.result;
			}
		} 
		else F.artDisplay.src = 'assets/default_album_art.jpg';
	}
	F.editIcon = function(event) {
		event.stopPropagation(); 	// Stop stuff happening
		event.preventDefault(); 	// Totally stop stuff happening
		
		var file = F.iconEdit;
		if (file == null) {
			F.submitEdit(F.songId.value,0);
			return;
		}
		var data = new FormData();
		data.append('file',file);
		data.append('id_edit',F.songId.value);
		data.append('command','icon');

		var xhr = new XMLHttpRequest();
		xhr.open('POST','scripts/simpleMusicPlayer.php?get=5');
		xhr.onload = function() {
			if (xhr.status == 200) {
				var response = JSON.parse(xhr.responseText);
				if (response.success){
					F.submitEdit(F.songId.value,1);
				}
				else {
					alert(response.message);
					console.log(response.data);
				}
			}
			else alert('Request failed.  Returned status of ' + xhr.status +'\n Status Text: ' + xhr.statusText);
		};
		xhr.send(data);
	}
	F.submitEdit = function(id, iconUploaded=0, deleteMedia=0) {
		F.form.querySelectorAll('.dynamicLyricsNotext').forEach(obj=>{
			var thisId = obj.id;
			if (obj.checked) document.getElementById(thisId+'Hidden').disabled = true;
			else document.getElementById(thisId+'Hidden').disabled = false;
		});
		
		var formData = new FormData(F.form);
		formData.append('id_edit',id);
		formData.append('iconUploaded',iconUploaded);
		if (deleteMedia == 1) formData.append('command','delete');
		else formData.append('command','edit');

		var xhr = new XMLHttpRequest();
		xhr.open('POST','scripts/simpleMusicPlayer.php?get=5');
		xhr.onload = function() {
			if (xhr.status == 200) {
				var response = JSON.parse(xhr.responseText);
				if (response.success){
					F.iconEdit = null;
					if (id == globalPlayer.currentSong) {
						if (deleteMedia == 1) F.resetPlayerAfterEdit();
						F.updateCurrent();
					}
					alert("Media successfully edited!");
				}
				else {
					alert(response.message);
					console.log(response.data);
				}
			}
			else {
				alert('Request failed.  Returned status of ' + xhr.status +'\n Status Text: ' + xhr.statusText);
			}
		};
		xhr.send(formData);
	}
	F.resetPlayerAfterEdit = function() {
		F.setBackground('assets/default_player_background.jpg', globalPlayer.background);

		globalPlayer.currentPlayer.title.classList.remove('smallerTitle');
		globalPlayer.currentPlayer.title.innerHTML = 'Choose a Song';
		globalPlayer.currentPlayer.artist.innerHTML = 'Artist';
		while(globalPlayer.currentPlayer.lyrics.firstChild) globalPlayer.currentPlayer.lyrics.removeChild(globalPlayer.currentPlayer.lyrics.firstChild);
		globalPlayer.currentPlayer.durationDisplay.innerHTML = '--:--';
		globalPlayer.currentPlayer.timeDisplay.innerHTML = '--:--';
		globalPlayer.currentPlayer.timeSlider.value = 0;
		globalPlayer.currentPlayer.playButton.classList.remove('playing');

		globalPlayer.currentSong = -1;
		globalPlayer.currentAlbumArtist = -1;
		globalPlayer.currentAlbum = -1;
		globalPlayer.dynamic_lyrics_toggle = false;
		globalPlayer.dynamic_lyrics_starting_times = null;
		globalPlayer.canPlay = false;
		globalPlayer.current_time_index = -1;
		globalPlayer.current_time = -1;
		globalPlayer.currentMediaType = -1;
		globalPlayer.startPadding = 0;
		globalPlayer.endPadding = 3599999;	
		globalPlayer.queue.length = 0;

		if (globalPlayer.currentMediaType == 0) {
			globalPlayer.currentPlayer.container.classList.remove('closed');
			globalPlayer.currentPlayer.art.src = 'assets/default_album_art.jpg';
			globalPlayer.currentPlayer.lyrics.innerHTML = "<span class='lyric_segment noText'></span><span class='lyric_segment'><i>Lyrics go Here</i></span><span class='lyric_segment'></span>";
		} else {
			globalPlayer.currentPlayer.container.classList.add('closed');
			audio_player.playButton.classList.remove('playing');
		}
	}

	/* --- CLICK EVENTS --- */
	F.alternativeArtActivator.addEventListener('click', F.populateAlternativeArtContainer);
	F.dynamicLyricsAddSegment.addEventListener('click', F.addLyricSegment);
	F.lyricsSettingsSimple.addEventListener('click', function() {
		F.lyricsDynamicContainer.classList.remove('selected');
		F.lyricsSimpleContainer.classList.add('selected');
		F.convertLyricsActivator.innerHTML = 'Import from Dynamic Lyrics <=';
		F.openedLyrics = 0;
	});
	F.lyricsSettingsDynamic.addEventListener('click', function() {
		F.lyricsSimpleContainer.classList.remove('selected');
		F.lyricsDynamicContainer.classList.add('selected');
		F.convertLyricsActivator.innerHTML = '=> Import from Simple Lyrics';
		F.openedLyrics = 1;
	});
	F.convertLyricsActivator.addEventListener('click',F.convertLyrics);
	F.art.addEventListener('change', F.prepareIconEdit);
	F.delete.addEventListener('click', function() {	
		F.submitEdit(F.songId.value, 0, 1);	
	});
	F.submit.addEventListener('click', F.editIcon);

	return F;
}
function openEdit() {
	globalPlayer.listSongs.style.display = 'none';
	embedForm.closeForm();
	editAlbumArtForm.closeForm();
	addMediaForm.closeForm();
	editSettingsForm.closeForm();

	editMediaForm.openForm();

	video_player.lyrics_parent.classList.add('lock');
	globalPlayer.controls.container.classList.add('lock');
	if (!globalPlayer.listOpen) {
		document.getElementById('list').classList.remove('closed');
	}
}
function closeEdit() {
	getAllMedia(false,true);
	setTimeout(()=>{
		if (!globalPlayer.listOpen && !embedForm.status && !addMediaForm.status && !editAlbumArtForm.status && !editSettingsForm.status ) {
			document.getElementById('list').classList.add('closed');
		}
		video_player.lyrics_parent.classList.remove('lock');
		globalPlayer.controls.container.classList.remove('lock');
		editMediaForm.closeForm();
		globalPlayer.listSongs.style.display = 'block';
	},500);
}

function initializeEditAlbumArtForm(I) {
	var F = {};
	
	/* --- VARIALBE/REFERENCE SETUP --- */
	F.status = (I && I.status) ? I.status : false;
	F.close = (I && I.close) ? I.close : document.getElementById('closeAlbumArtEdit');
	F.form = (I && I.form) ? I.form : document.getElementById('editAlbumArtForm');
	F.display = (I && I.display) ? I.display : document.getElementById('editAlbumArtDisplay');
	F.new_upload_input = (I && I.new_upload_input) ? I.new_upload_input : document.getElementById('edit_album_art_form_input');
	F.alternativesContainer = (I && I.alternativesContainer) ? I.alternativesContainer : document.getElementById('editAlbumArtAlternativesContainer');
	F.array = null;
	F.id = -1;
	F.iconEdit = null;

	/* --- FUNCTIONS --- */
	F.openForm = (I && I.openForm) ? I.openForm : function() {
		F.form.style.display = 'block';
		F.status = true;
	}
	F.closeForm = (I && I.closeForm) ? I.closeForm : function() {
		F.form.style.display = 'none';
		F.status = false;
		F.id = -1;
		F.iconEdit = null;
	}
	F.make = (I && I.make) ? I.make : make;
	F.startAlbumArtEdit = (I && I.startAlbumArtEdit) ? I.startAlbumArtEdit : function(album_id) {
		var xhr = new XMLHttpRequest();
		xhr.open('POST','scripts/simpleMusicPlayer.php?get=4');
		xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		xhr.onload = function() {
			if (xhr.status == 200) {
				var response = JSON.parse(xhr.responseText);
				if (response.success){
					F.display.src = (response['data']['art'] != null) ?  response['data']['art'] :  'assets/default_album_art.jpg#' + new Date().getTime();
					if ( F.array != response['data']['data'] ) {
						while (F.alternativesContainer.firstChild) F.alternativesContainer.removeChild(F.alternativesContainer.firstChild);
						F.array = response['data']['data'];
						var alternativeHtml, alternativeLabel;
						for (var index in response['data']['data']) {
							alternativeHtml = F.make(['div',{class:'item alternate'},['img',{class:'item previewItem',src:response['data']['data'][index],alt:''}],['input',{type:'radio',class:'inputRadio alternateRadio',id:'alternate_art_for_album_art_edit_'+index,name:'alternate_art_for_album_art_edit',value:index}]]);
							alternativeLabel = F.make(['label',{for:'alternate_art_for_album_art_edit_'+index,class:'item previewLabel hover alternateAlbumArtLabel','data-id':index}]);
							alternativeLabel.addEventListener('click',function() {
								F.iconEdit = null;
								var alternative_id = this.dataset.id;
								F.display.src = F.array[alternative_id];
							});
							alternativeHtml.appendChild(alternativeLabel);
							F.alternativesContainer.appendChild(alternativeHtml);
						}
					}
					F.iconEdit = null;
					F.id = album_id;
				}
				else {
					alert(response.message);
					console.log(response.data);
				}
			}
			else {
				alert('Request failed.  Returned status of ' + xhr.status +'\n Status Text: ' + xhr.statusText);
			}
		};
		xhr.send('albumId='+album_id);
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
			F.iconEdit = event.target.files[0];
			console.log(event.target.files);
		} 
		else {
			F.display.src = 'assets/default_album_art.jpg';
			alert("That image is not a proper image file (jpg or png)");
		}
	}
	F.submitAlbumArtEdit = (I && I.submitAlbumArtEdit) ? I.submitAlbumArtEdit : function(event) {
		event.stopPropagation();
		event.preventDefault();
		var formData, performAjax;

		var formData = new FormData(F.form);
		formData.delete('edit_album_art_form_input');
		formData.append('album_id',F.id);

		if ( F.iconEdit == null && formData.get('alternate_art_for_album_art_edit') == null ) {
			// A new image was not selected
			alert('A new image was not chosen.\nPlease select a new image or close out of the edit screen.');
			return;
		}
		else if (F.iconEdit == null) {
			// An alternative art was last selected - a new art will NOT be uploaded
			formData.append('command','alternative');
		}
		else {
			// A new artwork was most recently uploaded - we must upload the file
			formData.append('file',F.iconEdit);
			formData.append('command','upload');
		}

		var xhr = new XMLHttpRequest();
		xhr.open('POST','scripts/simpleMusicPlayer.php?get=6');
		xhr.onload = function() {
			if (xhr.status == 200) {
				var response = JSON.parse(xhr.responseText);
				if (response.success){
					F.iconEdit = null;
					alert('Existing album art successfully selected!');
				}
				else {
					alert(response.message);
					console.log(response.data);
				}
			}
			else alert('Request failed.  Returned status of ' + xhr.status +'\n Status Text: ' + xhr.statusText);
		};
		xhr.send(formData);
	}

	/* --- CLICK EVENTS --- */
	F.new_upload_input.addEventListener('change',F.prepareAlbumArtEdit);
	F.form.addEventListener('submit', F.submitAlbumArtEdit);

	return F;
}
function openAlbumArtEdit() {
	globalPlayer.listSongs.style.display = 'none';
	embedForm.closeForm();
	editMediaForm.closeForm();
	addMediaForm.closeForm();
	editSettingsForm.closeForm();
	
	editAlbumArtForm.openForm();

	if (!globalPlayer.listOpen) {
		document.getElementById('list').classList.remove('closed');
	}
}
function closeAlbumArtEdit() {
	getAllMedia(false,true);
	setTimeout(()=>{
		if (!globalPlayer.listOpen && !embedForm.status && !addMediaForm.status && !editMediaForm.status && !editSettingsForm.status ) {
			document.getElementById('list').classList.add('closed');
		}
		editAlbumArtForm.closeForm();
		globalPlayer.listSongs.style.display = 'block';

	},500);
}

function initializeEmbedForm(I) {
	var F = {};

	/* --- VARIALBE/REFERENCE SETUP --- */
	F.status = (I && I.status != null && typeof I.status === 'boolean') ? I.status : false;
	F.form = (I && I.form) ? I.form : document.getElementById('embedInputForm');
	F.open = (I && I.open) ? I.open : document.getElementById('openEmbed');
	F.close = (I && I.close) ? I.close : document.getElementById('closeEmbed');

	/* --- FUNCTIONS --- */
	F.openForm = (I && I.openForm) ? I.openForm : function() {
		F.form.querySelectorAll('.textInput').forEach(el=>{
			el.value = '';
		});
		F.form.querySelectorAll('.inputError').forEach(el=>{
			el.innerHTML = '';
		});
		F.form.style.display = 'block';
		F.status = true;
	}
	F.closeForm = (I && I.closeForm) ? I.closeForm : function() {
		F.form.querySelectorAll('.textInput').forEach(el=>{
			el.value = '';
		});
		F.form.style.display = 'none';
		F.status = false;
	}
	F.submitEmbed = function(event) {
		event.stopPropagation(); 	// Stop stuff happening
		event.preventDefault(); 	// Totally stop stuff happening
		
		var formData = new FormData(F.form);

		var xhr = new XMLHttpRequest();
		xhr.open('POST','scripts/simpleMusicPlayer.php?get=7');
		xhr.onload = function() {
			if (xhr.status == 200) {
				var response = JSON.parse(xhr.responseText);
				if (response.success) {
					alert('Successfully Inserted New Embed!');
				}
				else if ( response['data']['inputErrors'] != null ) {
					for (var error_type in response['data']['inputErrors']) {
						F.form.querySelector('#embed_'+error_type+'_Error').innerHTML = response['data']['inputErrors'][error_type];
					}
				}
				else alert(response['message']);
			}
			else alert('Request failed.  Returned status of ' + xhr.status +'\n Status Text: ' + xhr.statusText);
		};
		xhr.send(formData);
	}

	/* --- CLICK EVENTS --- */
	F.form.addEventListener('submit', F.submitEmbed);

	return F;
}
function openEmbed() {
	globalPlayer.listSongs.style.display = 'none';

	editMediaForm.closeForm();
	editAlbumArtForm.closeForm()
	addMediaForm.closeForm();
	editSettingsForm.closeForm();

	embedForm.openForm();

	if (!globalPlayer.listOpen) {
		document.getElementById('list').classList.remove('closed');
	}
}
function closeEmbed() {
	getAllMedia(false,true);
	setTimeout(()=>{
		if (!editMediaForm.status && !editAlbumArtForm.status && !addMediaForm.status && !globalPlayer.listOpen && !editSettingsForm.status ) {
			document.getElementById('list').classList.add('closed');
		}
		embedForm.closeForm();
		globalPlayer.listSongs.style.display = 'block';
	},500);
}

function initializeAddMediaForm(I) {
	var F = {};

	/* --- VARIALBE/REFERENCE SETUP --- */
	F.status = (I && I.status != null && typeof I.status === 'boolean') ? I.status : false;
	F.open = (I && I.open) ? I.open : document.getElementById('openAddMediaForm');
	F.close = (I && I.close) ? I.close : document.getElementById('closeAddMediaForm');
	F.form = (I && I.form) ? I.form : document.getElementById('addMediaForm');
	F.input = (I && I.input) ? I.input : document.getElementById('addMediaFormInput');
	F.dropArea = (I && I.dropArea) ? I.dropArea : document.getElementById('addMediaDropArea');
	F.files = {};

	/* --- FUNCTIONS --- */
	F.isArray = (I && I.isArray) ? I.isArray : isArray;
	F.formatBytes = (I && I.formatBytes) ? I.formatBytes : formatBytes;
	F.make = (I && I.make) ? I.make : make;
	F.openForm = (I && I.openForm) ? I.openForm : function() {
		F.form.style.display = 'block';
		F.status = true;
	}
	F.closeForm = (I && I.closeForm) ? I.closeForm : function() {
		F.form.style.display = 'none';
		F.status = false;
		F.files = {};
		while(F.dropArea.firstChild) F.dropArea.removeChild(F.dropArea.firstChild);
		return;
	}
	F.addMedia = function(event) {
		event.stopPropagation();
		event.preventDefault();

		var newFilesArray = [];
		var promises = [];
		var failures = [];

		for (var key in F.files) {
			newFilesArray.push(F.files[key]);
		}

		var promiseUpload = function(file) {
			return new Promise((resolve,reject)=>{
				var temp = new FormData();
				var tempFile = file['FILE'];
				var tempHtml = file['HTML'];
				temp.append('file',tempFile);
				console.log(temp);
				let typeImage = ( tempFile.type.startsWith('video') ) ? 'assets/video.png' : 'assets/audio.png';
				tempHtml.querySelector('.addMediaArtInner img').src = 'assets/loading.gif';
				tempHtml.querySelector('.addMediaError').innerHTML = '';
				if (tempHtml.classList.contains('failed')) tempHtml.classList.remove('failed');

				var xhr = new XMLHttpRequest();
				xhr.open('POST','scripts/simpleMusicPlayer.php?get=11');
				xhr.onload = function() {
					if (xhr.status == 200) {
						var response = JSON.parse(xhr.responseText);
						if (response.success){
							F.removeFiles([tempFile.size+'|'+tempFile.lastModified]);
							resolve();
						}
						else {
							tempHtml.querySelector('.addMediaArtInner img').src = typeImage;
							tempHtml.querySelector('.addMediaError').innerHTML = response.message;
							tempHtml.classList.add('failed');
							reject(tempFile);
						}
					}
					else {
						reject(tempFile);
					}
				};
				xhr.send(temp);
			});
		}

		newFilesArray.forEach((value,key)=>{
			promises.push(promiseUpload(value));
		});

		Promise.all(promises).then(()=>{
			alert('All media successfully added!');
		},errors=>{
			alert('Failed to add remaining files\nMost common reasons include:\n- File size exceeds 96 Megabytes\n- The file is a format not recognized by the player');
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
		var addMediaItem = F.make([
			'div',{class:'addMediaItem',id:'addMediaItem_'+size+'|'+modified},
			[
				'div',{class:'addMediaArt'},
				['div',{class:'addMediaArtInner'},
					['img',{src:typeImage,alt:''}]
				]
			],
			[
				'div',{class:'addMediaText'},
				['span',{class:'addMediaTitle'},name],
				['span',{class:'addMediaSize'},F.formatBytes(size)]
			],
			['span',{class:'addMediaError'}]
		]);
		var cancelElement = F.make(['span',{class:'cancel addMediaItemCancel','data-id':size+'|'+modified},'X']);
		cancelElement.addEventListener('click',function() {
			var id = this.dataset.id;
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
	F.form.addEventListener('submit',F.addMedia);

	return F;
}
function openAdd() {
	globalPlayer.listSongs.style.display = 'none';
	editMediaForm.closeForm();
	editAlbumArtForm.closeForm();
	embedForm.closeForm();
	editSettingsForm.closeForm();
	
	addMediaForm.openForm();

	if (!globalPlayer.listOpen) {
		document.getElementById('list').classList.remove('closed');
	}
}
function closeAdd() {
	getAllMedia(false, true);
	setTimeout(()=>{
		if (!editMediaForm.status && !editAlbumArtForm.status && !embedForm.status && !globalPlayer.listOpen && !editSettingsForm.status ) {
			document.getElementById('list').classList.add('closed');
		}
		addMediaForm.closeForm();
		globalPlayer.listSongs.style.display = 'block';
	},500);
}


function initializeEditSettingsForm(I) {
	var F = {};

	/* --- VARIALBE/REFERENCE SETUP --- */
	F.status = (I && I.status) ? I.status : false;
	F.open = (I && I.open) ? I.open : document.getElementById('openEditSettingsForm');
	F.close = (I && I.close) ? I.close : document.getElementById('closeEditSettingsForm');
	F.form = (I && I.form) ? I.form : document.getElementById('editSettingsForm');

	F.listPosLeft = (I && I.listPosLeft) ? I.listPosLeft : document.getElementById('songListPosLeft');
	F.listPosRight = (I && I.listPosRight) ? I.listPosRight : document.getElementById('songListPosRight');
	F.headerPosTop = (I && I.headerPosTop) ? I.headerPosTop : document.getElementById('headerPosTop');
	F.headerPosBottom = (I && I.headerPosBottom) ? I.headerPosBottom : document.getElementById('headerPosBottom');
	F.loopNone = (I && I.loopNone) ? I.loopNone : document.getElementById('loopDefaultNone');
	F.loopOne = (I && I.loopOne) ? I.loopOne : document.getElementById('loopDefaultOne');
	F.loopAll = (I && I.loopAll) ? I.loopAll : document.getElementById('loopDefaultAll');
	F.shuffleOff = (I && I.shuffleOff) ? I.shuffleOff : document.getElementById('shuffleDefaultOff');
	F.shuffleOn = (I && I.shuffleOn) ? I.shuffleOn : document.getElementById('shuffleDefaultOn');
	F.volume = (I && I.volume) ? I.volume : document.getElementById('volumeDefaultRange');
	F.volumePreview = (I && I.volumePreview) ? I.volumePreview : document.getElementById('volumeDefaultPreview');
/*
	F.art = (I && I.art) ? I.art : document.getElementById('artEdit');
	F.alternativeArtContainer = (I && I.alternativeArtContainer) ? I.alternativeArtContainer : document.getElementById('editArtAlternativesContainer');
	F.alternativeArtActivator = (I && I.alternativeArtActivator) ? I.alternativeArtActivator : document.getElementById('editArtAlternativesActivator');
	F.alternativeArtArray = (I && I.alternativeArtArray) ? I.alternativeArtArray : null;
	F.paddingContainer = ( I && I.paddingContainer) ? I.paddingContainer : document.getElementById('editPaddingContainer');
	F.startPadding = (I && I.startPadding) ? I.startPadding : document.getElementById('startPaddingEdit');
	F.endPadding = (I && I.endPadding) ? I.endPadding : document.getElementById('endPaddingEdit');
	F.videoId = (I && I.videoId) ? I.videoId : document.getElementById('videoIdEdit');
	F.lyricsSettings = (I && I.lyricsSettings) ? I.lyricsSettings : document.getElementById('editLyricsSettings');
	F.lyricsSettingsSimple = (I && I.lyricsSettingsSimple) ? I.lyricsSettingsSimple : document.getElementById('editLyricsSimpleLabel');
	F.lyricsSettingsDynamic = (I && I.lyricsSettingsDynamic) ? I.lyricsSettingsDynamic : document.getElementById('editLyricsDynamicLabel');
	F.lyricsSettingsSimpleRadio = (I && I.lyricsSettingsSimpleRadio) ? I.lyricsSettingsSimpleRadio : document.getElementById('editLyricsSimpleRadio');
	F.lyricsSettingsDynamicRadio = (I && I.lyricsSettingsDynamicRadio) ? I.lyricsSettingsDynamicRadio : document.getElementById('editLyricsDynamicRadio');
	F.lyricsSimpleContainer = (I && I.lyricsSimpleContainer) ? I.lyricsSimpleContainer : document.getElementById('editLyricsSimpleContainer');
	F.simpleLyrics = (I && I.simpleLyrics) ? I.simpleLyrics : document.getElementById('simple_lyrics_edit');
	F.lyricsDynamicContainer = (I && I.lyricsDynamicContainer) ? I.lyricsDynamicContainer : document.getElementById('editLyricsDynamicContainer');
	F.dynamicLyricsInnerContainer = (I && I.dynamicLyricsInnerContainer) ? I.dynamicLyricsInnerContainer : document.getElementById('dynamicLyricsEditInnerContainer');
	F.dynamicLyricsIndex = -1;
	F.dynamicLyricsAddSegment = (I && I.dynamicLyricsAddSegment) ? I.dynamicLyricsAddSegment : document.getElementById('dynamicLyricsEditAdd');
	F.convertLyricsActivator = (I && I.convertLyricsActivator) ? I.convertLyricsActivator : document.getElementById('convertLyricsActivator');
*/
	F.submit = (I && I.submit) ? I.submit : document.getElementById('editSettingsFormSubmit');
/*
	F.openedLyrics = 0;
	F.iconEdit = null;
*/

	/* --- FUNCTIONS --- */
	F.openForm = (I && I.openForm) ? I.openForm : function() {
		F.form.style.display = 'block';
		F.status = true;
	}
	F.closeForm = (I && I.closeForm) ? I.closeForm : function() {
		F.form.style.display = 'none';
		F.status = false;
		//F.iconEdit = null
	}

	F.startEdit = (I && I.startEdit) ? I.startEdit : function(id) {
		F.form.reset();
		var xhr = new XMLHttpRequest();
		xhr.open('POST','scripts/simpleMusicPlayer.php?get=8');
		//xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		xhr.onload = function() {
			if (xhr.status === 200) {
				var response = JSON.parse(xhr.responseText);
				if (response.success) {
					F.prepareEdit(response['data']);
				}
				else {
					alert(response.message);
					console.log(response.data);
				}
			}
			else if (xhr.status !== 200) {
				alert('Request failed.  Returned status of ' + xhr.status);
			}
		};
		xhr.send();
	}
/*
	F.make = (I && I.make) ? I.make : make;
	F.updateCurrent = (I && I.updateCurrent) ? I.updateCurrent : updateCurrent;
	F.setBackground = (I && I.setBackground) ? I.setBackground : setBackground;
*/
	F.prepareEdit = (I && I.prepareEdit) ? I.prepareEdit : function(arr) {
		switch (arr.listPos) {
			case 'left':
				F.listPosLeft.checked = true;
				F.listPosRight.checked = false;
				break;
			case 'right':
				F.listPosRight.checked = true;
				F.listPosLeft.checked = false;
				break;
			default:
				F.listPosLeft.checked = true;
				F.listPosRight.checked = false;
		}

		if (arr.headerPos == 'bottom') {
			F.headerPosBottom.checked = true;
			F.headerPosTop.checked = false;
		} else {
			F.headerPosTop.checked = true;
			F.headerPosBottom.checked = false;
		}

		switch(arr.loop) {
			case 1:
				F.loopOne.checked = true;
				F.loopNone.checked = false;
				F.loopAll.checked = false;
				break;
			case 2:
				F.loopAll.checked = true;
				F.loopNone.checked = false;
				F.loopOne.checked = false;
				break;
			default:
				F.loopNone.checked = true;
				F.loopOne.checked = false;
				F.loopAll.checked = false;
		}

		if (arr.shuffle == 1) {
			F.shuffleOn.checked = true;
			F.shuffleOff.checked = false;
		} else {
			F.shuffleOff.checked = true;
			F.shuffleOn.checked = false;
		}

		var thisVol = (arr.volume != null && (typeof arr.volume === 'number' || typeof arr.volume === 'string') && (parseInt(arr.volume) >= 0 || parseInt(arr.volume) <= 100) ) ? parseInt(arr.volume) : 100;
		F.volume.value = thisVol;
		F.volumePreviewAdjust(thisVol);

	/*
		F.albumArtist.value = arr.album_artist_name;
		F.composer.value = arr.composer;

		F.alternativeArtContainer.querySelectorAll('.item').forEach(item=>{
			item.parentNode.removeChild(item);
		});
		F.alternativeArtActivator.style.display = 'block';
		F.artDisplay.src = (arr.art != null) ? arr.art +'#'+ new Date().getTime() : 'assets/default_album_art.jpg';

		while (F.dynamicLyricsInnerContainer.firstChild) F.dynamicLyricsInnerContainer.removeChild(F.dynamicLyricsInnerContainer.firstChild);
	
		if ( arr.medium == 0 ) {
			F.videoIdContainer.style.display = 'none';
			F.lyricsSettings.style.display = 'block';
			F.convertLyricsActivator.style.display = 'block';

			F.paddingContainer.style.display = 'block';
			F.startPadding.value = arr.start_padding;
			F.endPadding.value = arr.end_padding;

			F.simpleLyrics.value = arr.simpleLyrics;
			var seg = arr.dynamicLyrics;
			if (seg.length > 0) {
				for (var lyricSeg in seg) {
					F.dynamicLyricsIndex = parseInt(lyricSeg);
					F.dynamicLyricsInnerContainer.appendChild(F.dynamicLyricSegmentForEdit(lyricSeg, seg[lyricSeg]['time'], seg[lyricSeg]['style'], seg[lyricSeg]['no_text'], seg[lyricSeg]['text']));
				}
			}
			if (arr.dynamic_lyrics_toggle == 1) {
				F.lyricsSettingsSimpleRadio.checked = false;
				F.lyricsSettingsDynamicRadio.checked = true;
				F.lyricsSimpleContainer.classList.remove('selected');
				F.lyricsDynamicContainer.classList.add('selected');
				F.convertLyricsActivator.innerHTML = '=> Import from Simple Lyrics';
				F.openedLyrics = 1;
			} else {
				F.lyricsSettingsSimpleRadio.checked = true;
				F.lyricsSettingsDynamicRadio.checked = false;
				F.lyricsSimpleContainer.classList.add('selected');
				F.lyricsDynamicContainer.classList.remove('selected');
				F.convertLyricsActivator.innerHTML = 'Import from Dynamic Lyrics <=';
				F.openedLyrics = 0;
			}
		}
		else {
			F.paddingContainer.style.display = 'none';

			if (arr.medium == 1) {
				F.videoId.value = arr.url;
				F.videoIdContainer.style.display = 'block';
			} 
			else F.videoIdContainer.style.display = 'none';
			F.lyricsSettings.style.display = 'none';
			F.lyricsSettingsSimpleRadio.checked = false;
			F.lyricsSettingsDynamicRadio.checked = true;
			F.lyricsSimpleContainer.classList.remove('selected');
			F.lyricsDynamicContainer.classList.add('selected');
			F.convertLyricsActivator.style.display = 'none';
			F.openedLyrics = 1;
			var seg = arr.dynamicLyrics;
			if (seg.length > 0) {
				for (var lyricSeg in seg) {
					F.dynamicLyricsIndex = parseInt(lyricSeg);
					F.dynamicLyricsInnerContainer.appendChild(F.dynamicLyricSegmentForEdit(lyricSeg, seg[lyricSeg]['time'], seg[lyricSeg]['style'], seg[lyricSeg]['no_text'], seg[lyricSeg]['text']));
				}
			}
		}
		*/
	}
/*
	F.convertLyrics = function() {
		var current = F.openedLyrics;
		var allSegments = [];
		var thisString = '';
		if (current == 0) {
			F.form.querySelectorAll('.dynamicLyricsEdit').forEach(elmnt=>{
				allSegments.push(elmnt.value);
			});
			thisString = allSegments.join('\n');
			F.simpleLyrics.value = thisString;
			return;
		}
		else if (current == 1) {
			thisString = F.simpleLyrics.value;
			allSegments = thisString.split('\n\n');
			while (F.dynamicLyricsInnerContainer.firstChild) F.dynamicLyricsInnerContainer.removeChild(F.dynamicLyricsInnerContainer.firstChild);
			allSegments.forEach(function(d,index) {
				F.dynamicLyricsInnerContainer.appendChild(F.dynamicLyricSegmentForEdit(index, '', '', '', d));
				F.dynamicLyricsIndex = index;
			});
			return;
		}
		else return;
	}
	F.populateAlternativeArtContainer = function() {
		var xhr = new XMLHttpRequest();
		xhr.open('GET','scripts/simpleMusicPlayer.php?get=4');
		xhr.onload = function() {
			if (xhr.status === 200) {
				var response = JSON.parse(xhr.responseText);
				if (response.success) {
					if (response['data']['data'] != null) {
						F.alternativeArtContainer.querySelectorAll('.item').forEach(item=>{
							item.parentNode.removeChild(item);
						});
						F.alternativeArtArray = response.data;
						F.alternativeArtActivator.style.display = 'none';
						var html, img, input, label;
						for (var index in response['data']['data']) {
							img = ( response['data']['data'][index].startsWith('data') ) ? response['data']['data'][index] : response['data']['data'][index]+'?'+new Date().getTime();
							html = F.make(['div',{class:'item alternate'},['img',{class:'item previewItem',src:img,alt:''}]]);
							input = F.make(['input',{type:'radio',class:'inputRadio alternateRadio',id:'alternate_art_'+index,name:'alternate_art',value:index}]);
							input.addEventListener('change',function() {
								F.iconEdit = null;
							});
							label = F.make(['label',{for:'alternate_art_'+index,class:'item previewLabel hover','data-id':index}]);
							label.addEventListener('click',function() {
								F.iconEdit = null;
								var alternative_id = this.dataset.id;
								F.artDisplay.src = F.alternativeArtArray['data'][alternative_id];
							});
							html.appendChild(input)
							html.appendChild(label);
							F.alternativeArtContainer.appendChild(html);
			       		}	
					}
					else F.alternativeArtActivator.innerHTML = 'No alternate album art available';
				}
				else {
					alert(response.message);
					console.log(response.data);
				}
			}
			else if (xhr.status !== 200) {
				alert('Request failed.  Returned status of ' + xhr.status +'\n Status Text: ' + xhr.statusText);
			}
		}
		xhr.send();
	}

	F.removeLyricSegment = (I && I.removeLyricSegment) ? I.removeLyricSegment : function(segId) {
		var removeThis = document.getElementById('dynamic_lyrics_segment_'+segId);
		removeThis.parentNode.removeChild(removeThis);	
	}
	F.addLyricSegment = (I && I.addLyricSegment) ? I.addLyricSegment : function() {
		F.dynamicLyricsIndex = parseInt(F.dynamicLyricsIndex) + 1;
		F.dynamicLyricsInnerContainer.appendChild(F.dynamicLyricSegmentForEdit(F.dynamicLyricsIndex, '', '', false, ''));
	}
	F.dynamicLyricSegmentForEdit = (I && I.dynamicLyricSegmentForEdit) ? I.dynamicLyricSegmentForEdit : function(id, time = '', style = '', notext = true, text = '') {
		//var lyricSegHTML = F.make(['div',{id:'dynamic_lyrics_segment_'+id,class:'item dynamicSegment'},['span',{class:'cancel dynamicLyricsSegmentRemove','data-id':id},'X'],['div',{class:'container dynamicSegment'},['span',{class:'item dynamicSegmentItem hover dynamicLyricsSegmentAddAbove'},'Add Segment Above'],['div',{class:'item dynamicSegmentItem'},['input',{class:'item inputText dynamicLyricsTime',type:'text',name:'dynamic_lyrics_times[]',placeholder:'Start Time',value:time}],['input',{class:'item inputText dynamicLyricsStyle',type:'text',name:'dynamic_lyrics_styles[]',placeholder:'Color',value:style}]],['div',{class:'item dynamicSegmentItem'},['input',{id:'dynamic_lyrics_notext_'+id+'Hidden',type:'hidden',value:'0',name:'dynamic_lyrics_notexts[]'}],['input',{id:'dynamic_lyrics_notext_'+id,class:'inputRadio dynamicLyricsNotext',type:'checkbox',value:'1',name:'dynamic_lyrics_notexts[]',checked:notext}],['label',{class:'item inputLabel noTextLabel hover',for:'dynamic_lyrics_notext_'+id},'No Text']],['div',{class:'item dynamicSegmentItem'},['textarea',{class:'item editInput dynamicLyricsEdit',name:'dynamic_lyrics_edits[]',placeholder:'Lyric Segment',rows:'4',html:text}]],['span',{'class':'item dynamicSegmentItem hover dynamicLyricsSegmentAddBelow'},'Add Segment Below']]]);
		var lyricSegHTML = F.make(['div',{id:'dynamic_lyrics_segment_'+id,class:'item dynamicSegment'}]);
		var removeSeg = F.make(['span',{class:'cancel dynamicLyricsSegmentRemove','data-id':id},'X']);
		removeSeg.addEventListener('click',function() {
			F.removeLyricSegment(this.dataset.id);
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
			F.dynamicLyricsInnerContainer.insertBefore(newSeg,this.parentNode.parentNode);
		});
		arr[arr.length-1].addEventListener('click',function() {
			F.dynamicLyricsIndex += 1;
			var newSeg = F.dynamicLyricSegmentForEdit(F.dynamicLyricsIndex);
			F.dynamicLyricsInnerContainer.insertBefore(newSeg,this.parentNode.parentNode.nextSibling);
		});

		lyricSegHTML.appendChild(removeSeg);
		arr.forEach(el=>{
			lyricInnerSeg.appendChild(el);
		});
		lyricSegHTML.appendChild(lyricInnerSeg);

		return lyricSegHTML;
	}
	F.serializeArray = function(form) {
		var objects = [];  
		if (typeof form == 'object' && form.nodeName.toLowerCase() == 'form') {  
			var fields = form.getElementsByTagName("input");  
			for(var i=0;i<fields.length;i++){  
				objects[objects.length] = { name: fields[i].getAttribute('name'), value: fields[i].getAttribute('value') };  
			}  
		}  
		return objects;  
	}
	F.prepareIconEdit = function(event) {
		F.iconEdit = event.target.files[0];
		var url = event.target.value;
		var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
		if (event.target.files && event.target.files[event.target.files.length-1] && (ext == 'PNG' || ext == 'png' || ext == 'jpeg' || ext == 'jpg' || ext == 'JPEG' || ext == 'JPG')) {
			var reader = new FileReader();
			reader.readAsDataURL(event.target.files[event.target.files.length-1]);
			reader.onload = function (e) {	
				F.artDisplay.src = e.target.result;
			}
		} 
		else F.artDisplay.src = 'assets/default_album_art.jpg';
	}
	F.editIcon = function(event) {
		event.stopPropagation(); 	// Stop stuff happening
		event.preventDefault(); 	// Totally stop stuff happening
		
		var file = F.iconEdit;
		if (file == null) {
			F.submitEdit(F.songId.value,0);
			return;
		}
		var data = new FormData();
		data.append('file',file);
		data.append('id_edit',F.songId.value);
		data.append('command','icon');

		var xhr = new XMLHttpRequest();
		xhr.open('POST','scripts/simpleMusicPlayer.php?get=5');
		xhr.onload = function() {
			if (xhr.status == 200) {
				var response = JSON.parse(xhr.responseText);
				if (response.success){
					F.submitEdit(F.songId.value,1);
				}
				else {
					alert(response.message);
					console.log(response.data);
				}
			}
			else alert('Request failed.  Returned status of ' + xhr.status +'\n Status Text: ' + xhr.statusText);
		};
		xhr.send(data);
	}
*/
	F.submitEdit = function(event) {
		event.stopPropagation(); 	// Stop stuff happening
		event.preventDefault(); 	// Totally stop stuff happening

		var formData = new FormData(F.form);
		var xhr = new XMLHttpRequest();
		xhr.open('POST','scripts/simpleMusicPlayer.php?get=9');
		xhr.onload = function() {
			if (xhr.status == 200) {
				var response = JSON.parse(xhr.responseText);
				if (response.success){
					var res = response.data;
					console.log(res);
					globalPlayer.loop = res['loop'];
					globalPlayer.shuffle = res['shuffle'];
					if (globalPlayer.listPos != res['listPos'] || globalPlayer.headerPos != res['headerPos']) {
						setHeaderPos(res['headerPos'],res['listPos']);
					}
					/*
					if (res['listPos']) {
						globalPlayer.listContainer.classList.add('right');
						globalPlayer.listContainer.classList.remove('left');
					} else {
						globalPlayer.listContainer.classList.add('left');
						globalPlayer.listContainer.classList.remove('right');
					}
					if (globalPlayer.headerPos != res['headerPos']) {
						globalPlayer.headerPos = res['headerPos'];
						setHeaderPos(globalPlayer.headerPos);
					}
					*/
				}
				else {
					alert(response.message);
					console.log(response.data);
				}
			}
			else {
				alert('Request failed.  Returned status of ' + xhr.status +'\n Status Text: ' + xhr.statusText);
			}
		};
		xhr.send(formData);
	}
	F.volumePreviewAdjust = function(val) {
		console.log(val);
		if (val > 0 && val <= 50) {
			F.volumePreview.classList.add('half');
			F.volumePreview.classList.remove('full');
		} else if (val > 50 && val <= 100) {
			F.volumePreview.classList.add('full');
			F.volumePreview.classList.remove('half');
		} else {
			F.volumePreview.classList.remove('full');
			F.volumePreview.classList.remove('half');
		}
		return;
	}
/*
	F.resetPlayerAfterEdit = function() {
		F.setBackground('assets/default_player_background.jpg', globalPlayer.background);

		globalPlayer.currentPlayer.title.classList.remove('smallerTitle');
		globalPlayer.currentPlayer.title.innerHTML = 'Choose a Song';
		globalPlayer.currentPlayer.artist.innerHTML = 'Artist';
		while(globalPlayer.currentPlayer.lyrics.firstChild) globalPlayer.currentPlayer.lyrics.removeChild(globalPlayer.currentPlayer.lyrics.firstChild);
		globalPlayer.currentPlayer.durationDisplay.innerHTML = '--:--';
		globalPlayer.currentPlayer.timeDisplay.innerHTML = '--:--';
		globalPlayer.currentPlayer.timeSlider.value = 0;
		globalPlayer.currentPlayer.playButton.classList.remove('playing');

		globalPlayer.currentSong = -1;
		globalPlayer.currentAlbumArtist = -1;
		globalPlayer.currentAlbum = -1;
		globalPlayer.dynamic_lyrics_toggle = false;
		globalPlayer.dynamic_lyrics_starting_times = null;
		globalPlayer.canPlay = false;
		globalPlayer.current_time_index = -1;
		globalPlayer.current_time = -1;
		globalPlayer.currentMediaType = -1;
		globalPlayer.startPadding = 0;
		globalPlayer.endPadding = 3599999;	
		globalPlayer.queue.length = 0;

		if (globalPlayer.currentMediaType == 0) {
			globalPlayer.currentPlayer.container.classList.remove('closed');
			globalPlayer.currentPlayer.art.src = 'assets/default_album_art.jpg';
			globalPlayer.currentPlayer.lyrics.innerHTML = "<span class='lyric_segment noText'></span><span class='lyric_segment'><i>Lyrics go Here</i></span><span class='lyric_segment'></span>";
		} else {
			globalPlayer.currentPlayer.container.classList.add('closed');
			audio_player.playButton.classList.remove('playing');
		}
	}
*/

	/* --- CLICK EVENTS --- */
/*
	F.alternativeArtActivator.addEventListener('click', F.populateAlternativeArtContainer);
	F.dynamicLyricsAddSegment.addEventListener('click', F.addLyricSegment);
	F.lyricsSettingsSimple.addEventListener('click', function() {
		F.lyricsDynamicContainer.classList.remove('selected');
		F.lyricsSimpleContainer.classList.add('selected');
		F.convertLyricsActivator.innerHTML = 'Import from Dynamic Lyrics <=';
		F.openedLyrics = 0;
	});
	F.lyricsSettingsDynamic.addEventListener('click', function() {
		F.lyricsSimpleContainer.classList.remove('selected');
		F.lyricsDynamicContainer.classList.add('selected');
		F.convertLyricsActivator.innerHTML = '=> Import from Simple Lyrics';
		F.openedLyrics = 1;
	});
	F.convertLyricsActivator.addEventListener('click',F.convertLyrics);
	F.art.addEventListener('change', F.prepareIconEdit);
	F.delete.addEventListener('click', function() {	
		F.submitEdit(F.songId.value, 0, 1);	
	});
*/
	F.volume.addEventListener('input',function() {
		F.volumePreviewAdjust(this.value);
	});
	//F.submit.addEventListener('click', F.editIcon);
	F.submit.addEventListener('click', F.submitEdit);

	return F;
}
function openEditSettingsForm() {
	globalPlayer.listSongs.style.display = 'none';
	embedForm.closeForm();
	editAlbumArtForm.closeForm();
	addMediaForm.closeForm();
	editMediaForm.closeForm();

	editSettingsForm.openForm();

	video_player.lyrics_parent.classList.add('lock');
	globalPlayer.controls.container.classList.add('lock');
	if (!globalPlayer.listOpen) {
		document.getElementById('list').classList.remove('closed');
	}
}
function closeEditSettingsForm() {
	setTimeout(()=>{
		if (!globalPlayer.listOpen && !embedForm.status && !addMediaForm.status && !editAlbumArtForm.status && !editMediaForm.status ) {
			document.getElementById('list').classList.add('closed');
		}
		video_player.lyrics_parent.classList.remove('lock');
		globalPlayer.controls.container.classList.remove('lock');
		editSettingsForm.closeForm();
		globalPlayer.listSongs.style.display = 'block';
	},500);
}



/* Setting Global Variables */
globalPlayer = {
	listContainer: document.getElementById('list'),
	listSongs:document.getElementById('listSongs'),
	listToggle: document.getElementById('toggleList'),
	background:document.getElementById('background'),
	mediaContainer: document.getElementById('media_container'),
	controls: {
		container: document.getElementById('playerInfo'),
		timeSlider: document.getElementById('time_slider'),
		timeDisplay: document.getElementById('curTime'),
		durationDisplay: document.getElementById('duration'),
		playButton: document.getElementById('playpause'),
		previousButton: document.getElementById('previous'),
		nextButton: document.getElementById('next'),
		loopButton: document.getElementById('repeat'),
		shuffleButton: document.getElementById('shuffle'),
		backFiveButton: document.getElementById('backFive'),
		forwardFiveButton: document.getElementById('forwardFive'),
		volumeSlider: document.getElementById('volume'),
		volumeImage: document.getElementById('volume_image'),
		optionsButton: document.getElementById('options'),
		autoscrollButton: document.getElementById('player_lyrics_autoscroll'),
		contextMenu: document.getElementById('contextMenu'),
		toggleFull: document.getElementById('toggleFullScreen')
	},
	listOpen:true,
	listPos:'left',
	headerPos:'top',
	mouseTimeout: null, 
	mouseInterval: null,
	currentPlayer:null,
	currentSong:-1,
	currentAlbum:-1,
	currentAlbumArtist:-1,
	currentMediaType:-1,
	songToEdit:-1,
	scrollToLyrics:true,
	lyricScrollOff:false,
	paused:true,
	loop:1,
	shuffle:0,
	dynamic_lyrics_toggle:false,
	dynamic_lyrics_starting_times:null,
	lock_time_slider: false,
	current_time:-1,
	current_time_index:-1,
	ignoreOnTimeUpdate:false,
	startPadding:0,
	endPadding:3599999,
	canPlay:false,
	volume:100,
	storeVolume:100,
	mute:false,
	lyricsHeight:0,
	database: [],
	queue: [],
	searchResults:document.getElementById('searchResults'),
	searchElement:document.getElementById('searchInput'),
	searchFindings: {}
};
editMediaForm = initializeEditMediaForm();
editAlbumArtForm = initializeEditAlbumArtForm();
embedForm = initializeEmbedForm();
addMediaForm = initializeAddMediaForm();
editSettingsForm = initializeEditSettingsForm();
audio_player = {
	container: document.getElementById('player_container'),
	html: document.getElementById('audio'),
	title: document.getElementById('audioTitle'),
	artist: document.getElementById('audioArtist'),
	lyrics: document.getElementById('player_lyrics'),
	player_and_lyrics: document.getElementById('player_art_and_lyrics'),
	art: document.getElementById('player_art')
};
video_player = {
	container: document.getElementById('video_container'),
	html: document.getElementById("localVideo"),
	titleArtistContainer: document.getElementById('videoTitleAndArtist'),
	title: document.getElementById('videoTitle'),
	artist: document.getElementById('videoArtist'),
	lyrics: document.getElementById('video_lyrics_inner_container'),
	embedContainer: document.getElementById('video_embed'),
	lyrics_parent: document.getElementById('video_lyrics_container'),
	embedPlayer: null,
	lock_time_slider: false,
	embedTimeUpdateInterval: null,
};

/* Initialization Functions */
globalPlayer.currentPlayer = audio_player;
initializeSettings();
setBackground(null, globalPlayer.background);
getAllMedia();

/* User-related actions */
window.onkeydown = function(e) {
	var cases = [32,77,39,37,8,13];
	if ( cases.includes(e.keyCode) && (e.target.tagName.toUpperCase() != 'INPUT' || (e.target.tagName.toUpperCase() == 'INPUT' && e.target.type.toUpperCase() == 'RANGE' ) ) && (e.target.tagName.toUpperCase() != 'TEXTAREA') ) {
		e.preventDefault();
		switch(e.keyCode) {
			case 32: //Space
				if (globalPlayer.currentSong == -1) break;
				if (globalPlayer.paused) startMedia();
				else pauseMedia();
				break;
			case 77: //M
				var newVol = (globalPlayer.mute) ? globalPlayer.storeVolume : 0;
				globalPlayer.mute = !globalPlayer.mute;
				volumeAdjust(newVol);
				break;
			case 39: //right arrow
				forwardMedia();
				break;
			case 37: //left arrow
				backwardMedia();
				break;
			case 8: //backspace
				previousMedia();
				break;
			case 13: //enter
				nextMedia();
				break;
			default:
				console.log(e.keyCode);
		}
	}
};
document.onmousemove = function(e) {
	mousePos = getMousePos(e);
};
document.getElementsByTagName("BODY")[0].addEventListener('click',function(e) {
	setTimeout(()=>{
		globalPlayer.controls.contextMenu.style.display = 'none';
	},50);
	/*
	if ( e.target != globalPlayer.controls.contextMenu && e.target.parentNode != globalPlayer.controls.contextMenu ) {
		globalPlayer.controls.contextMenu.style.display = 'none';
	} else {
		setTimeout(()=>{
			globalPlayer.controls.contextMenu.style.display = 'none';
		},200);
	}
	*/
});
document.getElementById('contextOptions').addEventListener('click', e=>{
	e.stopPropagation();
	globalPlayer.controls.contextMenu.style.display = 'none';
	var curId = globalPlayer.songToEdit;
	var curEditingId = editMediaForm.songId.value;
	if (!editMediaForm.status) {
		editMediaForm.startEdit(curId);
		openEdit();
	}
	else if (globalPlayer.currentSong != curId) {
		if (curEditingId != curId) F.startEdit(curId);
		else closeEdit();
	} else {
		if (curEditingId != curId) F.startEdit(curId);
		else closeEdit();
	}
});
globalPlayer.listToggle.addEventListener('click',function() {
	document.getElementById('list').classList.toggle('closed');
	globalPlayer.listOpen = !globalPlayer.listOpen;
});
//globalPlayer.controls.toggleFull.addEventListener('click',toggleFullScreen);

globalPlayer.searchElement.addEventListener('focus', function(e) {
	if (Object.keys(globalPlayer.searchFindings).length > 0) globalPlayer.searchResults.classList.add('show')
});
globalPlayer.searchElement.addEventListener('blur',function(e) {
	setTimeout(function(){
		globalPlayer.searchResults.classList.remove('show');
	}, 200);
});
globalPlayer.searchElement.addEventListener('keyup', function(e){
	if (e.keyCode == 13) return;
	else if (globalPlayer.searchElement.value.length >= 3) {
		globalPlayer.searchFindings = search(globalPlayer.searchElement.value);
		while (globalPlayer.searchResults.firstChild) globalPlayer.searchResults.removeChild(globalPlayer.searchResults.firstChild);
		var albumContainer, searchSongs, searchSong;
		if (Object.keys(globalPlayer.searchFindings).length > 0) {
			for(var alb in globalPlayer.searchFindings) {
				albumContainer = make(['div',{class:'dropdownItem'},['h5',alb]]);
				searchSongs = make(['div',{class:'searchAlbum'}]);
				globalPlayer.searchFindings[alb].forEach(function(val, index) {
					searchSong = make(['div',{class:'searchSong','data-id':val['id'],'data-medium':val['medium']},['div',{class:'searchSongArt'},['img',{src:val['art'],alt:val['title']}]],['div',{class:'searchSongText'},['span',{class:'searchSongTitle'},val['title']],['span',{class:'searchSongArtist'},val['artist']]]]);
					searchSong.addEventListener('click',function() {
						var id = this.dataset.id;
						var medium = this.dataset.medium;
						songClicked(id, medium);
					});
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

/* Edit Album Art Form-related functions */
editAlbumArtForm.close.addEventListener('click',closeAlbumArtEdit);

/* Embed Form-related functions */
embedForm.open.addEventListener('click', openEmbed);
embedForm.close.addEventListener('click', closeEmbed);

/* Add Media Form-related Click Events */
addMediaForm.open.addEventListener('click',openAdd);
addMediaForm.close.addEventListener('click',closeAdd);

/* Edit Form-related functions */
editMediaForm.close.addEventListener('click', closeEdit);

/* Edit Global Setttings-related functions */
editSettingsForm.open.addEventListener('click',()=>{
	if (!editSettingsForm.status) {
		editSettingsForm.startEdit();
		openEditSettingsForm();
	}
});
editSettingsForm.close.addEventListener('click',closeEditSettingsForm);

/* Player-related functions */
globalPlayer.controls.playButton.addEventListener('click', function() {
	if (globalPlayer.paused) startMedia();
	else pauseMedia();
});
globalPlayer.controls.loopButton.addEventListener('click', setLoop);
globalPlayer.controls.shuffleButton.addEventListener('click', setShuffle);
globalPlayer.controls.volumeSlider.addEventListener('input',function(){ 
	globalPlayer.storeVolume = this.value;
	volumeAdjust(this.value);
});
globalPlayer.controls.timeSlider.addEventListener('input', function() { 	timeAdjust(this.value);	});	/* Moving the slider adjusts the audio's time */
globalPlayer.controls.previousButton.addEventListener('click', previousMedia);
globalPlayer.controls.nextButton.addEventListener('click', nextMedia);
globalPlayer.controls.forwardFiveButton.addEventListener('click', forwardMedia);
globalPlayer.controls.backFiveButton.addEventListener('click', backwardMedia);
globalPlayer.controls.volumeImage.addEventListener('click', function() {
	var newVol = (globalPlayer.mute) ? globalPlayer.storeVolume : 0;
	globalPlayer.mute = !globalPlayer.mute;
	volumeAdjust(newVol);
});
globalPlayer.controls.autoscrollButton.addEventListener('click', autoscrollToggle);
globalPlayer.controls.optionsButton.addEventListener('click', function() {
	if (!editMediaForm.status) {
		editMediaForm.startEdit(globalPlayer.currentSong);
		setTimeout(openEdit,500);
	}
	else {
		if (editMediaForm.songId.value != globalPlayer.currentSong) editMediaForm.startEdit(globalPlayer.currentSong);
		else closeEdit();
	}
});
audio_player.html.addEventListener('ended', nextMedia);
video_player.html.addEventListener('ended', nextMedia);
video_player.container.addEventListener('mouseover',function(e) {
	clearTimeout(globalPlayer.mouseTimeout);
	clearInterval(globalPlayer.mouseInterval);
	video_player.titleArtistContainer.style.opacity = 1;
	globalPlayer.controls.container.style.opacity = 1;
	if ( (globalPlayer.currentMediaType == 1 || globalPlayer.currentMediaType == 2) ) {
		globalPlayer.mouseTimeout = setTimeout(function() {
			var temp = 1;
			globalPlayer.mouseInterval = setInterval(function() {
				if (temp > 0) {
					video_player.titleArtistContainer.style.opacity -= 0.05;
					globalPlayer.controls.container.style.opacity -= 0.05;
					temp -= 0.05;
				}
				else clearInterval(globalPlayer.mouseInterval);
			},10);
		},3000)
	}
});


