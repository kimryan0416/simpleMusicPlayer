$(document).ready(function() {
    createMedia();
	volumeAdjust(player.volume.val());

	$(document).on("click", "#media .song", function() {
		var id = $(this).attr("data-id");
        var type = $(this).attr("data-albumType");
		var album = $(this).attr("data-album");
        currentSong = id;
		currentAlbum = album;
        currentType = type;
		if (type == "audio" || type == "playlist") {
			updateLoop();
			setShuffle();
			prepareAudio(id);
		} else if ( type == "movie" ) {
			pauseAudio();
			prepareVideo(id);
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
    
	player.pause.on("click", pauseAudio);
	player.play.on("click", startAudio);
	player.time_slider.on("input", function() { timeAdjust($(this).val());	});	// Moving the slider adjusts the audio's time
    player.forward.on("click", forwardAudio);
    player.back.on("click", backAudio);
	player.audio.on("ended", nextAudio);
	player.previous.on("click", previousAudio);
	player.next.on("click", nextAudio);
    player.volume.on( "input", function() { volumeAdjust($(this).val()); 	});
    player.repeat.on("click", setLoop);
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
   


    video.background.on("click", function() {
    	pauseVideo();
    	video.container.hide();
    });
    video.time_slider.on("input", function() { videoTimeAdjust($(this).val());	});	// Moving the slider adjusts the video's time
    video.pause.on("click", pauseVideo);
    video.play.on("click", startVideo);
    video.forward.on("click", forwardVideo);
    video.back.on("click", backVideo);
    video.volume.on( "input", function() { videoVolumeAdjust($(this).val()); });
});