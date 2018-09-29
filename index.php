<?php
	require("scripts/config.php");

	$content = array();

	$query = "SELECT 
		T1.album_artist_id AS album_artist_id,
	    T3.name AS album_artist_name,
	    T1.album_id AS album_id, 
	    T2.name AS album_name,
	    T2.art AS album_art,
	    T5.id AS id,
	    T5.artist AS artist,
	    T5.title AS title,
	    T5.url AS url,
	    T5.medium AS medium,
	    T5.art AS art
	FROM albumToalbum_artist AS T1
	RIGHT OUTER JOIN albums AS T2 ON T1.album_id = T2.id
	RIGHT OUTER JOIN album_artists AS T3 on T1.album_artist_id = T3.id
	RIGHT OUTER JOIN songToalbum AS T4 ON T1.album_id = T4.album_id
	RIGHT OUTER JOIN music AS T5 ON T4.song_id = T5.id
	ORDER BY album_artist_name, album_name, title";
	$music = $db->query($query) or die("Error selecting all files from database");

	while ($row = $music->fetch_assoc()) {
		$album_artist_name = $row["album_artist_name"] != null ? $row["album_artist_name"] : "Unknown Album Artist";
		if ( $content[$album_artist_name] == null ) {
			$content[$album_artist_name] = array(
				"name" => $album_artist_name,
				"albums" => array()
			);
		}
		$album_name = $row["album_name"] != null ? $row["album_name"] : "Unknown Album";
		$album_art = $row["album_art"] != null ? $row["album_art"] : "assets/default_album_art.jpg";
		$album_id = $row["album_id"];
		if ( $content[$album_artist_name]["albums"][$album_name] == null ) {
			$content[$album_artist_name]["albums"][$album_name] = array(
				"art" => $album_art,
				"id" => $album_id,
				"songs" => array()
			);
		}  
		$content[$album_artist_name]["albums"][$album_name]["songs"][] = array(
			"id" => $row["id"],
			"title" => $row["title"],
			"artist" => $row["artist"],
			"medium" => $row["medium"]
		);
	}
	$db->close();
?>

