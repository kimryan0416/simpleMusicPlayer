<?php
    require_once('newConfig.php');
    $db = ( $db == null ) ? initSqliteDB('database.sqlite', 'init.sql') : $db;
    if ( !$begunTransaction || $begunTransaction == false) $db->beginTransaction();

    $get = ( $get!=null ) ? $get : filter_input(INPUT_GET,'get',FILTER_VALIDATE_INT);
    if ( !isset($get) || ( $get!=9 && $get!='setSettings' ) ) {
        print(returnError($db,'setSettings - Proper GET not received'));
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

    $listPos = filter_input(INPUT_POST, 'songListPos', FILTER_VALIDATE_INT);
    if ( !isset($listPos) || ($listPos != 0 && $listPos == false) ) {
        print(returnError($db,'setSettings - songListPos either unset or not an integer',array('listPos'=>$listPos)));
        return;
    } else if ( $listPos != 0 && $listPos != 1 ) {
        print(returnError($db,'setSettings - songListPos NOT one of the preset positions possible',array('listPos'=>$listPos)));
        return;
    }

    if ($listPos == 0) $listPos = false;
    else $listPos = true;

    $toSave = array(
        'listPos'=>$listPos,
        'loop'=>1,
        'shuffle'=>0
    );

    $fp = fopen($settingsPath.'settings.json', 'w');
    fwrite($fp, json_encode($toSave));
    fclose($fp);

    print(returnSuccess($db,'Success getting settings',$toSave));
    return;
?>