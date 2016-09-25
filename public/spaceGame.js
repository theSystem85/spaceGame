var SERVER_WS_URL = 'ws://localhost:3001';//'ws://patrick-beyer-software.de:3001';
var server = new WebSocket(SERVER_WS_URL);

//global definitions
var TO_RADIANS = Math.PI/180;
var refreshRate = 33; //in milliseconds
var globalWidth = 1000;
var globalHeight = 800;
var winScore = 5;
var audioExplosion = new Audio('resources/explosion01.m4a');
var audioShot = new Audio('resources/shoot01.m4a');
audioExplosion.playbackRate = 2.0;

var ship1 = new SpaceShip(10,10,30,40,180, 'player1', 'bgbattleship');
var ship2 = new SpaceShip(960,750,30,40,0, 'player2', 'bgspeedship');

//provide draw context as a singleton
var Context2D = (function(){
    var instance;
    function createInstance(){
        var cvs = document.getElementById("myCanvas");
        var context = cvs.getContext("2d");
        return context;
    }

    return {
        getInstance: function(){
            if(!instance){
                return createInstance()
            } else {
                return instance;
            }
        }
    }
})();

function Vector2D(x,y) {
    this.x = x;
    this.y = y;
}

Vector2D.prototype.add = function (vector) {
    if(typeof vector !== 'number'){
        this.x += vector.x;
        this.y += vector.y;
    }
    else {
        this.x += vector;
        this.y += vector;
    }
    return this;
};

Vector2D.prototype.mul = function (vector) {
    if(typeof vector !== 'number'){
        this.x *= vector.x;
        this.y *= vector.y;
    }
    else {
        this.x *= vector;
        this.y *= vector;
    }
    return this;
};

Vector2D.prototype.sub = function (vector) {
    if(typeof vector !== 'number'){
        this.x -= vector.x;
        this.y -= vector.y;
    }
    else {
        this.x -= vector;
        this.y -= vector;
    }
    return this;
};

Vector2D.prototype.div = function (vector) {
    if(typeof vector !== 'number'){
        this.x /= vector.x;
        this.y /= vector.y;
    }
    else {
        this.x /= vector;
        this.y /= vector;
    }
    return this;
};

Vector2D.prototype.getLength = function () {
    return Math.sqrt(this.x*this.x+this.y*this.y);
};

Vector2D.prototype.getNorm = function () {
    var length = this.getLength();
    return new Vector2D(this.x, this.y).div(length);
};

function Shot(x, y, width, height, rotation){
    this.position = new Vector2D(x,y);
    this.speed = new Vector2D(0,0);
    this.maxSpeed = 10;
    this.width = width;
    this.height = height;
    this.rotation = rotation;
    this.active = false;
}

Shot.prototype.step = function () {
    this.position.add(this.speed);
}

Shot.prototype.middle = function () {
    return new Vector2D(this.position.x+this.width/2, this.position.y+this.height/2);
};

function SpaceShip(x, y, width, height, rotation, playerName, imageName) {
    this.position = new Vector2D(x,y);
    this.speed = new Vector2D(0,0);
    this.width = width;
    this.height = height;
    this.acceleration = 0.2;
    this.rotation = rotation; //in degrees
    this.alive = true; //when alive => show ship else => show explosion
    this.maxSpeed = 3;
    this.moveable = true;
    this.shot = new Shot(-32,-32,16,16,0);
    this.score = 0;
    this.playerName = playerName;
    this.imageName = imageName;
    this.animation = new ScaleAnimation(200, 211, 300, 100);
    this.turnRate = 5; //in degrees per frame
    this.currentTurnRate = 0;
    this.currentAcceleration = 0;
}

SpaceShip.prototype.middle = function () {
    return new Vector2D(this.position.x+this.width/2, this.position.y+this.height/2);
};

SpaceShip.prototype.turnLeft = function () {
    this.currentTurnRate = -5;
};

