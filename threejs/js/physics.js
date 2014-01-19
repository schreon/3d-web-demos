/* 
    PHYSICS covering CIRCLES
*/

/* Plan:

  * step-by-step collision detection + resolution
  * click through time steps
  * 2D modes:
    - collision-free: animated simulation
    - collision-mode: like a "debug-mode", step through collision detection + resolution events

Client to Physics:
- doStep();

Physics to Client:
- posX, posY  // all positions
- velX, velY  // all velocities
- currentCollision:
  * boolean collisionExists // whether a new collision occured or not
  * index colliderA 
  * index colliderB
  * normalX, normalY // collision normal
  * newVelX, newVelY // resolved collision vectors
*/

importScripts("boilerplate.js");

/* *********** Register new API functions here ***********   */
self.addEventListener('message', function(message){    
    message = message.data;
    switch (message.cmd) {
        case "echo" : 
            self.postMessage({cmd:"echo", txt:message.txt});
            break;
        case "time" : 
            var time = (new Date()).getTime();
            self.postMessage({cmd:"time", time:(time-lastTime)})
            lastTime = time
            break;
        case "init" : 
            init(message.numBodies);
            break;
        case "doNextStep" : // Calls the physics loop
            // GLOBAL_STATE_PAUSED = !GLOBAL_STATE_PAUSED;
            // if(!GLOBAL_STATE_PAUSED){
            //   customInit();
            //   debug("Physics ON");
            // }else{
            //   debug("Physics OFF");
            //   debug("accX[1]: "+accX[1]);
            //   debug("accY[1]: "+accY[1]);
            // }
            customInit();
            //GLOBAL_STATE_PAUSED = true;
            break;
        case "drag" : // Calls the physics loop
            // TODO: Client sends information about which element should be dragged somewhere
            break;
        case "doUpdate" : // Calls the physics loop
            doUpdate();
            break;
        case "doFire" : // Calls the physics loop
            doFire(message.fireX, message.fireY);
            break;
        case "doToggleGravity" : // Calls the physics loop
            doToggleGravity();
            break;
    }
});

/* *********** Notify host that the initialization is finished **************** */
function sendInitFinished(){    
   // TODO: sendUpdate function sending the current game state to the main controller
   self.postMessage({cmd:"onInitFinished", fieldWidth:fieldWidth, fieldHeight:fieldHeight, posX:posX, posY:posY, radii:radii, debugInfo:debugInfo});
}

/* *********** Notify host that the calculation is finished **************** */
function sendUpdate(){       
    // sendUpdate function sending the current game state to the main controller
    self.postMessage({cmd:"onUpdate", posX:posX, posY:posY, radii:radii, debugInfo:debugInfo
    });
}

var debugInfo = {}

var mass;
var imass;
var posX, posY, radii;
var oldPosX, oldPosY;
var accX, accY;
var oldAccX, oldAccY;
var velX, velY; // implicit! read-only

var GLOBAL_STATE_PAUSED = false; // Start paused
var GLOBAL_GRAVITY = false;

importScripts("config.js");
importScripts("forces.js");
//importScripts("collisions.js");

function init(){
  customInit();
  sendInitFinished();
  measureTime(); // go delta seconds go!

}

var freq = 1.0/60;
function doUpdate(){
    var timeStep = measureTime(); // fills deltaSeconds with the time which passed since the last call
    if(!GLOBAL_STATE_PAUSED) calcPhysics(freq);
    sendUpdate();
}

function doFire(fireX, fireY){
  debug("FIRE: "+fireX+"|"+fireY);
  oldPosX[numBodies-1] -= fireX;
  oldPosY[numBodies-1] -= fireY;
}

function doToggleGravity(){
  debug("Toggling gravity");
  GLOBAL_GRAVITY = !GLOBAL_GRAVITY;
}

function calcPhysics(timeStep){
  // debug(timeStep);
  // Do 100 steps
  // debug(timeStep);
  // debug(subStep);
  // GLOBAL_STATE_PAUSED = true;    

  var stepnum = 8;
  var subStep = timeStep / stepnum;
  for(var i=0; i < stepnum; i++){
    calcForces(subStep);
    accelerate(subStep);
    collideBodies(false);
    correctWalls();
    inertia(subStep);
    collideBodies(false);
    collideWalls();
  }
}

// update by verlet method
function accelerate(timeStep){
  var deltaSquared = timeStep*timeStep;
  for(var i=0; i < numBodies; i++){
    posX[i] += deltaSquared*accX[i];
    posY[i] += deltaSquared*accY[i];
  }
}

// update by verlet method
function inertia(timeStep){
  var deltaSquared = timeStep*timeStep;
  for(var i=0; i < numBodies; i++){
    velX[i] = posX[i] - oldPosX[i];
    velY[i] = posY[i] - oldPosY[i];
    oldPosX[i] = posX[i];
    oldPosY[i] = posY[i];
    posX[i] += velX[i];
    posY[i] += velY[i];
  }
}

