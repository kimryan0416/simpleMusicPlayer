<?php
	session_start();
	require('getid3/getid3.php');
	require("config.php");
	$arrayToSend = array();

	$getID3 = new getID3;
	
	$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);
	
	// $song is the url to the file, saved inside session
	$song = $_SESSION["files"][$id];

	$path_parts = pathinfo($song);
	// $path_parts turns into an array containing the following values:
	/*
		basename: The original filename, basically, extension included
		dirname: the path to the file, only up to the parent directory without the "/" at the end
		extension: the extension, like "m4a" or "mp4"
		filename: the basename, without the extension
	*/

	$thisFileInfo = $getID3->analyze("../".$song);
	getid3_lib::CopyTagsToComments($thisFileInfo);
	$song_info = $thisFileInfo["comments_html"];


	// Getting all the info in prep for adding into the table:
	// id was already gotten with $id
	// url was already given with $song
	$filename = htmlspecialchars($path_parts["filename"]);
	$extension = $path_parts["extension"];
	$title = str_replace("'", "&#39;", $song_info["title"][0]);
	$artist = str_replace("'", "&#39;", $song_info["artist"][0]);

	if ( isset ($song_info["album_artist_sort_order"]) ) {
		$album_artist = htmlspecialchars($song_info["album_artist_sort_order"][0]);
	} else if ( isset ($song_info["band"]) ) {
		$album_artist = htmlspecialchars($song_info["band"][0]);
	} else {
		$album_artist = "No Album Artist";
	}
	$album_artist_id = -1;
	$query = 'SELECT id FROM album_artists WHERE name="'.$album_artist.'"';
	if (!$results = $db->query($query)) {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Error in finding if album artists already exists in database";
		closeFile($arrayToSend);
	}
	if ($results->num_rows == 0) {
		$query = 'INSERT INTO album_artists (name) VALUES ("'.$album_artist.'")';
		if (!$db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Error in creating new album artist";
			closeFile($arrayToSend);
		} 
		$album_artist_id = $db->insert_id;
	}
	else {
		$row = $results->fetch_assoc();
		$album_artist_id = $row["id"];
	}
	$album_artist = $album_artist_id;


	if ( isset($song_info["album"]) ) {
		$album = $song_info["album"][0];
	} else {
		$album = "Unknown Album";
	}
	$album_id = -1;
	$query = 'SELECT id FROM albums WHERE name="'.$album.'"';
	if (!$results = $db->query($query)) {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Error in finding if album already exists in database";
		closeFile($arrayToSend);
	}
	if ($results->num_rows == 0) {
		$query = 'INSERT INTO albums (name) VALUES ("'.$album.'")';
		if (!$db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Error in creating new album";
			closeFile($arrayToSend);
		} 
		$album_id = $db->insert_id;
	}
	else {
		$row = $results->fetch_assoc();
		$album_id = $row["id"];
	}
	$album = $album_id;

	
	if (isset($song_info["composer"])) {
		$composer = $song_info["composer"][0];
	} else {
		$composer = "";
	}
	if ( isset($song_info["lyrics"]) ) {
		//$lyrics = html_entity_decode($song_info["lyrics"][0], ENT_QUOTES, "utf-8");
		$lyrics = $song_info["lyrics"][0];
		$lyrics = preg_replace("/\r\n|\r|\n/",'<br/>',$lyrics);
		$lyrics = str_replace(array("'", "&#13;"), array("&#39;", "<br/>"), $lyrics);
	} else if ( isset($song_info["unsynchronized_lyric"]) ) {
		//$lyrics = html_entity_decode($song_info["unsynchronized_lyric"][0], ENT_QUOTES, "utf-8");
		$lyrics = $song_info["unsynchronized_lyric"][0];
		//$lyrics = preg_replace("/\r\n|\r|\n/",'<br/>',$lyrics);
		$lyrics = str_replace(array("'", "&#13;"), array("&#39;", "<br/>"), $lyrics);
	} else {
		$lyrics = "<i>No Lyrics Provided</i>";
	}
	if ( isset($song_info["comment"]) ) {
		$comment = myUrlEncode($song_info["comment"][0]);
	} else {
		$comment = "";
	}

	$query = "INSERT INTO music (url, filename, extension, title, artist, composer, lyrics, comment, duration) VALUES (\"".$song."\", \"".myUrlEncode($filename)."\", \"".$extension."\", \"".$title."\", \"".$artist."\", \"".$composer."\", \"".$lyrics."\", \"".$comment."\", \"".$thisFileInfo["playtime_string"]."\");";
	if (!$db->query($query)) {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Unable to insert into database: " . $title . " | " . $db->error;
		closeFile($arrayToSend);
	}
	$id = $db->insert_id;
		
	$query = "INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES (".$album.", ".$album_artist.")";
	if (!$db->query($query)) {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Added media, but unable to insert relationship between album and album artist: " . $db->error;
		closeFile($arrayToSend);
	}
	$query = "INSERT INTO songToalbum (song_id, album_id) VALUES (".$id.", ".$album.")";
	if (!$db->query($query)) {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Added media, but unable to insert relationship between song and album: " . $db->error;
		closeFile($arrayToSend);
	}

	$arrayToSend["success"] = true;
	$arrayToSend["song_info"] = $song_info;
	closeFile($arrayToSend);
?>