<?php
	require_once('newConfig.php');
	$db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
	if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

	$get = ( $get!=null ) ? $get : filter_input(INPUT_GET,'get',FILTER_VALIDATE_INT);
	if ( !isset($get) || ( $get!=1 && $get!='getAll' ) ) {
		print(returnError($db,'Proper GET not received'));
		return;
	}
	if ( !isset($thisFileDir) ) {
		$thisFileDir = dirname(__FILE__);
		if (substr($thisFileDir, -1) == '/') {
			$thisFileDir = substr($thisFileDir,0,-1);
		}
	}

	//print(returnError($db,'getAll - testing before query',array('GET'=>$_GET,'POST'=>$_POST)));
	//return;

	$query = 'SELECT 
		T1.album_artist_id AS albumArtistID,
		T3.name AS albumArtistName,
		T1.album_id AS albumID, 
		T2.name AS albumName,
		T9.src AS albumArt,
		T5.id AS id,
		T5.artist AS artist,
		T5.title AS title,
		T5.url AS url,
		T5.medium AS medium,
		T5.duration AS duration,
		T5.lyrics AS simpleLyrics,
		T5.dynamic_lyrics as dynamicLyrics,
		T5.dynamic_lyrics_toggle AS dynamicLyricsToggle,
		T5.start_padding AS startPadding,
		T5.end_padding AS endPadding,
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
		WHERE (T5.title IS NOT NULL OR T5.url IS NOT NULL) 
		ORDER BY albumArtistName, albumName, title';

	try {
		$music = execQuery($db, $query)->fetchAll();
	}
	catch (PDOException $exception) {
		print(returnError($db,'Error getting all media',$exception));
		return;
	}

	//print(returnError($db,'getAll - testing after query',array('music'=>$music)));
	//return;

	$embedIDs = array();

	foreach ($music as $row) {
		$albumArtistName = $row['albumArtistName'] != null ? $row['albumArtistName'] : 'Unknown Album Artist';
		$albumName = $row['albumName'] != null ? $row['albumName'] : 'Unknown Album';
		$albumArt = $row['albumArt'] != null ? $row['albumArt'] : 'assets/default_album_art.jpg';
		$albumID = $row['albumID'];
		$row['url'] = myUrlDecode($row['url']);

		if ($row['medium']==0) {
			if ($row['dynamicLyricsToggle'] == 1) {
				$lyricsResults = printDynamicLyrics($row['dynamicLyrics'],$row['medium']);
				$row['lyrics'] = $lyricsResults['lyrics'];
				$row['dynamic_lyrics_starting_times'] = $lyricsResults['startTimes'];
			} else {
				if (strlen(trim($row['simpleLyrics'])) == 0 || $row['simpleLyrics'] == null) $row['lyrics'] = null;
				else {
					$lyrics = '<span class="lyric_segment lyric_segment_-1 noText"></span>';
					$lyrics_array = explode("\r\n", $row['simpleLyrics']);
					foreach ($lyrics_array as $lyric_segment) {	
						$lyrics .= '<span class="lyric_segment lyric_segment_-1 noText">' . $lyric_segment . '</span>';
					}
					$lyrics .= '<span class="lyric_segment lyric_segment_-1 noText"></span>';
					$row['lyrics'] = '<span class="lyric_segment lyric_segment_0 noText"></span>' . $lyrics . '<span class="lyric_segment lyric_segment_0 noText"></span>';
				}
				$row['dynamic_lyrics_starting_times'] = null;
			}
		} else {
			if ($row['dynamicLyricsToggle'] == 1) {
				$lyricsResults = printDynamicLyrics($row['dynamicLyrics'],$row['medium']);
				$row['lyrics'] = $lyricsResults['lyrics'];
				$row['dynamic_lyrics_starting_times'] = $lyricsResults['startTimes'];
			} else {
				$row['lyrics'] = '';
				$row['dynamic_lyrics_starting_times'] = null;
			}
			if ($row['medium'] == 1) array_push($embedIDs, $row['id']);
		}
		$row['startPadding'] = ($row['startPadding']!=null) ? $row['startPadding'] : 0;
		$row['endPadding'] = ($row['endPadding'] != null) ? $row['endPadding'] :  convertToMilliseconds($row['duration']);
		$raw[$row['id']] = array(
			'id' => $row['id'],
			'title' => $row['title'],
			'artist' => $row['artist'],
			'album' => $albumName,
			'album_id' => $albumID,
			'medium' => $row['medium'],
			'url' => $row['url'],
			'duration' => $row['duration'],
			'lyrics' => $row['lyrics'],
			'dynamic_lyrics_toggle' => $row['dynamicLyricsToggle'],
			'dynamic_lyrics_starting_times' => $row['dynamic_lyrics_starting_times'],
			'album_artist' => $albumArtistName,
			'album_artist_id' => $row['albumArtistID'],
			'art' => $row['art'],
			'albumArt' => $albumArt,
			'start_padding' => $row['startPadding'],
			'end_padding' => $row['endPadding']
		);
	}

	print(returnSuccess($db,'Success getting all media',array('list'=>$raw,'embedIDs'=>$embedIDs)));
	return;
	
?>