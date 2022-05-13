let nodes = [];
for (let i = 0; i < numNodes; i++) {
    let n = new Node(nodePositions[i][0], nodePositions[i][1]);
    nodes.push(n);
}

function setup() {
    createCanvas(size, size);

    // testing
    frameRate(10);
}

function draw() {
    background(250);

    for (let i = 0; i < numNodes; i++) {
        nodes[i].draw(Math.random());
    }
}