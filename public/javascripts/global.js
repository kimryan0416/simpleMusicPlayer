var data;

function sendHTTPRequest(type, url, next) {
	var xhr = new XMLHttpRequest();
	xhr.open(type, url);
	xhr.onload = function() {
		next(xhr);
	}
	xhr.send();
}

function initializeSMP() {
	sendHTTPRequest("GET","/initialize", (res)=>{
		if (res.status === 200) {
			var db = JSON.parse(res.responseText);
			data = db;
			populateList();
		} else {
			console.log("Request Failed. Returned status of " + res.status);
		}
	});
}

function initializeSettings() {
	sendHTTPRequest("GET", "/settings", (res)=>{
		if (res.status === 200) {
			var settings = JSON.parse(res.responseText);
			console.log(settings);
		} else {
			console.log("Request Failed. Returned status of " + res.status);
		}
	});
}

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

/* assuming time is in the format of seconds.milliseconds */
function milliseconds(seconds) {	return Math.floor(seconds*1000);	}
function revertFromMilliseconds(millisec) {	return millisec / 1000;	}

function setBackground(img, backgroundElement = null, blur = 1) {
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
		ctx.fillStyle = 'rgb(255,255,255)';
		ctx.fill();
	}
	return canvas;
}

function setArt(img,targetElement=null) {
	var element = (targetElement != null) ? targetElement : document.getElementById('player_art_el');
	element.src = img;
	return;
}

function setText(title,artist) {
	document.getElementById('title').innerHTML = title;
	document.getElementById('artist').innerHTML = artist;
}

function setDuration(duration=0) {
	document.getElementById('player_duration').innerHTML = readableDuration(duration,false);
	document.getElementById('player_range').max = duration;
}

function setCurTime(cur=0) {
	document.getElementById('player_current_time').innerHTML = readableDuration(cur,false);
	document.getElementById('player_range').value = cur;
}

function initializeMedia(id,med){
	console.log(id);
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
	Object.values(data).forEach(album_artist=>{
		var album_artist_html = make([
			'div',
			{id:album_artist.id,class:'album_artist'},
			['h2',album_artist.name]
		]);
		Object.values(album_artist.albums).forEach(album=>{
			var songs = album.songs;
			var firstSong = songs[0];
			var album_art = firstSong.song_art;
			var songs_html = songs.map(song=>{
				var song_html = make([
					'div',
					{id:'s'+song.id, class:'song', rel:song.id},
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
				'div',
				{class:'album'},
				[
					'div',
					{class:'album_art_container'},
					['img',{class:'album_art',src:album_art,alt:'"'+album.name+'" Art'}]
				],
				[
					'div',
					{class:'album_content'},
					[
						'div',
						{class:'album_name'},
						['span',album.name]
					],
					[
						'div',
						{class:'songs'},
						[
							'div',
							{class:'songs_head'},
							[
								'span',
								{class:'song_id'},
								'ID'
							],
							[
								'span',
								{class:'song_title'},
								'TITLE'
							],
							[
								'span',
								{class:'song_artist'},
								'ARTIST'
							],
							[
								'span',
								{class:'song_duration'},
								'DURATION'
							]
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
		console.log(album_artist);
	});
}

initializeSMP();
initializeSettings();

setBackground('/art/1.jpg',document.getElementById('player_background'));
setArt('/art/1.jpg');
setText("Hello World!","Ryan Kim");
setDuration(10000);
setCurTime(1000);






