
var TO_RADIANS = Math.PI/180;

function SpaceShip(x, y, width, heigth, rotation) {
    this.position = new Vector2D(x,y);
    this.width = width;
    this.heigth = heigth;
    this.acceleration = 0.2;
    this.rotation = rotation; //in degrees
    this.alive = true;
    this.speed = new Vector2D(0,0);
    this.maxSpeed = 2;
}
function Vector2D(x,y) {
    this.x = x;
    this.y = y;
}
Vector2D.prototype.add = function (vector) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
}
Vector2D.prototype.mul = function (vector) {
    this.x *= vector.x;
    this.y *= vector.y;
    return this;
}
Vector2D.prototype.sub = function (vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    return this;
}
Vector2D.prototype.div = function (vector) {
    this.x /= vector.x;
    this.y /= vector.y;
    return this;
}
SpaceShip.prototype.middle = function () {
    return new Vector2D(this.position.x+this.width/2, this.position.y+this.heigth/2);
}
SpaceShip.prototype.turnLeft = function () {
    this.rotation = (this.rotation - 5)%360 ;
}
SpaceShip.prototype.turnRight = function () {
    this.rotation = (this.rotation + 5)%360 ;
}
SpaceShip.prototype.accelerate = function () {
    this.speed.sub(new Vector2D(Math.cos(TO_RADIANS*(this.rotation+90))*this.acceleration, Math.sin(TO_RADIANS*(this.rotation+90))*this.acceleration));
}
SpaceShip.prototype.break = function () {
    this.speed.add(new Vector2D(Math.cos(TO_RADIANS*(this.rotation+90))*this.acceleration, Math.sin(TO_RADIANS*(this.rotation+90))*this.acceleration));
}
SpaceShip.prototype.step = function () {
    this.position.add(this.speed);
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
        ctx.fillRect(0,0,1000,800);
        drawShip(ctx, img1, ship1);
        drawShip(ctx, img2, ship2);
        ship1.step();
        ship2.step();
    }
    setInterval(step,33);

    document.getElementById('body').addEventListener('keydown', function (e) {
        var key = e.which || e.keyCode;
        if (key === 37) {
            ship2.turnLeft();
        }
        if (key === 39) {
            ship2.turnRight();
        }
        if (key === 38) {
            ship2.accelerate();
        }
        if (key === 40) {
            ship2.break();
        }
    })
};