<?php
	session_start();
	require('getid3/getid3.php');
	// Initialize getID3 engine
	$getID3 = new getID3;
	$audio_types = array(
        // audio
		'mp3' => 'audio/mpeg',
		'm4a' => 'audio/mp4'
	);
	$video_types = array(
        // video
		'mp4' => 'video/mp4'
	);

	$database = file_get_contents("temp_database.json");
	$media = json_decode($database, true);

	$albumsJSON = file_get_contents("temp_albums.json");
	$albums = json_decode($albumsJSON, true);

	$albumID = 0;
	if ( isset($_SESSION["albumID"]) ) {
		$albumID = $_SESSION["albumID"];
	}

	function myUrlEncode($string) {
	    $entities = array('%21', '%2A', '%27', '%28', '%29', '%3B', '%3A', '%40', '%26', '%3D', '%2B', '%24', '%2C', '%2F', '%3F', '%25', '%23', '%5B', '%5D');
	    $replacements = array('!', '*', "'", "(", ")", ";", ":", "@", "&", "=", "+", "$", ",", "/", "?", "%", "#", "[", "]");
	    return str_replace($entities, $replacements, urlencode($string));
	}

	//-----------------------

	$id = $_POST["id"];
	$song = $_SESSION["songs"][$id];

	$path_parts = pathinfo($song);
	$song_basename_parts = explode(".",$path_parts["basename"]);
	array_pop($song_basename_parts);
	$song_basename = implode(".", $song_basename_parts);
	$song_dir = $path_parts["dirname"];
	$song_ext = $path_parts["extension"];

	$new_basename = preg_replace('/[^\w\s_]+/u','' ,$song_basename);
	$new_basename= str_replace(" ", "_", $new_basename);
	$newURL = "../temp/".$new_basename.".".$song_ext;
	rename("../".$song, $newURL);

	$filepath = $song;
	$thisFileInfo = $getID3->analyze($newURL);
	getid3_lib::CopyTagsToComments($thisFileInfo);
	$songInfo = $thisFileInfo["comments_html"];

	//Checking if title has been given
	if ( isset($songInfo["title"]) ) {
		$title = $songInfo["title"][0];
	} else {
		$path_parts = pathinfo($newURL);
		$title = $path_parts["basename"];
		$title = str_replace("_", " ", $title);
	}

	//Checking if artist was given 
	if ( isset($songInfo["artist"]) ) {
		$artist = $songInfo["artist"][0];
	} else {
		$artist = "Unknown Artist";
	}

	//Checking if album artist was given
	if ( isset($songInfo["album_artist_sort_order"]) ) {
		$album_artist = $songInfo["album_artist_sort_order"][0];
	} else {
		$album_artist = "?";
	}

	if ( isset($songInfo["album"]) ) {
		$album = $songInfo["album"][0];
	} else {
		$album = $album_artist;
	}

	//Checking if comment was given
	if ( isset($songInfo["comment"]) ) {
		$comment = $songInfo["comment"][0];
	} else {
		$comment = "No Comment";
	}

	//Checking if year was given
	if ( isset($songInfo["year"]) ) {
		$year = $songInfo["year"][0];
	} else {
		$year = "?";
	}
							
	//Checking if lyrics were given
	$lyrics = "<i>No Lyrics Detected</i>";
	if ( isset($songInfo["unsynchronised_lyric"]) ) {
		$lyrics = html_entity_decode($songInfo["unsynchronised_lyric"][0], ENT_QUOTES, "utf-8");
		$lyrics = preg_replace("/\r\n|\r|\n/",'<br/>',$lyrics);
	}

	if ( array_key_exists($song_ext, $audio_types) ) {
		// file is audio type
		$url = "media/Music/".$new_basename.".".$song_ext;
		$type = "audio";
	} else if ( array_key_exists($song_ext, $video_types) ) {
		$url = "media/Movies/".$new_basename.".".$song_ext;
		$type = "movie";
	}

	$arraytoAssociate = sizeof($albums);
	$arrayToPoint = 0;
	$albumInArray = false;
	foreach((array)$albums as $key=>$albumToSee) {
		if ($albumToSee["name"] == $album && $albumToSee["type"] == $type) {
			$arrayToAssociate = $albumToSee["id"];
			$arrayToPoint = $key;
			$albumInArray = true;
			break;
		}
	}
	if ( !$albumInArray ) {
		$albums[] = array(
			"id"=>$albumID,
			"name"=>$album,
			"list"=>array(),
			"type"=>$type
		);
		$arrayToAssociate = $albumID;
		$albumID++;
		$arrayToPoint = sizeof($albums) - 1;
	}

	$imageForSong = "assets/default_album_art.jpg";
	$imageArray = $_SESSION["images"];

	foreach($imageArray as $imageData) {
		if ($new_basename == $imageData["basename"]) {	
			$imageForSong = $imageData["url"];
			break;
		}
	}
	/*
	if(isset($thisFileInfo['comments']['picture'][0])){
		$imageForSong='data:'.$thisFileInfo['comments']['picture'][0]['image_mime'].';charset=utf-8;base64,'.base64_encode($thisFileInfo['comments']['picture'][0]['data']);
	}
	*/


	
	$media[] = array(
		"url"=>$url,
		"title"=>$title,
		"album"=>$arrayToAssociate,
		"album_artist"=>$album_artist,
		"image"=>$imageForSong,
		"artist"=>$artist,
		"comment"=>$comment,
		"lyrics"=> $lyrics,
		"year"=>$year,
		"duration"=>$thisFileInfo["playtime_string"],
		"type"=>$type
	);
	$songID = sizeof($media) - 1;	// by logic, when you add a new song into the array, the id of the song is the most recent entry, hence the size of the array - 1
	$albums[$arrayToPoint]["list"][] = $songID;

	

	$_SESSION["albumID"] = $albumID;

	$encodedMedia = json_encode($media);
	$fp = fopen('temp_database.json', 'w');
	fwrite($fp, $encodedMedia);
	fclose($fp);

	$encodedAlbums = json_encode($albums);
	$fp = fopen("temp_albums.json", "w");
	fwrite($fp, $encodedAlbums);
	fclose($fp);
	
	$dataToSend = array(
		"id"=>$title
	);
	print(json_encode($dataToSend));
	return;
?>