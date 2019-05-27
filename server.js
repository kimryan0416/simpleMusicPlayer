const express = require('express');
const fileUpload = require('express-fileupload');
const sqlite3 = require('sqlite3').verbose();

const path = require('path');

const app = express();

// Make our db accessible to our router
app.use(function(req,res,next){
	const db = new sqlite3.Database('./data/database.sqlite', sqlite3.OPEN_READWRITE);
    req.db = db;
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
    next();
});
const indexRouter = require('./routes/index');

app.set('view engine','pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload({
	createParentPath: true,
	limits: { fileSize: 50 * 1024 * 1024 },
	useTempFiles : true,
    tempFileDir : path.resolve(__dirname,'/tmp/')
}));
app.use('/',indexRouter);

// Setting up the server to port 7000
const server = app.listen(7000,()=>{
	console.log(`Express running => PORT ${server.address().port}`);
});

module.exports = app;
