<?php
	define('PATH_TO_CONTENT','media/');
	define('ROOT_DIRECTORY','media/');
	define('PATH_TO_ASSETS_FOR_FILES','assets/');

	ini_set('memory_limit','96M');
	ini_set('post_max_size','64M');
	ini_set('upload_max_filesize','64M');

	// ** MySQL connection settings ** //
	//Keep this as localhost for the course server
	define('DB_HOST','localhost');
	define('DB_USER','kimryan0416');    
	define('DB_PASSWORD','starcraft'); 
	define('DB_NAME','simple_music_player'); 

	$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME ) or die('Error connecting to MySQL server.' .mysql_error());
	$db->autocommit(FALSE);
	$db->begin_transaction(MYSQLI_TRANS_START_READ_WRITE);

	function closeFile($arr, $comm = true) {
		global $db;
		if ($comm) $db->commit();
		else $db->rollback();
		$db->close();
		print(json_encode($arr, JSON_UNESCAPED_SLASHES));
		return;
	}

	function myUrlDecode($string) {
	    $entities = array(
	    	'%20',
	    	'%21', 
	    	'%2A', 
	    	'%27', 
	    	'%28', 
	    	'%29', 
	    	'%3B', 
	    	'%3A', 
	    	'%40', 
	    	'%26', 
	    	'%3D', 
	    	'%2B', 
	    	'%24', 
	    	'%2C', 
	    	'%2F', 
	    	'%3F', 
	    	'%25', 
	    	'%23', 
	    	'%5B', 
	    	'%5D');
	    $replacements = array(
	    	' ',
	    	'!', 
	    	'*', 
	    	"'", 
	    	"(", 
	    	")", 
	    	";", 
	    	":", 
	    	"@", 
	    	"&", 
	    	"=",
	    	"+", 
	    	"$", 
	    	",", 
	    	"/", 
	    	"?", 
	    	"%", 
	    	"#", 
	    	"[", 
	    	"]");
	    return str_replace($entities, $replacements, $string);
	}

	function convertToSeconds($str_time) {
    	sscanf($str_time, "%d:%d.%d", $minutes, $seconds, $milliseconds);
    	$time_seconds = isset($milliseconds) ? ($minutes*60 + $seconds) . "." . $milliseconds : ($minutes*60 + $seconds) . ".000";
    	return $time_seconds;
    }

    function convertToMilliseconds($str_time) {
    	sscanf($str_time, "%d:%d.%d", $minutes, $seconds, $milliseconds);
    	$time_seconds = isset($milliseconds) ? $minutes*60000 + $seconds*1000 + $milliseconds : $minutes*60000 + $seconds*1000;
    	return $time_seconds;
    }

	function myUrlEncode($string) {
		//$entities = array('!', '*', "'", "(", ")", ";", ":", "@", "&", "=", "+", "$", ",", "/", "?", "%", "#", "[", "]");
		$entities = array('!', '*', "'", "(", ")", ":", "[", "]");
		$replacements = array('%21', '%2A', '%27', '%28', '%29', '%3B', '%3A', '%40', '%26', '%3D', '%2B', '%24', '%2C', '%2F', '%3F', '%25', '%23', '%5B', '%5D');
	    return str_replace($entities, $replacements, $string);
	}

	function decodeLyricsForPrint($string) {
		$htmlEntities = array('|NL|');
		$printEntities = array('<br/>');
		return str_replace( $htmlEntities, $printEntities, $string );
	}
?>