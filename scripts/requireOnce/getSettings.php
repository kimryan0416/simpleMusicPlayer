<?php
    require_once('newConfig.php');
    $db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
    if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

    $get = ( $get!=null ) ? $get : filter_input(INPUT_GET,'get',FILTER_VALIDATE_INT);
    if ( !isset($get) || ( $get!=8 && $get!='getSettings' ) ) {
        echo false;
        return;
    }
    if ( !isset($thisFileDir) ) {
        $thisFileDir = dirname(__FILE__);
        if (substr($thisFileDir, -1) == '/') {
            $thisFileDir = substr($thisFileDir,0,-1);
        }
    }

    $docRoot = $_SERVER['DOCUMENT_ROOT'];
    if (substr($docRoot, -1) != '/') {
        $docRoot .= '/';
    }
    $subPath = preg_replace('~' . $docRoot . '~i', '', $thisFileDir);
    $pathParts = pathinfo($subPath);
    $thisBasename = $pathParts['basename'];
    switch($thisBasename) {
        case 'scripts':
            $settingsPath = './';
            break;
        case 'requireOnce':
            $settingsPath = '../';
        default:
            $settingsPath = '../';
    }

    $fp = file_get_contents($settingsPath.'settings.json');
    $settings = json_decode($fp,true);

    print(returnSuccess($db,'Success getting settings',$settings));
    return;
?>