<?php
	session_start();
	require('getid3/getid3.php');
	//$music_types = array("mp3", "m4a");
	//$curCount = 0;

	// Initialize getID3 engine
	$getID3 = new getID3;
	//$path="../media/";	// The "media" directory can be divided between two subdirectories: "Music" and "Movies"
						// For this reason, we scan through the $path first and see how many subdirectories there are
	$media = array();
	$albums = array();
	$albumID = 0;
	$arrayOfSongs = array();

	function myUrlEncode($string) {
	    $entities = array('%21', '%2A', '%27', '%28', '%29', '%3B', '%3A', '%40', '%26', '%3D', '%2B', '%24', '%2C', '%2F', '%3F', '%25', '%23', '%5B', '%5D');
	    $replacements = array('!', '*', "'", "(", ")", ";", ":", "@", "&", "=", "+", "$", ",", "/", "?", "%", "#", "[", "]");
	    return str_replace($entities, $replacements, urlencode($string));
	}

	/*
	function scanDirectory($url) {
		/*
		global $albumID;
		global $media;
		global $getID3;
		global $albums;
		*/
		/*
		global $arrayOfSongs;
		$files = scandir($url);
		foreach($files as $file) {
			if ( substr($file, 0, 1) != "." ) {
				if ( is_dir($url.$file) ) {
					scanDirectory($url.$file."/");
				} else {
					$file_type = image_type_to_mime_type(exif_imagetype($url.$file));
					if ( $file_type == "image/png" || $file_type == "image/jpeg" ) {
        				// This file type is an image, it would most likely be the album art

        			} else {
        				// This file type is either an audio file or not
        				$mime_types = array(
        					// audio/video
            				'mp3' => 'audio/mpeg',
            				'm4a' => 'audio/mp4',
            				'mp4' => 'audio/mp4'
            			);
            			$ext = strtolower(array_pop(explode('.',$url.$file)));
            			if (array_key_exists($ext, $mime_types)) {
				            // This is an audio file
				            $arrayOfSongs[] = array(
				            	"filepath"=>$url.$file,
				            	"file" => $file
				            );
				            /*
            				$thisFileInfo = $getID3->analyze($url.$file);
							getid3_lib::CopyTagsToComments($thisFileInfo);
							//$media[$mediaType][$album][$song] = $thisFileInfo["comments_html"];
							$songInfo = $thisFileInfo["comments_html"];

							//Checking if title has been given
							if ( isset($songInfo["title"]) ) {
								$title = $songInfo["title"][0];
							} else {
								$path_parts = pathinfo($url.$file);
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

							$arraytoAssociate = sizeof($albums);
							$arrayToPoint = 0;
							$albumInArray = false;
							foreach((array)$albums as $key=>$album) {
								if ($album["name"] == $songInfo["album"][0]) {
									$arrayToAssociate = $album["id"];
									$arrayToPoint = $key;
									$albumInArray = true;
									break;
								}
							}
							if ( !$albumInArray ) {
								$albums[] = array(
									"id"=>$albumID,
									"name"=>$songInfo["album"][0],
									"list"=>array()
								);
								$arrayToAssociate = $albumID;
								$albumID++;
								$arrayToPoint = sizeof($albums) - 1;
							}
							
							$media[] = array(
								"url"=>myUrlEncode(substr($url.$file, 3)),
								"title"=>$title,
								"album"=>$arrayToAssociate,
								"album_artist"=>$album_artist,
								"artist"=>$artist,
								"comment"=>$comment,
								"lyrics"=> $lyrics,
								"year"=>$year,
								"duration"=>$thisFileInfo["playtime_string"]
							);
							$songID = sizeof($media) - 1;	// by logic, when you add a new song into the array, the id of the song is the most recent entry, hence the size of the array - 1
							$albums[$arrayToPoint]["list"][] = $songID;
							*/
							/*
				        }

        			}
				}
			}
		}
	}
	*/
