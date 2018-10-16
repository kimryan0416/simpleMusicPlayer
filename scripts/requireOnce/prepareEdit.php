<?php
	require_once('newConfig.php');
	$db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
	if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

	$get = ( $get!=null ) ? $get : filter_input(INPUT_GET,'get',FILTER_VALIDATE_INT);
	if ( !isset($get) || ( $get!=3 && $get!='prepareEdit' ) ) {
		print(returnError($db,'Proper GET not received'));
		return;
	}

	$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);
	if (!isset($id)) {
		print(returnError($db,'Proper ID not received'));
		return;
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
		T5.dynamic_lyrics_toggle AS dynamic_lyrics_toggle,
		T5.lyrics AS simpleLyrics,
		T5.dynamic_lyrics AS dynamicLyrics,
		T5.start_padding AS start_padding,
		T5.end_padding AS end_padding,
		T5.duration AS duration,
		T7.src AS art
		FROM albumToalbum_artist AS T1
		LEFT JOIN albums AS T2 ON T1.album_id = T2.id
		LEFT JOIN album_artists AS T3 on T1.album_artist_id = T3.id
		LEFT JOIN songToalbum AS T4 ON T1.album_id = T4.album_id
		LEFT JOIN music AS T5 ON T4.song_id = T5.id
		LEFT JOIN songToart AS T6 ON T5.id = T6.song_id 
		LEFT JOIN art AS T7 ON T6.art_id = T7.id
		WHERE T5.id = :id";
	$params = array(
		':id'=>$id
	);
	
	try {
		$result = execQuery($db, $query, $params)->fetchAll();
		$row = $result[0];
	}
	catch (PDOException $exception) {
		print(returnError($db,'Failed to get media info for edit',$exception));
		return;
	}

	$row['title'] = trim(html_entity_decode($row['title']));
	$row['artist'] = trim(html_entity_decode($row['artist']));
	$row['composer'] = trim(html_entity_decode($row['composer']));
	$row['album_name'] = trim(html_entity_decode($row['album_name']));
	$row['album_artist_name'] = trim(html_entity_decode($row['album_artist_name']));

	if ( $row['medium'] == 0 ) {
		$row['simpleLyrics'] = trim(html_entity_decode($row['simpleLyrics']));
			
		$lyrics_array = explode('||realNEWLINE||', $row['dynamicLyrics']);
		$lyrics_array_to_print = array();
		foreach($lyrics_array as $index=>$lyric_segment) {
			$lyric_segment_parts = explode('||', $lyric_segment);
			// lyric_segment_parts[0] = time and styling
			// lyric_segment_parts[1] = actual text

			// First, decode and save text part of lyrics
			$lyrics_array_to_print[$index]['text'] = trim(html_entity_decode($lyric_segment_parts[1]));
			$lyrics_array_to_print[$index]['text'] = str_replace('|NL|', "\r\n", $lyrics_array_to_print[$index]['text']);

			// Now, detect if time and styling contains the NOTEXT label
			// Contains no text label
			if ( preg_match("/\[NOTEXT\]/", $lyric_segment_parts[0], $lyrics_segment_noText) ) $lyrics_array_to_print[$index]["no_text"] = true;
			else $lyrics_array_to_print[$index]['no_text'] = false;

			// Now, we extract time
			$lyrics_array_to_print[$index]['time'] = ( preg_match("/\[([0-9]+)\]/", $lyric_segment_parts[0], $lyrics_segment_time) ) ?
				revertFromMilliseconds((int)$lyrics_segment_time[1]) : '';
				// $lyrics_segment_time[0] = whole string
				// $lyrics_segment_time[1] = time in milliseconds

				// $lyrics_segment_time[1] - [2] = time in minutes and seconds
				// $lyrics_segment_time[3] = .nnn
				// $lyrics_segment_time[4] = nnn

				// We check if the time has 0 or 3 digits in the nnn section
				//if ( !isset($lyrics_segment_time[4]) || $lyrics_segment_time[4] == '' ) $lyrics_segment_time[4] = '0';
						
				//$lyrics_time = $lyrics_segment_time[1] . ':' . $lyrics_segment_time[2] . '.' . $lyrics_segment_time[4];
			//}
			//else $lyrics_time = '';		// Fill in the beginning with [59:59]
			//$lyrics_array_to_print[$index]['time'] = $lyrics_time;

			// Now, we extract styling
			/*
			$lyrics_style = '';
			if ( preg_match("/{(.*?)}/", $lyric_segment_parts[0], $lyrics_segment_styling) ) {
				// $lyrics_segment_time[0] = styling, including brackets
				// $lyrics_segment_time[1] = styling, not including brackets

				// if we got here, then there is styling
				$lyrics_style = $lyrics_segment_styling[1];
			} 
			else $lyrics_style = '';	// Fill in the beginning with [59:59]

			$lyrics_array_to_print[$index]['style'] = $lyrics_style;
			*/
			$lyrics_array_to_print[$index]['style'] = ( preg_match("/{(.*?)}/", $lyric_segment_parts[0], $lyrics_segment_styling) ) ? $lyrics_segment_styling[1] : '';
		}

		$row['dynamicLyrics'] = $lyrics_array_to_print;

	} else {
		$row['simpleLyrics'] = '';
		$lyrics_array = explode('||realNEWLINE||', $row['dynamicLyrics']);
		$lyrics_array_to_print = array();
		foreach($lyrics_array as $index=>$lyric_segment) {
			$lyric_segment_parts = explode('||', $lyric_segment);
			// lyric_segment_parts[0] = time and styling
			// lyric_segment_parts[1] = actual text

			// First, decode and save text part of lyrics
			$lyrics_array_to_print[$index]['text'] = trim(html_entity_decode($lyric_segment_parts[1]));
			$lyrics_array_to_print[$index]['text'] = str_replace('|NL|', "\r\n", $lyrics_array_to_print[$index]['text']);

			// Now, detect if time and styling contains the NOTEXT label
			// if true, contains 'noText' label
			$lyrics_array_to_print[$index]['no_text'] = ( preg_match("/\[NOTEXT\]/", $lyric_segment_parts[0], $lyrics_segment_noText) ) ? true : false;

			// Now, we extract time
			// $lyrics_segment_time[0] = whole string
			// $lyrics_segment_time[1] - [2] = time in minutes and seconds
			// $lyrics_segment_time[3] = .nnn
			// $lyrics_segment_time[4] = nnn
			/*
			$lyrics_array_to_print[$index]['time'] = '';
			if ( preg_match("/\[([0-5][0-9]):([0-5][0-9])(.([0-9]{0,3}))?\]/", $lyric_segment_parts[0], $lyrics_segment_time) ) {
				// We check if the time has 0 or 3 digits in the nnn section
				$lyrics_segment_time[4] = ( !isset($lyrics_segment_time[4]) || $lyrics_segment_time[4] == '' ) ?  '000' : $lyrics_segment_time[4];
				$lyrics_array_to_print[$index]['time'] = $lyrics_segment_time[1] . ':' . $lyrics_segment_time[2] . '.' . $lyrics_segment_time[4];
			}
			*/
			$lyrics_array_to_print[$index]['time'] = ( preg_match("/\[([0-9]+)\]/", $lyric_segment_parts[0], $lyrics_segment_time) ) ? revertFromMilliseconds((int)$lyrics_segment_time[1]) : '';

			// Now, we extract styling
			// $lyrics_segment_time[0] = styling, including brackets
			// $lyrics_segment_time[1] = styling, not including brackets

			// if true, then there is styling
			$lyrics_array_to_print[$index]['style'] = ( preg_match("/{(.*?)}/", $lyric_segment_parts[0], $lyrics_segment_styling) ) ? $lyrics_segment_styling[1] : '';
		}
		$row['dynamicLyrics'] = $lyrics_array_to_print;
	}
		
	$row['start_padding'] = $row['start_padding'] != null ? revertFromMilliseconds($row['start_padding']) : '00:00';
	$row['end_padding'] = $row['end_padding'] != null ? revertFromMilliseconds($row['end_padding']) : $row['end_padding'] = $row['duration'];

	print(returnSuccess($db,'Success',array('info'=>$row)));
	return;
?>