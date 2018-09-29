<?php
   // session_start();
	require("getid3/getid3.php");
    require("config.php");
	$getID3 = new getID3;

	$database = file_get_contents(PATH_TO_DATABASE);
	$media = json_decode($database, true);

	$id = $_POST["id"];

    if (isset($_GET["get"])) {
        $path = $media[$id]["url"];
        $imagePath = PATH_TO_ASSETS_FOR_FILES."default_album_art.jpg";

        $picture = $getID3->analyze("../".$path);
        //getid3_lib::CopyTagsToComments($picture);
        
        if(isset($picture['id3v2']['APIC']) && !empty($picture['id3v2']['APIC'])){
            $cover='data:'.$picture['id3v2']['APIC'][0]['image_mime'].';charset=utf-8;base64,'.base64_encode($picture['id3v2']['APIC'][0]['data']);
        }
        else if(isset($picture['comments']['picture'][0]['data']) && !empty($picture['comments']['picture'][0]['data'])) {
            $cover='data:'.$picture['id3v2']['APIC'][0]['image_mime'].';charset=utf-8;base64,'.base64_encode($picture['id3v2']['APIC'][0]['data']);
        } else {
            $cover = null;
        }
        if (isset($picture['id3v2']['APIC'][0]['image_mime']) && !empty($picture['id3v2']['APIC'][0]['image_mime'])) {
            $mimetype = $picture['id3v2']['APIC'][0]['image_mime'];
        } else {
            $mimetype = 'image/jpeg'; // or null; depends on your needs
        }
        if (!is_null($cover)) {
            // Send file
            header("Content-Type: " . $mimetype);
            if (isset($picture['id3v2']['APIC'][0]['image_bytes']) && !empty($picture['id3v2']['APIC'][0]['image_bytes'])) {
                header("Content-Length: " . $picture['id3v2']['APIC'][0]['image_bytes']);
            }
            /*
            $_SESSION["image_url"] = @$cover;
            $dataToSend = array(
                "image" => @$cover
            );
            print(json_encode($dataToSend));
            */
            echo @$cover;
        }
    }
    /*
    else if (isset($_GET["save"])) {
        $image_url = PATH_TO_ASSETS_FOR_FILES."default_album_art.jpg";
        if (isset($_SESSION["image_url"]) && $_SESSION["image_url"] != "data:;charset=utf-8;base64,") {
            $image_url = $_SESSION["image_url"];
        }
        $media[$id]["image"] = $image_url;
        $encodedMedia= json_encode($media);
        $fp = fopen(PATH_TO_DATABASE, "w");
        fwrite($fp, $encodedMedia);
        fclose($fp);
    }
    */
    return;
?>