<?php
	require("config.php");
	$db = open_or_init_sqlite_db('database.sqlite', 'init.sql');

	$arrayToSend = array();
	
	if ( isset($_GET["get"]) && $_GET["get"]==1 ) {

		$query = "SELECT * FROM art WHERE id >= 0 ORDER BY id";
		try {
			$result = exec_sql_query($db, $query)->fetchAll();
			if ( count($result) == 0 ) {
				$arrayToSend["success"] = true;
				$arrayToSend["data"] = null;
				closeFileNew($arrayToSend);
				return;
			} 
			else if ( count($result) > 0 ) {
				$arrayToSend["success"] = true;
				$arrayToSend["data"] = array();
				foreach ( $result as $row ) {
					$arrayToSend["data"][$row["id"]] = $row["src"];
				}
				closeFileNew($arrayToSend);
				return;
			}
			else {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Returned array was not an array";
				closeFileNew($arrayToSend);
				return;
			}

		}
		catch (PDOException $exception) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Error in getting all artwork for edit: " . $exception;
			closeFileNew($arrayToSend);
			return;
		}

		

		/*
		$query = "SELECT * FROM art WHERE id >= 0 ORDER BY id";
		if ( !$result = $db->query($query) ) {
			$arrayToSend["success"] = false;
			$arrayToSend["message"] = "Error in getting all artwork for edit: " . $db->error;
			closeFile($arrayToSend);
		}
		if ( $result->num_rows == 0 ) {
			$arrayToSend["success"] = true;
			$arrayToSend["data"] = null;
			closeFile($arrayToSend);
		}

		$arrayToSend["success"] = true;
		$arrayToSend["data"] = array();
		while ( $row = $result->fetch_assoc() ) {
			$arrayToSend["data"][$row["id"]] = $row["src"];
		}
		closeFile($arrayToSend);
		*/

	} else {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "GET not received";
		//closeFile($arrayToSend);
		closeFileNew($arrayToSend);
		return;
	}
?>