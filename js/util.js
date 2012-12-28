SOMConstants = {
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
SOMConstants.time = SOMConstants.iterations / Math.log(SOMConstants.radius);



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
