<?php 
	session_start();
	require("config.php");

	$dataToSend = array();
	if (isset($_POST["type"])) {
		$path = realpath("../".PATH_TO_CONTENT);
		$dir  = new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS);
		$rii = new RecursiveIteratorIterator($dir, RecursiveIteratorIterator::LEAVES_ONLY);
		$files = array(); 
		foreach ($rii as $file) {
			if (!$file->isDir()) {
				$path_parts = pathinfo($file->getPathname());
				$title = $path_parts["basename"];
				if ( substr($title, 0, 1) != "." ) {
					$fileURL = $file->getPathname();
					$fileURL_Pos = strpos($fileURL, ROOT_DIRECTORY);
					$root_length = strlen(ROOT_DIRECTORY);

					$newFileURL = PATH_TO_CONTENT . substr($fileURL, $fileURL_Pos + $root_length);
					$files[] = $newFileURL;
				} 
			}
		}

		$query = "TRUNCATE TABLE music; TRUNCATE TABLE songToalbum; TRUNCATE TABLE albumToalbum_artist; TRUNCATE albums; TRUNCATE album_artists;";
		if (!$db->multi_query($query)) {
			$dataToSend["success"] = false;
			$dataToSend["error"] = "Truncation of relevant tables not performable";
			closeFile($dataToSend);
		} else {
			$_SESSION["files"] = $files;
			$dataToSend["success"] = true;
			$dataToSend["files"] = $files;
			closeFile($dataToSend);
		}

	} else {
		$dataToSend["success"] = false;
		$dataToSend["error"] = "Type not set";
		closeFile($dataToSend);
	}
?>