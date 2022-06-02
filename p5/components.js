class Node {
    constructor(r, phi) {
        this.r = r;
        this.phi = phi;
        this.x = polarToPos(r, phi)[0];
        this.y = polarToPos(r, phi)[1];
        // 0 - regular, 1 - source, -1 - sink
        this.state = 0;
        // volume from 0 to 1
        this.vol = 0;
        this.own = 0;

        this.show_number = false;
        this.id = -1;

        // for volume
        this.lifetime = 0;
    }

    setRegular() {
        this.state = 0;
    }

    setSource() {
        this.state = 1;
    }

    setOwn() {
        this.own = 1;
    }

    setVolume(vol) {
        this.vol = max([vol, 3*nodeSize]);
    }

    draw() {
        let cFull = color(...nodeColor);
        let cOwn = color(...nodeOwnColor);

        noStroke();
        if (this.state === 1) {
            strokeWeight(nodeStroke);
            stroke(nodeSourceColor);
        }
        if (this.own === 1) {
            fill(cOwn);
        } else {
            fill(cFull);
        }
        ellipse(this.x, this.y, nodeSize, nodeSize);

        if (this.show_number) {
            fill(255);
            noStroke();
            text(this.id, this.x-0.5, this.y-3);
        }
    }

    drawVol() {
        let cVol = color(...nodeOuterColor);
        noStroke();
        fill(cVol);
        ellipse(this.x, this.y, nodeSize*(1+this.vol)*(1-volDecay*this.lifetime), nodeSize*(1+this.vol)*(1-volDecay*this.lifetime));
    }
}

class Edge {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
        // 0 - inactive, 1 - 1 to 2, 2 - 2 to 1, 3 - both
        this.direction = 0;
    }

    activateDir1() {
        if (this.direction === 0) {
            this.direction = 1;
        } else if (this.direction === 2) {
            this.direction = 3;
        }
    }
    activateDir2() {
        if (this.direction === 0) {
            this.direction = 2;
        } else if (this.direction === 1) {
            this.direction = 3;
        }
    }

    deactivateDir1() {
        if (this.direction === 1) {
            this.direction = 0;
        } else if (this.direction === 3) {
            this.direction = 2;
        }
    }

    deactivateDir2() {
        if (this.direction === 2) {
            this.direction = 0;
        } else if (this.direction === 3) {
            this.direction = 1;
        }
    }

    switchDir1() {
        if (this.direction === 0) {
            this.direction = 1;
        } else if (this.direction === 2) {
            this.direction = 3;
        } else if (this.direction === 1) {
            this.direction = 0;
        } else if (this.direction === 3) {
            this.direction = 2;
        }
    }

    switchDir2() {
        if (this.direction === 0) {
            this.direction = 2;
        } else if (this.direction === 1) {
            this.direction = 3;
        } else if (this.direction === 2) {
            this.direction = 0;
        } else if (this.direction === 3) {
            this.direction = 1;
        }
    }

    deactivate() {
        this.direction = 0;
    }

    isActiveDir1() {
        if (this.direction === 3) {
            return true
        } else if (this.direction === 1) {
            return true
        } else {
            return false
        }
    }

    isActiveDir2() {
        if (this.direction === 3) {
            return true
        } else if (this.direction === 2) {
            return true
        } else {
            return false
        }
    }

    draw() {
        strokeWeight(edgeWidth);
        if (this.direction === 0) {
            var col = color(...edgeColorInactive);
        } else if (this.direction === 1) {
            var col = color(...edgeColorActiveDir1);
        } else if (this.direction === 2) {
            var col = color(...edgeColorActiveDir2);
        } else if (this.direction === 3) {
            var col = color(...edgeColorActiveBoth);
        }
        stroke(col);

        line(this.node1.x, this.node1.y, this.node2.x, this.node2.y);
    }
}

class EdgeList {
    constructor(nodes) {
        this.edges = [];
        for (let i = 0; i < numNodes; i++) {
            let w = []
            for (let j = 0; j < i; j++) {
                let e = new Edge(nodes[i], nodes[j]);
                w.push(e);
            }
            this.edges.push(w);
        }
    }

    activateEdge(i,j) {
        if (i > j) { // normal case
            this.edges[i][j].activateDir1();
        } else if (i < j) { // have to reverse i, j
            this.edges[j][i].activateDir2();
        }
    }

    deactivateEdge(i,j) {
        if (i > j) { // normal case
            this.edges[i][j].deactivateDir1();
        } else if (i < j) { // have to reverse i, j
            this.edges[j][i].deactivateDir2();
        }
    }

    switchEdge(i,j) {
        if (i > j) { // normal case
            this.edges[i][j].switchDir1();
        } else if (i < j) { // have to reverse i, j
            this.edges[j][i].switchDir2();
        }
    }

    isActive(i,j) {
        if (i > j) { // normal case
            return this.edges[i][j].isActiveDir1();
        } else if (i < j) { // have to reverse i, j
            return this.edges[j][i].isActiveDir2();
        }
    }

    drawEdges() {
        for (let i = 0; i < numNodes; i++) {
            for (let j = 0; j < i; j++) {
                this.edges[i][j].draw();
            }
        }
    }
}