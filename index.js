const osc = require("osc")
const http = require("http");
const socketio = require("socket.io")
const connect = require('connect')
const serveStatic = require('serve-static')
connect().use(serveStatic(__dirname)).listen(8080, () => console.log('Server running on 8080...'))

const STATIONS = 10 
const NODES = 6

const SIZE = STATIONS

let edges = new Array(SIZE)
let flow = new Array(SIZE)
let sourceNode = 1 // hemi 2 to align with default viewer
  
for (let i = 0; i < edges.length; i++) {
    edges[i] = new Array(SIZE)
    flow[i] = new Array(SIZE)
    for (let j = 0; j < edges.length; j++) {
        edges[i][j] = -1
        flow[i][j] = 0
    }
}

var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 6450,
    remoteAddress: "localhost",//"Sams-Macbook-Pro.local",
    remotePort: 9999
});

udpPort.open();

const client_machines = [
    //"meatloaf.local",
    "chowder.local",
    "Peanutbutter.local",
    "donut.local",
    "icetea.local",
    "jambalaya.local",
    "lasagna.local",
    "quinoa.local",
    "spam.local",
    "vindaloo.local"
];

const viz_machine = "localhost"; // machine that only has the visualization

// open a websocket for each client
let client_websockets = [];
const base_port = 4400;

for (let i = 0; i < client_machines.length; i++) {
    let server = http.createServer();
    server.listen(base_port + i);
    let socket = socketio(server);
    client_websockets.push(socket)
}

let viz_server = http.createServer();
viz_server.listen(4399);
let viz_socket = socketio(viz_server);

viz_socket.on("connection", (socket) => {
    console.log("got master connection");
    socket.on("source_update", function(data) {
        // console.log(data);
        let new_source = data.new_source;
        let previous_source = data.previous_source;
        sourceNode = new_source - 1
        for (let i = 0; i < client_websockets.length; i++) {
            client_websockets[i].emit("source_update", {"new_source": new_source});
        }
    });

    socket.on("sink_update", function(data) {
        // console.log(data);
        let new_sink = data.new_sink;
        let previous_sink = data.previous_sink;
        // change internal/chuck state here
        // ...
        for (let i = 0; i < client_websockets.length; i++) {
            client_websockets[i].emit("sink_update", {"new_sink": new_sink});
        }
    });
})

for (let i = 0; i < client_websockets.length; i++) {
    client_websockets[i].on("connection", (socket) => {
        console.log("got connection with id ", i);
        socket.on("edge_enable", function(data) {
            // console.log(data);
            let edge_i = data.i;
            let edge_j = data.j;
            let new_pitch = data.pitch;
            let new_flow = data.flow;
            // now do what you want
            // e.g.
            let cap = Math.floor(new_flow * (9)) + 1
            console.log("creating edge from " + edge_j + " to " + edge_i + " with capacity " + cap + " playing node " + (new_pitch - 1))
            edges[edge_j][edge_i] = new_pitch - 1
            flow[edge_j][edge_i] = cap
            for (let j = 0; j < client_websockets.length; j++) {
                client_websockets[j].emit("edge_enable", {"i": edge_j, "j": edge_i});
            }
            viz_socket.emit("edge_enable", {"i": edge_j, "j": edge_i});
        });

        socket.on("edge_disable", function(data) {
            // console.log(data);
            let edge_i = data.i;
            let edge_j = data.j;
            // now do what you want
            edges[edge_j][edge_i] = -1
            flow[edge_j][edge_i] = 0
            for (let j = 0; j < client_websockets.length; j++) {
                client_websockets[j].emit("edge_disable", {"i": edge_j, "j": edge_i});
            }
            viz_socket.emit("edge_disable", {"i": edge_j, "j": edge_i});
        });

        socket.on("flow_update", function(data) {
            // console.log(data);
            let edge_i = data.i;
            let edge_j = data.j;
            let new_flow = data.val;
            // now do what you want
            flow[edge_j][edge_i] = Math.floor(new_flow * (9)) + 1
        });

        socket.on("pitch_update", function(data) {
            // console.log(data);
            let edge_i = data.i;
            let edge_j = data.j;
            let new_pitch = data.val;
            edges[edge_j][edge_i] = new_pitch - 1
        });

        socket.on("pattern_update", function(data) {
            // console.log(data);
            let edge_i = data.i;
            let edge_j = data.j;
            let new_pattern = data.val;
            // nada
        });
    });
}

udpPort.on("audiolevel", function (oscMsg, timeTag, info) {
    console.log("An OSC message just arrived!", oscMsg);
    console.log("Remote info is: ", info);
});


setInterval(updateChuck, 500)

function updateChuck() {

    udpPort.send({
        address: "/flowSource",
        args: [
            {
                type: "i",
                value: sourceNode
            }
        ]
    });

    for (let i = 0; i < edges.length; i++) {
        for (let j = 0; j < edges.length; j++) {
            udpPort.send({
                address: "/flowEdge",
                args: [
                    {
                        type: "i",
                        value: i
                    },
                    {
                        type: "i",
                        value: j
                    },
                    {
                        type: "i",
                        value: edges[i][j]
                    },
                    {
                        type: "i",
                        value: flow[i][j]
                    }
                ]
            });
        }
    }
}


