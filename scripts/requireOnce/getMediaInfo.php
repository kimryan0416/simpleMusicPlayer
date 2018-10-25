<?php
	require_once('newConfig.php');
	$db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
	if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

	$get = ( $get!=null ) ? $get : filter_var($_GET['get'],FILTER_VALIDATE_INT);
	if (!$get || ($get!=2&&$get!='updateCurrent') ) {
		print(returnError($db,'Proper GET not received'));
		return;
	}

	if ( !isset($_POST['id'])) {
		print(returnError($db, 'Proper ID not received',array('id'=>$_POST['id'])));
		return;
	}
	$id = filter_var($_POST['id'], FILTER_VALIDATE_INT);
	if ( $id != 0 && $id == false ) {
		print(returnError($db, 'Proper ID not received',array('id'=>$id)));
		return;
	}

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
    $queryParams = array(':id'=>$id);

	try {
		$result = execQuery($db, $query, $queryParams)->fetchAll();
		$row = $result[0];
	}
	catch (PDOException $exception) {
		print(returnError($db,'Error in getting media info from database',$exception));
		return;
	}

	$row['url'] = myUrlDecode($row['url']);
	if ($row['medium'] == 0) {
		if ($row['dynamic_lyrics_toggle'] == 1) {
			$lyricsResults = printDynamicLyrics($row['dynamicLyrics'],$row['medium']);
			$row['lyrics'] = $lyricsResults['lyrics'];
			$row['dynamic_lyrics_starting_times'] = $lyricsResults['startTimes'];
		} else if ($row['simpleLyrics'] && strlen(trim($row['simpleLyrics'])) > 0) {
			$lyrics = "<span class='lyric_segment lyric_segment_-1 noText'></span>";
			$lyrics_array = explode("\r\n", $row["simpleLyrics"]);
			foreach ($lyrics_array as $lyric_segment) {
				$lyrics .= "<span class='lyric_segment lyric_segment_-1 noText'>" . $lyric_segment . "</span>";
			}
			$lyrics .= "<span class='lyric_segment lyric_segment_-1 noText'></span>";
			$row['lyrics'] = $lyrics;
			$row['dynamic_lyrics_starting_times'] = null;
		}
	} else if ($row["medium"] == 1 || $row["medium"] == 2 ) {
		if ($row["dynamic_lyrics_toggle"] == 1) {
			$lyricsResults = printDynamicLyrics($row['dynamicLyrics'],$row['medium']);
			$row['lyrics'] = $lyricsResults['lyrics'];
			$row['dynamic_lyrics_starting_times'] = $lyricsResults['startTimes'];
		} else {
			$row['lyrics'] = '';
			$row['dynamic_lyrics_starting_times'] = null;
		}
	}
		
	$row['art'] = ( ($row['art']==null)||($row['art']=='assets/default_album_art.jpg') ) ? $row["album_art"] : $row['art'];

	$row['start_padding'] = ($row['start_padding']!=null) ? $row['start_padding'] : 0;
	$row['end_padding'] = ($row['end_padding']!=null) ? $row['end_padding'] :  convertToMilliseconds($row['duration']);

	print(returnSuccess($db,'Success',array('info'=>$row)));
	return;
?>