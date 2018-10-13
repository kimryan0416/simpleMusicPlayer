<?php
	require_once('newConfig.php');
	$db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
	if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

	$get = ( $get!=null ) ? $get : filter_input(INPUT_GET,'get',FILTER_VALIDATE_INT);
	if ( !isset($get) || ( $get!=10 && $get!='loop' ) ) {
		print(returnError($db,'createLoop - Proper GET not received'));
		return;
	}

	$albumId = filter_input(INPUT_POST, 'albumId', FILTER_VALIDATE_INT);
	$songId = filter_input(INPUT_POST, 'songId', FILTER_VALIDATE_INT);
	$albumArtistId = filter_input(INPUT_POST, 'albumArtistId', FILTER_VALIDATE_INT);
	$shuffle = filter_input(INPUT_POST, 'shuffle', FILTER_VALIDATE_INT);

	$query = "SELECT T1.song_id as id, T2.title as title, T2.medium as medium FROM songToalbum AS T1 INNER JOIN music AS T2 ON T1.song_id = T2.id WHERE T1.album_id = :albumId";
	if ($shuffle == 1) $query .= ' ORDER BY RANDOM()';
	else $query .= ' ORDER BY T2.title';

	try {
		$result = execQuery($db, $query, array(':albumId'=>$albumId))->fetchAll();
	}
	catch (PDOException $exception) {
		print(returnError($db,'createLoop - error grabbing loop data',$exception));
		return;
	}

	$loop = array();
	foreach( $result as $row) {
		$loop[] = (int)$row['id'];
	}
	print(returnSuccess($db,'Success',$loop));
	return;
?>