var SpaceShip = require('./spaceShip');
var Vector2D = require('./vector');

var healthFactor = 0.25;

function Game()
{
	this.refreshRate = 33; //in milliseconds
	this.globalWidth = 1000;
	this.globalHeight = 800;
	this.winScore = 5;
	this.ship1 = new SpaceShip(10,10,30,40,180, 'player1');
	this.ship2 = new SpaceShip(960,750,30,40,0, 'player2');
    this.winner = '';

    this.collisionCheck = (obj1, obj2) => {  // obj must have width, height, position=vector2D
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

    this.shipCollisionCheck = (shipX, shipY) => {
        if (this.collisionCheck(shipX, shipY) && shipX.alive == true && shipY.alive == true) {
            shipX.health = 0;
            shipY.health = 0;
            shipX.explode();
            shipY.explode();        
            shipX.score++;
            shipY.score++;
            this.respawn(this.ship1, this.ship2);
        }
    }

    this.hitCheck = (shipX, shipY) => {
        if (this.collisionCheck(shipX, shipY.shot) && shipX.alive == true){
            shipX.health -= healthFactor;     
        }
        if(shipX.health == 0) {
            shipX.explode();
            shipX.shot.active = false;
            shipY.shot.active = false;
            shipY.score++;            
            this.respawn(this.ship1, this.ship2);
            shipX.health = 1;
        }
         
    }

    this.respawn = (ship1, ship2) => {
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
                this.winner = '';
        }
        }, 1000)    
    }

    this.winGameCheck = () => {
        if (this.ship1.score == this.winScore) {
            this.winner = this.ship1.playerName;
        }
        if (this.ship2.score == this.winScore) {
            this.winner = this.ship2.playerName;
        }
    }

    this.bumpCheckShip = function (ship) {
        if ( (ship.position.x+ship.width) > this.globalWidth){
            ship.speed.mul(new Vector2D(-1,1));
            ship.recover();
        }
        if ( (ship.position.y+ship.height) > this.globalHeight){
            ship.speed.mul(new Vector2D(1,-1));
            ship.recover();
        }
        if ( (ship.position.x) < 0){
            ship.speed.mul(new Vector2D(-1,1));
            ship.recover();
        }
        if ( (ship.position.y) < 0){
            ship.speed.mul(new Vector2D(1,-1));
            ship.recover();
        }
    }

    this.bumpCheck = function () {
        this.bumpCheckShip(this.ship1);
        this.bumpCheckShip(this.ship2);
    }

    this.step = () => {
        this.ship1.step();
        this.ship2.step();
        this.bumpCheck();
        this.hitCheck(this.ship1, this.ship2);
        this.hitCheck(this.ship2, this.ship1);
        this.shipCollisionCheck(this.ship1, this.ship2);
        this.shipCollisionCheck(this.ship2, this.ship1);
        this.winGameCheck();
    }
}

module.exports = Game;