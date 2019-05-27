const express = require('express');
const mm = require('musicmetadata');
const Entities = require('html-entities').AllHtmlEntities;
const fs = require('fs');
const path = require('path');

var mimeTypes = [
	'audio/mpeg',
	'audio/mp4',
	'audio/x-m4a',
	'audio/x-mp3'
];
var entities = new Entities();
function isArray(a) {	return Object.prototype.toString.call(a) === "[object Array]";	}
function milliseconds(seconds) {	return Math.floor(seconds*1000);	}
function readableDuration(milliseconds,includeMilli=true) {
	var sec = milliseconds / 1000;
	var min = Math.floor(sec/60);
	min = min >= 10 ? min : '0' + min;
	sec = Math.floor(sec % 60);
	sec = sec >= 10 ? sec : '0' + sec; 
	var milli = Math.floor(milliseconds%1000);
	milli = milli >= 100 ? milli : '0' + milli;
	milli = milli >= 10 ? milli : '0' + milli;
	return (includeMilli) ? min + ":" + sec + "." + milli : min + ":" + sec;
}
function millisecondDuration(time) {
	var segments = time.split(':');
	var hours,minutes,seconds,milli;
	seconds = parseFloat(segments[segments.length-1]);
	minutes = (segments.length > 1) ? parseFloat(segments[segments.length-2]) : 0;
	seconds += minutes * 60;
	if (segments.length == 3) {
		// hours are also present
		hours = parseFloat(segments[segments.length-3]);
		seconds += hours * 3600;
	}
	milli = milliseconds(seconds);
	return parseInt(milli);
}
function runBatchAsync (db, statements) {
    var results = [];
    var batch = ['BEGIN', ...statements, 'COMMIT'];
    return batch.reduce((chain, statement) => 
    	chain.then(result => {
        	results.push(result);
        	return db.runAsync(...[].concat(statement));
   		}), Promise.resolve())
    	.catch(err => db.runAsync('ROLLBACK').then(() => Promise.reject(err +
        	' in statement #' + results.length)))
    	.then(() => results.slice(2));
}
async function logFileAsync(db,stream,success,filename,identifier,mess,e,next) {
	if (db != null) {
		if (success == true) {
			await db.runAsync('COMMIT');
		} else {
			await db.runAsync("ROLLBACK");
		}
	}
	if (stream != null) stream.close();
	var errorData = {
		success: success,
		filename: filename,
		size: identifier,
		message: mess,
		error: e
	};
	errorData.error = null;
	next(errorData);
}
async function logFileSingle(db,stream,success,filename,mess,res) {
	if (db != null) {
		if (success == true) {
			await db.runAsync('COMMIT');
		} else {
			await db.runAsync("ROLLBACK");
		}
	}
	if (stream != null) stream.close();
	var status = (success == true) ? 200 : 400;
	var errorData = {
		success: success,
		filename: filename,
		message: mess
	};
	res.status(status).json(errorData);
}

