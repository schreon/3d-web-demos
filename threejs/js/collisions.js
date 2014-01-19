

var COL_PAIR = 0, COL_LEFT = 1, COL_TOP = 2, COL_RIGHT = 3, COL_BOTTOM=4;

var maxDepth = Infinity;
var running = true;

function moveToNextCollision(timeDelta){
  if (!running) return;
  var depth = 1;

  // Build collision times
  var collisionTimes = [];
  var colliders = [];
  var collTypes = [];  
  var timeDivision = timeDelta/4.0; // divide into 4 steps

  findCollisions(collisionTimes, colliders, collTypes, timeDelta);

  var timeSum = 0;
  if(collisionTimes.length > 0){
    // Move to earliest collision
    var minTime, minIndex, firstColliders;

    while(collisionTimes.length > 0 && timeSum < timeDelta && depth < maxDepth && running){
      depth++;
      
      minIndex = collisionTimes.getMinIndex();
      minTime  = collisionTimes[minIndex];
      updateVelocities(minTime);
      updatePositions(minTime);
      
      // Solve all collisions up to minTime
      for(var i=0; i < collTypes.length; i++){
        if(collisionTimes[i] <= minTime){
          solveCollision(collTypes[i], colliders[i]);
        }
      }

      timeSum += minTime;

      // Recalculate
      collisionTimes = [];
      colliders = [];
      collTypes = [];
      findCollisions(collisionTimes, colliders, collTypes, timeDelta);
    }
  }

  if(timeSum < timeDelta){
    updatePositions(timeDelta - timeSum); // Move by remaining time
  }  
}

function solveCollision(collType, colliders){
    switch (collType){
      case COL_LEFT:
          solveLeftWallCollision(colliders[0]);
          blacklist = [];
          propagateImpulse(colliders[0]);
          break;
      case COL_RIGHT:
          solveRightWallCollision(colliders[0]);
          blacklist = [];
          propagateImpulse(colliders[0]);
          break;
      case COL_TOP:
          solveTopWallCollision(colliders[0]);
          blacklist = [];
          propagateImpulse(colliders[0]);
          break;
      case COL_BOTTOM:
          solveBottomWallCollision(colliders[0]);
          blacklist = [];
          propagateImpulse(colliders[0]);
          break;
      case COL_PAIR:
          solvePairCollision(colliders[0], colliders[1]);
          //propagate impulses directly for better performance
          blacklist = [colliders[1]];
          propagateImpulse(colliders[0]);
          blacklist = [colliders[0]];
          propagateImpulse(colliders[1]);
          break;
      default:
          log("No solver found for type: "+solveTypes[i]);
  
  }
}

function findCollisions(collisionTimes, colliders, collTypes, timeDelta){
  for(var i=0; i < numBodies; i++){
    for(var j=i+1; j < numBodies; j++){
        colTime = findCollisionTime(i, j);
          if(colTime >= 0 && colTime <= timeDelta){
        collisionTimes.push(colTime);
        colliders.push([i,j]);
        collTypes.push(COL_PAIR);
      }
    }
    colTime = findLeftWallCollisionTime(i);
    if(colTime >= 0 && colTime <= timeDelta){
      collisionTimes.push(colTime);
      colliders.push([i, undefined]);
      collTypes.push(COL_LEFT);
    }
    colTime = findRightWallCollisionTime(i);
    if(colTime >= 0 && colTime <= timeDelta){
      collisionTimes.push(colTime);
      colliders.push([i, undefined]);
      collTypes.push(COL_RIGHT);
    }
    colTime = findTopWallCollisionTime(i);
    if(colTime >= 0 && colTime <= timeDelta){
      collisionTimes.push(colTime);
      colliders.push([i, undefined]);
      collTypes.push(COL_TOP);
    }
    colTime = findBottomWallCollisionTime(i);
    if(colTime >= 0 && colTime <= timeDelta){
      collisionTimes.push(colTime);
      colliders.push([i, undefined]);
      collTypes.push(COL_BOTTOM);
    }
  }
}

