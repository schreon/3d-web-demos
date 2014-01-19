/*****************************************************************************
 *
 *    Digit Classifier Class
 *   
 ****************************************************************************/
debug("Loading Class: DigitClassifier");

var DigitClassifier = function(){};

DigitClassifier.setup = function(patterns, labelString){
    var self = this;
    patterns = new Matrix(patterns.length/400, 400, patterns);
    self.patterns = patterns;
    self.labelString = labelString;
    self.classDict = self.createClassDict(labelString);
    self.labels = self.createLabelMatrix(self.classDict, labelString);
        
    // create models
    self.DBN = DeepBeliefNetwork.create([400, 100, 50, 9]);
    self.NN = NeuralNetwork.create([50, 10]);    
}

// One output neuron per class.
DigitClassifier.createClassDict = function(labelString){
    var arr = labelString.split("");
    var n = arr.length;

    var chars = [];

    for(var i=0; i < n; i++){
        var cls = arr[i];
        if(chars.indexOf(cls)==-1)
            chars.push(cls);
    }

    return chars;
}

DigitClassifier.createLabelMatrix = function(classDict, labelString){
    var arr = labelString.split("");
    var n = arr.length;
    var m = classDict.length;
    var sampleArr = new Float64Array(n*m);

    for(var i=0; i < n; i++){
        var c = arr[i];
        var j = classDict.indexOf(c);
        sampleArr[i*m+j] = 1.0;                        
    }

    var sampleMat = new Matrix(n,m,sampleArr);
    return sampleMat;
}

DigitClassifier.pretrain = function(epochs, onUpdate, onFinish){
    var self = this;
    self.DBN.learn(self.patterns, 4, epochs, onUpdate, onFinish);   
}


DigitClassifier.train = function(epochs, onUpdate, onFinish){
    debug("DigitClassifier.train")
    var self = this;
    // 1. copy compressed samples from DBN.
    var patterns = self.DBN.compress(self.patterns, 10);
    var learner = RPROPLearner.create(self.NN, 1);
    debug(patterns);
    learner.learnMiniBatches(patterns, self.labels, epochs, function(activ){
        onUpdate(getLabels(activ[activ.length-1], self.classDict));
    }, onFinish);
}

DigitClassifier.classify = function(sample, onUpdate, onFinish){
    var self = this;
    debug("Sample:");
    sample = new Matrix(1,400, sample);
    debug(sample);
    var pattern = self.DBN.compress(sample, 10, onUpdate);
    debug("Pattern:");
    debug(pattern);
    var activ = self.NN.propagate(pattern);    
    debug("Calling onFinish now.");
//    if(onFinish != undefined)
//        onFinish(getLabels(activ[activ.length-1], self.classDict));
}