/* ****************************************************************************************************** 


   BEGIN BOILERPLATE


/* *************************************************************************************************** */

/* ***********  Utility *********** */
var self = this;
var LOGGING = true;
var DEBUGGING = true;
var EPSILON = 1e-6;

var oldTime = (new Date()).getTime();
var deltaSeconds, newTime;
var deltaMillis;

function measureTime(){ // All values are understood as "per second"
    newTime = (new Date()).getTime();
    // clamp to prevent stuck or explosion
    deltaMillis = Math.min(Math.max(1, newTime - oldTime), 34);
    deltaSeconds = 0.001*deltaMillis;
    oldTime = newTime;
    return deltaSeconds; // test for verlet integration
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

Math.randint = function(mi, ma){
  return Math.round(Math.random()*(ma-mi)+mi);
}

Math.randfloat = function(mi, ma){
  return Math.random()*(ma-mi)+mi;
}

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

/* Applies function to all pairs */
Float64Array.prototype.eachPair = function(func){
  for(var i=0; i < this.length; i++){
    for(var j=i+1; j < this.length; j++){
      func.call(this, i, j);
    }
  }
}

/* Applies function to every element */
Float64Array.prototype.each = function(func){
  for(var i=0; i < this.length; i++){
    func.call(this, i);
  }
}

/* Applies function to all pairs containing given index */
Float64Array.prototype.eachOther = function(i, func){
  for(var j=0; j < this.length; j++){
    if(j!=i) func.call(this, j);
  }
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

// Removes all elements with values contained in the given array
Array.prototype.removeAll = function(values){
    var ind;
    for(var i=0; i < values.length; i++){
        ind = this.indexOf(values[i]);
        while(ind > -1){
            this.remove(ind);
            ind = this.indexOf(values[i]);
        }
    }
}

// Treats arrays as set and adds the new elements
Array.prototype.addSet = function(values){
    for(var i=0; i < values.length; i++){
        if(this.indexOf(values[i]) == -1) this.push(values[i]);
    }
}


/* Applies function to all pairs */
Array.prototype.eachPair = function(func){
  for(var i=0; i < this.length; i++){
    for(var j=i+1; j < this.length; j++){
      func.call(this, i, j);
    }
  }
}

/* Applies function to every element */
Array.prototype.each = function(func){
  for(var i=0; i < this.length; i++){
    func.call(this, i);
  }
}

/* Applies function to all pairs containing given index */
Array.prototype.eachOther = function(i, func){
  for(var j=0; j < this.length; j++){
    if(j!=i) func.call(this, j);
  }
}

Array.prototype.getMinIndex = function(){
    var minVal = Infinity;
    var minIndex = undefined;
    for(var i=0; i < this.length; i++){
        if(this[i] < minVal){
            minVal = this[i];
            minIndex = i;
        }
    }
    return minIndex;
}

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

// Returns the distance between two elements
function bodyDistance(indexI, indexJ){
    return vecDist(posX[indexI], posY[indexI], posX[indexJ], posY[indexJ]) - radii[indexI] - radii[indexJ];
}

function getIndexList(){
    var l = [];
    for(var i=0; i < numBodies; i++){
        l.push(i);
    }
    return l;
}

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
    if(ERRORS){

        var date = new Date();
        var timeStr = (date.getHours() < 10 ? "0"+date.getHours() : date.getHours())
            +":"+(date.getMinutes() < 10 ? "0"+date.getMinutes() : date.getMinutes())+":"
            +(date.getSeconds() < 10 ? "0"+date.getSeconds() : date.getSeconds());
        self.postMessage({cmd:"error", txt:"[ERROR "+timeStr+"] "+txt});
    }
}

// Puts the circles into a grid
function createGrid(numCols, r, pad){
  var numRows = Math.ceil(numBodies / numCols);
  var offsetH = (numRows * (2*r +pad)) / 2 -pad + 0.5*r;
  var offsetW = (numCols * (2*r +pad)) / 2 -pad + 0.5*r;
  var i=0;

  for(var row=0; row < numRows && (i < numBodies); row++){
    for(var col=0; col < numCols && (i < numBodies); col++){
      radii[i] = r;
      posX[i]  = col*(r*2+pad) - offsetW;
      posY[i]  = row*(r*2+pad) - offsetH;
      oldPosX[i] = posX[i];
      oldPosY[i] = posY[i];
      velX[i] = posX[i] - oldPosX[i];
      velY[i] = posY[i] - oldPosY[i];
      mass[i]  = 0.1;
      imass[i] = 1.0/mass[i];
      i+= 1;
    }
  }
}