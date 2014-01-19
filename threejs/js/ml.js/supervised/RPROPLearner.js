/*****************************************************************************
 *
 *    Resilient Propagation Learner Class
 *   
 ****************************************************************************/
debug("Loading Class: RPROPLearner");

var RPROPLearner = function(){};

RPROPLearner.create = function(net, batchsize){
    var self = new RPROPLearner();
    self.updateFreq = 5;
    
    self.net = net;
    self.batchsize = batchsize;
    
    self.er = [];
    self.bErr = [];
    self.e = [];
    self.bO = [];
    self.bCha = [];
    self.err = [];
    
    for(var l=0; l < net.structure.length-1; l++){
        self.e[l]     = new Matrix(batchsize, net.structure[l]); 
        self.err[l]   = new Matrix(batchsize, net.structure[l+1]);
        self.er[l]    = new Matrix(net.structure[l], net.structure[l+1]);
        self.bO[l]    = new Matrix(1, batchsize); 
        self.bCha[l]  = new Matrix(1, net.structure[l+1]); 
    }
    
    self.minStep = 0.0000001;                               
    self.maxStep = 0.1;                                     
    self.iniStep = 0.0001;                                  

    self.pheP = 1.2;
    self.pheM = 0.5;    
    
    self.eD  = [];                                          
    self.eO  = [];                                        
    self.eDD = [];                                        
    self.eP  = [];
    
    self.eDP = [];
    self.eDM = [];
    self.eDN = [];
    self.changes = [];
    
    // Helper arrays
    for(var i=0; i < net.structure.length-1; i++){
        self.eD[i]  =  new Matrix(net.weights[i].shape[0], net.weights[i].shape[1]);
        self.eO[i]  =  new Matrix(net.weights[i].shape[0], net.weights[i].shape[1]);
        self.eDP[i] =  new Matrix(net.weights[i].shape[0], net.weights[i].shape[1]);
        self.eDM[i] =  new Matrix(net.weights[i].shape[0], net.weights[i].shape[1]);
        self.eDN[i] =  new Matrix(net.weights[i].shape[0], net.weights[i].shape[1]);
        self.eDD[i] =  new Matrix(net.weights[i].shape[0], net.weights[i].shape[1]);        
        self.eDD[i].init(self.iniStep);
        self.eP[i]  =  new Matrix(net.weights[i].shape[0], net.weights[i].shape[1]);
        self.changes[i] = new Matrix(net.weights[i].shape[0], net.weights[i].shape[1]);
    }

    return self;
}

RPROPLearner.prototype.learnOnline = function(){
    // 1. liste mit matrix zeilen holen (subarrays, selbe daten!): patterns UND targets.
    // 2. schleife über alle zeilen, in zufälliger reihenfolge.
    //    I.   propagate vektor
    //    II.  backpropagate target
    //    III. RPROP anwenden
    //    IV.  Weight decay anwenden
    // 3. alle propagieren und ergebnis zurückgeben.
    
}

// Uses current activation matrices
RPROPLearner.prototype.backpropagate = function(patterns, targets){    
    var self = this;
    var net = self.net;
    var out = net.propagateRandom(patterns);
    var o = net.activations;
    
    self.bEr = [];
    var er = self.er;
    var bEr = self.bEr;
    
    var err = self.err[self.err.length-1];
    targets.minus(net.activations[net.activations.length-1], err);
    err.apply(function(x){return x*(1.0-x)}); 
    
    for(var l=net.structure.length-2; l > -1; l--){
        
        // Bias unit
        var bCha = self.bCha[l];        
        var bO = self.bO[l];
        bO.init(1.0);
        
        bO.mult(err, bCha); 
        bEr[l] = bCha;
        
        // Weights
        o[l].transpose();            
        o[l].mult(err, er[l]);        
        o[l].transpose(); // transpose back
        
        // Delta for next step
        if (l>0){
            net.weights[l].transpose();
            var e = self.e[l];
            err.mult(net.weights[l], e);
            
            net.weights[l].transpose();
            e.apply(function(x){return x*(1.0-x)});
            err = e;
        }
    }
    return out;
}

RPROPLearner.prototype.learnBackprop = function(rate, weightDecay){ 
    var self = this;
    var net = self.net;
    for(var l=0; l < net.structure.length-1; l++){

        // Change weights
        self.er[l].mult(rate/self.batchsize, self.er[l]);
        net.weights[l].plus(self.er[l], net.weights[l]);
        
        // Change Bias weights
        self.bEr[l].mult(rate/self.batchsize, self.bEr[l]);     
        net.biases[l].plus(self.bEr[l], net.biases[l]);        
                
        // apply weightDecay
        net.weights[l].mult(1.0-weightDecay, net.weights[l]);
        net.biases[l].mult(1.0-weightDecay, net.biases[l]);        
    }
    
}

