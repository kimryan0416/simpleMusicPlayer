<?php
	require("config.php");
	$db = open_or_init_sqlite_db('database.sqlite', 'init.sql');

	$arrayToSend = array();
	
	$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);
	$img = filter_input(INPUT_POST, "img", FILTER_SANITIZE_STRING);

	if ($img == "default") $img = "assets/default_album_art.jpg";

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
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Failed to check if art already exists in Art table: " . $exception;
		closeFileNew($arrayToSend);
		return;
	}
/*
	$query = 'SELECT id FROM art WHERE src="'.$img.'"'
	if (!$result = $db->query($query)) {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Failed to check if art already exists in Art table: " . $db->error;
		closeFile($arrayToSend);
		return;
	} else {
		$num = $result->num_rows;
		$art_id;
		if ($num == 0) {
			// If num == 0, then the art doesn't exists yet in our Art table - we have to create a new Art row
			$query = "INSERT INTO art (src) VALUES (\"".$img."\")";
			$if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Failed to insert art into Art table: " . $db->error;
				closeFile($arrayToSend);
				return;
			}
			$art_id = $db->insert_id;
		} else {
			$row = $result->fetch_assoc();
			$art_id = $row["id"];
		}
*/

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
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Failed to insert relationship between song and art: " . $exception;
			closeFileNew($arrayToSend);
			return;
		}
		
		$arrayToSend["success"] = true;
		closeFileNew($arrayToSend);
		return;
/*
		$query = "INSERT INTO songToart (song_id, art_id) VALUES (".$id.", ".$art_id.")";
		$if (!$db->query($query)) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Failed to insert relationship between song and art: " . $db->error;
			closeFile($arrayToSend);
			return;
		}
*/
/*
		$arrayToSend["success"] = true;
		closeFile($arrayToSend);
		return;
	}
*/
?>