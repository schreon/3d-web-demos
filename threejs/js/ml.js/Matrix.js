debug("Loading Class: Matrix");

function sigmoid(t) {
    return 1.0/(1.0+Math.pow(Math.E, -t));
}

function randmoid(t) {
    return Math.random() < sigmoid(t)  ? 1.0 : 0.0;
}

// Grab Array class. This is the reason this should be run in an iframe
// To get an own copy of the Array prototype without breaking everything else.
function Matrix(n,m,data){
    var self = this;
    self.shape = [n, m];
    self.n = n;
    self.m = m;        
    self._datalength = n*m;
    if(data == undefined)
        self._data = new Float64Array(self._datalength);
    else     
        self._data = data;
    
    self.transposed = false;

    return self;
}

/**
 * Matrix multiplication
 */
function matmultN(dataA, nA, mA, dataB, nB, mB, dataRes){
    //throw "Doing matmult: "+ nA +", "+mA+", "+ nB+", "+mB+", "+dataA.length+", "+dataB.length+", "+dataRes.length;
    if(mA != nB) throw "Matrices incompatible: "+nA+"x"+mA+" * "+nB+"x"+mB;
    
    var m = mA; // == other.n
    var p = mB;

    var reslength = nA*mB;
    var bLength = nB*mB;
    
    // Reference to underlying data of resmat.
    var result = dataRes;
    var left = dataA;
    var right = dataB;

    var li = 0;
    var tj = 0;

    var ri = 0;
    var i=0;
    var j=0;
    var oi=0;
    // i Marks beginnings of rows in result.
    for(i=0; i < reslength; i+=p){
        // j marks column in result and other
        for(j=0; j < p; j++){
            ri = i+j;
            result[ri] = 0;
            // for rows in other:
            tj = 0;
            for(oi=0; oi < bLength; oi+=p){
                result[ri] += left[li+tj]*right[oi+j]; 
                // increase column in this
                tj += 1;
            }
        }                        
        // step to next row in this.
        li += m;
    }
    return result;
}

/**
 * Matrix multiplication for the case the right matrix should be handled transposed.
 */
function matmultRT(dataA, nA, mA, dataB, nB, mB, dataRes){
    
    //throw "Doing matmult: "+ nA +", "+mA+", "+ nB+", "+mB+", "+dataA.length+", "+dataB.length+", "+dataRes.length;
    if(mA != mB) throw "(right is transposed) Matrices incompatible: "+nA+"x"+mA+" * "+nB+"x"+mB;
    
    // Reference to underlying data of resmat.
    var result = dataRes;
    var left = dataA;
    var right = dataB;
    
    var n = nA;
    var p = mB;
    var m = nB;
    var nm = n*m;
    
    var i=0;
    var j=0;
    var k=0;
    
    
    var resij=0;
    var li=0;
    var ri=0;
    
    // [n x p] x [m x p] -> [n x p] x [p x m](transposed)
    // Entlang leftN == resultN
    for(i=0; i < nm; i+=m){        
        // Entlang resultM == rightN (!)
        ri = 0;
        for(j=0; j < m; j++){
            // Entlang leftM==rightM
            resij = i+j;
            result[resij] = 0;
            for(k=0; k < p; k++){
                //res[i][j] = left[i][k] + right[j][k]
                result[resij] += left[li+k]*right[ri+k];
            }
            ri+=mB;
        }
        li += mA;
    }
    
    return result;
}

/**
 * Matrix multiplication (both transposed)
 * [PxN] * [MxP] -> [NxP](transposed) * [PxM](transposed) -> [NxM]
 */
