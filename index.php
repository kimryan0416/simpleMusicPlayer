<?php
	require('scripts/config.php');
	// open connection to database
	if (!$db = open_or_init_sqlite_db("scripts/database.sqlite", "scripts/init.sql") ) die("ERROR WITH DATABASE CONNECTION");
	else if ( !makedirs('upload_directory/') ) die("ERROR SETTING UP \"upload_directory/\"");
	else if ( !makedirs('media/') ) die ("ERROR SETTING UP \"media/\"");
	else if ( !makedirs('art/') ) die("ERROR SETTING UP \"art\"");

	$content = array();
	$query = 'SELECT 
		T1.album_artist_id AS album_artist_id,
	    T3.name AS album_artist_name,
	    T1.album_id AS album_id, 
	    T2.name AS album_name,
	    T9.src AS album_art,
	    T5.id AS id,
	    T5.artist AS artist,
	    T5.title AS title,
	    T5.url AS url,
	    T5.medium AS medium,
	    T7.src AS art
	FROM albumToalbum_artist AS T1
	LEFT JOIN albums AS T2 ON T1.album_id = T2.id
	LEFT JOIN album_artists AS T3 on T1.album_artist_id = T3.id
	LEFT JOIN songToalbum AS T4 ON T1.album_id = T4.album_id
	LEFT JOIN music AS T5 ON T4.song_id = T5.id
    LEFT JOIN songToart AS T6 ON T5.id = T6.song_id 
    LEFT JOIN art AS T7 ON T6.art_id = T7.id 
    LEFT JOIN albumToart AS T8 ON T1.album_id = T8.album_id
    LEFT JOIN art AS T9 ON T8.art_id = T9.id
    WHERE T5.title IS NOT NULL OR T5.url IS NOT NULL
	ORDER BY album_artist_name, album_name, title';

	try {
		$music= exec_sql_query($db, $query)->fetchAll();
		foreach($music as $row) {
			$album_artist_name = $row['album_artist_name'] != null ? $row['album_artist_name'] : 'Unknown Album Artist';
			if ( $content[$album_artist_name] == null ) {
				$content[$album_artist_name] = array(
					'name' => $album_artist_name,
					'albums' => array()
				);
			}
			$album_name = $row['album_name'] != null ? $row['album_name'] : 'Unknown Album';
			$album_art = $row['album_art'] != null ? $row['album_art'] : 'assets/default_album_art.jpg';
			$album_id = $row['album_id'];
			if ( $content[$album_artist_name]['albums'][$album_name] == null ) {
				$content[$album_artist_name]['albums'][$album_name] = array(
					'art' => $album_art,
					'id' => $album_id,
					'songs' => array()
				);
			}  
			$content[$album_artist_name]['albums'][$album_name]['songs'][] = array(
				'id' => $row['id'],
				'title' => $row['title'],
				'artist' => $row['artist'],
				'medium' => $row['medium'],
				'url' => $row['url']
			);
		}
	} 
	catch (PDOException $exception) {
		die($exception);
	}

	/*
	require('scripts/config.php');
	$content = array();
	$query = 'SELECT 
		T1.album_artist_id AS album_artist_id,
	    T3.name AS album_artist_name,
	    T1.album_id AS album_id, 
	    T2.name AS album_name,
	    T9.src AS album_art,
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
    RIGHT OUTER JOIN albumToart AS T8 ON T1.album_id = T8.album_id
    RIGHT OUTER JOIN art AS T9 ON T8.art_id = T9.id
    WHERE T5.title IS NOT NULL OR T5.url IS NOT NULL
	ORDER BY album_artist_name, album_name, title';
	$music = $db->query($query) or die('Error selecting all files from database');

	while ($row = $music->fetch_assoc()) {
		$album_artist_name = $row['album_artist_name'] != null ? $row['album_artist_name'] : 'Unknown Album Artist';
		if ( $content[$album_artist_name] == null ) {
			$content[$album_artist_name] = array(
				'name' => $album_artist_name,
				'albums' => array()
			);
		}
		$album_name = $row['album_name'] != null ? $row['album_name'] : 'Unknown Album';
		$album_art = $row['album_art'] != null ? $row['album_art'] : 'assets/default_album_art.jpg';
		$album_id = $row['album_id'];
		if ( $content[$album_artist_name]['albums'][$album_name] == null ) {
			$content[$album_artist_name]['albums'][$album_name] = array(
				'art' => $album_art,
				'id' => $album_id,
				'songs' => array()
			);
		}  
		$content[$album_artist_name]['albums'][$album_name]['songs'][] = array(
			'id' => $row['id'],
			'title' => $row['title'],
			'artist' => $row['artist'],
			'medium' => $row['medium'],
			'url' => $row['url']
		);
	}
	$db->commit();
	$db->close();
	*/