async function initializeMediaQueries(db,f,metadata,stream,tmpFile,next) {

	var newPath, newPathDirectory, err;
	var thisMetadata = metadata;

	// Begin insertion into database

	// Firstly, begin the sql commit
	await db.runAsync('BEGIN');
	
	// Secondly, insert into the music table, then get the ID of the last insert and then update the URL
	try {
		var musicID = await db.runAsync("INSERT INTO music (extension, title, artist, composer, lyrics, comment, duration, medium, start_padding, end_padding, url) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", [metadata.extension, metadata.title, metadata.artist, metadata.composer, metadata.lyrics, metadata.comment, metadata.duration, metadata.medium, metadata.startpadding, metadata.endpadding, metadata.url]);
		thisMetadata.id = musicID;
		newPath = 'media/'+thisMetadata.id+'.'+thisMetadata.extension
		newPathDirectory = path.resolve(__dirname, "../public/"+newPath);
		await db.runAsync("UPDATE music SET url = ? WHERE id = ?", [newPath,thisMetadata.id]);
	} catch(e) {
		logFileAsync(db,stream,false,f.name,f.size,"Error with entering data into MUSIC table",e,next);
	}

	// Thirdly, try to insert into Art table if we extracted art metadata, if it already exists only insert into relationship table, otherwise insert into both tables
	thisMetadata.artId = -1;
	if (thisMetadata.art != null) {
		try {
			var possibleMusicID = await db.getAsync("SELECT id FROM art WHERE src = ?", [thisMetadata.art]);
			if (!possibleMusicID) {
				// No row exists that matches this source, must populate Art table
				var newMusicID = await db.runAsync("INSERT INTO art (src) VALUES (?)",[thisMetadata.art]);
				thisMetadata.artId = newMusicID;
			} else {
				thisMetadata.artId = possibleMusicID.id;
			}
		} catch(e) {
			logFileAsync(db,stream,false,f.name,f.size,"Error with entering data into ART table",e,next);
		}
	}
	try {
		await db.runAsync("INSERT INTO songToart (song_id, art_id) VALUES (?, ?)",[thisMetadata.id, thisMetadata.artId]);
	} catch(e) {
		logFileAsync(db,stream,false,f.name,f.size,'Could not insert into "songToArt" table',e,next);
	}

	// Fourthly, try to insert into Album Artist table, if it already exists only insert into relationship table, otherwise insert into both tables
	try {
		var possibleAlbumArtistRow = await db.getAsync("SELECT id FROM album_artists WHERE name = ?", [thisMetadata.albumartist]);
		if (!possibleAlbumArtistRow) {
			// Album Artist doesn't exist, need to create new row
			var newAlbumArtistID = await db.runAsync('INSERT INTO album_artists (name) VALUES ( ? )', [thisMetadata.albumartist]);
			thisMetadata.albumartistid = newAlbumArtistID;
		} else {
			thisMetadata.albumartistid = possibleAlbumArtistRow.id;
		}
	} catch(e) {
		logFileAsync(db,stream,false,f.name,f.size,'Error inserting into "album_artists" table',e,next);
	}

	// Fifthly, try to insert into Album Artist table, if it already exists only insert into relationship table, otherwise insert into both tables
	try {
		var possibleAlbumRow = await db.getAsync('SELECT id FROM albums WHERE name = ?', [thisMetadata.album]);
		if (!possibleAlbumRow) {
			// Album doesn't exist, need to create new row
			var newAlbumID = await db.runAsync('INSERT INTO albums (name) VALUES ( ? )', [thisMetadata.album]);
			thisMetadata.albumid = newAlbumID;
		} else {
			thisMetadata.albumid = possibleAlbumRow.id;
		}
	} catch(e) {
		logFileAsync(db,stream,false,f.name,f.size,'Error inserting into "albums" table',e,next);
	}

	//Sixthly, getting old album_artist record, replacing old album_artist_id with new one IF the relationship doesn't exist already
	var possibleRel;
	try {
		possibleRel = await db.getAsync('SELECT * FROM albumToalbum_artist WHERE album_id = ? AND album_artist_id = ?', [thisMetadata.albumid, thisMetadata.albumartistid]);
		if (!possibleRel) {
			await db.runAsync('INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES ( ?, ?)', [thisMetadata.albumid, thisMetadata.albumartistid]);
		}
	} catch(e) {
		logFileAsync(db,stream,false,f.name,f.size,'Error inserting into the "albumToalbum_artist" table',e,next);
	}
	
	// Seventhly, do the same with song - album
	try {
		possibleRel = await db.getAsync('SELECT * FROM songToalbum WHERE song_id = ? AND album_id = ?', [thisMetadata.id, thisMetadata.albumid]);
		if (!possibleRel) {
			await db.runAsync('INSERT INTO songToalbum (song_id, album_id) VALUES ( ?, ? )', [thisMetadata.id, thisMetadata.albumid]);
		}
	} catch(e) {
		logFileAsync(db,stream,false,f.name,f.size,'Error inserting into "songToalbum" table',e,next);
	}

	// Finally, move the file into the proper directory and close the stream
	fs.readFile(tmpFile, function (errRead, dataRead) {
		if (errRead) 
			logFileAsync(db,stream,false,f.name,f.size,'Error reading file data for movement into directory',errRead,next);
		else {
			fs.writeFile(newPathDirectory, dataRead, function (errUp) {
				if (errUp) {
					logFileAsync(db,stream,false,f.name,f.size,'Error copying file data into directory',errUp,next);
				}
				else {
					logFileAsync(db,stream,true,f.name,f.size,'Success!',null,next);
				}
			});
		}
	});
}
async function initializeMediaQuery(d,f,m,stream,tmpFile,res) {
	var db = d,
		metadata = m;
	var newPath, newPathDirectory;
	// Begin insertion into database
				
	// Firstly, begin the sql commit
	await db.runAsync('BEGIN');
	
	// Secondly, insert into the music table, then get the ID of the last insert and then update the URL
	try {
		var musicID = await db.runAsync("INSERT INTO music (extension, title, artist, composer, lyrics, comment, duration, medium, start_padding, end_padding, url) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", [metadata.extension, metadata.title, metadata.artist, metadata.composer, metadata.lyrics, metadata.comment, metadata.duration, metadata.medium, metadata.startpadding, metadata.endpadding, metadata.url]);
		metadata.id = musicID;
		newPath = 'media/'+metadata.id+'.'+metadata.extension
		newPathDirectory = path.resolve(__dirname, "../public/"+newPath);
		await db.runAsync("UPDATE music SET url = ? WHERE id = ?", [newPath, metadata.id]);
	} catch(e) {
		logFileSingle(db,stream,false,f.name,"Error with entering data into MUSIC table",res);
	}
	
	// Thirdly, try to insert into Art table if we extracted art metadata, if it already exists only insert into relationship table, otherwise insert into both tables
	metadata.artId = -1;
	if (metadata.art != null) {
		try {
			var possibleMusicID = await db.getAsync("SELECT id FROM art WHERE src = ?", [metadata.art]);
			if (!possibleMusicID) {
				// No row exists that matches this source, must populate Art table
				var newMusicID = await db.runAsync("INSERT INTO art (src) VALUES (?)",[metadata.art]);
				metadata.artId = newMusicID;
			} else {
				metadata.artId = possibleMusicID.id;
			}
		} catch(e) {
			logFileSingle(db,stream,false,f.name,"Error with entering data into ART table",res);
		}
	}
	try {
		await db.runAsync("INSERT INTO songToart (song_id, art_id) VALUES (?, ?)",[metadata.id, metadata.artId]);
	} catch(e) {
		logFileSingle(db,stream,false,f.name,'Could not insert into "songToArt" table',res);
	}

	// Fourthly, try to insert into Album Artist table, if it already exists only insert into relationship table, otherwise insert into both tables
	try {
		var possibleAlbumArtistRow = await db.getAsync("SELECT id FROM album_artists WHERE name = ?", [metadata.albumartist]);
		if (!possibleAlbumArtistRow) {
			// Album Artist doesn't exist, need to create new row
			var newAlbumArtistID = await db.runAsync('INSERT INTO album_artists (name) VALUES ( ? )', [metadata.albumartist]);
			metadata.albumartistid = newAlbumArtistID;
		} else {
			metadata.albumartistid = possibleAlbumArtistRow.id;
		}
	} catch(e) {
		logFileSingle(db,stream,false,f.name,'Error inserting into "album_artists" table',res);
	}

	// Fifthly, try to insert into Album Artist table, if it already exists only insert into relationship table, otherwise insert into both tables
	try {
		var possibleAlbumRow = await db.getAsync('SELECT id FROM albums WHERE name = ?', [metadata.album]);
		if (!possibleAlbumRow) {
			// Album doesn't exist, need to create new row
			var newAlbumID = await db.runAsync('INSERT INTO albums (name) VALUES ( ? )', [metadata.album]);
			metadata.albumid = newAlbumID;
		} else {
			metadata.albumid = possibleAlbumRow.id;
		}
	} catch(e) {
		logFileSingle(db,stream,false,f.name,'Error inserting into "albums" table',res);
	}

	//Sixthly, getting old album_artist record, replacing old album_artist_id with new one IF the relationship doesn't exist already
	var possibleRel;
	try {
		possibleRel = await db.getAsync('SELECT * FROM albumToalbum_artist WHERE album_id = ? AND album_artist_id = ?', [metadata.albumid, metadata.albumartistid]);
		if (!possibleRel) {
			await db.runAsync('INSERT INTO albumToalbum_artist (album_id, album_artist_id) VALUES ( ?, ?)', [metadata.albumid, metadata.albumartistid]);
		}
	} catch(e) {
		logFileSingle(db,stream,false,f.name,'Error inserting into the "albumToalbum_artist" table',res);
	}
	
	// Seventhly, do the same with song - album
	try {
		possibleRel = await db.getAsync('SELECT * FROM songToalbum WHERE song_id = ? AND album_id = ?', [metadata.id, metadata.albumid]);
		if (!possibleRel) {
			await db.runAsync('INSERT INTO songToalbum (song_id, album_id) VALUES ( ?, ? )', [metadata.id, metadata.albumid]);
		}
	} catch(e) {
		logFileSingle(db,stream,false,f.name,'Error inserting into "songToalbum" table',res);
	}

	// Finally, move the file into the proper directory and close the stream
	fs.readFile(tmpFile, function (errRead, dataRead) {
		if (errRead) 
			logFileSingle(db,stream,false,f.name,'Error reading file data for movement into directory',res);
		else {
			fs.writeFile(newPathDirectory, dataRead, function (errUp) {
				if (errUp) {
					logFileSingle(db,stream,false,f.name,'Error copying file data into directory',res);
				}
				else {
					logFileSingle(db,stream,true,f.name,'Success!',res);
				}
			});
		}
	});
}

