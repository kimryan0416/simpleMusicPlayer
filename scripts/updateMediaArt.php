<?php
	require('config.php');
	$db = open_or_init_sqlite_db('database.sqlite', 'init.sql');

	$arrayToSend = array();
	
	$id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
	$img = filter_input(INPUT_POST, 'img', FILTER_SANITIZE_STRING);

	if ($img == 'default') $img = 'assets/default_album_art.jpg';

	$selectQuery = "SELECT id FROM art WHERE src = :src";
	$selectParams = array(
		':src' => $img
	);
	$insertQuery = "INSERT INTO art (src) VALUES ( :src )";
	$insertParams = array(
		':src'=>$img
	);
	$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
	$grabParams = array(
		':tableName'=>'art'
	);
	$result = null;
	$art_id = null;
	
	try {
		$result = exec_sql_query($db, $selectQuery, $selectParams)->fetchAll();
		if ( count($result) == 0 ) {
			exec_sql_query($db, $insertQuery, $insertParams);
			$result = exec_sql_query($db, $grabIdQuery, $grabParams)->fetchAll();
			$art_id = $result[0]['seq'];
		}
		else $art_id = $result[0]['id'];
	}
	catch(PDOException $exception) {
		$arrayToSend['success'] = false;
		$arrayToSend['message'] = 'Failed to check if art already exists in Art table: ' . $exception;
		closeFileNew($arrayToSend);
		return;
	}

		// Create relationship between this new song and the art
		$insertQuery = "INSERT INTO songToart (song_id, art_id) VALUES ( :songId, :artId )";
		$insertParams = array(
			':songId'=>$id,
			':artId'=>$art_id
		);
		try {
			exec_sql_query($db, $insertQuery, $insertParams);
		}
		catch (PDOException $exception) {
			$arrayToSend['success'] = false;
			$arrayToSend['message'] = 'Failed to insert relationship between song and art: ' . $exception;
			closeFileNew($arrayToSend);
			return;
		}
		
		$arrayToSend['success'] = true;
		closeFileNew($arrayToSend);
		return;
?>