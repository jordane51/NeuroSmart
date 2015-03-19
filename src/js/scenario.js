/* Class Scenario
   Central point of the app, manages all the modules	
*/
var Neurosmart = function(){
	
}

function Scenario(){
	this.scenarioPlayer = new ScenarioPlayer("../../tests/scenarioTest.json");
}

/* Class ScenarioPlayer
   Is responsible for loading the scenario file, loading the media files, and playing the scenario	
*/
function ScenarioPlayer(scenarioUrl){
	this.scenarioUrl = scenarioUrl;
	this.currentStep = -1;
}

ScenarioPlayer.prototype.nextStep = function(){
	
}

ScenarioPlayer.prototype.previousStep = function(){
	
}

