// Assumes Functional.js, paper.js are loaded.
// Should be loaded as paperscript

(function() {
	// Styles, used for configuration
	// Path
	pathStyle = {
	    strokeColor:"#60F",
	    strokeWidth: 2,
	    dashArray: [3, 3],
	    stokeCap: 'round',
	    radius: 10
	};
	// Circle indicating current position
	indicatorStyle = {
	    fillColor: "#F00", 
	    strokeColor: "#000",
	    radius: 10
	};
	// circle(s) denoting previous positions.
	wayPostStyle = {
		fillColor: "#777", 
		opacity: 0.8,
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
		this.pathGroup = new Group();
		addToPath(this, point);
		this.indicator = new Path.Circle(point, indicatorStyle.radius);
		this.indicator.style = indicatorStyle;
	}

	// adds a point to path
	NeuronPath.prototype.add = function(point) {
		addToPath(this, translate(point));
	}

	// moves the indicator along some segment to part
	NeuronPath.prototype.moveIndicator = function(segment, part) {
		if (this.segmentCount() == 0)
			return;
		var curve = this.path.curves[segment % this.segmentCount()];
		this.indicator.position = curve.getPoint(part);
	}

	// change the color of the indicator
	NeuronPath.prototype.changeColor = function(newFillColor) {
		this.indicator.fillColor = newFillColor;
	}

	NeuronPath.prototype.segmentCount = function() { return this.path.curves.length; }

	// updates all the coordinates using translate() and scaled()
	// TODO:
	NeuronPath.prototype.update = function() {

	}

	function addToPath(neuron, point) {
		console.log(neuron, point);
	    neuron.path.add(point);
	    neuron.path.smooth();
	    // how to move them later
	    neuron.pathGroup.addChild(
	    	wayPost.place(point)
	    );
	}

	window.NeuronPath = NeuronPath;
	console.log("ready");
})();

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

neurons = [
new NeuronPath(new Point(300, 300)), 
new NeuronPath(new Point(0,0)),
new NeuronPath(new Point(400, 400))
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
        x = 0;
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
	active = (active+1) % neurons.length;
}