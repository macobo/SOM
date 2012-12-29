constants = {
	radius: 500,
	iterations: 500,
	learning: 0.1,
	influence: function(distance, radius) {
		return Math.exp(-1.0 * distance * distance / (2 * radius * radius));
	},
	neighborhoodRadius: function(iteration, constants) {
		return constants.radius * Math.exp(-1.0 * iteration / constants.time);
	},
	learningRate: function(iteration, constants) {
		return constants.learning * Math.exp(-1.0 * iteration / constants.time);
	}
}
constants.time = constants.iterations / Math.log(constants.radius);


programStates = Object.freeze({
	NONE: 0,
	CREATING_DATA: 1,
	START_ITERATING: 2,
	ITERATING: 3,
	BROWSING: 4,
});


function selectRandom(data) {
	return data[Math.floor(Math.random() * data.length) ];
}

// Function that returns a function that counts the number of
// times it is invoked. When the number reaches 'count', 
// function callback is called (once).
function counterCallback(callback, count) {
	return (function() {
		count--;
		if (count == 0)
			callback.apply(arguments);
	});
}

function setState(when) {
	var result = when * constants.iterations;
	var iteration = Math.floor(result);
	var part = result % 1;
	_.each(neurons, function(neuron) {
		neuron.setIndicator(iteration, part);
	});
}

Array.prototype.eachApply = function(what) {
	var args = Array.prototype.slice.call(arguments);
	args.shift();
	_.each(this, function(element) {
		element[what].apply(element, args);
	});
}