function matmultBT(dataA, nA, mA, dataB, nB, mB, dataRes){
    
    //throw "Doing matmult: "+ nA +", "+mA+", "+ nB+", "+mB+", "+dataA.length+", "+dataB.length+", "+dataRes.length;
    if(nA != mB) throw "Matrices incompatible: "+nA+"x"+mA+" * "+nB+"x"+mB;
    
    // Reference to underlying data of resmat.
    var result = dataRes;
    var left = dataA;
    var right = dataB;
    
    var n = mA;
    var p = nA; // == mB
    var m = nB;
    
    var nm = n*m;
    
    var i=0;
    var j=0;
    var k=0;
    
    
    var resij=0;
    var li=0;
    var lj=0;
    var ri=0;
    var rj=0;
    
    // [PxmA] * [nBxP] -> [mAxP](transposed) * [PxnB](transposed) -> [mAxnB]
    // Entlang resultN == leftM  (!)    
    for(i=0; i < nm; i+=m){  
        // Entlang resultM == rightN (!)
        ri = 0;
        for(j=0; j < m; j++){
            resij = i+j;
            result[resij] = 0;
            
            li=0;
            // Entlang nA == mB
            for(k=0; k < p; k++){
                result[resij] += left[li+lj]*right[ri+k];          
                li+=mA;
            }
            
            ri+=mB;
        }
        
        lj++;
    }
    
    return result;
}

/**
 * Matrix multiplication (left transposed)
 * [PxN] * [PxM] -> [NxP](transposed) * [PxM] -> [NxM]
 */
function matmultLT(dataA, nA, mA, dataB, nB, mB, dataRes){
    var result = dataRes;
    var left = dataA;
    var right = dataB;
    
    //throw "Doing matmult: "+ nA +", "+mA+", "+ nB+", "+mB+", "+dataA.length+", "+dataB.length+", "+dataRes.length;
    if(nA != nB) throw "Matrices incompatible: "+nA+"x"+mA+" * "+nB+"x"+mB;
    
    var n = mA;
    var p = nA; // == mB
    var m = mB;
    
    var nm = n*m;
    
    var i=0;
    var j=0;
    var k=0;
    
    var resij=0;
    var li=0;
    var lj=0;
    var ri=0;
    var rj=0;
    
    // [PxN] * [PxM] -> [NxP](transposed) * [PxM] -> [NxM]
    // Entlang resultN == leftM  (!)    
    for(i=0; i < nm; i+=m){  
        rj=0;
        // Entlang resultM == rightM
        for(j=0; j < m; j++){
            resij = i+j;
            result[resij] = 0;            
            li=0;
            ri = 0;
            // Entlang p == nA == nB
            for(k=0; k < p; k++){
                result[resij] += left[li+lj] * right[ri+rj];                
                li+=mA;
                ri+=mB;
            }
            rj++;
        }        
        lj++;
    }
    
    return result;
}



// Let matrix workers do the work ;) But only, if matrices are big enough
Matrix.prototype.matmult = function(other, resmat){   
     // None transposed
     if(!this.transposed && !other.transposed){
         if(resmat == undefined)
             resmat = new Matrix(this.n, other.m);
         matmultN(this._data, this.n, this.m, other._data, other.n, other.m, resmat._data);
         return resmat;
     }
         
     // Left transposed
     if(this.transposed && !other.transposed){
         if(resmat == undefined)
             resmat = new Matrix(this.m, other.m);
         matmultLT(this._data, this.m, this.n, other._data, other.n, other.m, resmat._data);
         return resmat;
     }
     
     // Right transposed
     if(!this.transposed && other.transposed){
         if(resmat == undefined)
             resmat = new Matrix(this.n, other.n);
         matmultRT(this._data, this.n, this.m, other._data, other.m, other.n, resmat._data);
         return resmat;
     }
     
     // Both transposed     
     if(this.transposed && other.transposed){
         if(resmat == undefined)
             resmat = new Matrix(this.n, other.n);
         matmultBT(this._data, this.m, this.n, other._data, other.m, other.n, resmat._data);
         return resmat;
     }
     
     throw "CANNOT DO MATMULT";
}

Matrix.prototype.mult = function(thing, resmat){
    // if thing is a matrix, matmult will be called
    // else, it will be handled as a scalar (float)
    if(thing.constructor == Matrix){
        return this.matmult(thing, resmat);
    }else{
        if(resmat == undefined)
            for(var i=0; i < this._data.length; i++){
                this._data[i] *= thing;
            }
        else
            for(var i=0; i < this._data.length; i++){
                resmat._data[i] = thing*this._data[i];
            }
        return this;
    }
}

