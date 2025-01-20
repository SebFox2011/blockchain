import { expect } from "chai";
import { calculateHash,mineBlock } from "../src/crypto.js";

describe("mineBlock", () => {
  it("devrait miner un bloc avec un hash qui respecte la difficulté", () => {
    const index = 1;
    const timestamp = '2024-11-26T11:16:30.657Z';
    const data = { user: "Alice", action: "send", amount: 10 };
    const previousHash = "0000abcdef";
    const difficulty = 3;

    const result = mineBlock(index, timestamp, data, previousHash, difficulty);

    expect(result).to.have.property("hash");
    expect(result).to.have.property("nonce");
    expect(result.hash.startsWith("0".repeat(difficulty))).to.be.true;
  });

  it("devrait retourner un hash valide basé sur calculateHash", () => {
    const index = 1;
    const timestamp = '2024-11-26T11:16:30.657Z';
    const data = { user: "Bob", action: "receive", amount: 20 };
    const previousHash = "0000abcdef";
    const difficulty = 2;

    const { hash, nonce } = mineBlock(
      index,
      timestamp,
      data,
      previousHash,
      difficulty
    );

    const expectedHash = calculateHash(
      index,
      timestamp,
      data,
      previousHash,
      nonce
    );
    expect(hash).to.equal(expectedHash);
  });

  it("devrait gérer une difficulté de 1 rapidement", () => {
    const index = 1;
    const timestamp = '2024-11-26T11:16:30.657Z';
    const data = { user: "Charlie", action: "mine" };
    const previousHash = "0000abcdef";
    const difficulty = 1;

    const result = mineBlock(index, timestamp, data, previousHash, difficulty);

    expect(result.hash.startsWith("0")).to.be.true;
  });

  it("devrait fonctionner correctement avec une difficulté par défaut", () => {
    const index = 0;
    const timestamp = '2024-11-26T11:16:30.657Z';
    const data = { user: "Default", action: "default action" };
    const previousHash = "0000abcdef";

    const result = mineBlock(index, timestamp, data, previousHash);

    expect(result.hash.startsWith("0".repeat(4))).to.be.true; // Difficulté par défaut = 4
  });

  it("devrait fonctionner avec des données vides", () => {
    const index = 0;
    const timestamp = '2024-11-26T11:16:30.657Z';
    const data = {};
    const previousHash = "";
    const difficulty = 2;

    const result = mineBlock(index, timestamp, data, previousHash, difficulty);

    expect(result.hash.startsWith("0".repeat(difficulty))).to.be.true;
  });
});
