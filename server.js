const express = require('express');
const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const path = require('path');

const app = express();

// Make our db accessible to our router
app.use(function(req,res,next){
	const db = new sqlite3.Database('./data/database.sqlite', sqlite3.OPEN_READWRITE);
    req.db = db;
    next();
});
const indexRouter = require('./routes/index');

app.set('view engine','pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use('/',indexRouter);

// Setting up the server to port 7000
const server = app.listen(7000,()=>{
	console.log(`Express running => PORT ${server.address().port}`);
});

module.exports = app;