SpaceShip.prototype.turnRight = function () {
    this.currentTurnRate = 5;
};

SpaceShip.prototype.stopTurning = function () {
    this.currentTurnRate = 0;
};

SpaceShip.prototype.accelerate = function () {
    this.currentAcceleration = -this.acceleration;
};

SpaceShip.prototype.break = function () {
    this.currentAcceleration = this.acceleration;   
};

SpaceShip.prototype.engineShutDown = function () {
    this.currentAcceleration = 0;   
};

SpaceShip.prototype.step = function () {
    this.limitSpeed();
    this.position.add(this.speed);
    this.bumpCheck();
    this.shot.step();
    this.rotation = (this.rotation + this.currentTurnRate)%360;

    if (this.moveable){
        var x = Math.cos(TO_RADIANS*(this.rotation+90))*this.acceleration;
        var y = Math.sin(TO_RADIANS*(this.rotation+90))*this.acceleration;
        this.speed.add(new Vector2D(x, y).mul(this.currentAcceleration));
    }
};

SpaceShip.prototype.limitSpeed = function () {
    var s = this.speed.getLength();
    if (s > this.maxSpeed) {
        var norm = this.speed.getNorm();
        this.speed = norm.mul(this.maxSpeed);
    }
};

SpaceShip.prototype.recover = function () {
    this.moveable = false;
    setTimeout((function(){
        this.moveable = true;
    }).bind(this),1000);
}

SpaceShip.prototype.bumpCheck = function () {
    if ( (this.position.x+this.width) > globalWidth){
        this.speed.mul(new Vector2D(-1,1));
        this.recover();
    }
    if ( (this.position.y+this.height) > globalHeight){
        this.speed.mul(new Vector2D(1,-1));
        this.recover();
    }
    if ( (this.position.x) < 0){
        this.speed.mul(new Vector2D(-1,1));
        this.recover();
    }
    if ( (this.position.y) < 0){
        this.speed.mul(new Vector2D(1,-1));
        this.recover();
    }
}

SpaceShip.prototype.giveFire = function () {
    if(this.alive){
        this.shot.position = this.middle();
        this.shot.speed = new Vector2D(Math.cos(TO_RADIANS*(this.rotation+270))*this.shot.maxSpeed, Math.sin(TO_RADIANS*(this.rotation+270))*this.shot.maxSpeed);
        this.shot.active = true;
        this.shot.rotation = this.rotation;
        audioShot.pause();
        audioShot.currentTime=0;
        audioShot.play();
    }
}

SpaceShip.prototype.explode = function () {
    this.alive = false;
    audioExplosion.play();
    this.animation.status = 'started'; //start animation;
}

function collisionCheck(obj1, obj2) {  // obj must have width, height, position=vector2D
    //this collision check is currently NOT respection rotation of the object.
    //That means it is a bit inaccurate.
    var xOverlap = (obj2.position.x-obj1.position.x < obj2.width
                && obj2.position.x > obj1.position.x)
                || (obj2.position.x+obj2.width > obj1.position.x
                && obj1.position.x+obj1.width > obj2.position.x+obj2.width);

    var yOverlap = (obj2.position.y-obj1.position.y < obj2.height
                && obj2.position.y > obj1.position.y)
                || (obj2.position.y+obj2.height > obj1.position.y
                && obj1.position.y+obj1.height > obj2.position.y+obj2.height);

    return xOverlap && yOverlap;
}

function shipCollisionCheck(shipX, shipY){
    if (collisionCheck(shipX, shipY) && shipX.alive == true && shipY.alive == true) {
        shipX.explode();
        shipY.explode();        
        shipX.score++;
        shipY.score++;
        console.log(shipY.score)
        document.getElementById("countScoresP1").innerHTML = shipX.score;
        document.getElementById("countScoresP2").innerHTML = shipY.score;
        respawn(ship1, ship2);
    }
}