RPROPLearner.prototype.learnRPROP = function(weightDecay){
    if (weightDecay == undefined)
        weightDecay = 0.01;
    
    var self = this;
    var net = self.net;
    var er = self.er;
    
    // Adapt step sizes
    for (var l=0; l < net.structure.length-1; l++){
        er[l].apply(function(x){ 
                if(x == 0.0)
                    return 0.0;
                if(x < 0.0)
                    return -1.0;
                return 1.0;
            }, self.eD[l]);    
        
        self.eD[l].dot(self.eO[l], self.eP[l]);
        self.eD[l].apply(function(x){return x;},self.eO[l]);
        
        self.eP[l].apply(function(x){
                return x > 0.0 ? 1.0 : 0.0;
            }, self.eDP[l]);                        
        self.eDP[l].mult(self.pheP, self.eDP[l]);
        
        self.eP[l].apply(function(x){
                return x < 0.0 ? 1.0 : 0.0;
            }, self.eDM[l]);
        self.eDM[l].mult(self.pheM, self.eDM[l]);
        
        self.eP[l].apply(function(x){
                return x == 0.0 ? 1.0 : 0.0;
            }, self.eDN[l]);
        
        self.eDD[l].init(0.0);
        
        self.eDD[l].plus(self.eDP[l]);
        self.eDD[l].plus(self.eDM[l]);
        self.eDD[l].plus(self.eDN[l]);
        
        // keep in range
        self.eDD[l].clip(self.minStep, self.maxStep);
    }
    
    
    // Apply step sizes
    for(var l=0; l < net.structure.length-1; l++){
        self.eD[l].dot(self.eDD[l], self.changes[l]);
        net.weights[l].plus(self.changes[l]);

        // Fies und gemein: Bias unit einfach mit Backprop mitschleifen Oo
        self.bEr[l].mult(0.5, self.bEr[l]);     
        net.biases[l].plus(self.bEr[l], net.biases[l]);

        // apply weight decay
        net.weights[l].mult(1.0-weightDecay, net.weights[l]);
        net.biases[l].mult(1.0-weightDecay, net.biases[l]);
    }

    
}

RPROPLearner.prototype.learnMiniBatches = function(allsamples, alltargets, epochs, trainUpdate, onFinish){
    var self = this;
    
    samples  = allsamples.split(this.batchsize);
    targets  = alltargets.split(this.batchsize);
    
    var initialDecay = 0.001;
    var weightDecay = 0.001;
    var decayDecay = 0.98942451937928016271308259530351;
    var best = Math.inf;
    self.bestParas = {};
    var k=0;
    
    // do this in a shuffled way.
    var indices = range(samples.length);
    for(var e=0; e < epochs; e++){
        shuffle(indices);
        for(var s=0; s < samples.length; s++){
            self.backpropagate(samples[indices[s]], targets[indices[s]]);
            self.learnRPROP(weightDecay); 
            //self.learnBackprop(weightDecay);
        }
        
        
        if(e % self.updateFreq == 0){            
            
            weightDecay*=decayDecay;
        
            var activations = self.net.propagate(allsamples);
            var actlist = [];
            for (var i=0; i < activations.length; i++)
                actlist[i] = activations[i]._data;
            
            var err = activations[activations.length-1];
            err.minus(alltargets);
            var rmse = getRMSE(err);
            
            if(rmse < best){
                debug("Epoch "+e+", NEW BEST: "+rmse);
                self.bestParas = []; // 1. weights, 2. bias
                var biases = [];
                var weights = [];
                for(var w=0; w < self.net.weights; w++){
                    weights[w] = self.net.weights[w].clone();
                    biases[w] = self.net.biases[w].clone();
                }
                self.bestParas = {weights:weights, biases:biases};
                weightDecay /= Math.pow(decayDecay, k/2);      
                weightDecay = Math.min(initialDecay, weightDecay);
                k = 0;
            }else{                
                k ++;
                debug("Epoch "+e+", RMSE: "+rmse.toFixed(5)+", WDECAY: "+weightDecay.toFixed(5));
            }
            if(trainUpdate != undefined)
                trainUpdate(actlist);
        }
        sleep(5); // Sleep a bit to give the garbage collector some time.
    }
    
    // Finished. Reset to best Paras.
    self.net.weights = self.bestParas["weights"];
    self.net.biases = self.bestParas["biases"];
    
    var activations = self.net.propagate(allsamples);
    var actlist = [];
    for (var i=0; i < activations.length; i++)
        actlist[i] = activations[i]._data;
    if(onFinish != undefined)
       onFinish(actlist);
}