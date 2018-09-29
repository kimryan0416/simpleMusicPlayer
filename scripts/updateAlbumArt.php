<?php
    require("config.php");
	$arrayToSend = array();

	$image_types = array("jpg", "JPG", "jpeg", "JPEG", "png", "PNG");

	function generateRandomName($length) {
		$digits_needed = (int)$length;
		$string = '';
		$count=0;
		while ( $count < $digits_needed ) {
			$random_digit = mt_rand(0, 9);
			$string .= $random_digit;
			$count++;
		}
		return $string;
	}

	if ( isset($_GET["album_id"]) && isset($_GET["iconEditSet"]) ) {
		$album_id = filter_input(INPUT_GET, "album_id", FILTER_VALIDATE_INT);
		$iconEditSet = filter_input(INPUT_GET, "iconEditSet", FILTER_VALIDATE_INT);

		if ( !$album_id ) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Improper album id - failed";
			closeFile($arrayToSend);
			return;
		}

		/* if $iconEditSet == 0, then an alternative art was used and a new one was not uploaded */
		/* If this is the case, we merely have to grab the art id from the formdata */

		if ( $iconEditSet == 0 ) {
			$art_id = filter_input(INPUT_POST, "alternate_art_for_album_art_edit", FILTER_SANITIZE_STRING);
		}
		else if ( $iconEditSet == 1 ) {
			/* if $iconEditSet == 1, then a new piece of artwork was uploaded */
			/* If this is the case, we must insert the new image into our "art" table and grab the insert id */
			$upload_dir = 'art/';
			if ( !isset($_FILES) || count($_FILES) == 0 ) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "No image files were sent in";
				closeFile($arrayToSend);
				return;
			}
			foreach($_FILES as $file) {
				/* We'll be randomly-generating an 8-long numeric string to use as the new album art's name*/
				
				$ext = strtolower(pathinfo(basename($file["name"]), PATHINFO_EXTENSION));	
				
				/* Get the image file type - this will tell us if this is a jpg or png or whatnot	*/
				$check = getimagesize($file["tmp_name"]);
				/* This is just to check that this is a legit file that is an image */
				if($check !== false) {
					/* Need to confirm that this is a jpg or not */
					if ( !in_array($ext, $image_types) ) {
						// This error means the file is an image but is not a jpg or png, so the uploader has to choose another icon
						$arrayToSend["success"] = false;
						$arrayToSend["message"] = "Image file is not jpg or png";
						closeFile($arrayToSend);
						return;
					}
					$dupFound = true;
					do {
						$target_file_name = generateRandomName(8);
						$allFilesWithThisName = glob("../" . $upload_dir . $target_file_name . '.*');
						if ( count($allFilesWithThisName) ) {
							$dupFound = true;
						} else {
							$dupFound = false;
							$target_file =  $upload_dir . $target_file_name . "." . $ext;
						}
					} while ($dupFound == true);
						
					if (!move_uploaded_file($file['tmp_name'], "../" . $target_file)) {
						/* This error means we couldn't move the file properly */
						$arrayToSend["success"] = false;
						$arrayToSend["message"] = "Icon upload error - the file wasn't able to be moved to the temp file for some reason";
						closeFile($arrayToSend);
						return;
					}
					$query = 'INSERT INTO art (src) VALUES ("'.$target_file.'")';
					if ( !$db->query($query)) {
						/* This error means the database table "art" couldn't be properly added to */
						$arrayToSend["success"] = false;
						$arrayToSend["message"] = "Art table error - art table could not be inserted into";
						closeFile($arrayToSend);
						return;
					}
					$art_id = $db->insert_id;
				} else {
					// This error means the file is not an image, so the uploader has to choose an actual image
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "This file is not an image; please select an image file";
					closeFile($arrayToSend);
					return;
				} 
			}
		}

		else {
			/* In this case... something is very wrong here */
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "iconEditSet != 0 or 1 - something's wrong";
			closeFile($arrayToSend);
			return;
		}

		/* By reaching this far, we now can either insert into albumToart... by deleting all relationships between album and art prior and then inserting */
		$query = "DELETE FROM albumToart WHERE album_id=".$album_id;
		if (!$db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "ERROR - could not delete all potential album to art relationships: " . $db->error;
			closeFile($arrayToSend);
			return;
		}
		$query = "INSERT INTO albumToart (album_id, art_id) VALUES (".$album_id.", ".$art_id.")";
		if (!$db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "ERROR - could not create new relationship between album and art: " . $db->error;
			closeFile($arrayToSend);
			return;
		}
		$arrayToSend["success"] = true;
		$arrayToSend["new_art_id"] = $art_id;
		closeFile($arrayToSend);
		return;
	} else {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "No files prepared for upload";
		closeFile($arrayToSend);
		return;
	}
?>