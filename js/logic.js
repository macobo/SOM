// This is where the magic happens. :)
// TODO: make these local
handler = null;
var data = [];
layers = {
	path: new Layer(),
	indicator: new Layer()
}
state = programStates.CREATING_DATA;


tool.minDistance = 10;

function onMouseDrag(event) {
	if (state == programStates.CREATING_DATA) {
		var neuron = new Neuron().add(event.point, NeuronStatus.DATA);
		neuron.setIndicator();
		data.push(neuron.showPath());
	}
}

function onMouseDown(event) {
	if (state == programStates.CREATING_DATA) {
		var neuron = new Neuron().add(event.point, NeuronStatus.DATA);
		neuron.setIndicator();
		data.push(neuron.showPath());
	}
}

function iterate() {
	if (handler.iteration < constants.iterations) {
		handler.nextIteration(function() {
			//handler.showPath();
			setTimeout(iterate, 20);
		});
	} //else state = programStates.PAUSED;
}

window.play = function() {
	if (state == programStates.PAUSED) {
		console.log("PLAYING");
		state = programStates.PLAYING;
		state.start = lastTime;
	}
}

window.pause = function() {
	if (state == programStates.PLAYING) {
		console.log("PAUSING");
		state = programStates.PAUSED;
	}
}

window.togglePlaying = function() {
	if (state == programStates.PLAYING) pause();
	else if (state == programStates.PAUSED) play();
}

var lastTime;
function onKeyDown(event) {
	if (event.key != "space")
		return;
	if (state == programStates.CREATING_DATA && data.length > 10) {
		state = programStates.PLAYING;
		handler = NeuronHandler.generate(data, constants.rows, constants.cols);
		iterate();
		state.start = lastTime;
		handler.showState(0);
	} else if (state == programStates.PAUSED) {
		play();
	} else if (state == programStates.PLAYING) {
		pause();
	}
}

// Bug in paper.js requires this
function onFrame(event) {
	lastTime = event.time;
	if (state == programStates.PLAYING) {
		var barState = loader.status();
		var when = barState.start + 
			(event.time - state.start) * constants.animation_speed;
		if (when > barState.end || !handler.showState(when))
			pause();
	}
}