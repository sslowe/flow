// constants
const csize = 720;
const nodeSize = 35;
const nodeColor = [66, 138, 245];
const nodeVolAlpha = 0.5;
const nodeOuterColor = [169, 199, 245, nodeVolAlpha*255];
const nodeSourceColor = [69, 214, 127];
const nodeOwnColor = [212, 66, 245];
const distanceScale = 0.375*csize;
const innerRelPos = 0.3
const nodeStroke = 4;

const edgeWidth = 3;
const edgeColorActiveDir1 = [187, 217, 56];
const edgeColorActiveDir2 = [217, 145, 56];
const edgeColorActiveBoth = [129, 41, 204];
const edgeColorInactive = [0, 10];

// default control parameters
const patterns = [1,1,1,1,1,1,1,1,1,1];
const pitches  = [1,1,1,1,1,1,1,1,1,1];
const flows = [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5];

// control colors
const patternColorActive = "#ba24ff";
const patternColorInactive = "#ffdefc";
const pitchColorActive = "#ba24ff";
const pitchColorInactive = "#ffdefc";
const flowColorActive = "#ba24ff";
const flowColorInactive = "#ffdefc";

const sourceDefault = 1;
const sinkDefault = 3;

const volDecay = 0.05;

// positions
const numNodes = 10;
const nodePositionsSymmetric = [
    [innerRelPos, Math.PI/4],
    [innerRelPos, 3*Math.PI/4],
    [innerRelPos, -3*Math.PI/4],
    [innerRelPos, -Math.PI/4],
    [1.0, 0],
    [1.0, Math.PI/3],
    [1.0, 2*Math.PI/3],
    [1.0, Math.PI],
    [1.0, -2*Math.PI/3],
    [1.0, -Math.PI/3],
];

const nodePositionsSLOrk = [
    [2*innerRelPos, -Math.PI/2],
    [2.2*innerRelPos, 0+0.2],
    [2*innerRelPos, Math.PI/3+0.0],
    [2*innerRelPos, 2*Math.PI/3-0.0],
    [2.2*innerRelPos, Math.PI-0.2],
    [1.2, 0-0.0],
    [1.0, Math.PI/4-0.1],
    [1.0, Math.PI/2],
    [1.0, 3*Math.PI/4+0.1],
    [1.2, Math.PI+0.0],
];

const nodePositions = nodePositionsSLOrk;

function polarToPos(r, phi) {
    let x = distanceScale*r*Math.cos(phi);
    let y = -distanceScale*r*Math.sin(phi);
    return [x + csize/2,y + csize/2];
}

let font;
function preload() {
    font = loadFont('inconsolata.otf');
}

const textsize = 0.7*nodeSize;