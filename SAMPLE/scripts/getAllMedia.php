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
	    T2.art AS album_art,
	    T5.id AS id,
	    T5.artist AS artist,
	    T5.title AS title,
	    T5.url AS url,
	    T5.medium AS medium,
	    T5.art AS art,
	    T5.duration AS duration,
	    T5.lyrics AS lyrics,
	    T5.dynamic_lyrics AS dynamic_lyrics,
	    T5.start_padding AS start_padding,
	    T5.end_padding AS end_padding
	FROM albumToalbum_artist AS T1
	RIGHT OUTER JOIN albums AS T2 ON T1.album_id = T2.id
	RIGHT OUTER JOIN album_artists AS T3 on T1.album_artist_id = T3.id
	RIGHT OUTER JOIN songToalbum AS T4 ON T1.album_id = T4.album_id
	RIGHT OUTER JOIN music AS T5 ON T4.song_id = T5.id
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

		if ($row["dynamic_lyrics"] == 1) {
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
			$row["lyrics"] = "<span class='lyric_segment lyric_segment_-1 noText'></span>" . $row["lyrics"] . "<span class='lyric_segment noText'></span>";
			$row["dynamic_lyrics_starting_times"] = null;
			$row["dynamic_lyrics_ending_times"] = null;
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
			"dynamic_lyrics" => $row["dynamic_lyrics"],
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

	closeFile($arrayToSend);

?>