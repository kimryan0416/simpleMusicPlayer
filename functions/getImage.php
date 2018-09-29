<?php
	require('getid3/getid3.php');
	$success = false;
	$cover = null;

	$id = $_POST["id"];

	$database = file_get_contents("database.json");
	$media = json_decode($database, true);
	$image = null;

	$url = $media[$id]["url"];

	$thisFileInfo = $getID3->analyze($url);
	//getid3_lib::CopyTagsToComments($thisFileInfo);

	if ( isset($thisFileInfo['id3v2']['APIC']) && !empty($thisFileInfo['id3v2']['APIC']) ){
		$cover='data:'.$thisFileInfo['id3v2']['APIC'][0]['image_mime'].';charset=utf-8;base64,'.base64_encode($thisFileInfo['id3v2']['APIC'][0]['data']);
	}
	else if(isset($thisFileInfo['comments']['picture'][0]['data']) && !empty($thisFileInfo['comments']['picture'][0]['data'])) {
		$cover='data:'.$thisFileInfo['id3v2']['APIC'][0]['image_mime'].';charset=utf-8;base64,'.base64_encode($thisFileInfo['id3v2']['APIC'][0]['data']);
	} else {
		$cover = null;
	}

	if (isset($thisFileInfo['id3v2']['APIC'][0]['image_mime']) && !empty($thisFileInfo['id3v2']['APIC'][0]['image_mime'])) {
		$mimetype = $thisFileInfo['id3v2']['APIC'][0]['image_mime'];
	} else {
		$mimetype = 'image/jpeg'; // or null; depends on your needs
	}
	if (!is_null($cover)) {
		// Send file
		header("Content-Type: " . $mimetype);
		if (isset($thisFileInfo['id3v2']['APIC'][0]['image_bytes']) && !empty($thisFileInfo['id3v2']['APIC'][0]['image_bytes'])) {
			header("Content-Length: " . $thisFileInfo['id3v2']['APIC'][0]['image_bytes']);
		}
		$success = true;
		$image = @$cover;
	}

	$dataToSend = array(
		"Success" => $success,
		"Image" => $image
	);
	print(json_encode($dataToSend));
	return;


?>