var router = express.Router();

/* GET default index page */
router.get('/', function(req, res) {
	res.render('index', {
		title : "SMP"
	});
});

/* GET initialize player */
router.get('/initialize', (req,res)=>{
	var db = req.db;
	var query = `SELECT 
		T1.id AS id, 
		T1.title AS title,
		T1.artist AS artist,
		T1.composer as composer,
		T1.url AS url,
		T1.type AS type,
		T1.extension AS extension,
		T1.lyrics as lyrics,
		T1.dynamic_lyrics AS d_lyrics,
		T1.dynamic_lyrics_toggle AS d_lyrics_toggle,
		T1.comment AS comment,
		T1.duration AS duration,
		T1.start_padding AS s_padding,
		T1.end_padding AS e_padding,
		T1.medium AS medium,
		T3.src AS song_art,
		T3.id AS song_art_id,
		T5.name AS album_name,
		T5.id AS album_id,
		T7.name AS album_artist_name,
		T7.id AS album_artist_id
		FROM music AS T1 
		LEFT JOIN songToart AS T2 ON T1.id = T2.song_id
		LEFT JOIN art AS T3 ON T2.art_id = T3.id
		LEFT JOIN songToalbum AS T4 ON T1.id = T4.song_id
		LEFT JOIN albums AS T5 ON T4.album_id = T5.id
		LEFT JOIN albumToalbum_artist AS T6 ON T5.id = T6.album_id
		LEFT JOIN album_artists AS T7 ON T6.album_artist_id = T7.id
		WHERE medium = 0
		ORDER BY T1.id`;
	db.all(query, [], (err, rows) => {
		res.json(rows);
	});
});

