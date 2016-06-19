var SpaceHipster = SpaceHipster || {};

// Declare difficulty object
var SkillLevel = {
    // Define SkillLevel parameters;
    easy: 2550,
    medium: 50150,
    hard: 150250,
    choice: null
    };
// The ratio of large asteroids (0-100)
var astroidarray = [];
var ARRAY_NUM_TOTAL = 1000;

//title screen
SpaceHipster.Game = function(){};

SpaceHipster.Game.prototype = {
  create: function() {

  	//set world dimensions
    this.game.world.setBounds(0, 0, 1920, 1920);

    //background
    this.background = this.game.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'space');

    //create player
    this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'playership');
    this.player.scale.setTo(2);
    this.player.animations.add('fly', [0, 1, 2, 3], 5, true)
    this.player.animations.play('fly');

      //initializing the physics of asteroids
      this.asteroids = this.game.add.group();
      //enable physics in them
      this.asteroids.enableBody = true;

    //player initial score of zero
    this.playerScore = 0;

    //enable player physics
    this.game.physics.arcade.enable(this.player);
    this.playerSpeed = 120;
    this.player.body.collideWorldBounds = true;

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

    //Populate astroid sizes and store size
    this.sizeGen();

    //Debug
    console.log(astroidarray)

    // every 10 secs process generateAsteroid
    this.game.time.events.loop(500, this.generateAsteriod, this);
  },
  update: function() {
    if(this.game.input.activePointer.justPressed()) {

      //move on the direction of the input
      this.game.physics.arcade.moveToPointer(this.player, this.playerSpeed);
    }

    //collision between player and asteroids
    this.game.physics.arcade.collide(this.player, this.asteroids, this.hitAsteroid, null, this);

    //overlapping between player and collectables
    this.game.physics.arcade.overlap(this.player, this.collectables, this.collect, null, this);
  },

    sizeGen: function(){
        //generate the ratio of large rocks
        var rock_size_percent = this.game.rnd.integerInRange(0, 100);
        //DEBUG
        console.log("rocksize%: " + rock_size_percent);
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
       console.log("pushRocksToArray: " + size)

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
        console.log(rockType);
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
      asteriod = this.asteroids.create(this.game.world.randomX, this.game.world.randomY, 'rock');
        //scale asteroid by picking from arrayindex and grabbing its size data
        var pik = chosenastroid.sizePick / 1000 * 20;
      asteriod.scale.setTo(pik);


        if(chosenastroid.sizeType == "large")
            chosenastroid.velocityRock = this.game.rnd.weightedPick(astroidarray).sizePick *.9;
        else
        {
            //if small weigh toward higher speeds
            astroidarray.reverse();
            chosenastroid.velocityRock = this.game.rnd.weightedPick(astroidarray).sizePick * 1.2 ;
            console.log("astro reverse small: " + chosenastroid.velocityRock);
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
      asteriod.body.immovable = true;
      asteriod.body.collideWorldBounds = true;

        //DEBUG
        console.log(asteriod.height)
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

    this.game.time.events.add(800, this.gameOver, this);
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

/*
TODO

-audio
-asteriod bounch
*/