// Elementwise multiplication of 2 matrices
Matrix.prototype.multEach = function(other, resmat){
    if(other.n != this.n || other.m != this.m)
        throw "matrix shapes not compatible: "+this.n+"x"+this.m+" and "+other.n+"x"+other.m
    for(var i=0; i < this._datalength; i++){
        resmat._data[i] = this._data[i] * other._data[i];
    }
}

Matrix.prototype.plus = function(thing, resmat){
    // if thing is a matrix, it matmult will be called
    // else, it will be handled as a scalar (float)
    if(thing.constructor == Matrix){
        if(this.n != thing.n || this.m != thing.m){
            // If thing is a 1xM matrix, consider it a vector and add it to every row.
            // TODO: This could be made more efficient regarding transpostion!
            if(thing.n == 1){
                if(resmat == undefined)
                    resmat = this;
                for(var i=0; i < this.n; i++){
                    for(var j=0; j < this.m; j++){
                        this.set(i, j, this.get(i,j)+thing.get(0,j));
                    }
                }
                return resmat;
            }
            
            if(thing.m == 1){
                if(resmat == undefined)
                    resmat = this;
                for(var i=0; i < this.n; i++){
                    for(var j=0; j < this.m; j++){
                        this.set(i, j, this.get(i,j)+thing.get(i,0));
                    }
                }
                return resmat;
            }
            throw "matrix shapes not compatible: "+this.n+"x"+this.m+" and "+thing.n+"x"+thing.m;
        }
            
        if(resmat == undefined)
            for(var i=0; i < this._datalength; i++){
                this._data[i] += thing._data[i];
            }
        else
            for(var i=0; i < this._data.length; i++){
                resmat._data[i] = this._data[i] + thing._data[i];
            }
        return this;
    }else{
        if(resmat == undefined)
            for(var i=0; i < this._data.length; i++){
                this._data[i] += thing;
            }
        else
            for(var i=0; i < this._data.length; i++){
                resmat._data[i] = this._data[i]+thing;
            }
        return this;
    }
}

Matrix.prototype.minus = function(thing, resmat){
    // if thing is a matrix, it matmult will be called
    // else, it will be handled as a scalar (float)
    if(thing.constructor == Matrix){
        if(this.n != thing.n && this.m != thing.m)
            throw "matrix shapes not compatible: "+this.n+"x"+this.m+" and "+thing.n+"x"+thing.m;
        if(resmat == undefined)
            for(var i=0; i < this._data.length; i++){
                this._data[i] -= thing._data[i];
            }
        else
            for(var i=0; i < this._data.length; i++){
                resmat._data[i] = this._data[i] - thing._data[i];
            }
        return this;
    }else{
        if(resmat == undefined)
            for(var i=0; i < this._data.length; i++){
                this._data[i] -= thing;
            }
        else
            for(var i=0; i < this._data.length; i++){
                resmat._data[i] = this._data[i]-thing;
            }
        return this;
    }
}

Matrix.prototype.dot = function(other, resmat){
    if(this.n != other.n || this.m != this.m)
        throw "dot: Incompatible matrix dimensions.";
    for(var i=0; i < this.n; i++){
        for(var j=0; j < this.m; j++){
            resmat.set(i,j, this.get(i,j)*other.get(i,j));
        }
    }
}

// powers every element by the given exponent
Matrix.prototype.pow = function(exp, resmat){
    if(resmat == undefined)
        for(var i=0; i < this._data.length; i++){
            this._data[i] = Math.pow(this._data[i], exp);
        }
    else
        for(var i=0; i < this._data.length; i++){
            resmat._data[i] = Math.pow(this._data[i], exp);
        }
    return this;
}

Matrix.prototype.noise = function(noiseAmount){
    for(var i=0; i < this._data.length; i++){
        this._data[i] += noiseAmount*2*(0.5-Math.random());
    }

    return this;
}


// Returns transposed matrix ("flipped" matrix)
Matrix.prototype.transpose = function(){
    this.transposed = !this.transposed;
    var c = this.n;
    this.n = this.m;
    this.m = c;
    return this;
};


