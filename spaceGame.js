
var TO_RADIANS = Math.PI/180;
var globalWidth = 1000;
var globalHeigth = 800;

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

function SpaceShip(x, y, width, heigth, rotation) {
    this.position = new Vector2D(x,y);
    this.speed = new Vector2D(0,0);
    this.width = width;
    this.heigth = heigth;
    this.acceleration = 0.2;
    this.rotation = rotation; //in degrees
    this.alive = true;
    this.maxSpeed = 3;
    this.moveable = true;
}

SpaceShip.prototype.middle = function () {
    return new Vector2D(this.position.x+this.width/2, this.position.y+this.heigth/2);
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
    if ( (this.position.y+this.heigth) > globalHeigth){
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

function drawShip(ctx, img, ship) {
    ctx.save();
    var mid = ship.middle();
    ctx.translate(mid.x, mid.y);
    ctx.rotate(ship.rotation * TO_RADIANS);
    ctx.drawImage(img, -ship.width/2, -ship.heigth/2, ship.width, ship.heigth);
    ctx.restore();
}

var ship1 = new SpaceShip(10,10,30,40,180);
var ship2 = new SpaceShip(960,750,30,40,0);


window.onload = function() {
    var c=document.getElementById("myCanvas");
    var ctx=c.getContext("2d");

    var img1=document.getElementById("bgbattleship");
    var img2=document.getElementById("bgspeedship");
    
    function step(){
        ctx.fillStyle="#FFFFFF";
        ctx.fillRect(0,0,globalWidth,globalHeigth);
        drawShip(ctx, img1, ship1);
        drawShip(ctx, img2, ship2);
        ship1.step();
        ship2.step();
    }
    setInterval(step,33);

    document.getElementById('body').addEventListener('keydown', function (e) {
        var key = e.which || e.keyCode;
        var keyMap = [];
        keyMap[37] = ship2.turnLeft.bind(ship2); //arrow left
        keyMap[39] = ship2.turnRight.bind(ship2); //arrow right
        keyMap[38] = ship2.accelerate.bind(ship2); //arrow up
        keyMap[40] = ship2.break.bind(ship2); //arrow down
        keyMap[65] = ship1.turnLeft.bind(ship1); //a key
        keyMap[68] = ship1.turnRight.bind(ship1); //d key
        keyMap[87] = ship1.accelerate.bind(ship1); //w key
        keyMap[83] = ship1.break.bind(ship1); //s key

        keyMap[key](); //run action
    });
};