<?php
	session_start();
	require("config.php");

	$mime_types = array(
        // audio & video
		'mp3' => 'audio/mpeg',
		'm4a' => 'audio/mp4',
		'mp4' => 'video/mp4'
	);
	$audio_types = array(
        // audio
		'mp3' => 'audio/mpeg',
		'm4a' => 'audio/mp4'
	);
	$video_types = array(
        // video
		'mp4' => 'video/mp4'
	);


	if (isset($_GET["prep"])) {

		$arrayOfFiles = array();
		$path = realpath(PATH_TO_MEDIA);
		$dir  = new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS);
		$rii = new RecursiveIteratorIterator($dir, RecursiveIteratorIterator::LEAVES_ONLY);
		$files = array(); 
		foreach ($rii as $file) {
			if (!$file->isDir()) {
				$path_parts = pathinfo($file->getPathname());
				$title = $path_parts["basename"];
				if ( substr($title, 0, 1) != "." ) {
					$url = $file->getPathname();
					$urlP = strpos($url, ROOT_DIRECTORY);
					$root_length = strlen(ROOT_DIRECTORY);
					$newurl = substr($url, $urlP+$root_length);
					//$newurl = str_replace(PATH_FROM_ABSOLUTE_DIRECTORY, "", $url);
					//$newurl = $url;
					$ext = strtolower(array_pop(explode('.',$newurl)));
					if (array_key_exists($ext, $mime_types)) {
						//type is audio or video
						$arrayOfFiles[] = $newurl;
					}
				} 
			}
		}

		/*
		$arrayOfImages = array();
		$path = realpath(PATH_TO_IMAGES);
		$dir  = new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS);
		$rii = new RecursiveIteratorIterator($dir, RecursiveIteratorIterator::LEAVES_ONLY);
		$files = array(); 
		foreach ($rii as $file) {
			if (!$file->isDir()) {
				$path_parts = pathinfo($file->getPathname());
				$title = $path_parts["basename"];
				if ( substr($title, 0, 1) != "." ) {
					$url = $file->getPathname();
					$newurl = str_replace("/Users/RK/Desktop/MAMP_WEB/simple_music_player/", "", $url);
					$file_type = image_type_to_mime_type(exif_imagetype("../".$newurl));
					if ( $file_type == "image/png" || $file_type == "image/jpeg" ) {
						
						$path_parts = pathinfo("../".$newurl);
						$image_basename_parts = explode(".",$path_parts["basename"]);
						array_pop($image_basename_parts);
						$image_basename = implode(".", $image_basename_parts);
						$image_dir = $path_parts["dirname"];
						$image_ext = $path_parts["extension"];

						$new_basename = preg_replace('/[^\w\s_]+/u','' ,$image_basename);
						$new_basename= str_replace(" ", "_", $new_basename);
						$newURLEncoded = $image_dir."/".$new_basename.".".$image_ext;
						rename("../".$newurl, $newURLEncoded);
						$newURLEncoded = str_replace("../", "", $newURLEncoded);
						$arrayOfImages[] = array(
							"url"=> $newURLEncoded,
							"basename"=>$new_basename
						);
						
					}
				} 
			}
		}
		*/

		unset($_SESSION["songs"]);
		unset($_SESSION["images"]);
		$_SESSION["albumID"] = 0;
		$_SESSION["songs"] = $arrayOfFiles;
		$_SESSION["images"] = $arrayOfImages;

		$encodedMedia = json_encode(array());
		$fp = fopen('temp_database.json', 'w');
		fwrite($fp, $encodedMedia);
		fclose($fp);

		$encodedAlbums = json_encode(array());
		$fp = fopen("temp_albums.json", "w");
		fwrite($fp, $encodedAlbums);
		fclose($fp);

		$temps = scandir("temp/");
		foreach($temps as $temp) {
			unlink("temp/".$temps);
		}

		$dataToSend = array(
			"Size" => sizeof($arrayOfFiles),
			"numImages" => sizeof($arrayOfImages),
			"Success" => true
		);
		print(json_encode($dataToSend));
		return;

	}

	else if (isset($_GET["save"])) {

		$database = file_get_contents("temp_database.json");
		$media = json_decode($database, true);

		$albumsJSON = file_get_contents("temp_albums.json");
		$albums = json_decode($albumsJSON, true);

		unlink(PATH_TO_DATABASE);
		unlink(PATH_TO_ALBUMS);
		
		$albumTypes = array("audio","movie");
		foreach($albumTypes as $type) {
			usort($albums[$type], function($a, $b) {
				return strcmp($a["name"], $b["name"]);
			});
		}
		$albums["playlist"] = array();

		$encodedAlbums = json_encode($albums);
		$fp = fopen("temp_albums.json", "w");
		fwrite($fp, $encodedAlbums);
		fclose($fp);
		

		rename("temp_database.json", PATH_TO_DATABASE);
		rename("temp_albums.json", PATH_TO_ALBUMS);

		$directories = scandir(PATH_TO_MEDIA."Music/");
		foreach($directories as $directory) {
			if ( is_dir(PATH_TO_MEDIA."Music/".$directory) ) {
				rmdir(PATH_TO_MEDIA."Music/".$directory);
			} else {
				unlink(PATH_TO_MEDIA."Music/".$directory);
			}
		}
		$files = scandir("temp/");
		foreach ($files as $file) {
			if ( substr($file, 0, 1) != "." ) {
				$ext = strtolower(array_pop(explode('.',$file)));
				if ( array_key_exists($ext, $audio_types) ) {
					// file is audio type
					rename("temp/".$file, PATH_TO_MEDIA."Music/".$file);
				} else if ( array_key_exists($ext, $video_types) ) {
					rename("temp/".$file, PATH_TO_MEDIA."Movies/".$file);
				}
			}
		}


		$arrayToSend = array(
			"Success" => true,
			"Database" => $media,
			"Albums" => $albums
		);
		print(json_encode($arrayToSend));
		return;

	}
?>