
define(['./vector', './shot'], function(Vector2D, Shot){
        
    var TO_RADIANS = Math.PI/180;

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
        this.health = 1;
        this.playerName = playerName;
        this.turnRate = 5; //in degrees per frame
        this.currentTurnRate = 0;
        this.currentAcceleration = 0;
        this.events = []; //for external animation or sound handling
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

    SpaceShip.prototype.giveFire = function () {
        if(this.alive){
            this.shot.position = this.middle();
            this.shot.speed = new Vector2D(Math.cos(TO_RADIANS*(this.rotation+270))*this.shot.maxSpeed, Math.sin(TO_RADIANS*(this.rotation+270))*this.shot.maxSpeed);
            this.shot.active = true;
            this.shot.rotation = this.rotation;
            this.events.push("fired");
        }
    }

    SpaceShip.prototype.explode = function () {
        this.alive = false;
        this.events.push("explodeSound");
        this.events.push("explodeAnimation");
    }

    return SpaceShip;
});