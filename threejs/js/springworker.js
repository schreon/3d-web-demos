// Utility
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

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
var rest = this.slice((to || from) + 1 || this.length);
this.length = from < 0 ? this.length + from : from;
return this.push.apply(this, rest);
};

var self = this;
var lastTime = (new Date()).getTime();

function createFunctionFromString(str){
    eval("var func = "+str);
    return func;
}

var matrices = {}

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
            init(message.numIndividuals, message.numNodesPerIndividual, message.radius);
            break;
        case "doUpdate" : 
            doUpdate();
            break;
    }
});

function log(txt){    
    var date = new Date();
    var timeStr = (date.getHours() < 10 ? "0"+date.getHours() : date.getHours())
        +":"+(date.getMinutes() < 10 ? "0"+date.getMinutes() : date.getMinutes())+":"
        +(date.getSeconds() < 10 ? "0"+date.getSeconds() : date.getSeconds());
    self.postMessage({cmd:"log", txt:"[LOG   "+timeStr+"] "+txt});
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

function sendUpdate(){       
   // TODO: sendUpdate function sending the current game state to the main controller
   self.postMessage({cmd:"onUpdate", nodesPosX:nodesPosX, nodesPosY:nodesPosY
                                    , collisions:collisions
                                    , velNormX:velNormX, velNormY:velNormY
                                    , accNormX:accNormX, accNormY:accNormY
    });
}

function sendInitFinished(){    
   // TODO: sendUpdate function sending the current game state to the main controller
   self.postMessage({cmd:"onInitFinished", nodesPosX:nodesPosX, nodesPosY:nodesPosY});
}

function init(pNumIndividuals, pNumNodesPerIndividual, pRadius){
    numIndividuals = pNumIndividuals;
    numNodesPerIndividual = pNumNodesPerIndividual;
    numTotalNodes = numIndividuals * numNodesPerIndividual;

    numTotalNodes = numIndividuals*numNodesPerIndividual;
    radiusNodes = pRadius;
    nodePadding = 5;

    // Position of each node
     nodesPosX = new Float64Array(numTotalNodes);
     nodesPosY = new Float64Array(numTotalNodes);

    // Mass of each node
     nodesMass = new Float64Array(numTotalNodes);

    // Radius of each node
     nodesRadius = new Float64Array(numTotalNodes);

    // Friction of each node
     nodeFriction = new Float64Array(numTotalNodes);

    // Springs
     numSpringsPerIndividual = numNodesPerIndividual-1;
     numTotalSprings = numSpringsPerIndividual*numIndividuals;

    // Index of each first node
     springsA = new Int32Array(numTotalSprings);
    // Index of each second node
     springsB = new Int32Array(numTotalSprings);
     springLength = radiusNodes*2;

    // Forces
     accForcesX = new Float64Array(numTotalNodes);
     accForcesY = new Float64Array(numTotalNodes);

    // Velocities
     velX = new Float64Array(numTotalNodes);
     velY = new Float64Array(numTotalNodes);
     velNormX = new Float64Array(numTotalNodes);
     velNormY = new Float64Array(numTotalNodes);
     accNormX = new Float64Array(numTotalNodes);
     accNormY = new Float64Array(numTotalNodes);

     colliding = new Uint8Array(numTotalNodes);
     collisions = [];


    for(var indI = 0; indI < numIndividuals; indI++){
        var indX = Math.random()*(maxX - minX) + minX;
        var indY = Math.random()*(maxY - minY) + minY;
        for(var indN = 0; indN < numNodesPerIndividual; indN++){
            var myI = indI*numNodesPerIndividual + indN;
            nodesPosX[myI] = indX + indN*(2*radiusNodes+nodePadding);
            nodesPosY[myI] = indY;
            log("myI: " + myI);
        }
        log("ind: " + indI);
    }

    removeOverlaps();

    var nodeI = 0;
    for (var springI=0; springI < numTotalSprings; springI++){
        // end-nodes do not get a connection to the next one
        if(nodeI % numNodesPerIndividual != numNodesPerIndividual-1){
            springsA[springI] = nodeI;
            springsB[springI] = nodeI+1;
        }
        nodeI += 1;
    }

    log("SpringPhysicsWorker Instance successfully initialized.");
    sendInitFinished();
}

var oldTime, newTime, deltaSeconds;

function updateMillis(){
    if(oldTime == undefined){
        oldTime = (new Date()).getTime();
        newTime = oldTime;
    }else{
        oldTime = newTime;
        newTime = (new Date()).getTime();
    }
    deltaSeconds = 0.001*Math.max(10, newTime - oldTime);
    return deltaSeconds;
}


function doUpdate(){
    deltaSeconds = updateMillis();
    calcPhysics();    
    sendUpdate();
}



/* CONCEPT
   World consists of:
    - Inverse gravity to the center of the scene, holding everything toegether
    - Individuals consist of:
        * Set of nodes with
            - radius
            - mass
            - bottom-friction
            - sensor indicating the direction to the next enemy node
            - sensor indicating the distance to the next enemy node
            - outer nodes can be used to attack
            - momentum vector
        * Set of springs, each connecting 2 of the nodes with
            - optimal length
            - stiffness
            - angle force
        * Controlling neural network
            - with stats:
                * energy absorbed
                * energy lost
            - with inputs:
                * momentum vector of each node
                * properties of each node
                * sensor values of each node 
                * properties of each spring
                * memory bits
            - with outputs:
                * new bottom-friction of each node
                * new optimal length of each spring
                * new stiffness of each spring
                * new angle force of each spring
                * new memory bits
                * each action costs energy
            - with reward function:
                * (Damage dealt to others) - (Damage received)**2
            - trained by PGPE
        * Collision handling:
            - whenever an attacking node touches a non-attacking node of another individual,
              energy is transferred from the victim to the attacker
            - whenever the same nodetypes or the nodes of the same individual collide, rebound is calculated

********************************/
var EPSILON = 0.0000000000000000001;

// field size
var w = 200;
var h = 200;
var minX = -w;
var maxX = w;
var minY = -h;
var maxY = h;


var numIndividuals;
var numNodesPerIndividual;
var numTotalNodes;
var radiusNodes;
var nodePadding;

// Position of each node
var nodesPosX;
var nodesPosY;

// Mass of each node
var nodesMass;

// Radius of each node
var nodesRadius;

// Friction of each node
var nodeFriction;

// Springs
var numSpringsPerIndividual;
var numTotalSprings;

// Index of each first node
var springsA;
// Index of each second node
var springsB;
var springLength;

// Forces
var accForcesX;
var accForcesY;

// Velocities
var velX;
var velY;
var velNormX;
var velNormY;
var accNormX;
var accNormY;

var colliding;
var collisions;


function euclidDistance(ax,ay,bx,by){
    return Math.sqrt((ax-bx)*(ax-bx) + (ay-by)*(ay-by))
}

function vecLength(x,y){
    return Math.sqrt(x*x + y*y);
}

function dot(ax, ay, bx, by){
    return ax*bx + ay*by;
}

function normVec(x, y){
    var vl = vecLength(x,y)+EPSILON;
    return [x/vl, y/vl];
}


function calcPhysics(){
    resetForces();
    calcCenterForce();
    //calcSpringForces();
    //calcGravityForce();
    calcFrictionForce(); 
    //calcThrustForce();   
    //calcMomentumForce();
    //calcGlueForces();
    calcVelocities();     
    calcCollisions();    
    //moveNodes(deltaSeconds);
}

// If two objects touch each other, this adds a springforce to them
function calcGlueForces(){
    var saX, saY, sbX, sbY, fX, fY, d;
    var d0 = 2*radiusNodes;
    for(var i=0; i < nodesPosX.length; i++){
        for(var j=i+1; j < nodesPosX.length; j++){
            saX = nodesPosX[i];
            saY = nodesPosY[i];
            sbX = nodesPosX[j];
            sbY = nodesPosY[j];

            d = euclidDistance(saX, saY, sbX, sbY) - 2*radiusNodes + EPSILON;

            if(d < d0){
                fX = 0.5*stiffness*(saX - sbX)*(d-d0)/d;
                fY = 0.5*stiffness*(saY - sbY)*(d-d0)/d;

                accForcesX[i] -= fX;        
                accForcesY[i] -= fY;
                accForcesX[j] += fX;        
                accForcesY[j] += fY;
            }
        }
    }
}

function calcSpringForces(){
    var springA, springB;
    for(var i=0; i < numTotalSprings; i++){
        springA = springsA[i];
        springB = springsB[i];
        saX = nodesPosX[springA];
        saY = nodesPosY[springA];
        sbX = nodesPosX[springB];
        sbY = nodesPosY[springB];

        fX = stiffness*(saX - sbX)/springLength;
        fY = stiffness*(saY - sbY)/springLength;

        accForcesX[springA] -= fX;        
        accForcesY[springA] -= fY;
        accForcesX[springB] += fX;        
        accForcesY[springB] += fY;
    }
}

function calcVelocities(){
    for(var i=0; i < numTotalNodes; i++){
        // displacement will be t*vel + t²*acc, so:
        velX[i] = deltaSeconds * accForcesX[i] + momentum*velX[i];
        velY[i] = deltaSeconds * accForcesY[i] + momentum*velY[i];

        velNormX[i] = nodesPosX[i] + velX[i];
        velNormY[i] = nodesPosY[i] + velY[i];        
        accNormX[i] = nodesPosX[i] + accForcesX[i];
        accNormY[i] = nodesPosY[i] + accForcesY[i];
    }
}

function resetForces(){
    oldVelY = velY;
    for(var i=0; i < numTotalNodes; i++){
        accForcesX[i] = 0;
        accForcesY[i] = 0;
    }
}

function borderAccuracy(){
    var minT = deltaSeconds;
    var minI;
    // TODO rebound einbauen etc. pp
    // Collision with borders
    var leftCol, rightCol, topCol, botCol, x, y, vx, vy;
    for(var i=0; i < numTotalNodes; i++){
        x = nodesPosX[i];
        y = nodesPosY[i];
        vx = accForcesX[i];
        vy = accForcesY[i];

        // left border collisiontime:
        leftCol = (maxX - x)/vx;
        rightCol = (minX - x)/vx;
        topCol =  (maxY - y)/vy;
        botCol =  (minY - y)/vy;
        if(leftCol < minT){

        }
    }

}

// Collision type constants
var COL_PAIR = 0, COL_LEFT = 1, COL_TOP = 2, COL_RIGHT = 3, COL_BOT=4;

// We assume constant velocity here, resulting in a little error
function minkowskiAccuracy(){
    var minI, minJ;

    var collTimes = [];
    var colliderI = [];
    var collType = []; 
    var colliderJ = []; // can contain undefined when colliding with walls

    // Build collision time series:

    // Minkowski sums of accuracy against each other
    var p_ab_x,p_ab_y,v_ab_x,v_ab_y,  r, a, b, c, disc, t, t1, t2, tMin;
    for(var i=0; i < numTotalNodes; i++){
        for(var j=i+1; j < numTotalNodes; j++){
            p_ab_x = nodesPosX[i] - nodesPosX[j];
            p_ab_y = nodesPosY[i] - nodesPosY[j];

            v_ab_x = velX[i] - velX[j];
            v_ab_y = velY[i] - velY[j];

            r = radiusNodes*2+EPSILON;

            a = v_ab_x * v_ab_x + v_ab_y*v_ab_y;
            b = 2*(p_ab_x*v_ab_x + p_ab_y*v_ab_y);
            c = (p_ab_x*p_ab_x+p_ab_y*p_ab_y) - r*r;

            disc = b*b - 4*a*c;
            if(disc >= 0){ // if there is a real solution ...                
                t1 = (-b + Math.sqrt(disc))/(2*a);
                t2 = (-b - Math.sqrt(disc))/(2*a);
                var col = ((t1 > -0.1) && (t2 > -0.1));                
                t = Math.min(t1, t2);
                if(col){
                    collTimes.push(t);
                    colliderI.push(i);
                    colliderJ.push(j);
                    collType.push(COL_PAIR);
                }
            }
        }
    }
    
    
    // Find earliest collision, until minT is larger than deltaSeconds
    while(true){
        var minTime = Infinity;
        var minI, minJ, minType;
        for (var i=0; i < collTimes.length; i++){
            if(collTimes[i] < minTime){
                minTime = collTimes[i];
                minI = colliderI[i];
                minJ = colliderJ[i];
                minType = collType[i];
            }
        }

        // Move nodes short before first collision
        moveNodes(Math.min(deltaSeconds, minTime-EPSILON));

        // If minT is larger than deltaSeconds: break (no collision in this timeframe)
        if(minTime > deltaSeconds ) break;

        // If there has not been a collision, skip
        if(collTimes.length == 0) continue;

        //log("Resolving collision");
        // Resolve earliest collision
        respondCollision(minTime, minI, minJ, minType);

        //log("Removing involved collisions");
        // Remove collisions involving minI and minJ
        for (var i=0; i < collTimes.length; i++){
            if(colliderI[i] == minI
             || colliderI[i] == minJ
             || colliderJ[i] == minI
             || colliderJ[i] == minJ){
                collTimes.remove(i);
                colliderI.remove(i);
                colliderJ.remove(i);
                collType.remove(i);
            }
        }

        //log("Recalculate minI");
        // Recalculate collisions for minI
        var i = minI;
        for(var j=0; j<numTotalNodes;j++){
            if(j != i){
                p_ab_x = nodesPosX[i] - nodesPosX[j];
                p_ab_y = nodesPosY[i] - nodesPosY[j];

                v_ab_x = velX[i] - velX[j];
                v_ab_y = velY[i] - velY[j];

                r = radiusNodes*2+EPSILON;

                a = v_ab_x * v_ab_x + v_ab_y*v_ab_y;
                b = 2*(p_ab_x*v_ab_x + p_ab_y*v_ab_y);
                c = (p_ab_x*p_ab_x+p_ab_y*p_ab_y) - r*r;

                disc = b*b - 4*a*c;
                if(disc >= 0){ // if there is a real solution ...                
                    t1 = (-b + Math.sqrt(disc))/(2*a);
                    t2 = (-b - Math.sqrt(disc))/(2*a);
                    var col = ((t1 > -0.1) && (t2 > -0.1));                
                    t = Math.min(t1, t2);
                    if(col){
                        collTimes.push(t);
                        colliderI.push(i);
                        colliderJ.push(j);
                        collType.push(COL_PAIR);
                    }
                }
            }
        }

        //log("Recalculate minJ");
        // Recalculate collisions for minJ
        var i = minJ;
        for(var j=0; j<numTotalNodes;j++){
            if(j != i){
                p_ab_x = nodesPosX[i] - nodesPosX[j];
                p_ab_y = nodesPosY[i] - nodesPosY[j];

                v_ab_x = velX[i] - velX[j];
                v_ab_y = velY[i] - velY[j];

                r = radiusNodes*2+EPSILON;

                a = v_ab_x * v_ab_x + v_ab_y*v_ab_y;
                b = 2*(p_ab_x*v_ab_x + p_ab_y*v_ab_y);
                c = (p_ab_x*p_ab_x+p_ab_y*p_ab_y) - r*r;

                disc = b*b - 4*a*c;
                if(disc >= 0){ // if there is a real solution ...                
                    t1 = (-b + Math.sqrt(disc))/(2*a);
                    t2 = (-b - Math.sqrt(disc))/(2*a);
                    var col = ((t1 > -0.1) && (t2 > -0.1));                
                    t = Math.min(t1, t2);
                    if(col){
                        collTimes.push(t);
                        colliderI.push(i);
                        colliderJ.push(j);
                        collType.push(COL_PAIR);
                    }
                }
            }
        }
    }
}

function moveNodes(t){
    for(var i=0; i < numTotalNodes; i++){
        nodesPosX[i] += t*velX[i];
        nodesPosY[i] += t*velY[i];
    }
}

function countOverlaps(){
    var count = 0;
    for(var i=0; i < numTotalNodes; i++){
        for(var j=i+1; j < numTotalNodes; j++){
            if(euclidDistance(nodesPosX[i],nodesPosY[i],nodesPosX[j],nodesPosY[j])-radiusNodes*2 < 0){
                count+=1;
            }
        }
    }
    return count;
}

function removeOverlaps(){    
    var overlap = true;
    while(overlap){
        overlap = false;
        for(var i=0; i < numTotalNodes; i++){
            for(var j=i+1; j < numTotalNodes; j++){
                if(euclidDistance(nodesPosX[i],nodesPosY[i],nodesPosX[j],nodesPosY[j])-radiusNodes*2 < 0){
                    var vecX = nodesPosX[i] - nodesPosX[j];
                    var vecY = nodesPosY[i] - nodesPosY[j];
                    nodesPosX[i] += 0.5*vecX + radiusNodes;
                    nodesPosY[i] += 0.5*vecY + radiusNodes;
                    nodesPosX[j] -= 0.5*vecX + radiusNodes;
                    nodesPosY[j] -= 0.5*vecY + radiusNodes;
                    overlap = true;
                }
            }
        }
    }
    log("#overlaps after removeOverlaps: " + countOverlaps());
}


function respondCollision(colTime, colI, colJ, colType){
    // collision normal
    normX = nodesPosX[colI] - nodesPosX[colJ];
    normY = nodesPosY[colI] - nodesPosY[colJ];

    norm = normVec(normX, normY);
    normX = norm[0];
    normY = norm[1];

    // velocity difference
    vabX = velX[colI] - velX[colJ];
    vabY = velY[colI] - velY[colJ];

    j1 = bounciness*vecLength(velX[colI], velY[colI]);
    j2 = bounciness*vecLength(velX[colJ], velY[colJ]);
    
    velX[colI] = j1*normX;
    velY[colI] = j1*normY;

    velX[colJ] = - j2*normX;
    velY[colJ] = - j2*normY;
}

function calcCollisions(){
    minkowskiAccuracy();
    ov = countOverlaps();
    if(ov > 0){
        //log("#overlaps: " + ov);
        //removeOverlaps();
    }
}


function calcCenterForce(){
    var len;
    for(var i=0; i < numTotalNodes; i++){
        len = vecLength(nodesPosX[i], nodesPosY[i]) + EPSILON;
        accForcesX[i] -= centerForceFactor*nodesPosX[i]/len;
        accForcesY[i] -= centerForceFactor*nodesPosY[i]/len;
    }
}

function calcGravityForce(){
    for(var i=0; i < numTotalNodes; i++){
        var sigY = nodesPosY[i] > 0 ? 1 : nodesPosY[i] < 0 ? -1 : 0;
        accForcesY[i] -= sigY*gravityForce;
    }
}


function calcFrictionForce(){
    // air friction
    for(var i=0; i < numTotalNodes; i++){
        accForcesX[i] -= velX[i]*frictionFactor;
        accForcesY[i] -= velY[i]*frictionFactor;
    }

    // touch friction
}

var momentum = 0.5;
var bounciness = 1.0;
var centerForceFactor = 500.0;
var stiffness = 100.0;
var stickiness = 10000.0;
var frictionFactor = 0.0;
var gravityForce = 1.0;
var nodeMass = 1.0;
/* ------------------------------------------------------*/
log("SpringPhysicsWorker Instance successfully loaded.");
