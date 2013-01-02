/* Utilities */

function AssertException(message) {
    this.message = message;
}
AssertException.prototype.toString = function () {
    return 'AssertException: ' + this.message;
}

function assert(exp, message) {
    if (!exp) throw new AssertException(message);
}

function randrange(low, high) {
    return Math.floor(low + Math.random() * (high - low));
}

function exp(x) {
    return Math.exp(x);
}

function coords(x) {
    return [Math.floor(x / width), x % width];
}

function normalizationValue(vector, column) {
    largest = 0;
    for (var i = 0; i < vector.length; i++) {
        largest = vector[i]["data"][column] > largest ? vector[i]["data"][column] : largest;
    }
    return largest;
}

function distance(a, b) {
    assert(a.length == b.length, "a and b must share the same length. [" + a + "], [" + b + "]");
    var distance = 0;
    for (var i = 0; i < a.length; i++)
    distance += (a[i] - b[i]) * (a[i] - b[i]);
    return Math.sqrt(distance);
}

function findBMU(inputVector, nodes) {
    // returns index of BMU
    var BMUIndex = 0;
    var smallestDistance = distance(inputVector, nodes[0]);
    for (var i = 1; i < node.length; i++) {
        var dst = distance(inputVector, nodes[i]);
        if (dst < smallestDistance) {
            BMUIndex = i;
            smallestDistance = dst;
        }
    }
    return BMUIndex;
}

function start($, file, multidim, size, _sqSize, _totalIterations) {
    /* Algorithm */

    function makeRandomArray(length, dimensions) {
        // Makes an array of 'length' with each element being an array of 'dimensions' 
        // elements between 0 and 1
        var out = [];
        for (var i = 0; i < length; i++) {
            var arr = []
            for (var j = 0; j < dimensions; j++)
            arr.push(Math.random());
            out.push(arr);
        }
        return out;
    }

    function neighborhoodRadius(iteration) {
		//return mapRadius * iteration / totalIterations;
        return mapRadius * exp(-1.0 * iteration / timeConstant);
        //return mapRadius * iteration / totalIterations;
    }

    function learningRate(iteration) {
        return constLearningRate * exp(-1.0 * iteration / timeConstant);
        return constLearningRate * iteration / totalIterations;
    }

    function influence(distance, radius) {
        return exp(-1.0 * distance * distance / (2 * radius * radius));
    }

    //var dimensions; // how many dimensions the data has
    //var noOfNodes, node; // node is an array of noOfNodes elements, each node is an array of 'dimensions' elements
    // 'magic' constants
    //var width;
    //var mapRadius; // radius of the map; sigma
    //var totalIterations;
    //var timeConstant; // tied to number of iterations; lambda
    // constLearningRate; // start learning rate; L0
    similarityTable = {};

    function setConstants(inputVector) {
        dimensions = inputVector[0]["data"].length;
        width = multidim ? Math.ceil(Math.sqrt(size)) : size;
        mapRadius = width / 2;
        noOfNodes = size;

        node = makeRandomArray(noOfNodes, dimensions);
        totalIterations = _totalIterations;
        timeConstant = totalIterations / Math.log(mapRadius);
        constLearningRate = 1;
    }




    function adjustAllWeights(iteration, BMU, inputVector) {
        for (var indx = 0; indx < node.length; indx++) {
            assert(node[indx].length == inputVector.length, "adjust: node length must be same as input length");
            var L = learningRate(iteration);
            var R = neighborhoodRadius(iteration);
            var dist = distance(coords(BMU), coords(indx));

            if (dist > R) continue; // node is not in neighborhood

            var theta = influence(dist, R); // degree of neighborhood
            for (var i = 0; i < inputVector.length; i++)
                node[indx][i] += L * theta * (inputVector[i] - node[indx][i]);
        }
    }

    function algorithm(inputVectors, nodes) {
        for (var it = 0; it < totalIterations; it++) {
            var iv = inputVectors[randrange(0, inputVectors.length)];
            //var iv = inputVectors[it];
            var BMU = findBMU(iv, nodes);
            //console.log(iv, BMU);
            adjustAllWeights(it, BMU, iv); // adjust all weights
        }
    }


    /* Data manipulation & Visualisation */

    function normalize(vector) {
        // Divides each for each k vector[i]["data"][k] with max(vector[j]["data"][k] for j=0..n)
        result = []
        for (var i = 0; i < vector.length; i++) {
            result.push([]);
            for (var j = 0; j < dimensions; j++)
            result[i].push(0);
        }
        for (var k = 0; k < dimensions; k++) {
            var largest = normalizationValue(vector, k);
            for (var i = 0; i < vector.length; i++)
            result[i][k] = vector[i]["data"][k] / largest;
        }
        return result;
    }
    //var labels;
    //var inputData;
    sqSize = _sqSize; // size in pixels

    $.getJSON(file, function (data) {

        labels = data["labels"];
        inputData = data["data"];
        /*inputData = []
		fakeData = [ [0, 0, 0], [0, 0, 255], [0, 255, 0], [0, 255, 255], [255, 0, 0], [255, 0, 255], [255, 255, 0], [255, 255, 255]];
		for (var i = 0; i < fakeData.length; i++)
			inputData.push({"data": fakeData[i]});
		*/
        console.log("Starting algorithm. Please wait");
        setConstants(inputData);
        normData = normalize(inputData);
        //console.log(normData);
        draw("#a", node.slice(0), inputData, normData);
        algorithm(normData, node);
        draw("#som", node.slice(0), inputData, normData);
    });
}

