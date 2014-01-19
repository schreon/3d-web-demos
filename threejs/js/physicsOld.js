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
            log("(X) Step");
            for(var i=0; i < numBodies; i++){
                  debug(" vel ["+i+"]: "+velX[i]+" | "+velY[i]+ " pos: "+posX[i]+" | "+posY[i]);
            }
            debug("# overlaps: "+countOverlaps());
            debug("# next collision: "+collisionTimes[minIndex]);
            debug("deltaMillis: "+deltaMillis);
            debug("deltaSeconds: "+deltaSeconds+"\n----------")
            GLOBAL_STATE_PAUSED = false;
            DEBUGGING = true;
            LOGGING = true;
            ERRORS = true;
            break;
        case "drag" : // Calls the physics loop
            // TODO: Client sends information about which element should be dragged somewhere
            break;
        case "doUpdate" : // Calls the physics loop
            doUpdate();
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
    self.postMessage({cmd:"onUpdate", posX:posX, posY:posY, velX:actVelX, velY:actVelY, radii:radii
                                   , debugInfo:debugInfo
    });
}

// Puts the circles into a grid
function createGrid(w, r, pad){
  for(var i=0; i < numBodies; i++){
      radii[i] = r;
      posX[i]  = (i%w)*(r*2+pad)- (r*2+pad)*0.5*w + r;
      posY[i]  = Math.floor(i/w)*(r*2+pad)- (r*2+pad)*0.5*w + r;
      mass[i]  = 1;
  }
}

var debugInfo = {}

var posX, posY, radii;
var velX, velY;
var actVelX, actVelY; // Actual velocities, constrained; used for actual movement
var accX, accY; // Current acceleration
var oldAccX, oldAccY; // Old acceleration

var GLOBAL_STATE_PAUSED = false;

importScripts("config.js");
importScripts("forces.js");
importScripts("collisions.js");

function init(){
  sendInitFinished();
  measureTime(); // go delta seconds go!
  if(DEBUGGING) GLOBAL_STATE_PAUSED = true; 
}

function doUpdate(){
    measureTime(); // fills deltaSeconds with the time which passed since the last call
    if(!GLOBAL_STATE_PAUSED) calcPhysics();
    sendUpdate();
}

function calcPhysics(){
  if(FORCES) calcForces();
  updateVelocities(deltaSeconds);
  moveToNextCollision(deltaSeconds);
}

function updatePositions(timeStep){
  // Copy velocities to constrained velocities
  for(var i=0; i < numBodies; i++){      
      actVelX[i] = velX[i];
      actVelY[i] = velY[i];
  }

  // Apply constraints
  applyVelocityConstraints(i, timeStep);
 
  // Apply constrained velocities
  for(var i=0; i < numBodies; i++){      
      posX[i] += timeStep*actVelX[i];
      posY[i] += timeStep*actVelY[i];
  }
}

function updateVelocities(timeStep){
    for(var i=0; i < numBodies; i++){    
        // From Velocity Verlet Method    
        velX[i] += timeStep*0.5*(oldAccX[i] + accX[i]);
        velY[i] += timeStep*0.5*(oldAccY[i] + accY[i]);

        // kill too small velocities
        if(Math.abs(velX[i]) < velocityThreshold) velX[i] = 0.0;
        if(Math.abs(velY[i]) < velocityThreshold) velY[i] = 0.0;
    }
}

// Resolves things that are already broken
function applyPositionConstraints(i){
  applyWallConstraint(i);
  applyPairConstraint(i);
}

// Prevents bad things from happening!
// Only works within the EPSILON_TOUCH range to prevent other strange things!
// Splits steps in X and Y component so only the colliding side is pruned
function applyVelocityConstraints(i, timeStep){
  /* Works like this:
    - prunes the X and Y timestep component until everything is ok
  */
  for(var i=0; i < numBodies; i++){

    pruneVelocityVsWalls(i, timeStep);
    for(var j=i+1; j < numBodies; j++){
      applyMinDistConstraint(i, j, radii[i]+radii[j], timeStep);
    }
  }
}

function pruneVelocityVsWalls(i, timeStep){
  if(timeStep == 0) return;
  var dist, way;

  dist = (wallLeft  - posX[i] + radii[i]);
  if(dist > 0) {
    actVelX[i] += dist/timeStep;
  }

  dist = (wallRight - posX[i] - radii[i]);
  if(dist < 0) {
    actVelX[i] += dist/timeStep;
  }

  dist = (wallTop - posY[i] - radii[i]);
  if(dist < 0) {
    actVelY[i] += dist/timeStep;
  }

  dist = (wallBot - posY[i] + radii[i]);
  if(dist > 0) {
    actVelY[i] += dist/timeStep;
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
  if(currDist == 0) currDist = Math.sign(currDist)*EPSILON;

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

function applyWallConstraint(i){
  var dist;
  dist  =  (wallLeft  - posX[i] + radii[i]);
  if(dist > 0) posX[i] = wallLeft + radii[i];

  dist = (wallRight - posX[i] - radii[i]);
  if(dist < 0) posX[i]  = wallRight - radii[i];

  dist   = (wallTop - posY[i] - radii[i]);
  if(dist < 0) posY[i]  = wallTop - radii[i];

  dist   = (wallBot - posY[i] + radii[i]);
  if(dist > 0) posY[i]  = wallBot + radii[i];
}

function applyPairConstraint(i){
  var dist, bodydist, normX, normY;
  for(var j=0; j<numBodies; j++){
    if(i!=j){
      normX = posX[i] - posX[j];
      normY = posY[i] - posY[j];
      dist = vecLength(normX, normY);
      bodydist = dist - radii[i] - radii[j];
      // Move out of the other object!
      // (collision is handled separately in collision.js)
      if(bodydist < 0){
        normX /= (dist+EPSILON);
        normY /= (dist+EPSILON);
        posX[i] += Math.abs(bodydist)*normX;
        posY[i] += Math.abs(bodydist)*normY;
      }
    }
  }
}