function removeTimesOf(times, colliders, types, rem1, rem2){
  var newTimes = [];
  var newColliders = [];
  var newTypes = [];
  var i=0;
  while(i < times.length){
    if(colliders[i][0] == rem1 || colliders[i][0] == rem2
      || colliders[i][1] == rem1 || colliders[i][1] == rem2){
      // nothing      
    }else{
      newTimes.push(times[i]);
      newColliders.push(colliders[i]);
    }
    i++;
  }
  return [newTimes, newColliders];
}

// Returns the time when the two bodies will collide, negative values if not or past
function findCollisionTime(i, j){
  if((velX[i] == 0) && (velY[i] == 0) && (velX[j] == 0) && (velY[j] == 0)){
    return -1; // no movement - no collision.
  } 
  var p_ab_x,p_ab_y,v_ab_x,v_ab_y,  r, a, b, c, disc, t, t1, t2, tMin;
  p_ab_x = posX[i] - posX[j];
  p_ab_y = posY[i] - posY[j];

  // If already intersecting, there is no collision!
  if(vecLength(p_ab_x, p_ab_y) < radii[i]+radii[j]){
    return -1;
  } 

  v_ab_x = velX[i] - velX[j];
  v_ab_y = velY[i] - velY[j];

  // If there is almost no velocity difference, make velocites equal and return
  if(Math.abs(v_ab_x) < 0.001 && Math.abs(v_ab_y) < 0.001){
    velX[i] = velX[j];
    velY[i] = velY[j];
    return -1;
  }


  r = radii[i]+radii[j] + EPSILON_TOUCH;

  a = v_ab_x * v_ab_x + v_ab_y*v_ab_y;
  b = 2*(p_ab_x*v_ab_x + p_ab_y*v_ab_y);
  c = (p_ab_x*p_ab_x+p_ab_y*p_ab_y) - r*r;

  disc = b*b - 4*a*c;
  if(disc >= 0){ // if there is a real solution ...                
      t1 = (-b + Math.sqrt(disc))/(2*a+EPSILON);
      t2 = (-b - Math.sqrt(disc))/(2*a+EPSILON);      
      return Math.min(t1, t2);
  }else{
    return -1;
  }
}

function findLeftWallCollisionTime(i){
  var leftTime; 
  // Future collisions
  leftDist  =  (wallLeft  - posX[i] + (radii[i]));
  leftTime  = leftDist/(velX[i]);
  return leftTime;
}

function findRightWallCollisionTime(i){
  var rightTime; 
  // Future collisions
  rightDist = (wallRight - posX[i] - (radii[i]));
  rightTime = rightDist/(velX[i]);
  return rightTime;
}

function findTopWallCollisionTime(i){
  var topTime; 
  // Future collisions
  topDist   = (wallTop - posY[i] - (radii[i]));
  topTime   = topDist/(velY[i]);
  return topTime;
}

function findBottomWallCollisionTime(i){
  var botTime; 
  // Future collisions
  botDist   = (wallBot - posY[i] + (radii[i]));
  botTime   = botDist/(velY[i]);
  return botTime;
}

// Same as findCollisionTime, but the second body is considered static
function findStaticCollisionTime(moving, statix){
  var i = moving;
  var j = statix;
  var p_ab_x,p_ab_y,v_ab_x,v_ab_y,  r, a, b, c, disc, t, t1, t2, tMin;
  p_ab_x = posX[i] - posX[j];
  p_ab_y = posY[i] - posY[j];

  v_ab_x = velX[i];
  v_ab_y = velY[i];

  // If there is almost no velocity difference, make velocites equal and return
  // if(Math.abs(v_ab_x) < 0.005 && Math.abs(v_ab_y) < 0.005){
  //   velX[i] = velX[j];
  //   velY[i] = velY[j];
  //   return -1;
  // }

  r = radii[i]+radii[j];

  a = v_ab_x * v_ab_x + v_ab_y*v_ab_y;
  b = 2*(p_ab_x*v_ab_x + p_ab_y*v_ab_y);
  c = (p_ab_x*p_ab_x+p_ab_y*p_ab_y) - r*r;

  disc = b*b - 4*a*c;
  if(disc >= 0){ // if there is a real solution ...                
      t1 = (-b + Math.sqrt(disc))/(2*a);
      t2 = (-b - Math.sqrt(disc))/(2*a);

      return Math.min(t1, t2);
  }else{
    return -1;
  }
}


