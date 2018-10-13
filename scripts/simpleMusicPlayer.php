<?php
	require_once('newConfig.php');
	$db = initSqliteDB('database.sqlite', 'init.sql');
	$db->beginTransaction();
	$begunTransaction = true;
	$arrayToSend = array();

	$get = filter_input(INPUT_GET,'get',FILTER_VALIDATE_INT);	
	if (!isset($get)) {
		print(returnError($db,'GET not received'));
		return;
	}

	// getAllMedia.php;
	if ($get==1||$get=='getAll') {
		require_once('requireOnce/getAllMedia.php');
	}

	// getMediaInfo.php
	else if ($get==2||$get=='updateCurrent') {
		require_once('requireOnce/getMediaInfo.php');
	}

	// getMediaInfoForEdit.php
	else if ($get==3||$get=='prepareEdit') {
		require_once('requireOnce/prepareEdit.php');
	}

	// getAllArtForEdit.php
	else if ($get==4||$get=='getAllArt') {
		require_once('requireOnce/getAllArt.php');
	}

	// mediaEdit.php
	else if ( $get==5 || $get == 'editMedia' ) {
		require_once('requireOnce/editMedia.php');
	}

	// updateAlbumArt.php
	else if ( $get==6 || $get == 'updateAlbumArt' ) {
		require_once('requireOnce/updateAlbumArt.php');
	}

	// updateMediaArt.php
	else if ( $get==7 || $get == 'updateArt' ) {
		require_once('requireOnce/updateMediaArt.php');
	}

	// embedInput.php
	else if ( $get==8 || $get == 'addEmbed' ) {
		require_once('requireOnce/embedInput.php');
	}

	// getImageArt.php
	else if ( $get==9 || $get == 'getImageArt' ) {
		require_once('requireOnce/getImageArt.php');
	}

	// createLoop.php
	else if ( $get==10 || $get == 'loop') {
		require_once('requireOnce/createLoop.php');
	}

	else if ( $get==11 || $get == 'addMedia' ) {
		require_once('requireOnce/addMedia.php');
	}

	else {
		print(returnError($db,'simpleMusicPlayer - GET does not indicate any specific function'));
		return;
	}

?>