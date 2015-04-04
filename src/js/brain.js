/* Class BrainModule
   Responsible for the entire brain view, animations, interactions...	
*/
NS.BrainModule = function(domElement, brainUrl){
	this._parentDomElement = domElement;
	this._domElement = null;
	this._brainUrl = "resources/brain.json";
	this._brain = null;
	this._nsscene = null;
	this._isLoaded = false;
};

NS.BrainModule.prototype.availableCommands = function(){
	return ["setOpacity", "setColor", "rotateCamera", "animationDuration"];
}

NS.BrainModule.prototype.performCommand = function(){
	this._nsscene.performCommand.apply(this._nsscene, arguments);
};

NS.BrainModule.prototype.isLoaded = function(){
	return this._isLoaded;
};

NS.BrainModule.prototype.load = function(caller, callback){
	var brainLoadingHandler = function(brain){
		this._brain = JSON.parse(brain)["brain"];
						
		// loading the objects that will be added to the scene
		var objectsToLoad = this._brain.length;
		var objectsLoaded = 0;
		
		var objectLoadingHandler = function(){
			objectsLoaded++;
			if(objectsLoaded == objectsToLoad){
				this._isLoaded = true;
				callback.call(caller);
			}
		}
		
		for(var i = 0; i < objectsToLoad; i++){
			this._nsscene.addObject(this._brain[i].nickName, this._brain[i].opacity, this._brain[i].color, this._brain[i].url, this, objectLoadingHandler);
		}
	
	};
	
	this._domElement = document.createElement("div");
	this._domElement.id = "brainModule";
	
	this._nsscene = new NS.Scene(this._domElement);
	NS.Utilities.asyncLoadTextFile(this._brainUrl, this, brainLoadingHandler);
};

NS.BrainModule.prototype.show = function(){
	this._domElement.appendChild(document.createTextNode(""));
	this._parentDomElement.appendChild(this._domElement);
	
	/* The reason we need to call it here it that it needs to know its view dimensions in order to
	do the controls tracking. If we put it before, the dom object won't be initialized */
	this._nsscene.load();
};

NS.BrainModule.prototype.hide = function(){
	 this._parentDomElement.removeChild(this._domElement);
};

NS.BrainModule.prototype.playStep = function(){
	this._nsscene.playAnimations();	
};
/* Class Scene
   Responsible for the view itself
*/
NS.Scene = function(domElement){
	this._domElement = domElement;
	this._sceneObjects = {};
	this._scene = null;
	this._renderer = null;
	this._camera = null;
	this._controls = null;
	this.animationManager = null;
};

NS.Scene.prototype.performCommand = function(){
	switch(arguments[0]){
		case "setOpacity":
			console.log(arguments[1], arguments[2]);
			this.setOpacity([arguments[1]], arguments[2]);
		break;
		case "setColor":
			this.setColor([arguments[1]], arguments[2]);
		break;
		case "rotateCamera":
			this.animationManager.addAnimatablePropertyToQueue.apply(this.animationManager, ["camera", this._camera, arguments[1], arguments[2], arguments[3]]);
		break;
		case "animationDuration":
			this.animationManager.animationDuration = arguments[1];
		default:
		break;
	}
};

NS.Scene.prototype.load = function(){
	this._scene = new THREE.Scene();
	this._renderer = new THREE.WebGLRenderer( { alpha: true } );
	this._camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
	this.animationManager = new NS.AnimationManager();
	
	// Controls setup
	this._controls = new THREE.TrackballControls(this._camera, this._domElement);
	this._controls.rotateSpeed = 3.0;
	this._controls.zoomSpeed = 2;
	this._controls.panSpeed = 2;
	this._controls.noZoom = false;
	this._controls.noPan = true;
	this._controls.staticMoving = true;
	this._controls.maxDistance = 200;
	this._controls.minDistance = 10;
	
	// Scene setup
	var ambient = new THREE.AmbientLight(0xffffff);
	this._scene.add(ambient);
	
	var pointLight1 = new THREE.PointLight(0xffffff, 4, 200);
	pointLight1.position.set(0, 0, 200);
	this._scene.add(pointLight1);
	
	var pointLight2 = new THREE.PointLight(0xffffff, 4, 200);
	pointLight2.position.set(0, 0, -200);
	this._scene.add(pointLight2);
	
	var pointLight3 = new THREE.PointLight(0xffffff, 4, 200);
	pointLight3.position.set(200, 0, 0);
	this._scene.add(pointLight3);
	
	var pointLight4 = new THREE.PointLight(0xffffff, 4, 200);
	pointLight4.position.set(-200, 0, 0);
	this._scene.add(pointLight4);
	
	var pointLight5 = new THREE.PointLight(0xffffff, 4, 200);
	pointLight5.position.set(0, 200, 0);
	this._scene.add(pointLight5);
	
	var pointLight6 = new THREE.PointLight(0xffffff, 4, 200);
	pointLight6.position.set(0, -200, 0);
	this._scene.add(pointLight6);
	
	this._camera.position.z = 150;
	
	this._renderer.setSize(this._domElement.clientWidth, this._domElement.clientHeight);
	this._renderer.setClearColor(0x000000, 0);
	
	this._domElement.appendChild(this._renderer.domElement);
	
	this.addComponentsToScene();
	
	var that = this;
	// Event Handlers
	window.onresize = function(){
		that._renderer.setSize(that._domElement.clientWidth, that._domElement.clientHeight);
	}
	
	// Animation loop
	animate();
	
	function animate(){
		requestAnimationFrame(animate);
		that._controls.update();
		that.animationManager.update();
		that._renderer.render(that._scene, that._camera);
	}
	
	//function clickHandler(event){
		/*var positionInView;
		positionInView.x = */
	//	console.log(event.x, event.y);
	//}
	
	//this.renderer.domElement.onclick = clickHandler;
}

