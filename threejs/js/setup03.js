var fieldWidth  = 600;
var fieldHeight = 600;

var numBodies   = 32;
var minRadius   = 20;
var maxRadius   = 20;

var wallLeft = -fieldWidth/2;
var wallTop = fieldHeight/2;
var wallRight = fieldWidth/2;
var wallBot = -fieldHeight/2;

var forceElasticity = 0.6;
var forceWallFriction = 0.8;
var forceConstFriction = 0.1;
var forceAirFriction = 0.05;
var forceBodyFriction = 0.01;
var forceGravity = 981;

var EPSILON_TOUCH = 1.0;
var velocityThreshold = 0.01;

var mass = new Float64Array(numBodies);

posX = new Float64Array(numBodies);
posY = new Float64Array(numBodies);

velX = new Float64Array(numBodies);
velY = new Float64Array(numBodies);

oldAccX = new Float64Array(numBodies);
oldAccY = new Float64Array(numBodies);

accX = new Float64Array(numBodies);
accY = new Float64Array(numBodies);

radii = new Float64Array(numBodies);

createGrid(4, 20, 5);

velY[31] = 1000;
//velX[0] = 50000;

// radii[64] = 40;
// posY[64] = 0;
// posX[64] = wallLeft + radii[64] + 50;
// mass[64] = 15;
// velX[64] = 1000;

var FORCES = true;
DEBUGGING = false;
LOGGING = false;
ERRORS = false;