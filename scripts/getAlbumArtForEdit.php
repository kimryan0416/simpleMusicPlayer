<?php
    require("config.php");
    $db = open_or_init_sqlite_db('database.sqlite', 'init.sql');

	$arrayToSend = array();

	if ( isset($_GET["id"]) && $_GET["id"] != -1 ) {

		$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);
		if ( !$id ) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "id received is NOT an integer";
		} else {

			$query = "SELECT src FROM albumToart AS T1 INNER JOIN art AS T2 ON T1.art_id = T2.id WHERE T1.album_id = :albumId";
			$params = array(
				':albumId'=>$id
			);
			try {
				$result = exec_sql_query($db, $query, $params)->fetchAll();
				if ( count($result) == 0 ) {
					$arrayToSend["success"] = true;
					$arrayToSend["art"] = "assets/default_album_art.jpg";
				}
				else if ( count($result) == 1 ) {
					$arrayToSend["success"] = true;
					$arrayToSend["art"] = $result[0]["src"];
				}
				else {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Error receiving info from database: More than 1 row returned";
				}
			}
			catch (PDOException $exception) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error receiving info from database: " . $exception;
			}

			/*
			$query = 'SELECT * FROM albumToart AS T1 INNER JOIN art AS T2 ON T1.art_id = T2.id WHERE T1.album_id='.$id;
			if (!$result = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error receiving info from database: " . $db->error;
			}
			else if ($result->num_rows == 0) {
				$arrayToSend["success"] = true;
				$arrayToSend["art"] = "assets/default_album_art.jpg";
			} else {
				$row = $result->fetch_assoc();
				$arrayToSend["success"] = true;
				$arrayToSend["art"] = $row["src"];
			}
			*/
		}
	} else {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "id from GET either not set or = -1";
	}
	closeFileNew($arrayToSend);
	return;

?>