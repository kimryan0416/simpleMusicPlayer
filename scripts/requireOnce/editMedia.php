<?php
	require_once('newConfig.php');
	$db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
	if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

	$get = ( $get!=null ) ? $get : filter_var($_GET['get'],FILTER_VALIDATE_INT);
	if ( !$get || ( $get!=5 && $get!='editMedia' ) ) {
		print(returnError($db,'Proper GET not received'));
		return;
	}

	$image_types = array('jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG');
	$commands = array('icon','edit','delete');

	//$icon = filter_var($_POST['icon'],FILTER_VALIDATE_INT);
	if ( !isset($_POST['id_edit']) || !isset($_POST['command']) ) {
		print(returnError($db,'editMedia - id_edit or command NOT received',array('id_edit'=>$_POST['id_edit'],'command'=>$_POST['command'])));
		return;
	}
	$songId = filter_var( $_POST['id_edit'], FILTER_VALIDATE_INT );
	$command = filter_var( $_POST['command'], FILTER_SANITIZE_STRING );
	if ( !$songId || !$command || $songId == -1 || !in_array($command,$commands) ) {
		print(returnError($db,'editMedia - id_edit and/or command received, but not expected',array('songId'=>$songId,'command'=>$command)));
		return;
	}

	if ($command == 'icon') {
		$upload_dir = 'art/';
		$file = $_FILES['file'];

		$ext = pathinfo(basename($file['name']), PATHINFO_EXTENSION);	// grab the extension of the file we are using
		$newArtId = null;

		$query = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
		try {
			$result = execQuery($db, $query, array(':tableName'=>'art'))->fetchAll();
			$newArtId = $result[0]['seq'] + 1;
		}
		catch (PDOException $exception) {
			print(returnError($db,$query,$exception));
			return;	
		}

		// Setting the target path, which will simultaneously rename our new picture when we move it
		$target_file =  $upload_dir . $newArtId . '.' . $ext;

		// Get the image file type - this will tell us if this is a jpg or png or whatnot
		$imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));

		// This is just to check that this is a legit file that is an image
		if(getimagesize($file['tmp_name']) === false) {
			print(returnError($db,'mediaEdit - This file is not an image; please select an image file',array('file'=>$file)));
			return;	
		}
		// This error means the file is an image but is not a jpg or png, so the uploader has to choose another icon
		if ( !in_array($ext,$image_types) ) {
			print(returnError($db,'mediaEdit - Image file is not jpg or png'));
			return;	
		}
		// This error means there is already an image for the media file we couldn't delete it
		if ( file_exists('../' . $target_file) && !unlink('../' . $target_file) ) {
			print(returnError($db,'mediaEdit - Could not delete original icon'));
			return;	
		}
		// This error means everything was fine... but we couldn't move the file properly
		if (!move_uploaded_file($file['tmp_name'], '../' . $target_file)) {
			print(returnError($db,'mediaEdit - the file wasn\'t able to be moved to the temp file for some reason'));
			return;	
		}

		$insertQuery = "INSERT INTO art (src) VALUES ( :src )";
		$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
		$updateQuery = "UPDATE songToart SET art_id = :artId WHERE song_id = :songId";
		try {
			execQuery($db, $insertQuery, array(':src'=>$target_file));
			$result = execQuery($db, $grabIdQuery, array(':tableName'=>'art'))->fetchAll();
			$new_art_id = $result[0]['seq'];
			execQuery($db, $updateQuery, array(':artId'=>$new_art_id,':songId'=>$id));
		}
		catch(PDOException $exception) {
			print(returnError($db,'insertion into art',$exception));
			return;
		}
		
		print(returnSuccess($db,'Image successfully moved to '.$target_file));
		return;
	}

	else if ($command == 'edit') {
		// The files being moved to the temp folder for protection and the icon file being processed, we can proceed with editing the song's details

		if ( !isset($_POST['iconUploaded']) ) {
			print(returnError($db,'medaiEdit - newArtUploaded NOT gotten'));
			return;
		}
		$newArtUploaded = filter_var( $_POST['iconUploaded'], FILTER_VALIDATE_INT );
		if ( $newArtUploaded != 0 && $newArtUploaded != 1 && $newArtUploaded == false ) {
			print(returnError($db,'medaiEdit - newArtUploaded received but not expected',array('newArtUploaded'=>$newArtUploaded)));
			return;
		}
		$id = $songId;
		$title = filter_var( $_POST['title_edit'], FILTER_SANITIZE_STRING );
		$artist = filter_var( $_POST['artist_edit'], FILTER_SANITIZE_STRING );
		$album = filter_var( $_POST['album_edit'], FILTER_SANITIZE_STRING );
		$album_artist = filter_var( $_POST['albumArtist_edit'], FILTER_SANITIZE_STRING );
		$composer = filter_var( $_POST['composer_edit'], FILTER_SANITIZE_STRING );

		$start_padding = filter_var( $_POST['start_padding_edit'], FILTER_SANITIZE_STRING );
		$end_padding = filter_var( $_POST['end_padding_edit'], FILTER_SANITIZE_STRING );

		$video_id = filter_var( $_POST['video_id_edit'], FILTER_SANITIZE_STRING );

		$dynamic_lyrics_toggle = filter_var( $_POST['lyric_dynamic_toggle'], FILTER_VALIDATE_INT ); 
		$simple_lyrics = filter_var( $_POST['simple_lyrics_edit'], FILTER_SANITIZE_STRING );
		$dynamic_lyrics_texts = $_POST['dynamic_lyrics_edits'];
		$dynamic_lyrics_times = $_POST['dynamic_lyrics_times'];
		$dynamic_lyrics_styles = $_POST['dynamic_lyrics_styles'];
		$dynamic_lyrics_notexts = $_POST['dynamic_lyrics_notexts'];

		$medium = filter_var( $_POST['medium_edit'], FILTER_VALIDATE_INT );
		$new_art = filter_var( $_POST['alternate_art'], FILTER_VALIDATE_INT );

		if (!$title || !$artist || !$album || !$album_artist ) {
			print(returnError($db,'Some necessary values were not uploaded properly',array('title'=>$title,'artist'=>$artist,'album'=>$album,'album artist'=>$album_artist)));
			return;
		}

		$title =  str_replace(array("&#39;", "&#34;"), array("'", "\""), $title);
			//$title = htmlentities(trim($title));
		$artist =  str_replace(array("&#39;", "&#34;"), array("'", "\""), $artist);
			//$artist = htmlentities(trim($artist));
		$album =  str_replace(array("&#39;", "&#34;"), array("'", "\""), $album);
			//$album = htmlentities(trim($album));
		$album_artist =  str_replace(array("&#39;", "&#34;"), array("'", "\""), $album_artist);
			//$album_artist = htmlentities(trim($album_artist));
		$composer =  str_replace(array("&#39;", "&#34;"), array("'", "\""), $composer);
			//$composer = htmlentities(trim($composer));
		$simpleLyrics = '';
		$dynamicLyrics = '';

		if ($medium == 0) {
			$previous_time = '[0]';
			$previous_style = '';
			$current_time = '';
			$current_style = '';
			$current_notext = '';
			$current_text = '';
			$compiled_lyric_segment = '';
			$size = count($dynamic_lyrics_texts);
			$current_tick = 0;
			foreach($dynamic_lyrics_texts as $index=>$text) {
				$current_tick += 1;
				$compiled_lyric_segment = '';

				// Set Time
				$current_time = ( $dynamic_lyrics_times[$index] != null ) ? '['.convertToMilliseconds($dynamic_lyrics_times[$index]).']' : $previous_time;
				$previous_time = $current_time;		// Save this time as the new $previous_time

				// Set style
				$current_style = ( $dynamic_lyrics_styles[$index] != null ) ? '{'.$dynamic_lyrics_styles[$index].'}' : '';
				$previous_style = $current_style;

				// Set NoText
				$current_notext = ( $dynamic_lyrics_notexts[$index] != null && $dynamic_lyrics_notexts[$index] == '1' ) ? '[NOTEXT]' : '';

				if ( $text != null ) {
					$text = str_replace("\r\n", '|NL|', trim($text));
					$current_text = htmlentities($text);
				} 
				else $current_text = '';

				$compiled_lyric_segment = $current_time.$current_style.$current_notext.'||'.$current_text;
				if ($current_tick != $size) $compiled_lyric_segment .= '||realNEWLINE||';

				$dynamicLyrics .= $compiled_lyric_segment;
			}
					
			$simpleLyrics = str_replace(array("&#39;", "&#34;"), array("'", "\""), $simple_lyrics);
			$simpleLyrics = htmlentities($simpleLyrics);

			$start_padding = convertToMilliseconds($start_padding);
			$end_padding = convertToMilliseconds($end_padding);

		}
		else {
			$start_padding = null;
			$end_padding = null;
			$simpleLyrics = '';

			if ( $medium == 1 && strlen(trim($video_id)) == 0 ) {
				print(returnError($db,'mediaEdit - Video ID not filled out'));
				return;
			}

			if ( isset($dynamic_lyrics_texts) && count($dynamic_lyrics_texts) > 0 ) {
				$previous_time = '[0]';
				$previous_style = '';
				$current_time = '';
				$current_style = '';
				$current_notext = '';
				$current_text = '';
				$compiled_lyric_segment = '';
				$size = count($dynamic_lyrics_texts);
				$current_tick = 0;
				$dynamicLyrics = '';
				foreach($dynamic_lyrics_texts as $index=>$text) {
					$current_tick += 1;
					$compiled_lyric_segment = '';

					// Set Time
					$current_time = ( $dynamic_lyrics_times[$index] != null ) ? '['.convertToMilliseconds($dynamic_lyrics_times[$index]).']' : $previous_time;
					$previous_time = $current_time;

					// Set style
					$current_style = ( $dynamic_lyrics_styles[$index] != null ) ? '{'.$dynamic_lyrics_styles[$index].'}' : '';
					$previous_style = $current_style;

					// Set NoText
					$current_notext = ( $dynamic_lyrics_notexts[$index] != null && $dynamic_lyrics_notexts[$index] == '1' ) ? '[NOTEXT]' : '';

					if ( $text != null ) {
						$text = str_replace("\r\n", '|NL|', trim($text));
						$current_text = htmlentities($text);
					} 
					else $current_text = '';

					$compiled_lyric_segment = $current_time.$current_style.$current_notext."||".$current_text;
					if ($current_tick != $size) $compiled_lyric_segment .= '||realNEWLINE||';

					$dynamicLyrics .= $compiled_lyric_segment;
				}
			} else {
				$dynamicLyrics = '';
				$dynamic_lyrics_toggle = 0;
			}
		}

		$selectQuery = "SELECT id FROM albums WHERE name = :name";
		$insertQuery = "INSERT INTO albums (name) VALUES ( :name )";
		$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
		try {
			$result = execQuery($db, $selectQuery, array(':name'=>$album))->fetchAll();
			if ( count($result) == 1 ) $album = $result[0]['id'];
			else if ( count($result) == 0 ) {
				execQuery($db, $insertQuery, array(':name'=>$album));
				$result = execQuery($db, $grabIdQuery, array(':tableName'=>'albums'))->fetchAll();
				$album = $result[0]['seq'];
			} 
			else {
				print(returnError($db,'mediaEdit - Got more than 1 album when comparing albums for edit'));
				return;
			}
		}
		catch (PDOException $exception) {
			print(returnError($db,'mediaEdit - insertion into album',$exception));
			return;
		}

		$selectQuery = "SELECT id FROM album_artists WHERE name = :name";
		$insertQuery = "INSERT INTO album_artists (name) VALUES ( :name )";
		$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
		try {
			$result = execQuery($db, $selectQuery, array(':name'=>$album_artist))->fetchAll();
			if ( count($result) == 1 ) $album_artist = $result[0]['id'];
			else if ( count($result) == 0 ) {
				execQuery($db, $insertQuery, array(':name'=>$album_artist));
				$result = execQuery($db, $grabIdQuery, array(':tableName'=>'album_artists'))->fetchAll();
				$album_artist = $result[0]['seq'];
			}
			else {
				print(returnError($db,'mediaEdit - Got more than 1 album artist when comparing album artists for edit'));
				return;
			}
		}
		catch (PDOException $exception) {
			print(returnError($db,'mediaEdit - Insertion into album_artists',$exception));
			return;
		}

		if ($medium == 1) {
			$updateQuery = "UPDATE music SET title = :title, artist = :artist, composer = :composer, url = :url, dynamic_lyrics_toggle = :dynamicToggle, lyrics = :simpleLyrics, dynamic_lyrics = :dynamicLyrics WHERE id = :id";
			$updateParams = array(':title'=>$title,':artist'=>$artist,':composer'=>$composer,':url'=>$video_id,':dynamicToggle'=>$dynamic_lyrics_toggle,':simpleLyrics'=>$simpleLyrics,':dynamicLyrics'=>$dynamicLyrics,':id'=>$id);
		}
		else {
			$updateQuery = "UPDATE music SET title = :title, artist = :artist, composer = :composer, lyrics = :simpleLyrics, dynamic_lyrics = :dynamicLyrics, dynamic_lyrics_toggle = :dynamicToggle, start_padding = :startPadding, end_padding = :endPadding WHERE id = :id";
			$updateParams = array(':title'=>$title,':artist'=>$artist,':composer'=>$composer,':dynamicToggle'=>$dynamic_lyrics_toggle,':simpleLyrics'=>$simpleLyrics,':dynamicLyrics'=>$dynamicLyrics,':startPadding'=>$start_padding,':endPadding'=>$end_padding,':id'=>$id);
		}
		try {
			execQuery($db, $updateQuery, $updateParams);
		}
		catch (PDOException $exception) {
			print(returnError($db,$updateQuery,$exception));
			return;
		}

		// Getting old album_artist record, replacing old album_artist_id with new one
		// We first check if there is a relationship between the song and the album artist first:
		$selectQuery = "SELECT COUNT(id) AS num FROM albumToalbum_artist WHERE album_id = :albumId";
		$insertQuery = "INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES ( :albumId, :albumArtistId)";
		$updateQuery = "UPDATE albumToalbum_artist SET album_artist_id = :albumArtistId WHERE album_id = :albumId";
		$deleteQuery = "DELETE FROM albumToalbum_artist WHERE album_id = :albumId AND album_artist_id = :albumArtistId";

		try {
			$result = execQuery($db, $selectQuery, array(':albumId'=>$album))->fetchAll();
			if ( $result[0]['num'] == 0 ) execQuery($db, $insertQuery, array(':albumId'=>$album,':albumArtistId'=>$album_artist));
			else if ( $result[0]['num'] == 1 ) execQuery($db, $updateQuery, array(':albumId'=>$album,':albumArtistId'=>$album_artist));
			else if ( $result[0]['num'] > 1 ) {
				$found = false;
				foreach ($result as $row) {
					if ($row['album_artist_id'] == $album_artist) $found = true;
					else execQuery($db, $deleteQuery, array(':albumId'=>$album,':albumArtistId'=>$row['album_artist_id']));
				}
				// IF there is no preset relationship, we create a new one:
				if (!$found) execQuery($db, $insertQuery, array(':albumId'=>$album,':albumArtistId'=>$album_artist));
			}
		}
		catch (PDOException $exception) {
			print(returnError($db,'mediaEdit - insertion into albumToalbum_artist+  removal from old album_artist connection',$exception));
			return;
		}
				
		// We now perform the same thing with songToalbum, just in case
		$selectQuery = "SELECT COUNT(id) AS num FROM songToalbum WHERE song_id = :songId";
		$insertQuery = "INSERT INTO songToalbum (song_id, album_id) VALUES ( :songId, :albumId)";
		$updateQuery = "UPDATE songToalbum SET album_id = :albumId WHERE song_id = :songId";
		$deleteQuery = "DELETE FROM songToalbum WHERE song_id = :songId AND album_id = :albumId";
			// We complete $deleteParams inside try{}
			$deleteParams = array(':songId'=>$id,':albumId'=>'');

		try {
			$result = execQuery($db, $selectQuery, array(':songId'=>$id))->fetchAll();
			if ( $result[0]['num'] == 0 ) execQuery($db, $insertQuery, array(':songId'=>$id,':albumId'=>$album));
			else if ( $result[0]['num'] == 1 ) execQuery($db, $updateQuery, array(':songId'=>$id,':albumId'=>$album));
			else if ( $result[0]['num'] > 1 ) {
				$found = false;
				foreach ($result as $row) {
					if ($row['album_id'] == $album) $found = true;
					else execQuery($db, $deleteQuery, array(':songId'=>$id,':albumId'=>$row['album_id']));
				}
				// IF there is no preset relationship, we create a new one:
				if (!$found) execQuery($db, $insertQuery, array(':songId'=>$id,':albumId'=>$album));
			}
		}
		catch (PDOException $exception) {
			print(returnError($db,'insertion into songTOalbum + removal from old songToalbum connection',$exception));
			return;
		}

		if ($newArtUploaded == 0) {
			// If we set a new replacement art via selecting an already-existing artwork, we simply update the songToart row

			$selectQuery = "SELECT art_id FROM songToart WHERE song_id = :songId";
			$updateQuery = "UPDATE songToart SET art_id = :artId WHERE song_id = :songId";
				$updateParams = array(':artId'=>$new_art,':songId'=>$id);

			try {
				if ( isset($new_art) && $new_art != null && $new_art != -1 ) {
					$result = execQuery($db, $selectQuery, array(':songId'=>$id))->fetchAll();
					$old_art_id = $result[0]['art_id'];
					execQuery($db, $updateQuery, array(':artId'=>$new_art,':songId'=>$id));
				}
			}
			catch (PDOException $exception) {
				print(returnError($db,'mediaEdit - updating songToart connection',$exception));
				return;
			}
		}

		try {
			cleanArtTable($db);
		}
		catch (PDOException $exception) {
			print(returnError($db,'editMedia - cleaning up art table',$exception));
			return;
		}

		print(returnSuccess($db,'Success',array('id' => $id,'title' => $title,'artist' => $artist,'album' => $album,'album_aritst' => $album_artist,'composer' => $composer,'start_padding' => $start_padding,'end_padding' => $end_padding,'dynamic_lyrics_toggle' => $dynamic_lyrics_toggle,'simple_lyrics' => $simple_lyrics,'dynamic_lyrics_texts' => $dynamic_lyrics_texts,'dynamic_lyrics_times' => $dynamic_lyrics_times,'dynamic_lyrics_styles' => $dynamic_lyrics_styles,'dynamic_lyrics_notexts' => $dynamic_lyrics_notexts,'lyrics' => $lyrics,'medium' => $medium,'new_art' => $new_art)));
		return;
	}

	else if ($command == 'delete') {
		$id = $songId;

		// Firstly, grab the album artist id from our row in the database
		$selectQuery1 = "SELECT album_id FROM songToalbum WHERE song_id = :songId";
		$selectQuery2 = "SELECT album_artist_id FROM albumToalbum_artist WHERE album_id = :albumId";
		$selectQuery3 = "SELECT art_id FROM albumToart WHERE album_id = :albumId";
		$selectQuery4 = "SELECT art_id FROM songToart WHERE song_id = :songId";
		try {
			$result = execQuery($db, $selectQuery1, array(':songId'=>$id))->fetchAll();
			$albumId = $result[0]['album_id'];
			$result = execQuery($db, $selectQuery2, array(':albumId'=>$albumId))->fetchAll();
			$albumArtistId = $result[0]['album_artist_id'];
			$result = execQuery($db, $selectQuery3, array(':albumId'=>$albumId))->fetchAll();
			$albumArtId = $result[0]['art_id'];
			$result = execQuery($db, $selectQuery4, array(':songId'=>$id))->fetchAll();
			$artId = $result[0]['art_id'];
		}
		catch (PDOException $exception) {
			print(returnError($db,'mediaEdit - selecting values for file deletion',$exception));
			return;
		}

		// Secondly, we remove the song<-->album connection
		$query = "DELETE FROM songToalbum WHERE song_id = :songId AND album_id = :albumId";
		try {
			execQuery($db,$query,array(':songId'=>$id,':albumId'=>$albumId));
		}
		catch(PDOException $exception) {
			print(returnError($db,$query,$exception));
			return;
		}

		// Thirdly, if there are any other songs that share the same album, we don't delete the album and consequentially don't delete the album<-->album_artist connection
		// However, if no other songs share the same album, then we delete the album and consequentially the album<-->album_artist connection, as well as the album<-->art connection
		$selectQuery1 = "SELECT COUNT(*) as num FROM songToalbum WHERE album_id = :albumId";
		$deleteQuery1 = "DELETE FROM albums WHERE id = :albumId";
		$deleteQuery2 = "DELETE FROM albumToalbum_artist WHERE album_id = :albumId AND album_artist_id = :albumArtistId";
		try {
			$result = execQuery($db, $selectQuery1, array(':albumId'=>$albumId))->fetchAll();
			if ($result[0]['num'] == 0) {
				execQuery($db, $deleteQuery1, array(':albumId'=>$albumId)); 
				execQuery($db, $deleteQuery2, array(':albumId'=>$albumId,':albumArtistId'=>$albumArtistId));
			}
		}
		catch (PDOException $exception) {
			print(returnError($db,'mediaEdit - deleting album and album-album_artist connection',$exception,$result));
			return;
		}

		//Fourthly, check if the album artist has any other relationships with any other albums - if not, then we delete appropriately
		$selectQuery1 =  "SELECT COUNT(*) AS num FROM albumToalbum_artist WHERE album_artist_id = :albumArtistId";
		$deleteQuery = "DELETE FROM album_artists WHERE id = :albumArtistId";
		try {
			$result = execQuery($db, $selectQuery1, array(':albumArtistId'=>$albumArtistId))->fetchAll();
			if ($result[0]['num'] == 0) execQuery($db, $deleteQuery, array(':albumArtistId'=>$albumArtistId)); 
		}
		catch (PDOException $exception) {
			print(returnError($db,'mediaEdit - deleting from album_artist',$exception));
			return;
		}

		// Fifthly delete the song and art relationship
		$query = "DELETE FROM songToart WHERE song_id = :songId AND art_id = :artId";
		try {
			execQuery($db, $query, array(':songId'=>$id,':artId'=>$artId)); 
		}
		catch (PDOException $exception) {
			print(returnError($db,$query,$exception));
			return;
		}

		// Sixthly, check if that the song's art has any more relationships with other songs or albums - if none, then delete the art itself
		$selectQuery1 =  "SELECT COUNT(*) AS num FROM songToart WHERE art_id = :artId";
		$selectQuery2 = "SELECT COUNT(*) AS num FROM albumToart WHERE art_id = :artId";
		$deleteQuery = "DELETE FROM art WHERE id = :artId";
		try {
			$result = execQuery($db, $selectQuery1, array(':artId'=>$artId))->fetchAll();
			$numSongToArt = $result[0]['num'];
			$result = execQuery($db, $selectQuery2, array(':artId'=>$artId))->fetchAll();
			$numAlbumsToArt = $result[0]['num'];
			if ( ($numSongToArt == 0) && ($numAlbumsToArt == 0) && ($artId!=-1) && ($artId!=0) ) {
				execQuery($db, $deleteQuery, array(':artId'=>$artId));
			}
		}
		catch (PDOException $exception) {
			print(returnError($db,'mediaEdit - deleting from art',$exception));
			return;
		}

		// Seventhly, check that the album's art has any more relationships with other songs or albums - if none, then delete the art itself
		$selectQuery1 =  "SELECT COUNT(*) AS num FROM songToart WHERE art_id = :artId";
		$selectQuery2 = "SELECT COUNT(*) AS num FROM albumToart WHERE art_id = :artId";
		$deleteQuery = "DELETE FROM art WHERE id = :artId";
		try {
			$result = execQuery($db, $selectQuery1, array(':artId'=>$albumArtId))->fetchAll();
			$numSongToArt = $result[0]['num'];
			$result = execQuery($db, $selectQuery2, array(':artId'=>$albumArtId))->fetchAll();
			$numAlbumsToArt = $result[0]['num'];
			if (($numSongToArt == 0) && ($numAlbumsToArt == 0) && ($albumArtId!=-1) && ($albumArtId!=0) ) {
				execQuery($db, $deleteQuery, array(':artId'=>$albumArtId)); 
			}
		}
		catch (PDOException $exception) {
			print(returnError($db,'mediaEdit - deleting art',$exception));
			return;
		}

		// Now, delete row from music table altogether
		$query = "DELETE FROM music WHERE id = :id";
		try {
			execQuery($db, $query, array(':id'=>$id));
		}
		catch (PDOException $exception) {
			print(returnError($db,$query,$exception));
			return;
		}

		try {
			cleanArtTable($db);
		}
		catch (PDOException $exception) {
			print(returnError($db,'editMedia - cleaning up art table',$exception));
			return;
		}
			
		// We won't actually delete the file, in case we want it again	
		print(returnSuccess($db,'Successfully deleted song from database'));
		return;
	}

	else {
		print(returnError($db,'editMedia - Something went wrong',array('songId'=>$songId,'command'=>$command)));
		return;
	}
?>