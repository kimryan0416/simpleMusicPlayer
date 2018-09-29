<?php
	require("getid3/getid3.php");
    require("config.php");

	$getID3 = new getID3;

	$media_types = array(
        // audio
		'mp3' => 'audio/mpeg',
		'm4a' => 'audio/mp4'
	);

	$arrayToSend = array();

	// Detects if the proper files were sent via AJAX and not some malicious other way
	if ( isset($_FILES) ) {
		$upload_dir = 'media/uploads/';
		foreach($_FILES as $file) {
			$thisFileInfo = $getID3->analyze($file['tmp_name']);
			getid3_lib::CopyTagsToComments($thisFileInfo);
			$song_info = $thisFileInfo["comments_html"];
			
			$path_parts = pathinfo($file["name"]);
			$filename = htmlspecialchars($path_parts["filename"]);
			$extension = pathinfo(basename($file["name"]), PATHINFO_EXTENSION);

			
			if ( !array_key_exists($extension, $media_types) ) {
				// This error means the file is an image but is not a jpg or png, so the uploader has to choose another icon
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "File is not mp3 or m4a";
				closeFile($arrayToSend);
			}
			

			/* Now, we can't do anything else for this thing - we need to get the id so that when we move the file, it's renamed with the id in mind. */
			/* For now, we process the file info to insert into the database */

			
			$title = str_replace("'", "&#39;", $song_info["title"][0]);
			$artist = str_replace("'", "&#39;", $song_info["artist"][0]);

			if ( isset ($song_info["album_artist_sort_order"]) ) {
				$album_artist = htmlspecialchars($song_info["album_artist_sort_order"][0]);
			} else if ( isset ($song_info["album_artist"]) ) {
				$album_artist = htmlspecialchars($song_info["album_artist"][0]);
			} else if ( isset ($song_info["band"]) ) {
				$album_artist = htmlspecialchars($song_info["band"][0]);
			} else {
				$album_artist = "No Album Artist";
			}
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

			if ( isset($song_info["album"]) ) {
				$album = $song_info["album"][0];
			} else {
				$album = "Unknown Album";
			}
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

	
			if (isset($song_info["composer"])) {
				$composer = $song_info["composer"][0];
			} else {
				$composer = "";
			}

			if ( isset($song_info["lyrics"]) ) {
				//$lyrics = html_entity_decode($song_info["lyrics"][0], ENT_QUOTES, "utf-8");
				$lyrics = $song_info["lyrics"][0];
				$lyrics = preg_replace("/\r\n|\r|\n/",'<br/>',$lyrics);
				$lyrics = str_replace(array("'", "&#13;"), array("&#39;", "<br/>"), $lyrics);
			} else if ( isset($song_info["unsynchronized_lyric"]) ) {
				//$lyrics = html_entity_decode($song_info["unsynchronized_lyric"][0], ENT_QUOTES, "utf-8");
				$lyrics = $song_info["unsynchronized_lyric"][0];
				//$lyrics = preg_replace("/\r\n|\r|\n/",'<br/>',$lyrics);
				$lyrics = str_replace(array("'", "&#13;"), array("&#39;", "<br/>"), $lyrics);
			} else {
				$lyrics = "<i>No Lyrics Provided</i>";
			}
			
			if ( isset($song_info["comment"]) ) {
				$comment = myUrlEncode($song_info["comment"][0]);
			} else {
				$comment = "";
			}

			$query = "INSERT INTO music (filename, extension, title, artist, composer, lyrics, comment, duration) VALUES (\"".myUrlEncode($filename)."\", \"".$extension."\", \"".$title."\", \"".$artist."\", \"".$composer."\", \"".$lyrics."\", \"".$comment."\", \"".$thisFileInfo["playtime_string"]."\");";
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Unable to insert into database: " . $title . " | " . $db->error;
				closeFile($arrayToSend);
			}
			$id = $db->insert_id;

			$query = "INSERT INTO songToalbum (song_id, album_id) VALUES (".$id.", ".$album.");";
			if ( !$db->query($query) ) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Added media, but unable to insert relationship between song and album: ".$db->error;
				closeFile($arrayToSend);
			}
			$query = "INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES (".$album.", ".$album_artist.")";
			if ( !$db->query($query) ) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Added media, but unable to insert relationship between album and album artist: ".$db->error;
				closeFile($arrayToSend);
			}

			/* Assuming a successful insert into the database, we now have the id so that we can rename the file properly */

			$target_file = $upload_dir . $id . "." . $extension;
			if ( file_exists("../" . $target_file) ) {
				// This error means there is already an image for the media file we couldn't delete it
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "There is already a file with that very audio file id name - there must have been something wonky";
				closeFile($arrayToSend);
			}
			if (!move_uploaded_file($file['tmp_name'], "../" . $target_file)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Could not move the file to the upload folder";
				closeFile($arrayToSend);
			}
			$query = "UPDATE music SET url=\"".$target_file."\" WHERE id=".$id;
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Could not update url of file into databse: " . $db->error;
				closeFile($arrayToSend);
			} 
				
			$arrayToSend["success"] = true;
			$arrayToSend["message"] = "Image successfully moved to " . $target_file;
			closeFile($arrayToSend);

		}
	} else {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "No files prepared for upload";
		closeFile($arrayToSend);
	}
?>