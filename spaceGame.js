
//global definitions
var TO_RADIANS = Math.PI/180;
var globalWidth = 1000;
var globalHeight = 800;

var ship1 = new SpaceShip(10,10,30,40,180, 'player1');
var ship2 = new SpaceShip(960,750,30,40,0, 'player2');

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

function SpaceShip(x, y, width, height, rotation, playerName) {
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
}

SpaceShip.prototype.middle = function () {
    return new Vector2D(this.position.x+this.width/2, this.position.y+this.height/2);
};

SpaceShip.prototype.turnLeft = function () {
    this.rotation = (this.rotation - 5)%360 ;
};

SpaceShip.prototype.turnRight = function () {
    this.rotation = (this.rotation + 5)%360 ;
};

SpaceShip.prototype.accelerate = function () {
    if (this.moveable){
        this.speed.sub(new Vector2D(Math.cos(TO_RADIANS*(this.rotation+90))*this.acceleration, Math.sin(TO_RADIANS*(this.rotation+90))*this.acceleration));
    }
};

SpaceShip.prototype.break = function () {
    if (this.moveable) {
        this.speed.add(new Vector2D(Math.cos(TO_RADIANS*(this.rotation+90))*this.acceleration, Math.sin(TO_RADIANS*(this.rotation+90))*this.acceleration));
    }    
};

SpaceShip.prototype.step = function () {
    this.limitSpeed();
    this.position.add(this.speed);
    this.bumpCheck();
    this.shot.step();
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
    }
}

SpaceShip.prototype.explode = function () {
    this.alive = false;
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
            shipX.shot.active = true;
            shipY.shot.active = true;
    }
    }, 1000)    
}

function winGame() {
    if (ship1.score == 10) {
        alert("Player battleship won!")
    }
    if (ship2.score == 10) {
        alert("Player battleship won!")
    }

}

function drawObject(ctx, img, object) {
    ctx.save();
    var mid = object.middle();
    ctx.translate(mid.x, mid.y);
    ctx.rotate(object.rotation * TO_RADIANS);
    ctx.drawImage(img, -object.width/2, -object.height/2, object.width, object.height);
    ctx.restore();
}


window.onload = function() {
    var c=document.getElementById("myCanvas");
    var ctx=c.getContext("2d");

    var img1=document.getElementById("bgbattleship");
    var img2=document.getElementById("bgspeedship");
    var shot1 = document.getElementById("shot01");
    var shot2 = document.getElementById("shot02");
    var explosion = document.getElementById("explosion");
    
    function step(){
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
        drawObject(ctx, ship1.alive ? img1 : explosion, ship1);
        drawObject(ctx, ship2.alive ? img2 : explosion, ship2);
        if (ship1.shot.active) {
            drawObject(ctx, shot1, ship1.shot);
        }
        if (ship2.shot.active) {
            drawObject(ctx, shot2, ship2.shot);
        }
    }
    setInterval(step,33);

    document.getElementById('body').addEventListener('keydown', function (e) {
        var key = e.which || e.keyCode;
        var keyMap = [];
        keyMap[37] = ship2.turnLeft.bind(ship2); //arrow left
        keyMap[39] = ship2.turnRight.bind(ship2); //arrow right
        keyMap[38] = ship2.accelerate.bind(ship2); //arrow up
        keyMap[40] = ship2.break.bind(ship2); //arrow down
        keyMap[35] = ship2.giveFire.bind(ship2); //end key
        keyMap[65] = ship1.turnLeft.bind(ship1); //a key
        keyMap[68] = ship1.turnRight.bind(ship1); //d key
        keyMap[87] = ship1.accelerate.bind(ship1); //w key
        keyMap[83] = ship1.break.bind(ship1); //s key
        keyMap[69] = ship1.giveFire.bind(ship1); //e key

        if(typeof keyMap[key] === 'function'){
            keyMap[key](); //run action
        }
    });
};