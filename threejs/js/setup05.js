var fieldWidth  = 800;
var fieldHeight = 800;

var numBodies   = 65;
var minRadius   = 40;
var maxRadius   = 40;

var wallLeft = -fieldWidth/2;
var wallTop = fieldHeight/2;
var wallRight = fieldWidth/2;
var wallBot = -fieldHeight/2;

var forceElasticity = 0.5;
var forceWallFriction = 0.8;
var forceConstFriction = 0.1;
var forceAirFriction = 0.05;
var forceBodyFriction = 0.01;
var forceGravity = 981;
var forceCenterGravity = 0.0;

var EPSILON_TOUCH = 0.01;
var EPSILON_TIME = 0.001;
var velocityThreshold = 0.01;


function customInit(){
  mass = new Float64Array(numBodies);
  imass =  new Float64Array(numBodies);
  radii = new Float64Array(numBodies);

  posX = new Float64Array(numBodies);
  posY = new Float64Array(numBodies);

  oldPosX = new Float64Array(numBodies);
  oldPosY = new Float64Array(numBodies);

  accX = new Float64Array(numBodies);
  accY = new Float64Array(numBodies);

  oldAccX = new Float64Array(numBodies);
  oldAccY = new Float64Array(numBodies);

  velX = new Float64Array(numBodies);
  velY = new Float64Array(numBodies);

  createGrid(8, 20, 8);

  //velY[0] = 50000;
  //velX[0] = 50000;

  radii[numBodies-1] = 64;

  posX[numBodies-1] = 0;
  posY[numBodies-1] = wallTop-radii[numBodies-1];
  oldPosX[numBodies-1] = 0;
  oldPosY[numBodies-1] = posY[numBodies-1];
  mass[numBodies-1] = 999999.0;
  imass[numBodies-1] = 1.0/mass[numBodies-1]
}

var FORCES = true;
DEBUGGING = false;
LOGGING = false;
ERRORS = false;