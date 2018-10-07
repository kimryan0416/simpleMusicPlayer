<?php
	require('config.php');
	$db = open_or_init_sqlite_db('database.sqlite', 'init.sql');

	$arrayToSend = array();
	$arrayToSend['reload'] = false;

    $image_types = array('jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG');

	// Detects if the proper files were sent via AJAX and not some malicious other way
	if(isset($_GET['icon'])) {	// edits only the icon - needs to detect if we really have to change the icon or not
		if (isset($_GET['id']) && isset($_GET['change']) && $_GET['change'] == 1) {
			$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
			$upload_dir = 'art/';

			$file = $_FILES[count($_FILES)-1];

			//foreach($_FILES as $file) {
				$ext = pathinfo(basename($file["name"]), PATHINFO_EXTENSION);	// grab the extension of the file we are using
				$newArtId = null;

				$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
				$grabParams = array(
					':tableName'=>'art'
				);
				try {
					$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
					$newArtId = $result[0]['seq'] + 1;
				}
				catch (PDOException $exception) {
					$arrayToSend['success'] = false;
					$arrayToSend['message'] = 'Could not get last uploaded art: ' . $exception;
					closeFileNew($arrayToSend);
					return;
				}

				$target_file =  $upload_dir . $newArtId . "." . $ext;
				// Setting the target path, which will simultaneously rename our new picture when we move it

				$imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));
				// Get the image file type - this will tell us if this is a jpg or png or whatnot

				$check = getimagesize($file['tmp_name']);
				// This is just to check that this is a legit file that is an image

				if($check !== false) {
					// Need to confirm that this is a jpg or not
					if ( !in_array($ext,$image_types) ) {
						// This error means the file is an image but is not a jpg or png, so the uploader has to choose another icon
						$arrayToSend['success'] = false;
						$arrayToSend['message'] = 'Image file is not jpg or png';
						closeFileNew($arrayToSend);
						return;
					} else {
						if ( file_exists('../' . $target_file) && !unlink('../' . $target_file) ) {
							// This error means there is already an image for the media file we couldn't delete it
							$arrayToSend['success'] = false;
							$arrayToSend['message'] = 'Could not delete original icon';
							closeFileNew($arrayToSend, false);
							return;
						}
						if (move_uploaded_file($file['tmp_name'], '../' . $target_file)) {

							$insertQuery = "INSERT INTO art (src) VALUES ( :src )";
							$insertParams = array(
								':src'=>$target_file
							);
							$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
							$grabParams = array(
								':tableName'=>'art'
							);
							$updateQuery = "UPDATE songToart SET art_id = :artId WHERE song_id = :songId";
							//$updateParams to be completed inside try{}
							$updateParams = array(
								':artId'=>'',
								':songId'=>$id
							);
							try {
								exec_sql_query($db, $insertQuery, $insertParams);
								$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
								$new_art_id = $result[0]['seq'];
								$updateParams[':artId'] = $new_art_id;
								exec_sql_query($db, $updateQuery, $updateParams);

								$arrayToSend['success'] = true;
								$arrayToSend['message'] = 'Image successfully moved to ' .$target_file;
								closeFileNew($arrayToSend);
								return;
							}
							catch(PDOException $exception) {
								$arrayToSend['success'] = false;
								$arrayToSend['message'] = 'Icon upload error - the file wasn\'t able to be inserted into the "art" table for some reason: ' . $exception;
								closeFileNew($arrayToSend);
								return;
							}
						} else {
							// This error means everything was fine... but we couldn't move the file properly
							$arrayToSend['success'] = false;
							$arrayToSend['message'] = 'Icon upload error - the file wasn\'t able to be moved to the temp file for some reason';
							closeFileNew($arrayToSend);
							return;
						}
					}
				} else {
					// This error means the file is not an image, so the uploader has to choose an actual image
					$arrayToSend['success'] = false;
			   		$arrayToSend['message'] = 'This file is not an image; please select an image file';
			   		closeFileNew($arrayToSend);
			   		return;
				} 
			//}
		} else {
			// if we don't have to change the current icon (because we either canceled the edit or we didn't upload a new one)
			$arrayToSend['success'] = true;
   			$arrayToSend['message'] = 'Icon Request Recieved, ID found, but we don\'t change the icon';
   			closeFileNew($arrayToSend);
   			return;
		}
	} else if (isset($_GET['song'])) {
		// The files being moved to the temp folder for protection and the icon file being processed, we can proceed with editing the song's details
		if ( $_GET['reload'] == 0 ) {
			$id = filter_input(INPUT_POST, 'id_edit', FILTER_VALIDATE_INT);

			$title = filter_input( INPUT_POST, 'title_edit', FILTER_SANITIZE_STRING );
			$artist = filter_input( INPUT_POST, 'artist_edit', FILTER_SANITIZE_STRING );
			$album = filter_input( INPUT_POST, 'album_edit', FILTER_SANITIZE_STRING );
			$album_artist = filter_input( INPUT_POST, 'albumArtist_edit', FILTER_SANITIZE_STRING );
			$composer = filter_input( INPUT_POST, 'composer_edit', FILTER_SANITIZE_STRING );

			$start_padding = filter_input( INPUT_POST, 'start_padding_edit', FILTER_SANITIZE_STRING );
			$end_padding = filter_input( INPUT_POST, 'end_padding_edit', FILTER_SANITIZE_STRING );

			$video_id = filter_input( INPUT_POST, 'video_id_edit', FILTER_SANITIZE_STRING );

			$dynamic_lyrics_toggle = filter_input( INPUT_POST, 'lyric_dynamic_toggle', FILTER_VALIDATE_INT ); 
			$simple_lyrics = filter_input( INPUT_POST, 'simple_lyrics_edit', FILTER_SANITIZE_STRING );
			$dynamic_lyrics_texts = $_POST['dynamic_lyrics_edits'];
			$dynamic_lyrics_times = $_POST['dynamic_lyrics_times'];
			$dynamic_lyrics_styles = $_POST['dynamic_lyrics_styles'];
			$dynamic_lyrics_notexts = $_POST['dynamic_lyrics_notexts'];

			$medium = filter_input( INPUT_POST, 'medium_edit', FILTER_VALIDATE_INT );
			$new_art = filter_input( INPUT_POST, 'alternate_art', FILTER_VALIDATE_INT );
			$newArtUploaded = filter_input( INPUT_GET, 'iconUploaded', FILTER_VALIDATE_INT );

			$title =  str_replace(array("&#39;", "&#34;"), array("'", "\""), $title);
				$title = htmlentities(trim($title));
			$artist =  str_replace(array("&#39;", "&#34;"), array("'", "\""), $artist);
				$artist = htmlentities(trim($artist));
			$album =  str_replace(array("&#39;", "&#34;"), array("'", "\""), $album);
				$album = htmlentities(trim($album));
			$album_artist =  str_replace(array("&#39;", "&#34;"), array("'", "\""), $album_artist);
				$album_artist = htmlentities(trim($album_artist));
			$composer =  str_replace(array("&#39;", "&#34;"), array("'", "\""), $composer);
				$composer = htmlentities(trim($composer));
			$simpleLyrics = '';
			$dynamicLyrics = '';

			if ($medium == 0) {
				$previous_time = '[59:59.999]';
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
					$current_time = ( $dynamic_lyrics_times[$index] != null ) ? '['.$dynamic_lyrics_times[$index].']' : $previous_time;
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
					$arrayToSend['success'] = false;
					$arrayToSend['message'] = 'Failed - Video ID not filled out';
					closeFileNew($arrayToSend);
					return;
				}

				if ( isset($dynamic_lyrics_texts) && count($dynamic_lyrics_texts) > 0 ) {
					$previous_time = '[59:59.999]';
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
						$current_time = ( $dynamic_lyrics_times[$index] != null ) ? '['.$dynamic_lyrics_times[$index].']' : $previous_time;
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
			$selectParams = array(
				':name'=>$album
			);
			$insertQuery = "INSERT INTO albums (name) VALUES ( :name )";
			$insertParams = array(
				':name'=>$album
			);
			$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
			$grabParams = array(
				':tableName'=>'albums'
			);

			try {
				$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
				if ( count($result) == 1 ) $album = $result[0]['id'];
				else if ( count($result) == 0 ) {
					exec_sql_query($db, $insertQuery, $insertParams);
					$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
					$album = $result[0]['seq'];
				} 
				else {
					$arrayToSend['success'] = false;
					$arrayToSend['message'] = 'Got more than 1 album when comparing albums for edit';
					closeFileNew($arrayToSend);
					return;
				}

			}
			catch (PDOException $exception) {
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'Failed to get album data from database for comparison: ' . $exception;
				closeFileNew($arrayToSend);
				return;
			}

			$selectQuery = "SELECT id FROM album_artists WHERE name = :name";
			$selectParams = array(
				':name'=>$album_artist
			);
			$insertQuery = "INSERT INTO album_artists (name) VALUES ( :name )";
			$insertParams = array(
				':name'=>$album_artist
			);
			$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
			$grabParams = array(
				':tableName'=>'album_artists'
			);

			try {
				$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
				if ( count($result) == 1 ) $album_artist = $result[0]['id'];
				else if ( count($result) == 0 ) {
					exec_sql_query($db, $insertQuery, $insertParams);
					$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
					$album_artist = $result[0]['seq'];
				}
				else {
					$arrayToSend['success'] = false;
					$arrayToSend['message'] = 'Got more than 1 album artist when comparing album artists for edit';
					closeFileNew($arrayToSend);
					return;
				}
			}
			catch (PDOException $exception) {
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'Failed to get album artist data from database for comparison: ' .$exception;
				closeFileNew($arrayToSend);
				return;
			}

			if ($medium == 1) {
				$updateQuery = "UPDATE music SET title = :title, artist = :artist, composer = :composer, url = :url, dynamic_lyrics_toggle = :dynamicToggle, lyrics = :simpleLyrics, dynamic_lyrics = :dynamicLyrics WHERE id = :id";
				$updateParams = array(
					':title'=>$title,
					':artist'=>$artist,
					':composer'=>$composer,
					':url'=>$video_id,
					':dynamicToggle'=>$dynamic_lyrics_toggle,
					':simpleLyrics'=>$simpleLyrics,
					':dynamicLyrics'=>$dynamicLyrics,
					':id'=>$id
				);
			}
			else {
				$updateQuery = "UPDATE music SET title = :title, artist = :artist, composer = :composer, lyrics = :simpleLyrics, dynamic_lyrics = :dynamicLyrics, dynamic_lyrics_toggle = :dynamicToggle, start_padding = :startPadding, end_padding = :endPadding WHERE id = :id";
				$updateParams = array(
					':title'=>$title,
					':artist'=>$artist,
					':composer'=>$composer,
					':dynamicToggle'=>$dynamic_lyrics_toggle,
					':simpleLyrics'=>$simpleLyrics,
					':dynamicLyrics'=>$dynamicLyrics,
					':startPadding'=>$start_padding,
					':endPadding'=>$end_padding,
					':id'=>$id
				);
			}

			try {
				exec_sql_query($db, $updateQuery, $updateParams);
			}
			catch (PDOException $exception) {
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'Something was wrong with the update of the media: '.$exception;
				closeFileNew($arrayToSend);
				return;
			}

			// Getting old album_artist record, replacing old album_artist_id with new one
			// We first check if there is a relationship between the song and the album artist first:
			$selectQuery = "SELECT COUNT(id) AS num FROM albumToalbum_artist WHERE album_id = :albumId";
			$selectParams = array(
				':albumId'=>$album
			);
			$insertQuery = "INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES ( :albumId, :albumArtistId)";
			$insertParams = array(
				':albumId'=>$album,
				':albumArtistId'=>$album_artist
			);
			$updateQuery = "UPDATE albumToalbum_artist SET album_artist_id = :albumArtistId WHERE album_id = :albumId";
			$updateParams = array(
				':albumId'=>$album,
				':albumArtistId'=>$album_artist
			);
			$deleteQuery = "DELETE FROM albumToalbum_artist WHERE album_id = :albumId AND album_artist_id = :albumArtistId";
			// We complete $deleteParams inside try{}
			$deleteParams = array(
				':albumId'=>$album,
				':albumArtistId'=>''
			);

			try {
				$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
				if ( $result[0]['num'] == 0 ) exec_sql_query($db, $insertQuery, $insertParams);
				else if ( $result[0]['num'] == 1 ) exec_sql_query($db, $updateQuery, $updateParams);
				else if ( $result[0]['num'] > 1 ) {
					$found = false;
					foreach ($result as $row) {
						if ($row["album_artist_id"] == $album_artist) $found = true;
						else {
							$deleteParams[':albumArtistId'] = $row['album_artist_id'];
							exec_sql_query($db, $deleteQuery, $deleteParams);
						}
					}
					// IF there is no preset relationship, we create a new one:
					if (!$found) exec_sql_query($db, $insertQuery, $insertParams);
				}
			}
			catch (PDOException $exception) {
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'Error with updating relationship between album and album artist: '.$exception;
				closeFileNew($arrayToSend);
				return;
			}
				
			// We now perform the same thing with songToalbum, just in case
			$selectQuery = "SELECT COUNT(id) AS num FROM songToalbum WHERE song_id = :songId";
			$selectParams = array(
				':songId'=>$id
			);
			$insertQuery = "INSERT INTO songToalbum (song_id, album_id) VALUES ( :songId, :albumId)";
			$insertParams = array(
				':songId'=>$id,
				':albumId'=>$album
			);
			$updateQuery = "UPDATE songToalbum SET album_id = :albumId WHERE song_id = :songId";
			$updateParams = array(
				':songId'=>$id,
				':albumId'=>$album
			);
			$deleteQuery = "DELETE FROM songToalbum WHERE song_id = :songId AND album_id = :albumId";
			// We complete $deleteParams inside try{}
			$deleteParams = array(
				':songId'=>$id,
				':albumId'=>''
			);

			try {
				$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
				if ( $result[0]['num'] == 0 ) exec_sql_query($db, $insertQuery, $insertParams);
				else if ( $result[0]['num'] == 1 ) exec_sql_query($db, $updateQuery, $updateParams);
				else if ( $result[0]['num'] > 1 ) {
					$found = false;
					foreach ($result as $row) {
						if ($row["album_id"] == $album) $found = true;
						else {
							$deleteParams[':albumId'] = $row['album_id'];
							exec_sql_query($db, $deleteQuery, $deleteParams);
						}
					}
					// IF there is no preset relationship, we create a new one:
					if (!$found) exec_sql_query($db, $insertQuery, $insertParams);
				}
			}
			catch (PDOException $exception) {
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'Error with updating relationship between song and album: '.$exception;
				closeFileNew($arrayToSend);
				return;
			}

			if ($newArtUploaded == 0) {
				// If we set a new replacement art via selecting an already-existing artwork, we simply update the songToart row

				$selectQuery = "SELECT art_id FROM songToart WHERE song_id = :songId";
				$selectParams = array(
					':songId'=>$id
				);
				$updateQuery = "UPDATE songToart SET art_id = :artId WHERE song_id = :songId";
				$updateParams = array(
					':artId'=>$new_art,
					':songId'=>$id
				);

				try {
					if ( isset($new_art) && $new_art != null && $new_art != -1 ) {
						$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
						$old_art_id = $result[0]['art_id'];
						exec_sql_query($db, $updateQuery, $updateParams);
					}
				}
				catch (PDOException $exception) {
					$arrayToSend['success'] = false;
					$arrayToSend['message'] = 'Error with updating relationship between song and artwork: '.$exception;
					closeFileNew($arrayToSend);
					return;
				}
			}

			$arrayToSend['success'] = true;
			$arrayToSend['data'] = array(
				'id' => $id,
				'title' => $title,
				'artist' => $artist,
				'album' => $album,
				'album_aritst' => $album_artist,
				'composer' => $composer,
				'start_padding' => $start_padding,
				'end_padding' => $end_padding,
				'dynamic_lyrics_toggle' => $dynamic_lyrics_toggle,
				'simple_lyrics' => $simple_lyrics,
				'dynamic_lyrics_texts' => $dynamic_lyrics_texts,
				'dynamic_lyrics_times' => $dynamic_lyrics_times,
				'dynamic_lyrics_styles' => $dynamic_lyrics_styles,
				'dynamic_lyrics_notexts' => $dynamic_lyrics_notexts,
				'lyrics' => $lyrics,
				'medium' => $medium,
				'new_art' => $new_art
			);
			closeFileNew($arrayToSend);
			return;

		} else {
			$id = filter_input(INPUT_POST, "id_edit", FILTER_VALIDATE_INT);

			// Firstly, grab the album artist id from our row in the database
			$selectQuery1 = "SELECT album_id FROM songToalbum WHERE song_id = :songId";
			$selectParams1 = array(
				':songId'=>$id
			);
			$selectQuery2 = "SELECT album_artist_id FROM albumToalbum_artist WHERE album_id = :albumId";
			$selectParams2 = array(
				':albumId'=>$album
			);

			try {
				$result = exec_sql_query($db, $selectQuery1, $selectParams1)->fetchAll();
				$album = $result[0]['album_id'];
				$result = exec_sql_query($db, $selectQuery2, $selectParams2)->fetchAll();
				$album_artist = $result[0]['album_artist_id'];
			}
			catch (PDOException $exception) {
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'Could not grab album id: '.$exception;
				closeFileNew($arrayToSend);
				return;
			}

			// Secondly: check if the album artist has any songs under its belt, if not then delete the album artist
			$selectQuery1 =  "SELECT COUNT(*) AS num FROM albumToalbum_artist WHERE album_artist_id=".$album_artist;
			$selectParams1 = array(
				':albumArtistId'=>$album_artist
			);
			$deleteQuery = "DELETE FROM album_artists WHERE id = :id; DELETE FROM albumToalbum_artist WHERE album_artist_id = :id";
			$deleteParams = array(
				':id'=>$album_artist
			);

			try {
				$result = exec_sql_query($db, $selectQuery1, $selectParams1)->fetchAll();
				if ($result[0]['num'] == 0) exec_sql_query($db, $deleteQuery, $deleteParams); 
			}
			catch (PDOException $exception) {
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'Could not confirm if an album artist has more than 0 albums after deletion: '.$exception;
				closeFileNew($arrayToSend);
				return;
			}

			$selectQuery1 =  "SELECT COUNT(*) AS num FROM songToalbum WHERE album_id = :albumId";
			$selectParams1 = array(
				':albumId'=>$album
			);
			$deleteQuery = "DELETE FROM albums WHERE id = :id; DELETE FROM songToalbum WHERE album_id = :id";
			$deleteParams = array(
				':id'=>$album
			);

			try {
				$result = exec_sql_query($db, $selectQuery1, $selectParams1)->fetchAll();
				if ($result[0]['num'] == 0) exec_sql_query($db, $deleteQuery, $deleteParams); 
			}
			catch (PDOException $exception) {
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'Could not confirm if an album has more than 0 songs after deletion: '.$exception;
				closeFileNew($arrayToSend);
				return;
			}

			// Now, delete the song and art relationship
			$selectQuery1 =  "SELECT art_id FROM songToart WHERE song_id = :songId";
			$selectParams1 = array(
				':songId'=>$id
			);
			$deleteQuery = "DELETE FROM songToart WHERE song_id = :songId AND art_id = :artId";
			// $deleteParams to be completed inside try{}
			$deleteParams = array(
				':songId'=>$id,
				':artId'=>''
			);
			$art_id = null;

			try {
				$result = exec_sql_query($db, $selectQuery1, $selectParams1)->fetchAll();
				$art_id = $result[0]['art_id'];
				$deleteParams[':artId'] = $result[0]['art_id'];
				exec_sql_query($db, $deleteQuery, $deleteParams); 
			}
			catch (PDOException $exception) {
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'Could not delete relationship between song and art from the songToart table: '.$exception;
				closeFileNew($arrayToSend);
				return;
			}

			// check if that very art has any more relationships with other songs - if none, then delete the art itself
			$selectQuery1 =  "SELECT COUNT(*) AS num FROM songToart WHERE art_id = :artId";
			$selectParams1 = array(
				':artId'=>$art_id
			);
			$deleteQuery = "DELETE FROM art WHERE id = :id";
			$deleteParams = array(
				':id'=>$art_id
			);

			try {
				$result = exec_sql_query($db, $selectQuery1, $selectParams1)->fetchAll();
				if ($result[0]['num'] == 0) exec_sql_query($db, $deleteQuery, $deleteParams); 
			}
			catch (PDOException $exception) {
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'Could not confirm if the art has any remaining relationships with other songs: '.$exception;
				closeFileNew($arrayToSend);
				return;
			}

			// Now, delete row from music table altogether
			$deleteQuery = "DELETE FROM music WHERE id = :id";
			$deleteParams = array(
				':id'=>$id
			);
			try {
				exec_sql_query($db, $deleteQuery, $deleteParams);
			}
			catch (PDOException $exception) {
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'Could not delete song from database: '.$exception;
				closeFileNew($arrayToSend);
				return;
			}

			// We won't actually delete the file, in case we want it again
			
			$arrayToSend['success'] = true;
			$arrayToSend['message'] = 'Successfully deleted song from database';
			closeFileNew($arrayToSend);
			return;
		}
	}

?>