var nX, nY, unX, unY, utX, utY;
var vn_i, vt_i, vn_j, vt_j;
var d_points, d_bodies;
var massSum;
var res_t_i, res_n_i, res_t_j, res_j_i;
function solvePairCollision(i, j){
  if(velX[i] == 0 && velY[i] == 0 && velX[j] == 0 && velY[j] == 0)
    throw "Total zero velocities - should not be a collision.";
  // debug(" vel ["+i+"]: "+velX[i]+" | "+velY[i]+ " pos: "+posX[i]+" | "+posY[i]);
  // debug(" vel ["+j+"]: "+velX[j]+" | "+velY[j]+ " pos: "+posX[j]+" | "+posY[j]);
  // throw "debug stop";
  // running = false;

  

  // Normal
  nX = posX[i] - posX[j];
  nY = posY[i] - posY[j];

  // Distances
  d_points = vecLength(nX, nY);
  d_bodies = d_points - (radii[i]+radii[j]);

  // Dont collide stuck objects!
  if(d_bodies < 0) return;

  // Unit normal
  unX = nX / (d_points + EPSILON); 
  unY = nY / (d_points + EPSILON);

  // Unit tangent
  utX = -unY;
  utY = unX;

  // Scalar velocities
  vn_i = vecDot(unX, unY, velX[i], velY[i]); // can be zero
  vn_j = vecDot(unX, unY, velX[j], velY[j]); // can be zero

  vt_i = vecDot(utX, utY, velX[i], velY[i]); // can be zero   
  vt_j = vecDot(utX, utY, velX[j], velY[j]); // can be zero

  res_t_i = vt_i;
  res_t_j = vt_j;

  massSum = mass[i]+mass[j];

  res_n_i = (vn_i*(mass[i]-mass[j])+2*mass[j]*vn_j)/massSum;
  res_n_j = (vn_j*(mass[j]-mass[i])+2*mass[i]*vn_i)/massSum;

  // Final velocities
  velX[i] = res_t_i*utX + res_n_i*unX;
  velY[i] = res_t_i*utY + res_n_i*unY;

  velX[j] = res_t_j*utX + res_n_j*unX;
  velY[j] = res_t_j*utY + res_n_j*unY;
}

// TODO: methods to detect current and future collisions
function countOverlaps(){
    
    var count = 0;
    var dist;

    // Body overlaps
    for(var i=0; i < numBodies; i++){
        for(var j=i+1; j < numBodies; j++){
            dist = vecDist(posX[i],posY[i],posX[j],posY[j])-(radii[i]+radii[j]);
            if(dist < 0){
                error("BODY OVERLAP: "+dist+"\n"
                +"\n EPSILON: "+EPSILON
                +"\n iX: "+posX[i]
                +"\n iY: "+posY[i]
                +"\n jX: "+posX[j]
                +"\n jY: "+posY[j]);
                count+=1;
            }
        }
    }

    // Wall overlaps
    for(var i=0; i < numBodies; i++){
                // Distances to the walls
        dist  =  (wallLeft  - posX[i] + radii[i]);
        if(dist > 0){
            error("WALL OVERLAP LEFT: "+dist+"\n"
                +"\n EPSILON: "+EPSILON
                +"\n iX: "+posX[i]
                +"\n iY: "+posX[i]);
                count+=1;
        }

        dist = (wallRight - posX[i] - radii[i]);
        if(dist < 0){
            error( "WALL OVERLAP RIGHT: "+dist+"\n"
                +"\n EPSILON: "+EPSILON
                +"\n iX: "+posX[i]
                +"\n iY: "+posX[i]);
                count+=1;
        }

        dist   = (wallTop - posY[i] - radii[i]);
        if(dist < 0){
            error( "WALL OVERLAP TOP: "+dist+"\n"
                +"\n EPSILON: "+EPSILON
                +"\n iX: "+posX[i]
                +"\n iY: "+posX[i]);
                count+=1;
        }

        dist   = (wallBot - posY[i] + radii[i]);
        if(dist > 0){
            error( "WALL OVERLAP BOT: "+dist+"\n"
                +"\n EPSILON: "+EPSILON
                +"\n iX: "+posX[i]
                +"\n iY: "+posX[i]);
                count+=1;
        }
    }

    return count;
}

