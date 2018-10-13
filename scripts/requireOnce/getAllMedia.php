<?php
	require_once('newConfig.php');
	$db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
	if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

	$get = ( $get!=null ) ? $get : filter_input(INPUT_GET,'get',FILTER_VALIDATE_INT);
	if ( !isset($get) || ( $get!=1 && $get!='getAll' ) ) {
		print(returnError($db,'Proper GET not received'));
		return;
	}

	$online = filter_var($_POST['online'], FILTER_VALIDATE_BOOLEAN);
	if ( !isset($online) ) {
		print(returnError($db,'Proper ONLINE not received'));
		return;
	}

	$where = (!$online) ? ' AND T5.medium != 1 ' : ' ';

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
		WHERE (T5.title IS NOT NULL OR T5.url IS NOT NULL)'
		.$where
		.'ORDER BY albumArtistName, albumName, title';

	try {
		$music = execQuery($db, $query)->fetchAll();
	}
	catch (PDOException $exception) {
		print(returnError($db,'Error getting all media',$exception));
		return;
	}

	foreach ($music as $row) {
		$albumArtistName = $row['albumArtistName'] != null ? $row['albumArtistName'] : 'Unknown Album Artist';
		$content[$albumArtistName] = ($content[$albumArtistName] == null) ? array('name'=>$albumArtistName,'albums'=>array()) : $content[$albumArtistName];
		$albumName = $row['albumName'] != null ? $row['albumName'] : 'Unknown Album';
		$albumArt = $row['albumArt'] != null ? $row['albumArt'] : 'assets/default_album_art.jpg';
		$albumID = $row['albumID'];
		$content[$albumArtistName]['albums'][$albumName] = ($content[$albumArtistName]['albums'][$albumName]==null) ? array('art'=>$albumArt,'id'=>$albumID,'songs'=>array()) : $content[$albumArtistName]['albums'][$albumName];
		$row['url'] = myUrlDecode($row['url']);

		if ($row['medium']==0) {
			if ($row['dynamicLyricsToggle'] == 1) {
				$lyricsResults = printDynamicLyrics($row['dynamicLyrics']);
				$row['lyrics'] = $lyricsResults['lyrics'];
				$row['dynamic_lyrics_starting_times'] = $lyricsResults['startTimes'];
			} else {
				$lyrics = '<span class="lyric_segment lyric_segment_-1 noText"></span>';
				$lyrics_array = explode("\r\n", $row["simpleLyrics"]);
				foreach ($lyrics_array as $lyric_segment) {	
					$lyrics .= '<span class="lyric_segment lyric_segment_-1 noText">' . $lyric_segment . '</span>';
				}
				$lyrics .= '<span class="lyric_segment lyric_segment_-1 noText"></span>';
				$row['lyrics'] = '<span class="lyric_segment lyric_segment_0 noText"></span>' . $lyrics . '<span class="lyric_segment lyric_segment_0 noText"></span>';
				$row['dynamic_lyrics_starting_times'] = null;
			}
		} else if ($row['medium'] == 1) {
			if ($row['dynamicLyricsToggle'] == 1) {
				$lyricsResults = printDynamicLyrics($row['dynamicLyrics']);
				$row['lyrics'] = $lyricsResults['lyrics'];
				$row['dynamic_lyrics_starting_times'] = $lyricsResults['startTimes'];
			} else {
				$row['lyrics'] = '';
				$row['dynamic_lyrics_starting_times'] = null;
			}
		}
		$row['startPadding'] = ($row['startPadding']!=null) ? $row['startPadding'] : 0;
		$row['endPadding'] = ($row['endPadding'] != null) ? $row['endPadding'] :  convertToMilliseconds($row['duration']);
		$content[$albumArtistName]['albums'][$albumName]['songs'][] = array(
			'id' => $row['id'],
			'title' => $row['title'],
			'artist' => $row['artist'],
			'medium' => $row['medium'],
			'url' => $row['url']
		);
		$raw[$row['id']] = array(
			'id' => $row['id'],
			'title' => $row['title'],
			'artist' => $row['artist'],
			'album' => $row['albumName'],
			'album_id' => $row['albumID'],
			'medium' => $row['medium'],
			'url' => $row['url'],
			'duration' => $row['duration'],
			'lyrics' => $row['lyrics'],
			'dynamic_lyrics_toggle' => $row['dynamicLyricsToggle'],
			'dynamic_lyrics_starting_times' => $row['dynamic_lyrics_starting_times'],
			'album_artist' => $row['albumArtistName'],
			'album_artist_id' => $row['albumArtistID'],
			'art' => $row['art'],
			'start_padding' => $row['startPadding'],
			'end_padding' => $row['endPadding']
		);
	}
	print(returnSuccess($db,'Success getting all media',array('sorted_data'=>$content,'raw_data'=>$raw)));
	return;
?>