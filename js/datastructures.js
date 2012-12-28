// TODO: PaperPath should be generated on demand, data constructor

Neuron = (function(constants, statuses, styles) {
	function Neuron() {
		// Array of Point objects
		this._segments = [];
		this._status = [];
		this.path = new Path();
		this.path.style = styles.path;
		this.indicator = new Path.Circle(new Point(0, 0), styles.indicator.radius);
		this.indicator.style = styles.indicator;
		this.indicator.visible = false;
	}

	// If parameter is an array, it is first converted to Point
	Neuron.prototype.addSegment = function(segment, status) {
		if (Array.isArray(segment))
			segment = new Point(segment);
		if (status === undefined)
			status = statuses.NEUTRAL;
		this._segments.push(segment);
		this._status.push(status)
	}

	Neuron.prototype.segmentCount = function() {
		return this._segments.length;
	}

	// Returns a Point - the location of the neuron at that time (which should be a Number)
	// If when is not provided, the last segment is given
	Neuron.prototype.segment = function(when) {
		if (when === undefined)
			when = this._segments.length-1;
		return this._segments[when];
	}

	Neuron.prototype.status = function(when) {
		if (when === undefined)
			when = this._segments.length-1;
		return this._status[when];
	}


	/*
		== Calculating next states ==
	*/

	var dimensions = ["x", "y"];
	// Updates the neuron (by adding a new state at the end)
	// Once updating is done, callback (if provided) is called
	Neuron.prototype.updateState = function(vector, BMU, callback) {
		var newSegment = this.segment().clone();
		var newStatus = statuses.NEUTRAL;

		var iteration = this.segmentCount();
		var R = constants.neighborhoodRadius(iteration, constants);
		var distance = BMU.segment().getDistance(newSegment);
		if (distance < R) {
			var I = constants.influence(distance, R);
			var L = constants.learningRate(iteration, constants);
			_.each(dimensions, function(dim) {
				newSegment[dim] += L * I * (vector[dim] - newSegment[dim]);
			});
			newStatus = (this == BMU) ? statuses.BMU : statuses.INRANGE;
		}
		this.addSegment(newSegment, newStatus);
		if (callback !== undefined)
			callback();
	}

	// Returns the closest neuron in the bunch
	Neuron.prototype.findClosest = function(neurons) {
		var point = this.segment();
		var closest = _.min(neurons, function (n) { 
			point.getDistance(n.segment()); 
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
		var counter = counterCallback(callback, neurons.length);
		_.each(neurons, function(neuron) {
			neuron.updateState(vector, BMU, counter);
		});
	}

	/*
		Drawing current states
	*/
	// Builds (if neccesary) the path from [from -> to] (inclusive)
	Neuron.prototype.showPath = function(from, to) {
		this.path.removeSegments();
		this.path.addSegments(this._segments.slice(from, to+1));
		this.path.currentStart = from;
		this.path.currentEnd = to;
		this.path.smooth();
	}

	Neuron.showPaths = function(neurons, from, to) {
		_.each(neurons, function(neuron) {
			neuron.showPath(from, to);
		});
	}

	// TODO: functions to toggle the visibility of parts

	Neuron.prototype.getCurve = function(segment) {
		return this.path.curves[segment - this.path.currentStart];
	}

	// If segment is not provided, the last (drawn) segment is assumed
	// if part is not given, 1 is used
	Neuron.prototype.setIndicator = function(segment, part) {
		if (segment === undefined) {
			segment = this.path.currentEnd-1;
			part = 1;
		}
		_.extend(this.indicator.style, this._status[segment+1]);
		this.indicator.position = this.getCurve(segment).getPoint(part);
		this.indicator.visible = true;
	}

	return Neuron;
})(SOMConstants, NeuronStatus, PathStyles);	