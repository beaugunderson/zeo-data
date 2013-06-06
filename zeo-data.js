var archiver = require('archiver');
var consolidate = require('consolidate');
var express = require('express');
var fs = require('fs');
var http = require('http');
var IO = require('socket.io');
var sprintf = require('sprintf').sprintf;
var swig = require('swig');
var zeo = require('/root/zeo-connector/connector.js');

swig.init({
  root: __dirname + '/views',
  allowErrors: true,
  cache: false
});

var hostBaseUrl = (process.env.HOST || 'http://localhost:' + process.env.PORT);
var apiBaseUrl = process.env.API_HOST || 'https://api.singly.com';

// Pick a secret to secure your session storage
var sessionSecret = '42';

var connections = {};

// Create an HTTP server
var app = express();

// Setup for the express web framework
app.engine('html', consolidate.swig);

app.set('view engine', 'html');
app.set('view options', { layout: false });

/*
app.set('views', __dirname + '/views');
app.set('view cache', false);
*/

app.use(express.logger());

app.use(express.static(__dirname + '/public'));

app.use(express.bodyParser());
app.use(express.cookieParser());

app.use(express.session({
  secret: sessionSecret
}));

// Provide an update function for socket.io
app.use(function (req, res, next) {
  req.update = function (update) {
    if (!connections[req.session.auth.token]) {
      return console.error('No connection found for', req.session.auth.token);
    }

    connections[req.session.auth.token].emit('status', update);
  };

  next();
});

app.use(function (req, res, next) {
  res.locals.authenticated = !!req.session.auth;

  if (res.locals.authenticated) {
    res.locals.userId = req.session.auth.token;
  }

  next();
});

// We want exceptions and stracktraces in development
app.configure('development', function () {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

app.use(app.router);

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/archive/zeo/download', function (req, res) {
  if (!res.locals.authenticated) {
    return res.send(500);
  }

  res.download('./out/' + res.locals.userId + '.zip');
});

app.get('/archive/zeo', function (req, res) {
  if (!req.session.auth) {
    return res.redirect('/');
  }

  var connector = new zeo.Connector(req.session.auth);

  var output = fs.createWriteStream('./out/' + res.locals.userId + '.zip');
  var archive = archiver('zip');

  archive.pipe(output);

  connector.on('data', function (err, endpoint, data) {
    req.update('Received data for ' + endpoint + '...');

    data = JSON.stringify(data.data, null, 2);

    archive.append(data, { name: endpoint + '.json' });
  });

  connector.on('done', function () {
    archive.finalize();

    req.update('Finished receiving data, <a href="/archive/zeo/download">' +
      'please down your archive here</a>.');
  });

  connector.archive();

  res.render('archive');
});

app.get('/auth/zeo*', function (req, res) {
  zeo.auth.handler('http://beaugunderson.com:14000/auth/zeo/callback',
    require('./credentials.json'),
    function (err, data) {
      req.session.auth = data;

      res.redirect('/archive/zeo');
    },
    req,
    res);
});

var server = http.createServer(app);
var io = IO.listen(server);

server.listen(process.env.PORT);

io.sockets.on('connection', function (socket) {
  socket.on('userId', function (userId) {
    console.log('Got userId message with', userId);

    connections[userId] = socket;
  });
});

console.log(sprintf('Listening at %s using API endpoint %s.', hostBaseUrl,
  apiBaseUrl));
