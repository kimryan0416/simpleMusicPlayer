<?php
	require("config.php");
	$arrayToSend = array();
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
	//$query = "SELECT T1.id AS id, title, url, artist, album_artist, album, medium, art, T2.name AS album_artist_name FROM music AS T1 INNER JOIN album_artists AS T2 ON T1.album_artist = T2.id ORDER BY title";
	if (!$music = $db->query($query)) {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Error in getting media info from database";
		closeFile($arrayToSend);
	}
	
	/*
	$query = "SELECT * FROM albums ORDER BY name";
	$albums = array();
	if (!$albumsDB = $db->query($query)) {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Error getting albums";
		closeFile($arrayToSend);
	}
	while ($row = $albumsDB->fetch_assoc()) {
		$albums[$row["id"]] = $row["name"]; 
	}
	*/

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
			"medium" => $row["medium"]
		);
	}

	$arrayToSend["success"] = true;
	$arrayToSend["data"] = $content;
	closeFile($arrayToSend);

?>