<?php
	ini_set('memory_limit','96M');
	ini_set('post_max_size','96M');
	ini_set('upload_max_filesize','96M');

	//$headers = getallheaders();
	//if ($headers["Content-Type"] == "application/json")
    //	$_POST = json_decode(file_get_contents("php://input"), true) ?: [];

	/* -- ----------------------------- */
	/* DB-related Functions 		 	*/
	/* -- ----------------------------- */

	/* --- Functions 'execQuery()' and 'initSqliteDB()' adapted from sample code provided by Kyle J. Harms --- */
	function execQuery($db, $sql, $params = array()) {
		$query = $db->prepare($sql);
		if ($query and $query->execute($params)) {
			return $query;
		}
		return NULL;
	}
	function initSqliteDB($db_filename, $init_sql_filename) {
		if (!file_exists($db_filename)) {
			$db = new PDO('sqlite:' . $db_filename);
			$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

			$db_init_sql = file_get_contents($init_sql_filename);
			if ($db_init_sql) {
				try {
					$result = $db->exec($db_init_sql);
					if ($result) {
						return $db;
					}
				}
				catch (PDOException $exception) {
					unlink($db_filename);
					throw $exception;
				}
			}
		} else {
			$db = new PDO('sqlite:' . $db_filename);
			$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			return $db;
		}
		return NULL;
	}
	
	function returnOnlyIDs($arrValue) {
		if ($arrValue['id'] > 0 ) return $arrValue['id'];
	}
	function cleanArtTable($db=null) {
		$thisDB = (!$db) ? initSqliteDB('database.sqlite','init.sql') : $db;
		$query = 'SELECT T1.id AS id FROM art AS T1 
			LEFT JOIN songTOart AS T2 ON T1.id = T2.art_id
			LEFT JOIN albumToart AS T3 ON T1.id = T3.art_id
			WHERE T2.art_id IS NULL 
			AND T3.art_id IS NULL
			AND T1.id NOT IN (-1,0)';
		$results = execQuery($thisDB, $query)->fetchAll();
		if ( count($results) > 0 ) {
			$artIdsToDelete = array_map( function($k) { return $k['id']; }, $results );
			$deleteString = join(',',$artIdsToDelete);
			$deleteQuery = 'DELETE FROM art WHERE id IN ('.$deleteString.')';
			execQuery($thisDB,$deleteQuery);
		}
		return;
	}

	/* -- ----------------------------- */
	/* Encoding and Decoding Content 	*/
	/* -- ----------------------------- */
	function myUrlDecode($string) {
	    $entities = array('%20','%21','%2A','%27','%28','%29','%3B','%3A','%40','%26','%3D','%2B','%24','%2C','%2F','%3F','%25','%23','%5B','%5D');
	    $replacements = array(' ','!','*',"'","(",")",";",":","@","&","=","+","$",",","/","?","%","#","[","]");
	    return str_replace($entities, $replacements, $string);
	}
	function myUrlEncode($string) {
		$entities = array('!', '*', "'", "(", ")", ":", "[", "]");
		$replacements = array('%21', '%2A', '%27', '%28', '%29', '%3B', '%3A', '%40', '%26', '%3D', '%2B', '%24', '%2C', '%2F', '%3F', '%25', '%23', '%5B', '%5D');
	    return str_replace($entities, $replacements, $string);
	}
	function convertToMilliseconds($str_time) {
    	sscanf($str_time, "%d:%d.%d", $minutes, $seconds, $milliseconds);
    	$time_seconds = isset($milliseconds) ? $minutes*60000 + $seconds*1000 + $milliseconds : $minutes*60000 + $seconds*1000;
    	return $time_seconds;
    }
    function revertFromMilliseconds($milliseconds) {
		$seconds = $milliseconds / 1000;
		$milliseconds = $milliseconds % 1000;
		$minutes = floor($seconds / 60);
		$minutes = $minutes >= 10 ? $minutes : '0' . $minutes;
		$seconds = floor($seconds % 60);
		$seconds = $seconds >= 10 ? $seconds : '0' . $seconds;
		return $minutes . ':' . $seconds . '.' . $milliseconds;
	}
    function decodeLyricsForPrint($string) {
		$htmlEntities=array('&#9733;','&#9734;','&#8212;','&#8230;','&#8730;','&#65374;','&#9654;','&#8594;','&#8595;','&#8593;','&#8592;','&#9757;','&#1374;','&#2570;','&#9758;','&#65314;','&#65313;','&#65336;','&#65337;','&#65324;','&#65330;','&#65331;','&#65317;','&#65315;','&#65332;','&#12288;','&#12304;','&#12305;','|NL|');
		$printEntities=array('★','☆','—','…','√','～','►','→','↓','↑','←','☝','՞','ਊ','☞','Ｂ','Ａ','Ｘ','Ｙ','Ｌ','Ｒ','Ｓ','Ｅ','Ｃ','Ｔ',' ','【','】','<br/>');
		return str_replace($htmlEntities,$printEntities,$string);
	}

	/* -- ----------------------------- */
	/* Printing Functions 			 	*/
	/* -- ----------------------------- */
	function closePHP($arr) {
		return json_encode($arr, JSON_UNESCAPED_SLASHES);
	}
	function returnSuccess($db, $message='', $arr=array()) {
		$db->commit();
		$returnArr = array('success'=>true,'message'=>$message);
		if ( (is_array($arr) && count($arr)>0) || ( is_object($arr) && !empty((array)$arr) ) ) $returnArr['data'] = $arr;
		return closePHP($returnArr);
	}
	function returnError($db, $message='', $arr=array()) {
		$db->rollback();
		$returnArr = array('success'=>false,'message'=>$message);
		if ( (is_array($arr) && count($arr)>0) || ( is_object($arr) && !empty((array)$arr) ) ) $returnArr['data'] = $arr;
		return closePHP($returnArr);
	}
	function printDynamicLyrics($dynamicLyrics,$medium=0) {
		$lyricsArray = explode('||realNEWLINE||',$dynamicLyrics);
		$lyrics='';
		$lyricsStartingTimes=array();
		foreach($lyricsArray as $segment) {
			$segmentArray=explode('||',$segment);
			$segmentStyle='';
			$startTime='';
			$noText='';
			if (preg_match("/\[([0-9]*)\]({.*?})?/",$segmentArray[0],$segmentTime)){
				if (!isset($segmentTime[2])||$segmentTime[2]=='') $segmentStyle = ($medium == 0) ? 'black' : 'white'; 
				else {
					$segmentStyle=str_replace(array('{','}'),array('',''),$segmentTime[2]);
					if ($segmentStyle=='yellow') $segmentStyle='rgb(254,223,0)';
					else if ($segmentStyle=='pink') $segmentStyle='rgb(255,0,144)';
				}
				if (!isset($segmentTime[1])||$segmentTime[1]=='') $segmentTime[4]='0';
				$lyricsStartingTimes[]=(int)$segmentTime[1];
				$startTime = (int)$segmentTime[1];
			} 
			else $lyricsStartingTimes[]=0;
			if (preg_match("/\[NOTEXT\]/",$segmentArray[0],$segment_noText)) $noText='noText';
			if (strlen(trim($segmentArray[1]))!=0) $lyrics.='<span class="lyric_segment lyric_segment_'.$startTime.' '.$noText.'" style="color:'.$segmentStyle.';">'.decodeLyricsForPrint($segmentArray[1]).'</span>';
			else $lyrics.='<span class="lyric_segment lyric_segment_'.$startTime.' noText" style="color:'.$segmentStyle.';"></span>';
		}
		return array(
			'lyrics'=>'<span class="lyric_segment lyric_segment_0 noText"></span>'.$lyrics.'<span class="lyric_segment lyric_segment_0 noText"></span>',
			'startTimes'=>$lyricsStartingTimes
		);
	}
	function generateRandomName($length) {
		$digits_needed = (int)$length;
		$string = '';
		$count=0;
		while ( $count < $digits_needed ) {
			$random_digit = mt_rand(0, 9);
			$string .= $random_digit;
			$count++;
		}
		return $string;
	}

?>