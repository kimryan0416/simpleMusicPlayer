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

    $possibleListPos = array('left', 'right');
    $listPos = filter_input(INPUT_POST, 'songListPos', FILTER_SANITIZE_STRING);
    if ( !isset($listPos) ) {
        print(returnError($db,'setSettings - songListPos is unset',array('listPos'=>$listPos)));
        return;
    } else if ( !in_array($listPos, $possibleListPos) ) {
        print(returnError($db,'setSettings - songListPos NOT one of the preset positions possible',array('listPos'=>$listPos)));
        return;
    }
    $possibleHeaderPos = array('top','bottom');
    $headerPos = filter_input(INPUT_POST, 'headerPos', FILTER_SANITIZE_STRING);
    if ( !isset($headerPos) ) {
        print(returnError($db,'setSettings - headerPos is unset',array('headerPos'=>$headerPos)));
        return;
    } else if ( !in_array($headerPos, $possibleHeaderPos) ) {
        print(returnError($db,'setSettings - headerPos NOT one of the preset positions possible',array('headerPos'=>$headerPos)));
        return;
    }
    $possibleLoops = array('none','one','all');
    $loop = filter_input(INPUT_POST, 'loopDefault', FILTER_SANITIZE_STRING);
    if (!isset($loop)) {
        print(returnError($db,'setSettings - loop is unset',array('loopDefault'=>$loop)));
        return;
    } else if ( !in_array($loop, $possibleLoops) ) {
        print(returnError($db,'setSettings - loop is not one of the possible loop values',array('loopDefault'=>$loop)));
        return;
    }
    $possibleShuffles = array('off','on');
    $shuffle = filter_input(INPUT_POST, 'shuffleDefault', FILTER_SANITIZE_STRING);
    if ( !isset($shuffle) ) {
        print(returnError($db,'setSettings - shuffleDefault is unset',array('shuffleDefault'=>$shuffle)));
        return;
    } else if ( !in_array($shuffle, $possibleShuffles) ) {
        print(returnError($db,'setSettings - shuffleDefault NOT one of the preset positions possible',array('shuffleDefault'=>$shuffle)));
        return;
    }
    $volume = filter_input(INPUT_POST, 'volumeDefault');
    if (!isset($volume)) {
        print(returnError($db,'setSettings - volumeDefault is unset',array('volumeDefault'=>$volume)));
        return;
    } else if (!filter_var($volume, FILTER_VALIDATE_INT)) {
        print(returnError($db,'setSettings - volumeDefault is not an integer',array('volumeDefault'=>$volume)));
        return;
    } else if ( $volume < 0 || $volume > 100 ) {
        print(returnError($db,'setSettings - volumeDefault is not a possible value',array('volumeDefault'=>$volume)));
        return;
    }

    if ($loop == 'one') $loop = 1;
    else if ($loop == all) $loop = 2;
    else $loop = 0;
    if ($shuffle == 'on') $shuffle = 1;
    else $shuffle = 0;
    $volume = (int)$volume;

    $toSave = array(
        'listPos'=>$listPos,
        'headerPos'=>$headerPos,
        'loop'=>$loop,
        'shuffle'=>$shuffle,
        'volume'=>$volume
    );

    $fp = fopen($settingsPath.'settings.json', 'w');
    fwrite($fp, json_encode($toSave));
    fclose($fp);

    print(returnSuccess($db,'Success getting settings',$toSave));
    return;
?>