pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

template DegreeInSet(levels) {
    // private
    signal input degree;
    signal input pathElements[levels]; //  merkle proof siblings
    signal input pathIndices[levels]; // 0 = left, 1 = right

    // public
    signal input root;
    signal input credentialHash;

    // verifying merkle path
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