/*
 * interactionEnable: true enables, false disables
 */
NS.Scene.prototype.setInteractionEnabled = function(interactionEnabled){
	this._controls.enabled = interactionEnabled;
};

NS.Scene.prototype.addComponentsToScene = function(){
	var keys = Object.getOwnPropertyNames(this._sceneObjects);
	for(var i = 0; i < keys.length; i++){
		this._scene.add(this._sceneObjects[keys[i]]);
	}
};

NS.Scene.prototype.addObject = function(nickName, objectOpacity, objectColor, objectUrl, caller, callback){
	var objectLoader = new THREE.OBJLoader();
	
	var that = this;
	objectLoader.load(objectUrl, function(object){
					object.children[0].material = new THREE.MeshPhongMaterial({ wireframe: false, ambient: 0x555555, color: objectColor, specular: 0xffffff, shininess: 20, shading: THREE.SmoothShading, transparent: true, opacity: objectOpacity });
					that._sceneObjects[nickName] = object;
					callback.call(caller);
	});
};

NS.Scene.prototype.playAnimations = function(){
	this.animationManager.play(10.0);	
};

/* 
 * Sets the opacity of the objects with the given nicknames
 * Opacity ranges from 0 to 1
 */
NS.Scene.prototype.setOpacity = function(arrayOfNickNames, opacity){
	for(var i = 0; i < arrayOfNickNames.length; i++){
		var object = this._sceneObjects[arrayOfNickNames[i]].children[0];
		object.material.opacity = opacity;
	}
};

/*
 * Sets the color of the objects with the given nicknames
 * Color is specified as a string of hex color
 */
NS.Scene.prototype.setColor = function(arrayOfNickNames, color){
	for(var i = 0; i < arrayOfNickNames.length; i++){
		var object = this._sceneObjects[arrayOfNickNames[i]].children[0];
		object.material.color = new THREE.Color(color);
	}
};

/*
 * Push all the properties that need to be animated, then call Play and they will all be animated
 * at the same time
 * Animatable properties include coordinates and opacity
 */
NS.AnimationManager = function(){
	this._animationQueue = [];
	this._isAnimating = false;
	this._lastTime = 0.0;
	this._elapsedTime = 0.0;
	
	this.animationDuration;
};

NS.AnimationManager.prototype.addAnimatablePropertyToQueue = function(){
	var animation = arguments;
	this._animationQueue.push(animation);
};

NS.AnimationManager.prototype.update = function(){
	if(this._isAnimating){
		var time = Date.now();
		var delta;
		if(this._lastTime == 0){
			delta  = 0.0;
		} else {
			delta = time - this._lastTime;
		}
		this._elapsedTime += delta;
		
		for(var i = 0; i < this._animationQueue.length; i++){
			var animation = this._animationQueue[i];
			var animationType = animation[0];
			switch(animationType){
				case "camera":
					var camera = animation[1];
					var rotX = animation[2];
					var rotY = animation[3];
					var destZ = animation[4];
					
					var progress = (this._elapsedTime / (this.animationDuration*1000));
					console.log(progress);
					/*
						camera.position.x = 200 * Math.cos(rotSpeed+=0.001) + 200 * Math.sin(rotSpeed+=0.001);
						camera.position.z = 200 * Math.cos(rotSpeed+=0.001) - 200 * Math.sin(rotSpeed+=0.001);	
						
						eyeX = pickObjX + radius*cos(phi)*sin(theta);
						eyeY = pickObjY + radius*sin(phi)*sin(theta);
						eyeZ = pickObjZ + radius*cos(theta);	
					
					
					
					camera.position.x = destX * Math.cos(progress) + destX * Math.sin(progress);
					camera.position.y = destY * Math.cos(progress);
					camera.position.z = destZ * Math.cos(progress) - destZ * Math.sin(progress);
					//TODO: calculer la position de la caméra comme il le faut
					//camera.lookAt(new THREE.Vector3(0, 0, 0));
					*/
					camera.position.x = 0 + destZ * (Math.cos(rotX) * Math.sin(rotY));
					camera.position.y = 0 + destZ * (Math.sin(rotX) * Math.sin(rotY));
					camera.position.z = 0 + destZ * (Math.cos(rotY));
				break;
				default:
				break;
			}
		}

		if(this._elapsedTime >= this.animationDuration*1000){
			this._isAnimating = false;
			this._animationQueue = [];
		}
	
		this._lastTime = time;
	}
	
	
};

/*
 * Plays the animations in the queue for the given duration
 */
NS.AnimationManager.prototype.play = function(){
	this._lastTime = 0.0;
	this._elapsedTime = 0.0;
	this._isAnimating = true;
	/*for(var i = 0; i < this._animationQueue.length; i++){
		var animation = this._animationQueue[i];
		console.log(animation);
		//animation.property = animation.target	
	}*/
};