/* GET settings from JSON */
router.get('/settings', (req,res)=>{
	var sets = fs.readFileSync(path.resolve(__dirname,"../data/settings.json"));
	res.json(JSON.parse(sets));
});

router.post('/setsave', (req,res)=>{
	var newSettings = req.body;
	var newQueue = req.body['current_queue'].split(',');
	newSettings['current_queue'] = newQueue.map(id=>{return parseInt(id);});
	console.log(newSettings);
	var tmpDataPath = path.resolve(__dirname, "../data/settings.json");
	fs.writeFile(tmpDataPath, JSON.stringify(newSettings),function(err){
		if (err)
			res.json({success:false,message:'Error involving writing to file',error:err})
		else {
			res.json({success:true});
		}
	})
});

router.post('/uploadFile', (req,res)=>{
	var file = req.files.upload,
		db = req.db,
		newPath = file.name,
		newPathDirectory = path.resolve(__dirname, "../public/uploads/"+newPath),
		metadata = {
			"id":-1,
			"title":"Untitled",
			"artist":"Unknown Artist",
			"art":'assets/default_album_art.jpg',
			"extension":"mp3",
			"albumartist":"No Album Artist",
			"album": "Unknown Album",
			"duration":null,
			"composer":"Unknown Composer",
			"lyrics":null,
			"comment":null,
			"medium": 0,
			"startpadding" : 0,
			"endpadding": 0,
			"url": ""
		};
	
	if (mimeTypes.indexOf(file.mimetype) == -1) {
		logFileSingle(null,null,false,file.name,'File MimeType is not mp3 or m4a',res);
	} else {
		var readableStream = fs.createReadStream(file.tempFilePath);
		var parser = mm(readableStream, {duration:true}, function (errParse, parsed) {
			if (errParse) {
				logFileSingle(null,readableStream,false,file.name,"Could not read metadata prior to beginning file upload",res);
			}
			else {
				console.log(parsed);
				metadata.title = (parsed.title) 
					? (parsed.title.length > 0) 
						? (isArray(parsed.title))
							? parsed.title[0]
							: parsed.title
						: file.name
					: file.name
				metadata.title = entities.decode(metadata.title.trim());

				metadata.artist = (parsed.artist) 
					? (parsed.artist.length > 0)
						? (isArray(parsed.artist)) 
							? parsed.artist[0]
							: parsed.artist 
						: 'Unknown Artist'
					: 'Unknown Artist';
				metadata.artist = entities.decode(metadata.artist.trim());

				if (parsed.picture && parsed.picture.length > 0) {	
					metadata.art = (isArray(parsed.picture)) 
						? 'data:image/'+parsed.picture[0]['format']+';charset=utf-8;base64,'+parsed.picture[0]['data'].toString('base64') 
						: 'data:image/'+parsed.picture.format+';charset=utf-8;base64,'+parsed.picture.data.toString('base64');
				}
	
				metadata.albumartist = (parsed.albumartist)
					? (parsed.albumartist.length > 0) 
						? (isArray(parsed.albumartist))
							? parsed.albumartist[0]
							: parsed.albumartist
						: 'No Album Artist'
					: 'No Album Artist';
				metadata.albumartist = entities.decode(metadata.albumartist.trim());

				metadata.album = (parsed.album)
					? (parsed.album.length > 0)
						? (isArray(parsed.album)) 
							? parsed.album[0]
							: parsed.album
						: 'Unknown Album'
					: 'Unknown Album'
				metadata.album = entities.decode(metadata.album.trim());

				metadata.duration = (parsed.duration)
					? readableDuration(parseFloat(parsed.duration)*1000, false)
					: null;
				metadata.endpadding = millisecondDuration(metadata.duration);

				metadata.extension = path.extname(file.name);
				metadata.extension = metadata.extension.substr(1,metadata.extension.length);

				metadata.url = 'temp';

				initializeMediaQuery(db,file,metadata,readableStream,file.tempFilePath,res);
			}
		});
	}
})

