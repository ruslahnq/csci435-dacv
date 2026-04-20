pragma circom 2.0.0;

template GpaThreshold() {
    // Private inputs — never revealed on-chain
    signal input gpa;           // e.g. 385 meaning 3.85

    // Public inputs — visible to the verifier
    signal input threshold;     // e.g. 300 meaning 3.00
    signal input credentialHash; // links this proof to a specific token

    // Constraint: gpa >= threshold
    // Circom doesn't have >= natively, so we use a helper
    signal diff;
    diff <== gpa - threshold;

    // diff must be >= 0, meaning gpa >= threshold
    // We assert diff is in range [0, 2^32) using a component
    component n2b = Num2Bits(32);
    n2b.in <== diff;
}

component main { public [threshold, credentialHash] } = GpaThreshold();
