var SpaceHipster = SpaceHipster || {};

// Declare difficulty variable
var skillLevel;

// Define skilllevel parameters;
var Easy;
var Medium;
var Hard;

// The ratio of large asteroids (0-100)
var astroidarray = [];
var ARRAY_NUM_TOTAL = 1000;
var numberAsteroids = 0;

// for ship movement and bullets:
var sprite;
var cursors;
var bulletTime = 0;
//endo ship and bullets stuff

// The ratio of large asteroids (0-100)
var astroidarray = [];
var ARRAY_NUM_TOTAL = 1000;


// title screen
SpaceHipster.Game = function(){};

SpaceHipster.Game.prototype = {
     
    create: function() {
        
    // generate number of asteroids for skill level            
    Easy = this.game.rnd.integerInRange(25, 50);
    Medium = this.game.rnd.integerInRange(50, 150);
    Hard = this.game.rnd.integerInRange(150, 250);
            
    // manually select skill level; Easy and Medium are not challenging
    // maxAsteroids = Easy;
    // maxAsteroids = Medium;
    maxAsteroids = Hard;
    console.log("maxAsteroids: " + maxAsteroids);
         
  	// set world dimensions
    this.game.world.setBounds(0, 0, 1920, 1920);
        
    // This will run in Canvas mode, so let's gain a little speed and display
    this.game.renderer.clearBeforeRender = false;
    this.game.renderer.roundPixels = true;
      
    //added for ship and bullet
    //  We need arcade physics
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
            
    //background
    this.background = this.game.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'space');
    
    //  Our ships bullets
    this.bullets = this.game.add.group();
    this.game.physics.arcade.enable(this.bullets);
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    // All 10 of them- this means you run out of ammo if you don't tame your trigger finger
    this.bullets.createMultiple(05, 'bullets');
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 0.5);
          
    //added ship and bullet controls: game input
    cursors = this.game.input.keyboard.createCursorKeys();
    this.game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
       
    //create player
    this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'playership');
    this.player.scale.setTo(2);
    this.player.anchor.set(0.5);
    
    //enable player physics
    this.game.physics.arcade.enable(this.player);
    this.player.body.drag.set(50);
    this.player.body.maxVelocity.set(1000);
    this.player.body.collideWorldBounds = true; 

    //initializing the physics of asteroids
    this.asteroids = this.game.add.physicsGroup(Phaser.Physics.ARCADE);      

    //player initial score of zero
    this.playerScore = 0;

    //the camera will follow the player in the world
    this.game.camera.follow(this.player);

    //generate game elements
    this.generateCollectables();

    //show score
    this.showLabels();

    //sounds
    this.explosionSound = this.game.add.audio('explosion');
    console.log(this.explosionSound);
    this.collectSound = this.game.add.audio('collect');
    this.fireSound = this.game.add.audio('fire');

    //Populate astroid sizes and store size
    this.sizeGen();

    // generate an asteroid every half second
    this.game.time.events.loop(500, this.generateAsteriod, this);
  },
      
    
    
  update: function() {
    
  if (cursors.up.isDown)
    {
        this.game.physics.arcade.accelerationFromRotation(this.player.rotation, 200, this.player.body.acceleration);
    }
  else
    {
        this.player.body.acceleration.set(0);
    }

  if (cursors.left.isDown)
    {
        this.player.body.angularVelocity = -300;
    }
  else if (cursors.right.isDown)
    {
        this.player.body.angularVelocity = 300;
    }
  else
    {
        this.player.body.angularVelocity = 0;
    }
      
  if (this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))
    {
        this.fireBullet();
    }
      
    
    //collision between player and asteroids
    this.game.physics.arcade.collide(this.player, this.asteroids, this.hitAsteroid, null, this);

    //overlapping between player and collectables
    this.game.physics.arcade.overlap(this.player, this.collectables, this.collect, null, this);
      
    //collision of bullet and asteroid
    this.game.physics.arcade.collide(this.bullets, this.asteroids, this.shootAsteroid, null, this);
   
    //enable collisions between astteroids
    this.game.physics.arcade.collide(this.asteroids);
       
  },
    
    
    fireBullet: function(){
        
      if (this.game.time.now > bulletTime){
        bullet = this.bullets.getFirstExists(false);
      if (bullet){
            // weapon report (in space, would you hear it?)
            this.fireSound.play();
            // And fire the weapon
            bullet.reset(this.player.body.x + 16, this.player.body.y + 16);
            //bullet lifespan sets effective range of bullets; reduced it from 2000 to 550
            bullet.lifespan = 650;
            bullet.rotation = this.player.rotation;
            this.game.physics.arcade.velocityFromRotation(this.player.rotation, 400, bullet.body.velocity);
            bulletTime = this.game.time.now + 50;
            }
        }
    },
    
    sizeGen: function(){
        //generate the ratio of large rocks
        var rock_size_percent = this.game.rnd.integerInRange(0, 100);
        //if zero percent of rocks are large
        if (rock_size_percent == 0)
            //push all small rocks to array
            for(var x = 0; x < ARRAY_NUM_TOTAL; x++)
                this.pushRocksToArray("small");
        //if 100 percent of rocks are large
        else if (rock_size_percent == 100)
            //push all large rocks to array
            for(var x = 0; x < ARRAY_NUM_TOTAL; x++)
                this.pushRocksToArray("large");
        //if mixed ratio of rock sizes
        else{
            //push the percent of remaining small rocks to array
            for(var x = 0; x < Math.round(ARRAY_NUM_TOTAL * ( 1 - rock_size_percent/100)); x++)
                this.pushRocksToArray("small");
            //push the percent of large rocks to array
            for(var x = 0; x < Math.round(ARRAY_NUM_TOTAL * (rock_size_percent/100)); x++)
                this.pushRocksToArray("large");
        }
    },

    pushRocksToArray: function(size){
       var rockType = {
            sizePick: null,
            sizeType: "",
            velocityRock: null
            };
        //if wanting to push big rock object to array
        if (size == "large"){
            //puts random large size in rock object
            rockType.sizePick = this.game.rnd.integerInRange(90, 128);
            //tags rock as being large
            rockType.sizeType = "large";

            //Temp push to populate velocity (based on weighted array)
            astroidarray.push(rockType);
        }
        //if wanting to push small rock object to array
        else{
            rockType.sizePick = this.game.rnd.integerInRange(16, 32);
            rockType.sizeType = "small"

            //Temp push to populate velocity (based on weighted array)
            astroidarray.push(rockType);
        }
    },

    generateCollectables: function() {
    this.collectables = this.game.add.group();

    //enable physics in them
    this.collectables.enableBody = true;
    this.collectables.physicsBodyType = Phaser.Physics.ARCADE;

    //phaser's random number generator
    var numCollectables = this.game.rnd.integerInRange(100, 150);
    var collectable;

    for (var i = 0; i < numCollectables; i++) {
      //add sprite
      collectable = this.collectables.create(this.game.world.randomX, this.game.world.randomY, 'power');
      collectable.animations.add('fly', [0, 1, 2, 3], 5, true);
      collectable.animations.play('fly');
    }
  },

    generateAsteriod: function(size) {
        var asteriod;
        //copy an asteroid favoring smaller
        var chosenastroid = this.game.rnd.weightedPick(astroidarray);

        // MAKE THE ASTEROID
      
        // ensures that max number asteroids not exceeded
        if(numberAsteroids < maxAsteroids){
        asteriod = this.asteroids.create(this.game.world.randomX, this.game.world.randomY, 'rock');
        // increment number of asteroids
        numberAsteroids ++;
        console.log("numberAsteroids: " + numberAsteroids);
          
        //scale asteroid by picking from arrayindex and grabbing its size data
        var pik = chosenastroid.sizePick / 1000 * 20;
        asteriod.scale.setTo(pik);

        if(chosenastroid.sizeType == "large")
        chosenastroid.velocityRock = this.game.rnd.weightedPick(astroidarray).sizePick *.9;
        else{
            //if small weigh toward higher speeds
            astroidarray.reverse();
            chosenastroid.velocityRock = this.game.rnd.weightedPick(astroidarray).sizePick * 1.2 ;
            //console.log("astro reverse small: " + chosenastroid.velocityRock);
            //Put back in order
            astroidarray.reverse();
        }

      //physics properties
      //make the velocity either positive or negative
      chosenastroid.velocityRock *= this.game.rnd.pick([-1,1])
      asteriod.body.velocity.x = chosenastroid.velocityRock;
      
      //make the velocity either positive or negative
      chosenastroid.velocityRock *= this.game.rnd.pick([-1,1])
      asteriod.body.velocity.y = chosenastroid.velocityRock;
      
      //asteriod.body.collideWorldBounds = true;
      this.asteroids.setAll('body.collideWorldBounds', true);
      this.asteroids.setAll('body.bounce.x', 1);
	  this.asteroids.setAll('body.bounce.y', 1);
        
      }
      },
    
    shootAsteroid: function(bullet, asteroid) {
    
    //play explosion sound
    this.explosionSound.play();

    //make the asteroid explode
    var emitter = this.game.add.emitter(asteroid.x, asteroid.y, 100);
    emitter.makeParticles('playerParticle');
    emitter.minParticleSpeed.setTo(-200, -200);
    emitter.maxParticleSpeed.setTo(200, 200);
    emitter.gravity = 0;
    emitter.start(true, 1000, null, 100);
       
    asteroid.kill();
    numberAsteroids --;

    //Kill the bullet on impact
    bullet.kill();
    },
        

    hitAsteroid: function(player, asteroid) {
    //play explosion sound
    this.explosionSound.play();

    //make the player explode
    var emitter = this.game.add.emitter(this.player.x, this.player.y, 100);
    emitter.makeParticles('playerParticle');
    emitter.minParticleSpeed.setTo(-200, -200);
    emitter.maxParticleSpeed.setTo(200, 200);
    emitter.gravity = 0;
    emitter.start(true, 1000, null, 100);
    this.player.kill();

    this.game.time.events.add(100, this.gameOver, this);
  },
      
  gameOver: function() {
    //pass it the score as a parameter
    this.game.state.start('MainMenu', true, false, this.playerScore);
  },
  collect: function(player, collectable) {
    //play collect sound
    this.collectSound.play();

    //update score
    this.playerScore++;
    this.scoreLabel.text = this.playerScore;

    //remove sprite
    collectable.destroy();
  },
  showLabels: function() {
    //score text
    var text = "0";
    var style = { font: "20px Arial", fill: "#fff", align: "center" };
    this.scoreLabel = this.game.add.text(this.game.width-50, this.game.height - 50, text, style);
    this.scoreLabel.fixedToCamera = true;
  }
};



