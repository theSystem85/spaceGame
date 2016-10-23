var express = require('express');
var requirejs = require('requirejs');
//var Vector2D = require('./vector');
//var SpaceShip = require('./spaceShip');
requirejs.config({
    baseUrl: __dirname + '/public/scripts',
    nodeRequire: require
});

requirejs(['./game'], function(Game){

    var app = express();
    var WebSocketServer = require('ws').Server;
    var server = require('http').createServer();
    var wss = new WebSocketServer({ server: server });
    var port = 3001;
    var syncInterval = 1000; //in ms
    var game = new Game();

    // --------------------------------------
    // ------------ Routing -----------------
    // --------------------------------------

    app.use('/', express.static('public'));
    /*
    app.use(function (req, res) {
        res.send({msg: 'express server running'});
    });*/

    // --------------------------------------
    // ---------- Event handling ------------
    // --------------------------------------

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
            handleKeyEvent(data.request, data.keyCode);
        });
    });

    server.on('request', app);
    server.listen(port, function(){
        console.log('Listening on port ' + port);
    });

    // --------------------------------------
    // ------------ Game Loop ---------------
    // --------------------------------------

    function step(){
        game.step();
    }
    setInterval(step, game.refreshRate);

    function sync(){
        var gameState = {
            ship1: game.ship1,
            ship2: game.ship2,
        }
        var res = {response: 'sync', gameState: gameState};
        wss.broadcast(JSON.stringify(res));
    }
    setInterval(sync, syncInterval);

    // --------------------------------------
    // ----------- Game Control -------------
    // --------------------------------------

    var keyDownMap = [];
    keyDownMap[37] = game.ship2.turnLeft.bind(game.ship2); //arrow left
    keyDownMap[39] = game.ship2.turnRight.bind(game.ship2); //arrow right
    keyDownMap[38] = game.ship2.accelerate.bind(game.ship2); //arrow up
    keyDownMap[40] = game.ship2.break.bind(game.ship2); //arrow down
    keyDownMap[16] = game.ship2.giveFire.bind(game.ship2); //dash key
    keyDownMap[65] = game.ship1.turnLeft.bind(game.ship1); //a key
    keyDownMap[68] = game.ship1.turnRight.bind(game.ship1); //d key
    keyDownMap[87] = game.ship1.accelerate.bind(game.ship1); //w key
    keyDownMap[83] = game.ship1.break.bind(game.ship1); //s key
    keyDownMap[69] = game.ship1.giveFire.bind(game.ship1); //e key

    var keyUpMap = [];
    keyUpMap[37] = game.ship2.stopTurning.bind(game.ship2); //arrow left
    keyUpMap[39] = game.ship2.stopTurning.bind(game.ship2); //arrow left
    keyUpMap[38] = game.ship2.engineShutDown.bind(game.ship2); //arrow up
    keyUpMap[40] = game.ship2.engineShutDown.bind(game.ship2); //arrow down
    keyUpMap[65] = game.ship1.stopTurning.bind(game.ship1); //a key
    keyUpMap[68] = game.ship1.stopTurning.bind(game.ship1); //d key
    keyUpMap[87] = game.ship1.engineShutDown.bind(game.ship1); //w key
    keyUpMap[83] = game.ship1.engineShutDown.bind(game.ship1); //s key

    function handleKeyEvent(response, keyCode){
        if(response == 'keyUp'){
            keyUpMap[keyCode](); //run action
        } else if(response == 'keyDown'){
            keyDownMap[keyCode](); //run action
        }
    }
});