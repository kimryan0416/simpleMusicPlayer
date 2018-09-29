<?php 
	require("config.php");

	$query = "SELECT id FROM music WHERE art LIKE \"testMedia\/%\"";
	if (!$result = $db->query($query)){
		print($db->error);
	}
	while ($row = $result->fetch_assoc()) {
		echo $row["id"] . " : ";
		$query = 'UPDATE music SET art="assets/default_album_art.jpg" WHERE id='.$row["id"];
		if (!$db->query($query)) {
			echo "ERROR: ".$db->error;
		} else {
			echo "SUCCESS!";
		}
		echo "<br>";

	}


?>