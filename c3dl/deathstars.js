/**
	Leon Schroeder
	ls066@hdm-stuttgart.de
*/

c3dl.addMainCallBack(canvasMain, "minideathstars");
var isDragging = false;
var rotationStartCoords = [0,0];
var SENSITIVITY = 0.7;

function mouseUp(evt)
{
	if(evt.which == 1)
	{
		isDragging = false;
	}
}

function mouseDown(evt)
{
	if(evt.which == 1)
	{
		isDragging = true;
		rotationStartCoords[0] = xevtpos(evt);
		rotationStartCoords[1] = yevtpos(evt);
	}
}

function mouseMove(evt)
{
	if(isDragging == true)
	{
        var cam = scn.getCamera();
		var x = xevtpos(evt);
		var y = yevtpos(evt);
		
		var deltaX = x - rotationStartCoords[0];
                var deltaY = y - rotationStartCoords[1];

		cam.yaw(-deltaX * SENSITIVITY);
		cam.pitch(deltaY * SENSITIVITY);
		
		rotationStartCoords = [x,y];
	}
}

function xevtpos(evt)
{
    return 2 * (evt.clientX / evt.target.width) - 1;
}

function yevtpos(evt)
{
    return 2 * (evt.clientY / evt.target.height) - 1;
}


function swapOrbitPoint(evt) {
	if(evt.keyCode == 32) {
		var cam = scn.getCamera();
		if(c3dl.isVectorEqual(cam.getOrbitPoint(),duck.getPosition())) {
			cam.setOrbitPoint(teapot.getPosition());
		}
		else{
			cam.setOrbitPoint(duck.getPosition());
		}
	}
}

var textures = ["tex1.jpg", "tex2.jpg", "tex3.jpg", "tex4.jpg", "tex5.jpg"];
var miniDeathStars = [];

function rndPoint(){
	return Math.random()*200.0-100.0;
}

// function to add another miniDeathStar to the scene
function addMiniDeathStar(x,y,z) {
  newminiDeathStar = new c3dl.Sphere(10);
  var randTexture = textures[Math.floor(Math.random() * textures.length)];
  newminiDeathStar.setTexture(randTexture);
  newminiDeathStar.setPosition([x,y,z])
  miniDeathStars.push(newminiDeathStar);
  return newminiDeathStar;
}

// main program
function canvasMain(canvasName){

 scn = new c3dl.Scene();
 scn.setCanvasTag(canvasName);
 scn.setBackgroundColor([0,0,0,0]); // black background

 renderer = new c3dl.WebGL();
 renderer.createRenderer(this);

 scn.setRenderer(renderer);
 scn.init(canvasName);

 if(renderer.isReady() )
 {   
   var myMiniDeathStar = addMiniDeathStar(0,0,0);
   scn.addObjectToScene(myMiniDeathStar);

   cam = new c3dl.OrbitCamera();
   cam.setFarthestDistance(1000);
   cam.setClosestDistance(20);	
   cam.setOrbitPoint(myMiniDeathStar.getPosition());
   cam.setDistance(150);
   scn.setCamera(cam);


   spot = new c3dl.SpotLight();
   spot.setPosition([0.0, 150.0, 0.0]);
   spot.setDirection([0.0,-1.0,0.0]);
   spot.setSpecular([0.5,0.5,0.5,1.0]);
   spot.setDiffuse([0.2,0.2,0.2,1.0]);
   spot.setCutoff(180);
   spot.setExponent(1)
   spot.setOn(true);


   scn.addLight(spot);

   scn.startScene();
 }


}

// Add random death star to the scene
function addRandomMiniDeathStar(){
   var newMiniDeathStar = addMiniDeathStar(rndPoint(),rndPoint(),rndPoint());
   scn.addObjectToScene(newMiniDeathStar);
}

// Remove random death star from the scene
function removeRandomMiniDeathStar(){
	if (miniDeathStars.length > 0) {		
		var index = miniDeathStars[Math.floor(Math.random() * miniDeathStars.length)];
		scn.removeObjectFromScene(index);
		miniDeathStars.splice(index,1);	
	}
}