var fieldWidth  = 1200;
var fieldHeight = 600;

var numBodies   = 64;
var minRadius   = 20;
var maxRadius   = 20;

var wallLeft = -fieldWidth/2;
var wallTop = fieldHeight/2;
var wallRight = fieldWidth/2;
var wallBot = -fieldHeight/2;

var forceElasticity = 0.9;
var forceWallFriction = 0.8;
var forceAirFriction = 0.25;
var forceBodyFriction = 0.3;
var forceGravity = 0;

var EPSILON_TOUCH = 1.0;
var velocityThreshold = 0.01;


posX = new Float64Array(numBodies);
posY = new Float64Array(numBodies);

velX = new Float64Array(numBodies);
velY = new Float64Array(numBodies);

oldAccX = new Float64Array(numBodies);
oldAccY = new Float64Array(numBodies);

accX = new Float64Array(numBodies);
accY = new Float64Array(numBodies);

radii = new Float64Array(numBodies);

createGrid(8, 20, 5);

 posX.each(function(i){
   posX[i] = 0;
   posY[i] = 0;
});

//velY[0] = 50000;
//velX[0] = 50000;

var FORCES = true;
DEBUGGING = false;
LOGGING = false;
ERRORS = false;