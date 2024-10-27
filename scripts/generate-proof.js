const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");

const execAsync = util.promisify(exec);
const BUILD_DIR = path.join(__dirname, "..", "build");

async function execute(command) {
  console.log("Executing:", command);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error("Error executing command:", command);
    console.error(error);
    throw error;
  }
}

async function generateProof() {
  try {
    // Create input file
    const input = {
      totalSupply: "1000000",
      cap: "2000000",
      ownerBalance: "500000",
      blockNumber: "12345",
      timestamp: Math.floor(Date.now() / 1000).toString(),
      owner: "123456789",
    };

    // Write input to file
    const inputPath = path.join(BUILD_DIR, "input.json");
    fs.writeFileSync(inputPath, JSON.stringify(input, null, 2));

    // Change to build directory
    process.chdir(BUILD_DIR);

    console.log("1. Converting witness generation script...");
    // Rename the generate_witness.js to .cjs
    if (fs.existsSync("TokenStateVerifier_js/generate_witness.js")) {
      fs.renameSync(
        "TokenStateVerifier_js/generate_witness.js",
        "TokenStateVerifier_js/generate_witness.cjs"
      );
    }

    console.log("2. Generating witness...");
    // Use the .cjs extension
    await execute(
      `node TokenStateVerifier_js/generate_witness.cjs TokenStateVerifier_js/TokenStateVerifier.wasm input.json witness.wtns`
    );

    console.log("3. Generating proof...");
    await execute(
      "snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json"
    );

    console.log("4. Verifying proof...");
    await execute(
      "snarkjs groth16 verify verification_key.json public.json proof.json"
    );

    console.log("5. Generating Solidity verifier...");
    await execute(
      "snarkjs zkey export solidityverifier circuit_final.zkey verifier.sol"
    );

    console.log("6. Generating calldata...");
    const { stdout } = await execAsync(
      "snarkjs zkey export soliditycalldata public.json proof.json"
    );
    console.log("\nCalldata for Solidity verifier:", stdout);

    // Read and print the proof
    const proof = JSON.parse(fs.readFileSync("proof.json", "utf8"));
    const publicSignals = JSON.parse(fs.readFileSync("public.json", "utf8"));

    console.log("\nProof generated successfully!");
    console.log("\nPublic Signals:", publicSignals);

    // Copy verifier contract
    const contractsDir = path.join(__dirname, "..", "contracts");
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir);
    }
    fs.copyFileSync("verifier.sol", path.join(contractsDir, "verifier.sol"));
    console.log("\nVerifier contract copied to contracts/verifier.sol");

    return { proof, publicSignals };
  } catch (error) {
    console.error("Error generating proof:", error);
    process.exit(1);
  }
}

generateProof()
  .then(() => {
    console.log("Done!");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
