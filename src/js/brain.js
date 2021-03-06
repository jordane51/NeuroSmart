/**
 * Responsible for the entire brain view, animations and interactions	
 * @constructor
 * @param {domElement} domElement - The container of the module
 * @param {string} brainUrl - An URL to the JSON representing the brain
 */
NS.BrainModule = function(domElement, brainUrl){
	this._parentDomElement = domElement;
	this._domElement = null;
	this._brainUrl = "resources/brain.json";
	if(brainUrl){
		this._brainUrl = brainUrl;
	}
	this._brain = null;
	this._nsscene = null;
	this._isLoaded = false;
};

/**
 * Is used by the ScenarioPlayer to register the commands this module can handle
 * @return [{string}] - An array of the supported commands
 */
NS.BrainModule.prototype.availableCommands = function(){
	return ["setOpacity", "setColor", "rotateCamera", "animationDuration"];
}

/**
 * Is used by the ScenarioPlayer to execute the commands
 */
NS.BrainModule.prototype.performCommand = function(){
	this._nsscene.performCommand.apply(this._nsscene, arguments);
};

/**
 * Returns true if the module has finished loading, false otherwise
 * @return {bool} - The state of the module
 */
NS.BrainModule.prototype.isLoaded = function(){
	return this._isLoaded;
};

/**
 * Preloads all the resources necessary, such as the brain.json file and the meshes
 * @param {object} caller - The caller of the method.
 * @param {function} caller - The callback that will be called when loaded.
 */
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

/**
 * Inserts the module's node into the dom
 */
NS.BrainModule.prototype.show = function(){
	this._domElement.appendChild(document.createTextNode(""));
	this._parentDomElement.appendChild(this._domElement);
	
	/* The reason we need to call it here it that it needs to know its view dimensions in order to
	do the controls tracking. If we put it before, the dom object won't be initialized */
	this._nsscene.load();
};

/**
 * Removes the module's node from the dom
 */
NS.BrainModule.prototype.hide = function(){
	 this._parentDomElement.removeChild(this._domElement);
};

/**
 * Is called when all animations have been added and the step is ready to be animated
 */
NS.BrainModule.prototype.playStep = function(){
	this._nsscene.playAnimations();	
};

/**
 * Initializes the scene and the interactions
 * @constructor
 * @param {domElement} domElement - The container of the module
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

/**
 * Is used by the ScenarioPlayer to execute the commands
 */
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
			this.animationManager.addAnimatablePropertyToQueue.apply(this.animationManager, ["camera", this._camera, this._nsscene, arguments[1], arguments[2], arguments[3]]);
		break;
		case "animationDuration":
			this.animationManager.animationDuration = arguments[1];
		default:
		break;
	}
};

/**
 * Loads the three js scene, the interaction and refresh loops
 */
NS.Scene.prototype.load = function(){
	this._scene = new THREE.Scene();
	this._renderer = new THREE.WebGLRenderer( { alpha: true } );
	this._camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
	this.animationManager = new NS.AnimationManager(this);
	
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
	
	
	// Brain element selection
	var selectedObject = null;
	this._renderer.domElement.onclick = clickHandler;
	var objects = [];
	
	var keys = Object.getOwnPropertyNames(this._sceneObjects);
	for(var i = 0; i < keys.length; i++){
		objects.push(this._sceneObjects[keys[i]]);
	}
	
	function clickHandler(event){
		var positionInElement = {};
		positionInElement.x = event.x;
		positionInElement.y = event.y;
		
		positionInElement.x -= that._domElement.offsetLeft;
		positionInElement.y -= that._domElement.offsetTop;
		
		console.log("Click", positionInElement.x, positionInElement.y);
		// intersection detection
		var vector = new THREE.Vector3(positionInElement.x, positionInElement.y, 1).unproject(that._camera);
		
		var raycaster = new THREE.Raycaster(that._camera.position, vector.sub(that._camera.position).normalize());
		
		var intersects = raycaster.intersectObjects(objects, true);
		//console.log(intersects);
		
		for (var i = 0; i < intersects.length; i++ ){ 
				
			/*if(intersects[i].object.material.opacity>0.3){
				for (var j = 0, c = mesh_name.length; j < c; j++){
					if(intersects[i].object.material.color.getHex()==mesh_color[j]){	
						intersects[i].object.material.color.setHex(0xFFFF00);
						document.getElementById("lab").style.left=event.pageX + 5 + "px";
						document.getElementById("lab").style.top=event.pageY + 10 + "px";
						document.getElementById("lab").style.visibility="visible";
						document.getElementById("lab").innerHTML = mesh_name[j];	
					}
				}
			}*/
		}
	}

};

/**
 * Enabled or disables user interaction
 * @param {bool} interactionEnabled - The interaction state.
 */
NS.Scene.prototype.setInteractionEnabled = function(interactionEnabled){
	this._controls.enabled = interactionEnabled;
};

/**
 * Adds of all the objects in _sceneObjets to the three js scene
 */
NS.Scene.prototype.addComponentsToScene = function(){
	var keys = Object.getOwnPropertyNames(this._sceneObjects);
	for(var i = 0; i < keys.length; i++){
		this._scene.add(this._sceneObjects[keys[i]]);
	}
};

