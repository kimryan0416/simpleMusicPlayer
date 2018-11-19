<?php
	require_once('scripts/newConfig.php');
	// open connection to database
	if (!$db = initSqliteDB('scripts/database.sqlite', 'scripts/init.sql') ) die('ERROR WITH DATABASE CONNECTION');
	if ( !file_exists('media/') && !mkdir('media/') ) die ("ERROR SETTING UP \"media/\"");
	if ( !file_exists('art/') && !mkdir('art/') ) die("ERROR SETTING UP \"art\"");
	if ( !file_exists('scripts/settings.json') ) {
		$settings = array(
			'listPos'=>false,
			'loop'=>1,
			'shuffle'=>0
		);
		$fp = fopen('scripts/settings.json', 'w');
		fwrite($fp, json_encode($settings));
		fclose($fp);
	}
	/*
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
		$music = execQuery($db, $query)->fetchAll();
	} 
	catch (PDOException $exception) {
		die($exception);
	}

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
	*/
?>

<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
		<title>SimpleMusicPlayer</title>
		<link rel="stylesheet" type="text/css" href="styles/all.css">
		<script src="https://www.youtube.com/iframe_api"></script>
	</head>
	<body>
		<canvas id='background'></canvas>
		<div id='contextMenu'>
			<span class='contextItem' id='contextOptions'>Edit Details</span>
		</div>
		<div id='bodyHeader'>
			<div id='innerHeader'>
				<div class='dropdown settings'>
					<!--<img class="dropdownPlaceholder" src="assets/gear.png" alt="Settings">-->
					<img class="dropdownPlaceholder" id='headerSettings' src="assets/transparent.png" alt="Settings">
					<div class="dropdownContents">
						<div class='dropdownArrow'></div>
						<div class='dropdownItems'>
							<span id='openAddMediaForm' class='dropdownItem settings'>Add Media</span>
							<span id="openEmbed" class="dropdownItem settings">Add YT Video</span>
							<span id='openEditSettingsForm' class='dropdownItem settings'>Edit Settings</span>
						</div>
					</div>
				</div>
				<span class='toggle' id='toggleList'>Toggle Song List</span>
				<div class='dropdown search'>
					<!--<img class='dropdownPlaceholder overlay' src='assets/search.png' alt='Search'>-->
					<img class='dropdownPlaceholder overlay' id='headerSearch' src='assets/transparent.png' alt='Search'>
					<input class='dropdownPlaceholder input' type="text" id="searchInput" placeholder="Type Here">
					<div class='dropdownContents'>
						<div class='dropdownArrow'></div>
						<div class='dropdownItems' id='searchResults'></div>
					</div>
				</div>
				<!--<span class='toggle left' id='toggleFullScreen'>Toggle Fullscreen</span>-->
			</div>
		</div>
		<div id='body'>
			<div id="list" class='left closed'>
				<div class='inner'>
					<div class='content list' id="listContent">
						<div id='listSongs' class='closed'>
							<?php 
							/*
								foreach($content as $index=>$album_artist) {
									echo '<div class="container albumArtist">';
									echo '<div class="item albumArtist"><h1>'.$album_artist['name'].'</h1></div>';
									foreach ($album_artist['albums'] as $album_name=>$album) {
										echo '<div class="container album" id="album_'.$album['id'].'">';
										echo '<div class="item album">';
										echo '<div class="container albumArt">';
										echo '<img class="item albumArt" src="'.$album['art'].'#'.time().'" alt="">';
										echo '<span class="item addAlbumArt_button" data-id="'.$album['id'].'">Change Artwork</span>';
										echo '</div>';
										//echo '<div class="albumArtistContainer">';
										echo '<h2>'.$album_name.'</h2>';
										//echo '</div>';
										echo '</div>';
										echo '<div class="container albumSongList">';
										foreach($album['songs'] as $song) {
											echo '<div class="item song" id="'.$song['id'].'" data-id="'.$song['id'].'" data-medium="'.$song['medium'].'">';
											if ($song['medium'] == 1) {
												echo '<img class="item icon" src="assets/youtube.png" alt="YouTube">';
											}
											else if ($song['medium'] == 2) {
												echo '<img class="item icon" src="assets/video.png" alt="Video">';
											}
											echo '<div class="container text">';
											echo '<span class="item title">'.$song['title'].'</span>';
											echo '<span class="item artist">'.$song['artist'].'</span>';
											echo '</div>';
											echo '<img class="item options" src="assets/options.png" alt="Song Options">';
											echo '</div>';
										}
										echo '</div>';
										echo '</div>';
									}
									echo '</div>';
								}
							*/
							?>
						</div>
						<form id='embedInputForm' name='video_input_form' method='post'>
							<div class='item header'>
								<div class='container header'>
									<span class='cancel hover' id='closeEmbed'>X</span>
									<h2 class='item formTitle'>Embed YouTube Video</h2>
								</div>
							</div>
							<div class='item innerForm'>
								<div class='container innerForm'>
									<div class='container segmentContainer'>
										<span class='item label'>Title<span class='important'>*</span></span>
										<input class='item inputText' name='video_title_input' placeholder='Title of Video' required>
										<span class='item inputError important' id='embed_title_Error'></span>
									</div>
									<div class='container segmentContainer'>
										<span class='item label'>Artist<span class='important'>*</span></span>
										<input class='item inputText' name='video_artist_input' placeholder='Artist' required>
										<span class='item inputError important' id='embed_artist_Error'></span>
									</div>
									<div class='container segmentContainer'>
										<span class='item label'>Album<span class='important'>*</span></span>
										<input class='item inputText' name="video_album_input" placeholder='Album' required>
										<span class='item inputError important' id='embed_album_Error'></span>
									</div>
									<div class='container segmentContainer half left'>
										<span class='item label'>Album Artist<span class='important'>*</span></span>
										<input class='item inputText' name='video_album_artist_input' placeholder='Album Artist' required>
										<span class='item inputError important' id='embed_album_artist_Error'></span>
									</div>
									<div class='container segmentContainer half right'>
										<span class='item item label'>Composer</span>
										<input class='item inputText' name="video_composer_input" placeholder='Composer'>
									</div>
									<div class='container segmentContainer'>
										<span class='item label'>Video ID<span class='important'>*</span></span>
										<input class='item inputText' name='video_url_input' placeholder='Video ID' required> 
										<span class="item inputError important" id="embed_url_Error"></span>
									</div>
								</div>
							</div>
							<div class='item submitContainer'>
								<input type='submit' class='item submitItem submit hover' name='video_input_submit' value='Add Video'>
							</div>
						</form>
						<form id="editMediaForm" name="edit_media_form" method="post">
							<div class='item header'>
								<div class='container header'>
									<span class='cancel hover' id="closeEdit">X</span>
									<h2 class='item formTitle'>Edit Media Info</h2>
								</div>
							</div>
							<div class='item innerForm'>
								<div class='container innerForm'>
									<div class='container segmentContainer'>
										<span class='item label'>Title:<span class='important'>*</span></span>
										<input class='item inputText' type='text' id='titleEdit' name='title_edit' placeholder='Title'>
									</div>
									<div class='container segmentContainer'>
										<span class='item label'>Artist:<span class='important'>*</span></span>
										<input class='item inputText' type='text' id='artistEdit' name='artist_edit' placeholder='Artist'>
									</div>
									<div class='container segmentContainer'>
										<span class='item label'>Album:<span class='important'>*</span></span>
										<input class='item inputText' type='text' id='albumEdit' name='album_edit' placeholder='Album'>
									</div>
									<div>
										<div class='container segmentContainer half left'>
											<span class='item label'>Album Artist:<span class='important'>*</span></span>
											<input class='item inputText' type='text' id='albumArtistEdit' name='albumArtist_edit' placeholder='Album Artist'>
										</div>
										<div class='container segmentContainer half right'>
											<span class='item label'>Composer:</span>
											<input class='item inputText' type='text' id='composerEdit' name='composer_edit' placeholder='Composer'>
										</div>
									</div>
									<div id="editPaddingContainer">
										<div class='container segmentContainer half left'>
											<span class='item label'>Start Padding:</span>
											<input class='item inputText' type='text' id='startPaddingEdit' name='start_padding_edit' placeholder='00:00'>
										</div>
										<div class='container segmentContainer half right'>
											<span class='item label'>End Padding:</span>
											<input class='item inputText' type='text' id='endPaddingEdit' name='end_padding_edit' placeholder='00:00'>
										</div>
									</div>
									<div class='container segmentContainer' id='editVideoIdContainer'>
										<span class='item label'>YouTube Video ID:<span class='important'>*</span></span>
										<input class='item inputText' type='text' id='videoIdEdit' name='video_id_edit' placeholder='Video ID' required>
									</div>
									<div>
										<div class='container segmentContainer half left'>
											<span class='item label'>Edit Artwork:</span>
											<input class='inputFile' type='file' id='artEdit' name='art_edit'>
											<div class='item preview'>
												<div class='container preview'>
													<img class='item previewItem' id='editArtDisplay' src='assets/default_album_art.jpg' alt='Media Art'>
													<label class='item overlay hover' for='artEdit' id='editArtOverlay'>Upload New Artwork</label>
												</div>
											</div>
										</div>
										<div class='container segmentContainer half right'>
											<span class='item label'>Existing Artwork:</span>
											<div class='item preview'>
												<span class='item overlay hover' id='editArtAlternativesActivator'>Load Existing Artwork</span>
												<div class='container alternatives' id='editArtAlternativesContainer'>
												</div>
											</div>
										</div>
									</div>

									<div class='container segmentContainer editLyricsContainer' id='editMediaFormLyrics'>
										<div class='item editLyrics header' id="editLyricsSettings">
											<span class='item label'>Lyrics</span>
											<input type='radio' class='inputRadio' name="lyric_dynamic_toggle" id="editLyricsSimpleRadio" value="0">
											<label for='editLyricsSimpleRadio' class='item inputLabel editLyricsLabel hover' id='editLyricsSimpleLabel'>Simple Lyrics</label>
											<input type="radio" class='inputRadio' name="lyric_dynamic_toggle" id="editLyricsDynamicRadio" value="1">
											<label for='editLyricsDynamicRadio' class='item inputLabel editLyricsLabel hover' id='editLyricsDynamicLabel'>Dynamic Lyrics</label>
											<span class='item label hover' id='convertLyricsActivator'></span>
										</div>
										<div class='item editLyrics' id="editLyricsTextboxContainer">
											<div id="editLyricsSimpleContainer" class="container editLyrics">
												<textarea class="item innerEditLyrics simple" id="simple_lyrics_edit" name="simple_lyrics_edit" placeholder="Plain-Text Lyrics Here"></textarea>
											</div>
											<div id="editLyricsDynamicContainer" class="container editLyrics">
												<span class='item innerEditLyrics header hover' id="dynamicLyricsEditAdd">Add Lyric Segment</span>
												<div class='item innerEditLyrics dynamic'>
													<div class='container innerEditLyrics' id="dynamicLyricsEditInnerContainer"></div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div class='item submitContainer'>
								<input type="hidden" id="id_edit" name="id_edit" value="-1">
								<input type="hidden" id="medium_edit" name="medium_edit" value="-1">
								<input class='item submitItem submit hover' type="submit" id="submitEdit" name="submit_edit" value="Submit Changes" form='editMediaForm'>
								<span class='item submitItem delete hover' id='deleteSong'>Delete Media</span>
							</div>
						</form>
						<form id='editAlbumArtForm' name="edit_album_art_form" method="post">
							<div class='item header'>
								<div class='container header'>
									<span class='cancel' id="closeAlbumArtEdit">X</span>
									<h2 class='item formTitle'>Edit Album Artwork</h2>
								</div>
							</div>
							<div class='item innerForm'>
								<div class='container innerForm'>
									<div class='container segmentContainer' id='editAlbumArtPreviewContainer'>
										<div class='item preview'>
											<input class='inputFile' type="file" id="edit_album_art_form_input" name="edit_album_art_form_input">
											<div class='container preview'>
												<img class='item previewItem' id='editAlbumArtDisplay' src='assets/default_album_art.jpg' alt='Media Art'>
												<label class='item overlay hover' for='edit_album_art_form_input' id='editAlbumArtOverlay'>Upload New Album Artwork</label>
											</div>
										</div>
									</div>
									<div class='container segmentContainer'>
										<span class='item label'>Use Existing Artwork Instead:</span>
										<div class='item preview'>
											<div class='container alternatives' id='editAlbumArtAlternativesContainer'>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div class='item submitContainer'>
								<input class='item submitItem submit hover' type="submit" id="edit_album_art_form_submit" name="edit_album_art_form_submit" value="Submit Changes">
							</div>
						</form>
						<form id='addMediaForm' name='addMediaForm' method='post' enctype="multipart/form-data">
							<div class='item header'>
								<div class='container header'>
									<span class='cancel' id="closeAddMediaForm">X</span>
									<h2 class='item formTitle'>Add Media</h2>
								</div>
							</div>
							<div class='item innerForm'>
								<div class='container innerForm'>
									<div class='container segmentContainer'>
										<span class='item label'>Select Media to upload</span>
										<label class='item button hover' for='addMediaFormInput' id='addMediaFormInputOverlay'>Select Media</label>
									</div>
									<div class='container segmentContainer'>
										<span class='item label'>OR, drag and drop into the window below</span>
										<input class='inputFile' type="file" id='addMediaFormInput' name='addMediaFormInput'>
										<div class='container segmentContainer dropArea' id='addMediaDropArea'></div>
									</div>
								</div>
							</div>
							<div class='item submitContainer'>
								<input class='item submitItem submit hover' type="submit" id="addMediaFormSubmit" name="addMediaFormSubmit" value="Submit Media">
							</div>
						</form>
