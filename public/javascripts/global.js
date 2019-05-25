var data, domElements, queue;

function sendHTTPRequest(type, url, content = null, contenttype, next) {
	var xhr = new XMLHttpRequest();
	xhr.open(type, url);
	if (type.toLowerCase() == "post") {
		var cType = (contenttype != null) ? contenttype : 'application/json';
		xhr.setRequestHeader('Content-Type',cType);
	}
	xhr.onload = function() {	next(xhr);	}
	xhr.send(content);
}

function compareTitle(a,b) {
	if ( a.title < b.title ){
		return -1;
	}
	if ( a.title > b.title ){
		return 1;
	}
	return 0;
}

/* assuming time is in the format of seconds.milliseconds */
function milliseconds(seconds) {	return Math.floor(seconds*1000);	}
function revertFromMilliseconds(millisec) {	return millisec / 1000;	}

/* Get the duration or current time of a song in minutes:seconds instead of just seconds	*/
function readableDuration(milliseconds,includeMilli=true) {
	var sec = milliseconds / 1000;
	var min = Math.floor(sec/60);
	min = min >= 10 ? min : '0' + min;
	sec = Math.floor(sec % 60);
	sec = sec >= 10 ? sec : '0' + sec; 
	var milli = Math.floor(milliseconds%1000);
	milli = milli >= 100 ? milli : '0' + milli;
	milli = milli >= 10 ? milli : '0' + milli;
	return (includeMilli) ? min + ":" + sec + "." + milli : min + ":" + sec;
}
function millisecondDuration(time) {
	var segments = time.split(':');
	var hours,minutes,seconds,milli;
	seconds = parseFloat(segments[segments.length-1]);
	minutes = parseFloat(segments[segments.length-2]);
	seconds += minutes * 60;
	if (segments.length == 3) {
		// hours are also present
		hours = parseFloat(segments[segments.length-3]);
		seconds += hours * 3600;
	}
	milli = milliseconds(seconds);
	return parseInt(milli);
}

