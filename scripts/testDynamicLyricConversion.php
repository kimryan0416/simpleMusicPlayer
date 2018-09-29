<?php 
	require("config.php");
	$arrayToSend = array();

	$input = "";
	$lyrics = "";
	$submitted = 0;
	if ( isset($_POST["test_lyrics"]) ) {
		$submitted = 1;
		$lyrics = filter_input(INPUT_POST, "test_lyrics", FILTER_SANITIZE_STRING);
		$input = $lyrics;
		$lyrics_array = explode("\r\n\r\n", $lyrics);
		$lyrics = "";
		$largeSize = count($lyrics_array);
		foreach($lyrics_array as $lyrics_segment_id=>$lyrics_segment) {
			$inner_lyrics_array = explode("\r\n", $lyrics_segment);
			// First element in $inner_lyrics_array should be BEGINNING:TIME|ENDING:TIME
			// The other elements should be parsed through and trimmed like normal
			$lyrics .= $inner_lyrics_array[0];
			$lyrics .= "|TIMES|";
			$size = count($inner_lyrics_array);
			for ( $i = 1; $i < $size; $i++ ) {
				
				$newLyrics = str_replace( array("★", "☆", "—", "…", "√", "～"), array("&#9733;", "&#9734;", "&#8212;", "&#8230;", "&#8730;", "&#65374;"), trim($inner_lyrics_array[$i]) );
				if ($i != $size - 1) {
					$newLyrics .= "|NEWLINE|";
				}

				$lyrics .= $newLyrics;
				
			}
			if ($lyrics_segment_id != $largeSize - 1) {
				$lyrics .= "||DIVIDER||";
			}
		}
	}
	$arrayToSend["submitted"] = $submitted;
	$arrayToSend["input"] = $input;
	$arrayToSend["converted"] = $lyrics;
	closeFile($arrayToSend);
?>