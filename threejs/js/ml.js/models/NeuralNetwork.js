/*****************************************************************************
 *
 *   Neural Network Class
 *   
 *   must be imported:
 *   - Matrix.js
 *   - Worker with echo function
 *   
 ****************************************************************************/
debug("Loading Class: NeuralNetwork");

var NeuralNetwork = function(){};

NeuralNetwork.create = function(structure){
    // structure: array with numbers indicating neuron number
    var self = new NeuralNetwork();
    self.structure = structure;
    
    self.weights = [];
    self.biases = [];
    self.activations = [];
    
    var n, m;
    for(var l=0; l < structure.length-1; l++){
        n = structure[l];
        m = structure[l+1];
        var weightMatrix = new Matrix(structure[l], structure[l+1]);
        var biasVector   = new Matrix(1,structure[l+1]);
        
        weightMatrix.randomize(-bengioInit(n, m),bengioInit(n, m));
        biasVector.randomize(-bengioInit(n, m),bengioInit(n, m));
        
        self.weights.push(weightMatrix);
        self.biases.push(biasVector);
    }    
    return self;
}

NeuralNetwork.prototype.propagate = function(samples){    
    var self=this;
    var activations = [samples];
    
    // Activate first layer  
    for (var a=1; a < self.weights.length+1; a++){ 
        
        // Reuse matrices when possible.
//        if(self.activations[a] != undefined && self.activations[a].shape[0] != samples.shape[0]){
//            self.activations[a].destroy();
//            self.activations[a] = undefined;
//        }
            
        // apply weights
        activations[a] = activations[a-1].mult(self.weights[a-1]);     
        // add bias
        activations[a].plus(self.biases[a-1]); 
        
        activations[a].sigmoid();
    }
    
    self.activations = activations;
    return activations;
}

NeuralNetwork.prototype.propagateRandom = function(samples){    
    var self=this;
    var activations = [samples];
    
    // Activate first layer  
    for (var a=1; a < self.weights.length+1; a++){ 
        
        // Reuse matrices when possible.
//        if(self.activations[a] != undefined && self.activations[a].shape[0] != samples.shape[0]){
//            self.activations[a].destroy();
//            self.activations[a] = undefined;
//        }
            
        // apply weights
        activations[a] = activations[a-1].mult(self.weights[a-1]);     
        // add bias
        activations[a].plus(self.biases[a-1]); 
        
        activations[a].gibbs();
    }
    
    self.activations = activations;
    return activations;
}