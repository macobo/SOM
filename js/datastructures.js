// Assumes Functional.js, paper.js are loaded.
// Should be loaded as paperscript

(function() {
	// Enum of states
	var mapRadius = 400;
	var timeConstant = 300 / Math.log(mapRadius);
	var learningConstant = 0.2;
	window.states = Object.freeze({
		NONE: 0,
		CREATING_DATA: 1,
		ITERATING: 2
	});

	window.pathLayer = new Layer();
	// Styles, used for configuration
	// Path
	pathStyle = {
	    strokeColor:"#60F",
	    strokeWidth: 2,
	    //dashArray: [3, 3],
	    stokeCap: 'round',
	    radius: 10
	};
	// Circle indicating current position
	indicatorStyle = {
	    fillColor: "#FFF", 
	    strokeColor: "#000",
	    radius: 10
	};
	// circle(s) denoting previous positions.
	wayPostStyle = {
		fillColor: "#777", 
		opacity: 0.3,
		radius: 3,
	};

	var wayPost = function createWayPostSymbol() {
	    var circle = new Path.Circle(new Point(0,0), wayPostStyle.radius);
	    circle.style = wayPostStyle;
	    circle.opacity = wayPostStyle.opacity;
	    return new Symbol(circle);
	}();

	function NeuronPath(point) {
		this.path = new Path();
		this.path.style = pathStyle;
		pathLayer.addChild(this.path);
		this.pathGroup = new Group();
		this.add(point);
		this.indicator = new Path.Circle(point, indicatorStyle.radius);
		this.indicator.style = indicatorStyle;
	}

	function memoizedPoint(curve, part) {
		if (curve.cache === undefined) {
			curve.cache = {};
		}
		var x = Number(part * 100);
		if (!(curve.cache.hasOwnProperty(x))) 
			curve.cache[x] = curve.getPoint(part);
		return curve.getPoint(part);
	}

	// moves the indicator along some segment to part
	NeuronPath.prototype.moveIndicator = function(segment, part) {
		if (segment === undefined) {
			segment = this.segmentCount() - 1;
			part = 1;
		}
		if (this.segmentCount() == 0)
			return;
		var curve = this.path.curves[segment % this.segmentCount()];
		this.indicator.position = memoizedPoint(curve, part);
	}

	// change the color of the indicator
	NeuronPath.prototype.setColor = function(newFillColor) {
		this.indicator.fillColor = newFillColor;
	}

	NeuronPath.prototype.segmentCount = function() { return this.path.curves.length; }

	// updates all the coordinates using translate() and scaled()
	// TODO:
	NeuronPath.prototype.update = function() {

	}

	// adds a point to path
	NeuronPath.prototype.add = function(point) {
		point = translate(point);
		//console.log("adding to NeuronPath ",this, point);
	    this.path.add(point);
	    this.path.smooth();
	    // how to move them later
	    this.pathGroup.addChild(
	    	wayPost.place(point)
	    );
	}

	// Neuron - datastructure containing the info about a neuron
	function Neuron(startState) {
		this.data = [];		
		if (startState !== undefined)
			this.addState(startState);
	} 

	_.extend(Neuron, {
		DATA: {
			indicator: {fillColor: "#FFF"},
		},
		DATASELECTED: {
			indicator: {fillColor: "#00F"},
			oneHolder: true
		},
		NEUTRAL: {
			indicator: {fillColor: "#090"},
		},
		BMU: {
			indicator: {fillColor: "#F00"},
			oneHolder: true,
		},
		MATCH: {
			indicator: {fillColor: "#FF0"},
		},
	});

	Neuron.setStyles = function(style, prevStyle) {
		var holders = prevStyle.holders;
		prevStyle.holders = [];
		_.each(holders, function(neuron) {
			neuron.setStyle(style);
		})
	}

	Neuron.prototype.setStyle = function(style) {
		if (style.indicator !== undefined) {
			_.extend(this.path.indicator.style, style.indicator);
		}
		this.prevStyle = style;
	}

	// Gives a copy of value of data at the given moment.
	// If no parameter is given, the last datapoint is returned.
	Neuron.prototype.state = function(moment) {
		if (moment === undefined)
			moment = this.data.length-1;
		return this.data[moment].slice();
	} 

	// Returns the neuron.
	Neuron.prototype.addState = function(newState) {
		var point = new Point(newState);
		if (!Array.isArray(newState))
			newState = [newState.x, newState.y];

		if (this.path === undefined) {
			this.path = new NeuronPath(point);
		} else {
			this.path.add(point);
		}
		this.data.push(newState);
	}

	// Distance from current state (squared) to other neurons current state
	Neuron.prototype.distance = function(neuron) {
		var a = new Point(this.state());
		if (neuron instanceof Neuron) {
			var b = new Point(neuron.state());
			return a.getDistance(b);
		}
		return neuron.getDistance(a);
	}

	// Calculates the influence over distance, with the neighborhood radius being radius.
	function influence(distance, radius) {
		return Math.exp(-1.0 * distance * distance / (2 * radius * radius));
	}

	// Calculates the neighborhood radius at given iteration
	function neighborhoodRadius(iteration, timeConstant) {
		// TODO: real mapRadius implementation?
		return mapRadius * Math.exp(-1.0 * iteration / timeConstant);
	}

	// Calculates the learning rate at iteration
	function learningRate(iteration, learningConstant, timeConstant) {
		return learningConstant * Math.exp(-1.0 * iteration / timeConstant);
	}

	// Updates the neuron (by adding a new state)
	Neuron.prototype.update = function(BMU, vector, iteration) {
		var R = neighborhoodRadius(iteration, timeConstant);
		var distance = this.distance(BMU);
		//if (distance > R) return;
		
		var L = learningRate(iteration, learningConstant, timeConstant);
		var I = influence(distance, R);
		// A prettier way to do it would be nice...
		var state = this.state(); 
		if (distance <= R) {
			this.setStyle(Neuron.MATCH);
			for (var i = 0; i < vector.length; i++) {
				state[i] += L * I * (vector[i] - state[i]);
			}

		}
		//console.log("Updating ", this, "adding new state ", state);
		this.addState(state);
	}

	Neuron.findBMU = function(neurons, vector) {
		var point = new Point(vector);
		var closest = _.min(neurons, function(neuron) {
			//console.log(neuron.data[0], vector, neuron.distance(point));
			return neuron.distance(point); 
		});
		//console.log(point, closest);
		return closest;
	}

	Neuron.updateAll = function(neurons, vector, iteration) {
		var BMU = Neuron.findBMU(neurons, vector);
		console.log("BMU: ", BMU);
		_.map(neurons, function(neuron) { 
			neuron.setStyle(Neuron.NEUTRAL);
			return neuron.update(BMU, vector, iteration); 
		});
		BMU.setStyle(Neuron.BMU);
	}

	// Generates new neurons within the box created by boxHighLeft, boxLowRight.
	// If they are not provided, the size of canvas is used.
	Neuron.generate = function(amount, boxHighLeft, boxLowRight) {
		if (boxHighLeft === undefined) {
			boxHighLeft = new Point(0, 0);
			boxLowRight = new Point(canvas.width, canvas.height);
		}
		var size = boxLowRight - boxHighLeft;
		// perhaps a generator pattern would have been better?
		var neurons = []
		for (var i = 0; i < amount; i++) {
			var point = Point.random() * size + boxHighLeft;
			neurons.push(new Neuron(point));
		}
		return neurons;
	}

	var infoText = new PointText(new Point(0,20))
	infoText.characterStyle = {
	    fontSize: 20,
	    fillColor: 'black',
	};

	window.NeuronPath = NeuronPath;
	window.Neuron = Neuron;
	window.infoText = infoText;
})();

