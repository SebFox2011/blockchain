import { expect } from "chai";
import { calculateHash, isBlockchainValid } from "../src/crypto.js";

describe("isBlockchainValid", () => {
  it("devrait retourner faux si la blockchain est vide", () => {
    const blockchain = [];
    const result = isBlockchainValid(blockchain);

    expect(result.isValid).to.be.false;
    expect(result.errorMessageBlockChain).to.equal("La blockchain est vide");
  });

  it("devrait retourner faux si le premier bloc n'est pas le bloc Genesis", () => {
    const blockchain = [
      {
        index: 1,
        timestamp: '2024-11-26T11:16:30.657Z',
        data: {},
        previousHash: "",
        nonce: 0,
        hash: "abcd",
      },
    ];
    const result = isBlockchainValid(blockchain);

    expect(result.isValid).to.be.false;
    expect(result.errorMessageBlockChain).to.equal(
      "Le premier bloc n'est pas le bloc Genesis"
    );
  });

  it("devrait retourner vrai pour une blockchain valide avec un seul bloc (Genesis)", () => {
    const genesisBlock = {
      index: 0,
      timestamp: '2024-11-26T11:16:30.657Z',
      data: { message: "Genesis Block" },
      previousHash: "0",
      nonce: 0,
      hash: calculateHash(0, '2024-11-26T11:16:30.657Z', { message: "Genesis Block" }, "0", 0),
    };
    const blockchain = [genesisBlock];
    const result = isBlockchainValid(blockchain);

    expect(result.isValid).to.be.true;
  });

  it("devrait retourner vrai pour une blockchain valide avec plusieurs blocs", () => {
    const genesisBlock = {
      index: 0,
      timestamp: '2024-11-26T11:16:30.657Z',
      data: { message: "Genesis Block" },
      previousHash: "0",
      nonce: 0,
      hash: calculateHash(0, '2024-11-26T11:16:30.657Z', { message: "Genesis Block" }, "0", 0),
    };
    const block2 = {
      index: 1,
      timestamp: '2024-11-26T15:36:30.657Z',
      data: { transaction: "Alice pays Bob" },
      previousHash: genesisBlock.hash,
      nonce: 1,
      hash: calculateHash(
        1,
        '2024-11-26T15:36:30.657Z',
        { transaction: "Alice pays Bob" },
        genesisBlock.hash,
        1
      ),
    };
    const blockchain = [genesisBlock, block2];
    const result = isBlockchainValid(blockchain);

    expect(result.isValid).to.be.true;
  });

  it("devrait retourner faux si un bloc a un hash incorrect", () => {
    const genesisBlock = {
      index: 0,
      timestamp: '2024-11-26T11:16:30.657Z',
      data: { message: "Genesis Block" },
      previousHash: "0",
      nonce: 0,
      hash: calculateHash(0, '2024-11-26T11:16:30.657Z', { message: "Genesis Block" }, "0", 0),
    };
    const block2 = {
      index: 1,
      timestamp: '2024-11-26T15:36:30.657Z',
      data: { transaction: "Alice pays Bob" },
      previousHash: genesisBlock.hash,
      nonce: 1,
      hash: "invalid_hash",
    };
    const blockchain = [genesisBlock, block2];
    const result = isBlockchainValid(blockchain);

    expect(result.isValid).to.be.false;
    expect(result.errorMessageBlockChain).to.equal(
      "Le hash du bloc #1 est invalide"
    );
  });

  it("devrait retourner faux si un bloc a un previousHash incorrect", () => {
    const genesisBlock = {
      index: 0,
      timestamp: '2024-11-26T11:16:30.657Z',
      data: { message: "Genesis Block" },
      previousHash: "0",
      nonce: 0,
      hash: calculateHash(0, '2024-11-26T11:16:30.657Z', { message: "Genesis Block" }, "0", 0),
    };
    const block2 = {
      index: 1,
      timestamp: '2024-11-26T15:36:30.657Z',
      data: { transaction: "Alice pays Bob" },
      previousHash: "invalid_previous_hash",
      nonce: 1,
      hash: calculateHash(
        1,
        '2024-11-26T15:36:30.657Z',
        { transaction: "Alice pays Bob" },
        "invalid_previous_hash",
        1
      ),
    };
    const blockchain = [genesisBlock, block2];
    const result = isBlockchainValid(blockchain);

    expect(result.isValid).to.be.false;
    expect(result.errorMessageBlockChain).to.equal(
      "Le bloc #1 a un previousHash invalide"
    );
  });
});
