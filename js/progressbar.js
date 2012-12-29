var Indicator = function(styles) {
	var indicator, range = null;
	var parent, currentPosition;

	function Indicator(parentRectangle) {
		parent = parentRectangle;
		currentPosition = parent.topLeft;
		indicator = new Path.Line(currentPosition, parent.bottomLeft);
		_.extend(indicator.style, styles.indicator);
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
		_.extend(range.style, styles.indicator);
	}

	return Indicator;
}(LoadbarStyles);

loader = function(selector, styles) {
	function Loader() {
		var rect = drawLoaderBase();
		this.loadBar = drawLoader(styles.loadBar, 
			rect.topLeft, rect.bottomRight);
		this.loaded = null;
		this.center();
		this.callbacks = {};
		this.setLoaded(0.005);
		this.indicator = new Indicator(this.loadBar.rectangle);
	}

	function drawLoader(style, top, bottom) {
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
		_.extend(loadBar, style);
		loadBar.rectangle = loadRect;
		loadBar.radius = radius;
		return loadBar;
	}

	function drawLoaderBase() {
		var width = selector.width();
		var height = selector.height();
		var rect = new Rectangle(0,0,width,height);
		var shell = new Path.RoundRectangle(rect, 20);
		shell.style = {
			fillColor: "#333",
		}
		shell.opacity = 0.6;
		return rect;
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
		return Math.min(1, Math.max(0, where));
	}

	Loader.prototype.setLoaded = function(amount) {
		if (this.loaded === null) {
			this.loaded = new Path.Rectangle(this.loadBar.rectangle);
			_.extend(this.loaded, styles.loaded);
			this.loaded.rectangle = this.loadBar.rectangle.clone();
			this.loaded.lastAmount = 1;
		}
		// Hack due to otherwise drawing on the wrong canvas
		var width = this.loadBar.rectangle.width * amount;
		var height = this.loadBar.rectangle.height;
		var horScale = amount / this.loaded.lastAmount;
		this.loaded.scale(horScale, 1, this.loadBar.rectangle.leftCenter);
		this.loaded.rectangle = new Rectangle(
			this.loadBar.rectangle.topLeft,
			new Size(width, height)
		);
		this.loaded.lastAmount = amount;
	}

	Loader.prototype.inBar = function(point) {
		return point.isInside(this.loaded.rectangle);
	}

	Loader.prototype.inverseLocation = function(val) {
		return this.loadBar.rectangle.left + val * this.loadBar.rectangle.width;
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
			this.indicator.setRange(fromX, toX);
			if (this.callbacks.setRange)
				this.callbacks.setRange(from, to);
		}
	}

	Loader.prototype.addCallbacks = function(pairs) {
		_.extend(this.callbacks, pairs);
	}

	return new Loader();
}($("#progressbar"), LoadbarStyles);

var startPoint = null;
var dragging = false;
function onMouseDrag(event) {
	if (!dragging && startPoint !== null)
		dragging = Math.abs(event.point.x - startPoint.x) > 9;
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