var state = states.CREATING_DATA;
data = [];
neurons = [];

tool.minDistance = 10;
function onMouseDrag(event) {
	if (state == states.CREATING_DATA) {
		data.push(new Neuron(event.point));
	}
}
var lastTime = 0, x = 0, target = 0;
var timeframe = 1;
function onMouseDown(event) {
	if (state == states.CREATING_DATA) {
		data.push(new Neuron(event.point));
	}
}

function selectRandom(data) {
	return data[Math.floor(Math.random() * data.length) ];
}
var iteration = 0;

function nextIteration(data, neurons) {
	_.each(data, function(d) { d.setStyle(Neuron.DATA) });
	var vector = selectRandom(data);
	vector.setStyle(Neuron.NEUTRAL);
	//console.log("Data vector", vector.state());
	Neuron.updateAll(neurons, vector.state(), iteration);
	iteration += 1;
}

function onFrame(event) {
	if (state == states.ITERATING) {
		//console.log(event.delta);
		x = (event.time - lastTime) / timeframe;
	    if (x >= 1) {
	        target = (target + 1);
	        x -= 1;
	        lastTime = event.time;
	    }
	    _.each(neurons, function(neuron) {
	    	neuron.path.moveIndicator(target, x);
	    });
	}
}

function onKeyDown(event) {
	if (state == states.CREATING_DATA && data.length > 10) {
		state = states.ITERATING;
		neurons = Neuron.generate(109);
	} else if (state == states.ITERATING) {
		nextIteration(data, neurons);
	}
}

function onMouseMove(event) {
	infoText.content = ""+event.event.x+" "+event.event.y;
}


/*
The plan:
Each "NeuronPath" is an object containing the path of this NeuronPath as well as the circle of this NeuronPath.
In the same scope exists the settings, etcetc. (also the current position of the circle)

There's a method move(value) which appends a new value at end, updates, smoothes
There's a method drawCircle(segment, at) (with at in [0..1]) 
which changes the current position of the circle to appropriate place (used for drawing)

There's also a method changeColor
(and perhaps a changeState method that uses premade configuration/enum to change colors automatically)

Ideas: instead of using raw canvas x,y coordinates, there should be a method to translate absolute coordinates
used within logic to coordinates shown in canvas at the moment (used for scaling, etc).
	Global method translate(Point), scaled(size)
If so, there's a need for a update method which updates the path as needed.
*/

/* 
// Implementation for points flying around - used for testing
neurons = [
	new NeuronPath(new Point(300, 300)), 
	new NeuronPath(new Point(0,0)),
	new NeuronPath(new Point(400, 400)),
d	new NeuronPath(new Point(700, 500))
];
//neurons[0].add(new Point(400, 350));
console.log(neurons);
var lastTime = 0, x = 0;
var timeframe = 0.5;
var target = 0;
var active = 0;

function onFrame(event) {
    x = (event.time - lastTime) / timeframe;
    //console.log(x, event.time, lastTime, neurons[active]);
    if (x >= 1) {
        target = (target + 1);
        x -= 1;
        lastTime = event.time;
    }
    //console.log(neuron, neuron.indicator.position);
    for (var i = 0; i < neurons.length; i++)
    	neurons[i].moveIndicator(target, x);
    
}

function onMouseDown(event) {
	target = 0;
    neurons[active].add(event.point);
}

function onKeyDown(event) {
	neurons[active].setColor("#FFF");
	active = (active+1) % neurons.length;
	neurons[active].setColor("#F00");
}

*/