function hitCheck(shipX, shipY){
    if (collisionCheck(shipX, shipY.shot) && shipX.alive == true){
        shipX.explode();
        shipX.shot.active = false;
        shipY.shot.active = false;
        shipY.score++;
        if (shipY.playerName == 'player2') {
            document.getElementById("countScoresP2").innerHTML = shipY.score;
        } else {
            document.getElementById("countScoresP1").innerHTML = shipY.score;
        }
        
        respawn(ship1, ship2);
    }
}

function respawn(ship1, ship2){
    setTimeout(function () {
        if (!ship1.alive || !ship2.alive){
            ship1.position = new Vector2D(10,10);
            ship2.position = new Vector2D(960,750);
            ship1.speed = new Vector2D(0,0);
            ship2.speed = new Vector2D(0,0);
            ship1.rotation = 180;
            ship2.rotation = 0;
            ship1.alive = true;
            ship2.alive = true;
            ship1.shot.active = true;
            ship2.shot.active = true;
    }
    }, 1000)    
}

function winGame() {
    if (ship1.score == winScore) {
        document.getElementById("winMessage").innerHTML = 'PLAYER BATTLESHIP WON!!';
    }
    if (ship2.score == winScore) {
        document.getElementById("winMessage").innerHTML = 'PLAYER SPEEDSHIP WON!!';
    }

}

function ScaleAnimation(width, height, timeToScaleUp, timeToScaleDown){
    this.status = 'ended'; //can be 'ended', 'started', 'paused'
    this.timeSinceStart = 0; //in ms
    this.height = height; //max height
    this.width = width; //max width
    this.currentHeight = 10;
    this.currentWidth = 10;
    this.timeToScaleDown = timeToScaleDown;
    this.timeToScaleUp = timeToScaleUp;

    this.step = function(){
        if(this.status != 'ended'){
            this.timeSinceStart += refreshRate;

            if(this.timeSinceStart < timeToScaleUp){
                var stepsToScaleUp = this.timeToScaleUp/refreshRate
                var scaleUpStepSizeForWidth = this.width/stepsToScaleUp;
                var scaleUpStepSizeForHeight = this.height/stepsToScaleUp;

                this.currentHeight += scaleUpStepSizeForHeight;
                this.currentWidth += scaleUpStepSizeForWidth;
            } 
            else if(this.timeSinceStart < timeToScaleUp + timeToScaleDown){
                var stepsToScaleDown = this.timeToScaleDown/refreshRate
                var scaleDownStepSizeForWidth = this.currentWidth/stepsToScaleDown;
                var scaleDownStepSizeForHeight = this.currentHeight/stepsToScaleDown;

                this.currentHeight -= scaleDownStepSizeForHeight;
                this.currentWidth -= scaleDownStepSizeForWidth;

                if(this.currentHeight < 0 ){
                    this.currentHeight = 0;
                }
                if(this.currentWidth < 0 ){
                    this.currentWidth = 0;
                }
            } else {
                this.status = 'ended';
                this.timeSinceStart = 0;
            }
        }
    }
}

function drawObject(img, object, width, height) {
    var widthToDraw = typeof width == 'undefined' ? object.width : width;
    var heightToDraw = typeof height == 'undefined' ? object.height : height;
    var mid = object.middle();
    var ctx = Context2D.getInstance();

    ctx.save();
    ctx.translate(mid.x, mid.y);
    ctx.rotate(object.rotation * TO_RADIANS);
    ctx.drawImage(img, -object.width/2, -object.height/2, widthToDraw, heightToDraw);
    ctx.restore();
}

//this animation draws the img initially with size 0 and scales it up
//(in 'timeToScaleUp' ms) to its maximum size
//to scale it down afterwards in 'timeToScaleDown' milliseconds.
//If timeToScaleDown is missing it will not scale down.
function drawScaleAnimation(img, object) {
    var ctx = Context2D.getInstance();

    object.animation.step();

    if(object.animation.status == 'started'){
        drawObject(img, object, object.animation.currentWidth, object.animation.currentHeight);
    }
}