/*

	$mediaTypes = scandir($path);
	foreach($mediaTypes as $mediaType) {
		if ( !( substr($mediaType, 0, 1) == "." ) ) {
			//$mediaType = type of media, i.e. either "Music" or "Movies"


			/*
			$curCount = 0;
			$secondPath = $path.$mediaType."/";
			$albumFiles = scandir($secondPath);	// e.x. "../media/Music/"
			foreach($albumFiles as $album) {
				if ( !( substr($album, 0, 1) == "." ) ) {
					$newAlbum = preg_replace('/[^\w\s]+/u','' ,$album);
					$newAlbum = str_replace(" ", "_", $newAlbum);
					//rename($album, $newAlbum);
					$thirdPath = $secondPath.$album."/";
					$songsInAlbum = scandir($thirdPath);
					foreach($songsInAlbum as $song) {
						if ( !( substr($song, 0, 1) == "." ) ) {
							$songPath = $thirdPath.$song;
							$newSong = preg_replace('/[^\w\s.]+/u','' ,$song);
							$newSong = str_replace(" ", "_", $newSong);
							$thisFileInfo = $getID3->analyze($songPath);
							getid3_lib::CopyTagsToComments($thisFileInfo);
							//$media[$mediaType][$album][$song] = $thisFileInfo["comments_html"];
							$songInfo = $thisFileInfo["comments_html"];

							//Checking if title has been given
							if ( isset($songInfo["title"]) ) {
								$title = $songInfo["title"][0];
							} else {
								$path_parts = pathinfo($songPath);
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

							$dataAlbum = preg_replace('/[^\w\s.]+/u','', $songInfo["album"][0]);
							$dataAlbum = str_replace(" ", "_", $dataAlbum);
							$media[$mediaType][$curCount] = array(
								"url"=>"media/".$mediaType."/".$newAlbum."/".$newSong,
								"title"=>$title,
								"album"=>$songInfo["album"][0],
								"data_album" => $dataAlbum,
								"album_artist"=>$album_artist,
								"artist"=>$artist,
								"comment"=>$comment,
								"lyrics"=> $lyrics,
								"year"=>$year,
								"duration"=>$thisFileInfo["playtime_string"]
							);
							rename($songPath, "../temp/".$newSong);
							if ( !in_array($songInfo["album"][0], $albums_print) ) {
								$albums_print[] = $songInfo["album"][0];
							}
							$curCount++;
						}
					}
					usort($media[$mediaType], function($a, $b) {
						return strcmp($a["title"], $b["title"]);
					});
					rename($thirdPath, $secondPath.$newAlbum);
					$filesInTemp = scandir("../temp/");
					foreach($filesInTemp as $fileToMove) {
						if ( !( substr($fileToMove, 0, 1) == "." ) ) {
							rename("../temp/".$fileToMove, "../media/".$mediaType."/".$newAlbum."/".$fileToMove);
						} else {
							unlink("../temp/".$fileToMove);
						}
					}
				}
			}
			
		}
	}
	*/

	//scanDirectory($path);

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
				$arrayOfSongs[] = $newurl;
			} 
		}
	}



	foreach($arrayOfSongs as $song) {
		$filepath = $song;
		$thisFileInfo = $getID3->analyze("../".$filepath);
		getid3_lib::CopyTagsToComments($thisFileInfo);
		//$media[$mediaType][$album][$song] = $thisFileInfo["comments_html"];
		$songInfo = $thisFileInfo["comments_html"];

		//Checking if title has been given
		if ( isset($songInfo["title"]) ) {
			$title = $songInfo["title"][0];
		} else {
			$path_parts = pathinfo("../".$filepath);
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

		$arraytoAssociate = sizeof($albums);
		$arrayToPoint = 0;
		$albumInArray = false;
		foreach((array)$albums as $key=>$album) {
			if ($album["name"] == $songInfo["album"][0]) {
				$arrayToAssociate = $album["id"];
				$arrayToPoint = $key;
				$albumInArray = true;
				break;
			}
		}
		if ( !$albumInArray ) {
			$albums[] = array(
				"id"=>$albumID,
				"name"=>$songInfo["album"][0],
				"list"=>array()
			);
			$arrayToAssociate = $albumID;
			$albumID++;
			$arrayToPoint = sizeof($albums) - 1;
		}
							
		$media[] = array(
			"url"=>myUrlEncode($filepath),
			"title"=>$title,
			"album"=>$arrayToAssociate,
			"album_artist"=>$album_artist,
			"artist"=>$artist,
			"comment"=>$comment,
			"lyrics"=> $lyrics,
			"year"=>$year,
			"duration"=>$thisFileInfo["playtime_string"]
		);
		$songID = sizeof($media) - 1;	// by logic, when you add a new song into the array, the id of the song is the most recent entry, hence the size of the array - 1
		$albums[$arrayToPoint]["list"][] = $songID;
	}


	$encodedMedia = json_encode($media);
	$fp = fopen('../functions/database.json', 'w');
	fwrite($fp, $encodedMedia);
	fclose($fp);

	usort($albums, function($a, $b) {
		return strcmp($a["title"], $b["title"]);
	});
	$tempAlbums = $albums;
	$albums = array();
	foreach($tempAlbums as $album) {
		$albums[$album["id"]] = array(
			"name"=>$album["name"],
			"list"=>$album["list"]
		);
	}

	$encodedAlbums = json_encode($albums);
	$fp = fopen("../functions/albums.json", "w");
	fwrite($fp, $encodedAlbums);
	fclose($fp);
	/*
	foreach($albums_print as $key=>$album_val) {
		$dataAlbum = preg_replace('/[^\w\s.]+/u','', $album_val);
		$dataAlbum = str_replace(" ", "_", $dataAlbum);
		$albums_data[$key] = $dataAlbum;
	}
	*/
	//$albums = array("print"=>$albums_print, "data"=>$albums_data);

	//print($database);
	$arrayToSend = array(
		"Success" => true,
		"Database" => $media,
		"Albums" => $albums
	);
	print(json_encode($arrayToSend));
	return;
?>