var content = {};
var player = {};
var video = {};

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
	var duration = readableDuration(track.duration);
	player.curTime.text(curTime);
	player.duration.text(duration);
	player.time_slider.attr("max", track.duration);
	player.time_slider.val(track.currentTime);
}

function onTimeUpdateVideo(track) {
	var curSeconds = Math.floor(track.currentTime);
	var curTime = readableDuration(track.currentTime);
	var duration = readableDuration(track.duration);
	video.curTime.text(curTime);
	video.duration.text(duration);
	video.time_slider.attr("max", track.duration);
	video.time_slider.val(track.currentTime);
}

$(document).ready(function() {

	// -------------------------------------------------------------------------
	/* Variables */
	// -------------------------------------------------------------------------
	
	//var songs = [];

	// Used for player controls
	//var shouldPlay = false;	// variable that tells if the audio should play or not upon startup - default = 0 = pause

	//var upload_open = false;	// tracks which screen in #main_container is open
	//var edit_open = false;		// tracks which screen in #main_container is open
	//var currentSong = 0;	// Sets the current song - used to keep track of when audio repeats and play count in database - default = 0, aka no song
	//var currentCategory = "Song";	// Tracks how you're organizing your songs - default = by song
	
	//var icon_edit;				// Variable to store the uploaded icon image to edit
	//var icon_edit_set = 0;		// 0 or 1 - tells us if we should consider editing the icon or not, set to true if a new icon is uploaded
	//var song_to_edit;			// the ID of the song we are editing


	/* Player Designations */
	// -------------------------------- //
	player.background = $("#player #player_background");		// Background image of player
	player.art= $("#player #player_art");

	player.audio = $("#player #audio");

	player.title = $("#player #player_title");
	player.artist = $("#player #player_artist");

	player.time_slider = $("#player #time_slider");
	player.curTime = $("#player #curTime");
	player.duration = $("#player #duration");

	player.play = $("#player #play");
	player.pause = $("#player #pause");
	player.forward = $("#player #forwardFive");
	player.back = $("#player #backFive");
	player.previous = $("#player #previous");
	player.next = $("#player #next");

	player.repeat = $("#player #repeat");
	player.shuffle = $("#player #shuffle");
	player.volume = $("#player #volume");
	player.volume_image = $("#player #volume_image");

	player.lyrics = $("#player #player_lyrics");
	// -------------------------------- //

	/* Video Player Designations */
	// -------------------------------- //
	video.container = $("#video_container");
	video.video = $("#video_container #video");
	video.background = $("#video_container #video_background");

	video.title = $("#video_container #video_title");
	video.artist = $("#video_container #video_artist");

	video.curTime = $("#video_container #video_curTime");
	video.duration = $("#video_container #video_duration");
	video.time_slider = $("#video_container #video_slider");

	video.play = $("#video_container #video_play");
	video.pause = $("#video_container #video_pause");
	video.back = $("#video_container #video_back");
	video.forward = $("#video_container #video_forward");
	video.volume = $("#video_container #video_volume");
	video.volume_image = $("#video_container #video_volume_image");
	video.fullscreen = $("#video_container #video_full");
	// -------------------------------- //

	/* Content Designations */
	// -------------------------------- //
	content.songs_button = $("#top #songs_button");
	content.movies_button = $("#top #movies_button");

	content.songs_list = $("#media #songs_list");
	content.movies_list = $("#media #movies_list");
	// -------------------------------- //



	var queue = [];			// Array that stores the queue of songs
	var shuffle = [];
	var curPosition = null;
	var shuffleCurPosition = null;
	var database = null;
	var albums = null;
	var currentSong = 0;	// Sets the current song - used to keep track of when audio repeats and play count in database - default = 0, aka no song
	var currentAlbum = 0;

	var repeat = 0;		// variable that tracks if songs should be looped or not - default is that songs AREN'T looped
	var shuffleToggle = 0;
	var paused = true;		// checks the current status of the player, if the song is paused or not


	createMedia();
	volumeAdjust(player.volume.val());


	$("#path_link").on("click", function() {
		updateMedia();
	});

	function updateMedia() {
		$("#top #update_message").fadeIn(100).text("Updating...");
		$.ajax({
			url: 'functions/prepUpdate.php?prep',
			type: 'GET',
			dataType: 'json',
			success: function(response, textStatus, jqXHR) {
				if (response.Success) {
					console.log(response.numImages);
					var totalSongs = response.Size;
					for (var i = 0; i < response.Size; i++) {
						updatePart(i, totalSongs);
					}
					saveMedia();
				}
				/*
				if (response.Success) {
					console.log("Database has been updated");
					$("#top #update_message").text("Update Successful").delay(1000).fadeOut(200);
					updateJSMedia(response);
					printMedia();
				} else {
					alert("Error updating database!");
				}
				*/
			}, 
			error: function(jqXHR, textStatus, errorThrown) {
				// Handle errors here
				$("#top #update_message").text("Error during update!");
				setTimeout(function() { $("#top #update_message").fadeOut(200); }, 1000);
				console.log('ERRORS: ' + errorThrown);
			}
		});
	}
	function updatePart(song_id, total) {
		var data = "id="+song_id;
		$.ajax({
			url: 'functions/updateMedia2.php',
			data: data,
			type: 'POST',
			dataType: 'json',
			success: function(response, textStatus, jqXHR) {
				var curStatus = song_id / total;
				curStatus = Math.floor(100 * curStatus);
				$("#top #update_progress").text(curStatus + "%");
				console.log(response.id);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				// Handle errors here
				console.log('ERRORS: ' + errorThrown);
				$("#top #update_message").text("Error during update!");
				setTimeout(function() { $("#top #update_message").fadeOut(200); }, 1000);
				return false;
			}
		});
	}

	function saveMedia() {
		$.ajax({
			url: 'functions/prepUpdate.php?save',
			type: 'GET',
			dataType: 'json',
			success: function(response, textStatus, jqXHR) {
				if (response.Success) {
					console.log("Database has been updated");
					$("#top #update_progress").empty();
					$("#top #update_message").text("Update Successful");
					setTimeout(function() { $("#top #update_message").fadeOut(200); }, 1000);
					updateJSMedia(response);
					printMedia();
				} else {
					alert("Error updating database!");
				}
			}, 
			error: function(jqXHR, textStatus, errorThrown) {
				// Handle errors here
				console.log('ERRORS: ' + errorThrown);
				$("#top #update_message").text("Error during update!")
				setTimeout(function() { $("#top #update_message").fadeOut(200); }, 1000);
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
			url: 'functions/getDatabase.php?get',
			type: 'GET',
			dataType: 'json',
			success: function(response, textStatus, jqXHR) {
				if (response.Success) {
        			console.log("Database has been received");
        			updateJSMedia(response);
        			printMedia();
        		} else {
        			alert("Error updating database!");
        		}
	        }, 
	        error: function(jqXHR, textStatus, errorThrown) {
            	// Handle errors here
            	console.log('ERRORS: ' + errorThrown);
        	}
	    });
	}

	function printMedia() {
		content.songs_list.empty();
		content.movies_list.empty();
		$.each(albums, function(album_key, album) {
			if (album.type == "audio") {
				content.songs_list.append(
					"<div class=\"album\" data-id=\""+album_key+"\"><h2 class=\"album_title\">"+album.name+"</h2><div class=\"songs\"></div></div>"
				);
			} else if ( album.type == "movie") {
				content.movies_list.append(
					"<div class=\"album\" data-id=\""+album_key+"\"><h2 class=\"album_title\">"+album.name+"</h2><div class=\"songs\"></div></div>"
				);
			}
		});
		$.each(database, function(song_id, song) {
			var album_cat = song.album;
			if (song.type == "audio") {
				$("#songs_list .album[data-id=\""+album_cat+"\"] .songs").append(
					"<div class=\"song\" data-id=\""+song_id+"\" data-type=\""+song.type+"\" data-url=\""+song.url+"\" data-album=\""+song.album+"\">"+
						"<div class=\"song_text\"><span class=\"song_title\">"+song.title+"</span><span class=\"song_artist\">"+song.artist+"</span></div>"+
					"</div>"
				);
			} else if (song.type == "movie") {
				$("#movies_list .album[data-id=\""+album_cat+"\"] .songs").append(
					"<div class=\"song\" data-id=\""+song_id+"\" data-type=\""+song.type+"\" data-url=\""+song.url+"\" data-album=\""+song.album+"\">"+
						"<div class=\"song_text\"><span class=\"song_title\">"+song.title+"</span><span class=\"song_artist\">"+song.artist+"</span></div>"+
					"</div>"
				);
			}
		});
	}
	function getImageArt(id) {
		var data = "id="+id;
		$.ajax({
			url: 'functions/getImageArt.php?get',
			data: data,
			type: 'POST',
			dataType: 'html',
			success: function(response, textStatus, jqXHR) {
				console.log(response);
				if ( response && response != "data:;charset=utf-8;base64," ) {
					player.art.attr("src", response);
					player.background.attr("src", response);
				} else {
					player.art.attr("src", database[id]["image"]);
					player.background.attr("src", database[id]["image"]);
				}
	        }, 
	        error: function(jqXHR, textStatus, errorThrown) {
            	// Handle errors here
            	console.log('ERRORS: ' + errorThrown);
        	}
	    });
	}


	window.addEventListener('keydown', function(e) {
		if(e.keyCode == 32 && e.target == document.body) {
			e.preventDefault();
			if (paused) {
				startAudio();
			} else {
				pauseAudio();
			}
		}
	});




	function updateLoop(id, album) {
		queue = [];
		if (repeat == 1) {
			// Looping through only one song
			queue.push(id);
			curPosition = 0;
		}
		else if (repeat == 2) {
			//looping through album
			queue = new Array(albums[album]["list"].length);
			for (var i = 0; i < albums[album]["list"].length; i++) {
				queue[i] = albums[album]["list"][i];
				if (albums[album]["list"][i] == id) {
			  		curPosition = i;
				}
			}
		}
		console.log("New Queue:");
		console.log(queue);
		console.log("Current Position in Queue: "+curPosition);
	}
	$(document).on("click", ".song", function() {
		var id = $(this).attr("data-id");
		currentSong = id;
		var type = $(this).attr("data-type");
		var album = $(this).attr("data-album");
		currentAlbum = album;
		if (type == "audio") {
			updateLoop(id, album);
			setShuffle();
			prepareAudio(id, album);
		} else if ( type == "movie" ) {
			pauseAudio();
			prepareVideo(id, album);
			video.container.show();
		}
		else {
			alert("balls");
		}
	});


	// Storing functions for player as defaults - aren't used but are there for reference
	/*
	function addEventHandlers(){
        $("a.load").click(loadAudio);
        $("a.start").click(startAudio);
        $("a.forward").click(forwardAudio);
        $("a.back").click(backAudio);
        $("a.pause").click(pauseAudio);
        $("a.stop").click(stopAudio);
        $("a.volume-up").click(volumeUp);
        $("a.volume-down").click(volumeDown);
        $("a.mute").click(toggleMuteAudio);
    }
    */
    function isEmpty(obj) {
    	for(var key in obj) {
    		if(obj.hasOwnProperty(key))
		        return false;
		   	}
		return true;
	}
    function prepareAudio(id, album) {
		player.audio.attr("src", database[id]["url"]);
		//var songArt = getImageArt(id);
		getImageArt(id);
		player.title.html(database[id]["title"]);
		player.artist.html(database[id]["artist"]);
		player.lyrics.html(database[id]["lyrics"]);
		currentSong = id;
		currentAlbum = album;

    	// Loads an audio into the player, in preparation for playing it
    	/*
	    // Make sure these details also make it into the top player
	    $("#player_top_song_icon").attr("src", song.icon);
	    $("#player_top_song_title").html(song.title);
	    $("#player_top_song_artist").text(song.artist);

	    setLyricTimes(song.lyrics_array);
	    $("#player_1_lyrics").html(song.lyrics_string);
	    $("#player_1_title").html(song.title);
	    $("#player_1_artist").html(song.artist);
	    $("#player_1_album").html(song.album);
	    $("#player_1_album_artist").html(song.album_artist);
	    $("#player_1_year").text(song.year);
	    $("#player_1_composer").html(song.composer);
	    $("#player_1_playcount").text(song.play_count);
	    $("#player_1_comments").html(song.comments);
	    $("#player_1_edit").attr("data-src", song.music_id);
	    */
	    loadAudio(id);
	    
	    player.time_slider.val(player.audio.prop("currentTime"));
		// $("#time_slider_top").val($("#player_1").prop("currentTime"));
	    //if (shouldPlay) {
	    startAudio();
	    //}
    }


	function loadAudio(id){
		// Forces audio to load into the player, as well as make the time slider for the song appear - used usually prior to starting a song
        currentSong = id;
        console.log("Current Song ID: "+ currentSong);
       	player.audio.bind("load");
        player.audio.trigger('load');
    }
    function startAudio(){
    	// Starts the audio, also causes the pause button to appear and the start button to disappear
        player.audio.trigger('play');
        player.play.hide();
        player.pause.show();
       	paused = false;
        //setSettingPHP("play", 1);
    }
    function pauseAudio(){
    	// Opposite of startAudio()
        player.audio.trigger('pause');
        player.pause.hide();
        player.play.show();
        paused = true;
        //setSettingPHP("play", 0);
    }
	player.pause.on("click", pauseAudio);
	player.play.on("click", startAudio);







	function timeAdjust(time) {
    	// Adjusts the current time of the audio - works in tandem with other functions, isn't called simply by clicking on an element
    	pauseAudio();
    	player.audio.prop("currentTime", time);
    	startAudio();
    }
	player.time_slider.on("input", function() { timeAdjust($(this).val());	});	// Moving the slider adjusts the audio's time

	





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
    player.forward.on("click", forwardAudio);
    player.back.on("click", backAudio);



	function nextAudio() {
		if (shuffleToggle == 0) {
			if (queue.length > 0) {
				curPosition++;
				if(curPosition == queue.length) {
					curPosition = 0;
				}
				var curAl = database[queue[curPosition]["album"]];
				prepareAudio(queue[curPosition], curAl);
			}
		} else {
			if (shuffle.length > 0) {
				shuffleCurPosition++;
				if(shuffleCurPosition == shuffle.length) {
					shuffleCurPosition = 0;
				}
				var curShufAl = database[shuffle[shuffleCurPosition]["album"]];
				prepareAudio(shuffle[shuffleCurPosition], curShufAl);
			}
		}
    }
    function previousAudio() {
    	if (shuffleToggle == 0) {
    		if (queue.length > 0) {
	    		curPosition = curPosition - 1;
				if(curPosition == -1) {
					curPosition = queue.length - 1;
				}
				var curAl = database[queue[curPosition]["album"]];
				prepareAudio(queue[curPosition]);
	    	}
    	} else {
    		if (shuffle.length > 0) {
	    		shuffleCurPosition = shuffleCurPosition - 1;
				if(shuffleCurPosition == -1) {
					shuffleCurPosition = shuffle.length - 1;
				}
				var curShufAl = database[shuffle[shuffleCurPosition]["album"]];
				prepareAudio(shuffle[shuffleCurPosition]);
	    	}
    	}
    }
	player.audio.on("ended", nextAudio);
	player.previous.on("click", previousAudio);
	player.next.on("click", nextAudio);



	function volumeAdjust(volume) {
    	player.volume.val(volume);
    	// Based on the position of the volume slider, the volume of the player and the volume icon will change
    	if (volume == 0) {
    		player.volume_image.attr("src", "assets/mute.png");
    	} else if (volume < 33) {
    		player.volume_image.attr("src", "assets/volume_1.png");
    	} else if (volume < 66) {
    		player.volume_image.attr("src", "assets/volume_2.png");
    	} else {
    		player.volume_image.attr("src", "assets/volume_3.png");
    	}
    	var vol = volume/100;
        player.audio.prop("volume",vol);
    }
    player.volume.on( "input", function() { volumeAdjust($(this).val()); 	});




    player.repeat.on("click", function() {
		// Clicking the Loop button either loops or unloops the audio
    	if (repeat == 0) {
    		// changing to looping only the single song
    		player.repeat.attr("src", "assets/repeat_1.png");
    	} 
  		else if (repeat == 1) { 
  			// changing to looping through the whole album
  			player.repeat.attr("src", "assets/repeat_all.png");
  		} 
  		else {
  			// changing to not looping
  			player.repeat.attr("src", "assets/repeat_0.png");
  		}
  		repeat++;
  		if (repeat == 3) {
  			repeat = 0;
  		}
  		var curAlbum = database[currentSong]["album"];
  		updateLoop(currentSong, curAlbum);
  		setShuffle();
    });



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
    			/*
				for (var i = 0; i < albums[album]["list"].length; i++) {
					shuffleQueue[i] = albums[album]["list"][i];
				}
				*/
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
   		console.log("Shuffle Queue Position: " + shuffleCurPosition);
		
    }
    player.shuffle.on("click", function() {
    	if (shuffleToggle == 0) {
    		shuffleToggle = 1;
    		player.shuffle.attr("src", "assets/shuffle_1.png");
    	} else {
    		shuffleToggle = 0;
    		shuffleCurPosition = null;
    		player.shuffle.attr("src", "assets/shuffle_0.png");
    	}
    	setShuffle();
    });

    content.songs_button.on("click", function(){
    	$(this).addClass("opened_nav");
    	content.movies_button.removeClass("opened_nav");
    	content.songs_list.show();
    	content.movies_list.hide();
    });
    content.movies_button.on("click", function() {
    	$(this).addClass("opened_nav");
    	content.songs_button.removeClass("opened_nav");
    	content.movies_list.show();
    	content.songs_list.hide();
    });






    video.background.on("click", function() {
    	pauseVideo();
    	video.container.hide();
    });
    function prepareVideo(id, album) {
		video.video.attr("src", database[id]["url"]);
		video.title.html(database[id]["title"]);
		video.artist.html(database[id]["artist"]);
		var thisVolume = video.volume.val();
		if (thisVolume == 0) {
    		video.volume_image.attr("src", "assets/mute_white.png");
    	}  else {
    		video.volume_image.attr("src", "assets/volume_3_white.png");
    	}

    	// Loads an audio into the player, in preparation for playing it
    	/*
	    // Make sure these details also make it into the top player
	    $("#player_top_song_icon").attr("src", song.icon);
	    $("#player_top_song_title").html(song.title);
	    $("#player_top_song_artist").text(song.artist);

	    setLyricTimes(song.lyrics_array);
	    $("#player_1_lyrics").html(song.lyrics_string);
	    $("#player_1_title").html(song.title);
	    $("#player_1_artist").html(song.artist);
	    $("#player_1_album").html(song.album);
	    $("#player_1_album_artist").html(song.album_artist);
	    $("#player_1_year").text(song.year);
	    $("#player_1_composer").html(song.composer);
	    $("#player_1_playcount").text(song.play_count);
	    $("#player_1_comments").html(song.comments);
	    $("#player_1_edit").attr("data-src", song.music_id);
	    */
	    loadVideo(id);
	    
	    //player.time_slider.val(player.audio.prop("currentTime"));
		// $("#time_slider_top").val($("#player_1").prop("currentTime"));
	    //if (shouldPlay) {
	    startVideo();
	    //}
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
       	//paused = false;
        //setSettingPHP("play", 1);
    }
    function pauseVideo(){
    	// Opposite of startAudio()
		video.video.trigger('pause');
		video.pause.hide();
		video.play.show();
        //paused = true;
        //setSettingPHP("play", 0);
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
    	if (volume == 0) {
    		video.volume_image.attr("src", "assets/mute_white.png");
    	}  else {
    		video.volume_image.attr("src", "assets/volume_3_white.png");
    	}
    	var vol = volume/100;
        video.video.prop("volume",vol);
    }
    video.time_slider.on("input", function() { videoTimeAdjust($(this).val());	});	// Moving the slider adjusts the video's time
    video.pause.on("click", pauseVideo);
    video.play.on("click", startVideo);
    video.forward.on("click", forwardVideo);
    video.back.on("click", backVideo);
    video.volume.on( "input", function() { videoVolumeAdjust($(this).val()); });


	// -------------------------------------------------------------------------
	/* Startup */
	// -------------------------------------------------------------------------

	// We first preload settings such as looping

/*
	function getSettings() {
		// Retrieves current player settings saved in SESSION
    	$.ajax({
	        url: 'functions/settings.php?get',
        	type: 'POST',
        	dataType: 'json',
        	success: function(response, textStatus, jqXHR) {
	        	setSettings(response);
	        }, 
	        error: function(jqXHR, textStatus, errorThrown) {
            	// Handle errors here
            	console.log('ERRORS: ' + textStatus);
        	}
	    });
	}

	function setSettings(settings) {
		// Sets the settings retrieved from SESSION

		// Loop settings
		repeat = settings.Loop;
		console.log("Setting Current Settings: " + repeat);
		if (repeat == 1) {
			$("#repeat_button_1").attr("src", "assets/repeat_1.png");
			$("#repeat_button_top").attr("src", "assets/repeat_1.png");
			console.log("set repeat to on");
		} else {
			$("#repeat_button_1").attr("src", "assets/repeat_0.png");
			$("#repeat_button_top").attr("src", "assets/repeat_0.png");
			console.log("set repeat to off");
		}

		// Should the audio play? 
		if (settings.Play == 0) {
			shouldPlay = false;
		} else {
			shouldPlay = true;
		}

		// Current category that you're organizing songs by
		currentCategory = settings.Category;
		$("#bottom .link[data-src='"+currentCategory+"']").addClass("nav_opened");
		$("#song_list .song_list_cat[data-id='"+currentCategory+"']").addClass("opened_cat");
		console.log("Current Tab Open: "+currentCategory);
		getSongs(true);
	}


	// function that resets the list of songs on the main page - also, if a song is saved inside a $_SESSION, it will automatically start playing
	function getSongs(loadUp) {
		$.ajax({
	        url: 'functions/retrieveSongsFromDatabase.php?test',
	        type: 'GET',
	        //data: data,
	        dataType: 'json',
	        success: function(response, textStatus, jqXHR) {
	        	$("#song_list .song_list_cat").empty();
	        	var album_songs = 1;

	        	$.each(response["Music"], function(cat, catValues) {
	        		if (cat == "playlist_title") {
			    		playlists = catValues;
			   		}
	        		$.each(catValues, function(album_name, album) {
			       		var new_album_name = album_name.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '_');

			       		$("#song_list #song_list_"+cat).append(
			       			"<div class=\"album\"><h2 class=\"album_name\">"+album_name+"</h2>"+
			       				"<div class=\"album_songs\" id=\"album_"+new_album_name+"\">"+
			       					"<div class=\"song_left\"></div><div class=\"song_right\"></div>"+
			       				"</div>"+
		       				"</div>"
		        		);

		        		var leftright = 1;
		        		var song_class;
		        		var numSongsInAlbum = album.length;

			    		album.forEach(function(song, key) {
			    			if (leftright <= Math.ceil(numSongsInAlbum*0.5) || numSongsInAlbum == 1) {
			    				song_class = "song_left";
			    			} else {
			    				song_class = "song_right";
			    			}

			    			if (song.music_id == null) {
			    				$("#song_list_"+cat+" #album_"+new_album_name).append("<span><i>Empty playlist...</i></span>");
			    			} else {
			    				$("#song_list_"+cat+" #album_"+new_album_name+" ."+song_class).append(
				       				"<div class=\"song\" id=\""+song["music_id"]+"\">"+
				       					"<div class=\"song_info\">"+
			        						"<span class=\"song_title\">"+song["title"]+"</span>"+
			      							"<span class=\"song_artist\">"+song["artist"]+"</span>"+
				        				"</div>"+
				   						"<span class=\"song_url\">"+song["url"]+"</span>"+
										"<div class=\"song_options_container\"><span class=\"song_time\">"+song["length"]+"</span><div class=\"song_options\" data-src=\""+song["music_id"]+"\" data-cat=\""+cat+"\"><img src=\"assets/options.png\" alt=\"Song Options\"></div></div>"+
										"<div class=\"song_options_dropdown\" id=\"song_options_dropdown_"+song["music_id"]+"\">"+
											"<span class=\"song_options_button song_options_edit\" data-src=\""+song["music_id"]+"\">Edit Song</span>"+
											//"<span class=\"song_options_button song_options_add\" data-src=\""+song["music_id"]+"\">Add To Playlist</span><div class=\"song_options_add_playlist_div\"></div>"+
											"<span class=\"song_options_button song_options_delete\" data-src=\""+song["music_id"]+"\">Delete Song</span></div>"+
				   					"</div>"
				   				);
			    			}
			    			
			    			leftright++;
			       		});
			       	});
			       	if (cat == "playlist_title") {
			       		$("#song_list #song_list_playlist_title").append("<div id='playlist_trigger'><img id='playlist_trigger_0' src='assets/add_0.png'><img id='playlist_trigger_1' src='assets/add_1.png'><span>Create Playlist</span></div>");
			       	}  	
	        	});
	        	
	        	console.log(playlists);

		       	console.log("Play song on startup?: "+response.Play);
	        	if (response.Play && loadUp) {
	        		prepareAudio(response.Song);
	        	}
	        	
	        },
	        error: function(jqXHR, textStatus, errorThrown) {
	            // Handle errors here
	            console.log('ERRORS: ' + errorThrown);
	        }
	    });
	}

	// Initialize settings, as well as get song list based on those settings
	getSettings()

	//initialize volume level
    volumeAdjust($("#volume_1").val());
    // Depending on if looping is on or not, the audio will or will not loop - this is automatic
    $("#player_1").on("ended", function() {
    	// AJAX call to update database's play_count for song
    	var data = "value="+currentSong;
    	$.ajax({
	        url: 'functions/settings.php?setPlayCount',
        	type: 'POST',
        	data: data,
        	dataType: 'json',
        	success: function(response, textStatus, jqXHR) {
	        	if (response.Success) {
	        		$("#player_1_playcount").text(response.Num);
	        	} else {
	        		console.log(response.Message);
	        	}
	        	console.log(response);
	        }, 
	        error: function(jqXHR, textStatus, errorThrown) {
            	// Handle errors here
            	console.log('ERRORS: ' + textStatus);
        	}
	    });
    	repeatAudio();
    });



	// -------------------------------------------------------------------------
	/* Functions */
	// -------------------------------------------------------------------------

	// Storing functions for player as defaults - aren't used but are there for reference
	/*
	function addEventHandlers(){
        $("a.load").click(loadAudio);
        $("a.start").click(startAudio);
        $("a.forward").click(forwardAudio);
        $("a.back").click(backAudio);
        $("a.pause").click(pauseAudio);
        $("a.stop").click(stopAudio);
        $("a.volume-up").click(volumeUp);
        $("a.volume-down").click(volumeDown);
        $("a.mute").click(toggleMuteAudio);
    }
    */
    /*
    function prepareAudio(song) {
    	console.log(shouldPlay);
    	// Loads an audio into the player, in preparation for playing it
    	$("#player_1").attr("src", song.url+song.file_name);
	   	$("#player_1_song_icon").attr("src", song.icon);
	   	$("#player_1_background").attr("src", song.icon);
	    $("#player_1_icon_container").show();
	    $("#player_1_song_title").html(song.title);
	    $("#player_1_song_artist").text(song.artist);

	    // Make sure these details also make it into the top player
	    $("#player_top_song_icon").attr("src", song.icon);
	    $("#player_top_song_title").html(song.title);
	    $("#player_top_song_artist").text(song.artist);

	    setLyricTimes(song.lyrics_array);
	    $("#player_1_lyrics").html(song.lyrics_string);
	    $("#player_1_title").html(song.title);
	    $("#player_1_artist").html(song.artist);
	    $("#player_1_album").html(song.album);
	    $("#player_1_album_artist").html(song.album_artist);
	    $("#player_1_year").text(song.year);
	    $("#player_1_composer").html(song.composer);
	    $("#player_1_playcount").text(song.play_count);
	    $("#player_1_comments").html(song.comments);
	    $("#player_1_edit").attr("data-src", song.music_id);
	    loadAudio(song.music_id);
	    $("#time_slider_1").val($("#player_1").prop("currentTime"));
	    $("#time_slider_top").val($("#player_1").prop("currentTime"));
	    if (shouldPlay) {
	    	startAudio();
	    }
    }
	function loadAudio(id){
		// Forces audio to load into the player, as well as make the time slider for the song appear - used usually prior to starting a song
        currentSong = id;
        console.log(currentSong);
        $("#player_1").bind("load");
        $("#player_1").trigger('load');
        $(".time_slider").show();
    }
    function startAudio(){
    	// Starts the audio, also causes the pause button to appear and the start button to disappear
        $("#player_1").trigger('play');
        $("img.start").hide();
        $("img.pause").show();
        setSettingPHP("play", 1);
    }
    function pauseAudio(){
    	// Opposite of startAudio()
        $("#player_1").trigger('pause');
        $("img.pause").hide();
        $("img.start").show();
        setSettingPHP("play", 0);
    }
    function forwardAudio(){
    	// Causes the song to advance by 5 seconds, also adjusts the time slider appropriately
        pauseAudio();
        $("#player_1").prop("currentTime", $("#player_1").prop("currentTime")+5);
        $("#time_slider_1").val($("#player_1").prop("currentTime"));
        $("#time_slider_top").val($("#player_1").prop("currentTime"));
        startAudio();
    }
    function backAudio(){
    	// Same as forwardAudio(), except moves back 5 seconds
        pauseAudio();
        $("#player_1").prop("currentTime",$("#player_1").prop("currentTime")-5);
        $("#time_slider_1").val($("#player_1").prop("currentTime"));
        $("#time_slider_top").val($("#player_1").prop("currentTime"));
        startAudio();
    }
    function volumeAdjust(volume) {
    	console.log("Volume Level: "+volume);
    	$("#volume_1").val(volume);
    	$("#volume_top").val(volume);
    	// Based on the position of the volume slider, the volume of the player and the volume icon will change
    	if (volume == 0) {
    		$("#volume_image_1").attr("src", "assets/mute.png");
    		$("#volume_image_top").attr("src", "assets/mute.png");
    	} else if (volume < 33) {
    		$("#volume_image_1").attr("src", "assets/volume_1.png");
    		$("#volume_image_top").attr("src", "assets/volume_1.png");
    	} else if (volume < 66) {
    		$("#volume_image_1").attr("src", "assets/volume_2.png");
    		$("#volume_image_top").attr("src", "assets/volume_2.png");
    	} else {
    		$("#volume_image_1").attr("src", "assets/volume_3.png");
    		$("#volume_image_top").attr("src", "assets/volume_3.png");
    	}
    	var vol = volume/100
        $("#player_1").prop("volume",vol);
    }
    function timeAdjust(time) {
    	// Adjusts the current time of the audio - works in tandem with other functions, isn't called simply by clicking on an element
    	$("#player_1").prop("currentTime", time);
    }
    function repeatAudio() {
    	// If the user has selected for audio to loop, it will restart the audio, as if it were looping
    	console.log("Repeat? " + repeat);
    	if (repeat == 1) {
	    	$("#time_slider_1").val($("#player_1").prop("currentTime"));
	    	$("#time_slider_top").val($("#player_1").prop("currentTime"));
	    	startAudio();
    	}
    }
    // General function used to save settings in PHP SESSION cookie or in DB
    // This function is used for:
    // Loop, Pause/Playing, Changing PlayCount, Song List Category
    function setSettingPHP(type, value) {
    	var data = "value="+value;
    	console.log(data);
    	$.ajax({
	        url: 'functions/settings.php?'+type,
        	type: 'POST',
        	data: data,
        	dataType: 'json',
        	success: function(response, textStatus, jqXHR) {
	        	if (response.Success) {
	        		console.log("Success at changing " + type);
	        		if (type=="setPlayCount") {
		        		$("#player_1_playcount").text(response.Num);
		        	}
	        	} else {
	        		alert("Could not change SESSION variable!");
	        		console.log(response);
	        	}
	        }, 
	        error: function(jqXHR, textStatus, errorThrown) {
            	// Handle errors here
            	console.log('ERRORS: ' + textStatus);
        	}
	    });
    }



	// -------------------------------------------------------------------------
	/* Click Events + Controls */
	// -------------------------------------------------------------------------

    // Player Controllers
    // Controls the player itself - this includes when to play songs, which buttons deactivate or activate songs, etc.

    // When a song is clicked, it must load into the player and play - it will also save in a $_SESSION variable which song is active
    /*
    $(document).on("click", ".song", function() {
    	shouldPlay = true;
    	var dataToSend="songID="+$(this).attr("id");
    	var results = $.ajax({
	 		data: dataToSend,
	        dataType: "json",
	        type: "post",
	       	url: "functions/getSong.php",
	    	success: function(response) {
	    		console.log(response);
	    		//console.log("Saved song in session: " + response.Message);
	    		if (response.Success) {
	    			prepareAudio(response);		
	    		} 
	    	},
	    	error: function(xhr, status, error) {	alert(error);	}
	    });
    });

    // Simple Controls
	$("img.start").click(startAudio);		// When the image icon representing "START" is clicked, it starts the audio
	$("img.pause").click(pauseAudio);		// When the image icon representing "PAUSE" is clicked, it pauses the audio
	$("img.forward").click(forwardAudio);	// When the image icon representing "FORWARD" is clicked, it advances the audio by 5 seconds
	$("img.back").click(backAudio);			// Same as above, except -5 seconds
	$("#time_slider_1").on("input", function() { timeAdjust($(this).val());	});	// Moving the slider adjusts the audio's time
	$("#time_slider_top").on("input", function() { timeAdjust($(this).val());	});	// Moving the slider adjusts the audio's time
	$(".repeat_button").on("click", function() {
		// Clicking the Loop button either loops or unloops the audio
    	if (repeat == 0) {
    		$("#repeat_button_1").attr("src", "assets/repeat_1.png");
    		$("#repeat_button_top").attr("src", "assets/repeat_1.png");
    		repeat = 1;
    	} 
  		else { 
  			$("#repeat_button_1").attr("src", "assets/repeat_0.png");
  			$("#repeat_button_top").attr("src", "assets/repeat_0.png");
  			repeat = 0;
  		}
    	setSettingPHP("loop", repeat);
    });
    $("#player_1_details_container .player_details_nav").on("click", function() {
    	var selectedDetail = $(this).attr("data-src");
    	$("#player_1_details_container .opened_details").removeClass("opened_details");
    	$("#player_1_details_container .opened_nav").removeClass("opened_nav");
    	if (selectedDetail == "lyrics") {
    		$("#player_1_details_container .player_lyrics").addClass("opened_details");
    		$("#player_1_details_container #player_1_lyrics_nav").addClass("opened_nav");
    	} else if (selectedDetail == "details") {
    		$("#player_1_details_container .player_details").addClass("opened_details");
    		$("#player_1_details_container #player_1_details_nav").addClass("opened_nav");
    	} else {
    		alert("whut?");
    	}
    });

	// Volume Controls
	$("#volume_1").on( "input", function() { volumeAdjust($(this).val()); 	});	// When the volume is changed, the volume is adjusted for the player
	$("#volume_top").on( "input", function() { volumeAdjust($(this).val()); 	});	// When the volume is changed, the volume is adjusted for the player						

    // Simply controls which screen is open in #main_container
    $(document).on("click", "#playlist_trigger", function() {
    	$("#song_list").hide();
    	//$("#song_shortcuts").hide();
    	$("#playlist_create_main_container").show();
    });
    $("#cancel_playlist_create").on("click", function() {
    	$("#playlist_create_main_container").hide();
    	$("#song_list").show();
    	//$("#song_shortcuts").show();
    });

    // Lyric Controls 
    $(document).on("click", "#player .lyric_segment", function() {
    	var skipTo = $(this).attr("data-start");
    	// Causes the song to advance by 5 seconds, also adjusts the time slider appropriately
        pauseAudio();
        $("#player_1").prop("currentTime", skipTo);
        $("#time_slider_1").val($("#player_1").prop("currentTime"));
        $("#time_slider_top").val($("#player_1").prop("currentTime"));
        startAudio();
    });

	// When a button in the top navigation is clicked, #song_list must change to accomodate that change
	$("#bottom .link").on("click", function() {
		$("#bottom .nav_opened").removeClass("nav_opened");
		$("#song_list .opened_cat").removeClass("opened_cat");
		$(this).addClass("nav_opened");
		currentCategory = $(this).attr("data-src");
		console.log("Changing currentCategory to "+currentCategory);
		$("#upload_container").hide();
		$("#song_edit").hide();
		$("#playlist_create_main_container").hide();
		$("#song_list").show();
		$("#song_list .song_list_cat[data-id='"+currentCategory+"']").addClass("opened_cat");
		//$("#song_shortcuts").show();
		//getSongs(false, currentCategory);
		$("#player_big_container").hide();
		//Ajax call to change settings in SESSION
		setSettingPHP("currentCategory", currentCategory);
		upload_open = false;
		$("#upload_container input").each(function() {
			if ($(this).attr("type") != "submit") {
				$(this).val("");
			}
		});
		$("#upload_container textarea").each(function() {
			$(this).val("");
		});
		$("#upload_link").text("Upload");
	});

	// Open upload container - also erases the inputs when you cancel an input
	$("#upload_link").on("click", function() {
		$("#song_edit").hide();
		$("#song_edit input").each(function() {
			if ($(this).attr("type") != "submit") {
				$(this).val("");
			}
		});
		$("#song_edit textarea").each(function() {
			$(this).val("");
		});
		$("#song_edit .form_lyric_container").remove();
		if (!upload_open) {
			if (!edit_open) {
				$("#song_list").hide();
				$("#upload_container").show();
				$(this).text("Cancel Upload");
				upload_open = true;
				edit_open = false;
			} else {
				$("#song_list").show();
				$(this).text("Upload");
				upload_open = false;
				edit_open = false;
			}
		} else {
			$("#upload_container").hide();
			$("#song_list").show();
			$("#upload_container input").each(function() {
				if ($(this).attr("type") != "submit") {
					$(this).val("");
				}
			});
			$("#upload_container textarea").each(function() {
				$(this).val("");
			});
			$(this).text("Upload");
			$("#song_error_message").empty();
			icon_upload = null;
			song_upload = null;
			//file_count = 1;
			upload_open = false;
			edit_open = false;
		}
	});

    // Button in song_lists to return to player - only available in mobile
    $("#main_top #song_forward_mobile").on("click", function() {
	    $("#player_big_container").show();
    });
    // Back button to return to song list - only available in mobile
    $("#player #song_back_mobile").on("click", function() {
	    $("#player_big_container").hide();
    });
    


   

    // -------------------------------------------
    /* AJAX form for uploading a song */
    // -------------------------------------------

    // Variables used:
    // icon_upload, song_upload, file_count

    // Button to add another file input - currently unused, don't tamper with
    /*
    $("#upload_add").on("click", function() {
    	$("#upload_container #upload_form_append").append(
    		"<div class=\"form_container appended\">"+
	    		"<div class=\"form_main_container\"><span class=\"form_label\">Song #"+(file_count+1)+":</span><input class=\"song_file\" type=\"file\" name=\"song_upload["+file_count+"]\" required></div>"+
				"<div class=\"form_inner_container\"><span class=\"form_label\">Title:</span><input class=\"upload_input\" type=\"text\" name=\"title["+file_count+"]\" placeholder=\"Title of Song\" required></div>"+
				"<div class=\"form_inner_container\"><span class=\"form_label\">Artist:</span><input class=\"upload_input\" type=\"text\" name=\"artist["+file_count+"]\" placeholder=\"Artist\" required></div>"+
				"<div class=\"form_inner_container\"><span class=\"form_label\">Album:</span><input class=\"upload_input\" type=\"text\" name=\"album["+file_count+"]\" placeholder=\"Album\" required></div>"+
				"<div class=\"form_inner_container\"><span class=\"form_label\">Album Artist:</span><input class=\"upload_input\" type=\"text\" name=\"album_artist["+file_count+"]\" placeholder=\"Album Artist\" required></div>"+
			"</div>"
    	);
    	file_count++;
    })

	// When a user uploads a song's icon image, we call "prepareUpload" function - currently unused, don't tamper with
	//$("#icon_upload").on('change', prepareIconUpload);
	//$("#song_upload").on('change', prepareSongUpload);

	$(document).on("change", ".song_file", uploadSong);

	// Grab the files and set them to our variable
	/* Currently unused - don't tamper with
	function prepareIconUpload(event) {
		icon_upload = event.target.files;
		console.log(icon_upload);
	}
	*/
	/*
	function prepareSongUpload(event) {
		song_upload = event.target.files;
	}


    // When a user first uploads the song, we need to process the image file first - this calls the "uploadFiles" function
    $("#song_upload_form").on("submit", submitForm);

    function uploadSong(event) {

    	// If I had a spinner here, this would be where I add it
	  	
	  	// Create a formdata object and add the files
	  	song_upload = event.target.files;

    	var data = new FormData();
    	$.each(song_upload, function(key, value) {
        	data.append(key, value);
    	});
    	
    	
    	//Time for the ajax function
    	$.ajax({
        	url: 'functions/song_file_upload.php?song',	// ?files ensures that the "$_GET" in song_icon_upload.php runs properly
        	type: 'POST',
        	data: data,
        	cache: false,
        	dataType: 'json',
        	processData: false, 	// Don't process the files - in other words, don't turn the icons into strings
        	contentType: false, 	// Set content type to false as jQuery will tell the server its a query string request
        	success: function(response, textStatus, jqXHR) {
        		if (!response.Error) {
        			$("#song_error_message").empty();
        			$("#upload_container #upload_title").val(response.Message.Title);
        			$("#upload_container #upload_artist").val(response.Message.Artist);
        			$("#upload_container #upload_album").val(response.Message.Album);
        			$("#upload_container #upload_album_artist").val(response.Message.Album_Artist);

        			$("#upload_container #upload_length").val(response.Message.Length);
        			$("#upload_container #upload_composer").val(response.Message.Composer);
        			$("#upload_container #upload_year").val(response.Message.Year);
        			$("#upload_container #upload_comment").val(response.Message.Comment);
        			$("#upload_container #upload_extension").val(response.Message.Extension);
        			//uploadIcon(event, response.File);
        			//submitForm(event, response.Song_Extension);
        		} else {
        			$("#song_error_message").text("ERROR: "+response.Message);
        			//$("#upload_message_1").text("Error detected with your song upload!").addClass("show_error");
        		}
        		console.log("Upload Song Attempt:");
            	console.log(response);
        	},
        	error: function(jqXHR, textStatus, errorThrown) {
            	// Handle errors here
            	console.log('ERRORS: ' + textStatus);
            	
            	// STOP LOADING SPINNER if I had one
        	}
    	});
	}


    // This function runs AJAX to process the song's icon image first - it will eventually run another function that runs the ajax for the other input submission
    function uploadIcon(event, extension) {
    	// Create a formdata object and add the files
    	var data = new FormData();
    	$.each(icon_upload, function(key, value) {
        	data.append(key, value);
    	});

    	//Time for the ajax function
    	$.ajax({
        	url: 'functions/song_file_upload.php?icon',	// ?files ensures that the "$_GET" in song_icon_upload.php runs properly
        	type: 'POST',
        	data: data,
        	cache: false,
        	dataType: 'json',
        	processData: false, 	// Don't process the files - in other words, don't turn the icons into strings
        	contentType: false, 	// Set content type to false as jQuery will tell the server its a query string request
        	success: function(response, textStatus, jqXHR) {
        		if (!response.Error) {
        			$("#icon_error").empty();
        			$("#upload_message_1").empty().removeClass("show_error");
        			submitForm(event, extension);
        		} else {
        			$("#upload_message_1").text("Error detected with your icon upload!").addClass("show_error");
        			$("#icon_error").text(response.Message);
        		}
            	console.log(response);

        	},
        	error: function(jqXHR, textStatus, errorThrown) {
            	// Handle errors here
            	console.log('ERRORS: ' + textStatus);
            	
            	// STOP LOADING SPINNER if I had one
        	}
    	});
	}

	function submitForm(event) {
		event.stopPropagation(); // Stop stuff happening
    	event.preventDefault(); // Totally stop stuff happening

  		// Create a jQuery object from the form
    	var formData = $("#song_upload_form").serialize();

	    // You should sterilise the file names
	    //formData = formData + '&filename=' + extension;

	    $.ajax({
	        url: 'functions/upload.php?data',
	        type: 'POST',
	        data: formData,
	        cache: false,
	        dataType: 'json',
	        success: function(response, textStatus, jqXHR) {
	        	if (response.Error) {
	        		// Some error is present
	        		$("#song_error_message").text(response.Message);

	        	} else {
	        		$("#song_error_message").empty();
	        		$("#upload_container").hide();
	        		$("#upload_link").text("Upload");
	        		$("#song_list").show();
    				getSongs(false);
    				// Empty all entries within the upload form
	    			$("#song_upload_form input").each(function() {
	    				if ($(this).attr("type") != "submit") {
	    					$(this).val("");
	    				}
    				});
	        	}
	            console.log(response);
	        },
	        error: function(jqXHR, textStatus, errorThrown) {
	            // Handle errors here
	            console.log('ERRORS: ' + textStatus);
	        },
	        complete: function() {
	            // STOP LOADING SPINNER
	        }
	    });
	}


	// -------------------------------------------
    /* AJAX form for editing a song */
    // -------------------------------------------

    // Variables used:
    // icon_edit, icon_edit_set, song_to_edit

    // When a user wants to edit a song:
    // 2 scenarios: either the user clicks the "..." icon in #song_list, or they click the edit button on the player
    /*
    $(document).on("click", ".song .song_options", function() {
    	var thisSongID = $(this).attr("data-src");
    	var thisCat = $(this).attr("data-cat");
    	$("#song_list_"+thisCat+" #song_options_dropdown_"+thisSongID).show();
    	return false;
	});
	$(document).on("mouseleave", ".song .song_options_dropdown", function() {
		$(this).hide();
		$(this).children(".song_options_add_playlist_div").removeClass("song_options_add_playlist_opened_div");
	})
	$(document).on("click", ".song .song_options_edit", function() {
		song_to_edit = $(this).attr("data-src");
		edit_open = true;
		upload_open = false;
		$("#upload_link").text("Cancel Edit");
		getDataForEdit(song_to_edit);
		return false;	// ensures that the song does not play the song that was clicked - necessary because we're technically clicking inside the song to activate it
	});
	/*
	$(document).on("click", ".song .song_options_dropdown .song_options_add", function() {
		$(this).siblings(".song_options_add_playlist_div").toggleClass("song_options_add_playlist_opened_div");
		var element = $(this).siblings(".song_options_add_playlist_div");
		$.each(playlists, function(key, playlist_array) {
			element.append("<span class=\"song_options_add_playlist_span\" data-id=\""+playlist_array.playlist_id+"\">"+playlist_array.playlist_title+"</span>");
		});
		return false;
	});
	*/
	/*
	$("#player .player_edit").on("click", function() {
		song_to_edit = $(this).attr("data-src");
		edit_open = true;
		upload_open = false;
		$("#upload_link").text("Cancel Edit");
		getDataForEdit(song_to_edit);
		$("#player_big_container").hide();
	});
	$(document).on("click", "#song_edit .add_lyric_segment", function() {
		var parentID = $(this).attr("data-seg");
		//$("#song_edit #song_edit_lyrics_container #append_song_lyrics").append(
		$("<div class=\"form_lyric_container\" id=\"form_lyric_container_"+edit_lyric_num+"\">"+
				"<div class=\"form_lyric_times\">"+
					"<span class=\"form_lyric_time_label\">Start</span><input type=\"text\" name=\"start["+edit_lyric_num+"]\" placeholder=\"00:00\" required>"+
	        		"<span class=\"form_lyric_time_label\">End</span><input type=\"text\" name=\"end["+edit_lyric_num+"]\" placeholder=\"00:00\" required>"+
					"<span class=\"add_lyric_segment\" data-seg=\""+edit_lyric_num+"\">Add Segment Below</span>"+
					"<span class=\"form_lyric_delete\" data-seg=\""+edit_lyric_num+"\">Delete Segment</span>"+
				"</div>"+
				"<textarea class=\"form_lyric_segment\" name=\"lyrics["+edit_lyric_num+"]\" placeholder=\"Lyric Segment\"></textarea>"+
	        "</div>"
		).insertAfter("#song_edit #song_edit_lyrics_container #form_lyric_container_"+parentID);
	    edit_lyric_num++;
	});

	$(document).on("click", "#song_edit .form_lyric_container .form_lyric_delete", function() {
		var thisSeg = $(this).attr("data-seg");
		console.log(thisSeg);
		$("#song_edit #form_lyric_container_"+thisSeg).remove();
	});

	// The edit container is divided into 3 containers - you will need to manage which one is opened
	$("#song_edit .song_edit_nav_button").on("click", function() {
		if ($(this).hasClass("song_edit_nav_opened")) {
			return;
		} else {
			$("#song_edit .song_edit_nav_opened").removeClass("song_edit_nav_opened");
			$("#song_edit .song_edit_opened").removeClass("song_edit_opened");
			var toOpen = $(this).attr("data-id");
			if (toOpen == "artwork") {
				$("#song_edit #song_edit_icon_main_container").addClass("song_edit_opened");
			} else if (toOpen == "lyrics") {
				$("#song_edit #song_edit_lyrics_container").addClass("song_edit_opened");
			} else {
				$("#song_edit #song_edit_text_container").addClass("song_edit_opened");
			}
			$(this).addClass("song_edit_nav_opened");

		}
	});

	// When a user edits a song's icon image, we call "prepareUpload" function mentioned above
	$("#icon_edit").on('change', prepareIconEdit);

	// Grab the files and set them to our variable
	function prepareIconEdit(event) {
		icon_edit = event.target.files;
		icon_edit_set = 1;
	}

	// When a user submits a song edit request, an ajax call is called
	$("#song_edit_form").on("submit", editIcon);

	var edit_lyric_num = 0;

	// This function grabs the information from the database and plasters it into the editor
	function getDataForEdit(id) {
		var formData = "id="+id;
		// need to make an AJAX call to retrieve the song's current details
		$.ajax({
	        url: 'functions/retrieveSongInfo.php',
	        type: 'POST',
	        data: formData,
	        dataType: 'json',
	        success: function(response, textStatus, jqXHR) {
	        	console.log(response.lyrics);
	        	if (response.Success) {
	        		$("#edit_image").attr("src", response.url+"icon.jpg");
	        		$("#edit_title").val(response.title);
	        		$("#edit_artist").val(response.artist);
	        		$("#edit_album_artist").val(response.album_artist);
	        		$("#edit_album").val(response.album);
	        		$("#edit_composer").val(response.composer);
	        		$("#edit_year").val(response.year);
	        		$("#edit_comments").val(response.comments);
	        		$("#edit_length").val(response.length);

	        		$.each(response.lyrics, function(key, segment) {
	        			$("#song_edit #song_edit_lyrics_container #append_song_lyrics").append(
	        				"<div class=\"form_lyric_container\" id=\"form_lyric_container_"+key+"\">"+
	        					"<div class=\"form_lyric_times\">"+
	        						"<span class=\"form_lyric_time_label\">Start</span><input type=\"text\" name=\"start["+key+"]\" placeholder=\"00:00\" value=\""+readableDuration(segment.Start)+"\" required>"+
	        						"<span class=\"form_lyric_time_label\">End</span><input type=\"text\" name=\"end["+key+"]\" placeholder=\"00:00\" value=\""+readableDuration(segment.End)+"\" required>"+
	        						"<span class=\"add_lyric_segment\" data-seg=\""+key+"\">Add Segment Below</span>"+
	        						"<span class=\"form_lyric_delete\" data-seg=\""+key+"\">Delete Segment</span>"+
	        					"</div>"+
	        					"<textarea class=\"form_lyric_segment\" name=\"lyrics["+key+"]\" placeholder=\"Lyric Segment\">"+segment.Lyrics+"</textarea>"+
	        				"</div>"
	        			);
	        			edit_lyric_num++;
	        		});
	        		//$("#song_edit_lyrics").val(response.lyrics);
	        		//$("#edit_").val(response.);

	        		$("#song_list").hide();
					$("#song_edit").show();
	        	} else {
	        		alert("Error detected in retrieving song info - need to fix");
	        	}
	        },
	        error: function(jqXHR, textStatus, errorThrown) {
	            // Handle errors here
	            console.log('ERRORS: ' + textStatus);
	        }
	    });
	}




	// This function runs AJAX to process the song's icon image first - it will eventually run another function that runs the ajax for the other input submission
    function editIcon(event) {
    	event.stopPropagation(); // Stop stuff happening
    	event.preventDefault(); // Totally stop stuff happening

	  	// Create a formdata object and add the files
    	var data = new FormData();
    	$.each(icon_edit, function(key, value) {
        	data.append(key, value);
    	});

    	//Time for the ajax function
    	$.ajax({
        	url: "functions/song_file_edit.php?icon=1&change="+icon_edit_set+"&id="+song_to_edit,	// ?files ensures that the "$_GET" in song_icon_upload.php runs properly
        	type: 'POST',
        	data: data,
        	cache: false,
        	dataType: 'json',
        	processData: false, 	// Don't process the files - in other words, don't turn the icons into strings
        	contentType: false, 	// Set content type to false as jQuery will tell the server its a query string request
        	success: function(response, textStatus, jqXHR) {
        		if (response.Success) {
        			$("#edit_message").removeClass("show_error");
        			submitEdit(event, song_to_edit);
        		} else {
        			$("#edit_message").text(response.Message).addClass("show_error");
        		}
        	},
        	error: function(jqXHR, textStatus, errorThrown) {
            	// Handle errors here
            	console.log('ERRORS: ' + textStatus);
            	
            	// STOP LOADING SPINNER if I had one
        	}
    	});
	}

	function submitEdit(event, id) {
  		// Create a jQuery object from the form
    	var formData = $("#song_edit_form").serialize();

	    // You should sterilise the file names
	    formData = formData + '&id=' + id;

	    $.ajax({
	        url: 'functions/song_file_edit.php?song',
	        type: 'POST',
	        data: formData,
	        cache: false,
	        dataType: 'json',
	        success: function(response, textStatus, jqXHR) {
	        	if (!response.Success) {
	        		// Some error is present
	        		$("#edit_message").text(response.Message).addClass("show_error");
	        	} else {
	        		$("#edit_message").empty().removeClass("show_error");
	        		$("#song_edit").hide();
	        		$("#song_list").show();
	        		$("#upload_link").text("Upload");

	        		$("#song_edit input").each(function() {
						if ($(this).attr("type") != "submit") {
							$(this).val("");
						}
					});
					$("#song_edit textarea").each(function() {
						$(this).val("");
					});
					$("#song_edit .form_lyric_container").remove();

    				getSongs(false);
    				// If the song is currently in the player, then we have to change the settings as well, particularly the title, artist, and details
    				if (currentSong == id) {
					    $("#player_1_song_title").html(response.Replace.title);
					    $("#player_1_song_artist").text(response.Replace.artist);

					    setLyricTimes(response.Replace.lyrics_array);
	   					$("#player_1_lyrics").html(response.Replace.lyrics_string);

					    $("#player_1_year").text(response.Replace.year);
					    $("#player_1_composer").html(response.Replace.composer);
					    $("#player_1_comments").html(response.Replace.comments);
    				}
    				// Empty all entries within the upload form
	    			$("#song_edit input").each(function() {
	    				if ($(this).attr("type") != "submit") {
	    					$(this).val("");
	    				}
    				});
	        	}
	            console.log(response);
	        },
	        error: function(jqXHR, textStatus, errorThrown) {
	            // Handle errors here
	            console.log('ERRORS: ' + textStatus);
	        },
	        complete: function() {
	            // STOP LOADING SPINNER
	        }
	    });
	}




	// -------------------------------------------
    /* AJAX form for creating a playlist */
    // -------------------------------------------
    /*
    $("#playlist_create_form").on("submit", function(event) {
    	event.stopPropagation(); // Stop stuff happening
    	event.preventDefault(); // Totally stop stuff happening

    	var formData = $(this).serialize();
    	createPlaylist(formData);
    })

    function createPlaylist(data) {
    	$.ajax({
	        url: 'functions/playlist_create.php?create',
	        type: 'POST',
	        data: data,
	        cache: false,
	        dataType: 'json',
	        success: function(response, textStatus, jqXHR) {
	        	if (!response.Success) {
	        		// Some error is present
	        		$("#playlist_create_main_error").text(response.Message).addClass("show_error");
	        	} else {
	        		$("#playlist_create_main_error").empty().removeClass("show_error");
	        		$("#playlist_create_main_container").hide();
	        		$("#song_list").show();
    				getSongs(false);
    				// Empty all entries within the upload form
					$("#playlist_create_form #playlist_create_title").val("");
					$("#playlist_create_form #playlist_create_description").empty();
	        	}
	            console.log(response);
	        },
	        error: function(jqXHR, textStatus, errorThrown) {
	            // Handle errors here
	            console.log('ERRORS: ' + textStatus);
	        },
	        complete: function() {
	            // STOP LOADING SPINNER
	        }
	    });
    }




	// -------------------------------------------
    /* AJAX form for deleting a song */
    // -------------------------------------------
    /*
    $(document).on("click", ".song .song_options_delete", function() {
    	var data = $(this).attr("data-src");
    	deleteSong(data);
    	return false;
    });

    function deleteSong(data) {
    	var data = "id="+data;
    	$.ajax({
	        url: 'functions/delete.php?song',
	        type: 'POST',
	        data: data,
	        cache: false,
	        dataType: 'json',
	        success: function(response, textStatus, jqXHR) {
	        	if (!response.Success) {
	        		// Some error is present
					alert(response.Message);
				} else {
	        		getSongs(false);
	        	}
	        	console.log(response);
	        },
	        error: function(jqXHR, textStatus, errorThrown) {
	            // Handle errors here
	            console.log('ERRORS: ' + errorThrown);
	        },
	        complete: function() {
	            // STOP LOADING SPINNER
	        }
	    });
    }
*/

});