/* Class Scenario
 * Central point of the app, manages all the modules	
 */
var NS = NS || {};

/**
 * Entry point of the app - represents the whole app
 * @constructor
 * @param {domElement} containerElement - The container of the app.
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


/**
 * This function initializes displays a spinning wheel, initializes the modules, launches the scenarioPlayer, then loads all the modules in the DOM so they are displayed
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

/**
 * Initializes the properties and plays a given scenario
 * @param {string} scenarioUrl - The URL of the scenario to be played.
 */
NS.Scenario.prototype.playScenario = function(scenarioUrl){
	this._scenarioUrl = scenarioUrl;
	scenario.init();
};


/**
 * Is responsible for loading the scenario file, preloading the media files, and playing the scenario
 * @constructor
 * @param {string} scenarioUrl - The URL of the scenario to be played.
 * @param {MediaModule} mediaModule - A reference to the instance of MediaModule used
 * @param {ConsoleModule} consoleModule - A reference to the instance of ConsoleModule used
 * @param {BrainModule} brainModule - A reference to the instance of BrainModule used
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

/**
 * Preloads all the resources necessary, such as the scenario(json) itself and the resources
 * @param {object} caller - The caller of the method.
 * @param {function} caller - The callback that will be called when loaded.
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

/**
 * Returns true if the module has finished loading, false otherwise
 * @return {bool} - The state of the module
 */
NS.ScenarioPlayer.prototype.isLoaded = function(){
	return this._isLoaded;
};

/**
 * Plays the next step of the scenario
 */
NS.ScenarioPlayer.prototype.nextStep = function(){
	if(this._currentStep < this._numberOfSteps-1){
		this._currentStep++;
		this.playCurrentStep();
	}
};

/**
 * Plays the previous step of the scenario
 */
NS.ScenarioPlayer.prototype.previousStep = function(){
	if(this._currentStep > 0){
		this._currentStep--;
		this.playCurrentStep();
	}
};


/**
 * Plays the current step of the scenario
 */
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
		// this part is used to tell the BrainModule that there are no more actions 
		// and it can start animating
		if(i == actions.length-1){
			this._brainModule.playStep();
		}
	}	
};

/**
 * Displays an activity indicator
 * @constructor
 * @param {domElement} domElement - The container of the module.
 */
NS.SpinningWheel = function(domElement){
	this._parentDomElement = domElement;
	this._domElement = null;
};

/**
 * Inserts the module's node into the dom
 */
NS.SpinningWheel.prototype.show = function(){
	this._domElement = document.createElement("div");
	this._domElement.id = "spinningWheel";

	this._parentDomElement.appendChild(this._domElement);
};

/**
 * Removes the module's node from the dom
 */
NS.SpinningWheel.prototype.hide = function(){
	 this._parentDomElement.removeChild(this._domElement);
};

/**
 * Manages a console that can display html content
 * @constructor
 * @param {domElement} domElement - The container of the module.
 */
NS.ConsoleModule = function(domElement){
	this._parentDomElement = domElement;
	this._domElement = null;
	this._isLoaded = false;
};

/**
 * Is used by the ScenarioPlayer to register the commands this module can handle
 * @return [{string}] - An array of the supported commands
 */
NS.ConsoleModule.prototype.availableCommands = function(){
	return ["printHtml", "printLine"];
};

/**
 * Is used by the ScenarioPlayer to execute the commands
 */
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

/**
 * Returns true if the module has finished loading, false otherwise
 * @return {bool} - The state of the module
 */
NS.ConsoleModule.prototype.isLoaded = function(){
	return this._isLoaded;
};

/**
 * Loads the ConsoleModule
 * @param {object} caller - The caller of the method.
 * @param {function} caller - The callback that will be called when loaded.
 */
NS.ConsoleModule.prototype.load = function(caller, callback){
	this._domElement = document.createElement("div");
	this._domElement.id = "consoleModule";
	
	this._isLoaded = true;
	callback.call(caller);
};

/**
 * Inserts the module's node into the dom
 */
NS.ConsoleModule.prototype.show = function(){
	this._domElement.appendChild(document.createTextNode(""));
	this._parentDomElement.appendChild(this._domElement);
};

/**
 * Removes the module's node from the dom
 */
NS.ConsoleModule.prototype.hide = function(){
	 this._parentDomElement.removeChild(this._domElement);
};

/**
 * Prints a string in the console
 * @param {string} message - The string to be printed
 */
NS.ConsoleModule.prototype.printLine = function(message){
	this._domElement.innerHTML += "<p>"+message+"</p>";
};

