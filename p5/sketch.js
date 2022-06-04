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

var timeSinceLastUpdate = [0,0,0,0,0,0,0,0,0,0];

function setup() {
    createCanvas(csize, csize-520);

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

    socket.on("audiolevel", (data) => {
        //console.log(data, timeSinceLastUpdate);
        if (data.level > 0.01) {
            if (timeSinceLastUpdate[data.id] > 3) {
                nodes[data.id].setVolume(data.level*10);
                nodes[data.id].lifetime = 0;
                timeSinceLastUpdate[data.id] = 0;

            }
        }
    });

    socket.on("force_state", (data) => {
        for (let i=0; i<10; i++) {
            for (let j=0; j<10; j++) {
                edge_value = data.edges[j][i];
                if (edge_value === -1) {
                    edgelist.deactivateEdge(j, i);
                } else {
                    edgelist.activateEdge(j,i);
                }
            }
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

            // button latch bugfix?
            select("#canvas").elt.focus();
        }
    }
    for (let i = 0; i < 6; i++) {
        select("#pitchselect"+String(i+1)).elt.onclick = function() {
            socket.emit("pitch_update", {"previous_pitch": pitch, "new_pitch": i});
            pitch = i;
            select("#canvas").elt.focus();
        }
    }
    frameRate(15);
}

function draw() {
    clear();

    edgelist.drawEdges();

    for (let i = 0; i < numNodes; i++) {
        // nodes[i].setVolume(Math.random());
        nodes[i].draw();
        nodes[i].drawVol();
        nodes[i].lifetime += 1;
        timeSinceLastUpdate[i] += 1;
    }

    //console.log(0, nodes[0].vol);
}