// constants
const csize = 720;
const nodeSize = 35;
const nodeColor = [66, 138, 245];
const nodeVolAlpha = 0.5;
const nodeOuterColor = [169, 199, 245, nodeVolAlpha*255];
const nodeSourceColor = [69, 214, 127];
const nodeSinkColor = [247, 69, 179];
const distanceScale = 0.375*csize;
const innerRelPos = 0.3
const nodeStroke = 4;

const edgeWidth = 3;
const edgeColorActiveDir1 = [187, 217, 56];
const edgeColorActiveDir2 = [217, 145, 56];
const edgeColorActiveBoth = [129, 41, 204];
const edgeColorInactive = [0, 10];

const patternColorActive = "#ba24ff";
const patternColorInactive = "#ffdefc";
const pitchColorActive = "#ba24ff";
const pitchColorInactive = "#ffdefc";
const flowColorActive = "#ba24ff";
const flowColorInactive = "#ffdefc";

// positions
const numNodes = 10;
const nodePositions = [
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
]

function polarToPos(r, phi) {
    let x = distanceScale*r*Math.cos(phi);
    let y = distanceScale*r*Math.sin(phi);
    return [x + csize/2,y + csize/2];
}