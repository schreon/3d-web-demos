(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory;
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.RColor = factory();
    }
}(this, function () {

  var RColor = function() {
    this.hue      = Math.random(),
    this.goldenRatio  = 0.618033988749895;
  };

  RColor.prototype.hsvToRgb = function (h,s,v) {
    var h_i = Math.floor(h*6),
      f   = h*6 - h_i,
      p = v * (1-s),
      q = v * (1-f*s),
      t = v * (1-(1-f)*s),
      r = 255,
      g = 255,
      b = 255;
    switch(h_i) {
      case 0: r = v, g = t, b = p;  break;
      case 1: r = q, g = v, b = p;  break;
      case 2: r = p, g = v, b = t;  break;
      case 3: r = p, g = q, b = v;  break;
      case 4: r = t, g = p, b = v;  break;
      case 5: r = v, g = p, b = q;  break;
    }
    return [Math.floor(r*256),Math.floor(g*256),Math.floor(b*256)];
  };

  RColor.prototype.get = function(hex,saturation,value) {
    this.hue += this.goldenRatio;
    this.hue %= 1;
    if(typeof saturation !== "number")  saturation = 0.5;
    if(typeof value !== "number")   value = 0.95;
    var rgb = this.hsvToRgb(this.hue,saturation,value);
    if(hex)
      return "#"+rgb[0].toString(16)+rgb[1].toString(16)+rgb[2].toString(16);
    else 
      return rgb;
  };

  return RColor;

}));

var PhysicsView = {};

PhysicsView.create = function(field_width, field_height){
  var w = window.innerWidth/2;
  var h = window.innerHeight/2;
  var self=this;

  self.camera = new THREE.OrthographicCamera(-w, w, -h, h, 1, 10000 );
  self.camera.position.set(0, 0, 100);
  self.camera.lookAt(new THREE.Vector3(0, 0, 0));

  self.scene = new THREE.Scene();

  /* **************************** */
  self.bodies = [];

  // Center circle
    var material = new THREE.LineBasicMaterial({
        color: 0xFF0000,
    });
      var geometry = new THREE.CircleGeometry(1,20);
    var circle = new THREE.Line(geometry, material);
    circle.position.x=0;
    circle.position.y=0;
    circle.position.z=0;
    self.scene.add(circle);

  // bottom line
  var material = new THREE.LineBasicMaterial({
        color: 0xFF0000,
  });
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(-field_width/2, -field_height/2, 0));
  geometry.vertices.push(new THREE.Vector3(-field_width/2, field_height/2, 0));
  geometry.vertices.push(new THREE.Vector3(field_width/2, field_height/2, 0));
  geometry.vertices.push(new THREE.Vector3(field_width/2, -field_height/2, 0));
  geometry.vertices.push(new THREE.Vector3(-field_width/2, -field_height/2, 0));
  var bottomLine = new THREE.Line(geometry, material);
  self.scene.add(bottomLine);


  /* **************************** */
  self.renderer = new THREE.WebGLRenderer({antialias:true});
  self.renderer.setSize( window.innerWidth, window.innerHeight );

  document.body.appendChild( self.renderer.domElement );
  self.renderer.domElement.onclick = function(){
    if(self.onclick != undefined){
      console.log("CLICK");
      self.onclick();
    }
  }
  return self;
}


PhysicsView.createCircles = function(posX, posY, radii, velX, velY){
  var self=this;

  var rcolor = new RColor();
  for(var i=0; i < posX.length; i++){
      var material = new THREE.LineBasicMaterial({
          color: rcolor.get(true)
      });
      var geometry = new THREE.CircleGeometry(radii[i],20);
      var circle = new THREE.Line(geometry, material);
      circle.position.x=posX[i];
      circle.position.y=-posY[i];
      circle.position.z=0;
      self.scene.add(circle);
      self.bodies.push(circle);
  }
}

PhysicsView.updateCircles = function(posX, posY, radii, velX, velY){
  var self=this;
  for(var i=0; i < self.bodies.length; i++){
    self.bodies[i].position.x = posX[i];
    self.bodies[i].position.y = -posY[i];
  }
}

PhysicsView.createCollisionDummy = function(existsCollision, colliderA, colliderB, colPosX, colPosY, colNormX, colNormY, newVelXA, newVelYA, newVelXB, newVelYB){
  var self=this;
  // TODO: initialize fields
}

PhysicsView.updateCollision = function(existsCollision, colliderA, colliderB, colPosX, colPosY, colNormX, colNormY, newVelXA, newVelYA, newVelXB, newVelYB){
  var self=this;
  // TODO: show/hide collision view elements depending on existsCollision
  // TODO: update collision view elements
  // TODO: color colliders differently
}

PhysicsView.refresh= function(){
  var self=this;
  self.renderer.render( self.scene, self.camera );
}