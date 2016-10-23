
define(['./game', './shot', './spaceShip', './vector'], function(Game, Shot, SpaceShip, Vector2D){

    function startGame() {
        var SERVER_WS_URL = 'ws://localhost:3001';//'ws://patrick-beyer-software.de:3001';
        var server = new WebSocket(SERVER_WS_URL);

        var TO_RADIANS = Math.PI/180;
        var shipHealthWidth = 130;
        var healthFactor = 1/4;

        var smallStarsArray = [];
        for(var s = 0; s<20; s++){
            smallStarsArray.push({
                starXPosition: (Math.random() * 1000) + 1, 
                starYPosition: (Math.random() * 800) + 1, 
                smallStarRadius: (Math.random() * 2) + 0.2}
        )}
        var bigStarsArray = [];
        for(var b = 0; b<20; b++){
            bigStarsArray.push({
                starXPosition: (Math.random() * 1000) + 1, 
                starYPosition: (Math.random() * 800) + 1, 
                bigStarRadius: (Math.random() * 3.5) + 2.1}
        )};
        var factorS = {factorHSmall: 16, factorWSmall: 20};
        var factorB = {factorHBig: 8, factorWBig: 10};

        var game = new Game();

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

        function canvasBackground() {
                var context = new Context2D.getInstance();        
                var my_gradient = context.createLinearGradient(0,0,0,700);
                my_gradient.addColorStop(0,"#191970");
                my_gradient.addColorStop(1,"#000000");
                context.fillStyle=my_gradient;
                context.fillRect(0,0,1000,800); 
                return context;
        };

        function starDrawing(x, y, rad, offset, factorH, factorW){
            var ctx = new Context2D.getInstance();
            var sx = x-offset.x/factorH;
            var sy = y-offset.y/factorW;
            ctx.beginPath();
            ctx.arc(sx, sy, rad,0,2*Math.PI);
            ctx.fillStyle="#f2f2f2";
            ctx.stroke();
            ctx.fill();
        };

        function SpaceShipView(spaceShip, imageName, refreshRate){
            this.body = spaceShip;
            this.imageName = imageName;
            this.animation = new ScaleAnimation(200, 211, 300, 100, refreshRate);
        }

        // --------------------------------------------------
        // ------------------ Begin GameView -----------------
        // --------------------------------------------------
        function GameView(game) {
            this.game = game;
            this.ship1View = new SpaceShipView(this.game.ship1, 'bgbattleship', this.game.refreshRate);
            this.ship2View = new SpaceShipView(this.game.ship2, 'bgspeedship', this.game.refreshRate);
            this.shipViews = [this.ship1View, this.ship2View];

            this.shot1Pic = document.getElementById("shot01");
            this.shot2Pic = document.getElementById("shot02");

            this.audioExplosion = new Audio('resources/explosion01.m4a');
            this.audioShot = new Audio('resources/shoot01.m4a');
            this.audioExplosion.playbackRate = 2.0;

            this.ctx = Context2D.getInstance();
            
            this.clearScreen = () => {
                this.ctx.fillStyle = "#FFFFFF";
                this.ctx.fillRect(0, 0, this.game.globalWidth, this.game.globalHeight);
            }

            this.showWinner = () => {
                if(this.game.winner !== '')
                    document.getElementById("winMessage").innerHTML = 'PLAYER ' + this.game.winner + ' WON!!';
            }

            this.showScores = () => {
                document.getElementById("countScoresP1").innerHTML = this.game.ship1.score;
                document.getElementById("countScoresP2").innerHTML = this.game.ship2.score;
            }

            this.showHealth = () => {
                document.getElementById("healthPlayer1Green").style.width = shipHealthWidth * this.ship1View.body.health + "px";
                document.getElementById("healthPlayer2Green").style.width = shipHealthWidth * this.ship2View.body.health + "px";

            }
            //------------- animation handling -----------------

            this.eventsToAnimationMap = {
                "explodeAnimation": (animation) => { animation.status = 'started'; }
            }
            
            this.handleAnimationEvent = (eventName, animation) => {
                this.eventsToAnimationMap[eventName](animation);
            }
            
            this.playAnimations = () => {
                this.shipViews.forEach(shipView => {
                    shipView.body.events.forEach((eventName, id) => {
                        if(typeof this.eventsToAnimationMap[eventName] !== 'undefined'){
                            this.handleAnimationEvent(eventName, shipView.animation);
                            shipView.body.events.splice(id, 1);
                        }
                    });
                    
                    if(shipView.body.events.length >= 100){
                        shipView.body.events.splice(10, 90); //empty to prevent overflows
                    }
                });
            }

            // -------- sound handling ----------

            this.eventsToSoundMap = {
                "fired": this.audioShot,
                "exploded": this.audioExplosion
            }

            this.handleSoundEvent = (eventName) => {
                this.eventsToSoundMap[eventName].pause();
                this.eventsToSoundMap[eventName].currentTime = 0;
                this.eventsToSoundMap[eventName].play();
            }

            this.playSounds = () => {
                this.shipViews.forEach(shipView => {
                    shipView.body.events.forEach((eventName, id) => {
                        if(typeof this.eventsToSoundMap[eventName] !== 'undefined'){
                            this.handleSoundEvent(eventName);
                            shipView.body.events.splice(id, 1);
                        }
                    });
                    
                    if(shipView.body.events.length >= 100){
                        shipView.body.events.splice(10, 90); //empty to prevent overflows
                    }
                });
            }

            this.drawObject = (img, object, width, height) => {
                var widthToDraw = typeof width == 'undefined' ? object.width : width;
                var heightToDraw = typeof height == 'undefined' ? object.height : height;
                var mid = object.middle();
                var ctx = Context2D.getInstance();

                this.ctx.save();
                this.ctx.translate(mid.x, mid.y);
                this.ctx.rotate(object.rotation * TO_RADIANS);
                this.ctx.drawImage(img, -object.width/2, -object.height/2, widthToDraw, heightToDraw);
                this.ctx.restore();
            }

            //this animation draws the img initially with size 0 and scales it up
            //(in 'timeToScaleUp' ms) to its maximum size
            //to scale it down afterwards in 'timeToScaleDown' milliseconds.
            //If timeToScaleDown is missing it will not scale down.
            this.drawScaleAnimation = (img, object) => {

                object.animation.step();

                if(object.animation.status == 'started'){
                    this.drawObject(img, object.body, object.animation.currentWidth, object.animation.currentHeight);
                }
            }

            this.drawShip = (shipView) => {
                var img = document.getElementById(shipView.imageName);
                var imgExplosion = document.getElementById("explosion");
                var ctx = Context2D.getInstance();

                if(shipView.body.alive){
                    this.drawObject(img, shipView.body);
                } else {
                    this.drawScaleAnimation(imgExplosion, shipView);
                }
            }

            this.drawShot = (shot, img) => {
                if (shot.active) {
                    this.drawObject(img, shot);
                }
            }

            this.update = () => {
                this.clearScreen();
                canvasBackground();
                for (var i = 0; i<20; i++) {
                    starDrawing(smallStarsArray[i].starXPosition, 
                    smallStarsArray[i].starYPosition, 
                    smallStarsArray[i].smallStarRadius, 
                    {x: this.ship1View.body.position.x, y: this.ship1View.body.position.y},
                    factorS.factorHSmall, factorS.factorWSmall);
                }
                for (var k = 0; k<20; k++) {
                    starDrawing(bigStarsArray[k].starXPosition, 
                    bigStarsArray[k].starYPosition, 
                    bigStarsArray[k].bigStarRadius,
                    {x: this.ship1View.body.position.x, y: this.ship1View.body.position.y},
                    factorB.factorHBig, factorB.factorWBig);
                }        
                this.drawShip(this.ship1View);
                this.drawShip(this.ship2View);
                this.drawShot(this.ship1View.body.shot, this.shot1Pic);
                this.drawShot(this.ship2View.body.shot, this.shot2Pic);

                this.showWinner();
                this.showScores();
                this.showHealth();
                this.playSounds();
                this.playAnimations();
            }
        }
        // --------------------------------------------------
        // ------------------ End GameView -----------------
        // --------------------------------------------------

        // --------------------------------------------------
        // ---------------- Begin ScaleAnimation ------------
        // --------------------------------------------------

        function ScaleAnimation(width, height, timeToScaleUp, timeToScaleDown, refreshRate){
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

        // --------------------------------------------------
        // ---------------- End ScaleAnimation --------------
        // --------------------------------------------------

        window.onload = function() {
            
            var game = new Game();
            var gameView = new GameView(game);
            
            function step(){
                game.step();
                gameView.update();
            }
            setInterval(step, game.refreshRate);

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
                } else if(data.response == 'sync'){
                    syncGame(data.gameState);
                }
            }

            function syncGame(serverGame){
                updateObject(game.ship1, serverGame.ship1);
                updateObject(game.ship2, serverGame.ship2);
            }
        }

        function updateObject(target, source) {
            if (!source || !target || typeof source !== "object" || typeof target !== "object")
                throw new TypeError("Invalid argument");

            for (var p in source) {
                if (source.hasOwnProperty(p) && p !== "events") {
                    if (source[p] && typeof source[p] === "object")
                        if (target[p] && typeof target[p] === "object")
                            updateObject(target[p], source[p]);
                        else
                            target[p] = source[p];
                    else 
                        target[p] = source[p];
                }
            }
        }
    }

    return startGame;
});