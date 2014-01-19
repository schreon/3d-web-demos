/*
  Force calculation here
*/

function calcForces(timeStep){
  for(var i=0; i < numBodies; i++){
      oldAccX[i] = accX[i];
      oldAccY[i] = accY[i];
      accX[i] = 0;
      accY[i] = 0;
  }
  if(GLOBAL_GRAVITY == true){
    calcGravityForce();
  } 
  // calcCenterGravity();
  //calcAirFrictionForce();
  //calcConstFrictionForce();
}

// The nearer, the stronger
function calcCenterGravity(){
  var directionX;  
  var directionY;
  var normalX;
  var normalY;
  var distance;
  var factor;
  for(var i=0; i < numBodies; i++){
    directionX = 0-posX[i];
    directionY = 0-posY[i];
    distance = vecLength(directionX, directionY);
    distance = Math.max(distance, 1.0); // don't !
    normalX = directionX/distance;
    normalY = directionY/distance;
    factor = forceCenterGravity/distance;
    accX[i] += normalX*factor;
    accY[i] += normalY*factor;
  }
}

function calcGravityForce(){
  accY.each(function(i){
    // only apply if not touching bottom already
    this[i] -= forceGravity;
  });
}

function calcAirFrictionForce(){
  accY.each(function(i){
   accY[i] -= forceAirFriction*velY[i]/mass[i];
   accX[i] -= forceAirFriction*velX[i]/mass[i];
 });
}

function calcConstFrictionForce(){
  accY.each(function(i){
   accY[i] -= forceConstFriction*Math.sign(velY[i]);
   accX[i] -= forceConstFriction*Math.sign(velY[i]);
 });
}

function calcDragForce(){
  // TODO
}