<?php
	require('config.php');
	$db = open_or_init_sqlite_db('database.sqlite', 'init.sql');

	$arrayToSend = array();
	$arrayToSend['data'] = array();
	
	if ( isset($_POST['get']) && $_POST['get']==1 ) {

		$query = 'SELECT * FROM art WHERE id >= 0 ORDER BY id';
		try {
			$result = exec_sql_query($db, $query)->fetchAll();
		}
		catch (PDOException $exception) {
			$arrayToSend['success'] = false;
			$arrayToSend['message'] = 'Error in getting all artwork for edit: ' . $exception;
			closeFileNew($arrayToSend);
			return;
		}
		if ( count($result) == 0 ) $arrayToSend["data"] = null;
		else if ( count($result) > 0 ) {
			foreach ( $result as $row ) $arrayToSend["data"][$row["id"]] = $row["src"];
		}
		else {
			$arrayToSend['success'] = false;
			$arrayToSend['message'] = "Returned array was not an array";
			closeFileNew($arrayToSend);
			return;
		}

		$specificId = filter_input(INPUT_POST, 'albumId', FILTER_VALIDATE_INT);
		if ($specificId) {
			$query = "SELECT src FROM albumToart AS T1 INNER JOIN art AS T2 ON T1.art_id = T2.id WHERE T1.album_id = :albumId";
			$params = array(
				':albumId'=>$specificId
			);
			try {
				$result = exec_sql_query($db, $query, $params)->fetchAll();
			}
			catch (PDOException $exception) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error receiving album art from database: " . $exception;
				closeFileNew($arrayToSend);
				return;
			}
			if ( count($result) == 0 ) $arrayToSend["art"] = "assets/default_album_art.jpg";
			else if ( count($result) == 1 ) $arrayToSend["art"] = $result[0]["src"];
			else {
				$arrayToSend['success'] = false;
				$arrayToSend['message'] = 'Error receiving info from database: More than 1 row returned';
				closeFileNew($arrayToSend);
				return;
			}
		}

			$arrayToSend["success"] = true;
			closeFileNew($arrayToSend);
			return;



	} else {
		$arrayToSend['success'] = false;
		$arrayToSend['message'] = 'POST[get] not received';
		closeFileNew($arrayToSend);
		return;
	}
?>