/**
 * Prints an html formated string in the console
 * @param {string} html - The string to be printed
 */
NS.ConsoleModule.prototype.printHTML = function(html){
	this._domElement.innerHTML += html;
};

/**
 * Clears the console
 */
NS.ConsoleModule.prototype.clear = function(){
	this._domElement.innerHTML = "";	
};

/**
 * Handles the display of media
 * @constructor
 * @param {domElement} domElement - The container of the module
 */
NS.MediaModule = function(domElement){
	this._parentDomElement = domElement;
	this._domElement = null;
	this._displayedMedia = null;
	this._mediaList = [];
	this._isLoaded = false;
};

/**
 * Is used by the ScenarioPlayer to register the commands this module can handle
 * @return [{string}] - An array of the supported commands
 */
NS.MediaModule.prototype.availableCommands = function(){
	return ["showMedia"];
};

/**
 * Is used by the ScenarioPlayer to execute the commands
 */
NS.MediaModule.prototype.performCommand = function(command){
	switch(arguments[0]){
		case "showMedia":
			this.setMedia(this._mediaList[arguments[1]]);
			break;
		default:
	}
};

 /**
 * Returns true if the module has finished loading, false otherwise
 * @return {bool} - The state of the module
 */
NS.MediaModule.prototype.isLoaded = function(){
	return this._isLoaded;
};

 /**
 * Loads the MediaModule
 * @param {object} caller - The caller of the method.
 * @param {function} caller - The callback that will be called when loaded.
 */
NS.MediaModule.prototype.load = function(caller, callback){
	this._domElement = document.createElement("div");
	this._domElement.id = "mediaModule";
	
	this._isLoaded = true;
	callback.call(caller);
};

/**
 * Inserts the module's node into the dom
 */
NS.MediaModule.prototype.show = function(){
	this._domElement.appendChild(document.createTextNode(""));
	this._parentDomElement.appendChild(this._domElement);
};

/**
 * Removes the module's node from the dom
 */
NS.MediaModule.prototype.hide = function(){
	 this._parentDomElement.removeChild(this._domElement);
};

/**
 * Adds a media to the list of Media the module can display
 * @param {Media} media - The Media to be displayed later
 */
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

/**
 * Sets the currently displayed Media
 * @param {Media} media - The media to be displayed
 */
NS.MediaModule.prototype.setMedia = function(media){
	this._displayedMedia = media;
	this._domElement.innerHTML = media.htmlContent();
};

/**
 * Clears the media module
 */
NS.MediaModule.prototype.clear = function(){
	this._domElement.innerHTML = "";
};

/**
 * Responsible for the next and previous arrows that change the current step of the scenario
 * @param {domElement} domElement - The container of the module
 * @param {object} caller - The object caller of the module
 * @param {function} previousStepHandler - The function that should be called when the "previous" arrow is clicked
 * @param {function} nextStepHandler - The function that should be called when the "next" arrow is clicked
 */
NS.ControlsModule = function(domElement, caller, previousStepHandler, nextStepHandler){
	this._parentDomElement = domElement;
	this._domElement = null;
	this._caller = caller;
	this._previousStepHandler = previousStepHandler;
	this._nextStepHandler = nextStepHandler;
};

/**
 * Inserts the module's node into the dom
 */
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
	
	this._domElement.appendChild(arrowNext);
	
	this._parentDomElement.appendChild(this._domElement);
};

/**
 * Removes the module's node from the dom
 */
NS.ControlsModule.hide = function(){
	this._parentDomElement.removeChild(this._domElement);
};

/**
 * Represents a generic media
 * @constructor
 * @param {string} resourceUrl - The URL to the resource of the media
 */
NS.Media = function(resourceUrl){
	this._resourceUrl = resourceUrl;
};

/**
 * Returns a string that represents a view that can be inserted into a DOM node to display the media
 * @return {string} The string used to display the media
 */
NS.Media.prototype.htmlContent = function(){
	return "<p>Resource: "+this._resourceUrl+"</p>";
};

/**
 * Represents an image
 * @constructor
 * @param {string} imageUrl - The URL to the image
 */
NS.Image = function(imageUrl){
	NS.Media.call(this, imageUrl);
};

NS.Image.prototype = Object.create(NS.Media.prototype);
NS.Image.prototype.constructor = NS.Image;

NS.Image.prototype.htmlContent = function(){
	return "<img src=\""+this._resourceUrl+"\"></img>";
};

/**
 * Represents a video
 * @constructor
 * @param {string} videoUrl - The URL to the video or an array of URLs
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


/**
 * Regroups various utilities
 */
NS.Utilities = function(){
	
};

/**
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
