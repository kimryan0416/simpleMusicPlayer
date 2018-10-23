<?php
	require_once('newConfig.php');
	$db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
	if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

	$get = ( $get!=null ) ? $get : filter_input(INPUT_GET,'get',FILTER_VALIDATE_INT);
	if ( !isset($get) || ( $get!=4 && $get!='getAllArt' ) ) {
		print(returnError($db,'Proper GET not received'));
		return;
	}

	$arrayToSend['data'] = array();
	$specificId = filter_input(INPUT_POST,'albumId', FILTER_VALIDATE_INT);
	
	$query = 'SELECT * FROM art WHERE id >= 0 ORDER BY id';
	try {
		$result = execQuery($db, $query)->fetchAll();
	}
	catch (PDOException $exception) {
		print(returnError($db,$query,$exception));
		return;
	}
	if ( count($result) == 0 ) $arrayToSend['data'] = null;
	else if ( count($result) > 0 ) {
		foreach ( $result as $row ) $arrayToSend["data"][$row["id"]] = $row['src'];
	}
	else {
		print(returnError($db,'getAllArt - Returned SELECT query was not an array'));
		return;
	}

	if ( isset($specificId) || $specificId != false ) {
		$query = "SELECT src FROM albumToart AS T1 INNER JOIN art AS T2 ON T1.art_id = T2.id WHERE T1.album_id = :albumId";
		try {
			$result = execQuery($db, $query, array(':albumId'=>$specificId))->fetchAll();
		}
		catch (PDOException $exception) {
			print(returnError($db,$query,$exception));
			return;
		}
		if ( count($result) == 0 ) $arrayToSend['art'] = 'assets/default_album_art.jpg';
		else if ( count($result) == 1 ) $arrayToSend['art'] = $result[0]['src'];
		else {
			print(returnError($db,'getAllArt - More than 1 row returned when trying to receive particular ID\'s art',$result));
			return;
		}
	}

	print(returnSuccess($db,'Success',$arrayToSend));
	return;
?>