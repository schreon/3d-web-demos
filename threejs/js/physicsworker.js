/* 
    PHYSICS covering CIRCLES
*/

var LOGGING = false;
var DEBUGGING = false;

/* ***********  Utility *********** */
var self = this;

var oldTime = (new Date()).getTime();
var deltaSeconds, newTime;
function measureTime(){ // All values are understood as "per second"
    newTime = (new Date()).getTime();
    deltaSeconds = 0.001*Math.max(newTime - oldTime, 1);
    oldTime = newTime;
    return deltaSeconds;
}

Math.nrand = function() {
    var x1, x2, rad;
 
    do {
        x1 = 2 * this.random() - 1;
        x2 = 2 * this.random() - 1;
        rad = x1 * x1 + x2 * x2;
    } while(rad > 1 || rad == 0);
 
    var c = this.sqrt(-2 * Math.log(rad) / rad);
 
    return x1 * c;
};

Math.sign = function(x){
    if(x < 0){
        return -1
    }else{
        if(x > 0){
            return 1;
        }else{
            return x;
        }
    }
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

function containsUndefined(arr){
    for(var i=0; i < arr.length; i++){
        if(arr[i] == undefined) return true;
    }
    return false;
}

function vecLength(x,y){
    return Math.sqrt(x*x + y*y);
}

function vecDot(x1,y1, x2,y2){
    return x1*x2+y1*y2;
}

function vecDist(x1,y1, x2,y2){
    return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
}

function vecAngle(x1,y1, x2,y2){
    return Math.acos(vecDot(x1,y1, x2,y2)/((vecLength(x1,y1)*vecLength(x2,y2)))+EPSILON);
}

function createFunctionFromString(str){
    eval("var func = "+str);
    return func;
}

// Interpolation between 2 function values.
function linearInterpolation(x, begin, valueBegin, end, valueEnd){
    if(x < begin)
        return valueBegin;
    if(x > end)
        return valueEnd;
    return valueBegin + (x-begin)/(end-begin+EPSILON)*(valueEnd-valueBegin);
}

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
        case "doUpdate" : // Calls the physics loop
            doUpdate();
            break;
    }
});


/* *********** Logging functions ***********   */
function log(txt){    
    if(LOGGING){        
        var date = new Date();
        var timeStr = (date.getHours() < 10 ? "0"+date.getHours() : date.getHours())
            +":"+(date.getMinutes() < 10 ? "0"+date.getMinutes() : date.getMinutes())+":"
            +(date.getSeconds() < 10 ? "0"+date.getSeconds() : date.getSeconds());
        self.postMessage({cmd:"log", txt:"[LOG   "+timeStr+"] "+txt});
    }
}
function debug(txt){    
    var date = new Date();
    var timeStr = (date.getHours() < 10 ? "0"+date.getHours() : date.getHours())
        +":"+(date.getMinutes() < 10 ? "0"+date.getMinutes() : date.getMinutes())+":"
        +(date.getSeconds() < 10 ? "0"+date.getSeconds() : date.getSeconds());
    self.postMessage({cmd:"debug", txt:"[DEBUG "+timeStr+"] "+txt});
}
function error(txt){    
    var date = new Date();
    var timeStr = (date.getHours() < 10 ? "0"+date.getHours() : date.getHours())
        +":"+(date.getMinutes() < 10 ? "0"+date.getMinutes() : date.getMinutes())+":"
        +(date.getSeconds() < 10 ? "0"+date.getSeconds() : date.getSeconds());
    self.postMessage({cmd:"error", txt:"[ERROR "+timeStr+"] "+txt});
}


/* *********** Notify host that the initialization is finished **************** */
function sendInitFinished(){    
   // TODO: sendUpdate function sending the current game state to the main controller
   self.postMessage({cmd:"onInitFinished", posX:posX, posY:posY, anglesX:anglesX, anglesY:anglesY, radii:radii, debugInfo:debugInfo});
}

