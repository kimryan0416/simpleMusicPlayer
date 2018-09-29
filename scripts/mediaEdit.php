<?php
	require("config.php");
	$arrayToSend = array();
	$arrayToSend["reload"] = false;

    $image_types = array("jpg", "JPG", "jpeg", "JPEG", "png", "PNG");

    function convertToMilliseconds($str_time) {
    	sscanf($str_time, "%d:%d.%d", $minutes, $seconds, $milliseconds);
    	$time_seconds = isset($milliseconds) ? $minutes*60000 + $seconds*1000 + $milliseconds : $minutes*60000 + $seconds*1000;
    	return $time_seconds;
    }

	// Detects if the proper files were sent via AJAX and not some malicious other way
	if(isset($_GET["icon"])) {	// edits only the icon - needs to detect if we really have to change the icon or not
		if (isset($_GET["id"]) && isset($_GET["change"]) && $_GET["change"] == 1) {
			$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);
			$upload_dir = 'art/';

			foreach($_FILES as $file) {
				$ext = pathinfo(basename($file["name"]), PATHINFO_EXTENSION);	// grab the extension of the file we are using
						
				$target_file =  $upload_dir . $id . "." . $ext;
				// Setting the target path, which will simultaneously rename our new picture when we move it

				$imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));
				// Get the image file type - this will tell us if this is a jpg or png or whatnot

				$check = getimagesize($file["tmp_name"]);
				// This is just to check that this is a legit file that is an image

				if($check !== false) {
					// Need to confirm that this is a jpg or not
					if ( !in_array($ext,$image_types) ) {
						// This error means the file is an image but is not a jpg or png, so the uploader has to choose another icon
						$arrayToSend["success"] = false;
						$arrayToSend["message"] = "Image file is not jpg or png";
						closeFile($arrayToSend);
					} else {
						if ( file_exists("../" . $target_file) && !unlink("../" . $target_file) ) {
							// This error means there is already an image for the media file we couldn't delete it
							$arrayToSend["success"] = false;
							$arrayToSend["message"] = "Could not delete original icon";
							closeFile($arrayToSend);
						}
						if (move_uploaded_file($file['tmp_name'], "../" . $target_file)) {

							$query = "UPDATE music SET art=\"".$target_file."\" WHERE id=".$id;
							if (!$db->query($query)) {
								// This error means everything was fine... the database couldn't be properly modified
								$arrayToSend["success"] = false;
								$arrayToSend["message"] = "Icon upload error - the file wasn't able to be moved to the temp file for some reason";
								closeFile($arrayToSend);
							} else {
								$arrayToSend["success"] = true;
								$arrayToSend["message"] = "Image successfully moved to " .$target_file;
								closeFile($arrayToSend);
							}
						} else {
							// This error means everything was fine... but we couldn't move the file properly
							$arrayToSend["success"] = false;
							$arrayToSend["message"] = "Icon upload error - the file wasn't able to be moved to the temp file for some reason";
							closeFile($arrayToSend);
						}
					}
				} else {
					// This error means the file is not an image, so the uploader has to choose an actual image
					$arrayToSend["success"] = false;
			   		$arrayToSend["message"] = "This file is not an image; please select an image file";
			   		closeFile($arrayToSend);
				} 
			}
		} else {
			// if we don't have to change the current icon (because we either canceled the edit or we didn't upload a new one)
			$arrayToSend["success"] = true;
   			$arrayToSend["message"] = "Icon Request Recieved, ID found, but we don't change the icon";
   			closeFile($arrayToSend);
		}
	} else if (isset($_GET["song"])) {
		// The files being moved to the temp folder for protection and the icon file being processed, we can proceed with editing the song's details
		if ( $_GET["reload"] == 0 ) {
			$id = filter_input(INPUT_POST, "id_edit", FILTER_VALIDATE_INT);
			$title = filter_input( INPUT_POST, "title_edit", FILTER_SANITIZE_STRING );
			$artist = filter_input( INPUT_POST, "artist_edit", FILTER_SANITIZE_STRING );
			$album = filter_input( INPUT_POST, "album_edit", FILTER_SANITIZE_STRING );
			$album_artist = filter_input( INPUT_POST, "albumArtist_edit", FILTER_SANITIZE_STRING );
			$composer = filter_input( INPUT_POST, "composer_edit", FILTER_SANITIZE_STRING );
			$start_padding = filter_input( INPUT_POST, "start_padding_edit", FILTER_SANITIZE_STRING );
			$end_padding = filter_input( INPUT_POST, "end_padding_edit", FILTER_SANITIZE_STRING );
			$dynamic_lyrics = filter_input( INPUT_POST, "lyric_dynamic_edit", FILTER_VALIDATE_INT );
			$lyrics = filter_input( INPUT_POST, "lyrics_edit", FILTER_SANITIZE_STRING );
			$medium = filter_input( INPUT_POST, "medium_edit", FILTER_VALIDATE_INT );

			$title = str_replace(
				array("\r\n", " & ", "'", "★", "\"", "☆", "—", "…", "√", "～", "【","】"), 
				array("<br/>", " &amp; ", "&#39;", "&#9733;", "&#34;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;", "&#12304;","&#12305;"), 
				trim($title)
			);
			$artist = str_replace(
				array("\r\n", " & ", "'", "★", "\"", "☆", "—", "…", "√", "～", "【","】"), 
				array("<br/>", " &amp; ", "&#39;", "&#9733;", "&#34;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;", "&#12304;","&#12305;"), 
				trim($artist)
			);
			$album = str_replace(
				array("\r\n", " & ", "'", "★", "\"", "☆", "—", "…", "√", "～", "【","】"), 
				array("<br/>", " &amp; ", "&#39;", "&#9733;", "&#34;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;", "&#12304;","&#12305;"), 
				trim($album)
			);
			$composer = str_replace(
				array("\r\n", " & ", "'", "★", "\"", "☆", "—", "…", "√", "～", "【","】"), 
				array("<br/>", " &amp; ", "&#39;", "&#9733;", "&#34;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;", "&#12304;","&#12305;"), 
				trim($composer)
			);
			
			if ($medium == 0) {
				if ($dynamic_lyrics == 1) {
					$lyrics_array = explode("\r\n", $lyrics);		// Divide each line by each line break
					$lyrics = "";									// reset the $lyrics variable to be a blank
					$previous_time_settings = "";
					// We will now proceed to check if each line has the proper syntax, and correct any that do not have them properly set
					$largeSize = count($lyrics_array);
					foreach($lyrics_array as $lyrics_segment_id=>$lyrics_segment) {
						$lyrics_time = "";
						// Each line should have the following syntax: [mm:ss.nnn]{color}||text
						// If the [mm:ss.msms] syntax is missing, we auto-correct by filling in [59:59.999] as a placeholder
						// If the [mm:ss.msms] syntaxi is present, but the time is merely [mm:ss], we autocorrect by replacing it with [mm:ss.000]
						// {style} is optional, so we don't check it
						// We don't check if text is present or not

						$lyrics_segment_array = explode("||", $lyrics_segment);
						if ( preg_match("/\[([0-5][0-9]):([0-5][0-9])(.([0-9]{0,3}))?\]({.*?})?/", $lyrics_segment_array[0], $lyrics_segment_time) ) {
							// We check if the time has 0 or 3 digits in the nnn section
							if ( !isset($lyrics_segment_time[4]) || $lyrics_segment_time[4] == '' ) {
								$lyrics_segment_time[4] = "000";
							}
							if ( !isset($lyrics_segment_time[5]) ) {
								$lyrics_segment_time[5] = ""; 
							}
							$lyrics_time = "[".$lyrics_segment_time[1] . ":" . $lyrics_segment_time[2] . "." . $lyrics_segment_time[4] . "]" . $lyrics_segment_time[5];
						} else {
							// Fill in the beginning with [59:59]
							$lyrics_time = $previous_time_settings;
						}

						if ( preg_match("/\[NOTEXT\]/", $lyrics_segment_array[0], $lyrics_segment_noText) ) {
							$lyrics_text_status = "[NOTEXT]";
						}

						$previous_time_settings = $lyrics_time;

						$lyrics_string = $lyrics_time . $lyrics_text_status . "||";

						// At this point we have ensured that there is some [__:__:___]{___} at the beginning of the string

						// However, we still need to make sure that the text is str_replaced, of course
						if ( isset($lyrics_segment_array[1]) ) {
							$lyrics_string .= str_replace( 
								array("★", "☆", "—", "…", "√", "～", "►", "→", "↓", "↑", "←", "☝", "՞", "ਊ", "☞", "Ｂ", "Ａ","Ｘ","Ｙ","Ｌ","Ｒ", "Ｓ","Ｅ","Ｃ","Ｔ","　", "【","】"), 
								array("&#9733;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;", "&#9654;", "&#8594;", "&#8595;", "&#8593;", "&#8592;", "&#9757;", "&#1374;", "&#2570;", "&#9758;", "&#65314;", "&#65313;","&#65336;","&#65337;","&#65324;","&#65330;", "&#65331;","&#65317;","&#65315;","&#65332;","&#12288;", "&#12304;","&#12305;"), 
								$lyrics_segment_array[1]
							);
						} else {
							$text = preg_replace("/\[([0-5]\d):([0-5]\d)(.\d{1,3})?\]({.*?})?/", "", $lyrics_segment_array[0]);
							$lyrics_string .= str_replace( 
								array("★", "☆", "—", "…", "√", "～", "►", "→", "↓", "↑", "←", "☝", "՞", "ਊ", "☞", "Ｂ", "Ａ","Ｘ","Ｙ","Ｌ","Ｒ", "Ｓ","Ｅ","Ｃ","Ｔ","　", "【","】"), 
								array("&#9733;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;", "&#9654;", "&#8594;", "&#8595;", "&#8593;", "&#8592;", "&#9757;", "&#1374;", "&#2570;", "&#9758;", "&#65314;", "&#65313;","&#65336;","&#65337;","&#65324;","&#65330;", "&#65331;","&#65317;","&#65315;","&#65332;","&#12288;", "&#12304;","&#12305;"), 
								$text
							);
						}

						if ($lyrics_segment_id != $largeSize - 1) {
							$lyrics_string .= "||realNEWLINE||";
						}

						$lyrics .= $lyrics_string;
					}
				
				} else {
					//$lyrics ="<span class='lyric_segment'>".$lyrics."</span>";
					$lyrics_array = explode("\r\n", $lyrics);
					$lyrics = "";
					foreach($lyrics_array as $lyrics_segment) {
						$lyrics_string = "<span class='lyric_segment'>";
						$lyrics_string .= str_replace(
							array("★", "☆", "—", "…", "√", "～", "►", "→", "↓", "↑", "←", "☝", "՞", "ਊ", "☞", "Ｂ", "Ａ","Ｘ","Ｙ","Ｌ","Ｒ", "Ｓ","Ｅ","Ｃ","Ｔ","　", "【","】"), 
							array("&#9733;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;", "&#9654;", "&#8594;", "&#8595;", "&#8593;", "&#8592;", "&#9757;", "&#1374;", "&#2570;", "&#9758;", "&#65314;", "&#65313;","&#65336;","&#65337;","&#65324;","&#65330;", "&#65331;","&#65317;","&#65315;","&#65332;","&#12288;", "&#12304;","&#12305;"), 
							trim($lyrics_segment)
						);
						$lyrics_string .= "</span>";
						$lyrics .= $lyrics_string;
					}
				}

				$start_padding = convertToMilliseconds($start_padding);
				$end_padding = convertToMilliseconds($end_padding);

			} else if ($medium == 1) {
				$start_padding = null;
				$end_padding = null;
				$lyrics = null;
				$dynamic_lyrics = null;
			}

			$query = "SELECT id FROM albums WHERE name=\"".$album."\"";
			if (!$request = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Failed to get album data from database for comparison";
				closeFile($arrayToSend);
			}
			if ($request->num_rows == 1) {
				$row = $request->fetch_assoc();
				$album = $row["id"];
			} else if ($request->num_rows == 0) {
				$query = "INSERT INTO albums (name) VALUES (\"".$album."\")";
				if (!$db->query($query)) {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Failed to add new album to albums table";
					closeFile($arrayToSend);
				}
				$albumId = $db->insert_id;
				$album = $albumId;
			} else {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Got more than 1 album when comparing albums for edit";
				closeFile($arrayToSend);
			}

			$query = "SELECT id FROM album_artists WHERE name=\"".$album_artist."\"";
			if (!$request = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Failed to get album artist data from database for comparison";
				closeFile($arrayToSend);
			}
			if ($request->num_rows == 1) {
				$row = $request->fetch_assoc();
				$album_artist = $row["id"];
			} else if ($request->num_rows == 0) {
				$query = "INSERT INTO album_artists (name) VALUES (\"".$album_artist."\")";
				if (!$db->query($query)) {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Failed to add new album artist to album_artists table";
					closeFile($arrayToSend);
				}
				$albumArtistId = $db->insert_id;
				$album_artist = $albumArtistId;
			} else {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Got more than 1 album artist when comparing album artists for edit";
				closeFile($arrayToSend);
			}

			$query = "UPDATE music SET title=\"".$title."\", artist=\"".$artist."\", composer=\"".$composer."\", lyrics=\"".$lyrics."\", dynamic_lyrics=".$dynamic_lyrics.", start_padding=\"".$start_padding."\", end_padding=\"".$end_padding."\" WHERE id=".$id;
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Something was wrong with the update of the media: ".$db->error;
				closeFile($arrayToSend);
			}
			
			// Getting old album_artist record, replacing old album_artist_id with new one
			// We first check if there is a relationship between the song and the album artist first:
			$query = "SELECT * FROM albumToalbum_artist WHERE album_id=".$album;
			if (!$result = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error with updating relationship between album and album artist: ".$db->error;
				closeFile($arrayToSend);
			}
			if ($result->num_rows == 0) {
				// IF there is no preset relationship, we create a new one:
				$query = "INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES (".$album.", ".$album_artist.")";
				if (!$db->query($query)) {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Error with creating new relationship between album and album artist: ".$db->error;
					closeFile($arrayToSend);
				}
			} else if ($result->num_rows == 1) {
				// We just update like normal
				$query = "UPDATE albumToalbum_artist SET album_artist_id=".$album_artist." WHERE album_id=".$album;
				if (!$db->query($query)) {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Error with updating relationship between album and album artist: ".$db->error;
					closeFile($arrayToSend);
				}
			} else if ($result->num_rows > 1) {
				// There's more than one album artist related to this song! We should fix this:
				$found = false;
				while ($row = $result->fetch_assoc()) {
					if ($row["album_artist_id"] == $album_artist) {
						$found = true;
					} else {
						$query = "DELETE FROM albumToalbum_artist WHERE album_id=".$album." AND album_artist_id=".$row["album_artist_id"];
						$arrayToSend["success"] = false;
						$arrayToSend["message"] = "Error with deleting a relationship between album and album artist that shouldn't exist: ".$db->error;
						closeFile($arrayToSend);
					}
				}
				if (!$found) {
					// IF there is no preset relationship, we create a new one:
					$query = "INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES (".$album.", ".$album_artist.")";
					if (!$db->query($query)) {
						$arrayToSend["success"] = false;
						$arrayToSend["message"] = "Error with creating new relationship between song and album artist: ".$db->error;
						closeFile($arrayToSend);
					}
				}
			}
				
			// We now perform the same thing with songToalbum, just in case
			$query = "SELECT * FROM songToalbum WHERE song_id=".$id;
			if (!$result = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Error with updating relationship between song and album: ".$db->error;
				closeFile($arrayToSend);
			}
			if ($result->num_rows == 0) {
				// IF there is no preset relationship, we create a new one:
				$query = "INSERT INTO songToalbum (song_id, album_id) VALUES (".$id.", ".$album.")";
				if (!$db->query($query)) {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Error with creating new relationship between song and album: ".$db->error;
					closeFile($arrayToSend);
				}
			} else if ($result->num_rows == 1) {
				// We just update like normal
				$query = "UPDATE songToalbum SET album_id=".$album." WHERE song_id=".$id;
				if (!$db->query($query)) {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Error with updating relationship between song and album: ".$db->error;
					closeFile($arrayToSend);
				}
			} else if ($result->num_rows > 1) {
				// There's more than one album artist related to this song! We should fix this:
				$found = false;
				while ($row = $result->fetch_assoc()) {
					if ($row["album_id"] == $album) {
						$found = true;
					} else {
						$query = "DELETE FROM songToalbum WHERE song_id=".$id." AND album_id=".$row["album_id"];
						$arrayToSend["success"] = false;
						$arrayToSend["message"] = "Error with deleting a relationship between song and album that shouldn't exist: ".$db->error;
						closeFile($arrayToSend);
					}
				}
				if (!$found) {
					// IF there is no preset relationship, we create a new one:
					$query = "INSERT INTO songToalbum (song_id, album_id) VALUES (".$id.", ".$album.")";
					if (!$db->query($query)) {
						$arrayToSend["success"] = false;
						$arrayToSend["message"] = "Error with creating new relationship between song and album: ".$db->error;
						closeFile($arrayToSend);
					}
				}
			}

			$arrayToSend["success"] = true;
			closeFile($arrayToSend);
		} else {
			$id = filter_input(INPUT_POST, "id_edit", FILTER_VALIDATE_INT);

			// Firstly, grab the album artist id from our row in the databse
			$query = "SELECT album_id FROM songToalbum WHERE song_id=".$id;
			if (!$result = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Could not grab album id: ".$db->error;
				closeFile($arrayToSend);
			}
			$row = $result->fetch_assoc();
			$album = $row["album_id"];

			$query = "SELECT album_artist_id FROM albumToalbum_artist WHERE album_id=".$album;
			if (!$result = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Could not grab album artist id: ".$db->error;
				closeFile($arrayToSend);
			}
			$row = $result->fetch_assoc();
			$album_artist = $row["album_artist_id"];


			// Secondly: check if the album artist has any songs under its belt, if not then delete the album artist
			$query = "SELECT COUNT(*) AS num FROM albumToalbum_artist WHERE album_artist_id=".$album_artist;
			if (!$result = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Could not confirm if an album artist has more than 0 albums after deletion: ".$db->error;
				closeFile($arrayToSend);
			}
			$row = $result->fetch_assoc();
			if ($row["num"] == 0) {
				$query = "DELETE FROM album_artists WHERE id=".$album_artist."; DELETE FROM albumToalbum_artist WHERE album_artist_id=".$album_artist;
				if (!$db->multi_query($query)) {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Could not delete album artist from album artists table: ".$db->error;
					closeFile($arrayToSend);
				}
			} 

			$query = "SELECT COUNT(*) AS num FROM songToalbum WHERE album_id=".$album;
			if (!$result = $db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Could not confirm if an album has more than 0 songs after deletion: ".$db->error;
				closeFile($arrayToSend);
			}
			$row = $result->fetch_assoc();
			if ($row["num"] == 0) {
				$query = "DELETE FROM albums WHERE id=".$album."; DELETE FROM songToalbum WHERE album_id=".$album;
				if (!$db->multi_query($query)) {
					$arrayToSend["success"] = false;
					$arrayToSend["message"] = "Could not delete album from albums table: ".$db->error;
					closeFile($arrayToSend);
				}
			} 


			// Now, delete row from music table altogether
			$query = "DELETE FROM music WHERE id=".$id;
			if (!$db->query($query)) {
				$arrayToSend["success"] = false;
				$arrayToSend["message"] = "Could not delete relationship between song and album artist: ".$db->error;
				closeFile($arrayToSend);
			}

			// We won't actually delete the file, in case we want it again
			
			$arrayToSend["success"] = true;
			$arrayToSend["message"] = "Successfully deleted song from database";
			closeFile($arrayToSend);
		}
	}

?>