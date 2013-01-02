var Indicator = function(styles) {

	function Indicator(parentRectangle, edgeRectangle) {
		this.parent = parentRectangle;
		this.top = this.parent.topLeft;
		this.current = 0;
		this.range = edgeLines(this.parent, edgeRectangle, styles.range);
		this.indicator = new Path.Line(this.top, this.parent.bottomLeft);
		_.extend(this.indicator.style, styles.indicator);
	}

	function edgeLines(r1, r2, style) {
		var topLine = new Path.Line(
			new Point(r1.left, r1.top-3), new Point(r1.right, r1.top-3));
		_.extend(topLine.style, style);
		var bottomLine = new Path.Line(
			new Point(r1.left, r1.bottom+3), new Point(r1.right, r1.bottom+3));
		_.extend(bottomLine.style, style);
		topLine.visible = false;
		bottomLine.visible = false;
		return {
			top: topLine, bottom: bottomLine,
			width: r1.width, maxWidth: r1.width,
			left: 0, right: 1
		}
	}

	Indicator.prototype.setPosition = function(where) {
		var target = this.parent.topLeft + 
			new Point(this.parent.width * where, 0);
		this.indicator.translate(target - this.top);
		this.top = target;
		this.current = where;
		this.indicator.visible = true;
	}

	Indicator.prototype.setRange = function(left, right) {
		this.range.top.visible = true;
		this.range.bottom.visible = true;
		var width = (right - left) * this.range.maxWidth;
		var delta = new Point((left - this.range.left) * this.range.maxWidth, 0);
		var scale = width / this.range.width;
		if (width == 0) return;
		this.range.top.translate(delta);
		this.range.bottom.translate(delta);
		this.range.top.scale(scale, 1, this.range.top.segments[0].point);
		this.range.bottom.scale(scale, 1, this.range.bottom.segments[0].point);
		this.range.width = width;
		this.range.left = left;
		this.range.right = right;
	}

	Indicator.prototype.resetRange = function() {
		this.setRange(0, 1);
		this.range.top.visible = false;
		this.range.bottom.visible = false;
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
		this.setLoaded(0.001);
		this.indicator = new Indicator(this.loadBar.rectangle, rect);
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
				this.callbacks.setRange(fromX, toX);
		}
	}

	Loader.prototype.addCallbacks = function(pairs) {
		_.extend(this.callbacks, pairs);
	}

	Loader.prototype.status = function() {
		var result = {
			"start": this.indicator.range.left,
			"end": Math.min(this.indicator.range.right, this.loaded.lastAmount),
			"indicator": this.indicator.current
		}
		result.diff = result.end - result.start;
		return result;
	}

	return new Loader();
}($("#progressbar"), LoadbarStyles);

var startPoint = null;
var dragging = false;
function onMouseDrag(event) {

	pause();
	if (!dragging && startPoint !== null && loader.inBar(event.point))
		dragging = Math.abs(event.point.x - startPoint.x) > 9;
	if (dragging) {
		loader.setRange(startPoint, event.point);
	}
}

function onMouseDown(event) {
	pause();
	if (loader.inBar(event.point)) {
		startPoint = event.point;
		dragging = false;
		loader.setPosition(event.point);
		loader.indicator.resetRange();
	}
}

function onMouseUp(event) {
	startPoint = null;

}
function onFrame() {}
function onKeyDown(event) {
	if (event.key == "space")
		togglePlaying();
}