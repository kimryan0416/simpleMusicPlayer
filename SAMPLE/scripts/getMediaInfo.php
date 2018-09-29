<?php
	require("config.php");

	$arrayToSend = array();
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

	$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);

	$query = "SELECT 
			T1.album_artist_id AS album_artist_id,
		    T3.name AS album_artist_name,
		    T1.album_id AS album_id, 
		    T2.name AS album_name,
		    T2.art AS album_art,
		    T5.id AS id,
		    T5.artist AS artist,
		    T5.title AS title,
		    T5.url AS url,
		    T5.medium AS medium,
		    T5.art AS art,
		    T5.dynamic_lyrics AS dynamic_lyrics,
		    T5.lyrics AS lyrics,
		    T5.start_padding AS start_padding,
		    T5.end_padding AS end_padding,
		    T5.duration AS duration
		FROM albumToalbum_artist AS T1
		RIGHT OUTER JOIN albums AS T2 ON T1.album_id = T2.id
		RIGHT OUTER JOIN album_artists AS T3 on T1.album_artist_id = T3.id
		RIGHT OUTER JOIN songToalbum AS T4 ON T1.album_id = T4.album_id
		RIGHT OUTER JOIN music AS T5 ON T4.song_id = T5.id
	    WHERE T5.id=".$id;
	if ( !$result = $db->query($query) ) {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Error in getting media info from database";
		closeFile($arrayToSend);
	}

	$row = $result->fetch_assoc();
	
	
	$newUrl =  myUrlDecode($row["url"]);
	$row["url"] = $newUrl;

	if ($row["dynamic_lyrics"] == 1) {
		$lyrics_array = explode("||realNEWLINE||", $row["lyrics"]);
		$lyrics= "";
		$lyrics_starting_times = array();
		//$lyrics_ending_times = array();
		$largeSize = count($lyrics_array);
		foreach($lyrics_array as $lyrics_segment) {
			$lyrics_segment_array = explode("||", $lyrics_segment);
			$lyrics_segment_style = "";
			$lyrics_starting_time = "";
			$noText = "";

			if ( preg_match("/\[([0-5][0-9]):([0-5][0-9])(.([0-9]{0,3}))?\]({.*?})?/", $lyrics_segment_array[0], $lyrics_segment_time) ) {
				if ( !isset($lyrics_segment_time[5]) || $lyrics_segment_time[5] == "" ) {
					$lyrics_segment_style = "black"; 
				} else {
					$lyrics_segment_style = str_replace(array("{", "}"), array("", ""), $lyrics_segment_time[5]);
					if ($lyrics_segment_style == "yellow") {
						$lyrics_segment_style = "rgb(254,223,0)";
					} else if ($lyrics_segment_style == "pink") {
						$lyrics_segment_style = "rgb(255,0,144)";
					}
				}

				if ( !isset($lyrics_segment_time[4]) || $lyrics_segment_time[4] == '' ) {
					$lyrics_segment_time[4] = "000";
				}

				$lyrics_starting_time = $lyrics_segment_time[1] . ":" . $lyrics_segment_time[2] . "." . $lyrics_segment_time[4];
			} else {
				$lyrics_starting_time = "59:59.999";
			}
			$lyrics_starting_time = convertToMilliseconds($lyrics_starting_time);
			$lyrics_starting_times[] = $lyrics_starting_time;

			if ( preg_match("/\[NOTEXT\]/", $lyrics_segment_array[0], $lyrics_segment_noText) ) {
				$noText = "noText";
			}

			if ( strlen(trim($lyrics_segment_array[1])) != 0 ) {
				$lyrics_HTML = "<span class='lyric_segment lyric_segment_".$lyrics_starting_time." ".$noText."' style='color:".$lyrics_segment_style.";'>";
				$lyrics_HTML .= str_replace( 
					array("&#9733;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;", "&#9654;", "&#8594;", "&#8595;", "&#8593;", "&#8592;", "&#9757;", "&#1374;", "&#2570;", "&#9758;", "&#65314;", "&#65313;", "&#65336;", "&#65337;", "&#65324;", "&#65330;", "&#65331;","&#65317;","&#65315;","&#65332;","&#12288;", "&#12304;","&#12305;", "|NL|"),
					array("★", "☆", "—", "…", "√", "～", "►", "→", "↓", "↑", "←", "☝", "՞", "ਊ", "☞", "Ｂ", "Ａ", "Ｘ", "Ｙ", "Ｌ", "Ｒ", "Ｓ","Ｅ","Ｃ","Ｔ","　", "【","】", "<br/>"), 
					$lyrics_segment_array[1]
				);
			} else {
				$lyrics_HTML = "<span class='lyric_segment lyric_segment_".$lyrics_starting_time." noText' style='color:".$lyrics_segment_style.";'>";
			}
			
			$lyrics_HTML .= "</span>";
			$lyrics .= $lyrics_HTML;
		}
		$row["lyrics"] = "<span class='lyric_segment lyric_segment_0 noText'></span>" . $lyrics;
		$row["lyrics_starting_times"] = $lyrics_starting_times;
		$row["lyrics_ending_times"] = $lyrics_ending_times;
	} else {
		$row["lyrics"] = "<span class='lyric_segment lyric_segment_-1 noText'></span>" . $row["lyrics"] . "<span class='lyric_segment noText'></span>";
	}

	if ( $row["art"] == "assets/default_album_art.jpg" ) {
		$row["art"] = $row["album_art"];
	}
	else if ( $row["art"] == null ) {
		$row["art"] = $row["album_art"];
	}
	$row["start_padding"] = $row["start_padding"] != null ? $row["start_padding"] : 0;
	$row["end_padding"] = $row["end_padding"] != null ? $row["end_padding"] :  convertToMilliseconds($row["duration"]);

	$arrayToSend["success"] = true;
	$arrayToSend["info"] = $row; 
	closeFile($arrayToSend);

?>