const express = require('express');
const fs = require('fs');
const path = require('path');

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
		ORDER BY T1.id`;
	db.all(query, [], (err, rows) => {
		var toReturn = rows.reduce((filtered,row)=>{
			filtered[row.album_artist_id] = filtered[row.album_artist_id] || {
				id : row.album_artist_id,
				name : row.album_artist_name,
				albums : {}
			}
			filtered[row.album_artist_id]['albums'][row.album_id] = filtered[row.album_artist_id]['albums'][row.album_id] || {
				id : row.album_id,
				name : row.album_name,
				songs : []
			}
			filtered[row.album_artist_id]['albums'][row.album_id]['songs'].push(row);

			function compare(a,b) {
				if ( a.title < b.title ){
					return -1;
				}
				if ( a.title > b.title ){
					return 1;
				}
				return 0;
			}

			filtered[row.album_artist_id]['albums'][row.album_id]['songs'].sort(compare);
			return filtered;
		},{});
		res.json(toReturn);
	});
});

/* GET settings from JSON */
router.get('/settings', (req,res)=>{
	var sets = fs.readFileSync(path.resolve(__dirname,"../data/settings.json"));
	res.send(sets);
});

module.exports = router;