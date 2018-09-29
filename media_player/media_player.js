// -------------------------------------------------------------------------
/* Variables */
// -------------------------------------------------------------------------
var content = {};	// All other content
var player = {};	// contains references to all audio player-related HTML elements
var video = {};		// contains references to all video player-related HTML elements

var queue = [];			// Array that stores the queue of songs
var shuffle = [];		
var curPosition = null;
var shuffleCurPosition = null;
var database = null;
var albums = null;
var playlists = null;
var currentSong = 0;	// Sets the current song - used to keep track of when audio repeats and play count in database - default = 0, aka no song
var currentAlbum = 0;
var currentType = null;

var repeat = 0;			// variable that tracks if songs should be looped or not - default is that songs AREN'T looped
var shuffleToggle = 0;
var paused = true;		// checks the current status of the player, if the song is paused or not


// -------------------------------------------------------------------------
/* Time Functions - Used to update the current time on the audio and video time */
// -------------------------------------------------------------------------
function readableDuration(seconds) {
    // Get the duration or current time of a song in minutes:seconds instead of just seconds
    sec = Math.floor( seconds );    
	min = Math.floor( sec / 60 );
	min = min >= 10 ? min : '0' + min;    
	sec = Math.floor( sec % 60 );
	sec = sec >= 10 ? sec : '0' + sec;    
	return min + ':' + sec;
}

function onTimeUpdate(track) {
	var curSeconds = Math.floor(track.currentTime);
	var curTime = readableDuration(track.currentTime);
	//var duration = readableDuration(track.duration);
	player.curTime.text(curTime);
	//player.duration.text(duration);
	player.time_slider.attr("max", track.duration);
	player.time_slider.val(track.currentTime);
}

function onTimeUpdateVideo(track) {
	var curSeconds = Math.floor(track.currentTime);
	var curTime = readableDuration(track.currentTime);
	//var duration = readableDuration(track.duration);
	video.curTime.text(curTime);
	//video.duration.text(duration);
	video.time_slider.attr("max", track.duration);
	video.time_slider.val(track.currentTime);
}

// -------------------------------------------------------------------------
/* Miscellaneous Functions */
// -------------------------------------------------------------------------
window.addEventListener('keydown', function(e) {
	if(e.keyCode == 32 && e.target == document.body) {
		e.preventDefault();
		if (paused) {	startAudio();	} 
		else {	pauseAudio();	}
	}
});


// -------------------------------------------------------------------------
/* Database Management & Song Printing */
// -------------------------------------------------------------------------
function updateMedia() {
	content.update_message.fadeIn(100).text("Updating...");
	$.ajax({
		url: content.path_to_media_files+"prepUpdate.php?prep", type: 'GET', dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (response.Success) {
				var totalSongs = response.Size;
				for (var i = 0; i < response.Size; i++) {	updatePart(i, totalSongs);	}
				saveMedia();
			}
		}, 
		error: function(jqXHR, textStatus, errorThrown) {
			// Handle errors here
			content.update_message.text("Error during update!");
			setTimeout(function() { content.update_message.fadeOut(200); }, 1000);
			console.log('ERRORS: ' + errorThrown);
		}
	});
}

function updatePart(song_id, total) {
	var data = "id="+song_id;
	$.ajax({
		url: content.path_to_media_files+"updateMedia.php", data: data, type: 'POST', dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			var curStatus = song_id / total;
			curStatus = Math.floor(100 * curStatus);
			content.update_progress.text(curStatus + "%");
			//getImageArt(song_id);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			// Handle errors here
			console.log('ERRORS: ' + errorThrown);
			content.update_message.text("Error during update!");
			setTimeout(function() { content.update_message.fadeOut(200); }, 1000);
			return false;
		}
	});
}

