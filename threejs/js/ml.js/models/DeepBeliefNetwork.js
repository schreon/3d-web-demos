/*****************************************************************************
 *
 *    Deep Belief Network Class
 *    - Stack of RBMs
 *   
 ****************************************************************************/
debug("Loading Class: DeepBeliefNetwork");

var DeepBeliefNetwork = function(){};

DeepBeliefNetwork.create = function(structure){
    var self = new DeepBeliefNetwork();
    self.structure = structure;
    self.stack = [];
    
    for(var l=0; l < structure.length-1; l++){
        self.stack[l] = RestrictedBoltzmannMachine.create(structure[l],structure[l+1]);
    }
    
    
    self.updateFreq = 5; // For events
    
    return self;
}

DeepBeliefNetwork.prototype.learn = function(samples, n, epochs, onUpdate, onFinish){
    var self=this;     
    for(var l=0; l < self.stack.length; l++){
        for(var e=0; e < epochs*(l+1); e++){                
            self.stack[l].learn(samples, n*(l+1), 0.3, 0.00001);
            if(onUpdate != undefined && e % self.updateFreq == 0){
                debug("DB-L"+(l+1)+": learning epoch "+e);
                var activations = [];
                var features = [];
//                for(var i=0; i < l+1; i++){
//                    activations[i] = self.stack[i].hidden._data;                        
//                    features[i] = self.stack[i].W._data;
//                }
                // Calc reconstruction
                onUpdate(self.reconstruct(l)._data, activations, features);
            }                    
        }
        self.stack[l].propagate(samples, n*self.stack.length);
        samples = self.stack[l].hidden;
    }
    debug("DBN: Learning finished.");
    if(onFinish != undefined){
        self.compress(samples, 20); // longer, until convergence.        
        var activations = [];
        var features = [];
        for(var i=0; i < self.stack.length; i++){
            activations[i] = self.stack[i].hidden._data;                        
            features[i] = self.stack[i].W._data;
        }
        // Calc reconstruction
        onFinish(self.reconstruct()._data, activations, features);
    }
}

DeepBeliefNetwork.prototype.compress = function(samples, n, compressUpdate){
    var self=this; 
    for(var l=0; l < self.stack.length; l++){
        debug("Compress - L"+l);
        debug("Stack - "+self.stack);
        self.stack[l].propagate(samples, n*(l+1), compressUpdate);
        if(compressUpdate != undefined){
            sleep(500);
            debug("Compress - call compressUpdate"+l);
            var activations = [];
            for(var i=0; i < self.stack.length; i++){
                activations[i] = self.stack[l].hidden._data;  
            }
            compressUpdate(self.reconstruct(l)._data, activations);
        }            
        samples = self.stack[l].hidden;
    }
    return samples;
}

DeepBeliefNetwork.prototype.reconstruct = function(layer){
    var self=this; 
    if(layer == undefined)
        layer = self.stack.length-1;
    for(var l=layer; l > 0; l--){
        self.stack[l].activateVisible("binary");        
        self.stack[l-1].hidden = self.stack[l].visible;
    }
    self.stack[0].activateVisible("binary");
    return self.stack[0].visible;
}