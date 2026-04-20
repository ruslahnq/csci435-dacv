pragma circom 2.0.0;

// Proves that the degree value is a member of an approved set
// without revealing which degree it is.
// Uses a simple Merkle proof approach.

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/mux1.circom";

template DegreeInSet(levels) {
    // Private inputs
    signal input degree;              // numeric encoding of the degree
    signal input pathElements[levels]; // Merkle proof siblings
    signal input pathIndices[levels];  // 0 = left, 1 = right

    // Public inputs
    signal input root;               // Merkle root of approved degree set
    signal input credentialHash;

    // Verify Merkle path
    component hashers[levels];
    component mux[levels];

    signal currentHash[levels + 1];
    currentHash[0] <== degree;

    for (var i = 0; i < levels; i++) {
        mux[i] = MultiMux1(2);
        mux[i].c[0][0] <== currentHash[i];
        mux[i].c[0][1] <== pathElements[i];
        mux[i].c[1][0] <== pathElements[i];
        mux[i].c[1][1] <== currentHash[i];
        mux[i].s <== pathIndices[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== mux[i].out[0];
        hashers[i].inputs[1] <== mux[i].out[1];
        currentHash[i + 1] <== hashers[i].out;
    }

    root === currentHash[levels];
}

component main { public [root, credentialHash] } = DegreeInSet(3);
