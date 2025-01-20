import { expect } from "chai";
import { rebuildChain, calculateHash } from "../src/crypto.js";

describe("rebuildChain", () => {
  it("devrait supprimer les doublons des blocs", async () => {
    const blockchain = [
      { _id: "block1", timestamp: "2024-11-01T00:00:00Z", data: {}, nonce: 0 },
    ];
    const allBlocks = [
      { _id: "block1", timestamp: "2024-11-01T00:00:00Z", data: {}, nonce: 0 },
      { _id: "block2", timestamp: "2024-11-02T00:00:00Z", data: {}, nonce: 0 },
    ];

    const result = await rebuildChain(allBlocks, blockchain);

    expect(result.length).to.equal(2);
    expect(result.map((block) => block._id)).to.deep.equal([
      "block1",
      "block2",
    ]);
  });

  it("devrait trier les blocs par timestamp", async () => {
    const blockchain = [];
    const allBlocks = [
      { _id: "block2", timestamp: "2024-11-02T00:00:00Z", data: {}, nonce: 0 },
      { _id: "block1", timestamp: "2024-11-01T00:00:00Z", data: {}, nonce: 0 },
    ];

    const result = await rebuildChain(allBlocks, blockchain);

    expect(result.map((block) => block._id)).to.deep.equal([
      "block1",
      "block2",
    ]);
  });

  it("devrait recalculer les index et les hashes pour une chaîne valide", async () => {
    const blockchain = [];
    const allBlocks = [
      { _id: "block1", timestamp: "2024-11-01T00:00:00Z", data: {}, nonce: 0 },
      { _id: "block2", timestamp: "2024-11-02T00:00:00Z", data: {}, nonce: 0 },
    ];

    const result = await rebuildChain(allBlocks, blockchain);

    expect(result[0].index).to.equal(0);
    expect(result[1].index).to.equal(1);

    expect(result[0].hash).to.equal(
      calculateHash(0, "2024-11-01T00:00:00Z", {}, "0", 0)
    );
    expect(result[1].hash).to.equal(
      calculateHash(1, "2024-11-02T00:00:00Z", {}, result[0].hash, 0)
    );
  });

  it("devrait conserver les données initiales dans la blockchain existante", async () => {
    const blockchain = [
      {
        _id: "block1",
        timestamp: "2024-11-01T00:00:00Z",
        data: { initial: true },
        nonce: 0,
      },
    ];
    const allBlocks = [
      { _id: "block2", timestamp: "2024-11-02T00:00:00Z", data: {}, nonce: 0 },
    ];

    const result = await rebuildChain(allBlocks, blockchain);

    expect(result.length).to.equal(2);
    expect(result[0].data).to.deep.equal({ initial: true });
  });

  it("devrait gérer une chaîne vide correctement", async () => {
    const blockchain = [];
    const allBlocks = [];

    const result = await rebuildChain(allBlocks, blockchain);

    expect(result).to.deep.equal([]);
  });
});
