<?php
	require("config.php");
	$arrayToSend = array();
	
	if ( isset($_GET["input"]) ) {
		$title = filter_input(INPUT_POST, "video_title_input", FILTER_SANITIZE_STRING);
		$artist = filter_input(INPUT_POST, "video_artist_input", FILTER_SANITIZE_STRING);
		$album = filter_input(INPUT_POST, "video_album_input", FILTER_SANITIZE_STRING);
		$album_artist = filter_input(INPUT_POST, "video_album_artist_input", FILTER_SANITIZE_STRING);
		$composer = filter_input(INPUT_POST, "video_composer_input", FILTER_SANITIZE_STRING);
		$url = $_POST["video_url_input"];	// because this is an iframe, we can't exactly filter_sanitize_string it

		$dom = new DOMDocument; @$dom->loadHTML($url);
		$iframe = $dom->getElementsByTagName('iframe');
		foreach($iframe as $ifr){
		  $ifraA[] = $ifr->getAttribute('src');
		}

		$title = str_replace(
			array('"', "&", "★", "'", "☆", "—", "…", "√", "～", "►", "→", "↓", "↑", "←", "☝", "՞", "ਊ", "☞", "Ｂ", "Ａ","Ｘ","Ｙ","Ｌ","Ｒ", "Ｓ","Ｅ","Ｃ","Ｔ","　"), 
			array("&#39;", "&amp;", "&#9733;", "&#8217;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;", "&#9654;", "&#8594;", "&#8595;", "&#8593;", "&#8592;", "&#9757;", "&#1374;", "&#2570;", "&#9758;", "&#65314;", "&#65313;","&#65336;","&#65337;","&#65324;","&#65330;", "&#65331;","&#65317;","&#65315;","&#65332;","&#12288;"), 
			$title
		);
		$artist = str_replace(
			array('"', "&", "★", "'", "☆", "—", "…", "√", "～", "►", "→", "↓", "↑", "←", "☝", "՞", "ਊ", "☞", "Ｂ", "Ａ","Ｘ","Ｙ","Ｌ","Ｒ", "Ｓ","Ｅ","Ｃ","Ｔ","　"), 
			array("&#39;", "&amp;", "&#9733;", "&#8217;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;", "&#9654;", "&#8594;", "&#8595;", "&#8593;", "&#8592;", "&#9757;", "&#1374;", "&#2570;", "&#9758;", "&#65314;", "&#65313;","&#65336;","&#65337;","&#65324;","&#65330;", "&#65331;","&#65317;","&#65315;","&#65332;","&#12288;"), 
			$artist
		);
		$album = str_replace(
			array('"', "&", "★", "'", "☆", "—", "…", "√", "～", "►", "→", "↓", "↑", "←", "☝", "՞", "ਊ", "☞", "Ｂ", "Ａ","Ｘ","Ｙ","Ｌ","Ｒ", "Ｓ","Ｅ","Ｃ","Ｔ","　"), 
			array("&#39;", "&amp;", "&#9733;", "&#8217;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;", "&#9654;", "&#8594;", "&#8595;", "&#8593;", "&#8592;", "&#9757;", "&#1374;", "&#2570;", "&#9758;", "&#65314;", "&#65313;","&#65336;","&#65337;","&#65324;","&#65330;", "&#65331;","&#65317;","&#65315;","&#65332;","&#12288;"), 
			$album
		);
		$album_artist = str_replace(
			array('"', "&", "★", "'", "☆", "—", "…", "√", "～", "►", "→", "↓", "↑", "←", "☝", "՞", "ਊ", "☞", "Ｂ", "Ａ","Ｘ","Ｙ","Ｌ","Ｒ", "Ｓ","Ｅ","Ｃ","Ｔ","　"), 
			array("&#39;", "&amp;", "&#9733;", "&#8217;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;", "&#9654;", "&#8594;", "&#8595;", "&#8593;", "&#8592;", "&#9757;", "&#1374;", "&#2570;", "&#9758;", "&#65314;", "&#65313;","&#65336;","&#65337;","&#65324;","&#65330;", "&#65331;","&#65317;","&#65315;","&#65332;","&#12288;"), 
			$album_artist
		);
		$composer = str_replace(
			array('"', "&", "★", "'", "☆", "—", "…", "√", "～", "►", "→", "↓", "↑", "←", "☝", "՞", "ਊ", "☞", "Ｂ", "Ａ","Ｘ","Ｙ","Ｌ","Ｒ", "Ｓ","Ｅ","Ｃ","Ｔ","　"), 
			array("&#39;", "&amp;", "&#9733;", "&#8217;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;", "&#9654;", "&#8594;", "&#8595;", "&#8593;", "&#8592;", "&#9757;", "&#1374;", "&#2570;", "&#9758;", "&#65314;", "&#65313;","&#65336;","&#65337;","&#65324;","&#65330;", "&#65331;","&#65317;","&#65315;","&#65332;","&#12288;"), 
			$composer
		);

		$album_id = -1;
		$query = 'SELECT id FROM albums WHERE name="'.$album.'"';
		if (!$results = $db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Error in finding if album already exists in database";
			closeFile($arrayToSend);
		}
		if ($results->num_rows == 0) {
			$query = 'INSERT INTO albums (name) VALUES ("'.$album.'")';
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error in creating new album";
				closeFile($arrayToSend);
			} 
			$album_id = $db->insert_id;
		}
		else {
			$row = $results->fetch_assoc();
			$album_id = $row["id"];
		}
		$album = $album_id;

		$album_artist_id = -1;
		$query = 'SELECT id FROM album_artists WHERE name="'.$album_artist.'"';
		if (!$results = $db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Error in finding if album artists already exists in database";
			closeFile($arrayToSend);
		}
		if ($results->num_rows == 0) {
			$query = 'INSERT INTO album_artists (name) VALUES ("'.$album_artist.'")';
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error in creating new album artist";
				closeFile($arrayToSend);
			} 
			$album_artist_id = $db->insert_id;
		}
		else {
			$row = $results->fetch_assoc();
			$album_artist_id = $row["id"];
		}
		$album_artist = $album_artist_id;
		
		$query = "INSERT INTO music (url, title, artist, composer, medium) VALUES (\"".$ifraA[0]."\", \"".$title."\", \"".$artist."\", \"".$composer."\", 1);";
		if (!$db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Unable to insert into database: " . $title . " | " . $db->error;
			closeFile($arrayToSend);
		}
		$id = $db->insert_id;

		$query = "SELECT COUNT(*) AS num, id FROM albumToalbum_artist WHERE album_id=".$album." AND album_artist_id=".$album_artist;
		if (!$result = $db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Added media, but unable to check if relationship between album and album artist already exists: " . $db->error;
			closeFile($arrayToSend);
		}
		$count = $result->fetch_assoc();
		$albumToalbum_artist_id = -1;
		if ($count["num"] == 0) {
			$query = "INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES (".$album.", ".$album_artist.");";
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Added media, but unable to insert relationship between album and album artist: " . $db->error;
				closeFile($arrayToSend);
			}
			$albumToalbum_artist_id = $db->insert_id;
		} else {
			$albumToalbum_artist_id = $count["id"];
		}

		$query = "SELECT COUNT(*) AS num, id FROM songToalbum WHERE album_id=".$album." AND song_id=".$id;
		if (!$result = $db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Added media, but unable to check if relationship between video and album already exists: " . $db->error;
			closeFile($arrayToSend);
		}
		$count = $result->fetch_assoc();
		$songToalbum_id = -1;
		if ($count["num"] == 0) {
			$query = "INSERT INTO songToalbum (song_id, album_id) VALUES (".$id.", ".$album.");";
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Added media, but unable to insert relationship between video and album: " . $db->error;
				closeFile($arrayToSend);
			}
			$songToalbum_id = $db->insert_id;
		} else {
			$songToalbum_id = $count["id"];
		}

		$arrayToSend["success"] = true;
		$arrayToSend["info"] = array(
			"id" => $id,
			"title" => $title,
			"artist" => $artist,
			"album" => $album,
			"album_artist" => $album_artist,
			"composer" => $composer,
			"url" => $ifraA[0],
			"album_to_albumArtist_id" => $albumToalbum_artist_id,
			"song_to_album_id" => $songToalbum_id
		);
		closeFile($arrayToSend);

	} else {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "No GET detected";
		closeFile($arrayToSend);
	}
	/*

	$query = "INSERT INTO music (url, filename, extension, title, artist, album_artist, album, composer, lyrics, comment, duration) VALUES (\"".$song."\", \"".myUrlEncode($filename)."\", \"".$extension."\", \"".$title."\", \"".$artist."\", ".$album_artist.", ".$album.", \"".$composer."\", \"".$lyrics."\", \"".$comment."\", \"".$thisFileInfo["playtime_string"]."\");";
	if (!$db->query($query)) {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Unable to insert into database: " . $title . " | " . $db->error;
		closeFile($arrayToSend);
	} else {
		$id = $db->insert_id;
		$query = "INSERT INTO songToalbum_artist (song_id, album_artist_id) VALUES (".$id.", ".$album_artist.");";
		if (!$db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Added media, but unable to insert relationship between song and album artist: " . $db->error;
			closeFile($arrayToSend);
		}
		$arrayToSend["success"] = true;
		$arrayToSend["song_info"] = $song_info;
		closeFile($arrayToSend);
	}
	*/
?>