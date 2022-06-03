// PARTIAL NODE/WEB INTEGRATION

//-------------------------------------
//-------------------------------------
// Magic
10 => int stations;

//-------------------------------------
//-------------------------------------
// Tempo
120 => float BPM;
(60 / BPM)::second => dur SPB;
SPB / 4 => dur s;

//-------------------------------------
//-------------------------------------
// Output Meter

Gain meter_input => Gain g => OnePole p => blackhole;
1.0 => meter_input.gain;
meter_input => g;
3 => g.op;
0.99 => p.pole;

//-------------------------------------
//-------------------------------------
// Graph
6 => int nodeCount;
SndBuf nodes[nodeCount];
float bufRates[nodeCount];
float bufMods[2];
0 => bufMods[0]; 0 => bufMods[1];
for (0 => int i; i < nodeCount; i++)
{    
    Math.random2(0,2) => int sample;
    me.sourceDir() + "samples/drop" + sample + ".wav" => nodes[i].read; nodes[i].gain(0);
    Math.random2f(.3,1.7) => bufRates[i];
    nodes[i] => dac;//.chan(i);

    // connect to meter
    nodes[i] => meter_input;
}
int sourceNode;
int sourceSamp;
int edges[stations][stations];
int flow[stations][stations];
for (0 => int i; i < stations; i++)
{    
    for (0 => int j; j < stations; j++)
    {
        -1 => edges[i][j];
    }
}

//-------------------------------------
//-------------------------------------
// Networking
if (me.args() != 1) me.exit();
me.arg(0).toInt() => int machineNum;

"224.0.0.1" => string hostname;
6449 => int port;
9999 => int nodeInPort;
OscIn oinSync;
OscMsg oscMsg;
port => oinSync.port;
oinSync.addAddress( "/sync, i" );

//-------------------------------------
//-------------------------------------
// Spork and Spin
OscOut xmit;
if (machineNum == 0)
{
   xmit.dest( hostname, port );
   spork ~ edgeListener();
   spork ~ sourceListener();
   spork ~ bufServer();
   spork ~ clock();
}
else
{
    xmit.dest( hostname , 6451 );
    spork ~ player();
    spork ~ emit_level();
    spork ~ bufListener();
}

while(true)
{
    1::second => now;
}

fun void sourceListener()
{
    OscIn oinEdge;
    OscMsg oscMsg;
    nodeInPort => oinEdge.port;
    oinEdge.addAddress( "/flowSource, i i" );
    int source;
    int sample;

    while(true)
    {
        oinEdge => now;
        while(oinEdge.recv(oscMsg) )
        { 
            oscMsg.getInt(0) => source;
            oscMsg.getInt(1) => sample;
        }
        source => sourceNode;
        sample => sourceSamp;
    }
}

fun void edgeListener()
{
    OscIn oinEdge;
    OscMsg oscMsg;
    nodeInPort => oinEdge.port;
    oinEdge.addAddress( "/flowEdge, i i i i" );

    while(true)
    {
        oinEdge => now;

        while(oinEdge.recv(oscMsg) )
        { 
            oscMsg.getInt(0) => int source;
            oscMsg.getInt(1) => int dest;
            oscMsg.getInt(2) => int node;
            oscMsg.getInt(3) => int cap;
            node => edges[source][dest];
            cap => flow[source][dest];
        }
    }
}

fun void emit_level() {

    while(true) {
        xmit.start( "/audiolevel" );
        machineNum => xmit.add;
        p.last() => xmit.add;
        xmit.send();
        10::ms => now;
    }
}

fun void player()
{
    OscIn oinNote;
    OscMsg oscMsg;
    port => oinNote.port;
    oinNote.addAddress( "/play" + machineNum + " , i" );

    while(true)
    {
        oinNote => now;
        while(oinNote.recv(oscMsg) )
        { 
            oscMsg.getInt(0) => int node;
            spork ~ playNode(node);
        }
    }
}

fun void playNode(int node)
{
    oinSync => now;
    if(bufRates[node] >= 1)
    {
        (bufMods[1] * bufRates[node]) + ((1. - bufMods[1]) * 1.) => nodes[node].rate;
    }
    else
    {
        (bufMods[0] * bufRates[node]) + ((1. - bufMods[0]) * 1.) => nodes[node].rate;
    }
    0.9 => nodes[node].gain;
    0 => nodes[node].pos;
}

