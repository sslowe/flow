let nodes = [];
for (let i = 0; i < numNodes; i++) {
    let n = new Node(nodePositions[i][0], nodePositions[i][1]);
    nodes.push(n);
}

let edgelist = new EdgeList(nodes);

// set some test code
edgelist.activateEdge(1,3);
edgelist.activateEdge(1,8);
edgelist.activateEdge(3,5);
edgelist.activateEdge(8,5);
edgelist.activateEdge(3,1)
nodes[1].setSource();
nodes[5].setSink();

function setup() {
    createCanvas(csize, csize);

    // osc setup
    var oscPort = new osc.WebSocketPort({
        url: "ws://localhost:8081", // URL to your Web Socket server.
        metadata: true
    });

    oscPort.open();

    oscPort.on("test", function (msg) {
        console.log("got test message!", msg);
    });

}

function draw() {
    clear();

    edgelist.drawEdges();

    for (let i = 0; i < numNodes; i++) {
        nodes[i].draw();
    }
}