/* Class Scenario
 * Central point of the app, manages all the modules	
 */
var NS = NS || {};

/* Class Scenario
 * This class represents the application itself: it initializes the various modules, and then launches the ScenarioPlayer
 */
NS.Scenario = function(containerElement){
	this._scenarioPlayer = null;
	this._brainModule = null;
	this._consoleModule = null;
	this._mediaModule = null;
	this._controlsModule = null;

	this._containerElement = containerElement;
};

/* function init
 *	This function initializes displays a spinning wheel, initializes the modules, launches the scenarioPlayer, then inserts all the modules in the DOM so they are displayed
 */
NS.Scenario.prototype.init = function(){	
	var spinningWheel = new NS.SpinningWheel(this._containerElement);
	spinningWheel.show();

	var callback = function(){
		if(this._consoleModule.isLoaded() && this._mediaModule.isLoaded() && this._brainModule.isLoaded()){
			this._consoleModule.show();
			this._brainModule.show();
			this._mediaModule.show();
			this._controlsModule.show();
			spinningWheel.hide();
		}		
	};
	
	this._brainModule = new NS.BrainModule(this._containerElement);
	this._consoleModule = new NS.ConsoleModule(this._containerElement);
	this._mediaModule = new NS.MediaModule(this._containerElement);
	this._controlsModule = new NS.ControlsModule(this._containerElement, null);
	
	// Those modules are asynchronous, thus the need for a callback whereas the others don't need one
	this._brainModule.load(this, callback);
	this._consoleModule.load(this, callback);
	this._mediaModule.load(this, callback);
	
	this._scenarioPlayer = new NS.ScenarioPlayer(null);
};


/* Class ScenarioPlayer
 * Is responsible for loading the scenario file, loading the media files, and playing the scenario	
 */
NS.ScenarioPlayer = function(scenarioUrl, containerElement){
	this._scenarioUrl = scenarioUrl;
	this._currentStep = -1;
	this._isLoaded = false;
};
/* 
 * Preloads all the resources necessary, such as the scenario(json) itself, and some resources (images) - videos are not preloaded by default
 * param: callback: called when everything is loaded
 */
NS.ScenarioPlayer.prototype.load = function(callback){
	this._consoleModule = new NS.ConsoleModule(document.body);
	this._mediaModule = new NS.MediaModule(document.body);
	
	this._isLoaded = true;
};

NS.ScenarioPlayer.prototype.isLoaded = function(){
	return this._isLoaded;
};

NS.ScenarioPlayer.prototype.nextStep = function(){
	
};

NS.ScenarioPlayer.prototype.previousStep = function(){
	
};

/* Class SpinningWheel
 * Simple class that displays an activity indicator
 */
NS.SpinningWheel = function(domElement){
	this._parentDomElement = domElement;
	this._domElement = null;
};

NS.SpinningWheel.prototype.show = function(){
	this._domElement = document.createElement("div");
	this._domElement.id = "spinningWheel";

	this._parentDomElement.appendChild(this._domElement);
};

NS.SpinningWheel.prototype.hide = function(){
	 this._parentDomElement.removeChild(this._domElement);
};

/* Class ConsoleModule
 * Manages a console that can display html content
 */
NS.ConsoleModule = function(domElement){
	this._parentDomElement = domElement;
	this._domElement = null;
	this._isLoaded = false;
};

NS.ConsoleModule.prototype.isLoaded = function(){
	return this._isLoaded;
};

NS.ConsoleModule.prototype.load = function(caller, callback){
	this._isLoaded = true;
	callback.call(caller);
};

NS.ConsoleModule.prototype.show = function(){
	this._domElement = document.createElement("div");
	this._domElement.id = "consoleModule";

	this._domElement.appendChild(document.createTextNode(""));
	this._parentDomElement.appendChild(this._domElement);
};

NS.ConsoleModule.prototype.hide = function(){
	 this._parentDomElement.removeChild(this._domElement);
};

NS.ConsoleModule.prototype.printLine = function(message){
	this._domElement.innerHTML += "<p>"+message+"</p>";
};

NS.ConsoleModule.prototype.printHTML = function(html){
	this._domElement.innerHTML += html;
};

NS.ConsoleModule.prototype.clear = function(){
	this._domElement.innerHTML = "";	
};

/* Class MediaModule
 *
 */
NS.MediaModule = function(domElement){
	this._parentDomElement = domElement;
	this._domElement = null;
	this._media = null;
	this._isLoaded = false;
};

NS.MediaModule.prototype.isLoaded = function(){
	return this._isLoaded;
};

NS.MediaModule.prototype.load = function(caller, callback){
	this._isLoaded = true;
	callback.call(caller);
};

NS.MediaModule.prototype.show = function(){
	this._domElement = document.createElement("div");
	this._domElement.id = "mediaModule";

	this._domElement.appendChild(document.createTextNode(""));
	this._parentDomElement.appendChild(this._domElement);
};

NS.MediaModule.prototype.hide = function(){
	 this._parentDomElement.removeChild(this._domElement);
};

// Takes a NS.Media as param
NS.MediaModule.prototype.setMedia = function(media){
	this._media = media;
	this._domElement.innerHTML = media.htmlContent();
};

NS.MediaModule.prototype.clear = function(){
	this._domElement.innerHTML = "";
};

/* Class ControlsModule
 * Responsible for the next and previous arrows that change the current step of the scenario
 */
NS.ControlsModule = function(domElement, eventHandler){
	this._parentDomElement = domElement;
	this._domElement = null;
	this._eventHandler = eventHandler;
};

NS.ControlsModule.prototype.show = function(){
	this._domElement = document.createElement("div");
	this._domElement.id = "controlsModule";
	
	var arrowPrevious = document.createElement("div");
	var arrowNext = document.createElement("div");
	
	arrowPrevious.classList.add("arrow_previous");
	arrowNext.classList.add("arrow_next");
	
	arrowPrevious.onclick = function(){
		this._eventHandler.call();
	}
	arrowNext.onclick = function(){
		this._eventHandler.call();
	}
	
	this._domElement.appendChild(document.createTextNode(""));
	this._domElement.appendChild(arrowPrevious);
	this._domElement.appendChild(arrowNext);
	
	this._parentDomElement.appendChild(this._domElement);
};

NS.ControlsModule.hide = function(){
	this._parentDomElement.removeChild(this._domElement);
};

/* Class Media
 *
 */
NS.Media = function(resourceUrl){
	this._resourceUrl = resourceUrl;
};

NS.Media.prototype.htmlContent = function(){
	return "<p>Resource: "+this._resourceUrl+"</p>";
};

/* Class Image
 *	
 */
NS.Image = function(imageUrl){
	NS.Media.call(this, imageUrl);
};

NS.Image.prototype = Object.create(NS.Media.prototype);
NS.Image.prototype.constructor = NS.Image;

NS.Image.prototype.htmlContent = function(){
	return "<img src=\""+this._resourceUrl+"\"></img>";
};

/* Class Video
 *
 */
NS.Video = function(videoUrl){
	NS.Media.call(this, videoUrl);
};

NS.Video.prototype = Object.create(NS.Media.prototype);
NS.Video.prototype.constructor = NS.Video;

NS.Video.prototype.htmlContent = function(){
	return "<video src=\""+this._resourceUrl+"\"></video>";
};


/* Class ResourceManager
 * Responsible for downloading and accessing external files such as JSONs and media files
 */
