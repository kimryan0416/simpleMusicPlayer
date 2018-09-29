<?php
	define ("PATH_TO_CONTENT", "media/");
	define ("ROOT_DIRECTORY", "media/");
	define( "PATH_TO_ASSETS_FOR_FILES", "assets/" );

	// ** MySQL connection settings ** //
	//Keep this as localhost for the course server
	define('DB_HOST', 'localhost');
	define('DB_USER', 'kimryan0416');    
	define('DB_PASSWORD', 'starcraft'); 
	define('DB_NAME', 'SAMPLE_simple_music_player'); 

	$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME ) or die('Error connecting to MySQL server.' .mysql_error());

	function closeFile($arr) {
		global $db;
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

	function myUrlEncode($string) {
		//$entities = array('!', '*', "'", "(", ")", ";", ":", "@", "&", "=", "+", "$", ",", "/", "?", "%", "#", "[", "]");
		$entities = array('!', '*', "'", "(", ")", ":", "[", "]");
		$replacements = array('%21', '%2A', '%27', '%28', '%29', '%3B', '%3A', '%40', '%26', '%3D', '%2B', '%24', '%2C', '%2F', '%3F', '%25', '%23', '%5B', '%5D');
	    return str_replace($entities, $replacements, $string);
	}
?>