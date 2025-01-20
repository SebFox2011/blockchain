import { expect } from "chai";
import { calculateHash } from "../src/crypto.js";
import crypto from "crypto";

describe("calculateHash", () => {
  it("devrait retourner un hash SHA-256 valide", () => {
    const index = 1;
    const timestamp = '2024-11-26T11:16:30.657Z';
    const data = { user: "Alice", action: "send", amount: 10 };
    const previousHash = "0000abcdef";
    const nonce = 12345;

    const blockString = `${index}${timestamp}${JSON.stringify(
      data
    )}${previousHash}${nonce}`;
    const expectedHash = crypto
      .createHash("sha256")
      .update(blockString)
      .digest("hex");

    const result = calculateHash(index, timestamp, data, previousHash, nonce);
    expect(result).to.equal(expectedHash);
  });

  it("devrait produire des résultats différents si un paramètre change", () => {
    const index = 1;
    const timestamp = '2024-11-26T11:16:30.657Z';
    const data = { user: "Alice", action: "send", amount: 10 };
    const previousHash = "0000abcdef";
    const nonce = 12345;

    const hash1 = calculateHash(index, timestamp, data, previousHash, nonce);

    const differentNonce = 54321;
    const hash2 = calculateHash(
      index,
      timestamp,
      data,
      previousHash,
      differentNonce
    );

    expect(hash1).to.not.equal(hash2);
  });

  it("devrait être déterministe (mêmes entrées, même hash)", () => {
    const index = 1;
    const timestamp = '2024-11-26T11:16:30.657Z';
    const data = { user: "Alice", action: "send", amount: 10 };
    const previousHash = "0000abcdef";
    const nonce = 12345;

    const hash1 = calculateHash(index, timestamp, data, previousHash, nonce);
    const hash2 = calculateHash(index, timestamp, data, previousHash, nonce);

    expect(hash1).to.equal(hash2);
  });

  describe("calculateHash - Parameter Validation", () => {
    it("devrait lancer une erreur si 'index' est manquant ou invalide", () => {
      expect(() =>
        calculateHash(undefined, '2024-11-26T11:16:30.657Z', {}, "0000abcdef", 0)
      ).to.throw("Invalid index: must be a non-negative number.");
      expect(() => calculateHash(-1, '2024-11-26T11:16:30.657Z', {}, "0000abcdef", 0)).to.throw(
        "Invalid index: must be a non-negative number."
      );
    });

    it("devrait lancer une erreur si 'timestamp' est manquant ou invalide", () => {
      expect(() => calculateHash(0, undefined, {}, "0000abcdef", 0)).to.throw(
        "Invalid timestamp: must be a string."
      );
      expect(() => calculateHash(0, -123456, {}, "0000abcdef", 0)).to.throw(
        "Invalid timestamp: must be a string."
      );
    });

    it("devrait lancer une erreur si 'data' est manquant ou invalide", () => {
      expect(() =>
        calculateHash(0, '2024-11-26T11:16:30.657Z', null, "0000abcdef", 0)
      ).to.throw("Invalid data: must be a non-null object.");
      expect(() =>
        calculateHash(0, '2024-11-26T11:16:30.657Z', "invalid", "0000abcdef", 0)
      ).to.throw("Invalid data: must be a non-null object.");
    });

    it("devrait lancer une erreur si 'previousHash' est manquant ou invalide", () => {
      expect(() => calculateHash(0, '2024-11-26T11:16:30.657Z', {}, undefined, 0)).to.throw(
        "Invalid previousHash: must be a string."
      );
      expect(() => calculateHash(0, '2024-11-26T11:16:30.657Z', {}, 12345, 0)).to.throw(
        "Invalid previousHash: must be a string."
      );
    });

    it("devrait lancer une erreur si 'nonce' est manquant ou invalide", () => {
      expect(() =>
        calculateHash(0, '2024-11-26T11:16:30.657Z', {}, "0000abcdef", undefined)
      ).to.throw("Invalid nonce: must be a number.");
      expect(() =>
        calculateHash(0, '2024-11-26T11:16:30.657Z', {}, "0000abcdef", "123")
      ).to.throw("Invalid nonce: must be a number.");
    });
  });

});
