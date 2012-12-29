var Indicator = function() {
	var indicator, range = null;
	var parent, currentPosition;

	function Indicator(parentRectangle) {
		parent = parentRectangle;
		currentPosition = parent.topLeft;
		indicator = new Path.Line(currentPosition,
									parent.bottomLeft);
		indicator.style = {
			strokeWidth: 3,
			strokeColor: "#F00",
			strokeCap: "round"
		}
	}

	Indicator.prototype.setPosition = function(where) {
		if (range !== null) {
			range.remove();
			range = null;
		}
		var target = parent.topLeft + new Point(parent.width * where, 0);
		indicator.translate(target - currentPosition);
		currentPosition = target;
		indicator.visible = true;
	}

	Indicator.prototype.setRange = function(left, right) {
		if (range !== null) {
			range.remove();
			range = null;
		}
		indicator.visible = false;
		var top = parent.topLeft.clone();
		top.x += parent.width * left;
		var bottom = parent.bottomLeft.clone();
		bottom.x += parent.width * right;
		var rect = new Rectangle(top, bottom);
		range = new Path.RoundRectangle(rect, 3);
		range.style = {
			strokeWidth: 3,
			strokeColor: "#F00",
			strokeCap: "round"
		}
	}

	return Indicator;
}();

loader = function(selector) {
	function Loader() {
		this.loadBar = drawLoader();
		this.center();
		this.indicator = new Indicator(this.loadBar.rectangle);
		this.callbacks = {};
	}

	function drawLoaderBase(top, bottom) {
		var delta = 13;
		var radius = 20;
		var rect = new Rectangle(top+delta, bottom-delta)
		var path = new Path.Rectangle(rect, radius);
		path.strokeWidth = 1;
		path.strokeColor = "#FFF";
		path.opacity = 0.6;
		var off = delta + 3;
		var loadRect = new Rectangle(top+off, bottom-off);
		loadBar = new Path.Rectangle(loadRect);
		loadBar.fillColor = "#DDD";
		loadBar.opacity = 0.8;
		loadBar.rectangle = loadRect;
		return loadBar;
	}

	function drawLoader() {
		var width = selector.width();
		var height = selector.height();
		var rect = new Rectangle(0,0,width,height);
		var shell = new Path.RoundRectangle(rect, 20);
		shell.style = {
			fillColor: "#333",
		}
		shell.opacity = 0.6;
		return drawLoaderBase(rect.topLeft, rect.bottomRight);
	}

	Loader.prototype.center = function() {
		$("#progressbar").css({
			"bottom": ($(window).height() * 0.05),
			"left": ($(window).width() - selector.width())/2,
		});
		var resizeTimer, center = this.center;
		$(window).resize(function() {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(center, 100);
		});
	}

	// Returns a number between 0 and 1 - the 
	Loader.prototype.location = function(x) {
		var where = (x - this.loadBar.rectangle.left) / this.loadBar.rectangle.width;
		//console.log("loc", x, where);
		return Math.min(1, Math.max(0, where));
	}

	Loader.prototype.inverseLocation = function(val) {
		return this.loadBar.rectangle.left + val * this.loadBar.rectangle.width;
	}

	Loader.prototype.inBar = function(point) {
		// replace with point.isInside
		var top = this.loadBar.rectangle.topLeft-2;
		var bottom = this.loadBar.rectangle.bottomRight+2;
		return top.x <= point.x && top.y <= point.y && point.x <= bottom.x && point.y <= bottom.y;
	}

	Loader.prototype.setPosition = function(point) {
		if (this.inBar(point)) {
			var where = this.location(point.x);
			this.indicator.setPosition(where);
			if (this.callbacks.setPosition)
				this.callbacks.setPosition(where);
		}
	}

	Loader.prototype.setRange = function(from, to) {
		if (from.x > to.x) {
			this.setRange(to, from);
			return;
		}
		// TODO
		if (this.inBar(from) && this.inBar(to)) {
			var fromX = this.location(from.x);
			var toX = this.location(to.x);
			//console.log(fromX, toX);
			this.indicator.setRange(fromX, toX);
			if (this.callbacks.setRange)
				this.callbacks.setRange(from, to);
		}
	}


	Loader.prototype.addCallbacks = function(pairs) {
		_.extend(this.callbacks, pairs);
	}

	return new Loader();
}($("#progressbar"));

var startPoint = null;
var dragging = false;
function onMouseDrag(event) {
	dragging = dragging || (Math.abs(event.point.x - startPoint.x) > 9);
	if (dragging && loader.inBar(event.point)) {
		loader.setRange(startPoint, event.point);
	}
}

function onMouseDown(event) {
	if (loader.inBar(event.point)) {
		startPoint = event.point;
		dragging = false;
		loader.setPosition(event.point);
	}
}

function onMouseUp(event) {
	startPoint = null;

}
function onFrame() {}