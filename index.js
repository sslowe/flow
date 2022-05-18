const osc = require("osc")
const http = require("http");
const socketio = require("socket.io")
const connect = require('connect')
const serveStatic = require('serve-static')
connect().use(serveStatic(__dirname)).listen(8080, () => console.log('Server running on 8080...'))

const STATIONS = 10 
const NODES = 6

const SIZE = STATIONS * NODES

let edges = new Array(SIZE)
let flow = new Array(SIZE)
let sourceNode = NODES // First node of hemi 2 to align with default viewer
  
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
        sourceNode = new_source * NODES + mapToNode(Math.random())
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
            let new_pattern = data.pattern;
            let new_pitch = data.pitch;
            let new_flow = data.flow;
            // now do what you want
            // e.g.
            edges[(edge_i * NODES) + mapToNode(new_pattern)][(edge_j * NODES) + mapToNode(new_pitch)] =  Math.floor(new_flow * (9))

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
            for (let i = 0; i < NODES; i++)
            {
                for (let j = 0; j < NODES; j ++)
                {
                    edges[(edge_i * NODES) + i][(edge_j * NODES) + j] = 0
                }
            }
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
            for (let i = 0; i < NODES; i++)
            {
                for (let j = 0; j < NODES; j ++)
                {
                    if( edges[(edge_i * NODES) + i][(edge_j * NODES) + j] != 0 )
                    {
                        edges[(edge_i * NODES) + i][(edge_j * NODES) + j] = Math.floor(new_flow * (9))
                        return
                    }
                }
            }
        });

        socket.on("pitch_update", function(data) {
            // console.log(data);
            let edge_i = data.i;
            let edge_j = data.j;
            let new_pitch = data.val;
            let flowTemp = 0;

            for (let i = 0; i < NODES; i++)
            {
                for (let j = 0; j < NODES; j ++)
                {
                    if( edges[(edge_i * NODES) + i][(edge_j * NODES) + j] != 0 )
                    {
                        flowTemp = edges[(edge_i * NODES) + i][(edge_j * NODES) + j]
                        edges[(edge_i * NODES) + i][(edge_j * NODES) + j] = 0
                        edges[(edge_i * NODES) + i][(edge_j * NODES) + mapToNode(new_pitch)] = flowTemp
                        return
                    }
                }
            }
        });

        socket.on("pattern_update", function(data) {
            // console.log(data);
            let edge_i = data.i;
            let edge_j = data.j;
            let new_pattern = data.val;
            for (let i = 0; i < NODES; i++)
            {
                for (let j = 0; j < NODES; j ++)
                {
                    if( edges[(edge_i * NODES) + i][(edge_j * NODES) + j] != 0 )
                    {
                        flowTemp = edges[(edge_i * NODES) + i][(edge_j * NODES) + j]
                        edges[(edge_i * NODES) + i][(edge_j * NODES) + j] = 0
                        edges[(edge_i * NODES) + mapToNode(new_pattern)][(edge_j * NODES) + j] = flowTemp
                        return
                    }
                }
            }
        });
    });
}

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
                        value: flow[i][j]
                    }
                ]
            });
        }
    }
} 

function mapToNode(input)
{
    Math.floor(input * (NODES + 1))
}


