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
			//handler.showPath();
			setTimeout(iterate, 20);
		});
	} else 
		state = programStates.BROWSING;
}

function onKeyDown(event) {
	if (state == programStates.CREATING_DATA && data.length > 10) {
		state = programStates.ITERATING;
		handler = NeuronHandler.generate(data, constants.neurons);
		handler.showPath();
		iterate();
	} 
}

// Bug in paper.js?
function onFrame(event) {}