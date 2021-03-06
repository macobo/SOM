// TODO: PaperPath should be generated on demand, data constructor
paper.install(window);
paper.setup( document.getElementById('canvas'));
Neuron = (function(constants, statuses, styles) {
	var lowLayer = new paper.Group();
	function Neuron() {
		// Array of Point objects
		this._segments = [];
		// Array that holds the status of each neuron at that moment
		this._status = [];
		// Invisible path used for calculating curves when no path is drawn
		this.basePath = new Path(); // used for calculating curves.
		this.basePath.visible = false;
		// TODO: review this hack. :)
		this.basePath._changed = function() {};
		// Path used for drawing
		this.path = new Path();
		this.path.style = styles.path;
		this.path._changed = function() {};
		layers.path.addChild(this.path);
		// Indicator showing current position
		this.indicator = new Path.Circle(new Point(0, 0), styles.indicator.radius);
		this.indicator.style = styles.indicator;
		this.indicator.visible = false;
	}

	// If parameter is an array, it is first converted to Point
	Neuron.prototype.add = function(segment, status) {
		if (Array.isArray(segment))
			segment = new Point(segment);
		if (status === undefined)
			status = statuses.NEUTRAL;
		this._segments.push(segment);
		this._status.push(status);
		this.basePath.add(segment);
		if (constants.smoothPaths)
			this.basePath.smooth();
		return this; // return a reference to this
	};

	Neuron.prototype.segmentCount = function() {
		return this._segments.length;
	};

	// Returns a Point - the location of the neuron at that time (which should be a Number)
	// If when is not provided, the last segment is given
	Neuron.prototype.segment = function(when) {
		if (when === undefined)
			when = this._segments.length-1;
		return this._segments[when];
	};

	Neuron.prototype.status = function(when) {
		if (when === undefined)
			when = this._segments.length-1;
		return this._status[when];
	};


	/*
		== Calculating next states ==
	*/
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
			newSegment = newSegment.add(
				vector.subtract(newSegment).multiply(L * I)
			);
			//newSegment = newSegment + (vector - newSegment) * L * I;
			/*
			_.each(["x", "y"], function(dim) {
				newSegment[dim] += L * I * (vector[dim] - newSegment[dim]);
			});
			*/
			newStatus = (this == BMU) ? statuses.BMU : statuses.INRANGE;
		}
		this.add(newSegment, newStatus);
		if (callback !== undefined)
			callback();
	};

	// Returns the closest neuron in the bunch
	Neuron.prototype.findClosest = function(neurons) {
		var point = this.segment();
		var closest = _.min(neurons, function (n) {
			return point.getDistance(n.segment()); 
		});
		return closest;
	};

	/*
		Drawing current states
	*/
	// Builds (if necessary) the path from [from -> to] (inclusive)
	// if no arguments are given, the whole path is drawn
	Neuron.prototype.showPath = function(from, to) {
		if (from === undefined) {
			from = 0;
			to = this.segmentCount()-1;
		}
		if (!constants.showPaths)
			return this;
		// TODO: REFACTOR THIS!
		// The bulk of time is spent on path.smooth() and path.add()
		if (from !== this.path.currentStart || to !== this.path.currentEnd) {
			this.path.removeSegments();
			var segments = this._segments.slice(from, to+1);
			//this.path.addSegments(segments);
			
			// Bug in paper.js? with addSegments, path.curves won't be updated.
			var path = this.path;
			_.each(segments, function(p) { path.add(p); });
			this.path.currentStart = from;
			this.path.currentEnd = to;
			if (constants.smoothPaths)
				this.path.smooth();
		}
		return this;
	};

	// TODO: functions to toggle the visibility of parts

	Neuron.prototype.getCurve = function(segment) {
		var index = segment - this.path.currentStart;
		if (isNaN(this.path.currentStart) || index < 0 || index >= this.path.curves.length)
			return this.basePath.curves[segment];
		return this.path.curves[index];
	};

	Neuron.prototype.setStyle = function(style) {
		_.extend(this.indicator.style, style.indicator);
	};

	// If segment is not provided, the last (drawn) segment is assumed
	// if part is not given, 1 is used
	Neuron.prototype.setIndicator = function(segment, part) {
		if (segment === undefined) {
			segment = this.path.currentEnd-1;
			part = 1;
		}
		// TODO: if part is not given...
		if (this.segmentCount() == 1) {
			this.setStyle(this._status[0]);
			this.indicator.position = this._segments[0];
		} else {
			this.setStyle(this._status[segment+1]);
			this.indicator.position = this.getCurve(segment).getPoint(part);
		}
		this.indicator.visible = true;
	};

	return Neuron;
})(constants, NeuronStatus, PathStyles);	



