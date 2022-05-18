const osc = require("osc")
const http = require("http");
const socketio = require("socket.io")
const connect = require('connect')
const serveStatic = require('serve-static')
connect().use(serveStatic(__dirname)).listen(8080, () => console.log('Server running on 8080...'))

const STATIONS = 10 // NOTE from Egor: I drew ten stations but can easily change
const NODES = 6

const SIZE = STATIONS // or STATIONS * NODES

// Note from Egor
// I now think we were not working on the same thing. your graph has six times the edges compared to mine
// and exponentially more edges
let edges = new Array(SIZE)
let flow = new Array(SIZE)
  
for (let i = 0; i < edges.length; i++) {
    edges[i] = new Array(SIZE)
    flow[i] = new Array(SIZE)
    for (let j = 0; j < edges.length; j++) {
        edges[i][j] = 0
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
    "localhost",
    "localhost",
    "localhost",
    "localhost",
    "localhost",
    "localhost",
    "localhost",
    "localhost",
    "localhost",
    "localhost"
];

const viz_machine = "localhost"; // machine that only has the visualization

// TODO: Egor - Receive edge capacity updates over web from Processing interface for machines, Source + Sink updates from conductor

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

for (let i = 0; i < client_websockets.length; i++) {
    client_websockets[i].on("connection", (socket) => {
        console.log("got connection with id ", i);
        socket.on("edge_enable", function(data) {
            // console.log(data);
            let edge_i = data.i;
            let edge_j = data.j;
            let new_pattern = data.pattern;
            let new_pitch = data.pitch;
            let new_flow = data.flow;
            // now do what you want
            // e.g.
            edges[edge_i][edge_j] = 0.5;

            for (let j = 0; j < client_websockets.length; j++) {
                client_websockets[j].emit("edge_enable", {"i": edge_i, "j": edge_j});
            }
            viz_socket.emit("edge_enable", {"i": edge_i, "j": edge_j});
        });

        socket.on("edge_disable", function(data) {
            // console.log(data);
            let edge_i = data.i;
            let edge_j = data.j;
            // now do what you want
            edges[edge_i][edge_j] = 0.0;

            for (let j = 0; j < client_websockets.length; j++) {
                client_websockets[j].emit("edge_disable", {"i": edge_i, "j": edge_j});
            }
            viz_socket.emit("edge_disable", {"i": edge_i, "j": edge_j});
        });

        socket.on("flow_update", function(data) {
            // console.log(data);
            let edge_i = data.i;
            let edge_j = data.j;
            let new_flow = data.val;
            // now do what you want
            // edges[edge_i][edge_j] = new_flow;
        });

        socket.on("pitch_update", function(data) {
            // console.log(data);
            let edge_i = data.i;
            let edge_j = data.j;
            let new_pitch = data.val;
        });

        socket.on("pattern_update", function(data) {
            // console.log(data);
            let edge_i = data.i;
            let edge_j = data.j;
            let new_pattern = data.val;

        });
    });
}

// Equivalent ChucK/OSC for edge capacity updates
/*
    OscIn oinEdge;
    OscMsg oscMsg;
    port => oinEdge.port;
    oinEdge.addAddress( "/edge, i i i i i" );

    while(true)
    {
        oinEdge => now;

        while(oinEdge.recv(oscMsg) )
        { 
            oscMsg.getInt(0) => int sourceMachine;
            oscMsg.getInt(1) => int sourceNode;
            oscMsg.getInt(2) => int destMachine;
            oscMsg.getInt(3) => int destNode;
            oscMsg.getInt(4) => int cap;
            cap => edges[((sourceMachine - 1) * nodeCount) + sourceNode][((destMachine - 1) * nodeCount) + destNode];
        }
    }
*/

// Equivalent ChucK/OSC for source updates (hadn't implemented sink yet since no Ford Fulkerson yet)
/*
    int sourceNode;
    -- KB input for machine + node -- 
    <<<"Setting source to (" + machine + ", " + node + ")">>>;
    ((machine-1) * nodeCount) + node => sourceNode;
*/

// TODO: Sam - run Ford Fulkerson on update, then pass edges over OSC to ChucK like so:

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
                    value: flow[i][j]
                }
            ]
        });
    }
}