fun void clock()
{

    0 => int beat;
    int movingFlow[stations][stations];
    int signals[stations][nodeCount];

    while (true)
    {
        if (beat % 16 == 0)
        {
            for (0 => int i; i < signals.size(); i++)
            {  
                for (0 => int j; j < signals.size(); j++)
                {  
                    flow[i][j] => movingFlow[i][j];
                } 

                for (0 => int j; j < nodeCount; j++)
                {  
                    0 => signals[i][j];
                } 
            }
            1 => signals[sourceNode][sourceSamp];
            0 => beat;
        }
    
        for (0 => int i; i < signals.size(); i++)
        {
            for (0 => int j; j < nodeCount; j++)
            {
                if (signals[i][j] != 0)
                {
                    0 => int shouldFire;
                    if (i == sourceNode && j == sourceSamp)
                    {
                        if (beat == 0)
                        {
                            1 => shouldFire;
                        }
                        else
                        {
                            for (0 => int k; k < signals.size(); k++)
                            {
                                if (movingFlow[i][k] > 0)
                                {
                                    1 => shouldFire;
                                    break;
                                }
                            }
                        }
                    
                    }
                    else
                    {
                        1 => shouldFire;
                    }

                    if (shouldFire)
                    {
                        xmit.start( "/play" + (i+1) ); j => xmit.add;
                        xmit.send();
                    }
                }
            }   
        }
   
        propagatePriority(signals, movingFlow) @=> signals;
        beat + 1 => beat;
        xmit.start( "/sync" ); 0 => xmit.add;
        xmit.send();
        s => now;
    }
}

fun int[][] propagatePriority(int signals[][], int movingFlow[][])
{
    int newSignals[signals.size()][nodeCount];
    1 => newSignals[sourceNode][sourceSamp];
    int sumSignals[signals.size()];
    for (0 => int i; i < signals.size(); i++)
    {
        for (0 => int j; j < nodeCount; j++)
        {
            if (signals[i][j] != 0)
            {
                sumSignals[i] + 1 => sumSignals[i];
            }
        }
    }
    for (0 => int i; i < signals.size(); i++)
    {
        for (0 => int j; j < signals.size(); j++)
        {
            if (sumSignals[i] == 0)
            {
                break;
            }
            if (edges[i][j] != -1)
            {
                if (movingFlow[i][j] > 0 && newSignals[j][edges[i][j]] == 0)
                {
                    1 => newSignals[j][edges[i][j]];
                    movingFlow[i][j] - 1 => movingFlow[i][j];
                    sumSignals[i] - 1 => sumSignals[i];
                    break;
                }
            }
        }
    }

    return newSignals;
}

fun int[][] propagateMax(int signals[][], int movingFlow[][])
{
    int newSignals[signals.size()][nodeCount];
    1 => newSignals[sourceNode][sourceSamp];
    int sumSignals[signals.size()];
    for (0 => int i; i < signals.size(); i++)
    {
        for (0 => int j; j < nodeCount; j++)
        {
            if (signals[i][j] != 0)
            {
                sumSignals[i] + 1 => sumSignals[i];
            }
        }
    }
    for (0 => int i; i < signals.size(); i++)
    {
        1 => int sinksLeft;
        while (sinksLeft && sumSignals[i] > 0)
        {
            -1 => int maxIdx;
            0 => int maxFlow;
            for (0 => int j; j < signals.size(); j++)
            {
                if (movingFlow[i][j] > maxFlow && newSignals[j][edges[i][j]] == 0)
                {
                    j => maxIdx;
                    movingFlow[i][j] => maxFlow;
                }
            }
            if (maxIdx >= 0)
            {
                1 => newSignals[maxIdx][edges[i][maxIdx]];
                movingFlow[i][maxIdx] - 1 => movingFlow[i][maxIdx];
                sumSignals[i] - 1 => sumSignals[i];
            }
            else
            {
                0 => sinksLeft;
            }
        }
    }

    return newSignals;
}

fun void bufServer()
{
    OscIn oinMod;
    OscMsg oscMsg;
    nodeInPort => oinMod.port;
    oinMod.addAddress( "/bufMod, i f f" );
    int node;
    float low;
    float high;

    while(true)
    {
        oinMod => now;
        while(oinMod.recv(oscMsg) )
        { 
            oscMsg.getInt(0) => node;
            oscMsg.getFloat(1) => low;
            oscMsg.getFloat(2) => high;
            // <<< "got bufMod message:" node, low, high >>>;

            xmit.start( "/bufMod" + node ); 
            low => xmit.add; high => xmit.add;
            xmit.send();
        }
    }
}

fun void bufListener()
{
    OscIn oinMod;
    OscMsg oscMsg;
    port => oinMod.port;
    oinMod.addAddress( "/bufMod" + (machineNum - 1) + ", f f" );
    float low;
    float high;

    while(true)
    {
        oinMod => now;
        while(oinMod.recv(oscMsg) )
        { 
            oscMsg.getFloat(0) => low;
            oscMsg.getFloat(1) => high;
            low => bufMods[0]; high => bufMods[1];
        }
    }
}