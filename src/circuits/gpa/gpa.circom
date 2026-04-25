pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/bitify.circom";

template GpaThreshold() {
    // private
    signal input gpa;

    // public
    signal input threshold;
    signal input credentialHash;

    // gpa >= threshold contraint
    signal diff;
    diff <== gpa - threshold;

    // diff must be >= 0, meaning gpa >= threshold
    component n2b = Num2Bits(32);
    n2b.in <== diff;
}

component main { public [threshold, credentialHash] } = GpaThreshold();
