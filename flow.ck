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
// Graph
6 => int nodeCount;
SndBuf nodes[nodeCount];
for (0 => int i; i < nodeCount; i++)
{    
    Math.random2(0,2) => int sample;
    me.sourceDir() + "samples/drop" + sample + ".wav" => nodes[i].read; nodes[i].gain(0);
    Math.random2f(.5,1.5) => nodes[i].rate;
    nodes[i] => dac.chan(i);
}
int sourceNode;
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

if (machineNum == 0)
{
   spork ~ edgeListener();
   spork ~ sourceListener();
   spork ~ clock();
}
else
{
    spork ~ player();
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
    oinEdge.addAddress( "/flowSource, i" );
    int source;

    while(true)
    {
        oinEdge => now;
        while(oinEdge.recv(oscMsg) )
        { 
            oscMsg.getInt(0) => source;
        }
        source => sourceNode;
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
            spork ~ playNode(nodes[node]);
        }
    }
}

fun void playNode(SndBuf node)
{
    oinSync => now;
    0.9 => node.gain;
    0 => node.pos;
}

fun void clock()
{
    OscOut xmit;
    xmit.dest( hostname, port );

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
            1 => signals[sourceNode][0];
            0 => beat;
        }
    
        for (0 => int i; i < signals.size(); i++)
        {
            for (0 => int j; j < nodeCount; j++)
            {
                if (signals[i][j] != 0)
                {
                    0 => int shouldFire;
                    if (i == sourceNode)
                    {
                        if (beat == 0)
                        {
                            1 => shouldFire;
                        }
                        else
                        {
                            for (0 => int j; j < signals.size(); j++)
                            {
                                if (movingFlow[i][j] > 0)
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
                        xmit.start( "/play" + i ); j => xmit.add;
                        xmit.send();
                    }
                }
            }   
        }
    
        int newSignals[signals.size()][nodeCount];
        1 => newSignals[sourceNode][0];
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
                if (movingEdges[i][j] > 0 && newSignals[j][edges[i][j]] == 0)
                {
                    1 => newSignals[j][edges[i][j]];
                    movingEdges[i][j] - 1 => movingEdges[i][j];
                    sumSignals[i] - 1 => sumSignals[i];
                    break;
                }
            }
        }

        for (0 => int i; i < signals.size(); i++)
        {
            for (0 => int j; j < nodeCount; j++)
            {
                newSignals[i][j] => signals[i][j];
            }
        }
   
        beat + 1 => beat;
        newSignals @=> signals;
        xmit.start( "/sync" ); 0 => xmit.add;
        xmit.send();
        s => now;
    }
}