<?php
	require("getid3/getid3.php");
    require("config.php");
    /**/
    $db = open_or_init_sqlite_db('database.sqlite', 'init.sql');
    /**/

	$getID3 = new getID3;

	$media_types = array(
        // audio
		'mp3' => 'audio/mpeg',
		'm4a' => 'audio/mp4',
		// video
		'mp4' => 'video/mp4'
	);

	$audio_types = array(
		'mp3' => 'audio/mpeg',
		'm4a' => 'audio/mp4'
	);
	$video_types = array(
		'mp4' => 'video/mp4'
	);

	$upload_dir = 'media/uploads/';
	$arrayToSend = array();

	if ( isset($_GET["add"]) && ($_GET["add"]==1) ) {

		$arrayToSend["files"] = array();
		$path = realpath("../upload_directory/");

		$dir  = new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS);
		$rii = new RecursiveIteratorIterator($dir, RecursiveIteratorIterator::LEAVES_ONLY);
		$files = array(); 
		foreach ($rii as $file) {
			if (!$file->isDir()) {
				$path_parts = pathinfo($file->getPathname());
				$title = $path_parts["basename"];
				if ( substr($title, 0, 1) != "." ) {
					$fileURL = $file->getPathname();
					$newFileURL = str_replace("/Users/RK/Desktop/MAMP_WEB/simple_music_player/v3/", "../", $fileURL);
					$files[] = $newFileURL;
				} 
			}
		}

		foreach ( $files as $file ) {
			$thisFileInfo = $getID3->analyze($file);
			getid3_lib::CopyTagsToComments($thisFileInfo);
			$song_info = $thisFileInfo["comments_html"];
			$path_parts = pathinfo($file);
		
			$filename = htmlspecialchars($path_parts["filename"]);
			$extension = pathinfo(basename($file), PATHINFO_EXTENSION);
			$extensionType = ( array_key_exists($extension, $video_types) ) ? 2 : 0;

			if ( !array_key_exists($extension, $media_types) ) {
				// This error means the file is an image but is not a jpg or png, so the uploader has to choose another icon
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "File is not mp3, m4a or mp4";
				closeFileNew($arrayToSend);
				return;
			}

			// Now, we can't do anything else for this thing - we need to get the id so that when we move the file, it's renamed with the id in mind.
			// For now, we process the file info to insert into the database
			
			$title = str_replace("'", "&#39;", $song_info["title"][0]);
			$artist = str_replace("'", "&#39;", $song_info["artist"][0]);

			if ( isset ($song_info["album_artist_sort_order"]) ) $album_artist = $song_info["album_artist_sort_order"][0];
			else if ( isset ($song_info["album_artist"]) ) $album_artist = $song_info["album_artist"][0];
			else if ( isset ($song_info["band"]) ) $album_artist = $song_info["band"][0];
			else $album_artist = "No Album Artist";
			$album_artist_id = -1;

			$selectQuery = "SELECT id FROM album_artists WHERE name = :name";
			$selectParams = array(
				':name' => $album_artist
			);
			$insertQuery = 'INSERT INTO album_artists (name) VALUES ( :name )';
			$insertParams = array(
				':name' => $album_artist
			);
			$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
			$grabParams = array(
				':tableName'=>'album_artists'
			);
			$result = null;

			try { 
				$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
				if ( count($result) == 0 ) {
					exec_sql_query($db, $insertQuery, $insertParams);
					$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
					$album_artist_id = $result[0]['seq'];
				}
				else $album_artist_id = $result[0]['id'];
				$album_artist = $album_artist_id;
			}
			catch (PDOException $exception) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error in finding if album artists already exists in database: " . $exception;
				closeFileNew($arrayToSend);
				return;
			}
												/*
			$query = 'SELECT id FROM album_artists WHERE name="'.$album_artist.'"';
			if (!$results = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error in finding if album artists already exists in database";
				closeFile($arrayToSend);
				return;
			}
			if ($results->num_rows == 0) {
				$query = 'INSERT INTO album_artists (name) VALUES ("'.$album_artist.'")';
				if (!$db->query($query)) {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Error in creating new album artist";
					closeFile($arrayToSend);
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

			$album = ( isset($song_info["album"]) ) ? $song_info["album"][0] : "Unknown Album";
			$album_id = -1;

			$selectQuery = "SELECT id FROM albums WHERE name=:name";
			$selectParams = array(
				':name' => $album
			);
			$insertQuery = 'INSERT INTO albums (name) VALUES ( :name )';
			$insertParams = array(
				':name' => $album
			);
			$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
			$grabParams = array(
				':tableName'=>'albums'
			);

			$result = null;
			try {
				$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
				if ( count($result) == 0 ) {
					exec_sql_query($db, $insertQuery, $insertParams);
					$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
					$album_id = $result[0]['seq'];
				}
				else $album_id = $result[0]['id'];
				$album = $album_id;
			}
			catch(PDOException $exception) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error in finding if album already exists in database: ".$exception;
				closeFileNew($arrayToSend);
				return;
			}
												/*
			$query = 'SELECT id FROM albums WHERE name="'.$album.'"';
			if (!$results = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error in finding if album already exists in database";
				closeFile($arrayToSend);
				return;
			}
			if ($results->num_rows == 0) {
				$query = 'INSERT INTO albums (name) VALUES ("'.$album.'")';
				if (!$db->query($query)) {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Error in creating new album";
					closeFile($arrayToSend);
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

			$selectQuery = "SELECT id FROM albumToart WHERE album_id=:albumId";
			$selectParams = array(
				':albumId' => $album
			);
			$insertQuery = 'INSERT INTO albumToart (album_id, art_id) VALUES ( :albumId, :artId )';
			$insertParams = array(
				':albumId' => $album,
				':artId' => 0
			);
			$result = null;

			try {
				$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
				if ( count($result) == 0 ) exec_sql_query($db, $insertQuery, $insertParams);
			}
			catch (PDOException $exception) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error in finding if album-art relationship already exists: " . $exception;
				closeFileNew($arrayToSend);
				return;
			}
												/*
			$query = 'SELECT id FROM albumToart WHERE album_id='.$album;
			if (!$results = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error in finding if album-art relationship already exists: " . $db->error;
				closeFile($arrayToSend);
				return;
			}
			if ($results->num_rows == 0) {
				$query = 'INSERT INTO albumToart (album_id, art_id) VALUES ('.$album.', 0)';
				if (!$db->query($query)) {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Error in creating new relationship between album and art";
					closeFile($arrayToSend);
					return;
				} 
			}
												*/

			$composer = ( isset($song_info["composer"]) ) ? $song_info["composer"][0] : '';

			if ( isset($song_info["lyrics"]) ) $lyrics = $song_info["lyrics"][0];
			else if ( isset($song_info["unsynchronized_lyric"]) ) $lyrics = $song_info["unsynchronized_lyric"][0];
			else if ($extensionType == 2) $lyrics = "";
			else $lyrics = "No Lyrics Provided";
			
			$comment = ( isset($song_info["comment"]) ) ? myUrlEncode($song_info["comment"][0]) : '';


												/*
			$query = "INSERT INTO music (filename, extension, title, artist, composer, lyrics, comment, duration, medium, start_padding, end_padding) VALUES (\"".myUrlEncode($filename)."\", \"".$extension."\", \"".$title."\", \"".$artist."\", \"".$composer."\", \"".$lyrics."\", \"".$comment."\", \"".$thisFileInfo["playtime_string"]."\", ".$extensionType.", 0, ".convertToMilliseconds($thisFileInfo["playtime_string"]).");";
												*/

			/**/
			$insertQuery = "INSERT INTO music (extension, title, artist, composer, lyrics, comment, duration, medium, start_padding, end_padding, url) VALUES ( :extension, :title, :artist, :composer, :lyrics, :comment, :duration, :medium, :startPadding, :endPadding, :url);";
			$insertParams = array(
				':extension'=>$extension,
				':title'=>$title,
				':artist'=>$artist,
				':composer'=>$composer,
				':lyrics'=>$lyrics,
				':comment'=>$comment,
				':duration'=>$thisFileInfo["playtime_string"],
				':medium'=>$extensionType,
				':startPadding'=>0,
				':endPadding'=>convertToMilliseconds($thisFileInfo["playtime_string"]),
				':url'=> 'temp'
			);
			$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
			$grabParams = array(
				':tableName'=>'music'
			);
			$id = null;

			try {
				exec_sql_query($db, $insertQuery, $insertParams);
				$grabResult = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
				$id = $grabResult[0]['seq'];
			}
			catch (PDOException $exception) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Unable to insert into database: " . $exception;
				closeFileNew($arrayToSend);
				return;
			}
			/**/

												/*
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Unable to insert into database: " . $title . " | " . $db->error;
				closeFile($arrayToSend);
				return;
			}
			$id = $db->insert_id;
												*/
			
			$movedURL = "media/".$id.".".$extension;
			if ( !rename($file, "../".$movedURL) ) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Unable to move file to media upload folder";
				closeFileNew($arrayToSend);
				return;
			}

			// Need to set song - to - art relationship - initially set to null
			$insertQuery = "INSERT INTO songToart (song_id, art_id) VALUES (:songId, :artId)";
			$insertParams = array(
				':songId' => $id,
				':artId' => -1
			);
			try {
				exec_sql_query($db, $insertQuery, $insertParams);
			}
			catch(PDOException $exception) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error with creating new relationship between song and art: " . $exception;
				closeFileNew($arrayToSend);
				return;
			}
												/*
			$query = "INSERT INTO songToart (song_id, art_id) VALUES (".$id.", -1)";
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error with creating new relationship between song and art: ".$db->error;
				closeFile($arrayToSend);
				return;
			}
												*/
			
			// Getting old album_artist record, replacing old album_artist_id with new one
			// We first check if there is a relationship between the song and the album artist first:
			$selectQuery = "SELECT * FROM albumToalbum_artist WHERE album_id=:albumId AND album_artist_id=:albumArtistId";
			$selectParams = array(
				':albumId' => $album,
				':albumArtistId' => $album_artist
			);
			$insertQuery = "INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES ( :albumId, :albumArtistId)";
			$insertParams = array(
				':albumId' => $album,
				':albumArtistId' => $album_artist
			);
			$result = null;

			try {
				$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
				if ( count($result) == 0 ) exec_sql_query($db, $insertQuery, $insertParams);
			}
			catch(PDOException $exception) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error with checking for existing relationship between album and album artist: " . $exception;
				closeFileNew($arrayToSend);
				return;
			}
												/*
			$query = "SELECT * FROM albumToalbum_artist WHERE album_id=".$album." AND album_artist_id=".$album_artist;
			if (!$result = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error with updating relationship between album and album artist: ".$db->error;
				closeFile($arrayToSend);
				return;
			}
			if ($result->num_rows == 0) {
				// IF there is no preset relationship, we create a new one:
				$query = "INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES (".$album.", ".$album_artist.")";
				if (!$db->query($query)) {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Error with creating new relationship between album and album artist: ".$db->error;
					closeFile($arrayToSend);
					return;
				}
			} 
												*/
				
			// We now perform the same thing with songToalbum, just in case
			$selectQuery = "SELECT * FROM songToalbum WHERE song_id = :songId AND album_id = :albumId";
			$selectParams = array(
				':songId' => $id,
				':albumId' => $album
			);
			$insertQuery = "INSERT INTO songToalbum (song_id, album_id) VALUES ( :songId, :albumId )";
			$insertParams = array(
				':songId' => $id,
				':albumId' => $album
			);
			$result = null;

			try {
				$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
				if ( count($result) == 0 ) exec_sql_query($db, $insertQuery, $insertParams);
			}
			catch (PDOException $exception) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error with checking for existing relationship between song and album: ".$exception;
				closeFileNew($arrayToSend);
				return;
			}
												/*
			$query = "SELECT * FROM songToalbum WHERE song_id=".$id." AND album_id=".$album;
			if (!$result = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error with updating relationship between song and album: ".$db->error;
				closeFile($arrayToSend);
				return;
			}
			if ($result->num_rows == 0) {
				// IF there is no preset relationship, we create a new one:
				$query = "INSERT INTO songToalbum (song_id, album_id) VALUES (".$id.", ".$album.")";
				if (!$db->query($query)) {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Error with creating new relationship between song and album: ".$db->error;
					closeFile($arrayToSend);
					return;
				}
			}
												*/

			$updateQuery = "UPDATE music SET url = :url WHERE id = :id";
			$updateParams = array(
				':url' => $movedURL,
				':id' => $id
			);
			try {
				exec_sql_query($db, $updateQuery, $updateParams);
			}
			catch (PDOException $exception) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Could not update url of file into databse: " . $exception;
				closeFileNew($arrayToSend);
				return;
			}
												/*
			$query = "UPDATE music SET url=\"".$movedURL."\" WHERE id=".$id;
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Could not update url of file into databse: " . $db->error;
				closeFile($arrayToSend);
				return;
			}
												*/

		}

		$arrayToSend["success"] = true;
		closeFileNew($arrayToSend);
		return;

	} else {
		$arraToSend["success"] = false;
		$arrayToSend["message"] = "Type not set";
		closeFileNew($arrayToSend);
		return;
	}


?>