function correctWalls(){
  for(var i=0; i < numBodies; i++){
    dist = (wallLeft  - posX[i] + radii[i]);
    if(dist > 0) {
      posX[i] += dist;
    }

    dist = (wallRight - posX[i] - radii[i]);
    if(dist < 0) {
      posX[i] += dist;
    }

    dist = (wallTop - posY[i] - radii[i]);
    if(dist < 0) {
      posY[i] += dist;
    }

    dist = (wallBot - posY[i] + radii[i]);
    if(dist > 0) {
      posY[i] += dist;
    }
  }
}

function collideWalls(){
  for(var i=0; i < numBodies; i++){
    dist = (wallLeft  - posX[i] + radii[i]);
    if(dist > 0) {
      var vx = (oldPosX[i] - posX[i])*forceElasticity;
      posX[i] += dist;
      oldPosX[i] = posX[i] - vx;
    }

    dist = (wallRight - posX[i] - radii[i]);
    if(dist < 0) {
      var vx = (oldPosX[i] - posX[i])*forceElasticity;
      posX[i] += dist;
      oldPosX[i] = posX[i] - vx;
    }

    dist = (wallTop - posY[i] - radii[i]);
    if(dist < 0) {
      var vy = (oldPosY[i] - posY[i])*forceElasticity;
      posY[i] += dist;
      oldPosY[i] = posY[i] - vy;
    }

    dist = (wallBot - posY[i] + radii[i]);
    if(dist > 0) {
      var vy = (oldPosY[i] - posY[i])*forceElasticity;
      posY[i] += dist;
      oldPosY[i] = posY[i] - vy;
    }
  }
}

function collideBodies(preserve_impulse){
  for(var i=0; i<numBodies; i++){
    for(var j=i+1; j<numBodies; j++){
      var x = posX[i] - posX[j] + 0.00001*(Math.random()-0.5); // We always have a little jitter
      var y = posY[i] - posY[j] + 0.00001*(Math.random()-0.5);
      var slength = x*x+y*y;
      var length = Math.sqrt(slength);
      var xn = x/length;
      var yn = y/length;
      var target = radii[i] + radii[j];

      if(length < target){
        var factor = (length-target)/((imass[i]+imass[j]));
        posX[i] -= xn*imass[i]*factor;
        posY[i] -= yn*imass[i]*factor;
        posX[j] += xn*imass[j]*factor;
        posY[j] += yn*imass[j]*factor;

        if(preserve_impulse){ // only if approaching
          var v1x = posX[i] - oldPosX[i];
          var v1y = posY[i] - oldPosY[i];
          var v2x = posX[j] - oldPosX[j];
          var v2y = posY[j] - oldPosY[j];

          var f1 = imass[j]*(forceElasticity*(x*v1x+y*v1y))/(slength*(imass[i]+imass[j]));
          var f2 = imass[i]*(forceElasticity*(x*v2x+y*v2y))/(slength*(imass[i]+imass[j]));

          v1x += f2*x-f1*x;
          v1y += f2*y-f1*y;

          v2x += f1*x-f2*x;
          v2y += f1*y-f2*y;

          oldPosX[i] = posX[i] - v1x;
          oldPosY[i] = posY[i] - v1y;

          oldPosX[j] = posX[j] - v2x;
          oldPosY[j] = posY[j] - v2y;
        }
      }
    }
  }
}

function applyMinDistConstraint(i, j, rodLength, timeStep){
  if(timeStep == 0) return;

  // Collision normal
  // hypothetical positions in the future
  // axisX = posX[i]+timeStep*velX[i] - (posX[j]+timeStep*velX[j]);
  // axisY = posY[i]+timeStep*velY[i] - (posY[j]+timeStep*velY[j]);
  axisX = posX[i]-posX[j];
  axisY = posY[i]-posY[j];

  if(axisX == 0 && axisY == 0){
    axisX = Math.random();
    axisY = Math.random();
  }

  currDist = vecLength(axisX, axisY);
  if(currDist == 0) currDist = EPSILON;

  mDist = radii[i]+radii[j];
  relDist = currDist - mDist;
  if(relDist > 0) return;

  unitX = axisX / currDist;
  unitY = axisY / currDist;

  relVel = vecDot(velX[i] - velX[j], velY[i] - velY[j], unitX, unitY);

  removeVel = relVel + relDist/timeStep;
 
  impulse = removeVel / (mass[i] + mass[j]);

  actVelX[i] -= mass[j]*impulse*unitX;
  actVelY[i] -= mass[j]*impulse*unitY;
  actVelX[j] += mass[i]*impulse*unitX;
  actVelY[j] += mass[i]*impulse*unitY;
}