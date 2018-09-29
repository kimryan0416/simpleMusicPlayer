<?php
	session_start();

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
		$path = realpath('../media/');
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
					$ext = strtolower(array_pop(explode('.',$newurl)));
					if (array_key_exists($ext, $mime_types)) {
						//type is audio or video
						$arrayOfFiles[] = $newurl;
					}
				} 
			}
		}

		$arrayOfImages = array();
		$path = realpath('../images/');
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

		unset($_SESSION["songs"]);
		unset($_SESSION["images"]);
		$_SESSION["albumID"] = 0;
		$_SESSION["songs"] = $arrayOfFiles;
		$_SESSION["images"] = $arrayOfImages;

		$encodedMedia = json_encode(array());
		$fp = fopen('../functions/temp_database.json', 'w');
		fwrite($fp, $encodedMedia);
		fclose($fp);

		$encodedAlbums = json_encode(array());
		$fp = fopen("../functions/temp_albums.json", "w");
		fwrite($fp, $encodedAlbums);
		fclose($fp);

		$temps = scandir("../temp/");
		foreach($temps as $temp) {
			unlink("../temp/".$temps);
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

		$files = scandir("../functions/");
		foreach($files as $file) {
			if ($file == "database.json" || $file == "albums.json") {
				unlink($file);
			}
		}

		usort($albums, function($a, $b) {
			return strcmp($a["name"], $b["name"]);
		});
		$tempAlbums = $albums;
		$albums = array();
		foreach($tempAlbums as $album) {
			$albums[$album["id"]] = array(
				"name"=>$album["name"],
				"list"=>$album["list"],
				"type"=>$album["type"]
			);
		}

		$encodedAlbums = json_encode($albums);
		$fp = fopen("temp_albums.json", "w");
		fwrite($fp, $encodedAlbums);
		fclose($fp);
		

		rename("temp_database.json", "database.json");
		rename("temp_albums.json", "albums.json");

		$directories = scandir("../media/Music/");
		foreach($directories as $directory) {
			if ( is_dir("../media/Music/".$directory) ) {
				rmdir("../media/Music/".$directory);
			} else {
				unlink("../media/Music/".$directory);
			}
		}
		$files = scandir("../temp/");
		foreach ($files as $file) {
			if ( substr($file, 0, 1) != "." ) {
				$ext = strtolower(array_pop(explode('.',$file)));
				if ( array_key_exists($ext, $audio_types) ) {
					// file is audio type
					rename("../temp/".$file, "../media/Music/".$file);
				} else if ( array_key_exists($ext, $video_types) ) {
					rename("../temp/".$file, "../media/Movies/".$file);
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