let nodes = [];
for (let i = 0; i < numNodes; i++) {
    let n = new Node(nodePositions[i][0], nodePositions[i][1]);
    nodes.push(n);
}

let edgelist = new EdgeList(nodes);

// set some test code
// edgelist.activateEdge(1,3);
// edgelist.activateEdge(1,8);
// edgelist.activateEdge(3,5);
// edgelist.activateEdge(8,5);
// edgelist.activateEdge(3,1)
nodes[1].setSource();
nodes[5].setSink();

const destination_address = "http://localhost:4399"

function setup() {
    createCanvas(csize, csize);

    socket = io(destination_address, { transports : ['websocket'] });

    socket.on("edge_enable", (data) => {
        console.log(data);
        if (!edgelist.isActive(data.i, data.j)) {
            edgelist.activateEdge(data.i, data.j);
        }
    });
    socket.on("edge_disable", (data) => {
        console.log(data);
        if (edgelist.isActive(data.i, data.j)) {
            edgelist.deactivateEdge(data.i, data.j);
        }
    });
}

function draw() {
    clear();

    edgelist.drawEdges();

    for (let i = 0; i < numNodes; i++) {
        nodes[i].draw();
    }
}