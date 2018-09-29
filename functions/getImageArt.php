<?php
	require('getid3/getid3.php');
	$getID3 = new getID3;

	$database = file_get_contents("database.json");
	$media = json_decode($database, true);

	$id = $_POST["id"];
	$path = $media[$id]["url"];

	$picture = $getID3->analyze("../".$path);
	//getid3_lib::CopyTagsToComments($picture);
	
	if(isset($picture['id3v2']['APIC']) && !empty($picture['id3v2']['APIC'])){
		$cover='data:'.$picture['id3v2']['APIC'][0]['image_mime'].';charset=utf-8;base64,'.base64_encode($picture['id3v2']['APIC'][0]['data']);
	}
    else if(isset($picture['comments']['picture'][0]['data']) && !empty($picture['comments']['picture'][0]['data'])) {
    	$cover='data:'.$picture['id3v2']['APIC'][0]['image_mime'].';charset=utf-8;base64,'.base64_encode($picture['id3v2']['APIC'][0]['data']);
    } else {
        $cover = null;
    }
    if (isset($picture['id3v2']['APIC'][0]['image_mime']) && !empty($picture['id3v2']['APIC'][0]['image_mime'])) {
    	$mimetype = $picture['id3v2']['APIC'][0]['image_mime'];
    } else {
        $mimetype = 'image/jpeg'; // or null; depends on your needs
    }
    if (!is_null($cover)) {
        // Send file
        header("Content-Type: " . $mimetype);
        if (isset($picture['id3v2']['APIC'][0]['image_bytes']) && !empty($picture['id3v2']['APIC'][0]['image_bytes'])) {
            header("Content-Length: " . $picture['id3v2']['APIC'][0]['image_bytes']);
        }
        echo @$cover;
    }
    
    //$arrayToSend = $picture;
    //print(json_encode($arrayToSend));
    //print ($path);
    return;
?>