var PhysicsController = function(){};

PhysicsController.create = function(scriptdir){
  var self = this;
  self.worker = new Worker(scriptdir + "physics.js");

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
                  self.onUpdate(message.posX, message.posY,
                    message.radii,message.debugInfo);
              break;
          case "onInitFinished":
              if(self.onInitFinished != undefined)
                  self.onInitFinished(message.fieldWidth, message.fieldHeight, message.posX, message.posY,message.radii,message.debugInfo);
              break;
      }
   });

  return self;
}

PhysicsController.init = function(){
  var self = this;
  self.worker.postMessage({cmd:"init"});
}

/*
  doNextStep - step to next collision
*/
PhysicsController.doNextStep = function(){
  var self = this;
  self.worker.postMessage({cmd:"doNextStep"});
}

/*
  doNextStep - step to next collision
*/
PhysicsController.doFire = function(fireX, fireY){
  var self = this;
  self.worker.postMessage({cmd:"doFire", fireX:fireX, fireY:fireY});
}

/*
  doNextStep - step to next collision
*/
PhysicsController.doToggleGravity = function(){
  var self = this;
  self.worker.postMessage({cmd:"doToggleGravity"});
}

/*
  doUpdate - normal update, hides all immediate steps

*/
PhysicsController.doUpdate = function(){
  var self = this;
  self.worker.postMessage({cmd:"doUpdate"});
}