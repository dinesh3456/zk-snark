import { expect } from "chai";
import path from "path";
import { fileURLToPath } from "url";
import { wasm as wasm_tester } from "circom_tester";
import { F1Field, Scalar } from "ffjavascript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
const Fr = new F1Field(p);

describe("Token State Verifier Circuit", function () {
  this.timeout(100000);

  let circuit;

  before(async () => {
    circuit = await wasm_tester(
      path.join(__dirname, "../circuits", "TokenStateVerifier.circom"),
      {
        include: path.join(__dirname, "../node_modules"),
      }
    );
  });

  it("should verify valid token state", async () => {
    const input = {
      totalSupply: 1000000,
      cap: 2000000,
      ownerBalance: 500000,
      blockNumber: 12345,
      timestamp: Math.floor(Date.now() / 1000),
      owner: Fr.e("123456789"),
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);

    expect(witness[1].toString()).to.equal("1");
  });

  it("should reject invalid token state (supply > cap)", async () => {
    const input = {
      totalSupply: 2500000,
      cap: 2000000,
      ownerBalance: 500000,
      blockNumber: 12345,
      timestamp: Math.floor(Date.now() / 1000),
      owner: Fr.e("123456789"),
    };

    let error = false;
    try {
      const witness = await circuit.calculateWitness(input);
      const output = witness[1];
      expect(output).to.equal(0n);
      error = true;
    } catch (err) {
      error = true;
      expect(err.message).to.include("Error: Assert Failed");
    }
    expect(error).to.be.true;
  });

  it("should reject invalid token state (cap = 0)", async () => {
    const input = {
      totalSupply: 1000000,
      cap: 0,
      ownerBalance: 500000,
      blockNumber: 12345,
      timestamp: Math.floor(Date.now() / 1000),
      owner: Fr.e("123456789"),
    };

    let error = false;
    try {
      const witness = await circuit.calculateWitness(input);
      const output = witness[1];
      expect(output).to.equal(0n);
      error = true;
    } catch (err) {
      error = true;
      expect(err.message).to.include("Error: Assert Failed");
    }
    expect(error).to.be.true;
  });
});
