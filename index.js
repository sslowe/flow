var osc = require("osc")

const STATIONS = 8
const NODES = 6

let edges = new Array(STATIONS * NODES)
let flow = new Array(STATIONS * NODES)
  
for (let i = 0; i < edges.length; i++) {
    edges[i] = new Array(STATIONS * NODES)
    flow[i] = new Array(STATIONS * NODES)
    for (let j = 0; j < edges.length; j++) {
        edges[i][j] = 0
        flow[i][j] = 0
    }
}

var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 6450,
    remoteAddress: "Sams-Macbook-Pro.local",
    remotePort: 9999
});

udpPort.open();

// TODO: Egor - Receive edge capacity updates over web from Processing interface for machines, Source + Sink updates from conductor

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

