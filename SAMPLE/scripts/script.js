var database = [];
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
var source;
var search_element, search_options_element, search_text, search_option, searching_boolean = true, search_matches = [];

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
	var data = database[id];
	console.log(data);
	preparePlayer(data);
	if (data.medium == 0) {
		prepareAudio(data);
	}
	if (newQueue) {
		loadQueue();
	}
}

function getAllMedia(updateCurrentPlayer = false, print = true, scrollTo = -1, deleted = false) {
	$.ajax({
		url: "scripts/getAllMedia.php",  
		type: 'GET', 
		dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (response.success) {
				setDatabaseInScript(response["raw_data"]);
				if (print) {
					$("#left_content").empty().hide();
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
			$("#left_content").show();
		}
	});
}
function setDatabaseInScript(raw) {
	database = raw;
	console.log(database);
}


function printMedia(sortedDatabase, updateCurrentPlayer = false, scrollTo = -1, deleted = false) {
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
	console.log(queue);
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
/*
function openSong(id) {
	$("#left_content").find(".selected").removeClass("selected");
	$(this).addClass("selected");
	openMedia(id, true);
	$(player.audio).trigger('play');  
	if (paused) {
		player.play.addClass("hiddenControl");
		player.pause.removeClass("hiddenControl");
		paused = false;
	}
}
*/

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
		} else {
			dynamic_lyrics_toggle = true;
			dynamic_lyrics_starting_times = arr["dynamic_lyrics_starting_times"];
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
	player.canPlay = false;
	//dynamic_lyrics_ending_times = null;
	current_time_index = -1;
	current_time = "-3599999";
	player.start_padding = 0;
	player.end_padding = 3599999;
	player.embed.attr("src", "");
}



function prepareAudio(arr) {
	$(player.audio).attr("src", arr["url"]);
	player.duration.html(arr["duration"]);
	loadAudio(arr["id"], arr["url"], arr["lyrics"]);
	if (milliseconds($(player.audio).prop("currentTime")) < player.start_padding ) $(player.audio).prop("currentTime", revertFromMilliseconds(player.start_padding));
	player.time_slider.attr("max", player.end_padding);
    player.time_slider.val(milliseconds($(player.audio).prop("currentTime")));
    player.time_slider.val(player.start_padding);
}

function abortAudio(id) {
	pauseAudio();
	$(player.audio).bind('abort');
	$(player.audio).trigger('abort');
	paused = true;
}

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

function loadAudio(id, url, lyrics){
	// Forces audio to load into the player, as well as make the time slider for the song appear - used usually prior to starting a song
	$(player.audio).bind("load");
	$(player.audio).trigger('load');
	player.audio.oncanplay = function() {
    	if (!player.canPlay) {
    		player.lyrics.html("");
			player.lyrics.html(lyrics);
	    	lyricsHeight = player.lyrics.height();
			player.canPlay = true;
			
    	}
    }
    /*
    var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';
	// Decode asynchronously
	request.onload = function() {
		context.decodeAudioData(request.response, function(buffer) {
			setSource(buffer);
			startAudio(0);
			trackCurrentTime.call(source);
		});
		//playSim(dogBarkingBuffer);
	}
  	request.send();
  	*/
}

function trackCurrentTime() {
	console.log(this.currentTime);
}

function setSource(buffer) {
	source = context.createBufferSource(); // creates a sound source
	source.buffer = buffer;                    // tell the source which sound to play
	source.connect(context.destination);       // connect the source to the context's destination (the speakers)
}

function startAudio(time){
	// Starts the audio, also causes the pause button to appear and the start button to disappear
	$(player.audio).trigger('play');
	//source.start(time);   
	if (paused) {
		player.play.addClass("hiddenControl");
		player.pause.removeClass("hiddenControl");
		paused = false;
	}
}

function pauseAudio(){
	// Opposite of startAudio()
	//var now = source.currentTime;
	//source.stop(now);
	console.log("Pausing Audio");
	$(player.audio).trigger('pause');
	player.pause.addClass("hiddenControl");
	player.play.removeClass("hiddenControl");
	paused = true;
}

function forwardAudio(){
	// Causes the song to advance by 5 seconds, also adjusts the time slider appropriately
	pauseAudio();
	$(player.audio).prop("currentTime", $(player.audio).prop("currentTime")+5);
	player.time_slider.val( milliseconds($(player.audio).prop("currentTime")) );
	current_time_index = -1;
	current_time = "-3599999";
	if (milliseconds($(player.audio).prop("currentTime")) > player.end_padding) nextAudio();
	else startAudio();
}

function backwardAudio(){
	// Same as forwardAudio(), except moves back 5 seconds
	pauseAudio();
	$(player.audio).prop("currentTime",$(player.audio).prop("currentTime")-5);
	player.time_slider.val( milliseconds($(player.audio).prop("currentTime")) );
	current_time_index = -1;
	current_time = "-3599999";
	if (milliseconds($(player.audio).prop("currentTime")) < player.start_padding) previousAudio();
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
		$(player.audio).prop("currentTime", revertFromMilliseconds(player.start_padding));
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
		startAudio();
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
		startAudio();
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
    $(player.audio).prop("currentTime", revertFromMilliseconds(time));
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
    $(player.audio).prop("volume",vol);
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



function startEdit(id) {
	editForm.form[0].reset();
	var data = "id="+id;
	$.ajax({
		url: "scripts/getMediaInfoForEdit.php", 
		data: data, 
		type: 'POST', 
		dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (response.success) {
				editForm.title.val(response.info.title);
				editForm.songId.val(response.info.id);
				editForm.medium.val(response.info.medium);
				editForm.artist.val(response.info.artist);
				editForm.album.val(response.info.album_name);
				editForm.album_artist.val(response.info.album_artist_name);
				editForm.composer.val(response.info.composer);
				if (response.info.medium == 1) {
					editForm.art_display.addClass("hidden");
					editForm.art.addClass("hidden");
					editForm.art_edit.addClass("hidden");
					editForm.padding_container.addClass("hidden");
					editForm.lyrics.text(response.info.url);
					editForm.lyrics_label.text("URL");
					editForm.lyrics_types.addClass("hidden");
				} else {
					editForm.art_display.removeClass("hidden");
					editForm.art.removeClass("hidden");
					editForm.art_edit.removeClass("hidden");
					if (response.info.art != null) editForm.art_display.attr("src", response.info.art +"#"+ new Date().getTime());
					editForm.padding_container.removeClass("hidden");
					editForm.start_padding.val(response.info.start_padding);
					editForm.end_padding.val(response.info.end_padding);
					editForm.lyrics_label.text("Lyrics");
					editForm.lyrics_types.removeClass("hidden");
					editForm.lyrics.text(response.info.lyrics);
					editForm.dynamic_lyrics_radio.removeClass("hidden");
					editForm.simple_lyrics_radio.removeClass("hidden");
					if (response.info.dynamic_lyrics == 1) editForm.dynamic_lyrics_radio.attr("checked","checked");
					else editForm.simple_lyrics_radio.attr("checked","checked");
				}
				openEdit();
			} 
			else alert(response.message);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('ERRORS @ Opening Media For Edit: ' + errorThrown);
		}
	});
}
function openEdit() {
	editForm.form.addClass("opened");
	editForm.close.addClass("opened");
	player.container.addClass("shortened");
	editForm.status = true;
}
function closeEdit() {
	editForm.form.removeClass("opened");
	editForm.close.removeClass("opened");
	player.container.removeClass("shortened");
	editForm.status = false;
	iconEdit = null
	iconEditSet = 0;
}

function editIcon(event) {
	event.stopPropagation(); // Stop stuff happening
	event.preventDefault(); // Totally stop stuff happening

	// Create a formdata object and add the files
	var data = new FormData();
	$.each(iconEdit, function(key, value) {
    	data.append(key, value);
	});

	console.log(iconEditSet);-

	//Time for the ajax function
    	$.ajax({
        	url: "scripts/mediaEdit.php?icon=1&change="+iconEditSet+"&id="+editForm.songId.val(),	// ?files ensures that the "$_GET" in song_icon_upload.php runs properly
        	type: 'POST',
        	data: data,
        	cache: false,
        	dataType: 'json',
        	processData: false, 	// Don't process the files - in other words, don't turn the icons into strings
        	contentType: false, 	// Set content type to false as jQuery will tell the server its a query string request
        	success: function(response, textStatus, jqXHR) {
        		if (response.success) submitEdit(event, editForm.songId.val());
        		else alert("Error on Editing Media:\n" + response.message);
        	},
        	error: function(jqXHR, textStatus, errorThrown) {
            	// Handle errors here
            	alert('AJAX Error on Editing Media Icon:\n' + textStatus);
            	
            	// STOP LOADING SPINNER if I had one
        	}
    	});
}

function submitEdit(event, id, reload = 0, close = false, deleted = false) {
  	// Create a jQuery object from the form
   	var formData = editForm.form.serialize();

	$.ajax({
		url: 'scripts/mediaEdit.php?song=1&edit='+id+'&reload='+reload,
		type: 'POST',
		data: formData,
		cache: false,
		dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (response.success) {
				if (close) closeEdit();
				var flag = false;
				if (id == currentSong) {
					if (reload == 1) resetPlayer();
					else flag = true;
				}
				getAllMedia(flag, true, id, deleted);
			} 
			else alert('Error on Editing Media:\n' + textStatus);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			// Handle errors here
			alert('AJAX Error on Editing Media:\n' + textStatus);
		},
		complete: function() {
			// STOP LOADING SPINNER
		}
	});
}