<form id='editSettingsForm' name='editSettingsForm' method='post' enctype="multipart/form-data">
	<div class='item header'>
		<div class='container header'>
			<span class='cancel' id="closeEditSettingsForm">X</span>
			<h2 class='item formTitle'>Edit Global Settings</h2>
		</div>
	</div>
	<div class='container segmentContainer'>
		<span class='item label'>Song List Position<span class='important'>*</span></span>
		<p class='item text'>The position of the Song List on the screen.</p>
		<div class='item listPosContainer'>
			<div class='item listPosItem'>
				<input type='radio' class='inputRadio songListRadio' name="songListPos" id="songListPosLeft" value='0'>
				<label class='item songListLabel hover' for='songListPosLeft'></label>
				<img class='songListPreview' id='songListPreviewLeft' src='assets/transparent.png' alt='List Position Left Preview'>
			</div>
			<div class='item listPosItem'>
				<input type='radio' class='inputRadio songListRadio' name="songListPos" id="songListPosRight" value='1'>
				<label class='item songListLabel hover' for='songListPosRight'></label>
				<img class='songListPreview' id='songListPreviewRight' src='assets/transparent.png' alt='List Position Right Preview'>
			</div>
		</div>
	</div>
	<div class='item submitContainer'>
		<input class='item submitItem submit hover' type="submit" id="editSettingsFormSubmit" name="editSettingsFormSubmit" value="Change Settings">
	</div>
