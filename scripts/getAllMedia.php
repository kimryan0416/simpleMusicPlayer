<?php
	require("config.php");
	$arrayToSend = array();
	$content = array();
	$raw = array();

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
	    T5.lyrics AS lyrics,
	    T5.dynamic_lyrics_toggle AS dynamic_lyrics_toggle,
	    T5.start_padding AS start_padding,
	    T5.end_padding AS end_padding,
	    T7.src AS art
	FROM albumToalbum_artist AS T1
	RIGHT OUTER JOIN albums AS T2 ON T1.album_id = T2.id
	RIGHT OUTER JOIN album_artists AS T3 on T1.album_artist_id = T3.id
	RIGHT OUTER JOIN songToalbum AS T4 ON T1.album_id = T4.album_id
	RIGHT OUTER JOIN music AS T5 ON T4.song_id = T5.id
    RIGHT OUTER JOIN songToart AS T6 ON T5.id = T6.song_id 
    RIGHT OUTER JOIN art AS T7 ON T6.art_id = T7.id
    RIGHT OUTER JOIN albumToart AS T8 ON T1.album_id = T8.album_id
    RIGHT OUTER JOIN art AS T9 ON T8.art_id = T9.id
    WHERE T5.title IS NOT NULL OR T5.url IS NOT NULL
	ORDER BY album_artist_name, album_name, title";
	//$query = "SELECT T1.id AS id, title, url, artist, album_artist, album, medium, art, T2.name AS album_artist_name FROM music AS T1 INNER JOIN album_artists AS T2 ON T1.album_artist = T2.id ORDER BY title";
	if (!$music = $db->query($query)) {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Error in getting media info from database";
		closeFile($arrayToSend);
	}

	while ($row = $music->fetch_assoc()) {

		$album_artist_name = $row["album_artist_name"] != null ? $row["album_artist_name"] : "Unknown Album Artist";
		if ( $content[$album_artist_name] == null ) {
			$content[$album_artist_name] = array(
				"name" => $album_artist_name,
				"albums" => array()
			);
		}
		$album_name = $row["album_name"] != null ? $row["album_name"] : "Unknown Album";
		$album_art = $row["album_art"] != null ? $row["album_art"] : "assets/default_album_art.jpg";
		$album_id = $row["album_id"];
		if ( $content[$album_artist_name]["albums"][$album_name] == null ) {
			$content[$album_artist_name]["albums"][$album_name] = array(
				"art" => $album_art,
				"id" => $album_id,
				"songs" => array()
			);
		} 

		$newUrl =  myUrlDecode($row["url"]);
		$row["url"] = $newUrl;

		if ($row["medium"] == 0) {
			if ($row["dynamic_lyrics_toggle"] == 1) {
				$lyrics_array = explode("||realNEWLINE||", $row["lyrics"]);
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
						$lyrics_HTML .= decodeLyricsForPrint( $lyrics_segment_array[1] );
					} else {
						$lyrics_HTML = "<span class='lyric_segment lyric_segment_".$lyrics_starting_time." noText' style='color:".$lyrics_segment_style.";'>";
					}
					
					$lyrics_HTML .= "</span>";
					$lyrics .= $lyrics_HTML;
				}
				$row["lyrics"] = "<span class='lyric_segment lyric_segment_0 noText'></span>" . $lyrics;
				$row["dynamic_lyrics_starting_times"] = $lyrics_starting_times;
				$row["dynamic_lyrics_ending_times"] = $lyrics_ending_times;
			} else {
				$lyrics = "<span class='lyric_segment lyric_segment_-1 noText'></span>";
				$lyrics_array = explode("\r\n", $row["lyrics"]);
				foreach ($lyrics_array as $lyric_segment) {
					$lyrics .= "<span class='lyric_segment lyric_segment_-1 noText'>" . $lyric_segment . "</span>";
				}
				$lyrics .= "<span class='lyric_segment lyric_segment_-1 noText'></span>";
				/*
				$row["lyrics"] = "<span class='lyric_segment lyric_segment_-1 noText'></span><span class='lyric_segment lyric_segment_-1 noText'>" . str_replace("\r\n", "<br>", $row["lyrics"]) . "</span>";
				*/
				$row["lyrics"] = $lyrics;
				$row["dynamic_lyrics_starting_times"] = null;
				$row["dynamic_lyrics_ending_times"] = null;
			}
		} else if ($row["medium"] == 1) {
			if ($row["dynamic_lyrics_toggle"] == 1) {
				$lyrics_array = explode("||realNEWLINE||", $row["lyrics"]);
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
				$row["lyrics"] = $lyrics;
				$row["dynamic_lyrics_starting_times"] = $lyrics_starting_times;
			} else {
				$row["lyrics"] = "";
				$row["dynamic_lyrics_starting_times"] = null;
			}
		}
		

		if ( $row["art"] == "assets/default_album_art.jpg" || $row["art"] == null ) {
			$row["art"] = $row["album_art"];
		}

		$row["start_padding"] = $row["start_padding"] != null ? $row["start_padding"] : 0;
		$row["end_padding"] = $row["end_padding"] != null ? $row["end_padding"] :  convertToMilliseconds($row["duration"]);

		$content[$album_artist_name]["albums"][$album_name]["songs"][] = array(
			"id" => $row["id"],
			"title" => $row["title"],
			"artist" => $row["artist"],
			"medium" => $row["medium"],
			"url" => $row["url"]
		);

		$raw[$row["id"]] = array(
			"id" => $row["id"],
			"title" => $row["title"],
			"artist" => $row["artist"],
			"album" => $row["album_name"],
			"album_id" => $row["album_id"],
			"medium" => $row["medium"],
			"url" => $row["url"],
			"duration" => $row["duration"],
			"lyrics" => $row["lyrics"],
			"dynamic_lyrics_toggle" => $row["dynamic_lyrics_toggle"],
			"dynamic_lyrics_starting_times" => $row["dynamic_lyrics_starting_times"],
			"dynamic_lyrics_ending_times" => $row["dynamic_lyrics_ending_times"],
			"album_artist" => $row["album_artist_name"],
			"album_artist_id" => $row["album_artist_id"],
			"art" => $row["art"],
			"start_padding" => $row["start_padding"],
			"end_padding" => $row["end_padding"]
		);

	}

	$arrayToSend["success"] = true;
	$arrayToSend["sorted_data"] = $content;
	$arrayToSend["raw_data"] = $raw;

	closeFile($arrayToSend, true);

?>