// Returns value at the given index
Matrix.prototype.get = function(x,y){
    if(!this.transposed)
        return this._data[x*this.m+y];
    else
        return this._data[y*this.n+x];
}

// sets the value at the given index
Matrix.prototype.set = function(x,y,val){
    if(!this.transposed)
        this._data[x*this.m+y] = val;
    else
        this._data[y*this.n+x] = val;
}

/**
* Returns the mean vector along the given axis.
* 
*/
Matrix.prototype.mean = function(axis, resmat){
    var m = this.m;
    var n = this.n;
    var i = 0;
    var j = 0;
    var sum = 0.0;
    // -> 1xM matrix, average over rows.
    if(axis == 0){
        if(resmat == undefined)
            resmat = new Matrix(1,m);
        for(j=0; j<m; j++){
            sum = 0.0;
            for(i = 0; i < n; i++){
                sum += this.get(i,j);
            }
            resmat.set(0,j,sum/n);
        }
    }
    // -> 1xN matrix, average over columns.
    if(axis == 1){
        if(resmat == undefined)
            resmat = new Matrix(1,n);
        for(i=0; i<n; i++){
            sum = 0.0;
            for(j = 0; j < m; j++){
                sum += this.get(i,j);
            }
            resmat.set(0,i, sum/m);
        }
    }
    return resmat;
}

/**
* Returns the sum vector along the given axis.
* 
*/
Matrix.prototype.sum = function(axis, resmat){
    var m = this.m;
    var n = this.n;
    var i = 0;
    var j = 0;
    var sum = 0.0;
    // -> 1xM matrix, average over rows.
    if(axis == 0){
        if(resmat == undefined)
            resmat = new Matrix(1,m);
        for(j=0; j<m; j++){
            sum = 0.0;
            for(i = 0; i < n; i++){
                sum += this.get(i,j);
            }
            resmat.set(0,j,sum);
        }
    }
    // -> 1xN matrix, average over columns.
    if(axis == 1){
        if(resmat == undefined)
            resmat = new Matrix(1,n);
        for(i=0; i<n; i++){
            sum = 0.0;
            for(j = 0; j < m; j++){
                sum += this.get(i,j);
            }
            resmat.set(0,i, sum);
        }
    }
    return resmat;
}

/**
*  Returns the average of all elements in the matrix
*/
Matrix.prototype.average = function(){
    var sum = 0.0;
    for(var i=0; i < this._data.length; i++)
        sum += this._data[i];
    return sum / this._data.length;
}

Matrix.prototype.veclength = function(){
    var sum = 0.0;
    for(var i=0; i < this._data.length; i++)
        sum += Math.pow(this._data[i], 2);
    return Math.sqrt(sum);
}

/**
*  Returns the minimum element of the matrix
*/
Matrix.prototype.min = function(){
    var minVal = Infinity;
    for(var i=0; i < this._data.length; i++){
        if (this._data[i] < minVal)
            minVal = this._data[i];
    }
    return minVal;
}

/**
* Returns the maximum value
*/
Matrix.prototype.min = function(){
    var maxVal = -Infinity;
    for(var i=0; i < this._data.length; i++){
        if (this._data[i] > maxVal)
            maxVal = this._data[i];
    }
    return maxVal;
}

Matrix.prototype.clip = function(min, max){
    for(var i=0; i < this._data.length; i++){
        if (this._data[i] < min)
            this._data[i] = min;
        if (this._data[i] > max)
            this._data[i] = max;
    }
    return this;
}

// Applies the function to all elements in the matrix.
// The function is passed the value of the element.
Matrix.prototype.apply = function(func, resmat){
    if(resmat == undefined){
        for(var i=0; i < this._data.length; i++){
            this._data[i] = func(this._data[i]);
        }
    }else{
        for(var i=0; i < this._data.length; i++){
            resmat._data[i] = func(this._data[i]);
        }
    }

}

Matrix.prototype.randomize = function(min,max){
    for(var i=0; i < this._data.length; i++){
        this._data[i] = min + (max-min)*Math.random();
    }
    return this;
};

