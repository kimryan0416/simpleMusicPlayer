<?php
	require("config.php");
	$success = false;
	$message = "No GET request sent";
	$name = "";
	$description = "";
	$songs = array();

	function randomIDGenerator($n) {
		$IDstring = "";
		for($i = 0; $i < $n; $i++) {
			$IDstring.=(string)rand(1, 10);
		}
		return $IDstring;
	}


	if ( isset($_GET["get"]) ) {
		$name= filter_input( INPUT_POST, 'name', FILTER_SANITIZE_STRING );
		$description = filter_input( INPUT_POST, 'description', FILTER_SANITIZE_STRING );
		$songs = $_POST["create_playlist_song_selected"];

		if ( strlen(trim($name)) == 0 ) {
			$message = "Your playlist must have a name!";
		} else if (sizeof($songs) == 0) {
			$message = "You must select at least one song!";
		} else if (file_exists(PATH_TO_ALBUMS)) {
			$albumsJSON = file_get_contents(PATH_TO_ALBUMS);
			$albums = json_decode($albumsJSON, true);
			$verified = false;
			$newID = "";
			while(!$verified) {
				$newID = randomIDGenerator(10);
				if (sizeof($albums["playlist"]) == 0) {
					$verified = true;
				} else {
					foreach($albums["playlist"] as $playlist) {
						if ($playlist["id"] != $newID) {
							$verified = true;
						} else {
							$verified = false;
						}
					}
				}
			}
			$albums["playlist"][] = array(
				"id"=>$newID,
				"name"=>$name,
				"list"=>$songs
			);
			
			usort($albums["playlist"], function($a, $b) {
				return strcmp($a["name"], $b["name"]);
			});
			
			$encodedAlbums = json_encode($albums);
			$fp = fopen(PATH_TO_ALBUMS, "w");
			fwrite($fp, $encodedAlbums);
			fclose($fp);
			$success = true;
			$message = "Successful Playlist Insertion";
		}
	}
	$arrayToSend = array(
		"Success"=>$success,
		"Message"=>$message,
		"Name"=>$name,
		"Description"=>$description,
		"Songs"=>$songs
	);
	print(json_encode($arrayToSend));
	return;
?>