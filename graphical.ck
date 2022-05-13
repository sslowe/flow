120 => float BPM;
(60 / BPM)::second => dur SPB;
SPB / 4 => dur s;
7 => int nodeCount;
SndBuf nodes[nodeCount];
int signals[nodeCount];
int edges[nodeCount][nodeCount];

for (1 => int i; i < nodeCount; i++)
{    
    me.sourceDir() + "samples/node" + i + ".wav" => nodes[i].read; nodes[i].gain(0);
    nodes[i] => dac; //.chan(i - 1);
}

KBHit kb;

spork ~ kbListener();

0 => int beat;
int movingEdges[nodeCount][nodeCount];
while (true)
{
    if (beat % 16 == 0)
    {
        [1, 0, 0, 0, 0, 0, 0] @=> signals;
        0 => beat;
        for (0 => int i; i < nodeCount; i++)
        {  
            for (0 => int j; j < nodeCount; j++)
            {  
                edges[i][j] => movingEdges[i][j];
            } 
        }
    }
    
    for (1 => int i; i < nodeCount; i++)
    {
        if (signals[i] != 0)
        {
            0.9 => nodes[i].gain;
            0 => nodes[i].pos;
        }
    }
    
    int newSignals[nodeCount];
    1 => newSignals[0];
    for (0 => int i; i < nodeCount; i++)
    {
        if (signals[i] == 0)
        {
            continue;
        }
        
        for (1 => int j; j < nodeCount; j++)
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
    <<< beat, signals[0], signals[1],signals[2],signals[3],signals[4],signals[5],signals[6]>>>;
    s => now;
}

fun void kbListener()
{
    int source;
    int dest;
    int cap;
    
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
            kb.getchar() - 48 => dest;
        }
                
        500::ms => now;
        kb => now;
        
        // potentially more than 1 key at a time
        while( kb.more() )
        {
            // print key value
            kb.getchar() - 48 => cap;
        }
        
        <<<"Adding edge from " + source + " to " + dest + " with capacity " + cap>>>;
        cap => edges[source][dest];
    }
}