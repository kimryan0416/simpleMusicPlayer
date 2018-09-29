<?php
	require('config.php');
	$arrayToSend = array();
	$raw = array();

	$query = 'SELECT 
		T1.album_artist_id AS album_artist_id,
	    T3.name AS album_artist_name,
	    T1.album_id AS album_id, 
	    T2.name AS album_name,
	    T5.id AS id,
	    T5.artist AS artist,
	    T5.title AS title,
	    T5.url AS url,
	    T5.medium AS medium,
	    T5.duration AS duration,
	    T5.lyrics AS lyrics,
	    T5.dynamic_lyrics_toggle AS dynamic_lyrics_toggle,
	    T5.start_padding AS start_padding,
	    T5.end_padding AS end_padding	
	FROM albumToalbum_artist AS T1
	RIGHT OUTER JOIN albums AS T2 ON T1.album_id = T2.id
	RIGHT OUTER JOIN album_artists AS T3 on T1.album_artist_id = T3.id
	RIGHT OUTER JOIN songToalbum AS T4 ON T1.album_id = T4.album_id
	RIGHT OUTER JOIN music AS T5 ON T4.song_id = T5.id
	RIGHT OUTER JOIN songToart AS T6 ON T5.id = T6.song_id 
    RIGHT OUTER JOIN art AS T7 ON T6.art_id = T7.id
	WHERE (T5.title IS NOT NULL OR T5.url IS NOT NULL) AND T5.medium = 0
	ORDER BY album_artist_name, album_name, title';

	if (!$music = $db->query($query)) {
		$arrayToSend['success'] = false;
		$arrayToSend['message'] = 'Error in getting media info from database';
		closeFile($arrayToSend);
		return;
	}

	while ($row = $music->fetch_assoc()) {
		$row['url'] =  myUrlDecode($row['url']);

		$row['start_padding'] = $row['start_padding'] != null ? $row['start_padding'] : 0;
		$row['end_padding'] = $row['end_padding'] != null ? $row['end_padding'] :  convertToMilliseconds($row['duration']);

		if ($row['dynamic_lyrics_toggle'] == 1) {
			$row['lyrics'] = str_replace('|NL|', '<br>', $row['lyrics']);
			$lyrics_array = explode('||realNEWLINE||', $row['lyrics']);
			$lyrics = '';
			foreach($lyrics_array as $lyrics_segment) {
				$lyrics_segment_array = explode('||', $lyrics_segment);
				$lyrics .= trim($lyrics_segment_array[1]).'<br>';
			}
			$row['lyrics'] = '<span class="lyric_segment lyric_segment_-1 noText"></span>' . $lyrics . '<span class="lyric_segment noText"></span>';
		} 
		else $row['lyrics'] = '<span class="lyric_segment lyric_segment_-1 noText"></span>' . nl2br($row['lyrics']) . '<span class="lyric_segment noText"></span>';

		$raw[$row['id']] = array(
			'id' => $row['id'],
			'url' => $row['url'],
			'start_padding' => $row['start_padding'],
			'end_padding' => $row['end_padding'],
			'lyrics' => $row['lyrics']
		);
	}

	$arrayToSend['success'] = true;
	$arrayToSend['raw_data'] = $raw;

	closeFile($arrayToSend);
	return;
?>