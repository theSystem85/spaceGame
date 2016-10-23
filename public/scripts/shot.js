
define(['./vector'], function(Vector2D){
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

    return Shot;
});