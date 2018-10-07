<?php
	require("config.php");
	$db = open_or_init_sqlite_db('database.sqlite', 'init.sql');

	$arrayToSend = array();
	$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);

	$query = "SELECT 
		T1.album_artist_id AS album_artist_id,
	    T3.name AS album_artist_name,
	    T1.album_id AS album_id, 
	    T2.name AS album_name,
	    T9.src AS album_art,
	    T5.id AS id,
	    T5.artist AS artist,
	    T5.title AS title,
	    T5.url AS url,
	    T5.medium AS medium,
	    T5.duration AS duration,
	    T5.lyrics AS simpleLyrics,
	    T5.dynamic_lyrics AS dynamicLyrics,
	    T5.dynamic_lyrics_toggle AS dynamic_lyrics_toggle,
	    T5.start_padding AS start_padding,
	    T5.end_padding AS end_padding,
	    T7.src AS art
	FROM albumToalbum_artist AS T1
	LEFT JOIN albums AS T2 ON T1.album_id = T2.id
	LEFT JOIN album_artists AS T3 on T1.album_artist_id = T3.id
	LEFT JOIN songToalbum AS T4 ON T1.album_id = T4.album_id
	LEFT JOIN music AS T5 ON T4.song_id = T5.id
    LEFT JOIN songToart AS T6 ON T5.id = T6.song_id 
    LEFT JOIN art AS T7 ON T6.art_id = T7.id
    LEFT JOIN albumToart AS T8 ON T1.album_id = T8.album_id
    LEFT JOIN art AS T9 ON T8.art_id = T9.id
    WHERE T5.id = :id";
    $queryParams = array(
    	':id'=>$id
    );
    $result = null;
    $row = null;

    try {
    	$result = exec_sql_query($db, $query, $queryParams)->fetchAll();
    	$row = $result[0];
    }
    catch (PDOException $exception) {
    	$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Error in getting media info from database: ".$exception;
		closeFileNew($arrayToSend);
		return;
    }
	
	$newUrl =  myUrlDecode($row["url"]);
	$row["url"] = $newUrl;

	if ($row["medium"] == 0) {
		if ($row["dynamic_lyrics_toggle"] == 1) {
			$lyrics_array = explode("||realNEWLINE||", $row["dynamicLyrics"]);
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
			//$row["lyrics"] = "<span class='lyric_segment lyric_segment_0 noText'></span>" . $lyrics;
			$row['lyrics'] = '<span class="lyric_segment lyric_segment_0 noText"></span>' . $lyrics . '<span class="lyric_segment lyric_segment_0 noText"></span>';
			$row["dynamic_lyrics_starting_times"] = $lyrics_starting_times;
		} else {
			$lyrics = "<span class='lyric_segment lyric_segment_-1 noText'></span>";
			$lyrics_array = explode("\r\n", $row["simpleLyrics"]);
			foreach ($lyrics_array as $lyric_segment) {
				$lyrics .= "<span class='lyric_segment lyric_segment_-1 noText'>" . $lyric_segment . "</span>";
			}
			$lyrics .= "<span class='lyric_segment lyric_segment_-1 noText'></span>";
			$row["lyrics"] = $lyrics;
			$row["dynamic_lyrics_starting_times"] = null;
		}
	} else if ($row["medium"] == 1 || $row["medium"] == 2 ) {
		if ($row["dynamic_lyrics_toggle"] == 1) {
			$lyrics_array = explode("||realNEWLINE||", $row["dynamicLyrics"]);
			$lyrics= "";
			$lyrics_starting_times = array();
			$largeSize = count($lyrics_array);
			foreach($lyrics_array as $lyrics_segment) {
				$lyrics_segment_array = explode("||", $lyrics_segment);
				$lyrics_segment_style = "";
				$lyrics_starting_time = "";
				$noText = "";

				if ( preg_match("/\[([0-5][0-9]):([0-5][0-9])(.([0-9]{0,3}))?\]({.*?})?/", $lyrics_segment_array[0], $lyrics_segment_time) ) {
					if ( !isset($lyrics_segment_time[5]) || $lyrics_segment_time[5] == "" ) {
						$lyrics_segment_style = "white"; 
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
			$row["lyrics"] = '<span class="lyric_segment lyric_segment_0 noText"></span>' . $lyrics . '<span class="lyric_segment lyric_segment_0 noText"></span>';
			$row["dynamic_lyrics_starting_times"] = $lyrics_starting_times;
		} else {
			$row['lyrics'] = '';
			$row["dynamic_lyrics_starting_times"] = null;
		}
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
	closeFileNew($arrayToSend);
	return;

?>