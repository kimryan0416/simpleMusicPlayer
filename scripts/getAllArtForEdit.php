<?php
	require("config.php");
	$arrayToSend = array();
	
	if ( isset($_GET["get"]) && $_GET["get"]==1 ) {

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

	} else {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "GET not received";
		closeFile($arrayToSend);
	}
?>