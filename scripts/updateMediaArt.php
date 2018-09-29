<?php
	require("config.php");
	$arrayToSend = array();
	
	$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);
	$img = filter_input(INPUT_POST, "img", FILTER_SANITIZE_STRING);

	if ($img == "default") {
		$img = "assets/default_album_art.jpg";
	}

	$img = str_replace(" ", "+", $img);

	$query = 'UPDATE music SET art="'.$img.'" WHERE id='.$id;
	if (!$db->query($query)) {
		print("Not Updated: " . $db->error);
	} else {
		print("Updated Properly");
	}
?>