/**
 * Loads an object and adds it to the list of objects to be added to the scene
 * @param {string} nickName - The nickName of the object
 * @param {float} objectOpacity - The initial opacity of the object
 * @param {string} objectColor - The initial color of the object as an hex value preceded by a "#"
 * @param {object} caller - The call of the methode
 * @param {function} callback - The callback to call when the loading is completed
 */
NS.Scene.prototype.addObject = function(nickName, objectOpacity, objectColor, objectUrl, caller, callback){
	var objectLoader = new THREE.OBJLoader();
	
	var that = this;
	objectLoader.load(objectUrl, function(object){
					object.children[0].material = new THREE.MeshPhongMaterial({ wireframe: false, ambient: 0x555555, color: objectColor, specular: 0xffffff, shininess: 20, shading: THREE.SmoothShading, transparent: true, opacity: objectOpacity });
					that._sceneObjects[nickName] = object;
					callback.call(caller);
	});
};

/**
 * Is used to notify the animationManager that it can play all the animtions in its queue
 */
NS.Scene.prototype.playAnimations = function(){
	this.animationManager.play(10.0);	
};


/**
 * Sets the opacity of the objects with the given nicknames
 * @param [{string}] arrayOfNickNames - An array of the nickNames of the objets to change the opacity of
 * @param {float} opacity - The desired opacity from 0.0 to 1.0
 */
NS.Scene.prototype.setOpacity = function(arrayOfNickNames, opacity){
	for(var i = 0; i < arrayOfNickNames.length; i++){
		var object = this._sceneObjects[arrayOfNickNames[i]].children[0];
		object.material.opacity = opacity;
	}
};

/**
 * Sets the color of the objects with the given nicknames
 * @param [{string}] arrayOfNickNames - An array of the nickNames of the objets to change the opacity of
 * @param {float} opacity - The desired color as a string of the hex value of the color preceded by a "#"
 */
NS.Scene.prototype.setColor = function(arrayOfNickNames, color){
	for(var i = 0; i < arrayOfNickNames.length; i++){
		var object = this._sceneObjects[arrayOfNickNames[i]].children[0];
		object.material.color = new THREE.Color(color);
	}
};

/**
 * Rotates the camera around the Z axis for a given angle
 * @param {float} angle - The angle of rotation
 */
NS.Scene.prototype.rotateAroundZ = function(angle){
	var x = this._camera.position.x;
	var y = this._camera.position.y;
	var z = this._camera.position.z;
	
	this._camera.position.x = x * Math.cos(angle) + z * Math.sin(angle);
	this._camera.position.z = z * Math.cos(angle) - x * Math.sin(angle);
};

/**
 * Rotates the camera around the X axis for a given angle
 * @param {float} angle - The angle of rotation
 */
NS.Scene.prototype.rotateAroundX = function(angle){
	var x = this._camera.position.x;
	var y = this._camera.position.y;
	var z = this._camera.position.z;
	
	this._camera.position.y = y * Math.cos(angle) + z * Math.sin(angle);
	this._camera.position.z = z * Math.cos(angle) - y * Math.sin(angle);
};

/*
NS.Scene.prototype.zoom = function(zoom){
	this._camera.position.
}*/


/**
 * Handles the animations. Add animations to the queue using addAnimatablePropertyToQueue
 	then call play to play them all at the same time
 * @param {Scene} scene - The NS.Scene used to animate the objects
 */
NS.AnimationManager = function(scene){
	this._animationQueue = [];
	this._isAnimating = false;
	this._lastTime = 0.0;
	this._elapsedTime = 0.0;
	this._nsscene = scene;
	this._test = 0.0;
	
	this.animationDuration;
};

/**
 * Adds a property to be animated
 */
NS.AnimationManager.prototype.addAnimatablePropertyToQueue = function(){
	var animation = arguments;
	this._animationQueue.push(animation);
};

/**
 * Update loop to be called at each update
 */
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
					var scene = animation[2];
					var rotX = animation[3];
					var rotY = animation[4];
					var destZ = animation[5];
					
					var progress = (this._elapsedTime / (this.animationDuration*1000));
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
					/*
					camera.position.x = 0 + destZ * (Math.cos(rotX) * Math.sin(rotY));
					camera.position.y = 0 + destZ * (Math.sin(rotX) * Math.sin(rotY));
					camera.position.z = 0 + destZ * (Math.cos(rotY));
					*/
					/*
					camera.position.x = (Math.sin( progress ) * 300 );
					camera.position.y = 100;
					camera.position.z = (Math.cos( progress ) * 300);
					*/
					this._nsscene.rotateAroundX(rotX*(delta/(this.animationDuration * 1000)));
					this._test+= (rotX*(delta/(this.animationDuration * 1000)));
					console.log(this._test);
					console.log((rotX*(delta/(this.animationDuration * 1000))));
					camera.lookAt(new THREE.Vector3(0, 0, 0));
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



/**
 * Plays the animations in the queue
 */
NS.AnimationManager.prototype.play = function(){
	this._lastTime = 0.0;
	this._elapsedTime = 0.0;
	this._isAnimating = true;
};