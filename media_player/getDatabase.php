<?php
	require("config.php");

	$success = false;
	$media = array();
	$albums= array();
	$playlists = array();
	if ( isset($_GET["get"]) ) {
		if (file_exists(PATH_TO_DATABASE)) {
			$database = file_get_contents(PATH_TO_DATABASE);
			$media = json_decode($database, true);
		} else {
			$encodedMedia = json_encode($media);
			$fp = fopen(PATH_TO_DATABASE, 'w');
			fwrite($fp, $encodedMedia);
			fclose($fp);
		}

		if (file_exists(PATH_TO_ALBUMS)) {
			$albumsJSON = file_get_contents(PATH_TO_ALBUMS);
			$albums = json_decode($albumsJSON, true);
		} else {
			$encodedAlbums = json_encode($albums);
			$fp = fopen(PATH_TO_ALBUMS, "w");
			fwrite($fp, $encodedAlbums);
			fclose($fp);
		}

		if (file_exists(PATH_TO_PLAYLISTS)) {
			$playlistsJSON = file_get_contents(PATH_TO_PLAYLISTS);
			$playlists = json_decode($playlistsJSON, true);
		} else {
			$encodedPlaylists = json_encode($playlists);
			$fp = fopen(PATH_TO_PLAYLISTS, "w");
			fwrite($fp, $encodedPlaylists);
			fclose($fp);
		}
		$success = true;
	}

	$arrayToSend = array(
		"Success" => $success,
		"Database" => $media,
		"Albums" => $albums,
		"Playlists" => $playlists
	);
	print(json_encode($arrayToSend));
	return;
?>