</form>
					</div>
				</div>
			</div>
			<div id='main'>
				<div id="media_container">
					<div id="video_container">
						<div id="videoTitleAndArtist" class='playerTitleAndArtist'>
							<div id="video_title_and_artist_inner_container">
								<h1 id="videoTitle" class='playerTitle'></h1>
								<span id="videoArtist" class='playerArtist'></span>
							</div>
						</div>
						<div id="video_lyrics_container">
							<div id="video_lyrics_inner_container"></div>
						</div>
						<div id="video_embed_container">
							<div id="video_embed_inner_container">
								<div id="video_embed"></div>
								<video id="localVideo" src="" preload="none" ontimeupdate="onTimeUpdate(this);">
									Your browser does not support the audio element.
								</video>
							</div>
						</div>
					</div>
					<div id="player_container">
						<audio id="audio" src="" preload='none' ontimeupdate="onTimeUpdate(this);">
							Your browser does not support the audio element.
						</audio>
						<div id="player_main_div">
							<div id="player_art_and_lyrics">
								<div class='table_wrapper' id="player_art_container">
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
						</div>
					</div>
					<div id="playerInfo">
						<div id='audioTitleAndArtist' class='playerTitleAndArtist'>
							<h1 id="audioTitle" class='playerTitle'>Choose a Song</h1>
							<span id="audioArtist" class='playerArtist'>Artist</span>
						</div>
						<div id="time_container">
							<input type="range" min="0" max="0" id="time_slider">
							<span class='playerTimes'>
								<span class="player_time" id="curTime">--:--</span> / <span  class="player_time" id="duration">--:--</span>
							</span>
						</div>
						<div id="controls_container">
							<div class='extrasButtons'>
								<img class="dropdownPlaceholder control" id='playerOptions' src="assets/transparent.png" alt="Settings">
								<div id="volume_container" class='control'>
									<input type="range" min="0" max="100" value="100" id="volume" />
									<img id="volume_image" src="assets/transparent.png" alt="Volume">
								</div>
								<img class="control one" id="repeat" src="assets/transparent.png" alt="Repeat">
								<img class="control" id="shuffle" src="assets/transparent.png" alt="Shuffle">
								<img class="control" id="options" src="assets/transparent.png" alt="Edit Media Info">
								<span class="control active" id="player_lyrics_autoscroll">Autoscroll</span>
							</div>
							<div class='controlsButtons'>
								<img class="control hideButton" id="previous" src="assets/transparent.png" alt="Previous">
								<img class="control hideButton" id="backFive" src="assets/transparent.png" alt="-5sec">
								<img class="control" id="playpause" src="assets/transparent.png" alt="Play">
								<img class="control hideButton" id="forwardFive" src="assets/transparent.png" alt="+5sec">
								<img class="control hideButton" id="next" src="assets/transparent.png" alt="Next">
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</body>
	<script src="scripts/script.js"></script>
</html>