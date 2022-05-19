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
}

let edgelist = new EdgeList(nodes);

var source = sourceDefault;
var sink = sinkDefault;

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

    socket.on("sink_update", (data) => {
        // console.log(data);
        nodes[sink].setRegular();
        nodes[data.new_sink].setSink();
        source = data.new_sink;
    });

    nodes[source].setSource();
    nodes[sink].setSink();

    let nodeSelectBtns = document.querySelectorAll('input[name="nodeselect"]');
    let edgeSelectBtns = document.querySelectorAll('input[name="edgeselect"]');
    let patternSelectBtns = document.querySelectorAll('input[name="pattern"]');
    let flowSetBtns = document.querySelectorAll('input[name="flowstrength"]');

    // block out "my own node"
    select("#playerId").elt.innerHTML = playerId;
    select("#edgeselect"+playerId).elt.checked = false;
    select("#edgeselect"+playerId).elt.disabled = true;

    // set onclicks and default values
    for (let i = 0; i < numNodes; i++) {
        select("#pattern"+String(i+1)).elt.value = patterns[i];
        select("#pitch"+String(i+1)).elt.value = pitches[i];
        select("#flowstrength"+String(i+1)).elt.value = flows[i];
        select("#pattern"+String(i+1)).elt.disabled = true;
        select("#pitch"+String(i+1)).elt.disabled = true;
        select("#flowstrength"+String(i+1)).elt.disabled = true;
        select("#pattern"+String(i+1)).elt.setAttribute('data-bgcolor', patternColorInactive);
        select("#pitch"+String(i+1)).elt.setAttribute('data-bgcolor', pitchColorInactive);
        select("#flowstrength"+String(i+1)).elt.setAttribute('data-bgcolor', flowColorInactive);

        select("#pattern"+String(i+1)).elt.oninput = function () {
            select("#pattern"+String(i+1)+"val").elt.innerHTML = select("#pattern"+String(i+1)).value();
            // send message about pattern change here
            socket.emit("pattern_update", {
                "i": parseInt(playerId)-1,
                "j": i,
                "val": select("#pattern"+String(i+1)).value(),
            });
        }

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
                select("#pattern"+String(i+1)).elt.disabled = false;
                select("#pitch"+String(i+1)).elt.disabled = false;
                select("#flowstrength"+String(i+1)).elt.disabled = false;
                select("#pattern"+String(i+1)).elt.setAttribute('data-bgcolor', patternColorActive);
                select("#pitch"+String(i+1)).elt.setAttribute('data-bgcolor', pitchColorActive);
                select("#flowstrength"+String(i+1)).elt.setAttribute('data-bgcolor', flowColorActive);
                select("#pattern"+String(i+1)).elt.refresh();
                select("#pitch"+String(i+1)).elt.refresh();
                select("#flowstrength"+String(i+1)).elt.refresh();
                socket.emit("edge_enable", {
                    "i": parseInt(playerId)-1,
                    "j": i,
                    "pattern": select("#pattern"+String(i+1)).value(),
                    "pitch": select("#pitch"+String(i+1)).value(),
                    "flow": select("#flowstrength"+String(i+1)).value(),
                });
            } else {
                select("#pattern"+String(i+1)).elt.disabled = true;
                select("#pitch"+String(i+1)).elt.disabled = true;
                select("#flowstrength"+String(i+1)).elt.disabled = true;
                select("#pattern"+String(i+1)).elt.value = patterns[i];
                select("#pitch"+String(i+1)).elt.value = pitches[i];
                select("#flowstrength"+String(i+1)).elt.value = flows[i];
                select("#pattern"+String(i+1)).elt.setAttribute('data-bgcolor', patternColorInactive);
                select("#pitch"+String(i+1)).elt.setAttribute('data-bgcolor', pitchColorInactive);
                select("#flowstrength"+String(i+1)).elt.setAttribute('data-bgcolor', flowColorInactive);
                select("#pattern"+String(i+1)).elt.refresh();
                select("#pitch"+String(i+1)).elt.refresh();
                select("#flowstrength"+String(i+1)).elt.refresh();
                socket.emit("edge_disable", {
                    "i": parseInt(playerId)-1,
                    "j": i,
                });
            }
        }
    }
}

function draw() {
    clear();

    edgelist.drawEdges();

    for (let i = 0; i < numNodes; i++) {
        nodes[i].draw();
    }
}