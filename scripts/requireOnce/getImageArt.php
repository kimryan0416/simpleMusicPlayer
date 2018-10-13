<?php
	require_once("getid3/getid3.php");
    $getID3 = new getID3;

    require_once('newConfig.php');
    $db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
    if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

    $get = ( $get!=null ) ? $get : filter_input(INPUT_GET,'get',FILTER_VALIDATE_INT);
    if ( !isset($get) || ( $get!=9 && $get!='getImageArt' ) ) {
        echo false;
        return;
    }

    $id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);
    if (!$id) {
        echo false;
        return;
    }

    $query = "SELECT url FROM music WHERE id = :id";
    $db->commit();
    $result = execQuery($db,$query,array(':id' => $id))->fetchAll();
    $row = $result[0];

    $picture = $getID3->analyze("../".$row["url"]);
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
        
        echo @$cover;
    }
    return;
?>