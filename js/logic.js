// This is where the magic happens. :)
// TODO: make these local
handler = null;
data = [];
var state = programStates.CREATING_DATA;

tool.minDistance = 10;

function onMouseDrag(event) {
	if (state == programStates.CREATING_DATA) {
		var neuron = new Neuron().add(event.point, NeuronStatus.DATA)
		data.push(neuron.showPath());
	}
}

function iterate() {
	if (handler.iteration < constants.iterations) {
		handler.nextIteration(function() {
			handler.showPath();
			setTimeout(iterate, 30);
		});
	}
}

function onKeyDown(event) {
	if (state == programStates.CREATING_DATA && data.length > 10) {
		state = programStates.START_ITERATING;
		handler = NeuronHandler.generate(data, 100);
		handler.showPath();
		iterate();
	} else {
		handler.nextIteration();
		handler.showPath();
		//Neuron.nextIteration(data, neurons, function() {console.log("Done")});
		//neurons.eachApply("showPath");
	}
}

function onFrame(event) {}