/* *********** Notify host that the calculation is finished **************** */
function sendUpdate(){       
    /* 
        The host is passed:
            - Current positions of all bodies 
            - Current angles of all bodies
            - Debug information
    */
    // TODO: sendUpdate function sending the current game state to the main controller
    self.postMessage({cmd:"onUpdate", posX:posX, posY:posY
                                   , anglesX:anglesX, anglesY:anglesY, radii:radii
                                   , debugInfo:debugInfo
    });
}

function doUpdate(){
    measureTime(); // fills deltaSeconds with the time which passed since the last call
    calcPhysics();
    sendUpdate();
}

/*´*********  Variable fields ************** */
var posX,
 posY,
 anglesX,
 anglesY,
 radii,
 debugInfo;

/* ******* Physics variables ****** */
var forcesX, forcesY; // Accumulate forces here
var accX, accY; // Current acceleration
var oldAccX, oldAccY; // Old acceleration
var velX, velY; // Current velocity of each body

function init(){
    // TODO: initialization
    posX = new Float64Array(numBodies);
    posY = new Float64Array(numBodies);
    radii   = new Float64Array(numBodies);

    forcesX = new Float64Array(numBodies);
    forcesY = new Float64Array(numBodies);

    accX = new Float64Array(numBodies);
    accY = new Float64Array(numBodies);

    oldAccX = new Float64Array(numBodies);
    oldAccY = new Float64Array(numBodies);

    velX    = new Float64Array(numBodies);
    velY    = new Float64Array(numBodies);

    var minX = wallLeft + maxRadius;
    var maxX = wallRight - maxRadius;
    var minY = wallTop + maxRadius;
    var maxY = wallBot - maxRadius;

    // initialize randomly
    for(var i=0; i < numBodies; i++){
        radii[i] = 20;

        posX[i] = (i%rowWidth-3.5)*(20*2+5);
        posY[i] = (Math.floor(i/rowWidth)-0.5)*(20*2+5);

        velX[i] = 100*(Math.random()-0.5) ;
        velY[i] = -300.0 ;
    }
    //removeOverlaps();
    // fixed for test

    sendInitFinished();
}

/* ****** Constant Fields ****** */
var EPSILON = 1e-6;
var numBodies = 16;
var rowWidth = 4;

//var maxVel = 1000.0;
//var minVel = -1000.0;

// Physics constants
var wallLeft = -400;
var wallTop = -200;
var wallRight = 400;
var wallBot = 200;

var minRadius = 5;
var maxRadius = 50;
var minMass = 1.0;
var maxMass = 10.0;

var forceGravity = 9.81;
var forceAirFriction = 0.23;   // Friction which is always applied
var forceBodyFriction = 0.5;  // Friction applied when two bodies touch each other
var forceWallFriction = 0.5;  // Friction applied when a body touches a wall
var forceElasticity = 0.9;    // Elasticity determines how strong bodies "bounce" off of each other and walls
var forceIntersection = 1000.0; // Spring force resolving intersections
var intersectionTolerance = 0.0001; // length of the tolerance spring <-- too small values lead to jitter, too big values lead to visible overlaps
var distTolerance = 0.05; 


/* FORCE CALCULATION */
function updateForces(){
    resetForces();
    calcGravityForce();
    //calcAirFrictionForce();
}

