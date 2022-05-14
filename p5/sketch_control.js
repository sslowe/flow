//

// read off our own id
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let playerId = urlParams.get('player');

// overwrite for testing purposes
playerId = "3";

let nodes = [];
for (let i = 0; i < numNodes; i++) {
    let n = new Node(nodePositions[i][0], nodePositions[i][1]);
    nodes.push(n);
}

let edgelist = new EdgeList(nodes);

// default control parameters
hemichans = [1,1,1,1,1,1,1,1,1,1];
flows = [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5];

// set some test code
// edgelist.activateEdge(1,3);
// edgelist.activateEdge(1,8);
// edgelist.activateEdge(3,5);
// edgelist.activateEdge(8,5);
// edgelist.activateEdge(3,1);
nodes[1].setSource();
nodes[5].setSink();

function setup() {
    createCanvas(csize, csize);

    let nodeSelectBtns = document.querySelectorAll('input[name="nodeselect"]');
    let edgeSelectBtns = document.querySelectorAll('input[name="edgeselect"]');
    let hemichanSelectBtns = document.querySelectorAll('input[name="hemichan"]');
    let flowSetBtns = document.querySelectorAll('input[name="flowstrength"]');


    // block out "my own node"
    select("#playerId").elt.innerHTML = playerId;
    select("#edgeselect"+playerId).elt.checked = false;
    select("#edgeselect"+playerId).elt.disabled = true;

    // set onclicks and default values
    for (let i = 0; i < numNodes; i++) {
        select("#hemichan"+String(i+1)).elt.value = hemichans[i];
        select("#flowstrength"+String(i+1)).elt.value = flows[i];
        select("#hemichan"+String(i+1)).elt.disabled = true;
        select("#flowstrength"+String(i+1)).elt.disabled = true;
        select("#hemichan"+String(i+1)).elt.setAttribute('data-bgcolor', "#ffdefc");
        select("#flowstrength"+String(i+1)).elt.setAttribute('data-bgcolor', "#ffdefc");


        select("#hemichan"+String(i+1)).elt.oninput = function () {
            select("#hemichan"+String(i+1)+"val").elt.innerHTML = select("#hemichan"+String(i+1)).value();
            // send message about channel change here
            // ...

        }
        select("#flowstrength"+String(i+1)).elt.oninput = function () {
            select("#flowstrength"+String(i+1)+"val").elt.innerHTML = Number(select("#flowstrength"+String(i+1)).value()).toFixed(2);
            // send message about flow change here
            // ...

        }
        select("#edgeselect"+String(i+1)).elt.onclick = function() {
            edgelist.switchEdge(playerId-1, i);

            if (edgelist.isActive(playerId-1, i)) {
                console.log('enabling');
                select("#hemichan"+String(i+1)).elt.disabled = false;
                select("#flowstrength"+String(i+1)).elt.disabled = false;
                select("#hemichan"+String(i+1)).elt.setAttribute('data-bgcolor', "#ba24ff");
                select("#flowstrength"+String(i+1)).elt.setAttribute('data-bgcolor', "#ba24ff");
                select("#hemichan"+String(i+1)).elt.refresh();
                select("#flowstrength"+String(i+1)).elt.refresh();
            } else {
                console.log('disabling');
                select("#hemichan"+String(i+1)).elt.disabled = true;
                select("#flowstrength"+String(i+1)).elt.disabled = true;
                select("#hemichan"+String(i+1)).elt.setAttribute('data-bgcolor', "#ffdefc");
                select("#flowstrength"+String(i+1)).elt.setAttribute('data-bgcolor', "#ffdefc");
                select("#hemichan"+String(i+1)).elt.refresh();
                select("#flowstrength"+String(i+1)).elt.refresh();
            }

            // send message about new edge connection here
            // ...
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