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

const destination_address = "http://localhost:4399"

var source = sourceDefault;
var pitch = 0;

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

    nodes[sourceDefault].setSource();

    select("#sourceselect"+String(sourceDefault+1)).elt.checked = true;
    select("#pitchselect"+String(sinkDefault+1)).elt.checked = true;

    for (let i = 0; i < numNodes; i++) {
        select("#sourceselect" + String(i + 1)).elt.onclick = function () {
            nodes[source].setRegular();
            nodes[i].setSource();

            socket.emit("source_update", {"previous_source": source, "new_source": i});

            source = i;
        }
    }
    for (let i = 0; i < 6; i++) {
        select("#pitchselect"+String(i+1)).elt.onclick = function() {
            socket.emit("pitch_update", {"previous_pitch": pitch, "new_pitch": i});
            pitch = i;
        }
    }
}

function draw() {
    clear();

    edgelist.drawEdges();

    for (let i = 0; i < numNodes; i++) {
        // nodes[i].setVolume(Math.random());
        nodes[i].draw();
    }
}