/* Fisher-Yates (aka Knuth) Shuffle */
function shuffleArray(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function setBackground(img, backgroundElement = null, blur = 2) {
	var canvas = ( backgroundElement && backgroundElement.tagName === 'CANVAS' ) ? backgroundElement : make(['canvas',{style:'position:absolute;width:100%;height:100%;top:0;bottom:0;left:0;right:0;background-color:transparent;'}]);
	var ctx = canvas.getContext('2d');
	if (img) {
		ctx.filter = 'blur('+blur+'px)';
		var imgObj = new Image();
		imgObj.src = (img.startsWith('data')) ? img : img + '#' + new Date().getTime();
		imgObj.onload = function() {
			var imageRatio = this.width/this.height;
			ctx.drawImage(	imgObj,	canvas.width / 2 - imgObj.width / 2,	canvas.height / 2 - imgObj.height / 2);
		}
	} else {
		ctx.rect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = 'rgb(255,255,255)';
		ctx.fill();
	}
	return canvas;
}

function setArt(img,targetElement=null) {
	var element = (targetElement != null) ? targetElement : domElements.art;
	element.src = img;
	return;
}

function setText(title,artist) {
	domElements.title.innerHTML = title;
	domElements.artist.innerHTML = artist;
}

function setTimeMaximum(t=0) {
	domElements.duration.innerHTML = readableDuration(t,false);
	domElements.timeline.max = t;
}
function setTimeMinimum(t=0) {
	domElements.currentTime.innerHTML = readableDuration(t,false);
	domElements.timeline.min = t;
}

function setCurTime(cur=0) {
	domElements.currentTime.innerHTML = readableDuration(cur,false);
	domElements.timeline.value = cur;
}

function setLyrics(content = "",toggle) {
	if (content == "") domElements.lyrics.classList.add('hide');
	else domElements.lyrics.classList.remove('hide');
}

function playMedia() {
	domElements.audio.play();
	domElements.playpause.classList.remove('paused');
}

function pauseMedia() {
	domElements.audio.pause();
	domElements.playpause.classList.add('paused');
}

function forwardMedia(amount = 5.0) {
	domElements.audio.currentTime += amount;
	updateTimes();
}

function backwardMedia(amount = 5.0) {
	domElements.audio.currentTime -= amount
	updateTimes();
}

function nextMedia() {
	if (isArray(queue) && queue.length >= 1) {
		var theNextMediaID, initialTime;
		switch(data.settings.repeat) {
			case "song":
				initialTime = (data.current.s_padding != null) ? parseInt(data.current.s_padding) : 0;
				setCurTime(initialTime);
				domElements.audio.currentTime = revertFromMilliseconds(initialTime);
				playMedia();
				break;
			case "queue":
				theNextMediaID = queue.shift();
				queue.push(theNextMediaID);
				initializeMedia(theNextMediaID,0);
				break;
			default:
				theNextMediaID = queue.shift();
				initializeMedia(theNextMediaID,0);
		}
	} else {
		console.log("REACHED END OF QUEUE");
	}
}

function previousMedia() {
	if (milliseconds(domElements.audio.currentTime) - data.current.s_padding > 5000) {
		initialTime = (data.current.s_padding != null) ? parseInt(data.current.s_padding) : 0;
		setCurTime(initialTime);
		domElements.audio.currentTime = revertFromMilliseconds(initialTime);
		playMedia();
	} else if (isArray(queue) && queue.length >= 1) {
		/* This one is a little weird. 
		When a song plays, it moves its id to the back of the queue.
		Logically, when we call the NEXT song, all we need to do is get the current first ID in the queue, initiate that, then push it to the end.
		In this case, we need to move our current song's ID (which is at the end of the queue) to the front AND initialize the 2nd-TO-LAST item in the queue
		*/
		var theNextMediaID, thisID, initialTime;
		switch(data.settings.repeat) {
			case "song":
				initialTime = (data.current.s_padding != null) ? parseInt(data.current.s_padding) : 0;
				setCurTime(initialTime);
				domElements.audio.currentTime = revertFromMilliseconds(initialTime);
				playMedia();
				break;
			case "queue":
				thisID = queue.pop()
				queue.unshift(thisID);
				theNextMediaID = queue[queue.length-1];
				initializeMedia(theNextMediaID,0);
				break;
			default:
				thisID = queue.pop();
				theNextMediaID = queue[queue.length-1];
				initializeMedia(theNextMediaID,0);
		}
	} else {
		console.log("REACHED END OF QUEUE");
	}
}

function toggleRepeat() {

}

function createQueue(random = false, type = "album") {
	var filtered = [];
	if (data.current == null) {
		return;
	}
	switch(type) {
		case 'album':
			filtered = data.db.reduce((f,s)=>{
				if (s.album_id == data.current.album_id) f.push(s)
				return f;
			},[]);
			break;
		case 'album artist':
			filtered = data.db.reduce((f,s)=>{
				if (s.album_artist_id == data.current.album_artist_id) f.push(s);
				return f;
			},[]);
			break;
		case 'playlist':
			// TO BE IMPLEMENTED LATER
			filtered = [];
			break;
		default:
			filtered = [];
	}
	if (filtered == null) {
		return false;
	} else if (random) {
		filtered = shuffleArray(filtered);
	} else {
		filtered.sort(compareTitle);
	}

	filtered = filtered.map(s=>{
		return s.id;
	});

	/* Finally, shift contents of array until current ID is in back */
	while (filtered.indexOf(data.current.id) != filtered.length - 1) {
		var lastID = filtered.pop();
		filtered.unshift(lastID);
	}

	if (filtered == false) {
		console.log("Queue creation returned an error!");
		queue = [];
	} else {
		queue = filtered;
		console.log("QUEUE:");
		console.log(queue);
	}
	return;
}

function initializeMedia(id,med=0,playOnStart=true){
	/* On clicking a piece of media within the song list, we are activating it */
	var song = data.db.find(s=>{
		return s.id == id;
	});
	if (song != null) {
		console.log(song);

		var createNewQueue = true;
		switch(data.settings.loop) {
			case "album":
				createNewQueue = (data.current != null) ? song.album_id != data.current.album_id : true;
				break;
			case "album artist":
				createNewQueue = (data.current != null) ? song.album_artist_id != data.current.album_artist_id : true;
				break;
			case "playlist":
				createNewQueue = false;
				break;
		}
		console.log(createNewQueue);

		data.current = song;
		var id = song.id;
		var extension = song.extension;
		var img = song.song_art;
		var title = (song.title != null) ? song.title : "Untitled";
		var artist = (song.artist != null) ? song.artist : "No Artist";
		var duration = (song.e_padding != null) ? parseInt(song.e_padding) : (song.duration.indexOf(":") > -1) ? millisecondDuration(song.duration) : parseInt(song.duration);
		var starting = (song.s_padding != null) ? parseInt(song.s_padding) : 0;
		var type = song.type;
		var lyrics = (song.d_lyrics_toggle == 0) ? song.lyrics : song.d_lyrics;
		var lyricsToggle = song.d_lyrics_toggle;

		setText(title, artist);
		setBackground(img, document.getElementById('player_background'));
		setArt(img);
		setTimeMinimum(starting);
		setTimeMaximum(duration);
		setLyrics(lyrics, lyricsToggle);

		domElements.audio.src = `/media/${id}.${extension}`;
		domElements.audio.currentTime = revertFromMilliseconds(starting);
		if (playOnStart) playMedia();

		if (createNewQueue) {
			createQueue(data.settings.shuffle,data.settings.loop);
		}

	} else {
		alert("ERROR: Media item could not be detected");
	}
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

function populateList() {
	var list = document.getElementById('song_list');
	var dataParsed = data.db.reduce((filtered,row)=>{
		filtered[row.album_artist_id] = filtered[row.album_artist_id] || {
			id : row.album_artist_id,
			name : row.album_artist_name,
			albums : {}
		}
		filtered[row.album_artist_id]['albums'][row.album_id] = filtered[row.album_artist_id]['albums'][row.album_id] || {
			id : row.album_id,
			name : row.album_name,
			songs : []
		}
		filtered[row.album_artist_id]['albums'][row.album_id]['songs'].push(row);

		filtered[row.album_artist_id]['albums'][row.album_id]['songs'].sort(compareTitle);
		return filtered;
	},{});

	Object.values(dataParsed).forEach(album_artist=>{
		var album_artist_html = make([
			'div',{id:album_artist.id,class:'album_artist'},
			['h2',album_artist.name]
		]);
		Object.values(album_artist.albums).forEach(album=>{
			var songs = album.songs;
			var firstSong = songs[0];
			var album_art = firstSong.song_art;
			var songs_html = songs.map(song=>{
				var song_html = make([
					'div',{id:'s'+song.id, class:'song', rel:song.id},
					['span',{class:'song_id'},song.id],
					['span',{class:'song_title'},song.title],
					['span',{class:'song_artist'},song.artist],
					['span',{class:'song_duration'},song.duration]
				]);
				song_html.addEventListener('click',function(){
					var id = song.id;
					var medium = song.medium;
					initializeMedia(id, medium);
				});
				return song_html;
			});
			var album_html = make([
				'div',{class:'album'},
				[
					'div',{class:'album_art_container'},
					['img',{class:'album_art',src:album_art,alt:'"'+album.name+'" Art'}]
				],
				[
					'div',{class:'album_content'},
					['div',{class:'album_name'},['span',album.name]],
					[
						'div',{class:'songs'},
						[
							'div',
							{class:'songs_head'},
							['span',{class:'song_id'},'ID'],
							['span',{class:'song_title'},'TITLE'],
							['span',{class:'song_artist'},'ARTIST'],
							['span',{class:'song_duration'},'DURATION']
						]
					]
				]
			]);
			songs_html.forEach(sh=>{
				album_html.querySelector('.songs').appendChild(sh);
			});
			album_artist_html.appendChild(album_html);
		});
		list.appendChild(album_artist_html);
	});
}

function updateTimes() {
	var t = milliseconds(parseFloat(domElements.audio.currentTime));
	setCurTime(t);
}

function initializeSMP(next) {
	data = {
		db:null,
		settings:null,
		current: null
	};
	domElements = {
		title: document.getElementById('title'),
		artist: document.getElementById('artist'),
		art: document.getElementById('player_art_el'),
		duration: document.getElementById('player_duration'),
		currentTime: document.getElementById('player_current_time'),
		timeline: document.getElementById('player_range'),
		lyrics: document.getElementById('player_lyrics'),
		audio: document.createElement('audio'),
		previous: document.getElementById('prev'),
		back5: document.getElementById('back5'),
		playpause: document.getElementById('playpause'),
		for5: document.getElementById('for5'),
		next: document.getElementById('next'),
		loopPlaceholder: document.getElementById('dropdownLoopCurrent'),
		loopNo: document.getElementById('noLoop'),
		loopAlbum: document.getElementById('loopAlbum'),
		loopAlbumArtist: document.getElementById('loopAlbumArtist'),
		repeatPlaceholder: document.getElementById('dropdownRepeatCurrent'),
		repeatNo: document.getElementById('repeatOff'),
		repeatSong: document.getElementById('repeatSong'),
		repeatQueue: document.getElementById('repeatQueue'),
		shuffleToggle: document.getElementById('shuffleToggle')
	}

	var promiseInitialize = new Promise((resolve,reject)=>{
		sendHTTPRequest("GET","/initialize",null,null,(res)=>{
			if (res.status === 200) 
				resolve({type:"Database",content:JSON.parse(res.responseText)});
			else
				reject({type:"Database Retrieval",status:res.status});
		});
	});

	var promiseSettings = new Promise((resolve,reject)=>{
		sendHTTPRequest("GET", "/settings",null,null,(res)=>{
			if (res.status === 200)
				resolve({type:"Settings",content:JSON.parse(res.responseText)});
			else
				reject({type:"Settings Retrieval",status:res.status});
		});
	});

	Promise.all([promiseInitialize, promiseSettings]).then((res)=>{
		res.forEach(r=>{
			if (r.type == "Database") data.db = r.content;
			else if (r.type == 'Settings') data.settings = r.content;
		})
		console.log(data);
	},(rej)=>{
		rej.forEach(r=>{
			console.log("Request Failed: "+r.type + " | Returned status of " + r.status);
		});
	}).then(next);
}

function saveSettings() {

	data.settings.current_id = (data.current != null ) ? data.current.id : -1;
	data.settings.current_time = (domElements.audio.duration > 0) ? milliseconds(parseFloat(domElements.audio.currentTime)) : 0;
	data.settings.current_queue = queue;

	console.log(data.settings);

	var settings = JSON.stringify(data.settings);
	var promiseSaveSettings = new Promise((resolve,reject)=>{
		sendHTTPRequest("POST","/setsave",settings,'application/json',(res)=>{
			if (res.status === 200) {
				resolve();
			}
			else {
				reject();
			}
		});
	});
}

initializeSMP(()=>{
	if (data.db) populateList();
	if (data.settings) {
		console.log("Settings retrieved... Setting...");
		console.log(data.settings);

		/* Set any loop stuff first */
		switch(data.settings.loop) {
			case "no":
				domElements.loopPlaceholder.innerHTML = "No Loop";
				domElements.loopNo.classList.add('selected');
				break;
			case "album":
				domElements.loopPlaceholder.innerHTML = "Loop Album";
				domElements.loopAlbum.classList.add('selected');
				break;
			case "album artist":
				domElements.loopPlaceholder.innerHTML = "Loop Album Artist";
				domElements.loopAlbumArtist.classList.add('selected');
				break;
			case "playlist":
				break;
		}

		/* Set any repeat stuff second */
		switch(data.settings.repeat) {
			case "no":
				domElements.repeatPlaceholder.innerHTML = "No Repeat";
				domElements.repeatNo.classList.add('selected');
				break;
			case "song":
				domElements.repeatPlaceholder.innerHTML = "Repeat Song";
				domElements.repeatSong.classList.add('selected');
				break;
			case "queue":
				domElements.repeatPlaceholder.innerHTML = "Repeat Queue";
				domElements.repeatQueue.classList.add('selected');
				break;
		}
		
		/* Set any shuffle stuff third */
		if (data.settings.shuffle = true) {
			domElements.shuffleToggle.classList.add('selected');
		} else {
			domElements.shuffleToggle.classList.remove('selected');
		}

		/* Set up any currently-playing media and queues*/
		if (data.settings.current_id != -1) {
			initializeMedia(data.settings.current_id,0,false);
			domElements.audio.currentTime = revertFromMilliseconds(data.settings.current_time);
			setCurTime(data.settings.current_time);
		}
		queue = data.settings.current_queue
	}

	// Now listening for clicks and actions from user
	domElements.audio.ontimeupdate = function() { updateTimes() };
	domElements.audio.addEventListener('ended', function() {
		nextMedia();
	});
	domElements.playpause.addEventListener('click',()=>{
		console.log(domElements.audio.paused);
		if (domElements.audio.duration > 0 && domElements.audio.src != null) {
			if (!domElements.audio.paused) {
				// playing
				pauseMedia()
			} else {
				// not playing
				playMedia();
			}
		}
	});
	domElements.back5.addEventListener('click',()=>{
		backwardMedia(5.0);
	});
	domElements.for5.addEventListener('click',()=>{
		forwardMedia(5.0);
	});
	domElements.previous.addEventListener('click',()=>{
		previousMedia();
	})
	domElements.next.addEventListener('click',()=>{
		nextMedia();
	})
	domElements.timeline.addEventListener('input',()=>{
		var val = domElements.timeline.value
		domElements.audio.currentTime = revertFromMilliseconds(val);
		updateTimes();
	});

	domElements.loopNo.addEventListener('click',function() {
		document.querySelector('#loopDropdown .dropdownItem.selected').classList.remove('selected');
		data.settings.loop = "no";
		domElements.loopPlaceholder.innerHTML = "No Loop";
		domElements.loopNo.classList.add('selected');
		createQueue(data.settings.shuffle, data.settings.loop);
	});
	domElements.loopAlbum.addEventListener('click',function() {
		document.querySelector('#loopDropdown .dropdownItem.selected').classList.remove('selected');
		data.settings.loop = "album";
		domElements.loopPlaceholder.innerHTML = "Loop Album";
		domElements.loopAlbum.classList.add('selected');
		createQueue(data.settings.shuffle, data.settings.loop);
	});
	domElements.loopAlbumArtist.addEventListener('click',function() {
		document.querySelector('#loopDropdown .dropdownItem.selected').classList.remove('selected');
		data.settings.loop = "album artist";
		domElements.loopPlaceholder.innerHTML = "Loop Album Artist";
		domElements.loopAlbumArtist.classList.add('selected');
		createQueue(data.settings.shuffle, data.settings.loop);
	});

	domElements.repeatNo.addEventListener('click',function() {
		document.querySelector('#repeatDropdown .dropdownItem.selected').classList.remove('selected');
		data.settings.repeat = "no";
		domElements.repeatPlaceholder.innerHTML = "No Repeat";
		domElements.repeatNo.classList.add('selected');
	});
	domElements.repeatSong.addEventListener('click',function() {
		document.querySelector('#repeatDropdown .dropdownItem.selected').classList.remove('selected');
		data.settings.repeat = "song";
		domElements.repeatPlaceholder.innerHTML = "Repeat Song";
		domElements.repeatSong.classList.add('selected');
	});
	domElements.repeatQueue.addEventListener('click',function() {
		document.querySelector('#repeatDropdown .dropdownItem.selected').classList.remove('selected');
		data.settings.repeat = "queue";
		domElements.repeatPlaceholder.innerHTML = "Repeat Queue";
		domElements.repeatQueue.classList.add('selected');
	});

	domElements.shuffleToggle.addEventListener('click',function() {
		data.settings.shuffle = !data.settings.shuffle;
		if (data.settings.shuffle == true) {
			domElements.shuffleToggle.classList.add('selected');
		} else {
			domElements.shuffleToggle.classList.remove('selected');
		}
	});

	setInterval(()=>{
		saveSettings();
	},5000);
});






