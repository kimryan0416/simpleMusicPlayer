<?php
    require("config.php");
	$arrayToSend = array();

	$image_types = array("jpg", "JPG", "jpeg", "JPEG", "png", "PNG");

	// Detects if the proper files were sent via AJAX and not some malicious other way
	if ( isset($_FILES) && isset($_GET["album_id"])) {
		$album_id = filter_input(INPUT_GET, "album_id", FILTER_VALIDATE_INT);
		$upload_dir = 'art/album_art/';

		foreach($_FILES as $file) {
			$ext = pathinfo(basename($file["name"]), PATHINFO_EXTENSION);	// grab the extension of the file we are using			
			$target_file =  $upload_dir . $album_id . "." . $ext;
			// Setting the target path, which will simultaneously rename our new picture when we move it
			$imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));
			// Get the image file type - this will tell us if this is a jpg or png or whatnot
			$check = getimagesize($file["tmp_name"]);
			// This is just to check that this is a legit file that is an image
			if($check !== false) {
				// Need to confirm that this is a jpg or not
				if ( !in_array($ext,$image_types) ) {
					// This error means the file is an image but is not a jpg or png, so the uploader has to choose another icon
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Image file is not jpg or png";
					closeFile($arrayToSend);
				} else {
					$allFilesWithThisName = glob("../" . $upload_dir . $album_id . '.*');
					if ( count($allFilesWithThisName) ) {
						foreach($allFilesWithThisName as $copy) {
							if ( !unlink($copy) ) {
								// This error means there is already an image for the media file we couldn't delete it
								$arrayToSend["success"] = false;
								$arrayToSend["message"] = "Could not delete original album images";
								closeFile($arrayToSend);
							}
						}
					}
					if (move_uploaded_file($file['tmp_name'], "../" . $target_file)) {
						$query = "UPDATE albums SET art=\"".$target_file."\" WHERE id=".$album_id;
						if (!$db->query($query)) {
							// This error means everything was fine... the database couldn't be properly modified
							$arrayToSend["success"] = false;
							$arrayToSend["message"] = "Icon upload error - the file wasn't able to be moved to the temp file for some reason";
							closeFile($arrayToSend);
						} else {
							$arrayToSend["success"] = true;
							$arrayToSend["message"] = "Image successfully moved to " .$target_file;
							closeFile($arrayToSend);
						}
					} else {
						// This error means everything was fine... but we couldn't move the file properly
						$arrayToSend["success"] = false;
						$arrayToSend["message"] = "Icon upload error - the file wasn't able to be moved to the temp file for some reason";
						closeFile($arrayToSend);
					}
				}
			} else {
				// This error means the file is not an image, so the uploader has to choose an actual image
				$arrayToSend["success"] = false;
		   		$arrayToSend["message"] = "This file is not an image; please select an image file";
		   		closeFile($arrayToSend);
			} 
		}
	} else {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "No files prepared for upload";
		closeFile($arrayToSend);
	}
?>