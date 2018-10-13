<?php
	require("getid3/getid3.php");
	require_once('newConfig.php');
	$getID3 = new getID3;

	$db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
	if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

	$get = ( $get!=null ) ? $get : filter_input(INPUT_GET,'get',FILTER_VALIDATE_INT);
	if ( !isset($get) || ( $get!=11 && $get!='addMedia' ) ) {
		print(returnError($db,'mediaAdd - Proper GET not received'));
		return;
	}

	$media_types = array(
        // audio
		'mp3' => 'audio/mpeg',
		'm4a' => 'audio/mp4',
		// video
		'mp4' => 'video/mp4'
	);

	$audio_types = array(
		'mp3' => 'audio/mpeg',
		'm4a' => 'audio/mp4'
	);
	$video_types = array(
		'mp4' => 'video/mp4'
	);

	$upload_dir = 'media/uploads/';

	$path = realpath('../upload_directory/');

	$dir  = new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS);
	$rii = new RecursiveIteratorIterator($dir, RecursiveIteratorIterator::LEAVES_ONLY);
	$files = array(); 
	foreach ($rii as $file) {
		if (!$file->isDir()) {
			$path_parts = pathinfo($file->getPathname());
			$title = $path_parts['basename'];
			if ( substr($title, 0, 1) != '.' ) {
				$fileURL = $file->getPathname();
				$newFileURL = str_replace('/Users/RK/Desktop/MAMP_WEB/simple_music_player/v3/', '../', $fileURL);
				$files[] = $newFileURL;
			} 
		}
	}

	foreach ( $files as $file ) {
		$thisFileInfo = $getID3->analyze($file);
		getid3_lib::CopyTagsToComments($thisFileInfo);
		$song_info = $thisFileInfo['comments_html'];
		$path_parts = pathinfo($file);
		
		$filename = htmlspecialchars($path_parts['filename']);
		$extension = pathinfo(basename($file), PATHINFO_EXTENSION);
		$extensionType = ( array_key_exists($extension, $video_types) ) ? 2 : 0;

		if ( !array_key_exists($extension, $media_types) ) {
			// This error means the file is an image but is not a jpg or png, so the uploader has to choose another icon
			print(returnError($db,'mediaAdd - File is not mp3, m4a, or mp4'));
			return;
		}

		// Now, we can't do anything else for this thing - we need to get the id so that when we move the file, it's renamed with the id in mind.
		// For now, we process the file info to insert into the database
			
		$title = ( isset($song_info['title'][0]) ) ? $song_info['title'][0] : $filename;
			$title = html_entity_decode(trim($title));
		$artist = ( isset($song_info['artist'][0]) ) ? $song_info['artist'][0] : 'Unknown Artist';
			$artist = html_entity_decode(trim($artist));

		if ( isset ($song_info['album_artist_sort_order']) ) $album_artist = $song_info['album_artist_sort_order'][0];
		else if ( isset ($song_info['album_artist']) ) $album_artist = $song_info['album_artist'][0];
		else if ( isset ($song_info['band']) ) $album_artist = $song_info['band'][0];
		else $album_artist = 'No Album Artist';
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
		catch (PDOException $exception) {
			print(returnError($db,'mediaAdd - insertion into album_artists',$exception));
			return;
		}

		$album = ( isset($song_info['album']) ) ? $song_info['album'][0] : 'Unknown Album';
		$album_id = -1;

		$selectQuery = "SELECT id FROM albums WHERE name=:name";
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
			print(returnError($db,'mediaAdd - insertion itnto albums',$exception));
			return;
		}

		$selectQuery = "SELECT id FROM albumToart WHERE album_id=:albumId";
		$insertQuery = 'INSERT INTO albumToart (album_id, art_id) VALUES ( :albumId, :artId )';
		try {
			$result = execQuery($db, $selectQuery, array(':albumId'=>$album))->fetchAll();
			if ( count($result) == 0 ) execQuery($db, $insertQuery, array(':albumId'=>$album,':artId'=>0));
		}
		catch (PDOException $exception) {
			print(returnError($db,'mediaAdd - insert into albumToart',$exception));
			return;
		}

		$composer = ( isset($song_info['composer']) ) ? $song_info['composer'][0] : '';

		if ( isset($song_info['lyrics']) ) $lyrics = $song_info['lyrics'][0];
		else if ( isset($song_info['unsynchronized_lyric']) ) $lyrics = $song_info['unsynchronized_lyric'][0];
		else if ($extensionType == 2) $lyrics = '';
		else $lyrics = 'No Lyrics Provided';
			
		$comment = ( isset($song_info['comment']) ) ? myUrlEncode($song_info['comment'][0]) : '';

		$insertQuery = "INSERT INTO music (extension, title, artist, composer, lyrics, comment, duration, medium, start_padding, end_padding, url) VALUES ( :extension, :title, :artist, :composer, :lyrics, :comment, :duration, :medium, :startPadding, :endPadding, :url);";
		$insertParams = array(':extension'=>$extension,':title'=>$title,':artist'=>$artist,':composer'=>$composer,':lyrics'=>$lyrics,':comment'=>$comment,':duration'=>$thisFileInfo["playtime_string"],':medium'=>$extensionType,':startPadding'=>0,':endPadding'=>convertToMilliseconds($thisFileInfo["playtime_string"]),':url'=> 'temp');
		$grabIdQuery = "SELECT seq FROM sqlite_sequence WHERE name = :tableName";
		try {
			execQuery($db, $insertQuery, $insertParams);
			$grabResult = execQuery($db, $grabIdQuery, array(':tableName'=>'music'))->fetchAll();
			$id = $grabResult[0]['seq'];
		}
		catch (PDOException $exception) {
			print(returnError($db,'mediaAdd - insert into music',$exception));
			return;
		}
			
		$movedURL = 'media/'.$id.'.'.$extension;
		if ( !rename($file, '../'.$movedURL) ) {
			print(returnError($db,'mediaAdd - unable to move file to media folder',array('oldFile'=>$file,'newFile'=>$movedURL)));
			return;
		}

		// Need to set song - to - art relationship - initially set to null
		$query = "INSERT INTO songToart (song_id, art_id) VALUES (:songId, :artId)";
		try {
			execQuery($db, $query, array(':songId' => $id,':artId' => -1));
		}
		catch(PDOException $exception) {
			print(returnError($db,'mediaArt - insert into songToart; '.$query,$exception));
			return;
		}

		// Getting old album_artist record, replacing old album_artist_id with new one
		// We first check if there is a relationship between the song and the album artist first:
		$selectQuery = "SELECT * FROM albumToalbum_artist WHERE album_id=:albumId AND album_artist_id=:albumArtistId";
		$insertQuery = "INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES ( :albumId, :albumArtistId)";
		try {
			$result = execQuery($db, $selectQuery, array(':albumId' => $album,':albumArtistId' => $album_artist))->fetchAll();
			if ( count($result) == 0 ) execQuery($db, $insertQuery, array(':albumId' => $album,':albumArtistId' => $album_artist));
		}
		catch(PDOException $exception) {
			print(returnError($db,'mediaAdd - insert into albumToalbum_artist',$exception));
			return;
		}
				
		// We now perform the same thing with songToalbum, just in case
		$selectQuery = "SELECT * FROM songToalbum WHERE song_id = :songId AND album_id = :albumId";
		$insertQuery = "INSERT INTO songToalbum (song_id, album_id) VALUES ( :songId, :albumId )";
		try {
			$result = execQuery($db, $selectQuery, array(':songId' => $id,':albumId' => $album))->fetchAll();
			if ( count($result) == 0 ) execQuery($db, $insertQuery, array(':songId' => $id,':albumId' => $album));
		}
		catch (PDOException $exception) {
			print(returnError($db,'mediaAdd - insert into songToalbum',$exception));
			return;
		}

		$query = "UPDATE music SET url = :url WHERE id = :id";
		try {
			execQuery($db, $query, array(':url' => $movedURL,':id' => $id));
		}
		catch (PDOException $exception) {
			print(returnError($db,'mediaAdd - '.$query,$exception));
			return;
		}
	}

	print(returnSuccess($db,'Success'));
	return;
?>