<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title>SimpleMusicPlayer</title>
		<link rel="stylesheet" type="text/css" href="styles/all.css">
		<script src="scripts/jquery-3.1.1.min.js"></script>
		<script src="scripts/mediabuffer-min.js"></script>
		<script src="scripts/script.js"></script>
	</head>
	<body>
		<div id="left">
			<div id="header">
				<div class="header_dropdown" id="header_settings">
					<img class="header_placeholder" src="assets/gear.png" alt="Settings">
					<div class="header_dropdown_contents">
						<label id="addMedia" class="header_dropdown_item" for="addMedia_input">Add Song</label>
						<input type="file" id="addMedia_input" name="addMedia_input">
						<span id="openEmbed" class="header_dropdown_item">Add YT Video</span>
						<span id="reloadMedia" class="header_dropdown_item" onclick="reloadMedia();">Reload Media</span>
					</div>
				</div>
				<h1 id="header_title">Song List</h1>
			</div>
			<input type="file" id="addAlbumArt_input" name="addAlbumArt_input">
			<div id="left_content">
				<?php 
					//print_r($content);
					foreach($content as $index=>$album_artist) {
						echo '<div class="album_artist_div">';
						echo '<h1>'.$album_artist['name'].'</h1>';
						foreach ($album_artist['albums'] as $album_name=>$album) {
							echo '<div class="album">';
							echo '<div class="album_header">';
							echo '<div class="album_image_container">';
							echo '<img class="album_image" src="'.$album["art"].'" alt="">';
							echo '<label class="addAlbumArt_label" data-id="'.$album["id"].'" for="addAlbumArt_input"></label>';
							echo '</div>';
							echo '<h2>'.$album_name.'</h2>';
							echo '</div>';
							foreach($album["songs"] as $song) {
								echo "<div class=\"song\" id=\"".$song['id']."\" data-id=\"".$song['id']."\" data-medium=\"".$song['medium']."\">";
								if ($song["medium"] == 1) {
									echo "<img class=\"video_icon\" src=\"assets/youtube.png\" alt=\"YouTube\">";
									echo "<span class=\"video_title\">".$song['title']."</span>";
									echo "<span class=\"video_artist\">".$song['artist']."</span>";
								} else {
									echo "<span class=\"song_title\">".$song['title']."</span>";
									echo "<span class=\"song_artist\">".$song['artist']."</span>";
								}
								echo "<img class=\"song_options\" src=\"assets/options.png\" alt=\"Song Options\">";
								echo "</div>";
							}
							echo '</div>';
						}
						echo '</div>';
					}
				?>
			</div>
			<form id="video_input_form" name="video_input_form" method="post" class="closed">
				<span id="closeEmbed">Cancel</span>
				<div class="video_input_container">
					<span class="label">Title</span>
					<input class="video_input" name="video_title_input" id="video_title_input" placeholder="Title" required>
				</div>
				<div class="video_input_container">
					<span class="label">Artist</span>
					<input class="video_input" name="video_artist_input" id="video_artist_input" placeholder="Artist" required>
				</div>
				<div class="video_input_container">
					<span class="label">Album</span>
					<input class="video_input" name="video_album_input" id="video_album_input" placeholder="Album" required>
				</div>
				<div class="video_input_half_container left">
					<span class="label">Album Artist</span>
					<input class="video_input" name="video_album_artist_input" id="video_album_artist_input" placeholder="Album Artist" required>
				</div>
				<div class="video_input_half_container right">
					<span class="label">Composer</span>
					<input class="video_input" name="video_composer_input" id="video_composer_input" placeholder="Composer">
				</div>
				<div class="video_input_container">
					<span class="label">Embed URL</span>
					<textarea class="video_input" name="video_url_input" id="video_url_input" placeholder="EMBED URL" required></textarea>
				</div>
				<input type="submit" id="video_input_submit" name="video_input_submit" value="Add Video">
			</form>
			</div>
		</div>
		<div id="right">
			<img id="player_background" src="assets/default_player_background.jpg" alt="">
			<div id="media_container">
				<div id="video_container" class="closed">
					<div id="video_embed_container">
						<div id="video_embed_inner_container">
							<iframe id="video_embed" src="" allow="autoplay; encrypted-media" allowfullscreen></iframe>
						</div>
					</div>
				</div>
				<div id="player_container">
					<audio id="audio" src="" preload="none" ontimeupdate="onTimeUpdate(this);">
						Your browser does not support the audio element.
					</audio>
					<div id="player_main_div">
						<div id="player_art_and_lyrics">
							<div class="table">
								<div class="table_wrapper" id="player_art_container">
									<img id="player_art" src="assets/default_album_art.jpg" alt="">
								</div>
								<div class="table_wrapper" id="player_lyrics_container">
									<p id="player_lyrics">
										<span class="lyric_segment noText"></span>
										<span class="lyric_segment"><i>Lyrics go Here</i></span>
										<span class="lyric_segment"></span>
									</p>
								</div>
								<span id="player_lyrics_autoscroll">Autoscroll</span>
							</div>
						</div>
						<div id="player_info">
							<div>
								<h1 id="player_title">Choose a Song</h1>
								<span id="player_artist">Artist</span>
							</div>
							<div id="time_container">
								<span class="player_time" id="curTime">--:--</span>
								<input type="range" min="0" max="0" id="time_slider">
								<span  class="player_time" id="duration">--:--</span>
							</div>
							<div id="controls_container">
								<img class="control" id="previous" src="assets/previous.png" alt="Previous">
								<img class="control" id="backFive" src="assets/back.png" alt="-5sec" onclick="backwardAudio();">
								<img class="control" id="play" src="assets/start.png" alt="Play" onclick="startAudio();">
								<img class="control hiddenControl" id="pause" src="assets/pause.png" alt="Pause" onclick="pauseAudio();">
								<img class="control" id="forwardFive" src="assets/forward.png" alt="+5sec" onclick="forwardAudio();">
								<img class="control" id="next" src="assets/next.png" alt="Next">
							</div>
							<div id="extras_container">
								<img id="repeat" src="assets/repeat_1.png" alt="Repeat">
								<div id="volume_container">
									<input type="range" min="0" max="100" value="100" id="volume">
									<img id="volume_image" src="assets/mute.png" alt="Volume">
								</div>
								<img id="shuffle" src="assets/shuffle_0.png" alt="Shuffle">
								<img id="options" src="assets/options.png" alt="Edit Media Info">
							</div>
						</div>
					</div>
				</div>
			</div>
			<form id="edit_media_form" name="edit_media_form" method="post">
				<span id="closeEdit">X</span>
				<input class="song_edit_input" type="text" id="title_edit" name="title_edit" placeholder="Title">
				<input class="song_edit_input" type="text" id="artist_edit" name="artist_edit" placeholder="Artist">
				<div class="song_edit_div" id="song_edit_art_container">
					<img id="art_edit_display" src="assets/default_album_art.jpg" alt="Media Art">
					<label for="art_edit" id="art_edit_overlay">Change Icon</label>
					<input class="song_edit_input" type="file" id="art_edit" name="art_edit">
				</div>
				<div class="song_edit_div">
					<span class="song_edit_label">Album:</span>
					<input class="song_edit_input" type="text" id="album_edit" name="album_edit" placeholder="Album">
				</div>
				<div class="song_edit_half_div left_half">
					<span class="song_edit_label">Album Artist:</span>
					<input class="song_edit_input" type="text" id="albumArtist_edit" name="albumArtist_edit" placeholder="Album Artist">
				</div>
				<div class="song_edit_half_div right_half">
					<span class="song_edit_label">Composer:</span>
					<input class="song_edit_input" type="text" id="composer_edit" name="composer_edit" placeholder="Composer">
				</div>
				<div id="song_edit_padding_container">
					<div class="song_edit_half_div left_half">
						<span class="song_edit_label">Start Padding:</span>
						<input class="song_edit_input" type="text" id="start_padding_edit" name="start_padding_edit" placeholder="00:00">
					</div>
					<div class="song_edit_half_div right_half">
						<span class="song_edit_label">End Padding:</span>
						<input class="song_edit_input" type="text" id="end_padding_edit" name="end_padding_edit" placeholder="">
					</div>
				</div>
				<div class="song_edit_div">
					<span class="song_edit_label" id="song_edit_lyrics_label">Lyrics</span>
					<div id="song_edit_lyrics_type_container">
						<div class="song_edit_lyric_dynamic_container">
							<input type="radio" name="lyric_dynamic_edit" id="lyric_dynamic_false" value="0">
							<span class="lyric_dynamic_value">Simple</span>
						</div>
						<div class="song_edit_lyric_dynamic_container">
							<input type="radio" name="lyric_dynamic_edit" id="lyric_dynamic_true" value="1">
							<span class="lyric_dynamic_value">Dynamic</span>
						</div>
					</div>
					<textarea class="song_edit_input" id="lyrics_edit" name="lyrics_edit" placeholder="Lyrics"></textarea>
					<div id="dynamic_lyrics_edit_container">
						<div class="dynamic_lyrics_segment">
							<input type="text" id="dynamic_lyrics_start_0" class="dynamic_lyrics_time" name="dynamic_lyrics_start[]" placeholder="Start Time">
							<input type="text" id="dynamic_lyrics_end_0" class="dynamic_lyrics_time" name="dynamic_lyrics_end[]" placeholder="End Time">
							<textarea class="dynamic_lyrics_edit" id="dynamic_lyrics_edit_0" name="dynamic_lyrics_edit[]" placeholder="Lyrics" rows="4"></textarea>
						</div>
					</div>
				</div>
				<div id="song_edit_submit_container">
					<input type="hidden" id="id_edit" name="id_edit" value="-1">
					<input type="hidden" id="medium_edit" name="medium_edit" value="-1">
					<input type="submit" id="submit_edit" name="submit_edit" value="Submit Changes">
					<span id="delete_song_submit">Delete Media</span>
				</div>
			</form>
		</div>
	</body>
</html>