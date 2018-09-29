<?php
	require('config.php');
	$arrayToSend = array();

	$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);

	$query = 'SELECT 
	    T2.name AS album_name,
	    T2.art AS album_art,
	    T5.id AS id,
	    T5.artist AS artist,
	    T5.title AS title,
	    T5.duration AS duration,
	    T7.src AS art
	FROM albumToalbum_artist AS T1
	RIGHT OUTER JOIN albums AS T2 ON T1.album_id = T2.id
	RIGHT OUTER JOIN album_artists AS T3 on T1.album_artist_id = T3.id
	RIGHT OUTER JOIN songToalbum AS T4 ON T1.album_id = T4.album_id
	RIGHT OUTER JOIN music AS T5 ON T4.song_id = T5.id
	RIGHT OUTER JOIN songToart AS T6 ON T5.id = T6.song_id 
    RIGHT OUTER JOIN art AS T7 ON T6.art_id = T7.id
	WHERE T5.id = '.$id;

	if (!$music = $db->query($query)) {
		$arrayToSend['success'] = false;
		$arrayToSend['message'] = 'Error in getting media info from database';
		closeFile($arrayToSend);
	}

	$row = $music->fetch_assoc();

	$album_art = $row['album_art'] != null ? $row['album_art'] : 'assets/default_album_art.jpg';
	if ( $row['art'] == 'assets/default_album_art.jpg' || $row['art'] == null ) $row['art'] = $row['album_art'];

	$arrayToSend['success'] = true;
	$arrayToSend['data'] = array(
		'title' => $row['title'],
		'artist' => $row['artist'],
		'duration' => $row['duration'],
		'art' => $row['art']
	);

	closeFile($arrayToSend);
?>