function drawWeights(selector, node) {
    function rgbval(k) {
        return "rgb(" + Math.floor(k[0] * 256) + "," + Math.floor(k[1] * 256) + "," + Math.floor(k[2] * 256) + ")";
    }
    var canvas = $(selector)[0];
    var ctx = canvas.getContext("2d");

    for (var i = 0; i < node.length; i++) {
        yx = coords(i);
        //console.log(i);
        //console.log(xy);
        //console.log(rgbval(node[i]));
        ctx.fillStyle = rgbval(node[i]);
        ctx.fillRect(yx[1] * sqSize, yx[0] * sqSize, sqSize, sqSize);
    }
}

function denormalize(row) {
    out = []
    for (var k = 0; k < row.length; k++)
    out.push(Math.round(row[k] * normalizationValue(inputData, k), 2));
    return out
}


function findSimilarData(inData, node, nodes) {
    if (!(node in similarityTable)) {
        var out = [];
        for (var i = 0; i < inData.length; i++) {
            var target = findBMU(inData[i], nodes);
            if (node == target) out.push(i);
        }
        similarityTable[node] = out;
    }
    return similarityTable[node];
}

function draw(selector, node, inData, normInData) {
    $(selector).attr({
        "width": sqSize * width,
        "height": sqSize * Math.ceil(noOfNodes / width)
    });
    drawWeights(selector, node);
    var last = [-1, - 1];
    $(selector).mousemove(function (e) {
        var x = Math.floor(e.offsetX / sqSize);
        var y = Math.floor(e.offsetY / sqSize);
        if (x != last[0] || y != last[1]) {
            last = [x, y];
            updateInfo(x, y);
        }
    });

    function updateInfo(x, y) {
        function nodeInfo(i) {
            if (i > node.length) return;
            var base = $("<div>");
            base.append(markup("Node (" + x + ", " + y + ")", labels, denormalize(node[i])).addClass("infobox").addClass("blockingDiv"));
            var baseText = $("<h3>").text("Countries that mark this node as BMU").css({
                "text-align": "center"
            });
            base.append($("<div>").append(baseText).addClass("infobox").addClass("blockingDiv"));
            var similar = findSimilarData(normInData, i, node);
            for (var i = 0; i < similar.length; i++) {
                var j = similar[i];
                base.append(markup(inData[j]["name"], labels, inData[j]["data"]).addClass("infobox"));
            }
            return base;
        };
        $("#info").html(nodeInfo(y * width + x));
    }
}

function markup(title, keys, values) {
    var div = $("<div />");
    div.append($("<h4>").text(title));
    for (var i = 0; i < values.length; i++) {
        div.append($('<ul>').html("<b>" + keys[i] + ":</b>" + values[i]));
    }
    return div;
}