function openEmbed() {
	embedForm.form.find("input[type=text], input[type=url]").val("");
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
	event.stopPropagation(); // Stop stuff happening
	event.preventDefault(); // Totally stop stuff happening

	var data = embedForm.form.serialize();

	$.ajax({
		url: 'scripts/embedInput.php?input=1',
		type: 'POST',
		data: data,
		dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (response.success) {
				console.log(response.info);
				closeEmbed();
				getAllMedia(false, true, response.info.id);
			} 
			else alert('Error on Inputting Embed Video:\n' + response.message);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			// Handle errors here
			alert('AJAX Error on Inputting Embed Video:\n' + textStatus);
		},
		complete: function() {
			// STOP LOADING SPINNER
		}
	});
}


function search(text, option) {
	search_matches = [];
	var options_check = ["title", "artist", "album", "album_artist"];
	if ( options_check.indexOf(option) == -1 ) {
		alert("Option \""+option+"\" isn't supported in our search algorithm.");
		return false;
	}
	for (var id in database) {
		if ( database[id][option].toLowerCase().includes(text.toLowerCase()) ) {
			search_matches.push(id);
		}
	}
	if (search_matches.length > 0) {
		return true;
	} else {
		alert("No matches found");
		return false;
	}
}

$(document).ready(function() {
	player = {
		container: $("#media_container"),
		music: $("#player_container"),
		video: $("#video_container"),
		embed: $("#video_embed"),
		//audio: $("#audio"),
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
		shuffle: $("#shuffle"),
		edit: $("#options"),
		autoscroll: $("#player_lyrics_autoscroll"),
		start_padding: 0, 
		end_padding: 3599999,
		canPlay: false
	};

	editForm = {
		status: false,
		close: $("#closeEdit"),
		form: $("#edit_media_form"),
		songId: $("#id_edit"),
		medium: $("#medium_edit"),
		title: $("#title_edit"),
		artist: $("#artist_edit"),
		art_display: $("#art_edit_display"),
		art_edit: $("#art_edit_overlay"),
		art: $("#art_edit"),
		album: $("#album_edit"),
		album_artist: $("#albumArtist_edit"),
		composer: $("#composer_edit"),
		padding_container: $("#song_edit_padding_container"),
		start_padding: $("#start_padding_edit"),
		end_padding: $("#end_padding_edit"),
		lyrics_label: $("#song_edit_lyrics_label"),
		lyrics_types: $("#song_edit_lyrics_type_container"),
		simple_lyrics_radio: $("#lyric_dynamic_false"),
		lyrics: $("#lyrics_edit"),
		dynamic_lyrics_radio: $("#lyric_dynamic_true"),
		dynamic_lyrics: $("#dynamic_lyrics_edit_container"),
		submit: $("#submit_edit")
	}

	embedForm = {
		status: false,
		open: $("#openEmbed"),
		close: $("#closeEmbed"),
		form: $("#video_input_form"),
		title: $("#video_title_input"),
		artist: $("#video_artist_input"),
		album: $("#video_album_input"),
		album_artist: $("#video_album_artist_input"),
		composer: $("#video_composer_input"),
		url: $("#video_url_input"),
		submit: $("#video_input_form_submit")
	}

	var loopStages = ["assets/repeat_0.png", "assets/repeat_1.png", "assets/repeat_all.png"];
	var shuffleStages = ["assets/shuffle_0.png", "assets/shuffle_1.png"];

	getAllMedia(false, false, -1);
	volumeAdjust(player.volume.val());

	$(document).on("click", ".song", function() {
		$("#left_content").find(".selected").removeClass("selected");
		$("#left_content").find(".searched").removeClass("searched");
		$(this).addClass("selected");
		var id = $(this).attr("data-id");
		var medium = $(this).attr("data-medium");
		console.log(id);
		openMedia(id, true);
		if (medium == 0) {
			$(player.audio).trigger('play');  
			if (paused) {
				player.play.addClass("hiddenControl");
				player.pause.removeClass("hiddenControl");
				paused = false;
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


	embedForm.open.on("click", openEmbed);
	embedForm.close.on("click", closeEmbed);
	embedForm.form.on("submit", submitEmbed);


	editForm.art.on('change', prepareIconEdit);
	// Grab the files and set them to our variable
	function prepareIconEdit(event) {
		iconEdit = event.target.files;
		iconEditSet = 1;

		// script to change display image
		var url = event.target.value;
    	var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
    	if (event.target.files && event.target.files[0] && (ext == "PNG" || ext == "png" || ext == "jpeg" || ext == "jpg" || ext == "JPEG" || ext == "JPG")) {
	        var reader = new FileReader();
	        reader.onload = function (e) {
	            editForm.art_display.attr('src', e.target.result);
	        }
	        reader.readAsDataURL(event.target.files[0]);
	    } 
	    else editForm.art_display.attr('src', 'assets/default_album_art.jpg');
	    
	}
	editForm.form.on("submit", editIcon);
	editForm.close.on("click", closeEdit);

	player.edit.on("click", function() {
		if (!editForm.status) startEdit(currentSong);
		else {
			var curId = editForm.songId.val();
			if (curId != currentSong) startEdit(currentSong);
			else closeEdit();
		}
	});

	$("#delete_song_submit").on("click", function() {
		submitEdit(null, editForm.songId.val(), 1, true, true);
	})


	$("#addMedia_input").on("change", mediaAdd);
	function mediaAdd(event) {
		// Create a formdata object and add the files
		var data = new FormData();
		$.each(event.target.files, function(key, value) {
	    	data.append(key, value);
		});

		//Time for the ajax function
    	$.ajax({
        	url: "scripts/mediaAdd.php",
        	type: 'POST',
        	data: data,
        	cache: false,
        	dataType: 'json',
        	processData: false, 	// Don't process the files - in other words, don't turn the icons into strings
        	contentType: false, 	// Set content type to false as jQuery will tell the server its a query string request
        	success: function(response, textStatus, jqXHR) {
        		if (response.success) getAllMedia();
        		else alert(response.message);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				// Handle errors here
				alert('ERRORS: ' + textStatus);
	
				// STOP LOADING SPINNER if I had one
			}
		});
	}


	player.time_slider.on("input", function() { 
		timeAdjust( $(this).val() );
	});	// Moving the slider adjusts the audio's time
	player.volume.on( "input", function() { volumeAdjust($(this).val()); 	});
	$(player.audio).on("ended", nextAudio);
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

	$(document).on("click", ".addAlbumArt_label", function() {
		addAlbumArt_id = $(this).attr("data-id");
		console.log(addAlbumArt_id);
	});
	$("#addAlbumArt_input").on("change", addAlbumArt);
	function addAlbumArt(event) {
		// Create a formdata object and add the files
		var data = new FormData();
		$.each(event.target.files, function(key, value) {
	    	data.append(key, value);
		});

		console.log(data);

		//Time for the ajax function
    	$.ajax({
        	url: "scripts/updateAlbumArt.php?album_id="+addAlbumArt_id,
        	type: 'POST',
        	data: data,
        	cache: false,
        	dataType: 'json',
        	processData: false, 	// Don't process the files - in other words, don't turn the icons into strings
        	contentType: false, 	// Set content type to false as jQuery will tell the server its a query string request
        	success: function(response, textStatus, jqXHR) {
        		if (response.success) {
        			addAlbumArt_id = -1;
        			getAllMedia();
        		}
        		else alert(response.message);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				// Handle errors here
				alert('ERRORS: ' + textStatus);
	
				// STOP LOADING SPINNER if I had one
			}
		});
	}

	search_element = document.getElementById('search_input');
	search_options_element = document.getElementById('search_options');
	search_element.addEventListener('keypress', function(e){
  		if (e.keyCode == 13) {
  			if ( searching_boolean ) {
  				searching_boolean = false;
  				search_text = search_element.value;
	  			search_option = search_options_element.value;
	  			if ( !search(search_text, search_option) ) {
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
  		} else {
  			searching_boolean = true;
  		}
	});
	search_options_element.addEventListener('change', function(e){
		searching_boolean = true;
	});
});



