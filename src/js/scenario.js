/* Class Scenario
 * Central point of the app, manages all the modules	
 */
var NS = NS || {};

/* Class Scenario
 * This class represents the application itself: it initializes the various modules, and then launches the ScenarioPlayer
 */
NS.Scenario = function(containerElement){
	this._scenarioPlayer = null;
	this._scenarioUrl = null;
	this._brainModule = null;
	this._consoleModule = null;
	this._mediaModule = null;
	this._controlsModule = null;

	this._containerElement = containerElement;
};

/* function init
 *	This function initializes displays a spinning wheel, initializes the modules, launches the scenarioPlayer, then loads all the modules in the DOM so they are displayed
 */
NS.Scenario.prototype.init = function(){	
	var spinningWheel = new NS.SpinningWheel(this._containerElement);
	spinningWheel.show();

	var callback = function(){
		if(this._consoleModule.isLoaded() && this._mediaModule.isLoaded() && this._brainModule.isLoaded() && this._scenarioPlayer.isLoaded()){
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
	
	this._scenarioPlayer = new NS.ScenarioPlayer(this._scenarioUrl, this._mediaModule, this._consoleModule, this._brainModule);
	this._controlsModule = new NS.ControlsModule(this._containerElement, this._scenarioPlayer, this._scenarioPlayer.previousStep, this._scenarioPlayer.nextStep);

	// Those modules "load" methods are asynchronous, thus the need for a callback while the others don't need one
	this._brainModule.load(this, callback);
	this._consoleModule.load(this, callback);
	this._mediaModule.load(this, callback);
	
	
	this._scenarioPlayer.load(this, callback);
};

NS.Scenario.prototype.playScenario = function(scenarioUrl){
	this._scenarioUrl = scenarioUrl;
	scenario.init();
};


/* Class ScenarioPlayer
 * Is responsible for loading the scenario file, preloading the media files, and playing the scenario	
 */
NS.ScenarioPlayer = function(scenarioUrl, mediaModule, consoleModule, brainModule){
	this._scenarioUrl = scenarioUrl;
	this._mediaModule = mediaModule;
	this._consoleModule = consoleModule;
	this._brainModule = brainModule;
	
	this._scenario = null;
	this._currentStep = -1;
	this._numberOfSteps = 0;
	this._isLoaded = false;
	this._commandDispatcher = null;
};
/* 
 * Preloads all the resources necessary, such as the scenario(json) itself, and some resources (images) - videos are not preloaded
 * param: callback: called when everything is loaded
 */
NS.ScenarioPlayer.prototype.load = function(caller, callback){
	var scenarioLoadingHandler = function(scenario){
		this._scenario = JSON.parse(scenario);
		this._numberOfSteps = this._scenario["sequences"].length;
		
		// This preloads all of the media declared in the "media" property of a scenario into MediaModule
		var medias = this._scenario["media"];
		for(var i = 0; i < medias.length; i++){
			this._mediaModule.addMedia(medias[i]);
		}
		
		this._isLoaded = true;
		callback.call(caller);
	};
	
	/*
	This fetches the available commands of all the modules and adds them to the commandDispatcher,
	which is an associative array formed as such: commandDispatcher["command"] -> object
	This allow us to know which command is addressed to which object later on
	*/
	var modules = [this._mediaModule, this._consoleModule, this._brainModule];
	
	this._commandDispatcher = []
	
	for(var i = 0; i < modules.length; i++){
		var commands = modules[i].availableCommands();
		for(var j = 0; j < commands.length; j++){
			this._commandDispatcher[commands[j]] = modules[i];
		}
	}
	
	NS.Utilities.asyncLoadTextFile(this._scenarioUrl, this, scenarioLoadingHandler);
};

NS.ScenarioPlayer.prototype.isLoaded = function(){
	return this._isLoaded;
};

NS.ScenarioPlayer.prototype.nextStep = function(){
	if(this._currentStep < this._numberOfSteps-1){
		this._currentStep++;
		this.playCurrentStep();
	}
};

NS.ScenarioPlayer.prototype.previousStep = function(){
	if(this._currentStep > 0){
		this._currentStep--;
		this.playCurrentStep();
	}
};

NS.ScenarioPlayer.prototype.playCurrentStep = function(){
	var actions = this._scenario["sequences"][this._currentStep]["actions"];
	for(var i = 0; i < actions.length; i++){
		var action = actions[i];
		var actionName = action["action"];
		var fn = this._commandDispatcher[actionName];

		var parameters = [];
		var properties = Object.getOwnPropertyNames(action);
		
		for(var j = 0; j < properties.length; j++){
			var property = properties[j];
			parameters.push(action[property]);
		}
		
		fn.performCommand.apply(this._commandDispatcher[actionName], parameters);
	}	
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

NS.ConsoleModule.prototype.availableCommands = function(){
	return ["printHtml", "printLine"];
};

NS.ConsoleModule.prototype.performCommand = function(){
	switch(arguments[0]){
		case "printLine":
			this.printLine(arguments[1]);
			break;
		case "printHtml":
			this.printHTML(arguments[1]);
			break;
		default:
	}
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
	this._displayedMedia = null;
	this._mediaList = [];
	this._isLoaded = false;
};

NS.MediaModule.prototype.availableCommands = function(){
	return ["showMedia"];
};

NS.MediaModule.prototype.performCommand = function(command){
	switch(arguments[0]){
		case "showMedia":
			this.setMedia(this._mediaList[arguments[1]]);
			break;
		default:
	}
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

NS.MediaModule.prototype.addMedia = function(media){
	var mediaName = Object.getOwnPropertyNames(media);
	var mediaProperties = media[mediaName];
	
	var mediaObject;
	switch(mediaProperties["type"]){
		case "image":
			mediaObject = new NS.Image(mediaProperties["url"]);
		break;
		case "video":
			mediaObject = new NS.Video(mediaProperties["url"]);
		break;
		default:
			mediaObject = new NS.Media("Unknown media type");
	}
	this._mediaList[mediaName] = mediaObject;
}

// Takes a NS.Media as param
NS.MediaModule.prototype.setMedia = function(media){
	this._displayedMedia = media;
	this._domElement.innerHTML = media.htmlContent();
};

NS.MediaModule.prototype.clear = function(){
	this._domElement.innerHTML = "";
};

/* Class ControlsModule
 * Responsible for the next and previous arrows that change the current step of the scenario
 */
NS.ControlsModule = function(domElement, caller, previousStepHandler, nextStepHandler){
	this._parentDomElement = domElement;
	this._domElement = null;
	this._caller = caller;
	this._previousStepHandler = previousStepHandler;
	this._nextStepHandler = nextStepHandler;
};

NS.ControlsModule.prototype.show = function(){
	this._domElement = document.createElement("div");
	this._domElement.id = "controlsModule";
	
	var arrowPrevious = document.createElement("div");
	var arrowNext = document.createElement("div");
	
	arrowPrevious.classList.add("arrow_previous");
	arrowNext.classList.add("arrow_next");
	
	var context = this;
	
	arrowPrevious.onclick = function(){
		context._previousStepHandler.call(context._caller);	
	};
	
	arrowNext.onclick = function(){
		context._nextStepHandler.call(context._caller);	
	};
	
	
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
	if(this._resourceUrl instanceof Array){
		res = "<video controls preload autoplay>\n";
		for(var i = 0; i < this._resourceUrl.length; i++){
			res+= "<source src=\""+this._resourceUrl[i]+"\"\n>";
		}
		return res + "</video>";
	}
	return "<video src=\""+this._resourceUrl+"\" type=\"video/mp4\" controls preload autoplay>Votre navigateur ne supporte par les vidéos MP4. Impossible d'afficher la vidéo.</video>";
};


/* Class Utils
 * Various utility classes that are useful for the application but don't deserve their own class :p
 */
NS.Utilities = function(){
	
};

/* function asyncLoadFile
 * Loads the file specified at the url fileUrl then calls the callback
 * The callback method takes the downloaded resource as parameter
 */
NS.Utilities.asyncLoadTextFile = function(fileUrl, caller, callback){
	var request;

	if(window.XMLHttpRequest){
		request = new XMLHttpRequest();
		// the override is required for some versions of firefox
		request.overrideMimeType('text/xml');
	} else if(window.ActiveXObject){
		request = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	request.onreadystatechange = function(){
		if(request.readyState == 4){
			callback.call(caller, request.responseText);
		}
	};
	
	request.open('GET', fileUrl, true);
	request.send();
};