function drawShip(ship) {

    var img = document.getElementById(ship.imageName);
    var imgExplosion = document.getElementById("explosion");
    var ctx = Context2D.getInstance();

    if(ship.alive){
        drawObject(img, ship);
    } else {
        drawScaleAnimation(imgExplosion, ship);
    }
}

window.onload = function() {
    var shot1 = document.getElementById("shot01");
    var shot2 = document.getElementById("shot02");
    
    function step(){
        var ctx = Context2D.getInstance();
        ctx.fillStyle="#FFFFFF";
        ctx.fillRect(0,0,globalWidth,globalHeight);

        //logic
        ship1.step();
        ship2.step();
        hitCheck(ship1, ship2);
        hitCheck(ship2, ship1);
        shipCollisionCheck(ship1,ship2);
        shipCollisionCheck(ship2, ship1);
        winGame();
        //view
        drawShip(ship1);
        drawShip(ship2);
        if (ship1.shot.active) {
            drawObject(shot1, ship1.shot);
        }
        if (ship2.shot.active) {
            drawObject(shot2, ship2.shot);
        }
    }
    setInterval(step, refreshRate);

    var keyDownMap = [];
    keyDownMap[37] = ship2.turnLeft.bind(ship2); //arrow left
    keyDownMap[39] = ship2.turnRight.bind(ship2); //arrow right
    keyDownMap[38] = ship2.accelerate.bind(ship2); //arrow up
    keyDownMap[40] = ship2.break.bind(ship2); //arrow down
    keyDownMap[16] = ship2.giveFire.bind(ship2); //dash key
    keyDownMap[65] = ship1.turnLeft.bind(ship1); //a key
    keyDownMap[68] = ship1.turnRight.bind(ship1); //d key
    keyDownMap[87] = ship1.accelerate.bind(ship1); //w key
    keyDownMap[83] = ship1.break.bind(ship1); //s key
    keyDownMap[69] = ship1.giveFire.bind(ship1); //e key

    var keyUpMap = [];
    keyUpMap[37] = ship2.stopTurning.bind(ship2); //arrow left
    keyUpMap[39] = ship2.stopTurning.bind(ship2); //arrow left
    keyUpMap[38] = ship2.engineShutDown.bind(ship2); //arrow up
    keyUpMap[40] = ship2.engineShutDown.bind(ship2); //arrow down
    keyUpMap[65] = ship1.stopTurning.bind(ship1); //a key
    keyUpMap[68] = ship1.stopTurning.bind(ship1); //d key
    keyUpMap[87] = ship1.engineShutDown.bind(ship1); //w key
    keyUpMap[83] = ship1.engineShutDown.bind(ship1); //s key

    function prepareKeyUpRequest(keyCode){
        return JSON.stringify({request: 'keyUp', keyCode: keyCode});
    }

    function prepareKeyDownRequest(keyCode){
        return JSON.stringify({request: 'keyDown', keyCode: keyCode});
    }

    document.getElementById('body').addEventListener('keydown', function (e) {
        var key = e.which || e.keyCode;

        if(typeof keyDownMap[key] === 'function'){
            //send key event to server
            server.send(prepareKeyDownRequest(key));
        }
    });

    document.getElementById('body').addEventListener('keyup', function (e) {
        var key = e.which || e.keyCode;

        if(typeof keyUpMap[key] === 'function'){
            //send key event to server
            server.send(prepareKeyUpRequest(key));
        }
    });

    server.onmessage = function(event){
        var data = JSON.parse(event.data);

        if(data.response == 'keyUp'){
            keyUpMap[data.keyCode](); //run action
        } else if(data.response == 'keyDown'){
            keyDownMap[data.keyCode](); //run action
        }
    }
}
