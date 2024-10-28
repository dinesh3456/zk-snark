const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using signer address:", signer.address);

  // Deploy new contracts for testing
  console.log("\nDeploying fresh contracts...");

  // Deploy Verifier
  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("Verifier deployed to:", verifier.address);

  // Deploy TokenWithZK
  const initialSupply = ethers.utils.parseEther("1000000");
  const cap = ethers.utils.parseEther("2000000");

  const TokenWithZK = await ethers.getContractFactory("TokenWithZK");
  const token = await TokenWithZK.deploy(
    initialSupply,
    cap,
    signer.address,
    verifier.address
  );
  await token.deployed();
  console.log("TokenWithZK deployed to:", token.address);

  console.log("\nReading proof and public signals...");
  const BUILD_DIR = path.join(__dirname, "../build");

  // Check if proof files exist
  if (
    !fs.existsSync(path.join(BUILD_DIR, "proof.json")) ||
    !fs.existsSync(path.join(BUILD_DIR, "public.json"))
  ) {
    console.log("Proof files not found. Generating new proof...");
    await require("./generate-proof.js").generateProof();
  }

  const proof = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, "proof.json")));
  const publicSignals = JSON.parse(
    fs.readFileSync(path.join(BUILD_DIR, "public.json"))
  );

  const { a, b, c } = convertProofForVerifier(proof);

  try {
    // Verify using the verifier contract directly first
    console.log("\nVerifying proof with Verifier contract...");
    const verifierResult = await verifier.verifyProof(
      a,
      b,
      c,
      publicSignals.map((x) => ethers.BigNumber.from(x))
    );
    console.log("Verifier contract result:", verifierResult);

    // Submit proof for verification through token contract
    console.log("\nSubmitting proof to TokenWithZK contract...");
    const tx = await token.verifyState(
      a,
      b,
      c,
      publicSignals.map((x) => ethers.BigNumber.from(x)),
      { gasLimit: 3000000 }
    );

    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // Parse events
    const events =
      receipt.events?.filter((e) => e.event === "StateVerified") || [];
    for (const event of events) {
      console.log(
        `StateVerified event - State: ${event.args.state.toString()}, Success: ${
          event.args.success
        }`
      );
    }

    // Wait for blockchain to process
    await new Promise((r) => setTimeout(r, 2000));

    // Check verification status
    const stateValue = ethers.BigNumber.from(publicSignals[0]);
    console.log(
      "\nChecking verification status for state:",
      stateValue.toString()
    );

    const isVerified = await token.getVerificationStatus(stateValue);
    console.log("Verification status:", isVerified);

    // Get token details
    const totalSupply = await token.totalSupply();
    const tokenCap = await token.cap();
    console.log("\nToken Details:");
    console.log("Total Supply:", ethers.utils.formatEther(totalSupply));
    console.log("Cap:", ethers.utils.formatEther(tokenCap));
  } catch (error) {
    console.error("\nError Details:");
    console.error("Message:", error.message);
    if (error.data) console.error("Data:", error.data);
    if (error.transaction) console.error("Transaction:", error.transaction);
    throw error;
  }
}

function convertProofForVerifier(proof) {
  return {
    a: [proof.pi_a[0], proof.pi_a[1]].map((x) => ethers.BigNumber.from(x)),
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]].map((x) => ethers.BigNumber.from(x)),
      [proof.pi_b[1][1], proof.pi_b[1][0]].map((x) => ethers.BigNumber.from(x)),
    ],
    c: [proof.pi_c[0], proof.pi_c[1]].map((x) => ethers.BigNumber.from(x)),
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
