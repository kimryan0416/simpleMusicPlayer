<?php
	require_once('newConfig.php');
	$db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
	if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

	$get = ( $get!=null ) ? $get : filter_input(INPUT_GET,'get',FILTER_VALIDATE_INT);
	if ( !isset($get) || ( $get!=7 && $get!='updateArt' ) ) {
		print(returnError($db,'updateMediaArt - Proper GET not received'));
		return;
	}

	$id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
	$img = filter_input(INPUT_POST, 'img', FILTER_SANITIZE_STRING);

	$img = ($img == 'default') ? 'assets/default_album_art.jpg' : $img;

	$selectQuery = "SELECT id FROM art WHERE src = :src";
	$insertQuery = "INSERT INTO art (src) VALUES ( :src )";
	$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
	try {
		$result = execQuery($db, $selectQuery, array(':src' => $img))->fetchAll();
		if ( count($result) == 0 ) {
			execQuery($db, $insertQuery, array(':src'=>$img));
			$result = execQuery($db, $grabIdQuery, array(':tableName'=>'art'))->fetchAll();
			$art_id = $result[0]['seq'];
		}
		else $art_id = $result[0]['id'];
	}
	catch(PDOException $exception) {
		print(returnError($db,'updateMediaArt - insert into art',$exception));
		return;
	}

	// Create relationship between this new song and the art
	$selectQuery = "SELECT art_id FROM songToart WHERE song_id = :songId";
	$deleteQuery = "DELETE FROM songToart WHERE song_id = :songId AND art_id = :oldArtId";
	$insertQuery = "INSERT INTO songToart (song_id, art_id) VALUES ( :songId, :artId )";
	try {
		$deleteCount = 0;
		$result = execQuery($db,$selectQuery,array(':songId'=>$id))->fetchAll();
		foreach($result as $oldArtId) {
			execQuery($db, $deleteQuery, array(':songId'=>$id,':oldArtId'=>$oldArtId['art_id']));
			$deleteCount = $oldArtId;
		}
		execQuery($db, $insertQuery, array(':songId'=>$id,':artId'=>$art_id));
	}
	catch (PDOException $exception) {
		print(returnError($db,$query,$exception));
		return;
	}
			
	print(returnSuccess($db,$deleteCount,$result));
	return;
?>