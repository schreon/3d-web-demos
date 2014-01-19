var SpringPhysicsController = function(){};

SpringPhysicsController.create = function(scriptdir){
  var self = this;
  self.worker = new Worker(scriptdir + "springworker.js");

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
          case "onUpdate":
              if(self.onUpdate != undefined)
                  self.onUpdate(message.nodesPosX, message.nodesPosY, message.collisions
                                ,message.velNormX,message.velNormY,message.accNormX,message.accNormY);
              break;
          case "onInitFinished":
              if(self.onInitFinished != undefined)
                  self.onInitFinished(message.nodesPosX, message.nodesPosY);
              break;
      }
   });

  return self;
}

SpringPhysicsController.init = function(numIndividuals, numNodesPerIndividual, radius){
  var self = this;
  self.worker.postMessage({cmd:"init", numIndividuals:numIndividuals
    , numNodesPerIndividual:numNodesPerIndividual, radius:radius});
}

SpringPhysicsController.doUpdate = function(){
  var self = this;
  self.worker.postMessage({cmd:"doUpdate"});
}