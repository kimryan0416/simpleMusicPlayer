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
	    T7.src AS art
	FROM albumToalbum_artist AS T1
	RIGHT OUTER JOIN albums AS T2 ON T1.album_id = T2.id
	RIGHT OUTER JOIN album_artists AS T3 on T1.album_artist_id = T3.id
	RIGHT OUTER JOIN songToalbum AS T4 ON T1.album_id = T4.album_id
	RIGHT OUTER JOIN music AS T5 ON T4.song_id = T5.id
	RIGHT OUTER JOIN songToart AS T6 ON T5.id = T6.song_id 
    RIGHT OUTER JOIN art AS T7 ON T6.art_id = T7.id 
	WHERE T5.medium = 0 AND (T5.title IS NOT NULL OR T5.url IS NOT NULL)
	ORDER BY album_artist_name, album_name, title";
	$music = $db->query($query) or die("Error selecting all files from database");

	while ($row = $music->fetch_assoc()) {
		$album_artist_name = $row["album_artist_name"] != null ? $row["album_artist_name"] : "Unknown Album Artist";
		$album_artist_id = $row["album_artist_id"];
		if ( $content[$album_artist_name] == null ) {
			$content[$album_artist_name] = array(
				"name" => $album_artist_name,
				"id" => $album_artist_id,
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
		<title>SMP - Mobile</title>
		<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
		<link rel="stylesheet" type="text/css" href="styles/mobile.css">
		<script src="scripts/jquery-3.1.1.min.js"></script>
		<script src="scripts/mobile.js"></script>
	</head>
	<body>
		<div id="content">
			<div id="media_container" class="content_item selected">
				<div id="media_relative_container">
				<div id="media_header" class="header">
					<!--<input type="text" id="search_input" placeholder="Type Here">-->
					<h1 class="header_text">Songs</h1>
					<span class="header_forward_button" id="open_player" onclick="openPlayer();">Player</span>
				</div>
					<div id="media_contents">
					<?php 
						foreach($content as $album_artist_content) {
							echo "<div class=\"album_artist_albums\" id=\"album_artist_albums_".$album_artist_content["id"]."\">";
							foreach($album_artist_content["albums"] as $album_name=>$album) {
								echo "<div class=\"album_item\">";
									echo "<div class=\"album_title_container\">";
										echo "<div class=\"album_art_container\">";
											echo "<img src=\"".$album["art"]."\" alt=\"Album Art\">";
										echo "</div>";
										echo "<h2 class=\"album_title\">".$album_name."</h2>";
									echo "</div>";
									echo "<div class=\"album_songs\">";
									foreach($album["songs"] as $song) {
										if ($song["medium"] != 1) {
										echo "<div class=\"song\" id=\"".$song["id"]."\" data-id=\"".$song["id"]."\" data-album=\"".$album["id"]."\" data-album-artist=\"".$album_artist_content["id"]."\" onclick=\"songClicked(".$song["id"].", ".$album["id"].", ".$album_artist_content["id"].");\">";
											echo "<span class=\"song_title\">".$song["title"]."</span>";
											echo "<span class=\"song_artist\">".$song["artist"]."</span>";
										echo "</div>";
										}
									}
									echo "</div>";
								echo "</div>";
							}
							echo "</div>";
						}

					?>
					</div>
				</div>
			</div>
			<div id="player_container" class="content_item">
				<audio id="audio" src="" preload="none" ontimeupdate="onTimeUpdate(this);" autoplay="off">
					Your browser does not support the audio element.
				</audio>
				<div id="player_relative_container">
					<div id="player_header" class="header">
						<span class="header_back_button" id="back_to_albums" onclick="closePlayer();">Media</span>
					</div>
					<div id="player_art_and_lyrics" onclick="toggleLyrics();">
						<div id="player_lyrics"></div>
						<img id="player_art" src="assets/default_album_art.jpg" alt="">
					</div>
					<div id="player_controls">
						<div id="player_title_container">
							<h2 id="player_title">Test Title</h2>
						</div>
						<div id="player_artist_container">
							<span id="player_artist">Test Artist</span>
						</div>
						<div id="time_container">
							<span class="player_time" id="curTime">--:--</span>
							<input type="range" min="0" max="0" id="time_slider">
							<span  class="player_time" id="duration">--:--</span>
						</div>
						<div id="controls_container">
							<img class="control" id="previous" src="assets/previous_white.png" alt="Previous" onclick="previousAudio();">
							<img class="control" id="backFive" src="assets/back_white.png" alt="-5sec" onclick="backFiveAudio();">
							<img class="control" id="play" src="assets/start_white.png" alt="Play" onclick="playAudio();">
							<img class="control hiddenControl" id="pause" src="assets/pause_white.png" alt="Pause" onclick="pauseAudio();">
							<img class="control" id="forwardFive" src="assets/forward_white.png" alt="+5sec" onclick="forwardFiveAudio();">
							<img class="control" id="next" src="assets/next_white.png" alt="Next" onclick="nextAudio();">
						</div>
						<div id="extras_container">
							<img id="repeat" class="extras_control" src="assets/repeat_1_white.png" alt="Repeat" onclick="toggleLoop();">
							<input type="range" min="0" max="100" value="50" id="volume">
							<img id="shuffle" class="extras_control" src="assets/shuffle_0_white.png" alt="Shuffle" onclick="toggleShuffle();">
						</div>
					</div>
				</div>
			</div>
		</div>
	</body>
</html>