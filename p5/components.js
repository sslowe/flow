class Node {
    constructor(r, phi) {
        this.r = r;
        this.phi = phi;
        this.x = polarToPos(r, phi, size)[0];
        this.y = polarToPos(r, phi, size)[1];
    }

    draw(vol) {
        let cFull = color(...nodeColor);
        let cVol = color(...nodeOuterColor);

        noStroke();
        fill(cVol)
        ellipse(this.x, this.y, nodeSize*(1+vol), nodeSize*(1+vol));
        fill(cFull);
        ellipse(this.x, this.y, nodeSize, nodeSize);

    }
}

class Edge {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
    }
}