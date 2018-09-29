<?php
	$success = false;
	$data = null;
	$albums= array();
	if ( isset($_GET["get"]) ) {
		$database = file_get_contents("database.json");
		$data = json_decode($database, true);

		$albumsJSON = file_get_contents("albums.json");
		$albums = json_decode($albumsJSON, true);

		$success = true;
	}

	//print($database);
	$arrayToSend = array(
		"Success" => $success,
		"Database" => $data,
		"Albums" => $albums
	);
	print(json_encode($arrayToSend));
	return;
?>