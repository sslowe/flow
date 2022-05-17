// STABLE CHUCK-ONLY VERSION

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
    me.sourceDir() + "samples/drop.wav" => nodes[i].read; nodes[i].gain(0);
    Math.random2f(.5,1.5) => nodes[i].rate;
    nodes[i] => dac.chan(i - 1);
}
int sourceNode;
int edges[nodeCount * stations][nodeCount * stations];

//-------------------------------------
//-------------------------------------
// Networking
if (me.args() != 1) me.exit();
me.arg(0).toInt() => int machineNum;

"224.0.0.1" => string hostname;
6449 => int port;

OscOut xmit;
xmit.dest( hostname, port );

//-------------------------------------
//-------------------------------------
// Spork and Spin

if (memberNum == 0)
{
   spork ~ kbListenerConductor();
   spork ~ edgeListener();
   spork ~ clock();
}
else
{
    spork ~ kbListener();
    spork ~ player();
}

while(true)
{
    1::second => now;
}

fun void kbListener()
{
    int source;
    int destMachine;
    int destNode;
    int cap;
    KBHit kb;
    
    while (true)
    {
        kb => now;
        
        // potentially more than 1 key at a time
        while( kb.more() )
        {
            // print key value
            kb.getchar() - 48 => source;
        }
                
        500::ms => now;
        kb => now;
        
        // potentially more than 1 key at a time
        while( kb.more() )
        {
            // print key value
            kb.getchar() - 48 => destMachine;
        }
                
        500::ms => now;
        kb => now;
        
        // potentially more than 1 key at a time
        while( kb.more() )
        {
            // print key value
            kb.getchar() - 48 => destNode;
        }
                
        500::ms => now;
        kb => now;
        
        // potentially more than 1 key at a time
        while( kb.more() )
        {
            // print key value
            kb.getchar() - 48 => cap;
        }
        
        <<<"Creating edge from " + source + " to (" + destMachine + ", " + destNode + ") with capacity " + cap>>>;
        xmit.start( "/edge" ); 
        machineNum => xmit.add; source => xmit.add; destMachine => xmit.add; destNode => xmit.add; cap => xmit.add;
        xmit.send();
    }
}

fun void kbListenerConductor()
{
    int machine;
    int node;
    KBHit kb;
    
    while (true)
    {
        kb => now;
        
        // potentially more than 1 key at a time
        while( kb.more() )
        {
            // print key value
            kb.getchar() - 48 => machine;
        }
                
        500::ms => now;
        kb => now;
        
        // potentially more than 1 key at a time
        while( kb.more() )
        {
            // print key value
            kb.getchar() - 48 => node;
        }
        
        <<<"Setting source to (" + machine + ", " + node + ")">>>;
        ((machine-1) * nodeCount) + node => sourceNode;
    }
}

fun void edgeListener()
{
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
}

fun void player()
{
    OscIn oinNote;
    OscMsg oscMsg;
    port => oinNote.port;
    oinNote.addAddress( "/play" + machine + " , i" );

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
    OscIn oinSync;
    OscMsg oscMsg;
    port => oinSync.port;
    oinSync.addAddress( "/sync, i" );
    oinSync => now;
    0.9 => nodes[node].gain;
    0 => nodes[node].pos;
    s => now;
}

fun void clock()
{
    0 => int beat;
    int movingEdges[stations * nodeCount][stations * nodeCount];
    int signals[stations * nodeCount];

    while (true)
    {
        if (beat % 16 == 0)
        {
            for (0 => int i; i < signals.size(); i++)
            {  
                0 => signals[i];

                for (0 => int j; j < signals.size(); j++)
                {  
                    edges[i][j] => movingEdges[i][j];
                } 
            }
            1 => signals[sourceNode];
            0 => beat;
        }
    
        for (1 => int i; i < signals.size(); i++)
        {
            if (signals[i] != 0)
            {
                (i / nodeCount) + 1 => int destMachine;
                i % nodeCount => int destNode;
                xmit.start( "/play" + destMachine ); destNode => xmit.add;
                xmit.send();
            }
        }
    
        int newSignals[signals.size()];
        1 => newSignals[sourceNode];
        for (0 => int i; i < signals.size(); i++)
        {
            if (signals[i] == 0)
            {
                continue;
            }
        
            for (1 => int j; j < signals.size(); j++)
            {
                if (movingEdges[i][j] > 0 && newSignals[j] == 0)
                {
                    1 => newSignals[j];
                    movingEdges[i][j] - 1 => movingEdges[i][j];
                    break;
                }
            }
        }
   
        beat + 1 => beat;
        newSignals @=> signals;
        xmit.start( "/sync" ); 0 => xmit.add;
        xmit.send();
        s => now;
    }
}