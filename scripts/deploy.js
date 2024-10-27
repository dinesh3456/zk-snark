const { ethers } = require("hardhat");

async function main() {
  // Deploy Verifier first
  console.log("Deploying Groth16Verifier...");
  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("Groth16Verifier deployed to:", verifier.address);

  // Deploy Token with ZK verification
  console.log("Deploying TokenWithZK...");
  const initialSupply = ethers.utils.parseEther("1000000"); // 1 million tokens
  const cap = ethers.utils.parseEther("2000000"); // 2 million tokens cap

  const TokenWithZK = await ethers.getContractFactory("TokenWithZK");
  const token = await TokenWithZK.deploy(
    initialSupply,
    cap,
    (
      await ethers.getSigners()
    )[0].address,
    verifier.address
  );
  await token.deployed();
  console.log("TokenWithZK deployed to:", token.address);

  console.log("Deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
