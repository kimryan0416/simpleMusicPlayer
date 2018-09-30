<?php
	require("config.php");
	$db = open_or_init_sqlite_db('database.sqlite', 'init.sql');

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
		if ( count($errors_array) > 0 ) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Errors detected in your embed input";
			$arrayToSend["errors"] = $errors_array;
			//closeFile($arrayToSend, false);
			closeFileNew($arrayToSend);
			return;
		}

		$album_id = -1;
		$selectQuery = "SELECT id FROM albums WHERE name = :name";
		$selectParams = array(
			':name'=>$album
		);
		$insertQuery = 'INSERT INTO albums (name) VALUES ( :name )';
		$insertParams = array(
			':name'=>$album
		);
		$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
		$grabParams = array(
			':tableName'=>'albums'
		);

		try {
			$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
			if ( count($result) == 0 ) {
				exec_sql_query($db, $insertQuery, $insertParams);
				$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
				$album_id = $result[0]['seq'];
			} else {
				$album_id = $result[0]['id'];
			}
		}
		catch(PDOException $exception) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Error in finding if album already exists in database: " . $exception;
			closeFileNew($arrayToSend, false);
			return;
		}
		$album = $album_id;

		/*
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
		*/

		$album_artist_id = -1;
		$selectQuery = "SELECT id FROM album_artists WHERE name = :name";
		$selectParams = array(
			':name'=>$album_artist
		);
		$insertQuery = 'INSERT INTO album_artists (name) VALUES ( :name )';
		$insertParams = array(
			':name'=>$album_artist
		);
		$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
		$grabParams = array(
			':tableName'=>'album_artists'
		);
		try {
			$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
			if ( count($result) == 0 ) {
				exec_sql_query($db, $insertQuery, $insertParams);
				$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
				$album_artist_id = $result[0]['seq'];
			} else {
				$album_artist_id = $result[0]['id'];
			}
		}
		catch(PDOException $exception) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Error in finding if album artist already exists in database: " . $exception;
			closeFileNew($arrayToSend, false);
			return;
		}
		$album_artist = $album_artist_id;

		/*
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
		*/
		
		$insertQuery = "INSERT INTO music (url, title, artist, composer, medium, extension, duration) VALUES ( :url, :title, :artist, :composer, :medium, :extension, :duration)";
		$insertParams = array(
			':url'=>$url,
			':title'=>$title,
			':artist'=>$artist,
			':composer'=>$composer,
			':medium'=>1,
			':extension'=>'',
			':duration'=>0
		);
		$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
		$grabParams = array(
			':tableName'=>'music'
		);
		$id = null;

		try {
			exec_sql_query($db, $insertQuery, $insertParams);
			$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
			$id = $result[0]['seq'];
		}
		catch (PDOException $exception) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Unable to insert into database: " . $exception;
			closeFileNew($arrayToSend);
			return;
		}

		/*
		$query = "INSERT INTO music (url, title, artist, composer, medium) VALUES (\"".$url."\", \"".$title."\", \"".$artist."\", \"".$composer."\", 1);";
		if (!$db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Unable to insert into database: " . $title . " | " . $db->error;
			closeFile($arrayToSend, false);
			return;
		}
		$id = $db->insert_id;
		*/

		$albumToalbum_artist_id = -1;
		$selectQuery = "SELECT id FROM albumToalbum_artist WHERE album_id = :albumId AND album_artist_id = :albumArtistId";
		$selectParams = array(
			':albumId'=>$album,
			':albumArtistId'=>$album_artist
		);
		$insertQuery = "INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES ( :albumId, :albumArtistId )";
		$insertParams = array(
			':albumId'=>$album,
			':albumArtistId'=>$album_artist
		);
		$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
		$grabParams = array(
			':tableName'=>'albumToalbum_artist'
		);

		try {
			$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
			if ( count($result) == 0 ) {
				exec_sql_query($db, $insertQuery, $insertParams);
				$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
				$albumToalbum_artist_id = $result[0]['seq'];
			}
			else $albumToalbum_artist_id = $result[0]['id'];
		}
		catch (PDOException $exception) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Added media, but unable to check if relationship between album and album artist already exists: " . $exception;
			closeFileNew($arrayToSend);
			return;
		}

		/*
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
		*/

		$songToalbum_id = -1;
		$selectQuery = "SELECT id FROM songToalbum WHERE album_id = :albumId AND song_id = :songId";
		$selectParams = array(
			':albumId'=>$album,
			':songId'=>$id
		);
		$insertQuery = "INSERT INTO songToalbum (song_id, album_id) VALUES ( :songId, :albumId)";
		$insertParams = array(
			':songId'=>$id,
			':albumId'=>$album
		);
		$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
		$grabParams = array(
			':tableName'=>'songToalbum'
		);

		try {
			$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
			if ( count($result) == 0 ) {
				exec_sql_query($db, $insertQuery, $insertParams);
				$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
				$songToalbum_id = $result[0]['seq'];
			}
			else $songToalbum_id = $result[0]['id'];
		}
		catch(PDOException $exception) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Added media, but unable to check if relationship between video and album already exists: " . $exception;
			closeFileNew($arrayToSend);
			return;
		}

		/*
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
		*/

		$insertQuery = "INSERT INTO songToart (song_id, art_id) VALUES ( :songId, 0)";
		$insertParams = array(
			':songId'=>$id
		);
		$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
		$grabParams = array(
			':tableName'=>'songToart'
		);

		try {
			exec_sql_query($db, $insertQuery, $insertParams);
			$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
			$art_id = $result[0]['seq'];
		}
		catch (PDOException $exception) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Added media, but unable to insert relationship between song and art: " . $exception;
			closeFileNew($arrayToSend);
			return;
		}

		/*
		$query = "INSERT INTO songToart (song_id, art_id) VALUES (".$id.", 0)";
		if (!$db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Added media, but unable to insert relationship between song and art: " . $db->error;
			closeFile($arrayToSend, false);
			return;
		}
		$art_id = $db->insert_id;
		*/

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
		//closeFile($arrayToSend, true);
		closeFileNew($arrayToSend);
		return;

	} else {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "No GET detected";
		//closeFile($arrayToSend, false);
		closeFileNew($arrayToSend);
		return;
	}
?>