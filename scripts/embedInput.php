<?php
	require("config.php");
	$arrayToSend = array();
	$errors_array = array();
	
	if ( isset($_GET["input"]) ) {
		$title = filter_input(INPUT_POST, "video_title_input", FILTER_SANITIZE_STRING);
		$artist = filter_input(INPUT_POST, "video_artist_input", FILTER_SANITIZE_STRING);
		$album = filter_input(INPUT_POST, "video_album_input", FILTER_SANITIZE_STRING);
		$album_artist = filter_input(INPUT_POST, "video_album_artist_input", FILTER_SANITIZE_STRING);
		$composer = filter_input(INPUT_POST, "video_composer_input", FILTER_SANITIZE_STRING);
		$url = filter_input(INPUT_POST, "video_url_input", FILTER_SANITIZE_STRING);

		if ( strlen(trim($title)) == 0 ) $errors_array["title"] = "You must enter a title";
		
		if ( strlen(trim($artist)) == 0 ) $errors_array["artist"] = "You must enter an artist";

		if ( strlen(trim($album)) == 0 ) $errors_array["album"] = "You must enter an album";
		
		if ( strlen(trim($album_artist)) == 0 ) $errors_array["album_artist"] = "You must enter an album artist";

		if ( strlen(trim($url)) == 0 ) $errors_array["url"] = "You must enter an iframe URL";

		$num = count($errors_array);
		if ( $num > 0 ) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Errors detected in your embed input";
			$arrayToSend["errors"] = $errors_array;
			closeFile($arrayToSend, false);
			return;
		}
		


		$album_id = -1;
		$query = 'SELECT id FROM albums WHERE name="'.$album.'"';
		if (!$results = $db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Error in finding if album already exists in database";
			closeFile($arrayToSend, false);
			return;
		}
		if ($results->num_rows == 0) {
			$query = 'INSERT INTO albums (name) VALUES ("'.$album.'")';
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error in creating new album";
				closeFile($arrayToSend, false);
				return;
			} 
			$album_id = $db->insert_id;
		}
		else {
			$row = $results->fetch_assoc();
			$album_id = $row["id"];
		}
		$album = $album_id;

		$album_artist_id = -1;
		$query = 'SELECT id FROM album_artists WHERE name="'.$album_artist.'"';
		if (!$results = $db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Error in finding if album artists already exists in database";
			closeFile($arrayToSend, false);
			return;
		}
		if ($results->num_rows == 0) {
			$query = 'INSERT INTO album_artists (name) VALUES ("'.$album_artist.'")';
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error in creating new album artist";
				closeFile($arrayToSend, false);
				return;
			} 
			$album_artist_id = $db->insert_id;
		}
		else {
			$row = $results->fetch_assoc();
			$album_artist_id = $row["id"];
		}
		$album_artist = $album_artist_id;
		
		$query = "INSERT INTO music (url, title, artist, composer, medium) VALUES (\"".$url."\", \"".$title."\", \"".$artist."\", \"".$composer."\", 1);";
		if (!$db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Unable to insert into database: " . $title . " | " . $db->error;
			closeFile($arrayToSend, false);
			return;
		}
		$id = $db->insert_id;

		$query = "SELECT id FROM albumToalbum_artist WHERE album_id=".$album." AND album_artist_id=".$album_artist;
		if (!$result = $db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Added media, but unable to check if relationship between album and album artist already exists: " . $db->error;
			closeFile($arrayToSend, false);
			return;
		}
		$albumToalbum_artist_id = -1;
		if ( $result->num_rows == 0 ) {
			$query = "INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES (".$album.", ".$album_artist.");";
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Added media, but unable to insert relationship between album and album artist: " . $db->error;
				closeFile($arrayToSend, false);
				return;
			}
			$albumToalbum_artist_id = $db->insert_id;
		} else {
			$row = $result->fetch_assoc();
			$albumToalbum_artist_id = $row["id"];
		}

		$query = "SELECT id FROM songToalbum WHERE album_id=".$album." AND song_id=".$id;
		if (!$result = $db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Added media, but unable to check if relationship between video and album already exists: " . $db->error;
			closeFile($arrayToSend, false);
		}
		$songToalbum_id = -1;
		if ( $result->num_rows == 0 ) {
			$query = "INSERT INTO songToalbum (song_id, album_id) VALUES (".$id.", ".$album.");";
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Added media, but unable to insert relationship between video and album: " . $db->error;
				closeFile($arrayToSend, false);
			}
			$songToalbum_id = $db->insert_id;
		} else {
			$row = $result->fetch_assoc();
			$songToalbum_id = $row["id"];
		}

		$query = "INSERT INTO songToart (song_id, art_id) VALUES (".$id.", 0)";
		if (!$db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Added media, but unable to insert relationship between song and art: " . $db->error;
			closeFile($arrayToSend, false);
			return;
		}
		$art_id = $db->insert_id;

		$arrayToSend["success"] = true;
		$arrayToSend["info"] = array(
			"id" => $id,
			"title" => $title,
			"artist" => $artist,
			"album" => $album,
			"album_artist" => $album_artist,
			"composer" => $composer,
			"url" => $ifraA[0],
			"album_to_albumArtist_id" => $albumToalbum_artist_id,
			"song_to_album_id" => $songToalbum_id,
			"art" => $art_id
		);
		closeFile($arrayToSend, true);
		return;

	} else {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "No GET detected";
		closeFile($arrayToSend, false);
		return;
	}
?>