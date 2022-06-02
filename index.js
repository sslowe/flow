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
let bufMods = new Array(SIZE);
let sourceNode = 1 // hemi 2 to align with default viewer
let sourceSamp = 3 // node 4 to align with default viewer
  
for (let i = 0; i < edges.length; i++) {
    edges[i] = new Array(SIZE)
    flow[i] = new Array(SIZE)
    bufMods[i] = new Array(2)
    bufMods[i][0] = 0; bufMods[i][1] = 0; 
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

var udpPlayInfo = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 6451,
    remoteAddress: "localhost",//"Sams-Macbook-Pro.local",
    remotePort: 9998
});

udpPlayInfo.open();

const client_machines = [
    "meatloaf.local",
    "chowder.local",
    "Peanutbutter.local",
    "donut.local",
    "icetea.local",
    "jambalaya.local",
    "lasagna.local",
    "quinoa.local",
    "spam.local",
    "vindaloo.local",
    "udon.local"
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

    socket.on("pitch_update", function(data) {
        console.log(data);
        let new_pitch = data.new_pitch;
        let previous_pitch = data.previous_pitch;
        sourceSamp = new_pitch

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

        socket.on("highs_update", function(data) {
            // console.log(data);
            let machine = data.id;
            let new_highs = data.val;
            bufMods[machine][1] = new_highs
            // use it here
            // ....

        });

        socket.on("lows_update", function(data) {
            // console.log(data);
            let machine = data.id;
            let new_lows = data.val;
            bufMods[machine][0] = new_lows
            // use it here
            // ....

        });
    });
}

udpPlayInfo.on("message", function (msg, timeTag, info) {
    if (msg.address === "/audiolevel") {

        var level_scaling = 30.0

        var machine = msg.args[0]-1;
        var level = msg.args[1] * level_scaling;

        viz_socket.emit("audiolevel", {"id": machine, "level": level});
    }
});


setInterval(updateChuck, 500);

function updateChuck() {
    //oinEdge.addAddress( "/bufMod, i f f" );
    for (let i = 0; i < STATIONS; i++) {
        udpPort.send({
            address: "/bufMod",
            args: [
                {
                    type: "i",
                    value: i
                },
                {
                    type: "f",
                    value: bufMods[i][0]
                },
                {
                    type: "f",
                    value: bufMods[i][1]
                }
            ]
        });
    }

    udpPort.send({
        address: "/flowSource",
        args: [
            {
                type: "i",
                value: sourceNode
            },
            {
                type: "i",
                value: sourceSamp
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

setInterval(forceCommonState, 2000);

function forceCommonState() {
    // for (let j = 0; j < client_websockets.length; j++) {
    //     client_websockets[j].emit("force_state", {"edges": edges});
    // }
    viz_socket.emit("force_state", {"edges": edges, "source": sourceNode, "pitch": sourceSamp});
}
