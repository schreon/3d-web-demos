/*****************************************************************************
 *
 *    Digit Classifier Controller Class
 *    - Include this in your main JavaScript program
 *    
 ****************************************************************************/

var DigitClassifierController = function(){};

DigitClassifierController.create = function(){
    var self = this;
    self.worker = new Worker("DigitClassifierWorker.js");
    
     self.worker.addEventListener('message', function(message){
        message = message.data;
        switch (message.cmd){
            case "echo":
                console.log(message.txt);
                break;
            case "log":
                console.log(message.txt);
                break;
            case "debug":
                console.log(message.txt);
                break;
            case "error":
                console.log(message.txt);
                break;
            case "onSetupFinished":
                if(self.onSetupFinished != undefined)
                    self.onSetupFinished();
                break;            
            case "onPretrainUpdate":
                if(self.onPretrainUpdate != undefined)
                    self.onPretrainUpdate(message.reconstruction, message.activations, message.features);                
                break;
            case "onPretrainFinished":
                if(self.onPretrainFinished != undefined)
                    self.onPretrainFinished(message.reconstruction, message.activations, message.features);
                break;
            case "onTrainUpdate":
                if(self.onTrainUpdate != undefined)
                    self.onTrainUpdate(message.classes);                
                break;
            case "onTrainFinished":
                if(self.onTrainFinished != undefined)
                    self.onTrainFinished(message.activations);
                break;
            case "onClassifyUpdate":
                if(self.onClassifyUpdate != undefined)
                    self.onClassifyUpdate(message.recon);
                break;
            case "onClassifyFinish":
                if(self.onClassifyFinish != undefined)
                    self.onClassifyFinish(message.recon, message.label);
                break;
        }
     });
     
     self.setup = function(patterns, labels){
         self.worker.postMessage({cmd:"setup", patterns:patterns, labels:labels});
     }
     
     self.pretrain = function(epochs){
         self.worker.postMessage({cmd:"pretrain", epochs:epochs});
     }
     
     self.train = function(epochs){
         self.worker.postMessage({cmd:"train", epochs:epochs});
     }
     
     self.classify = function(sample){
         self.worker.postMessage({cmd:"classify", sample:sample});
     }
     return this;
}