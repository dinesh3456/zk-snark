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

async function compileCircuit() {
  try {
    if (!fs.existsSync(BUILD_DIR)) {
      fs.mkdirSync(BUILD_DIR, { recursive: true });
    }

    console.log("1. Compiling circuit...");
    const circuitPath = path.join(
      __dirname,
      "..",
      "circuits",
      "TokenStateVerifier.circom"
    );
    await execute(
      `circom "${circuitPath}" --r1cs --wasm --sym --output "${BUILD_DIR}"`
    );

    process.chdir(BUILD_DIR);

    console.log("2. Starting Powers of Tau ceremony...");
    await execute("snarkjs powersoftau new bn128 12 pot12_0000.ptau -v");

    console.log("3. Contributing to Powers of Tau ceremony...");
    await execute(
      'snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v -e="random text"'
    );

    console.log("4. Phase 2 preparation and contribution...");
    await execute(
      "snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v"
    );

    console.log("5. Generating zKey files...");
    await execute(
      "snarkjs groth16 setup TokenStateVerifier.r1cs pot12_final.ptau circuit_0000.zkey"
    );

    console.log("6. Contributing to phase 2...");
    await execute(
      'snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="Second contribution" -e="another random text"'
    );

    console.log("7. Exporting verification key...");
    await execute(
      "snarkjs zkey export verificationkey circuit_final.zkey verification_key.json"
    );

    console.log("Circuit compilation and setup completed successfully!");
  } catch (error) {
    console.error("Error during compilation:", error);
    process.exit(1);
  }
}

compileCircuit()
  .then(() => {
    console.log("Done!");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
