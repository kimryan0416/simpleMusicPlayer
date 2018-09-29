<?php
	require("config.php");
	$arrayToSend = array();
	
	$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);

	function revertFromMilliseconds($milliseconds) {
		$seconds = $milliseconds / 1000;
		$minutes = floor($seconds / 60);
		$minutes = $minutes >= 10 ? $minutes : '0' . $minutes;
		$seconds = floor($seconds % 60);
		$seconds = $seconds >= 10 ? $seconds : '0' . $seconds;
		return $minutes . ":" . $seconds;
	}

	$query = "SELECT 
			T1.album_artist_id AS album_artist_id,
		    T3.name AS album_artist_name,
		    T1.album_id AS album_id, 
		    T2.name AS album_name,
		    T5.id AS id,
		    T5.artist AS artist,
		    T5.title AS title,
		    T5.url AS url,
		    T5.medium AS medium,
		    T5.composer AS composer,
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
	if ( !$songInfo = $db->query($query) ) {
		$arrayToSend["success"] = false;
		$arrayToSend["message"] = "Error in getting media info for Edit";
		closeFile($arrayToSend);
	}
	$row = $songInfo->fetch_assoc();

	$row["title"] = str_replace(
		array("<br/>", "&#39;", "&amp;", "&#9733;", "&#8217;", "&#8220;", "&#8221;", "&#9734;", "&#8212;", "&#8230;", "&quot;", "&#34;", "&#8730;", "&#65374;", "&#12304;","&#12305;"), 
		array("\n", "'", "&", "★", "'", "\"", "\"", "☆", "—", "…", "\"", "\"", "√", "～", "【","】"), 
		$row["title"]
	);
	$row["artist"] = str_replace(
		array("<br/>", "&#39;", "&amp;", "&#9733;", "&#8217;", "&#8220;", "&#8221;", "&#9734;", "&#8212;", "&#8230;", "&quot;", "&#34;", "&#8730;", "&#65374;", "&#12304;","&#12305;"), 
		array("\n", "'", "&", "★", "'", "\"", "\"", "☆", "—", "…", "\"", "\"", "√", "～", "【","】"), 
		$row["artist"]
	);
	$row["composer"] = str_replace(
		array("<br/>", "&#39;", "&amp;", "&#9733;", "&#8217;", "&#8220;", "&#8221;", "&#9734;", "&#8212;", "&#8230;", "&quot;", "&#34;", "&#8730;", "&#65374;", "&#12304;","&#12305;"), 
		array("\n", "'", "&", "★", "'", "\"", "\"", "☆", "—", "…", "\"", "\"", "√", "～", "【","】"), 
		$row["composer"]
	);

	if ($row["dynamic_lyrics"] == 0) {
		$row["lyrics"] = str_replace(
			array("<span class='lyric_segment'>", "<span class='lyric_span'>", "</span>", "<br/>", "&#39;", "&amp;", "&#9733;", "&#8217;", "&#8220;", "&#8221;", "&#9734;", "&#8212;", "&#8230;", "&quot;", "&#34;", "&#8730;", "&#65374;", "&#9654;", "&#8594;", "&#8595;", "&#8593;", "&#8592;", "&#9757;", "&#1374;", "&#2570;", "&#9758;", "&#65314;", "&#65313;","&#65336;","&#65337;","&#65324;","&#65330;", "&#65331;","&#65317;","&#65315;","&#65332;","&#12288;", "&#12304;","&#12305;"), 
			array("", "", "\r\n\r\n", "\r\n", "'", "&", "★", "'", "\"", "\"", "☆", "—", "…", "\"", "\"", "√", "～", "►", "→", "↓", "↑", "←", "☝", "՞", "ਊ", "☞", "Ｂ", "Ａ","Ｘ","Ｙ","Ｌ","Ｒ", "Ｓ","Ｅ","Ｃ","Ｔ","　", "【","】"), 
			$row["lyrics"]
		);
		$row["lyrics"] = trim($row["lyrics"]);
	} else {
		$row["lyrics"] = str_replace(
			array("||realNEWLINE||", "&#39;", "&amp;", "&#9733;", "&#8217;", "&#8220;", "&#8221;", "&#9734;", "&#8212;", "&#8230;", "&quot;", "&#34;", "&#8730;", "&#65374;", "&#9654;", "&#8594;", "&#8595;", "&#8593;", "&#8592;", "&#9757;", "&#1374;", "&#2570;", "&#9758;", "&#65314;", "&#65313;","&#65336;","&#65337;","&#65324;","&#65330;", "&#65331;","&#65317;","&#65315;","&#65332;","&#12288;", "&#12304;","&#12305;"), 
			array("\n", "'", "&", "★", "'", "\"", "\"", "☆", "—", "…", "\"", "\"", "√", "～", "►", "→", "↓", "↑", "←", "☝", "՞", "ਊ", "☞", "Ｂ", "Ａ","Ｘ","Ｙ","Ｌ","Ｒ", "Ｓ","Ｅ","Ｃ","Ｔ","　", "【","】"), 
			$row["lyrics"]
		);
	}

	$row["album_name"] = str_replace(
		array("<br/>", "&#39;", "&amp;", "&#9733;", "&#8217;", "&#8220;", "&#8221;", "&#9734;", "&#8212;", "&#8230;", "&quot;", "&#34;", "&#8730;", "&#65374;", "&#9654;", "&#8594;", "&#8595;", "&#8593;", "&#8592;", "&#9757;", "&#1374;", "&#2570;", "&#9758;", "&#65314;", "&#65313;","&#65336;","&#65337;","&#65324;","&#65330;", "&#65331;","&#65317;","&#65315;","&#65332;","&#12288;", "&#12304;","&#12305;"), 
		array("\n", "'", "&", "★", "'", "\"", "\"", "☆", "—", "…", "\"", "\"", "√", "～", "►", "→", "↓", "↑", "←", "☝", "՞", "ਊ", "☞", "Ｂ", "Ａ","Ｘ","Ｙ","Ｌ","Ｒ", "Ｓ","Ｅ","Ｃ","Ｔ","　", "【","】"), 
		$row["album_name"]
	);

	$row["start_padding"] = $row["start_padding"] != null ? revertFromMilliseconds($row["start_padding"]) : "00:00";
	$row["end_padding"] = $row["end_padding"] != null ? revertFromMilliseconds($row["end_padding"]) : $row["end_padding"] = $row["duration"];

	$arrayToSend["success"] = true;
	$arrayToSend["info"] = $row; 
	closeFile($arrayToSend);

?>