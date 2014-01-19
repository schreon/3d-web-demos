/*****************************************************************************
 *
 *    Controller - Worker Part
 *    
 *    Commands accepted by this worker:
 *    - pretrain (patterns)
 *    - train (patterns, labels)
 *    - reconstruct (patterns) - callback(states, weights)
 *    - classify (patterns)    - callback(classes)
 *    
 *    Events fired by this worker:
 *    - onPretrainUpdate(states, weights)
 *    - onPretrainFinished(states, weights)
 *    - onTrainUpdate(states, weights)
 *    - onTrainFinished(states, weights    
 *    
 ****************************************************************************/
importScripts('Utilities.js');
importScripts('Matrix.js');
importScripts('models/NeuralNetwork.js');
importScripts('models/RBM.js');
importScripts('models/DeepBeliefNetwork.js');
importScripts('supervised/RPROPLearner.js');
importScripts('DigitClassifier.js');

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
        case "setup" : 
            var patterns = message.patterns;
            var labels = message.labels;
            DigitClassifier.setup(patterns, labels);
            self.postMessage({cmd:"onSetupFinished"});
            break;
        case "pretrain" :
            DigitClassifier.pretrain(message.epochs, function(reconstruction, activations, features){    
                self.postMessage({cmd:"onPretrainUpdate", reconstruction:reconstruction});
            }, function(reconstruction, activations, features){    
                self.postMessage({cmd:"onPretrainFinished", reconstruction:reconstruction});
            });
            break;
        case "train" : 
            DigitClassifier.train(message.epochs, function(classes){
                self.postMessage({cmd:"onTrainUpdate", classes:classes});
            }, function(classes){
                self.postMessage({cmd:"onTrainFinished", classes:classes});
            });
            break;
        case "classify" : 
            debug(message.sample);
            DigitClassifier.classify(message.sample, function(recon){                
                // onUpdate
                self.postMessage({cmd:"onClassifyUpdate", recon:recon});
            }, function(recon, label){
                // onFinish
                self.postMessage({cmd:"onClassifyFinish", recon:recon, label:label});
            });
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

log("DigitClassifierWorker Instance loaded.");