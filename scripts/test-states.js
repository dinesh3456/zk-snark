const { ethers } = require("hardhat");
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function main() {
  const [owner] = await ethers.getSigners();

  // Get contract instance
  const tokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Your deployed address
  const TokenWithZK = await ethers.getContractFactory("TokenWithZk");
  const token = await TokenWithZK.attach(tokenAddress);

  console.log("Testing different token states...");

  // Test Mint Operation
  console.log("\nTesting Mint Operation:");
  try {
    const mintAmount = ethers.utils.parseEther("100000");
    const tx = await token.mint(owner.address, mintAmount);
    await tx.wait();
    console.log(`Minted ${ethers.utils.formatEther(mintAmount)} tokens`);

    // Generate new proof for updated state
    await generateAndVerifyProof(token);
  } catch (error) {
    console.error("Error in mint operation:", error);
  }

  // Test Transfer Operation
  console.log("\nTesting Transfer Operation:");
  try {
    const transferAmount = ethers.utils.parseEther("50000");
    const [_, recipient] = await ethers.getSigners();
    const tx = await token.transfer(recipient.address, transferAmount);
    await tx.wait();
    console.log(
      `Transferred ${ethers.utils.formatEther(transferAmount)} tokens`
    );

    // Generate new proof for updated state
    await generateAndVerifyProof(token);
  } catch (error) {
    console.error("Error in transfer operation:", error);
  }

  // Print final state
  const totalSupply = await token.totalSupply();
  const ownerBalance = await token.balanceOf(owner.address);
  console.log("\nFinal State:");
  console.log("Total Supply:", ethers.utils.formatEther(totalSupply));
  console.log("Owner Balance:", ethers.utils.formatEther(ownerBalance));
}

async function generateAndVerifyProof(token) {
  const totalSupply = await token.totalSupply();
  const cap = await token.cap();
  const [owner] = await ethers.getSigners();
  const ownerBalance = await token.balanceOf(owner.address);

  // Create input for the circuit
  const input = {
    totalSupply: ethers.utils.formatEther(totalSupply),
    cap: ethers.utils.formatEther(cap),
    ownerBalance: ethers.utils.formatEther(ownerBalance),
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: Math.floor(Date.now() / 1000),
    owner: owner.address,
  };

  // Write input to file
  fs.writeFileSync(
    path.join(__dirname, "../build/input.json"),
    JSON.stringify(input, null, 2)
  );

  // Generate new proof
  console.log("Generating new proof for current state...");
  await require("./generate-proof.js").generateProof();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
