// TODO: PaperPath should be generated on demand, data constructor.

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

var SOMConstats = {
	radius: 500,
	iterations: 500,
	learning: 0.1,
	influence: function(distance, radius) {
		return Math.exp(-1.0 * distance * distance / (2 * radius * radius));
	}
	neighborhoodRadius: function(iteration, constants) {
		return constants.radius * Math.exp(-1.0 * iteration / constants.time);
	}
	learningRate: function(iteration, constants) {
		return constants.learning * Math.exp(-1.0 * iteration / constants.time);
	}
}
SOMConstats.time = SOMConstats.iterations / Math.log(SOMConstats.radius);

var NeuronStatus = {
		DATA: {
			indicator: {fillColor: "#FFF"},
		},
		DATASELECTED: {
			indicator: {fillColor: "#00F"}
		},
		NEUTRAL: {
			indicator: {fillColor: "#090"},
		},
		BMU: {
			indicator: {fillColor: "#F00"}
		},
		INRANGE: {
			indicator: {fillColor: "#FF0"},
		},
	}

Neuron = (function(constants, status) {
	function Neuron() {
		// Array of Point objects
		this.segments = [];
		this.status = [];
		// TODO: Path.style?
		this.path = new Path();
	}

	// If parameter is an array, it is first converted to Point
	Neuron.prototype.addSegment = function(segment, status) {
		if (Array.isArray(segment))
			segment = new Point(segment);
		this.segments.push(segment);
		this.status.push(status)
	}

	Neuron.prototype.segmentCount = function() {
		return this.segments.length;
	}

	// Returns a Point - the location of the neuron at that time (which should be a Number)
	// If when is not provided, the last segment is given
	Neuron.prototype.state = function(when) {
		if (when === undefined)
			when = this.segments.length-1;
		return this.segments[when];
	}


	/*
		== Calculating next states ==
	*/

	var dimensions = ["x", "y"];
	// Updates the neuron (by adding a new state at the end)
	// Once updating is done, callback (if provided) is called
	Neuron.prototype.updateState = function(vector, BMU, callback) {
		var newSegment = this.state().clone();
		var newStatus = status.NEUTRAL;

		var iteration = this.segments.length;
		var R = constants.neighborhoodRadius(iteration, constants);
		var distance = BMU.state().getDistance(newSegment);
		if (distance < R) {
			var I = constants.influence(distance, R);
			var L = constants.learningRate(iteration, constants);
			_.each(dimensions, function(dim) {
				newSegment[dim] += L * I * (vector[dim] - newSegment[dim]);
			});
			newStatus = (this == BMU) ? status.BMU : status.INRANGE;
		}
		this.addSegment(newSegment, newStatus);
		if (callback !== undefined)
			callback();
	}

	// Returns the closest neuron in the bunch
	Neuron.prototype.findClosest = function(neurons) {
		var point = this.state();
		var closest = _.min(neurons, function (n) { 
			point.getDistance(n.state()); 
		});
		return closest;
	}

	// Generates the next iteration from current state.
	// If vector is not supplied as argument, a random vector from data is used.
	Neuron.nextIteration = function(data, neurons, vector) {
		if (vector === undefined)
			vector = selectRandom(data);
		var BMU = vector.findClosest(neurons);
		// Make sure we call the callback once we are done with all the neurons
		var counter = counterCallback(callback, this.state.length);
		_.each(neurons, function(neuron) {
			neuron.updateState(vector, BMU, counter);
		});
	}

	/*
		Drawing current states
	*/
	// Builds (if neccesary) the path from [from -> to] (inclusive)
	Neuron.prototype.showPath = function(from, to) {
		// nothing in the path or no overlap
		if (this.path.segments.length == 0 || this.prevTo < from || this.prevFrom > to) {
			this.path.removeChildren();
			this.prevTo = to;
			this.prevFrom = from;
			this.path.addSegments(this.segments.slice(from, to+1));
			return;
		}
		// remove from end
		if (to < this.prevTo)
			this.path.removeChildren(to-this.prevFrom);
		// append
		else
			this.path.addSegments(this.segments.slice(this.prevTo+1, to+1));
		// remove from start
		if (from > this.prevFrom)
			this.path.removeChildren(0, from-this.prevFrom);
		// prepend
		else
			this.path.addSegments(this.segments.slice(from, this.prevFrom));
		this.prevTo = to;
		this.prevFrom = from;
	}

	Neuron.showPaths = function(neurons, from, to) {
		_.each(neurons, function(neuron) {
			neuron.showPath(from, to);
		});
	}
})(SOMConstats, NeuronStatus);