Matrix.prototype.sigmoid = function(){
    for(var i=0; i < this._data.length; i++){
        this._data[i] = sigmoid(this._data[i]);
    }
    return this;
};

Matrix.prototype.binary = function(){
    for(var i=0; i < this._data.length; i++){
        this._data[i] = sigmoid(this._data[i]) < 0.5 ? 0.0 : 1.0;
    }
    return this;
};


Matrix.prototype.gibbs = function(){
    for(var i=0; i < this._data.length; i++){
        this._data[i] = Math.random() < sigmoid(this._data[i]) ? 1.0 : 0.0;
    }
    return this;
};

Matrix.prototype.init = function(x){
    for(var i=0; i < this._data.length; i++){
        this._data[i] = x;
    }
    return this;
};

Matrix.prototype.toString = function(){
    var totalString = "";
    if(this.transposed)
        totalString+="(transposed):\n"
    for(var i=0; i < this.n; i++){
        var rowString = "[";
        for(var j=0; j < this.m; j++){
            rowString += this.get(i,j).toFixed(8);
            if(j < this.m-1)
                rowString += " ";
        }
        rowString += "]"
        totalString += rowString
        if( i < this.n-1 )  totalString += "\n";
    }
    return totalString;
};

// Expects 2D Array and will copy items to this.
// Must be of same shape.
Matrix.prototype.insert = function(input){
    if(input.length != this.n)
        throw "Insert: Incompatible row number."
    for(var i=0; i < input.length; i++){
        if(input[i].length != this.m)
            throw "Insert: Incompatible row length."
        for(var j=0; j < input[i].length; j++){
            this.set(i,j,input[i][j]);
        }
    }
}

// Splits the Matrix into sub-matrices along the given axis.
// axis == 1 -> first dimension (along N)
// axis == 2 -> second dimension (along M)
// size == size of sub-matrices along given axis
Matrix.prototype.split = function(size){    
    var matrices = [];
    var num =  Math.floor(this.shape[0]/size);
    for(var i=0; i < num; i++){
        var newMat = new Matrix(size, this.m)
        matrices.push(newMat);
        newMat._data.set(this._data.subarray(i*size, (i+1)*size));
    }
    
    return matrices;
}



// Takes an array of matrices and joins them to a single matrix along the given axis.
// axis == 1 -> first dimension (along N), must be consistent along M
// axis == 2 -> second dimension (along M), must be consisteng along N
Matrix.join = function(matrices, axis, target){
    var n,m;
    if(axis == 1){
        if(target == undefined){
            n = 0;
            m = matrices[0].m;
            for(var k=0; k < matrices.length; k++)
                n += matrices[i].n;
            target = new Matrix(n, m);
        }
        for(var k=0; k < matrices.length; k++){
            for(var i=0; i < matrices[k].n; i++){
                for(var j=0; j < matrices[k].m; k++){
                    target.set(i+k*n,j,matrices[k].get(i,j));
                }
            }
        }
    }
    
    if(axis == 2){
        if(target == undefined){
            m = 0;
            n = matrices[0].n;
            for(var k=0; k < matrices.length; k++)
                m += matrices[i].m;
            target = new Matrix(n, m);
        }
        
        for(var k=0; k < matrices.length; k++){
            for(var i=0; i < matrices[k].n; i++){
                for(var j=0; j < matrices[k].m; k++){
                    target.set(i,j+k*m,matrices[k].get(i,j));
                }
            }
        }
    }

}

Matrix.prototype.clone = function(){
    var resmat = new Matrix(this.n, this.m);
    for(var i=0; i < this.n; i++){
        for(var j=0; j < this.m; j++){
            resmat.set(i,j,this.get(i,j));
        }
    }
    return resmat;
}

Matrix.prototype.copyTo = function(other){
    for(var i=0; i < this.n; i++){
        for(var j=0; j < this.m; j++){
            other.set(i,j,this.get(i,j));
        }
    }
    return other;
}

Matrix.prototype.destroy = function(){ 
    delete this._data.buffer;
    delete this._data;
    delete this;
};