<?php
	require_once('newConfig.php');
	$db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
	if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

	$get = ( $get!=null ) ? $get : filter_input(INPUT_GET,'get',FILTER_VALIDATE_INT);
	if ( !isset($get) || ( $get!=8 && $get!='addEmbed' ) ) {
		print(returnError($db,'addEmbed - Proper GET not received'));
		return;
	}

	$errors_array = array();

	$input = filter_input(INPUT_GET,'input',FILTER_VALIDATE_INT);
	if (!isset($input)||$input!=1) {
		print(returnError($db,'addEmbed - Proper INPUT not received'));
		return;
	}

	$title = filter_input(INPUT_POST, 'video_title_input', FILTER_SANITIZE_STRING);
	$artist = filter_input(INPUT_POST, 'video_artist_input', FILTER_SANITIZE_STRING);
	$album = filter_input(INPUT_POST, 'video_album_input', FILTER_SANITIZE_STRING);
	$album_artist = filter_input(INPUT_POST, 'video_album_artist_input', FILTER_SANITIZE_STRING);
	$composer = filter_input(INPUT_POST, 'video_composer_input', FILTER_SANITIZE_STRING);
	$url = filter_input(INPUT_POST, 'video_url_input', FILTER_SANITIZE_STRING);

	if ( strlen(trim($title)) == 0 ) $errors_array['title'] = 'You must enter a title';
	if ( strlen(trim($artist)) == 0 ) $errors_array['artist'] = 'You must enter an artist';
	if ( strlen(trim($album)) == 0 ) $errors_array['album'] = 'You must enter an album';	
	if ( strlen(trim($album_artist)) == 0 ) $errors_array['album_artist'] = 'You must enter an album artist';
	if ( strlen(trim($url)) == 0 ) $errors_array['url'] = 'You must enter an iframe URL';

	if ( count($errors_array) > 0 ) {
		print(returnError($db,'Errors detected in your embed input',array('inputErrors'=>$errors_array)));
		return;
	}

	$album_id = -1;
	$selectQuery = "SELECT id FROM albums WHERE name = :name";
	$insertQuery = 'INSERT INTO albums (name) VALUES ( :name )';
	$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
	try {
		$result = execQuery($db, $selectQuery, array(':name'=>$album))->fetchAll();
		if ( count($result) == 0 ) {
			execQuery($db, $insertQuery, array(':name'=>$album));
			$result = execQuery($db, $grabIdQuery, array(':tableName'=>'albums'))->fetchAll();
			$album_id = $result[0]['seq'];
		}
		else $album_id = $result[0]['id'];
		$album = $album_id;
	}
	catch(PDOException $exception) {
		print(returnError($db,'addEmbed - insert into albums',$exception));
		return;
	}

	$album_artist_id = -1;
	$selectQuery = "SELECT id FROM album_artists WHERE name = :name";
	$insertQuery = 'INSERT INTO album_artists (name) VALUES ( :name )';
	$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
	try {
		$result = execQuery($db, $selectQuery, array(':name'=>$album_artist))->fetchAll();
		if ( count($result) == 0 ) {
			execQuery($db, $insertQuery, array(':name'=>$album_artist));
			$result = execQuery($db, $grabIdQuery, array(':tableName'=>'album_artists'))->fetchAll();
			$album_artist_id = $result[0]['seq'];
		}
		else $album_artist_id = $result[0]['id'];
		$album_artist = $album_artist_id;
	}
	catch(PDOException $exception) {
		print(returnError($db,'addEmbed - insert into album_artists',$exception));
		return;
	}
			
	$insertQuery = "INSERT INTO music (url, title, artist, composer, medium, extension, duration) VALUES ( :url, :title, :artist, :composer, :medium, :extension, :duration)";
	$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
	try {
		execQuery($db, $insertQuery, array(':url'=>$url,':title'=>$title,':artist'=>$artist,':composer'=>$composer,':medium'=>1,':extension'=>'',':duration'=>0));
		$result = execQuery($db, $grabIdQuery, array(':tableName'=>'music'))->fetchAll();
		$id = $result[0]['seq'];
	}
	catch (PDOException $exception) {
		print(returnError($db,'addEmbed - insert into music',$exception));
		return;
	}

	$albumToalbum_artist_id = -1;
	$selectQuery = "SELECT id FROM albumToalbum_artist WHERE album_id = :albumId AND album_artist_id = :albumArtistId";
	$insertQuery = "INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES ( :albumId, :albumArtistId )";
	$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
	try {
		$result = execQuery($db, $selectQuery, array(':albumId'=>$album,':albumArtistId'=>$album_artist))->fetchAll();
		if ( count($result) == 0 ) {
			execQuery($db, $insertQuery, array(':albumId'=>$album,':albumArtistId'=>$album_artist));
			$result = execQuery($db, $grabIdQuery, array(':tableName'=>'albumToalbum_artist'))->fetchAll();
			$albumToalbum_artist_id = $result[0]['seq'];
		}
		else $albumToalbum_artist_id = $result[0]['id'];
	}
	catch (PDOException $exception) {
		print(returnError($db,'addEmbed - insert into albumToablum_artist',$exception));
		return;
	}

	$songToalbum_id = -1;
	$selectQuery = "SELECT id FROM songToalbum WHERE album_id = :albumId AND song_id = :songId";
	$insertQuery = "INSERT INTO songToalbum (song_id, album_id) VALUES ( :songId, :albumId)";
	$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
	try {
		$result = execQuery($db, $selectQuery, array(':albumId'=>$album,':songId'=>$id))->fetchAll();
		if ( count($result) == 0 ) {
			execQuery($db, $insertQuery, array(':songId'=>$id,':albumId'=>$album));
			$result = execQuery($db, $grabIdQuery, array(':tableName'=>'songToalbum'))->fetchAll();
			$songToalbum_id = $result[0]['seq'];
		}
		else $songToalbum_id = $result[0]['id'];
	}
	catch(PDOException $exception) {
		print(returnError($db,'addEmbed - insert into songToalbum',$exception));
		return;
	}

	$insertQuery = "INSERT INTO songToart (song_id, art_id) VALUES ( :songId, 0)";
	$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
	try {
		execQuery($db, $insertQuery, array(':songId'=>$id));
		$result = execQuery($db, $grabIdQuery, array(':tableName'=>'songToart'))->fetchAll();
		$art_id = $result[0]['seq'];
	}
	catch (PDOException $exception) {
		print(returnError($db,'addEmbed - insert into songToart',$exception));
		return;
	}

	print(returnSuccess($db,'Success',array('id' => $id,'title' => $title,'artist' => $artist,'album' => $album,'album_artist' => $album_artist,'composer' => $composer,'url' => $ifraA[0],'album_to_albumArtist_id' => $albumToalbum_artist_id,'song_to_album_id' => $songToalbum_id,'art' => $art_id)));
	return;
?>