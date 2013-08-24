var express = require('express')
  , http = require('http')


var port = process.env.PORT || 5000;

var app = express();
var server = app.listen(port, function() {
  console.log("Listening on 127.0.0.1:"+port+" (localhost doesn't work...)");
});
var io = require('socket.io').listen(server);

io.configure('production', function() {
  console.log("Configuring Socket.IO for production");
  // websocket doesn't work on heroku...
  io.set('transports', [/*'websocket'*/, 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
});
io.configure('development', function() {
  console.log("Configuring Socket.IO for development");
  io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
});

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});


var userIdCounter = 1;
var connectedUsers = 0;
var latestMessages = [];
var latestMessagesLimit = 5;

io.sockets.on('connection', function (socket) {
  console.log("Someone connected");
  connectedUsers++;
  socket.emit('hello', {
    nick: "Anonymous-"+userIdCounter++,
    messages: latestMessages
  });

  sendStatusUpdate();

  socket.on('message', function (message) {
    console.log(message);
    latestMessages.push(message);
    if (latestMessages.length > latestMessagesLimit)
      latestMessages = latestMessages.slice(latestMessages.length - latestMessagesLimit);
    io.sockets.emit('chat', message);
  });
});

io.sockets.on('disconnect', function () {
  console.log("Someone disconnected");
  connectedUsers--;
  sendStatusUpdate();
});

function sendStatusUpdate() {
  io.sockets.emit('update', {
    connectedUsers: connectedUsers
  });
};