function updateAccelerations(timeStep){
    for(var i=0; i < numBodies; i++){      
        // TODO
        oldAccX[i] = accX[i];
        oldAccY[i] = accY[i];

        accX[i] = forcesX[i];
        accY[i] = forcesY[i];
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

// kills too small velocities
var velocityThreshold = 0.0001;
function cleanVelocities(){
    for(var i=0; i < numBodies; i++){
        if(Math.abs(velX[i]) < velocityThreshold) velX[i] = 0.0;
        if(Math.abs(velY[i]) < velocityThreshold) velY[i] = 0.0;
    }
}


function updatePositions(timeStep){
    for(var i=0; i < numBodies; i++){
        // From Velocity Verlet Method:
        posX[i] += timeStep*velX[i];
        posY[i] += timeStep*velY[i];
    }
}

function resetForces(){
    for(var i=0; i < numBodies; i++){
        forcesX[i] = 0;
        forcesY[i] = 0;
    }
}

var it = 0;
function calcPhysics(){
    if(DEBUGGING && it >= 3)
        throw "debug exit";

    //countOverlaps(); // throws err if there are overlaps

    updateForces();
    updateAccelerations();
    updateVelocities(deltaSeconds);
    //updatePositions(deltaSeconds);
    resolveCollisionsAndMove();
    
    // "Correction" forces - should not be necessary ...
    // calcBodyRepulsion();    // For existing overlaps/touches
    // calcWallRepulsion();    // For existing overlaps/touches

    if(containsUndefined(velX) || containsUndefined(velX)){
        throw "velocities contain undefined!";
    }
    log("X: "+posX[0]);
    log("Y: "+posY[0]);
    log("fX: "+forcesX[0]);
    log("fY: "+forcesY[0]);
    log("vX: "+velX[0]);
    log("vY: "+velY[0]);
    it += 1;
}




function calcWallRepulsion(){
    var dist;
    for(var i=0; i < numBodies; i++) {

        // Distances to the walls
        leftDist  =  (wallLeft  - posX[i] + radii[i]);
        rightDist = (wallRight - posX[i] - radii[i]);
        topDist   = (wallTop - posY[i] + radii[i]);
        botDist   = (wallBot - posY[i] - radii[i]);

        if(leftDist >= 0){
            velX[i] = forceWallFriction*Math.abs(velX[i]);
            forcesX[i] = 0;
        }
        if(rightDist <= 0){
            velX[i] = -forceWallFriction*Math.abs(velX[i]);
            forcesX[i] = 0;
        }
        if(topDist >= 0){
            velY[i] = forceWallFriction*Math.abs(velY[i]);
            forcesY[i] = 0;
        }
        if(botDist <= 0){
            velY[i] = -forceWallFriction*Math.abs(velY[i]);
            forcesY[i] = 0;
        }
    }
}

// repell + friction
function calcBodyRepulsion() {
    var dist;
    for(var colI=0; colI < numBodies; colI++){
        for(var colJ=colI+1; colJ < numBodies; colJ++){

            // collision normal    
            normX = posX[colI] - posX[colJ];
            normY = posY[colI] - posY[colJ];   
            dist = vecLength(normX, normY);
            if(dist - radii[colI] - radii[colJ] > 0)
                continue;

            norm = vecLength(normX, normY);  
            normX /= (norm + EPSILON);  
            normY /= (norm + EPSILON); 
          
            // Collision 
            vabX = velX[colI] - velX[colJ];    
            vabY = velY[colI] - velY[colJ];  

            j = -0.5*(1+forceElasticity)*vecDot(vabX,vabY,normX,normY) / (vecDot(normX,normY,normX,normY) + EPSILON);  

            velX[colI] = (velX[colI] + j*normX);    
            velY[colI] = (velY[colI] + j*normY);   
           
            velX[colJ] = (velX[colJ] - j*normX);  
            velY[colJ] = (velY[colJ] - j*normY);   
            
            // dn = linearInterpolation(Math.abs(dist - radii[colI] - radii[colJ]), 0, 0, intersectionTolerance, forceIntersection*Math.abs(dist));
            
            // forcesX[colI] += dn*normX;
            // forcesY[colI] += dn*normY;
            // forcesX[colJ] -= dn*normX;
            // forcesY[colJ] -= dn*normY;
        }
    }
    
}

function calcAirFrictionForce(){
    for(var i=0; i < numBodies; i++){
        forcesX[i] += -forceAirFriction*velX[i];
        forcesY[i] += -forceAirFriction*velY[i];
    }
}

function calcGravityForce(){
    for(var i=0; i < numBodies; i++){
        forcesY[i] += forceGravity;
    }
}

/* COLLISION DETECTION */

// TODO: methods to detect current and future collisions
function countOverlaps(){
    
    var count = 0;
    var dist;

    // Body overlaps
    for(var i=0; i < numBodies; i++){
        for(var j=i+1; j < numBodies; j++){
            dist = vecDist(posX[i],posY[i],posX[j],posY[j])-(radii[i]+radii[j]);
            if(dist < -EPSILON){
                throw "BODY OVERLAP: "+dist+"\n"
                +"\n EPSILON: "+EPSILON
                +"\n iX: "+posX[i]
                +"\n iY: "+posX[i]
                +"\n jX: "+posX[j]
                +"\n jY: "+posX[j];
                count+=1;
            }
        }
    }

    // Wall overlaps
    for(var i=0; i < numBodies; i++){
                // Distances to the walls
        dist  =  (wallLeft  - posX[i] + radii[i]) - EPSILON;
        if(dist > 0){
            throw "WALL OVERLAP: "+dist+"\n"
                +"\n EPSILON: "+EPSILON
                +"\n iX: "+posX[i]
                +"\n iY: "+posX[i]
                +"\n jX: "+posX[j]
                +"\n jY: "+posX[j];
                count+=1;
        }

        dist = (wallRight - posX[i] - radii[i]) + EPSILON;
        if(dist < 0){
            throw "WALL OVERLAP: "+dist+"\n"
                +"\n EPSILON: "+EPSILON
                +"\n iX: "+posX[i]
                +"\n iY: "+posX[i]
                +"\n jX: "+posX[j]
                +"\n jY: "+posX[j];
                count+=1;
        }

        dist   = (wallTop - posY[i] + radii[i]) - EPSILON;
        if(dist > 0){
            throw "WALL OVERLAP: "+dist+"\n"
                +"\n EPSILON: "+EPSILON
                +"\n iX: "+posX[i]
                +"\n iY: "+posX[i]
                +"\n jX: "+posX[j]
                +"\n jY: "+posX[j];
                count+=1;
        }

        dist   = (wallBot - posY[i] - radii[i]) + EPSILON;
        if(dist < 0){
            throw "WALL OVERLAP: "+dist+"\n"
                +"\n EPSILON: "+EPSILON
                +"\n iX: "+posX[i]
                +"\n iY: "+posX[i]
                +"\n jX: "+posX[j]
                +"\n jY: "+posX[j];
                count+=1;
        }
    }

    return count;
}

function calcAllWallCollisionTimes(collisionTimes, solveTypes, collidersI, collidersJ, timeDelta){
    var leftTime, rightTime, topTime , botTime; 
    for(var i=0; i < numBodies; i++) {
        // Future collisions
        leftTime  = (wallLeft  - posX[i] + radii[i])/(velX[i]);
        rightTime = (wallRight - posX[i] - radii[i])/(velX[i]);

        topTime   = (wallTop - posY[i] + radii[i])/(velY[i]);
        botTime   = (wallBot - (posY[i] + radii[i]))/(velY[i]);

        if(leftTime >= -EPSILON && velX[i] < 0 && leftTime <= timeDelta) {
            collisionTimes.push(Math.max(0, leftTime));
            solveTypes.push(COL_LEFT);
            collidersI.push(i);
            collidersJ.push(undefined);
        }

        if(rightTime >= -EPSILON && velX[i] > 0 && rightTime <= timeDelta) {
            collisionTimes.push(Math.max(0, rightTime));
            solveTypes.push(COL_RIGHT);
            collidersI.push(i);
            collidersJ.push(undefined);
        }

        if(topTime >= -EPSILON && velY[i] < 0 && topTime <= timeDelta) {
            collisionTimes.push(Math.max(0, topTime));
            solveTypes.push(COL_TOP);
            collidersI.push(i);
            collidersJ.push(undefined);
        }

        if(botTime >= -EPSILON && velY[i] > 0 && botTime <= timeDelta) {
            collisionTimes.push(Math.max(0, botTime));
            solveTypes.push(COL_BOT);
            collidersI.push(i);
            collidersJ.push(undefined);
        }
    }
}

function calcWallCollisionTimes(i, collisionTimes, solveTypes, collidersI, collidersJ, timeDelta){
    if(i == undefined)
        return;
    var leftTime, rightTime, topTime , botTime;
    // Future collisions
    leftTime  = (wallLeft  - posX[i] + radii[i])/(velX[i]);
    rightTime = (wallRight - posX[i] - radii[i])/(velX[i]);

    topTime   = (wallTop - posY[i] + radii[i])/(velY[i]);
    botTime   = (wallBot - (posY[i] + radii[i]))/(velY[i]);

    if(leftTime >= -EPSILON && velX[i] < 0 && leftTime <= timeDelta) {
        collisionTimes.push(Math.max(0, leftTime));
        solveTypes.push(COL_LEFT);
        collidersI.push(i);
        collidersJ.push(undefined);
    }

    if(rightTime >= -EPSILON && velX[i] > 0 && rightTime <= timeDelta) {
        collisionTimes.push(Math.max(0, rightTime));
        solveTypes.push(COL_RIGHT);
        collidersI.push(i);
        collidersJ.push(undefined);
    }

    if(topTime >= -EPSILON && velY[i] < 0 && topTime <= timeDelta) {
        collisionTimes.push(Math.max(0, topTime));
        solveTypes.push(COL_TOP);
        collidersI.push(i);
        collidersJ.push(undefined);
    }

    if(botTime >= -EPSILON && velY[i] > 0 && botTime <= timeDelta) {
        collisionTimes.push(Math.max(0, botTime));
        solveTypes.push(COL_BOT);
        collidersI.push(i);
        collidersJ.push(undefined);
    }
}

function calcAllPairCollisionTimes(collisionTimes, solveTypes, collidersI, collidersJ, timeDelta){
    // Minkowski sums of accuracy against each other
    var p_ab_x,p_ab_y,v_ab_x,v_ab_y,  r, a, b, c, disc, t, t1, t2, tMin;
    for(var i=0; i < numBodies; i++){
        for(var j=i+1; j < numBodies; j++){

            p_ab_x = posX[i] - posX[j];
            p_ab_y = posY[i] - posY[j];

            v_ab_x = velX[i] - velX[j];
            v_ab_y = velY[i] - velY[j];
            
            r = radii[i]+radii[j];

            a = v_ab_x * v_ab_x + v_ab_y*v_ab_y;
            b = 2*(p_ab_x*v_ab_x + p_ab_y*v_ab_y);
            c = (p_ab_x*p_ab_x+p_ab_y*p_ab_y) - r*r;

            disc = b*b - 4*a*c;
            if(disc >= 0){ // if there is a real solution ...                
                t1 = (-b + Math.sqrt(disc))/(2*a);
                t2 = (-b - Math.sqrt(disc))/(2*a);
                t = Math.min(t1, t2);

                if(t >= 0 && t <= timeDelta){
                    collisionTimes.push(Math.max(t, 0));
                    collidersI.push(i);
                    collidersJ.push(j);
                    solveTypes.push(COL_PAIR);
                }
            }

        }
    }
}

function calcPairCollisionTimes(i, collisionTimes, solveTypes, collidersI, collidersJ, timeDelta){
    if(i == undefined)
        return;
    // Minkowski sums of accuracy against each other
    var p_ab_x,p_ab_y,v_ab_x,v_ab_y,  r, a, b, c, disc, t, t1, t2, tMin;
    for(var j=0; j < numBodies; j++){
        if(i == j) continue;

        p_ab_x = posX[i] - posX[j];
        p_ab_y = posY[i] - posY[j];

        v_ab_x = velX[i] - velX[j];
        v_ab_y = velY[i] - velY[j];
        
        // // Not approaching each other
        // if(v_ab_x*p_ab_x+v_ab_y*p_ab_y >= 0)
        //     continue;

        r = radii[i]+radii[j];

        a = v_ab_x * v_ab_x + v_ab_y*v_ab_y;
        b = 2*(p_ab_x*v_ab_x + p_ab_y*v_ab_y);
        c = (p_ab_x*p_ab_x+p_ab_y*p_ab_y) - r*r;

        disc = b*b - 4*a*c;
        if(disc >= 0){ // if there is a real solution ...                
            t1 = (-b + Math.sqrt(disc))/(2*a);
            t2 = (-b - Math.sqrt(disc))/(2*a);
            t = Math.min(t1, t2);

            if(t >= 0 && t <= timeDelta){
                collisionTimes.push(Math.max(t, 0));
                collidersI.push(i);
                collidersJ.push(j);
                solveTypes.push(COL_PAIR);
            }
        }
    }
}

/* COLLISION SOLVING */ // TODO
// Collision type constants
var COL_PAIR = 0, COL_LEFT = 1, COL_TOP = 2, COL_RIGHT = 3, COL_BOT=4;
function getMinIndex(arr){
    var minI;
    var minValue=Infinity;
    for(var i=0; i < arr.length; i++){
        if(arr[i] < minValue){
            minValue = arr[i];
            minI = i;
        }
    }
    return minI;
}


function removeCollisions(a, collisionTimes, solveTypes, colliderI, colliderJ){
    if(a == undefined)
        return;
    for(var i=0; i < collisionTimes.length; i++){
        if(colliderI[i] == a || colliderJ[i] == a){
            collisionTimes.remove(i);
            solveTypes.remove(i);
            colliderI.remove(i);
            colliderJ.remove(i);
        }
    }
}

// Adapts velocity vectors and body positions
var maxDepth = 50000;
var depth = 0;
function resolveCollisionsAndMove(){
    var collisionTimes = [];
    var solveTypes = [];
    var colliderI = [];
    var colliderJ = [];
    var minI, minTime, solveType, colI;
    var timeToGo;
    log("Resolving Session - deltaSeconds: "+deltaSeconds);

    collisionTimes = [];
    solveTypes = [];
    colliderI = [];
    colliderJ = [];  
    depth = 0;
    minTime = 0; 
    timeToGo = deltaSeconds;

    calcAllWallCollisionTimes(collisionTimes, solveTypes, colliderI, colliderJ, timeToGo);
    calcAllPairCollisionTimes(collisionTimes, solveTypes, colliderI, colliderJ, timeToGo);

        // get earliest collision
    minI = getMinIndex(collisionTimes);
    minTime = collisionTimes[minI]; 
    
    // Move short before first collision       
    while(collisionTimes.length > 0 && minTime <= timeToGo ){
        depth +=1
        if(depth > maxDepth){
            colI = colliderI[minI];
            colJ = colliderJ[minI]; 
            var errString = "\n";
            errString += "collision in: "+minTime+"\n";
            errString += "  deltaSeconds: "+deltaSeconds+"\n";
            errString += "      timeToGo: "+timeToGo+"\n";
            errString += "          past: "+(deltaSeconds-timeToGo)+"\n";
            errString += "solve depth: "+depth+"\n";
            errString += "solveType: "+solveTypes[minI]+"\n";
            errString += "colliderI: "+colI+"\n";
            errString += "  X: "+posX[colI]+"\n";
            errString += "  Y: "+posY[colI]+"\n";
            errString += "  velX: "+velX[colI]+"\n";
            errString += "  velY: "+velY[colI]+"\n";
            errString += "colliderJ: "+colJ+"\n";
            if(colJ != undefined){      
                errString += "  X: "+posX[colJ]+"\n";
                errString += "  Y: "+posY[colJ]+"\n";              
                errString += "  velX: "+velX[colJ]+"\n";
                errString += "  velY: "+velY[colJ]+"\n";
            }
            throw errString;
        }

        // get earliest collision
        minI = getMinIndex(collisionTimes);
        minTime = collisionTimes[minI]; 
        if(minTime < 0) throw "minTime < 0: "+minTime; 
        timeToGo = timeToGo - minTime;
        if(timeToGo < 0) break;

        updatePositions(minTime); 
        solveCollisions(minI, minTime, collisionTimes, solveTypes, colliderI, colliderJ );
        removeCollisions(minI, collisionTimes, solveTypes, colliderI, colliderJ)
        updateVelocities(minTime);

        calcWallCollisionTimes(colliderI[minI], solveTypes, colliderI, colliderJ, timeToGo);
        calcWallCollisionTimes(colliderJ[minI], solveTypes, colliderI, colliderJ, timeToGo);
        calcPairCollisionTimes(colliderI[minI], solveTypes, colliderI, colliderJ, timeToGo);
        calcPairCollisionTimes(colliderJ[minI], solveTypes, colliderI, colliderJ, timeToGo);
    }


    //break;
    // Resolve all! collisions at this timeStep
        
    
    log("time to go: "+timeToGo);
    log("----------------");
    // move rest:
    // log("minTime: " + minTime);
    updatePositions(timeToGo);    
    ov = countOverlaps()
    //if(ov > 0) throw "Overlaps AFTER LAST movement: "+ov+ ", timeToGo: "+timeToGo;
}

// Solves all collisions up to a specific time
function solveCollisions(i, collisionTime, collisionTimes, solveTypes, colliderI, colliderJ){
    solveType = solveTypes[i];
    colI = colliderI[i];
    colJ = colliderJ[i];
    switch (solveType){
        case COL_LEFT:
            solveLeftWallCollision(colI, collisionTime);
            break;
        case COL_RIGHT:
            solveRightWallCollision(colI, collisionTime);
            break;
        case COL_TOP:
            solveTopWallCollision(colI, collisionTime);
            break;
        case COL_BOT:
            solveBottomWallCollision(colI, collisionTime);
            break;
        case COL_PAIR:
            solvePairCollision(colI, colJ, collisionTime);
            break;
    }
}

function solveBottomWallCollision(colIndex, timeDelta){
    //log("solve BOT");
    //log("Solving BOTTOM collision");
    // get direction
    var vl = Math.abs(velY[colIndex]);
    // just point up
    velY[colIndex] = -forceElasticity*vl;
    accY[colIndex] += -forceElasticity*vl;
    velX[colIndex] *= forceWallFriction;
}

function solveTopWallCollision(colIndex, timeDelta){
    //log("solve TOP");
    //log("Solving BOTTOM collision");
    // get direction
    var vl = Math.abs(velY[colIndex]);
    // just point up
    velY[colIndex] = 1*forceElasticity*vl;
    accY[colIndex] += 1*forceElasticity*vl;
    velX[colIndex] *= forceWallFriction;
}

function solveLeftWallCollision(colIndex, timeDelta){
    //log("Solving BOTTOM collision");
    // get direction
    var vl = Math.abs(velX[colIndex]);
    // just point up
    velX[colIndex] = 1*forceElasticity*vl;
    accX[colIndex] += 1*forceElasticity*vl;
    velY[colIndex] *= forceWallFriction;
}

function solveRightWallCollision(colIndex, timeDelta){
    //log("Solving BOTTOM collision");
    // get direction
    var vl = Math.abs(velX[colIndex]);    
    // just point up
    velX[colIndex] = -1*forceElasticity*vl;
    accX[colIndex] += -1*forceElasticity*vl;
    velY[colIndex] *= forceWallFriction;
}

function solvePairCollision(colI, colJ, timeDelta){
    if(colI == undefined) throw "UNDEFINED colI";
    if(colJ == undefined) throw "UNDEFINED colJ";

    // collision normal    
    normX = posX[colI] - posX[colJ];
    normY = posY[colI] - posY[colJ];   
   
    norm = vecLength(normX, normY);  
    normX /= (norm + EPSILON);  
    normY /= (norm + EPSILON); 
  
    // velocity difference    
    vabX = velX[colI] - velX[colJ];    
    vabY = velY[colI] - velY[colJ];  

    j = -0.5*(1+forceElasticity)*vecDot(vabX,vabY,normX,normY) / (vecDot(normX,normY,normX,normY) + EPSILON);  

    velX[colI] = (velX[colI] + 0.5*j*normX);    
    velY[colI] = (velY[colI] + 0.5*j*normY);  
    velX[colJ] = (velX[colJ] - 0.5*j*normX);  
    velY[colJ] = (velY[colJ] - 0.5*j*normY);  

    // Fit acceleration vector
    accX[colI] += 0.5*j*normX; 
    accY[colI] += 0.5*j*normY;
    accX[colI] += -0.5*j*normX;
    accY[colI] += -0.5*j*normY;
}