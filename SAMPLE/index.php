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
			"medium" => $row["medium"],
			"url" => $row["url"]
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
		<script src="scripts/script.js"></script>
	</head>
	<body>
		<div id="left">
			<div id="header">
				<!--<h1 id="header_title">Song List (SAMPLE)</h1>-->
				<div id="header_search_container">
					<select id="search_options">
						<option value="title">Title</option>
						<option value="artist">Artist</option>
						<option value="album">Album</option>
						<option value="album_artist">Album Artist</option>
					</select>
					<input type="text" id="search_input" placeholder="Type Here">
				</div>
			</div>
			<div id="left_content">
				<?php 
					//print_r($content);
					foreach($content as $index=>$album_artist) {
						echo '<div class="album_artist_div">';
						echo '<h1>'.$album_artist['name'].'</h1>';
						foreach ($album_artist['albums'] as $album_name=>$album) {
							echo '<div class="album" id="album_'.$album["id"].'">';
							echo '<div class="album_header">';
							echo '<div class="album_image_container">';
							echo '<img class="album_image" src="'.$album["art"].'" alt="">';
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
								echo "</div>";
							}
							echo '</div>';
						}
						echo '</div>';
					}
				?>
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
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</body>
</html>