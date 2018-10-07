<?php
    require('config.php');
    $db = open_or_init_sqlite_db('database.sqlite', 'init.sql');

	$arrayToSend = array();
	$image_types = array('jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG');

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

	if ( isset($_GET['album_id']) && isset($_GET['iconEditSet']) ) {
		$album_id = filter_input(INPUT_GET, "album_id", FILTER_VALIDATE_INT);
		$iconEditSet = filter_input(INPUT_GET, "iconEditSet", FILTER_VALIDATE_INT);

		if ( !$album_id ) {
			$arrayToSend['success'] = false;
			$arrayToSend['message'] = 'Improper album id - failed';
			closeFileNew($arrayToSend);
			return;
		}

		/* if $iconEditSet == 0, then an alternative art was used and a new one was not uploaded */
		/* If this is the case, we merely have to grab the art id from the formdata */

		if ( $iconEditSet == 0 ) $art_id = filter_input(INPUT_POST, 'alternate_art_for_album_art_edit', FILTER_SANITIZE_STRING);
		else if ( $iconEditSet == 1 ) {
			/* if $iconEditSet == 1, then a new piece of artwork was uploaded */
			/* If this is the case, we must insert the new image into our "art" table and grab the insert id */
			$upload_dir = 'art/';
			if ( !isset($_FILES) || count($_FILES) == 0 ) {
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'No image files were sent in';
				closeFileNew($arrayToSend);
				return;
			}
			
			$file = $_FILES[count($_FILES)-1];
			/* We'll be randomly-generating an 8-long numeric string to use as the new album art's name*/
				
			$ext = strtolower(pathinfo(basename($file['name']), PATHINFO_EXTENSION));	
				
			/* Get the image file type - this will tell us if this is a jpg or png or whatnot	*/
			$check = getimagesize($file['tmp_name']);
			/* This is just to check that this is a legit file that is an image */
			if($check !== false) {
				/* Need to confirm that this is a jpg or not */
				if ( !in_array($ext, $image_types) ) {
					// This error means the file is an image but is not a jpg or png, so the uploader has to choose another icon
					$arrayToSend['success'] = false;
					$arrayToSend['message'] = 'Image file is not jpg or png';
					closeFileNew($arrayToSend);
					return;
				}
				
				$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
				$grabParams = array(
					':tableName'=>'art'
				);
				$newArtId = null;
				try {
					$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
					$newArtId = $result[0]['seq'];
				}
				catch (PDOException $exception){
					$arrayToSend['success'] = false;
					$arrayToSend['message'] = 'Icon upload error - could not find id of last newly uploaded file';
					closeFileNew($arrayToSend);
					return;
				}
				$target_file = $upload_dir . $newArtId . $ext;

				if (!move_uploaded_file($file['tmp_name'], '../' . $target_file)) {
					/* This error means we couldn't move the file properly */
					$arrayToSend['success'] = false;
					$arrayToSend['message'] = 'Icon upload error - the file wasn\'t able to be moved to the temp file for some reason';
					closeFileNew($arrayToSend);
					return;
				}

				$insertQuery = "INSERT INTO art (src) VALUES ( :src )";
				$insertParams = array(
					':src'=>$target_file
				);
				$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
				$grabParams = array(
					':tableName'=>'art'
				);

				try {
					exec_sql_query($db, $insertQuery, $insertParams);
					$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
					$art_id = $result[0]['seq'];

				}
				catch (PDOException $exception) {
					$arrayToSend['success'] = false;
					$arrayToSend['message'] = 'Insertion into art table error: '.$exception;
					closeFileNew($arrayToSend);
					return;
				}
				
			} else {
				// This error means the file is not an image, so the uploader has to choose an actual image
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'This file is not an image; please select an image file';
				closeFileNew($arrayToSend);
				return;
			} 
			
		}
		else {
			/* In this case... something is very wrong here */
			$arrayToSend['success'] = false;
			$arrayToSend['message'] = 'iconEditSet != 0 or 1 or 2 - something\'s wrong';
			closeFileNew($arrayToSend);
			return;
		}

		/* By reaching this far, we now can either insert into albumToart... by deleting all relationships between album and art prior and then inserting */

		$deleteQuery = "DELETE FROM albumToart WHERE album_id = :albumId";
		$deleteParams = array(
			':albumId'=>$album_id
		);
		$insertQuery = "INSERT INTO albumToart (album_id, art_id) VALUES ( :albumId, :artId)";
		$insertParams = array(
			':albumId'=>$album_id,
			':artId'=>$art_id
		);

		try {
			exec_sql_query($db, $deleteQuery, $deleteParams);
			exec_sql_query($db, $insertQuery, $insertParams);

			$arrayToSend['success'] = true;
			$arrayToSend['new_art_id'] = $art_id;
			closeFileNew($arrayToSend);
			return;
		}
		catch (PDOException $exception) {
			$arrayToSend['success'] = false;
			$arrayToSend['message'] = 'ERROR - could not delete all potential album to art relationships: ' . $exception;
			closeFileNew($arrayToSend);
			return;
		}

	} else {
		$arrayToSend['success'] = false;
		$arrayToSend['message'] = 'No files prepared for upload';
		closeFileNew($arrayToSend);
		return;
	}
?>