function applySolveVectors(){
  for(var i=0; i < numBodies; i++){
    velX[i] += solvX[i];
    velY[i] += solvY[i];
    solvX[i] = 0;
    solvY[i] = 0;

    // kill too small velocities
    if(Math.abs(velX[i]) < velocityThreshold) velX[i] = 0.0;
    if(Math.abs(velY[i]) < velocityThreshold) velY[i] = 0.0;
  }
}

function solveBottomWallCollision(colIndex){
    //log("solve BOT");
    // get direction
    var vl = Math.abs(velY[colIndex]);
    // just point up
    velY[colIndex] = forceElasticity*vl;
    velX[colIndex] *= forceWallFriction;
    log(" velX[colI]: "+velX[colIndex]);
    log(" velY[colI]: "+velY[colIndex]);
}

function solveTopWallCollision(colIndex){
    //log("solve TOP");
    // get direction
    var vl = Math.abs(velY[colIndex]);
    // just point up
    velY[colIndex] = -forceElasticity*vl;
    velX[colIndex] *= forceWallFriction;
    log(" velX[colI]: "+velX[colIndex]);
    log(" velY[colI]: "+velY[colIndex]);
}

function solveLeftWallCollision(colIndex){
    // get direction
    var vl = Math.abs(velX[colIndex]);
    // just point up
    velX[colIndex] = 1*forceElasticity*vl;
    velY[colIndex] *= forceWallFriction;
    log(" velX[colI]: "+velX[colIndex]);
    log(" velY[colI]: "+velY[colIndex]);
}

function solveRightWallCollision(colIndex){
    // get direction
    var vl = Math.abs(velX[colIndex]);    
    // just point up
    velX[colIndex] = -1*forceElasticity*vl;
    velY[colIndex] *= forceWallFriction;
    log(" velX[colI]: "+velX[colIndex]);
    log(" velY[colI]: "+velY[colIndex]);
}


// Give all elements within EPSILON range
function getTouchees(i){
  var touchees = [];
  // 1. find touching elements
  for(var j=0; j < numBodies; j++){
    if(j != i){
      if(bodyDistance(i, j) <= EPSILON_TOUCH+EPSILON){
        touchees.push(j);
      }
    }
  }
  return touchees;
}


/*
  TODO:
  - Propagate impulse to complete touchee chain
  - Bodies touching a wall propagate the impulse back instantly
  - Should increase performance when large mass hits a cluster of bodies  
*/
function getRecursiveTouchees(i){
  var rec_touchees = [];
  var touchees = getTouchees(i);
  for(var i=0; i < )
}


function touchesLeftWall(i){
  return (wallLeft  - posX[i] + (radii[i])) > -EPSILON_TOUCH;
}

function touchesRightWall(i){
  return (wallRight - posX[i] - (radii[i])) < EPSILON_TOUCH;
}

function touchesTopWall(i){
  return (wallTop - posY[i] - (radii[i])) < EPSILON_TOUCH;
}

function touchesBottomWall(i){
  return (wallBot - posY[i] + (radii[i])) > -EPSILON_TOUCH;
}

function propagateImpulse(colI, blacklist){
  var touchees = getRecursiveTouchees(colI);
  touchees.removeAll(blacklist); // remove blacklisted bodies to prevent loop
  
  collisions = [];
  for(var t=0; t < touchees.length; t++){
    solvePairCollision(colI, touchees[t]); // Propagate the impulse
  }
  applySolveVectors();
}