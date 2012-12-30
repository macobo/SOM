constants = {
	radius: 800,
	iterations: 100,
	neurons: 100,
	learning: 0.3,
	showPaths: true,
	smoothPaths: true,
	animation_speed: 0.01,
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
constants.time = constants.iterations / Math.log(constants.radius);


programStates = Object.freeze({
	NONE: 0,
	CREATING_DATA: 1,
	ITERATING: 2,
	PAUSED: 3,
	PLAYING: 
		{start: 0}
});


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



// Let's say we have an array of objects and we want to do
// for (obj in objects) obj.some_function(..args)
// This shortens that to objects.eachApply("some_function", ..args)
Array.prototype.eachApply = function(what) {
	var args = Array.prototype.slice.call(arguments);
	args.shift();
	_.each(this, function(element) {
		element[what].apply(element, args);
	});
}

function encodeUnsafeJSON(object) {
	var new_object = {};
	for (var key in object) {
		new_object[key] = object[key];	
		if (object[key] instanceof Function)
			new_object[key] = object[key].toString();
	}
	arguments[0] = new_object
	return JSON.stringify(new_object,null, "\t");
}