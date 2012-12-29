// This is where the magic happens. :)
// TODO: make these local
neurons = [], data = [];
var state = programStates.CREATING_DATA;

tool.minDistance = 10;

function onMouseDrag(event) {
	if (state == programStates.CREATING_DATA) {
		var neuron = new Neuron().add(event.point, NeuronStatus.DATA)
		data.push(neuron.showPath());
	}
}

function onKeyDown(event) {
	if (state == programStates.CREATING_DATA && data.length > 10) {
		state = programStates.START_ITERATING;
		neurons = Neuron.generate(100);
		neurons.eachApply("showPath");
	} else {
		Neuron.nextIteration(data, neurons);
		neurons.eachApply("showPath");
	}
}

function onFrame(event) {}