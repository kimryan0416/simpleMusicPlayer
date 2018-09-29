<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title>SimpleMusicPlayer</title>
		<link rel="stylesheet" type="text/css" href="styles/all.css">
		<script src="scripts/jquery-3.1.1.min.js"></script>
		<script src="scripts/audio-metadata.min.js"></script>
		<!--<script src="scripts/main.js"></script>-->
		<script src="media_player/media_player.js"></script>
		<script src="scripts/script.js"></script>
	</head>
	<body>
		<div id="top">
			<span class="top_button" id="reboot_button">Reboot Media</span>
			<span id="update_message">Update Successful</span><span id="update_progress"></span>
			<div id="nav">
				<div class="dropdown_container">
					<span class="nav_item opened_nav" id="songs_button">Songs</span>
					<!--
					<div class="dropdown">
						<span class="dropdown_item" id="upload_song">Upload Song</span>
					</div>
					-->
				</div>
				<div class="dropdown_container">
					<span class="nav_item" id="movies_button">Movies</span>
					<!--
					<div class="dropdown">
						<span class="dropdown_item" id="upload_movie">Upload Movie</span>
					</div>
					-->
				</div>
				<div class="dropdown_container">
					<span class="nav_item" id="playlists_button">Playlists</span>
					<div class="dropdown">
						<span class="dropdown_item" id="create_playlist">Create Playlist</span>
					</div>
				</div>
			</div>
		</div>
		<div id="submain">
			<div class="submain_half" id="player">
				<img id="player_background" src="assets/default_player_background.jpg" alt="">
				<div id="player_container">
					<audio id="audio" src="" preload="none" ontimeupdate="onTimeUpdate(this);">
						Your browser does not support the audio element.
					</audio>
					<div id="player_art_container">
						<img id="player_art" src="assets/default_album_art.jpg" alt="">
					</div>
					<span id="player_title"></span><span id="player_artist"></span>
					<div id="time_container">
						<span class="player_time" id="curTime">--:--</span>
						<input type="range" min="0" max="0" id="time_slider">
						<span  class="player_time" id="duration">--:--</span>
					</div>
					<div id="controls_container">
						<img class="control" id="previous" src="assets/previous.png" alt="Previous">
						<img class="control" id="backFive" src="assets/back.png" alt="-5sec">
						<img class="control" id="play" src="assets/start.png" alt="Play">
						<img class="control" id="pause" src="assets/pause.png" alt="Pause">
						<img class="control" id="forwardFive" src="assets/forward.png" alt="+5sec">
						<img class="control" id="next" src="assets/next.png" alt="Next">
					</div>
					<div id="extras_container">
						<img id="repeat" src="assets/repeat_0.png" alt="Repeat">
						<div id="volume_container">
							<input type="range" min="0" max="100" value="100" id="volume">
							<img id="volume_image" src="assets/mute.png" alt="Volume">
						</div>
						<img id="shuffle" src="assets/shuffle_0.png" alt="Shuffle">
					</div>
					<p id="player_lyrics"></p>
				</div>
			</div>
			<div class="submain_half" id="media">
				<div class="media_content" id="songs_list"></div>
				<div class="media_content" id="movies_list"></div>
				<div class="media_content" id="playlists_list"></div>
				<!--
				<div class="album" data-id="null">
					<h2 class="album_title">Vocaloids</h2>
					<div class="songs"></div>
				</div>
				-->
			</div>
		</div>
		<div id="video_container">
			<div id="video_background"></div>
			<div id="video_stuff_container">
				<div id="video_stuff">
					<video id="video" src="" preload="none" ontimeupdate="onTimeUpdateVideo(this);">
						Your browser does not support the audio element.
					</video>
					<div id="video_text">
						<span id="video_title"></span><span id="video_artist"></span>
					</div>
					<div id="video_panel">
						<div id="video_time_container">
							<input type="range" min="0" max="0" id="video_slider">
						</div>
						<div id="video_controls_container">
							<img class="video_control" id="video_play" src="assets/start_white.png" alt="Play">
							<img class="video_control" id="video_pause" src="assets/pause_white.png" alt="Pause">
							<img class="video_control" id="video_back" src="assets/back15_white.png" alt="-15sec">
							<img class="video_control" id="video_forward" src="assets/forward15_white.png" alt="+15sec">
							<span class="video_time" id="video_curTime">--:--</span><span class="video_time" id="video_time_divider"> / </span><span  class="video_time" id="video_duration">--:--</span>
							<div id="video_volume_container">
								<input type="range" min="0" max="100" value="100" id="video_volume">
								<img id="video_volume_image" src="assets/mute_white.png" alt="Volume">
							</div>
							<!--<span id="video_full">Fullscreen</span>-->
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="create_container" id="create_playlist_container">
			<div class="create_subcontainer">
				<form id="create_playlist_form" class="form" name="create_playlist_form" method="post" action="index.php">
					<img class="exit_create" id="exit_create_playlist" src="media_player/assets/exit.png" alt="Cancel">
					<div class="full_width_input">
						<span class="label">Name of Playlist</span>
						<input type="text" class="text_input" id="create_playlist_name" name="name" required>
						<span class="form_error">Error</span>
					</div>
					<div>
						<div class="half_width_input left_input">
							<span class="label">Description</span>
							<textarea class="textarea_input" id="create_playlist_description" name="description"></textarea>
						</div>
						<div class="half_width_input right_input">
							<span class="label">Songs To Add</span>
							<div id="create_playlist_songs"></div>
						</div>
					</div>
					<span class="form_error" id="create_playlist_error"></span>
					<input type="submit" class="form_submit" name="submit" value="Create Playlist">
				</form>
			</div>
		</div>
	</body>
</html>