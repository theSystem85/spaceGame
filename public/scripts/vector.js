
define([], function(){
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

    return Vector2D;
});