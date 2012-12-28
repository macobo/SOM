// This is where the magic happens. :)

function onFrame() {

}

a = new Neuron();
a.addSegment(new Point(100, 100));
a.addSegment(new Point(50, 150));
a.addSegment(new Point(100, 200));
a.addSegment(new Point(150, 150));
a.addSegment(new Point(300, 150));
a.showPath(0, 2);
a.showPath(1, 4);
a.setIndicator(3, 0.5);