function getImageArt(id) {
	var data = "id="+id;
	$.ajax({
		url: content.path_to_media_files+"getImageArt.php?get", data: data, type: 'POST', dataType: 'html',
		success: function(response, textStatus, jqXHR) {
			//console.log(response);
			//saveImageArt(id);
			if ( response && response != "data:;charset=utf-8;base64," ) {
				player.art.attr("src", response);
				player.background.attr("src", response);
			} else {
				player.art.attr("src", "media_player/assets/default_album_art.jpg");
				player.background.attr("src", "media_player/assets/default_album_art.jpg");
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {	console.log('ERRORS: ' + errorThrown);	}
	});
}
/*
function saveImageArt(id) {
	var data="id="+id;
	$.ajax({
		url: content.path_to_media_files+"getImageArt.php?save", data: data, type: 'POST', dataType: 'html',
		success: function(response, textStatus, jqXHR) {
			console.log("Successful Image Data Get");
			/*
			if ( response && response != "data:;charset=utf-8;base64," ) {
				player.art.attr("src", response);
				player.background.attr("src", response);
			} else {
				player.art.attr("src", "media_player/assets/default_album_art.jpg");
				player.background.attr("src", "media_player/assets/default_album_art.jpg");
			}
			*/
			/*
		},
		error: function(jqXHR, textStatus, errorThrown) {	console.log('ERRORS: ' + errorThrown);	}
	});
}
*/

function saveMedia() {
	$.ajax({
		url: content.path_to_media_files+"prepUpdate.php?save", type: 'GET', dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (response.Success) {
				console.log("Database has been updated");
				content.update_progress.empty();
				content.update_message.text("Update Successful");
				setTimeout(function() { content.update_message.fadeOut(200); }, 1000);
				updateJSMedia(response);
				printMedia();
			} else {
				alert("Error updating database!");
			}
		}, 
		error: function(jqXHR, textStatus, errorThrown) {
			// Handle errors here
			console.log('ERRORS: ' + errorThrown);
			content.update_message.text("Error during update!")
			setTimeout(function() { content.update_message.fadeOut(200); }, 1000);
		}
	});
}


function updateJSMedia(response) {
	database = response.Database;
	albums = response.Albums;
	console.log("Database:");
	console.log(database);
	console.log("Albums:");
	console.log(albums);
}

function createMedia() {
	$.ajax({
		url: content.path_to_media_files+"getDatabase.php?get", type: 'GET', dataType: 'json',
		success: function(response, textStatus, jqXHR) {
			if (response.Success) {
				updateJSMedia(response);
				printMedia();
			} else {
				alert("Cannot create Media");
			}
		}, 
		error: function(jqXHR, textStatus, errorThrown) {
			// Handle errors here
			content.update_message.text("Error during update!");
			setTimeout(function() { content.update_message.fadeOut(200); }, 1000);
			console.log('ERRORS: ' + errorThrown);
		}
	});
}

function printMedia() {
	content.songs_list.empty();
	content.movies_list.empty();
	content.playlists_list.empty();
	$.each(albums, function(album_type, album_list) {
		if (album_type == "audio" || album_type == "movie") {
			$.each(album_list, function(album_key, album) {
				if (album_type == "audio") {
					content.songs_list.append("<div class=\"album\" data-id=\""+album.id+"\"><h2 class=\"album_title\">"+album.name+"</h2><div class=\"songs\"></div></div>");
				} else if ( album_type == "movie") {
					content.movies_list.append("<div class=\"album\" data-id=\""+album.id+"\"><h2 class=\"album_title\">"+album.name+"</h2><div class=\"songs\"></div></div>");
				}
			});
		} else {
			if (album_list.length == 0 ) {
				content.playlists_list.append("<h2 id=\"playlists_default\">You have no playlists...</h2>");
			} else {
				$.each(album_list, function(album_key, album) {
					content.playlists_list.append("<div class=\"album\" data-id=\""+album.id+"\"><h2 class=\"album_title\">"+album.name+"</h2><div class=\"songs\"></div></div>");
					var thisPlaylist = content.playlists_list.find(".album[data-id=\""+album.id+"\"] .songs");
					for(var key = 0; key < album["list"].length; key++) {
						thisPlaylist.append("<div class=\"song\" data-id=\""+album["list"][key]+"\" data-type=\""+database[album["list"][key]]["type"]+"\" data-url=\""+database[album["list"][key]]["url"]+"\" data-album=\""+album["id"]+"\" data-albumType=\"playlist\"><div class=\"song_text\"><span class=\"song_title\">"+database[album["list"][key]]["title"]+"</span><span class=\"song_artist\">"+database[album["list"][key]]["artist"]+"</span></div></div>");
					}
				});

			}
		}
	});
	$.each(database, function(song_id, song) {
		var album_cat = song.album;
		var album_div;
		if (song.type == "audio") {
			album_div = content.songs_list.find(".album[data-id=\""+album_cat+"\"] .songs");
			album_div.append("<div class=\"song\" data-id=\""+song_id+"\" data-type=\""+song.type+"\" data-url=\""+song.url+"\" data-album=\""+song.album+"\" data-albumType=\"audio\"><div class=\"song_text\"><span class=\"song_title\">"+song.title+"</span><span class=\"song_artist\">"+song.artist+"</span></div></div>");
		} else if (song.type == "movie") {
			album_div = content.movies_list.find(".album[data-id=\""+album_cat+"\"] .songs");
			album_div.append("<div class=\"song\" data-id=\""+song_id+"\" data-type=\""+song.type+"\" data-url=\""+song.url+"\" data-album=\""+song.album+"\" data-albumType=\"movie\"><div class=\"song_text\"><span class=\"song_title\">"+song.title+"</span><span class=\"song_artist\">"+song.artist+"</span></div></div>");
		}
	});
}


// -------------------------------------------------------------------------
/* Audio Functions - functions used to manage the audio player */
// -------------------------------------------------------------------------
function prepareAudio(id) {
	player.audio.attr("src", database[id]["url"]);
	//player.art.attr("src", database[id]["image"]);
	//player.background.attr("src", database[id]["image"]);
	getImageArt(id);
	player.title.html(database[id]["title"]);
	player.artist.html(database[id]["artist"]);
	player.lyrics.html(database[id]["lyrics"]);
	player.duration.html(database[id]["duration"]);
    loadAudio(id);
    player.time_slider.val(player.audio.prop("currentTime"));
    startAudio();
}

function loadAudio(id){
	// Forces audio to load into the player, as well as make the time slider for the song appear - used usually prior to starting a song
	currentSong = id;
	player.audio.bind("load");
	player.audio.trigger('load');
}

function startAudio(){
	// Starts the audio, also causes the pause button to appear and the start button to disappear
	player.audio.trigger('play');
	player.play.hide();
	player.pause.show();
	paused = false;
}

function pauseAudio(){
	// Opposite of startAudio()
	player.audio.trigger('pause');
	player.pause.hide();
	player.play.show();
	paused = true;
}

function forwardAudio(){
	// Causes the song to advance by 5 seconds, also adjusts the time slider appropriately
	pauseAudio();
	player.audio.prop("currentTime", player.audio.prop("currentTime")+5);
	player.time_slider.val(player.audio.prop("currentTime"));
	startAudio();
}

function backAudio(){
	// Same as forwardAudio(), except moves back 5 seconds
	pauseAudio();
	player.audio.prop("currentTime",player.audio.prop("currentTime")-5);
	player.time_slider.val(player.audio.prop("currentTime"));
	startAudio();
}

function nextAudio() {
	if (shuffleToggle == 0) {
		if (queue.length > 0) {
			curPosition++;
			if(curPosition == queue.length) {	curPosition = 0;	}
			currentSong = queue[curPosition];
			prepareAudio(currentSong);
		}
	} else {
		if (shuffle.length > 0) {
			shuffleCurPosition++;
			if(shuffleCurPosition == shuffle.length) {	shuffleCurPosition = 0;	}
			currentSong = shuffle[shuffleCurPosition];
			prepareAudio(currentSong);
		}
	}
}

function previousAudio() {
	if (shuffleToggle == 0) {
		if (queue.length > 0) {
			curPosition = curPosition - 1;
			if(curPosition == -1) {	curPosition = queue.length - 1;	}
			currentSong = queue[curPosition];
			prepareAudio(currentSong);
    	}
	} else {
		if (shuffle.length > 0) {
			shuffleCurPosition = shuffleCurPosition - 1;
			if(shuffleCurPosition == -1) {	shuffleCurPosition = shuffle.length - 1;	}
			currentSong = queue[shuffleCurPosition];
			prepareAudio(currentSong);
		}
	}
}

function timeAdjust(time) {
    // Adjusts the current time of the audio - works in tandem with other functions, isn't called simply by clicking on an element
	pauseAudio();
    player.audio.prop("currentTime", time);
	startAudio();
}

function volumeAdjust(volume) {
	player.volume.val(volume);
	// Based on the position of the volume slider, the volume of the player and the volume icon will change
	if (volume == 0) {	player.volume_image.attr("src", "assets/mute.png");	}
	else if (volume < 33) {	player.volume_image.attr("src", "assets/volume_1.png");	} 
	else if (volume < 66) {	player.volume_image.attr("src", "assets/volume_2.png");	}
	else {	player.volume_image.attr("src", "assets/volume_3.png");	}
	var vol = volume/100;
    player.audio.prop("volume",vol);
}

function setLoop() {
	// Clicking the Loop button either loops or unloops the audio
	if (repeat == 0) {	player.repeat.attr("src", "assets/repeat_1.png");	} 
	else if (repeat == 1) { 	player.repeat.attr("src", "assets/repeat_all.png");	} 
	else {	player.repeat.attr("src", "assets/repeat_0.png");	}
	repeat++;
	if (repeat == 3) {	repeat = 0;	}
	updateLoop();
	setShuffle();
}


function updateLoop() {
	var id = currentSong;
	var album = currentAlbum;
	var type = currentType; 
	queue = [];
	if (repeat == 1) {
		// Looping through only one song
		queue.push(id);
		curPosition = 0;
	}
	else if (repeat == 2) {
		//looping through album
		var foundAlbum = -1;
		for (var j = 0; j < albums[type].length; j++) {
			if (album == albums[type][j]["id"]) {
				foundAlbum = j;
			}
		}
		if (foundAlbum == -1) {
			alert("Loop Not Created - Cannot Find Song's Album");
		} else {
			queue = new Array(albums[type][foundAlbum]["list"].length);
			for (var i = 0; i < albums[type][foundAlbum]["list"].length; i++) {
				queue[i] = albums[type][foundAlbum]["list"][i];
				if (albums[type][foundAlbum]["list"][i] == id) {
			  		curPosition = i;
				}
			}
		}
	}
	console.log("New Queue:");
	console.log(queue);
}

function setShuffle() {
    shuffle = [];
	if (shuffleToggle == 1) {
	// If shuffleToggle = 1, then we NEED to create a shuffle queue
		if (repeat > 0) {
			// If we already have the queue data, we just use that data;
			// this is because the queue can be either the whole album or just the one song
			for (var i = 0; i < queue.length; i++) {
			  shuffle[i] = queue[i];
			}
		} else {
			// In the scenario that the queue is empty or because repeat is off, we default the shuffle queue to be the album.. or the whole database
			for (var i = 0; i < database.length; i++) {
				shuffle[i] = i;
			}
    	}
		var i = 0, j = 0, temp = null;
		for (i = shuffle.length - 1; i > 0; i -= 1) {
		    j = Math.floor(Math.random() * (i + 1));
			temp = shuffle[i];
		    shuffle[i] = shuffle[j];
		    shuffle[j] = temp;
		}
		shuffle.forEach(function(id,pos) {
			if (id == currentSong) {
				shuffleCurPosition = pos;
			}
		});
   	}
   	console.log("New Shuffle Queue:");
	console.log(shuffle)		
}


// -------------------------------------------------------------------------
/* Video Functions - Functions used to manage the video player */
// -------------------------------------------------------------------------
function prepareVideo(id, album) {
	video.video.attr("src", database[id]["url"]);
	video.title.html(database[id]["title"]);
	video.artist.html(database[id]["artist"]);
	video.duration.html(database[id]["duration"]);
	var thisVolume = video.volume.val();
	if (thisVolume == 0) {	video.volume_image.attr("src", "assets/mute_white.png");	}  
	else {	video.volume_image.attr("src", "assets/volume_3_white.png");	}
	loadVideo(id);
	startVideo();
}

function loadVideo(id){
	video.video.bind("load");
	video.video.trigger('load');
}

function startVideo(){
	// Starts the audio, also causes the pause button to appear and the start button to disappear
	video.video.trigger('play');
	video.play.hide();
	video.pause.show();
}

function pauseVideo(){
	// Opposite of startAudio()
	video.video.trigger('pause');
	video.pause.hide();
	video.play.show();
}

function videoTimeAdjust(time) {
	// Adjusts the current time of the audio - works in tandem with other functions, isn't called simply by clicking on an element
	pauseVideo();
	video.video.prop("currentTime", time);
	startVideo();
}

function forwardVideo(){
	// Causes the song to advance by 5 seconds, also adjusts the time slider appropriately
	pauseVideo();
	video.video.prop("currentTime", video.video.prop("currentTime")+15);
	video.time_slider.val(video.video.prop("currentTime"));
	startVideo();
}

function backVideo(){
	// Same as forwardAudio(), except moves back 5 seconds
	pauseVideo();
	video.video.prop("currentTime",video.video.prop("currentTime")-15);
	video.time_slider.val(video.video.prop("currentTime"));
	startVideo();
}

function videoVolumeAdjust(volume) {
	video.volume.val(volume);
	// Based on the position of the volume slider, the volume of the player and the volume icon will change
	if (volume == 0) {	video.volume_image.attr("src", "assets/mute_white.png");	}
	else {	video.volume_image.attr("src", "assets/volume_3_white.png");	}
	var vol = volume/100;
	video.video.prop("volume",vol);
}



function createPlaylist() {

}



$(document).ready(function() {
	/* Player Designations */
	// -------------------------------- //
	player.background = $("#player #player_background");    			// Background image of player
	player.art= $("#player #player_art");                   			// Album Art of song displayed on player

	player.audio = $("#player #audio");                     			// The <audio> element in the player

	player.title = $("#player #player_title");              			// The title of the song, displayed on the player
	player.artist = $("#player #player_artist");            			// The artist of the song, displayed on the player

	player.time_slider = $("#player #time_slider");         			// The slider used as the audio slider
	player.curTime = $("#player #curTime");                 			// The display for the current time of the song
	player.duration = $("#player #duration");               			// The display for the duration of the song

	player.play = $("#player #play");                       			// The play button in the player
	player.pause = $("#player #pause");                     			// The pause button in the player
	player.forward = $("#player #forwardFive");             			// The forward 5sec button in the player
	player.back = $("#player #backFive");                   			// The backward 5sec button in the player
	player.previous = $("#player #previous");               			// The previous-song button in the player
	player.next = $("#player #next");                       			// The next-song button in the player

	player.repeat = $("#player #repeat");                   			// The repeat button in the player
	player.shuffle = $("#player #shuffle");                 			// The shuffle button in the player
	player.volume = $("#player #volume");                   			// The volume slider in the player
	player.volume_image = $("#player #volume_image");       			// The image as the display for the volume slider

	player.lyrics = $("#player #player_lyrics");            			// The container where lyrics are put in the player
	// -------------------------------- //

	/* Video Player Designations */
	// -------------------------------- //
  
	video.container = $("#video_container");                            // The container for the video and its functions
	video.video = video.container.find("#video");                       // The <video> tag itself
	video.background = video.container.find("#video_background");       // The background darkened screen behind the player

	video.title = video.container.find("#video_title");                 // The title of the video
	video.artist = video.container.find("#video_artist");               // The artist of the video, if they exist

	video.curTime = video.container.find("#video_curTime");             // The current time of the video
	video.duration = video.container.find("#video_duration");           // The duration of the video
	video.time_slider = video.container.find("#video_slider");          // The time slider for the video

	video.play = video.container.find("#video_play");                   // The play button for the video
	video.pause = video.container.find("#video_pause");                 // The pause button for the video
	video.back = video.container.find("#video_back");                   // The back 15sec button for the video
	video.forward = video.container.find("#video_forward");             // The forward 15sec button for the video
	video.volume = video.container.find("#video_volume");               // The volume slider for the video
	video.volume_image = video.container.find("#video_volume_image");   // The image corresponding to the volume slider
	video.fullscreen = video.container.find("#video_full");             // The icon used to toggle fullscreen
	// -------------------------------- //

	/* Content Designations */
	// -------------------------------- //
	content.songs_button = $("#songs_button");				// nav button to open songs list
	content.movies_button = $("#movies_button");			// nav button to open movies list
	content.playlists_button = $("#playlists_button");
	content.update_message = $("#update_message");			// nav display, shows update message, uses both reboot and update
	content.update_progress = $("#update_progress");		// nav display, shows reboot/update progress
	content.reboot_button = $("#reboot_button");			// nav button, reboots database

	content.path_to_media_files = "media_player/";			// path to this file

	content.songs_list = $("#media #songs_list");			// songs list
	content.movies_list = $("#media #movies_list");			// movies list
	content.playlists_list = $("#media #playlists_list");	// playlists list

	content.create_playlist_button = $("#create_playlist");			// button in nav to create playlists
	content.create_playlist_songs = $("#create_playlist_songs");	// container for songs list
	content.create_playlist = $("#create_playlist_container");		// create a playlist container
	content.exit_create_playlist = $("#exit_create_playlist");		// button to exit playlist creation
	content.create_playlist_form = $("#create_playlist_form");
	// -------------------------------- //

	content.reboot_button.on("click", updateMedia);
	content.songs_button.on("click", function(){
    	$(this).addClass("opened_nav");
    	content.movies_button.removeClass("opened_nav");
    	content.playlists_button.removeClass("opened_nav");
    	content.movies_list.hide();
    	content.playlists_list.hide();
    	content.songs_list.show();
    });
    content.movies_button.on("click", function() {
    	$(this).addClass("opened_nav");
    	content.songs_button.removeClass("opened_nav");
    	content.playlists_button.removeClass("opened_nav");
    	content.songs_list.hide();
    	content.playlists_list.hide();
    	content.movies_list.show();
    });
    content.playlists_button.on("click", function() {
    	$(this).addClass("opened_nav");
    	content.songs_button.removeClass("opened_nav");
    	content.movies_button.removeClass("opened_nav");
    	content.songs_list.hide();
    	content.movies_list.hide();
    	content.playlists_list.show();
    });

    content.create_playlist_button.on("click", function() {
    	content.create_playlist_songs.empty();
    	content.create_playlist_form.find("#create_playlist_name").val("");
    	content.create_playlist_form.find("#create_playlist_description").val("");
    	$.each(albums["audio"], function(album_key, album) {
			content.create_playlist_songs.append("<div class=\"album\" data-id=\""+album.id+"\"><h2 class=\"album_title\">"+album.name+"</h2><div class=\"songs\"></div></div>");
		});
		$.each(database, function(song_id, song) {
			var album_cat = song.album;
			var album_div;
			if (song.type == "audio") {
				album_div = content.create_playlist_songs.find(".album[data-id=\""+album_cat+"\"] .songs");
				album_div.append("<div class=\"song\"><input class=\"checkbox\" type=\"checkbox\" name=\"create_playlist_song_selected[]\" value=\""+song_id+"\"><span class=\"song_title\">"+song.title+"</span><span> | </span><span class=\"song_artist\">"+song.artist+"</span></div>");
			}
		});
    	content.create_playlist.show();
    });
    content.exit_create_playlist.on("click", function() {
    	content.create_playlist.hide();
    });


	content.create_playlist_form.on("submit", function(event) {
		event.preventDefault();
		var formData = $(this).serialize();
		$.ajax({
			url: content.path_to_media_files+"createPlaylist.php?get",
			type: 'POST',
			data: formData,
			dataType: 'json',
			success: function(response, textStatus, jqXHR) {
				content.create_playlist.hide();
				createMedia();
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log('ERRORS: ' + errorThrown);
			}
		});
	})


});