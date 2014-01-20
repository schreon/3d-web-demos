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

  self.clock = new THREE.Clock();
  self.camera = new THREE.OrthographicCamera(-w, w, -h, h, 1, 10000 );
  self.camera.position.set(0, 0, 100);
  self.camera.lookAt(new THREE.Vector3(0, 0, 0));


  self.scene = new THREE.Scene();

  /* **************************** */
  self.bodies = [];

  self.delta = 0.0;

  /* **************************** */
  self.renderer = new THREE.WebGLRenderer({antialias:true});
  self.renderer.setSize( window.innerWidth, window.innerHeight );
  //self.renderer.setClearColorHex( 0xffffff, 1 );
  document.body.appendChild( self.renderer.domElement );
  self.renderer.domElement.onclick = function(){
    if(self.onclick != undefined){
      console.log("CLICK");
      self.onclick();
    }
  }
  self.renderer.autoClear = false;
  self.renderer.shadowMapEnabled = true;
  self.renderer.shadowMapSoft = true;

  self.stats = new Stats();
  self.stats.domElement.style.position = 'absolute';
  self.stats.domElement.style.top = '0px';
  document.body.appendChild( self.stats.domElement );

  self.renderModel = new THREE.RenderPass( self.scene, self.camera );
  self.effectBloom = new THREE.BloomPass( 1.25 );
  self.effectFilm = new THREE.FilmPass( 0.35, 0.95, 2048, false );

  self.effectFilm.renderToScreen = true;

  self.composer = new THREE.EffectComposer( self.renderer );

  self.composer.addPass( self.renderModel );
  self.composer.addPass( self.effectBloom );
  self.composer.addPass( self.effectFilm );


  self.uniforms = {
    fogDensity: { type: "f", value: 0.45 },
    fogColor: { type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
    time: { type: "f", value: 1.0 },
    resolution: { type: "v2", value: new THREE.Vector2() },
    uvScale: { type: "v2", value: new THREE.Vector2( 1.5, 1.0 ) },
    texture1: { type: "t", value: THREE.ImageUtils.loadTexture( "../img/cloud.png" ) },
    texture2: { type: "t", value: THREE.ImageUtils.loadTexture( "../img/lavatile.jpg" ) }
  };

  self.uniforms.texture1.value.wrapS = self.uniforms.texture1.value.wrapT = THREE.RepeatWrapping;
  self.uniforms.texture2.value.wrapS = self.uniforms.texture2.value.wrapT = THREE.RepeatWrapping;

  self.lavaMaterial = new THREE.ShaderMaterial( {
    uniforms: self.uniforms,
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent
  } );

  self.blue_uniforms = {
    fogDensity: { type: "f", value: 0.01 },
    fogColor: { type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
    time: { type: "f", value: 1.0 },
    resolution: { type: "v2", value: new THREE.Vector2() },
    uvScale: { type: "v2", value: new THREE.Vector2( 0.5, 1.0 ) },
    texture1: { type: "t", value: THREE.ImageUtils.loadTexture( "../img/cloud.png" ) },
    texture2: { type: "t", value: THREE.ImageUtils.loadTexture( "../img/earth.jpg" ) }
  };
  self.blue_uniforms.texture1.value.wrapS = self.blue_uniforms.texture1.value.wrapT = THREE.RepeatWrapping;
  self.blue_uniforms.texture2.value.wrapS = self.blue_uniforms.texture2.value.wrapT = THREE.RepeatWrapping;

  self.blueMaterial = new THREE.ShaderMaterial( {
    uniforms: self.blue_uniforms,
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent
  } );


  self.green_uniforms = {
    fogDensity: { type: "f", value: 0.91 },
    fogColor: { type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
    time: { type: "f", value: 1.0 },
    resolution: { type: "v2", value: new THREE.Vector2() },
    uvScale: { type: "v2", value: new THREE.Vector2( 0.5, 1.0 ) },
    texture1: { type: "t", value: THREE.ImageUtils.loadTexture( "../img/cloud.png" ) },
    texture2: { type: "t", value: THREE.ImageUtils.loadTexture( "../img/greentile.jpg" ) }
  };
  self.green_uniforms.texture1.value.wrapS = self.green_uniforms.texture1.value.wrapT = THREE.RepeatWrapping;
  self.green_uniforms.texture2.value.wrapS = self.green_uniforms.texture2.value.wrapT = THREE.RepeatWrapping;
  
  self.greenMaterial = new THREE.ShaderMaterial( {
    uniforms: self.green_uniforms,
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent
  } );

  // FLOOR
  var floorTexture = new THREE.ImageUtils.loadTexture( '../img/universe.jpg' );
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
  floorTexture.repeat.set( 1, 1 );
  var floorMaterial = new THREE.MeshLambertMaterial( { map: floorTexture } );
  floorMaterial.side = THREE.DoubleSide;
  var floorGeometry = new THREE.PlaneGeometry(1952, 1300, 10, 10);
  var floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = 0;
  floor.receiveShadow = true;
  floor.castShadow = true;
  self.scene.add(floor);

  // Light

var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-300, -300, 400);
    directionalLight.castShadow = true;
    //directionalLight.shadowOnly = true;
    directionalLight.shadowDarkness = 0.9;
    self.scene.add(directionalLight);

  // add subtle ambient lighting
  var ambientLight = new THREE.AmbientLight(0x333333);
  self.scene.add(ambientLight);

  // ...
  // line pointing to mouse
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(0, 0, 0));
  geometry.vertices.push(new THREE.Vector3(0, 0, 0));
  var pointer = new THREE.Line(geometry, self.lavaMaterial);
  self.scene.add(pointer);
  self.pointer = pointer;

  // field border
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(-field_width/2, -field_height/2, 0));
  geometry.vertices.push(new THREE.Vector3(-field_width/2, field_height/2, 0));
  geometry.vertices.push(new THREE.Vector3(field_width/2, field_height/2, 0));
  geometry.vertices.push(new THREE.Vector3(field_width/2, -field_height/2, 0));
  geometry.vertices.push(new THREE.Vector3(-field_width/2, -field_height/2, 0));
  var bottomLine = new THREE.Line(geometry, self.blueMaterial);
  self.scene.add(bottomLine);

  $(document).ready(function(){
    $(document).mousemove(function(e){
      if(self.posX == undefined) return;
      var projector = new THREE.Projector();
      var mx = (e.pageX / window.innerWidth) * 2 -1;
      var my = -(e.pageY / window.innerHeight) * 2 +1;
      var p3D = new THREE.Vector3(mx, my, self.smallRadius);
      p2D = projector.unprojectVector(p3D, self.camera);
      self.pointer.geometry.vertices[0].x = self.posX[self.posX.length-1];
      self.pointer.geometry.vertices[0].y = -self.posY[self.posY.length-1];
      self.pointer.geometry.vertices[0].z = self.smallRadius;
      self.pointer.geometry.vertices[1].x = p2D.x;
      self.pointer.geometry.vertices[1].y = p2D.y;
      self.pointer.geometry.vertices[1].z = self.smallRadius;
      self.pointer.geometry.verticesNeedUpdate = true;
    });
  });

  //var windowResize = THREEx.WindowResize(self.renderer, self.camera);
  return self;
}


