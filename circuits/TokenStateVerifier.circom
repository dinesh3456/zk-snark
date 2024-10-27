pragma circom 2.1.4;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template TokenStateVerifier() {
    // Public inputs
    signal input totalSupply;
    signal input cap;
    signal input ownerBalance;
    signal input blockNumber;
    signal input timestamp;
    
    // Private inputs
    signal input owner;
    
    // Outputs
    signal output validState;
    
    // Verify cap is greater than 0
    signal capCheck;
    capCheck <-- cap > 0 ? 1 : 0;
    capCheck * (capCheck - 1) === 0;
    capCheck === 1;
    
    // Verify total supply is less than or equal to cap
    signal supplyCheck;
    supplyCheck <-- totalSupply <= cap ? 1 : 0;
    supplyCheck * (supplyCheck - 1) === 0;
    supplyCheck === 1;
    
    // Hash the state variables
    component hasher = Poseidon(6);
    hasher.inputs[0] <== totalSupply;
    hasher.inputs[1] <== cap;
    hasher.inputs[2] <== ownerBalance;
    hasher.inputs[3] <== owner;
    hasher.inputs[4] <== blockNumber;
    hasher.inputs[5] <== timestamp;
    
    // Set validity
    validState <== capCheck * supplyCheck;
}

component main = TokenStateVerifier();