NeuronHandler = (function(constants, statuses) {
	function Handler(neurons, data) {
		this.neurons = neurons;
		this.data = data;
		this.selected = [null];
		this.prevSelected = null;
		this.iteration = 0;
		this.callbacks = {};
		this.setup();
	}

	Handler.prototype.setup = function() {
		this.addCallbacks({
			iteration: function(iteration) {
				//loader.indicator.setPosition(iteration / constants.iterations);
				loader.setLoaded(iteration / constants.iterations);
			},
			showState: function(where) {
				loader.indicator.setPosition(where);
			}
		});
		var self = this;
		var timer;
		loader.addCallbacks({
			setPosition: function() { 
				self.showState.apply(self, arguments); 
			}, 
			setRange: function(from, to) {
				clearTimeout(timer);
				timer = setTimeout(function() {
					self.setRange(from, to);
				}, 100);
			},
		});
	};

	Handler.prototype.addCallbacks = function(pairs) {
		_.extend(this.callbacks, pairs);
	};

	// Returns an Handler of neurons randomly positioned within the bounds
	// If no bounds are given, the current window will be used.
	Handler.generate = function(data, limit, bounds) {
		if (bounds === undefined) {
			bounds = new Rectangle(
				new Point(0,0), 
				new Point(window.innerWidth, window.innerHeight)
			);
		}
		var size = new Point(bounds.size);
		var neurons = [];
		for (var i = 0; i < limit; i++) {
			var neuron = new Neuron(layers);
			//var point = new Point.random() * size + bounds.topLeft;
			var point = Point.random().multiply(size).add(bounds.topLeft);
			neuron.add(point, statuses.NEUTRAL);
			neurons.push(neuron);
		}
		return new Handler(neurons, data);
	};

	// Generates the next iteration from current state.
	Handler.prototype.nextIteration = function(callback) {
		var vector = selectRandom(this.data);
		var BMU = vector.findClosest(this.neurons);
		// Make sure we call the callback once we are done with all the neurons
		var self = this;
		var done = function() {
			self.iteration++;
			console.log("iteration",self.iteration,"done");
			if (self.callbacks.iteration) {
				self.callbacks.iteration(self.iteration);
			}
			if (callback !== undefined)
				callback.apply(arguments);
		};
		var counter = counterCallback(done, this.neurons.length);
		this.neurons.eachApply("updateState", vector.segment(), BMU, counter);
		this.selected.push({vector: vector, BMU: BMU.segment()});
	};

	var prevCircle = null;
	function setSelectedData(self, iteration, part) {
		if (iteration === undefined)
			iteration = self.iteration;
		if (self.prevSelected) {
			self.prevSelected.setStyle(statuses.DATA);
			self.prevSelected = null;
		}
		if (prevCircle !== null) {
			prevCircle.remove();
			prevCircle = null;
		}
		var selected = self.selected[iteration];
		if (selected) {
			selected.vector.setStyle(statuses.DATASELECTED);
			self.prevSelected = selected.vector;
			var radius = constants.neighborhoodRadius(iteration, constants);
			prevCircle = new Path.Circle(selected.BMU, radius);
			prevCircle.fillColor = "#F00";
			prevCircle.opacity = 0.15;
			layers.path.addChild(prevCircle);
		}
	}

	Handler.prototype.setRange = function(from, to) {
		from = Math.floor(from * constants.iterations);
		to = Math.floor(to * constants.iterations);
		this.neurons.eachApply("showPath", from, to);
		//this.neurons.eachApply("setIndicator", to, 0);
		paper.view.draw();
	};
 
	Handler.prototype.showState = function(when) {
		var result = when * constants.iterations;
		var iteration = Math.floor(result);
		if (iteration >= this.iteration)
			return false;
		var part = result % 1;
		var from = Math.floor(loader.status().start * constants.iterations)
		this.neurons.eachApply("showPath", from, iteration+1);
		this.neurons.eachApply("setIndicator", iteration, part);
		setSelectedData(this, iteration+1, part);
		if (this.callbacks.showState)
			this.callbacks.showState(when);
		return true;
	};
	Handler.prototype.showPath = function(from, to) {
		this.neurons.eachApply("showPath", from, to);
		setSelectedData(this,to);
	};

	return Handler;
})(constants, NeuronStatus);