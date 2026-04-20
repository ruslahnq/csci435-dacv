pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template CredentialExists() {
    // Private inputs
    signal input secret;          // random secret stored in backend when credential is issued
    signal input tokenId;         // the token ID

    // Public inputs
    signal input nullifier;       // Poseidon(secret, tokenId) — prevents reuse of the same proof
    signal input contractAddress; // ensures proof is tied to this specific contract

    // Constraint: nullifier must equal Poseidon(secret, tokenId)
    component hasher = Poseidon(2);
    hasher.inputs[0] <== secret;
    hasher.inputs[1] <== tokenId;

    nullifier === hasher.out;
}

component main { public [nullifier, contractAddress] } = CredentialExists();
