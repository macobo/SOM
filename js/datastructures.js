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
	    strokeColor: "#000"
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

	function Neuron(point) {
		this.path = new Path();
		this.pathGroup = new Group();
		addToPath(this, point);
		this.indicator = new Circle(point, indicatorStyle.radius);
		this.indicator.style = indicatorStyle;
	}

	// adds a point to path
	Neuron.prototype.add = function(point) {
		addToPath(this, translate(point));
	}

	// moves the indicator along some segment to part
	Neuron.prototype.moveIndicator = function(segment, part) {
		var curve = this.path.curves[segment];
		this.indicator.position = curve.getPoint(part);
	}

	// change the color of the indicator
	Neuron.prototype.changeColor = function(newFillColor) {
		this.indicator.fillColor = newFillColor;
	}

	// updates all the coordinates using translate() and scaled()
	// TODO:
	Neuron.prototype.update = function() {

	}

	function addToPath(neuron, point) {
	    neuron.path.add(point);
	    neuron.path.smooth();
	    // how to move them later
	    neuron.group.addChild(
	    	cap.place(point)
	    );
	}

	window.Neuron = Neuron;
})();

/*
The plan:
Each "Neuron" is an object containing the path of this neuron as well as the circle of this neuron.
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