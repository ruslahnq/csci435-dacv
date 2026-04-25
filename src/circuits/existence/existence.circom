pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template CredentialExists() {
    // private
    signal input secret;
    signal input tokenId;

    // public
    signal input nullifier;
    signal input contractAddress; // ensuring proof is tied to this specific contract

    component hasher = Poseidon(2);
    hasher.inputs[0] <== secret;
    hasher.inputs[1] <== tokenId;

    nullifier === hasher.out;
}

component main { public [nullifier, contractAddress] } = CredentialExists();
