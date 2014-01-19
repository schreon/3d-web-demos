/*****************************************************************************
 *
 *    Restricted Boltzmann Machine Class
 *   
 ****************************************************************************/
debug("Loading Class: RestrictedBoltzmannMachine");

var RestrictedBoltzmannMachine = function(){};

RestrictedBoltzmannMachine.create = function(numvis, numhidden){
    // structure: array with numbers indicating neuron number
    var self = new RestrictedBoltzmannMachine();
    self.numVis     = numvis;
    self.numHidden  = numhidden;
    
    self.W  = new Matrix(numvis, numhidden);
    self.Bv = new Matrix(1, numhidden);
    self.Bh = new Matrix(1, numvis);
    
    function bengioInit(n, m){
        return Math.sqrt(6) / (Math.sqrt(n+m));
    }
    
    self.W.randomize(-bengioInit(numvis, numhidden),bengioInit(numvis, numhidden));
    self.Bv.randomize(-bengioInit(numvis, numhidden),bengioInit(numvis, numhidden));
    self.Bh.randomize(-bengioInit(numvis, numhidden),bengioInit(numvis, numhidden));
    
    return self;
}

RestrictedBoltzmannMachine.prototype.createLayers = function(samples){
    var self=this;
    
    /**
     * Benötigt, jeweils für jedes Sample:
     * - Visible Activation
     * - Hidden Activation
     * 
     * - Fraction Matrix - data
     * - Fraction Matrix - recon
     */
    
    self.visible = samples.clone();
    self.hidden = new Matrix(samples.shape[0], self.numHidden);
    
    self.fracData = new Matrix(self.W.shape[0], self.W.shape[1]);
    self.fracRecon = new Matrix(self.W.shape[0], self.W.shape[1]);
    
    self.fracBhData  = new Matrix(1, self.W.shape[0]);
    self.fracBhRecon = new Matrix(1, self.W.shape[0]);
    
    self.fracBvData = new Matrix(1, self.W.shape[1]);
    self.fracBvRecon = new Matrix(1, self.W.shape[1]);
}

RestrictedBoltzmannMachine.prototype.activateHidden = function(){
    var self=this;    
    self.visible.mult(self.W, self.hidden);
    self.hidden.plus(self.Bv, self.hidden);
    self.hidden.gibbs();
}

RestrictedBoltzmannMachine.prototype.activateVisible = function(mode){    
    var self=this;
    
    self.W.transpose();
    self.hidden.mult(self.W, self.visible);
    self.W.transpose();
    self.visible.plus(self.Bh);
    if((mode == undefined) || (mode == "gibbs"))        
        self.visible.gibbs();
    else{
        self.visible.binary();
    }
}


RestrictedBoltzmannMachine.prototype.propagate = function(samples, n){
    if(this.visible == undefined || this.visible.shape[0] != samples.shape[0])
        this.createLayers(samples);
    
    samples.copyTo(this.visible);
    for (var e=0; e < n-1; e++){
        this.activateHidden();
        this.activateVisible();
    }
    this.activateHidden();
    this.activateVisible("binary");
    return this.visible;
}


RestrictedBoltzmannMachine.prototype.learn = function(samples, n, learnrate, weightDecay){
    if(this.visible == undefined || this.visible.shape[0] != samples.shape[0])
        this.createLayers(samples);
    
    var self=this;
        
    self.visible = samples.clone();
    
    var frac = 1.0/samples.shape[0];
    
    // hidden bias
    self.visible.mean(0, self.fracBhData);
    self.fracBhData.mult(frac)
    
    // Activate hidden and save fracData
    self.activateHidden();
    self.visible.transpose();
    self.visible.mult(self.hidden, self.fracData);
    self.visible.transpose();
    self.fracData.mult(frac);
    
    // visible bias
    self.hidden.mean(0, self.fracBvData);
    self.fracBvData.mult(frac);
    
    self.activateVisible();    
    
    for (var e=1; e < n; e++){
        self.activateHidden();
        self.activateVisible();
    }
    
    // biases
    self.visible.mean(0, self.fracBhRecon);
    self.fracBhRecon.mult(frac);
    self.hidden.mean(0,  self.fracBvRecon);
    self.fracBvRecon.mult(frac);
        
    // save fracRecon
    self.visible.transpose();
    self.visible.mult(self.hidden, self.fracRecon);
    self.visible.transpose();
    self.fracRecon.mult(frac);
    
    // weight change
    self.fracData.minus(self.fracRecon, self.fracData);
    self.fracData.mult(learnrate);
    self.W.plus(self.fracData, self.W);
    // Add weight decay
    self.W.mult(1.0-weightDecay);
    
    // bias changes
    self.fracBhData.minus(self.fracBhRecon, self.fracBhData);
    self.fracBvData.minus(self.fracBvRecon, self.fracBvData);
    self.fracBhData.mult(learnrate);
    self.fracBvData.mult(learnrate);    
    self.Bv.plus(self.fracBvData);
    self.Bh.plus(self.fracBhData);
    self.Bv.mult(1.0-weightDecay);
    self.Bh.mult(1.0-weightDecay);
    return self.visible;
}