// constants
const size = 720;
const nodeSize = 30;
const nodeColor = [66, 138, 245];
const nodeOuterColor = [169, 199, 245];
const nodeVolAlpha = 0.3;
const distanceScale = 0.375*size;

// positions
const numNodes = 10;
const nodePositions = [
    [0.5, Math.PI/4],
    [0.5, 3*Math.PI/4],
    [0.5, -3*Math.PI/4],
    [0.5, -Math.PI/4],
    [1.0, 0],
    [1.0, Math.PI/3],
    [1.0, 2*Math.PI/3],
    [1.0, Math.PI],
    [1.0, -2*Math.PI/3],
    [1.0, -Math.PI/3],
]

function polarToPos(r, phi, size) {
    let x = distanceScale*r*Math.cos(phi);
    let y = distanceScale*r*Math.sin(phi);
    return [x + size/2,y + size/2];
}