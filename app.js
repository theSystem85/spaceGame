var express = require('express');
var app = express();
var WebSocketServer = require('ws').Server;
var server = require('http').createServer();
var wss = new WebSocketServer({ server: server });
var port = 3001;
var game = {};

app.use('/', express.static('public'));
/*
app.use(function (req, res) {
    res.send({msg: 'express server running'});
});*/
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        client.send(data);
    });
};

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(jsonData) {
        var data = JSON.parse(jsonData);
        var res = {response: data.request, keyCode: data.keyCode};
        //ws.send(JSON.stringify(res));
        wss.broadcast(JSON.stringify(res));
    });
});

server.on('request', app);
server.listen(port, function(){
    console.log('Listening on port ' + port);
});