router.post('/uploadFiles', (req,res)=>{
	var files = req.files.uploads;
	if (!isArray(files)) {
		files = [files];
	}
	var db = req.db;
	db.getAsync = function (sql, params = []) {
		var that = this;
		return new Promise(function (resolve, reject) {
			that.get(sql, params, function (err, row) {
				if (err)
					reject(err);
				else
					resolve(row);
			});
		});
	};
	db.runAsync = function (sql, params = []) {
		var that = this;
		return new Promise(function (resolve, reject) {
			that.run(sql, params, function(err) {
				if (err)
					reject(err);
				else
					resolve(this.lastID);
			});
		})
	};
	var successes = [];
	var failures = [];

	var promises = Promise.all(files.map(f=>{
		return new Promise((resolve,reject)=>{
			var newPath = f.name
			var newPathDirectory = path.resolve(__dirname, "../public/uploads/"+newPath);
			var metadata = {
				"id":-1,
				"title":"Untitled",
				"artist":"Unknown Artist",
				"art":'assets/default_album_art.jpg',
				"extension":"mp3",
				"albumartist":"No Album Artist",
				"album": "Unknown Album",
				"duration":null,
				"composer":"Unknown Composer",
				"lyrics":null,
				"comment":null,
				"medium": 0,
				"startpadding" : 0,
				"endpadding": 0,
				"url": ""
			};
			
			var query, stmt, params, grabIdQuery;

			if (mimeTypes.indexOf(f.mimetype) == -1) {
				logFileAsync(null,null,false,f.name,f.size,'File MimeType is not mp3 or m4a',new Error('Filetype is not mp3 or m4a'),resolve);
			} else {
				var readableStream = fs.createReadStream(f.tempFilePath)
				var parser = mm(readableStream, {duration:true}, function (errParse, parsed) {
					if (errParse) {
						logFileAsync(null,readableStream,false,f.name,f.size,"Could not read metadata prior to beginning file upload",errParse,resolve)
					}
					else {
						metadata.title = (parsed.title) 
							? (isArray(parsed.title)) 
								? parsed.title[0]
								: parsed.title
							: f.name;
						metadata.title = entities.decode(metadata.title.trim());

						metadata.artist = (parsed.artist) 
							? (isArray(parsed.artist)) 
								? parsed.artist[0]
								: parsed.artist 
							: 'Unknown Artist';
						metadata.artist = entities.decode(metadata.artist.trim());

						if (parsed.picture) {
							metadata.art = (isArray(parsed.picture)) 
								? 'data:image/'+parsed.picture[0]['format']+';charset=utf-8;base64,'+parsed.picture[0]['data'].toString('base64') 
								: 'data:image/'+parsed.picture.format+';charset=utf-8;base64,'+parsed.picture.data.toString('base64');
						}

						metadata.albumartist = (parsed.albumartist)
							? (isArray(parsed.albumartist))
								? parsed.albumartist[0]
								: parsed.albumartist
							: 'No Album Artist';
						metadata.albumartist = entities.decode(metadata.albumartist.trim());

						metadata.album = (parsed.album)
							? (isArray(parsed.album)) 
								? parsed.album[0]
								: parsed.album
							: 'Unknown Album'
						metadata.album = entities.decode(metadata.album.trim());

						metadata.duration = (parsed.duration)
							? readableDuration(parseFloat(parsed.duration)*1000, false)
							: null;
						metadata.endpadding = millisecondDuration(metadata.duration);

						metadata.extension = path.extname(f.name);
						metadata.extension = metadata.extension.substr(1,metadata.extension.length);

						metadata.url = 'temp';

						initializeMediaQueries(db,f,metadata,readableStream,f.tempFilePath,resolve);
					}
				});
			}
		})
	}));
	promises.then((fRes)=>{
		var returnData = fRes.reduce((filtered,f)=>{
			if (f.success == true) {
				filtered.successes.push(f);
			} else {
				filtered.failures.push(f);
			}
			return filtered;
		},{successes:[],failures:[]});
		if (returnData.failures.length > 0) {
			res.status(400)
		} else {
			res.status(200)
		};
		console.log(returnData);
		res.json(returnData);
	});

})

module.exports = router;