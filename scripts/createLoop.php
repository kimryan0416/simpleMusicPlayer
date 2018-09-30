<?php
	require('config.php');
	$db = open_or_init_sqlite_db('database.sqlite', 'init.sql');

	$arrayToSend = array();
	$albumId = filter_input(INPUT_POST, 'albumId', FILTER_VALIDATE_INT);
	$songId = filter_input(INPUT_POST, 'songId', FILTER_VALIDATE_INT);
	$albumArtistId = filter_input(INPUT_POST, 'albumArtistId', FILTER_VALIDATE_INT);
	$shuffle = filter_input(INPUT_POST, 'shuffle', FILTER_VALIDATE_INT);

	$query = "SELECT T1.song_id as id, T2.title as title, T2.medium as medium FROM songToalbum AS T1 INNER JOIN music AS T2 ON T1.song_id = T2.id WHERE T1.album_id = :albumId";
	if ($shuffle == 1) $query .= ' ORDER BY RAND()';
	else $query .= ' ORDER BY T2.title';
	$params = array(
		':albumId'=>$albumId
	);

	try {
		$result = exec_sql_query($db, $query, $params)->fetchAll();
	}
	catch (PDOException $exception) {
		$arrayToSend['success'] = false;
		$arrayToSend['message'] = 'Error grabbing loop data: '.$exception;
		closeFileNew($arrayToSend);
		return;
	}
	$arrayToSend['success'] = true;
	$arrayToSend['loop'] = array();
	foreach( $result as $row) {
		$arrayToSend['loop'][] = (int)$row['id'];
	}
	closeFileNew($arrayToSend);
	return;

	/*
	$query = 'SELECT T1.song_id as id, T2.title as title, T2.medium as medium FROM songToalbum AS T1 INNER JOIN music AS T2 ON T1.song_id = T2.id WHERE T1.album_id='.$albumId;
	//$query = 'SELECT id FROM music WHERE album='.$albumId.' AND album_artist='.$albumArtistId.' AND id != '.$songId;
	if ($shuffle == 1) $query .= ' ORDER BY RAND()';
	else $query .= ' ORDER BY T2.title';
	if (!$request = $db->query($query)) {
		$arrayToSend['success'] = false;
		$arrayToSend['message'] = 'Error grabbing loop data: '.$db->error;
		closeFile($arrayToSend);
	}
	$arrayToSend['success'] = true;
	$arrayToSend['loop'] = array();
	if ($request->num_rows > 0) {
		while( $row = $request->fetch_assoc() ) {	$arrayToSend['loop'][] = (int)$row['id'];	}
	}
	closeFile($arrayToSend);
	*/
?>