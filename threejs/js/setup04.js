var fieldWidth  = 800;
var fieldHeight = 800;

var numBodies   = 33;
var minRadius   = 20;
var maxRadius   = 20;

var wallLeft = -fieldWidth/2;
var wallTop = fieldHeight/2;
var wallRight = fieldWidth/2;
var wallBot = -fieldHeight/2;

var forceElasticity = 0.4;
var forceWallFriction = 0.8;
var forceConstFriction = 0.1;
var forceAirFriction = 0.05;
var forceBodyFriction = 0.01;
var forceGravity = 0;

var EPSILON_TOUCH = 1.0;
var EPSILON_TIME = 0.001;
var velocityThreshold = 0.01;

var mass = new Float64Array(numBodies);

posX = new Float64Array(numBodies);
posY = new Float64Array(numBodies);

velX = new Float64Array(numBodies);
velY = new Float64Array(numBodies);

actVelX = new Float64Array(numBodies);
actVelY = new Float64Array(numBodies);

oldAccX = new Float64Array(numBodies);
oldAccY = new Float64Array(numBodies);

accX = new Float64Array(numBodies);
accY = new Float64Array(numBodies);

radii = new Float64Array(numBodies);

createGrid(8, 16, 5);

//velY[0] = 50000;
//velX[0] = 50000;

radii[32] = 64;
posY[32] = 400;
posX[32] = 400;
mass[32] = 256;
velY[32] = -500;
velX[32] = -500;

var FORCES = true;
DEBUGGING = false;
LOGGING = false;
ERRORS = false;