?>

<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
		<title>SimpleMusicPlayer</title>
		<link rel="stylesheet" type="text/css" href="styles/all.css">
		<script src="scripts/jquery-3.1.1.min.js"></script>
		<script src="https://www.youtube.com/iframe_api"></script>
		<script src="scripts/script.js"></script>
	</head>
	<body>

		<div id="left">
			<div id="left_inner">
				<span id="left_close">Close</span>		
				<div id="header">
					<div class="header_dropdown" id="header_settings">
						<img class="header_placeholder" src="assets/gear.png" alt="Settings">
						<div class="header_dropdown_contents">
							<span id="addMedia" class="header_dropdown_item">Add Song</span>
							<span id="openEmbed" class="header_dropdown_item">Add YT Video</span>
						</div>
					</div>
					<div id="header_search_container">
						<input type="text" id="search_input" placeholder="Type Here">
					</div>
				</div>
				<div id="left_content">
					<?php 
						foreach($content as $index=>$album_artist) {
							echo '<div class="album_artist_div">';
							echo '<h1 class="album_artist_name">'.$album_artist['name'].'</h1>';
							foreach ($album_artist['albums'] as $album_name=>$album) {
								echo '<div class="album" id="album_'.$album['id'].'">';
								echo '<div class="album_header">';
								echo '<div class="album_image_container">';
								echo '<img class="album_image" src="'.$album['art'].'#'.time().'" alt="">';
								echo '<div class="addAlbumArt_button" data-id="'.$album['id'].'"></div>';
								echo '</div>';
								echo '<h2>'.$album_name.'</h2>';
								echo '</div>';
								foreach($album['songs'] as $song) {
									echo '<div class="song" id="'.$song['id'].'" data-id="'.$song['id'].'" data-medium="'.$song['medium'].'">';
									if ($song['medium'] == 1) {
										echo '<img class="video_icon" src="assets/youtube.png" alt="YouTube">';
										echo '<span class="video_title">'.$song['title'].'</span>';
										echo '<span class="video_artist">'.$song['artist'].'</span>';
									} else {
										echo '<span class="song_title">'.$song['title'].'</span>';
										echo '<span class="song_artist">'.$song['artist'].'</span>';
									}
									echo '<img class="song_options" src="assets/options.png" alt="Song Options">';
									echo '</div>';
								}
								echo '</div>';
							}
							echo '</div>';
						}
					?>
				</div>
				<form id="video_input_form" name="video_input_form" method="post" class="closed">
					<span id="video_input_total_error">Test</span>
					<span id="closeEmbed">Cancel</span>
					<div class="video_input_container">
						<div class="label_container"><span class="label">Title</span><span class="important">*</span></div>
						<input class="video_input" name="video_title_input" id="video_title_input" placeholder="Title" required>
						<span class="video_input_error" id="video_input_title_error"></span>
					</div>
					<div class="video_input_container">
						<div class="label_container"><span class="label">Artist</span><span class="important">*</span></div>
						<input class="video_input" name="video_artist_input" id="video_artist_input" placeholder="Artist" required>
						<span class="video_input_error" id="video_input_artist_error"></span>
					</div>
					<div class="video_input_container">
						<div class="label_container"><span class="label">Album</span><span class="important">*</span></div>
						<input class="video_input" name="video_album_input" id="video_album_input" placeholder="Album" required>
						<span class="video_input_error" id="video_input_album_error"></span>
					</div>
					<div class="video_input_half_container left">
						<div class="label_container"><span class="label">Album Artist</span><span class="important">*</span></div>
						<input class="video_input" name="video_album_artist_input" id="video_album_artist_input" placeholder="Album Artist" required>
						<span class="video_input_error" id="video_input_album_artist_error"></span>
					</div>
					<div class="video_input_half_container right">
						<span class="label">Composer</span>
						<input class="video_input" name="video_composer_input" id="video_composer_input" placeholder="Composer">
					</div>
					<div class="video_input_container">
						<span class="label">Video ID</span>
						<input class='video_input' name='video_url_input' id='video_url_input' placeholder='Video ID' required> 
						<span class="video_input_error" id="video_input_url_error"></span>
					</div>
					<input type="submit" id="video_input_submit" name="video_input_submit" value="Add Video">
				</form>
			</div>
		</div>
		<div id="main" class="left_opened">
			<img id="player_background" src="assets/default_player_background.jpg" alt="">
			<div id="media_container">
				<div id="video_container" class="closed">
					<div id="video_embed_container">
						<div id="video_embed_inner_container">
							<div id="video_embed"></div>
							<video id="localVideo" src="" preload="none" ontimeupdate="onTimeUpdate(this);">
								Your browser does not support the audio element.
							</video>
							<div id="video_title_and_artist">
								<div id="video_title_and_artist_inner_container">
									<div id="video_title_container"><h1 id="video_title"></h1></div>
									<div id="video_artist_container"><span id="video_artist"></span></div>
								</div>
							</div>
							<div id="video_lyrics_container">
								<div id="video_lyrics_inner_container"></div>
							</div>
							<div id="video_extras_container">
								<div id="video_extras_inner_container">
									<div id="video_time_container">
										<span class="video_time" id="video_curTime"></span>
										<input type="range" min="0" max="100" id="video_time_slider">
										<span class="video_time" id="video_duration"></span>
									</div>
									<div class="video_extras_button_container" id="video_previous">
										<img class="video_extras_button" src="assets/previous_white.png" alt="Previous">
									</div>
									<div class='video_extras_button_container' id='video_backFive'>
										<img class="video_extras_button" src="assets/back_white.png" alt="-5sec">
									</div>
									<div class='video_extras_button_container' id='video_play'>
										<img class="control" src="assets/start_white.png" alt="Play">
									</div>
									<div class='video_extras_button_container hiddenControl' id='video_pause'>
										<img class="control hiddenControl" src="assets/pause_white.png" alt="Pause">
									</div>
									<div class='video_extras_button_container' id='video_forwardFive'>
										<img class="control" src="assets/forward_white.png" alt="+5sec">
									</div>
									<div class="video_extras_button_container" id="video_next">
										<img class="video_extras_button" src="assets/next_white.png" alt="Next">
									</div>
									<div id="video_volume_container">
										<input type="range" min="0" max="100" value="100" id="video_volume">
									</div>
									<div class="video_extras_button_container" id="video_repeat">
										<img class="video_extras_button" id="video_repeat_image" src="assets/repeat_1_white.png" alt="Video Repeat">
									</div>
									<div class="video_extras_button_container" id="video_shuffle">
										<img class="video_extras_button" id="video_shuffle_image" src="assets/shuffle_0_white.png" alt="Video Shuffle">
									</div>
									<div class="video_extras_button_container" id="video_options">
										<img class="video_extras_button" id="video_options_image" src="assets/options.png" alt="Edit Media Info">
									</div>
									<span class="video_extras_button_container active" id="video_lyrics_autoscroll">Autoscroll</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div id="player_container">
					<audio id="audio" src="" preload="none" ontimeupdate="onTimeUpdate(this);">
						Your browser does not support the audio element.
					</audio>
					<div id="player_main_div">
						<div id="player_art_and_lyrics">
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
						</div>
						<div id="player_info">
							<div id="player_title_and_artist">
								<div id="player_title_container">
									<h1 id="player_title">Choose a Song</h1>
								</div>
								<div id="player_artist_container">
									<span id="player_artist">Artist</span>
								</div>
							</div>
							<div id="time_container">
								<span class="player_time" id="curTime">--:--</span>
								<input type="range" min="0" max="0" id="time_slider">
								<span  class="player_time" id="duration">--:--</span>
							</div>
							<div id="controls_container">
								<img class="control" id="previous" src="assets/previous.png" alt="Previous">
								<img class="control" id="backFive" src="assets/back.png" alt="-5sec">
								<img class="control" id="play" src="assets/start.png" alt="Play">
								<img class="control hiddenControl" id="pause" src="assets/pause.png" alt="Pause">
								<img class="control" id="forwardFive" src="assets/forward.png" alt="+5sec">
								<img class="control" id="next" src="assets/next.png" alt="Next">
							</div>
							<div id="extras_container">
								<div id="volume_container">
									<input type="range" min="0" max="100" value="100" id="volume">
									<div id="volume_image_container">
										<img id="volume_image" src="assets/mute.png" alt="Volume">
									</div>
								</div>
								<div class="extras_button_container" id="repeat">
									<img class="extras_button" id="repeat_image" src="assets/repeat_1.png" alt="Repeat">
								</div>
								<div class="extras_button_container" id="shuffle">
									<img class="extras_button" id="shuffle_image" src="assets/shuffle_0.png" alt="Shuffle">
								</div>
								<div class="extras_button_container" id="options">
									<img class="extras_button" id="options_image" src="assets/options.png" alt="Edit Media Info">
								</div>
								<span class="extras_button_container active" id="player_lyrics_autoscroll">Autoscroll</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div id="right">
			<div id="right_inner">
				<span id="closeEdit">Close Edit</span>
				<form id="edit_media_form" name="edit_media_form" method="post">
					<div id="edit_media_form_nav">
						<span class="edit_media_form_nav_item selected" id="edit_media_nav_details" data-item="0">Details</span>
						<div class="edit_media_form_nav_divider"></div>
						<span class="edit_media_form_nav_item" id="edit_media_nav_lyrics" data-item="1">Lyrics</span>
						<div class="edit_media_form_nav_divider"></div>
						<span class="edit_media_form_nav_item" id="edit_media_nav_art" data-item="2">Art</span>
					</div>
					<div id="edit_media_form_contents">
						<div class="edit_media_form_inner_contents selected" id="edit_media_form_details">
							<div class="song_edit_div">
								<span class="song_edit_label">Title:</span>
								<input class="song_edit_input" type="text" id="title_edit" name="title_edit" placeholder="Title">
							</div>
							<div class="song_edit_div">
								<span class="song_edit_label">Artist:</span>
								<input class="song_edit_input" type="text" id="artist_edit" name="artist_edit" placeholder="Artist">
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
							<div class="song_edit_div" id="video_id_edit_container">
								<span class="song_edit_label">YouTube Video ID</span>
								<input class="song_edit_input" type="text" id="video_id_edit" name="video_id_edit" placeholder="Video ID" required>
							</div>
						</div>
						<div class="edit_media_form_inner_contents" id="edit_media_form_lyrics">
							<div class="song_edit_div" id="song_edit_lyrics_main_container">
								<div id="song_edit_lyrics_setting_container">
									<span class="song_edit_label" id="song_edit_lyrics_label">Lyrics</span>
									<div id="song_edit_lyrics_type_container">
										<div class="song_edit_lyric_dynamic_container">
											<input type="radio" name="lyric_dynamic_toggle" id="lyric_dynamic_false" value="0">
											<span class="lyric_dynamic_value">Simple</span>
										</div>
										<div class="song_edit_lyric_dynamic_container">
											<input type="radio" name="lyric_dynamic_toggle" id="lyric_dynamic_true" value="1">
											<span class="lyric_dynamic_value">Dynamic</span>
										</div>
									</div>
								</div>
								<div id="song_edit_lyrics_textbox_container">
									<div id="song_edit_lyrics_simple_container" class="song_edit_lyrics_text_container selected">
										<textarea class="song_edit_input" id="simple_lyrics_edit" name="simple_lyrics_edit" placeholder="Lyrics"></textarea>
									</div>
									<div id="dynamic_lyrics_edit_container" class="song_edit_lyrics_text_container">
										<div id="dynamic_lyrics_edit_add_segment_container">
											<span id="dynamic_lyrics_edit_add_segment">Add Lyric Segment</span>
										</div>
										<div id="dynamic_lyrics_edit_inner_container"></div>
									</div>
								</div>
							</div>
						</div>
						<div class="edit_media_form_inner_contents" id="edit_media_form_art">
							<div class="song_edit_div" id="song_edit_art_container">
								<div id="song_edit_art_inner_container">
									<img id="art_edit_display" src="assets/default_album_art.jpg" alt="Media Art">
								</div>
							</div>
							<div class="song_edit_div" id="song_edit_art_alternatives_container">
								<label for="art_edit" id="art_edit_overlay">Upload New Icon</label>
								<input class="song_edit_input" type="file" id="art_edit" name="art_edit">
								<div id="song_edit_art_alternatives_inner_container">
									<span id="song_edit_art_alternatives_inner_container_activator">Use other media's artwork</span>
								</div>
							</div>
						</div>
					</div>
					<div id="song_edit_submit_container">
						<input type="hidden" id="id_edit" name="id_edit" value="-1">
						<input type="hidden" id="medium_edit" name="medium_edit" value="-1">
						<input type="submit" id="submit_edit" name="submit_edit" value="Submit Changes" form='edit_media_form'>
						<span id="delete_song_submit">Delete Media</span>
					</div>
				</form>
				<form id="edit_album_art_form" name="edit_album_art_form" method="post">
					<div id="edit_album_art_form_art">
						<div id="edit_album_art_form_art_container">
							<div id="edit_album_art_form_art_inner_container">
								<img id="edit_album_art_form_display" src="assets/default_album_art.jpg" alt="Media Art">
							</div>
						</div>
						<div class="" id="edit_album_art_form_art_alternatives_container">
							<label for="edit_album_art_form_input" id="edit_album_art_form_overlay">Upload New Album Art</label>
							<input type="file" id="edit_album_art_form_input" name="edit_album_art_form_input">
							<div id="edit_album_art_form_art_alternatives_inner_container"></div>
						</div>
					</div>
					<div id="edit_album_art_form_submit_container">
						<input type="submit" id="edit_album_art_form_submit" name="edit_album_art_form_submit" value="Submit Changes">
					</div>
				</form>
			</div>
		</div>

	</body>
</html>