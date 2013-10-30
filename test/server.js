
var express = require('express');
var fs = require('fs');
var hbs = require('hbs');
var path = require('path');


/**
 * App.
 */

var app = express()
  .use(express.static(__dirname + '/..'))
  .set('views', __dirname)
  .engine('html', hbs.__express)
  .get('*', function (req, res, next) {
    res.render('index.html');
  })
  .listen(4200, function () {
    fs.writeFileSync(__dirname + '/pid.txt', process.pid, 'utf-8');
    console.log('Started testing server on port 4200...');
  });