PhysicsView.createCircles = function(posX, posY, radii){
  var self=this;
  self.smallRadius = radii[0];
  var rcolor = new RColor();
  var smallGeometry =  new THREE.SphereGeometry(radii[0],64,64);
  var bigGeometry =  new THREE.SphereGeometry(radii[radii.length-1],128,128);
  for(var i=0; i < posX.length-1; i++){
    var col = rcolor.get(true);
      var circle = new THREE.Mesh(smallGeometry, self.blueMaterial);
      circle.receiveShadow = true;
      circle.castShadow = true;
      circle.position.x=posX[i];
      circle.position.y=-posY[i];
      circle.position.z=radii[i];
      circle.rotation.x = radii[i] > 32 ? 0.3 : 90*Math.random() ;
      self.scene.add(circle);
      self.bodies.push(circle);
  }

  // last one
  var circle = new THREE.Mesh(bigGeometry, self.lavaMaterial);
  circle.receiveShadow = true;
  circle.castShadow = true;
  circle.position.x=posX[radii.length-1];
  circle.position.y=-posY[radii.length-1];
  circle.position.z=radii[radii.length-1];
  circle.rotation.x = 0.3  ;
  self.scene.add(circle);
  self.bodies.push(circle);
}

PhysicsView.updateCircles = function(posX, posY, radii){

  var self=this;
  self.posX = posX;
  self.posY = posY;

  for(var i=0; i < self.bodies.length; i++){
    self.bodies[i].position.x = posX[i];
    self.bodies[i].position.y = -posY[i];
  }

  self.pointer.geometry.vertices[0].x = self.posX[self.posX.length-1];
  self.pointer.geometry.vertices[0].y = -self.posY[self.posY.length-1];
  self.pointer.geometry.vertices[0].z = self.smallRadius;
  self.pointer.geometry.verticesNeedUpdate = true;
}

PhysicsView.createCollisionDummy = function(existsCollision, colliderA, colliderB, colPosX, colPosY, colNormX, colNormY, newVelXA, newVelYA, newVelXB, newVelYB){
  var self=this;
}

PhysicsView.updateCollision = function(existsCollision, colliderA, colliderB, colPosX, colPosY, colNormX, colNormY, newVelXA, newVelYA, newVelXB, newVelYB){
  var self=this;
}

PhysicsView.refresh= function(){
  var self=this;
}

PhysicsView.createText = function(text, x, y, material){
    var self = this;

    var height = 20,
    size = 20,
    hover = 30,

    curveSegments = 4,

    bevelThickness = 2,
    bevelSize = 1.5,
    bevelSegments = 3,
    bevelEnabled = true,

    font = "droid sans", // helvetiker, optimer, gentilis, droid sans, droid serif
    weight = "normal", // normal bold
    style = "normal"; // normal italic

  var textGeo = new THREE.TextGeometry( text, {

          size: size,
          height: height,
          curveSegments: curveSegments,

          font: font,
          weight: weight,
          style: style,

          bevelThickness: bevelThickness,
          bevelSize: bevelSize,
          bevelEnabled: false,

          material: 0,
          extrudeMaterial: 1

        });

  textGeo.computeBoundingBox();
  textGeo.computeVertexNormals();


  textMesh1 = new THREE.Mesh( textGeo, material );
  var centerOffset = -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

  textMesh1.position.x = x+centerOffset;
  textMesh1.position.y = y;
  textMesh1.position.z = -50;

  textMesh1.rotation.x = Math.PI;
  textMesh1.rotation.y = Math.PI * 2;

  self.scene.add(textMesh1);

  return textMesh1;
}