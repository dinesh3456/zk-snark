# ZK-SNARK Token Verification System

This project implements a Zero-Knowledge Proof system for token state verification using ZK-SNARKs. It allows token operations to be verified while keeping sensitive information private.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Understanding ZK-SNARKs](#understanding-zk-snarks)
- [Common Challenges](#common-challenges)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Overview

### What is ZK-SNARK?

ZK-SNARK (Zero-Knowledge Succinct Non-Interactive Argument of Knowledge) is a cryptographic method that allows one party (the prover) to prove to another party (the verifier) that a statement is true without revealing any information beyond the validity of the statement.

### Why Use It For Tokens?

1. **Privacy**: Verify token operations without exposing sensitive details
2. **Security**: Ensure token state remains valid through mathematical proofs
3. **Trust**: Provide verifiable guarantees without compromising confidentiality

## System Architecture

The system consists of four main components:

1. **Circuit (TokenStateVerifier.circom)**

   - Defines the rules and constraints for token state verification
   - Processes both public and private inputs
   - Generates mathematical proofs

2. **Smart Contracts**

   - TokenWithZK.sol: Main token contract with ZK verification
   - Verifier.sol: Auto-generated contract for proof verification

3. **Proof Generation**

   - Creates proofs for valid token states
   - Handles input processing and proof construction

4. **Verification System**
   - Validates proofs on-chain
   - Manages state verification status

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- circom (v2.1.4)
- snarkjs (v0.7.0 or higher)
- Hardhat

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd zk-snark-token
```

2. Install dependencies:

```bash
npm install
```

3. Install circom (if not already installed):

```bash
npm install -g circom
```

## Usage

### 1. Compile Circuit

```bash
npm run compile
```

This command:

- Compiles the Circom circuit
- Generates R1CS constraint system
- Creates WASM code for witness generation
- Generates and exports the verification key

### 2. Generate Proof

```bash
npm run prove
```

This step:

- Takes the current token state
- Generates a witness using the circuit
- Creates a ZK proof
- Outputs proof files and public signals

### 3. Deploy Contracts

```bash
npm run deploy
```

Deploys:

- Groth16Verifier contract
- TokenWithZK contract with initial parameters

### 4. Verify Proof

```bash
npm run verify
```

This command:

- Reads the generated proof
- Submits it to the contract
- Verifies the proof on-chain
- Reports verification status

## Understanding ZK-SNARKs

### Circuit Components

```circom
template TokenStateVerifier() {
    // Public inputs
    signal input totalSupply;
    signal input cap;
    signal input ownerBalance;

    // Private inputs
    signal input owner;

    // Verification logic
    component hasher = Poseidon(6);
    // ... verification constraints
}
```

The circuit:

1. Takes public and private inputs
2. Applies constraints (e.g., totalSupply ≤ cap)
3. Generates proof of valid state

### Proof Generation Process

1. **Input Preparation**

   - Collect current state values
   - Format inputs for the circuit

2. **Witness Generation**

   - Circuit processes inputs
   - Creates witness for proof

3. **Proof Creation**
   - Uses witness and proving key
   - Generates ZK proof

### Verification Process

1. **Proof Submission**

   - Contract receives proof and public inputs
   - Verifier checks proof validity

2. **State Verification**
   - Validates state transitions
   - Updates verification status

## Common Challenges

### Verification Failure Challenge

A common issue occurs when verifying proofs where the transaction reverts with a "call revert exception". This typically happens due to:

1. **Root Cause**:

   - Mismatch between proof generation and verification
   - Incorrect state values in proof
   - Contract state synchronization issues

2. **Solution**:
   - Ensure fresh contract deployment for testing
   - Verify proof directly with Verifier contract first
   - Add proper error handling and logging
   - Implement longer confirmation delays

Example fix:

```javascript
// Add direct verification
const verifierResult = await verifier.verifyProof(a, b, c, publicSignals);
console.log("Verifier result:", verifierResult);

// Add delay after transaction
await new Promise((r) => setTimeout(r, 2000));
```

## Project Structure

```
├── circuits/
│   └── TokenStateVerifier.circom    # Main circuit definition
├── contracts/
│   ├── TokenWithZK.sol              # Main token contract
│   └── verifier.sol                 # Generated verifier
├── scripts/
│   ├── compile-circuit.js           # Circuit compilation
│   ├── generate-proof.js            # Proof generation
│   ├── verify-proof.js              # Proof verification
│   └── test-states.js              # State testing
└── test/
    └── circuit.test.mjs            # Circuit tests
```

## Troubleshooting

### Common Issues and Solutions

1. **Compilation Errors**

   - Ensure circom is installed globally
   - Check circuit syntax and constraints
   - Verify all dependencies are installed

2. **Proof Generation Fails**

   - Validate input formats
   - Check witness generation
   - Ensure proper file paths

3. **Verification Fails**
   - Confirm contract deployment
   - Check proof format
   - Verify state values
