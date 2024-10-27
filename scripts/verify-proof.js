const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using signer address:", signer.address);

  // Get contract instances
  const verifierAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const tokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const TokenWithZK = await ethers.getContractFactory("TokenWithZK");
  const token = await TokenWithZK.attach(tokenAddress);

  console.log("Reading proof and public signals...");
  const proof = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../build/proof.json"))
  );
  const publicSignals = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../build/public.json"))
  );

  // Convert proof to contract parameters
  const { a, b, c } = convertProofForVerifier(proof);

  console.log("\nProof details:");
  console.log("a:", a);
  console.log("b:", b);
  console.log("c:", c);
  console.log("public signals:", publicSignals);

  try {
    console.log("\nVerifying proof on-chain...");
    const tx = await token.verifyState(
      a,
      b,
      c,
      publicSignals.map((x) => ethers.BigNumber.from(x)),
      { gasLimit: 3000000 }
    );
    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Proof verification transaction confirmed!");
    console.log("Gas used:", receipt.gasUsed.toString());

    // Wait a bit for the state to be updated
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("\nChecking state verification...");
    const stateValue = ethers.BigNumber.from(publicSignals[0]);
    const isVerified = await token.verifiedStates(stateValue);
    console.log("State verification status:", isVerified);

    // Get token details
    const totalSupply = await token.totalSupply();
    const cap = await token.cap();
    console.log("\nToken Details:");
    console.log("Total Supply:", ethers.utils.formatEther(totalSupply));
    console.log("Cap:", ethers.utils.formatEther(cap));
  } catch (error) {
    console.error("\nError details:", {
      message: error.message,
      data: error.data,
      transaction: error.transaction,
    });
    throw error;
  }
}

function convertProofForVerifier(proof) {
  const toBN = (str) => ethers.BigNumber.from(str);
  return {
    a: [toBN(proof.pi_a[0]), toBN(proof.pi_a[1])],
    b: [
      [toBN(proof.pi_b[0][1]), toBN(proof.pi_b[0][0])],
      [toBN(proof.pi_b[1][1]), toBN(proof.pi_b[1][0])],
    ],
    c: [toBN(proof.pi_c[0]), toBN(proof.pi_c[1])],
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
