/* Class BrainModule
   Responsible for the entire brain view, animations, interactions...	
*/
NS.BrainModule = function(domElement){
	this._parentDomElement = domElement;
	this._domElement = null;
	this._isLoaded = false;
};

NS.BrainModule.prototype.availableCommands = function(){
	return ["tbd"];
}

NS.BrainModule.prototype.performCommand = function(command){
	
};

NS.BrainModule.prototype.isLoaded = function(){
	return this._isLoaded;
};

NS.BrainModule.prototype.load = function(caller, callback){
	this._isLoaded = true;
	callback.call(caller);
};

NS.BrainModule.prototype.show = function(){
	this._domElement = document.createElement("div");
	this._domElement.id = "brainModule";

	this._domElement.appendChild(document.createTextNode(""));
	this._parentDomElement.appendChild(this._domElement);
};

NS.BrainModule.prototype.hide = function(){
	 this._parentDomElement.removeChild(this._domElement);
};

/* Class Brain
   Logical representation of the brain regions
*/
function Brain(){
	
}

/* Class BrainRegion
   Logical representation of a particular brain region
*/
function BrainRegion(){
	
}


function AnimationManager(){
	
}

/* Class Scene
   Responsible for the view itself
*/
function Scene(){
	
}

function SceneNode(){
	
}