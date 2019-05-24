const express = require('express');
const path = require('path');

const app = express();
const indexRouter = require('./routes/index');

app.set('view engine','pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(__dirname + '/public'));
app.use('/',indexRouter);

// Setting up the server to port 7000
const server = app.listen(7000,()=>{
	console.log(`Express running => PORT ${server.address().port}`);
});

module.exports = app;
