var PhysicsController = function(){};

PhysicsController.create = function(scriptdir){
  var self = this;
  self.worker = new Worker(scriptdir + "physicsworker.js");

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
                  self.onUpdate(message.posX, message.posY, message.anglesX, message.anglesY
                                ,message.radii,message.debugInfo);
              break;
          case "onInitFinished":
              if(self.onInitFinished != undefined)
                  self.onInitFinished(message.posX, message.posY, message.anglesX, message.anglesY
                                ,message.radii,message.debugInfo);
              break;
      }
   });

  return self;
}

PhysicsController.init = function(){
  var self = this;
  self.worker.postMessage({cmd:"init"});
}

PhysicsController.doUpdate = function(){
  var self = this;
  self.worker.postMessage({cmd:"doUpdate"});
}