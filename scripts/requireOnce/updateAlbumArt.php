<?php
	require_once('newConfig.php');
	$db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
	if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

	$get = ( $get!=null ) ? $get : filter_input(INPUT_GET,'get',FILTER_VALIDATE_INT);
	if ( !isset($get) || ( $get!=6 && $get!='updateAlbumArt' ) ) {
		print(returnError($db,'updateAlbumArt - Proper GET not received'));
		return;
	}

	$image_types = array('jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG');

	$album_id = filter_input(INPUT_GET, 'album_id', FILTER_VALIDATE_INT);
	$iconEditSet = filter_input(INPUT_GET, 'iconEditSet', FILTER_VALIDATE_INT);

	if (!isset($album_id) || !$album_id) {
		print(returnError($db,'updateAlbumArt - Improper album id'));
		return;
	}
	else if (!isset($iconEditSet)) {
		print(returnError($db,'updateAlbumArt - Proper iconEditSet not received'));
		return;
	}

	// if $iconEditSet == 0, then an alternative art was used and a new one was not uploaded
	// If this is the case, we merely have to grab the art id from the formdata
	if ( $iconEditSet == 0 ) $art_id = filter_input(INPUT_POST, 'alternate_art_for_album_art_edit', FILTER_SANITIZE_STRING);
	else if ( $iconEditSet == 1 ) {
		// if $iconEditSet == 1, then a new piece of artwork was uploaded
		// If this is the case, we must insert the new image into our "art" table and grab the insert id
		$upload_dir = 'art/';
		if ( !isset($_FILES) || count($_FILES) == 0 ) {
			print(returnError($db,'FILES not received'));
			return;
		}
				
		$file = $_FILES[count($_FILES)-1];
		// We'll be randomly-generating an 8-long numeric string to use as the new album art's name
					
		$ext = strtolower(pathinfo(basename($file['name']), PATHINFO_EXTENSION));	
					
		// Get the image file type - this will tell us if this is a jpg or png or whatnot

		// This is just to check that this is a legit file that is an image 
		if( getimagesize($file['tmp_name']) == false ) {
			// This error means the file is not an image, so the uploader has to choose an actual image
			print(returnError($db,'updateAlbumArt - This file is not an image; please select an image file'));
			return;
		}
		if ( !in_array($ext, $image_types) ) {
			// This error means the file is an image but is not a jpg or png, so the uploader has to choose another icon
			print(returnError($db,'updateAlbumArt - Image file is not jpg or png'));
			return;
		}
					
		$query = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
		try {
			$result = execQuery($db, $query, array(':tableName'=>'art'))->fetchAll();
			$newArtId = $result[0]['seq'];
		}
		catch (PDOException $exception){
			print(returnError($db,$query,$exception));
			return;
		}
			
		$target_file = $upload_dir.$newArtId.'.'.$ext;
		if (!move_uploaded_file($file['tmp_name'], '../'.$target_file)) {
			// This error means we couldn't move the file properly
			print(returnError($db,'updateAlbumArt - the file wasn\'t able to be moved to the temp file'));
			return;
		}

		$insertQuery = "INSERT INTO art (src) VALUES ( :src )";
		$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
		try {
			execQuery($db, $insertQuery, array(':src'=>$target_file));
			$result = execQuery($db, $grabIdQuery, array(':tableName'=>'art'))->fetchAll();
			$art_id = $result[0]['seq'];
		}
		catch (PDOException $exception) {
			print(returnError($db,'updateAlbumArt - insert into art',$exception));
			return;
		}
	}
	else {
		print(returnError($db,'updateAlbumArt - iconEditSet received, but unexpected value'));
		return;
	}

	// By reaching this far, we now can either insert into albumToart... by deleting all relationships between album and art prior and then inserting
	$deleteQuery = "DELETE FROM albumToart WHERE album_id = :albumId";
	$insertQuery = "INSERT INTO albumToart (album_id, art_id) VALUES ( :albumId, :artId)";
	try {
		execQuery($db, $deleteQuery, array(':albumId'=>$album_id));
		execQuery($db, $insertQuery, array(':albumId'=>$album_id,':artId'=>$art_id));
	}
	catch (PDOException $exception) {
		//print(returnError($db,'updateAlbumArt - insert into albumToart',$exception));
		print(returnError($db,'updateAlbumArt - insert into albumToart',array($iconEditSet)));
		return;
	}

	try {
		cleanArtTable($db);
	}
	catch (PDOException $exception) {
		print(returnError($db,'editMedia - cleaning up art table',$exception));
		return;
	}

	print(returnSuccess($db,'Success',array('new_art_id'=>$art_id)));
	return;
?>