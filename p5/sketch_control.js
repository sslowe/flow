//


// overwrite for testing purposes
var playerId = "3";

// read off our own id
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
var playerId = urlParams.get('player');


const node_machine = "Sams-MacBook-Pro.local:"
const port = 4399 + parseInt(playerId);
const destination_address = node_machine+ port.toString();

let nodes = [];
for (let i = 0; i < numNodes; i++) {
    let n = new Node(nodePositions[i][0], nodePositions[i][1]);
    nodes.push(n);
    nodes[i].show_number = true;
    nodes[i].id = String(i+1);
}

let edgelist = new EdgeList(nodes);

var source = sourceDefault;

function setup() {
    createCanvas(csize, csize);

    socket = io(destination_address, { transports : ['websocket'] });

    socket.on("edge_enable", (data) => {
        // console.log(data);
        if (!edgelist.isActive(data.i, data.j)) {
            edgelist.activateEdge(data.i, data.j);
        }
    });
    socket.on("edge_disable", (data) => {
        // console.log(data);
        if (edgelist.isActive(data.i, data.j)) {
            edgelist.deactivateEdge(data.i, data.j);
        }
    });

    socket.on("source_update", (data) => {
        // console.log(data);
        nodes[source].setRegular();
        nodes[data.new_source].setSource();
        source = data.new_source;
    });

    socket.on("force_state", (data) => {
        console.log(data);
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

    nodes[source].setSource();
    nodes[playerId-1].setOwn();

    let nodeSelectBtns = document.querySelectorAll('input[name="nodeselect"]');
    let edgeSelectBtns = document.querySelectorAll('input[name="edgeselect"]');
    let flowSetBtns = document.querySelectorAll('input[name="flowstrength"]');

    // block out "my own node"
    select("#playerId").elt.innerHTML = playerId;
    select("#edgeselect"+playerId).elt.checked = false;
    select("#edgeselect"+playerId).elt.disabled = true;

    // set onclicks and default values
    for (let i = 0; i < numNodes; i++) {
        select("#pitch"+String(i+1)).elt.value = pitches[i];
        select("#flowstrength"+String(i+1)).elt.value = flows[i];
        select("#pitch"+String(i+1)).elt.disabled = true;
        select("#flowstrength"+String(i+1)).elt.disabled = true;
        select("#pitch"+String(i+1)).elt.setAttribute('data-bgcolor', pitchColorInactive);
        select("#flowstrength"+String(i+1)).elt.setAttribute('data-bgcolor', flowColorInactive);

        select("#pitch"+String(i+1)).elt.oninput = function () {
            select("#pitch"+String(i+1)+"val").elt.innerHTML = select("#pitch"+String(i+1)).value();
            // send message about pitch change here
            socket.emit("pitch_update", {
                "i": parseInt(playerId)-1,
                "j": i,
                "val": select("#pitch"+String(i+1)).value(),
            });
        }
        select("#flowstrength"+String(i+1)).elt.oninput = function () {
            select("#flowstrength"+String(i+1)+"val").elt.innerHTML = Number(select("#flowstrength"+String(i+1)).value()).toFixed(2);
            // send message about flow change here

            socket.emit("flow_update", {
                "i": parseInt(playerId)-1,
                "j": i,
                "val": select("#flowstrength"+String(i+1)).value(),
            });

        }

        select("#edgeselect"+String(i+1)).elt.onclick = function() {
            edgelist.switchEdge(playerId-1, i);

            if (edgelist.isActive(playerId-1, i)) {
                select("#pitch"+String(i+1)).elt.disabled = false;
                select("#flowstrength"+String(i+1)).elt.disabled = false;
                select("#pitch"+String(i+1)).elt.setAttribute('data-bgcolor', pitchColorActive);
                select("#flowstrength"+String(i+1)).elt.setAttribute('data-bgcolor', flowColorActive);
                select("#pitch"+String(i+1)).elt.refresh();
                select("#flowstrength"+String(i+1)).elt.refresh();
                socket.emit("edge_enable", {
                    "i": parseInt(playerId)-1,
                    "j": i,
                    "pitch": select("#pitch"+String(i+1)).value(),
                    "flow": select("#flowstrength"+String(i+1)).value(),
                });
            } else {
                select("#pitch"+String(i+1)).elt.disabled = true;
                select("#flowstrength"+String(i+1)).elt.disabled = true;
                select("#pitch"+String(i+1)).elt.value = pitches[i];
                select("#flowstrength"+String(i+1)).elt.value = flows[i];
                select("#pitch"+String(i+1)).elt.setAttribute('data-bgcolor', pitchColorInactive);
                select("#flowstrength"+String(i+1)).elt.setAttribute('data-bgcolor', flowColorInactive);
                select("#pitch"+String(i+1)).elt.refresh();
                select("#flowstrength"+String(i+1)).elt.refresh();
                socket.emit("edge_disable", {
                    "i": parseInt(playerId)-1,
                    "j": i,
                });
            }

            // button latch bugfix?
            select("#canvas").elt.focus();
        }

        select("#highs").elt.value = 0.0;
        select("#lows").elt.value = 0.0;

        select("#highs").elt.oninput = function () {
            console.log(select("#highs").value())
            select("#highsval").elt.innerHTML = Number(select("#highs").value()).toFixed(2);

            socket.emit("highs_update", {
                "id": parseInt(playerId)-1,
                "val": select("#highs").value(),
            });
        }

        select("#lows").elt.oninput = function () {
            console.log(select("#lows").value())
            select("#lowsval").elt.innerHTML = Number(select("#lows").value()).toFixed(2);

            socket.emit("lows_update", {
                "id": parseInt(playerId)-1,
                "val": select("#lows").value(),
            });
        }
    }

    textAlign(CENTER,CENTER);
    textFont(font);
    textSize(textsize);
}

function draw() {
    clear();

    edgelist.drawEdges();

    for (let i = 0; i < numNodes; i++) {
        nodes[i].draw();
    }
}