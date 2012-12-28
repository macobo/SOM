// This is where the magic happens. :)
// TODO: make these local
neurons = [], data = [];
var state = programStates.CREATING_DATA;


function setState(when) {
	var result = when * constants.iterations;
	var iteration = Math.floor(result);
	var part = result % 1;
	_.each(neurons, function(neuron) {
		neuron.setIndicator(iteration, part);
	})
}

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
		_.each(neurons, function(neuron) { neuron.showPath(); });
	} else {
		Neuron.nextIteration(data, neurons);
		_.each(neurons, function(n) { n.showPath() })
	}
}