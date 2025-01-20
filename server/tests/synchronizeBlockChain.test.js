import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";
import { rebuildChain, synchronizeBlockChain } from "../src/crypto.js";

describe("synchronizeBlockChain", () => {
  let axiosGetStub;
  let rebuildChainStub;

  beforeEach(() => {
    axiosGetStub = sinon.stub(axios, "get");
    rebuildChainStub = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("devrait récupérer les blocs de tous les pairs", async () => {
    const peers = ["http://peer1", "http://peer2"];
    const blockchain = [];

    axiosGetStub
      .onFirstCall()
      .resolves({
        _id: "block1",
        timestamp: "2024-11-01T00:00:00Z",
        data: {},
        nonce: 0,
      });
    axiosGetStub
      .onSecondCall()
      .resolves({
        _id: "block2",
        timestamp: "2024-11-01T00:01:00Z",
        data: {},
        nonce: 0,
      });

    rebuildChainStub.resolves([
      ...blockchain,
      {
        _id: "block1",
        timestamp: "2024-11-01T00:00:00Z",
        data: {},
        nonce: 0,
      },
      {
        _id: "block2",
        timestamp: "2024-11-01T00:01:00Z",
        data: {},
        nonce: 0,
      },
    ]);

    const result = await synchronizeBlockChain(blockchain, peers);

    expect(axiosGetStub.callCount).to.equal(peers.length);
    expect(axiosGetStub.firstCall.args[0]).to.equal("http://peer1/blocks");
    expect(axiosGetStub.secondCall.args[0]).to.equal("http://peer2/blocks");
    expect(result).to.deep.equal([ {
        _id: "block1",
        timestamp: "2024-11-01T00:00:00Z",
        data: {},
        nonce: 0,
      }, {
        _id: "block2",
        timestamp: "2024-11-01T00:01:00Z",
        data: {},
        nonce: 0,
      }]);
  });

  it("devrait ignorer les blocs dupliqués", async () => {
    const peers = ["http://peer1", "http://peer2"];
    const blockchain = [ {
        _id: "block1",
        timestamp: "2024-11-01T00:00:00Z",
        data: {},
        nonce: 0,
      }];

    axiosGetStub
      .onFirstCall()
      .resolves({ data: [ {
        _id: "block1",
        timestamp: "2024-11-01T00:00:00Z",
        data: {},
        nonce: 0,
      }, {
        _id: "block2",
        timestamp: "2024-11-01T00:01:00Z",
        data: {},
        nonce: 0,
      }] });
    axiosGetStub
      .onSecondCall()
      .resolves({ data: [{
        _id: "block2",
        timestamp: "2024-11-01T00:01:00Z",
        data: {},
        nonce: 0,
      }, {
        _id: "block3",
        timestamp: "2024-11-01T00:02:00Z",
        data: {},
        nonce: 0,
      }] });

    rebuildChainStub.resolves([
      {
        _id: "block1",
        timestamp: "2024-11-01T00:00:00Z",
        data: {},
        nonce: 0,
      },
      {
        _id: "block2",
        timestamp: "2024-11-01T00:01:00Z",
        data: {},
        nonce: 0,
      },
      {
        _id: "block3",
        timestamp: "2024-11-01T00:02:00Z",
        data: {},
        nonce: 0,
      },
    ]);

    const result = await synchronizeBlockChain(blockchain, peers);

    expect(result).to.deep.equal([
       {
        _id: "block1",
        timestamp: "2024-11-01T00:00:00Z",
        data: {},
        nonce: 0,
      },
      {
        _id: "block2",
        timestamp: "2024-11-01T00:01:00Z",
        data: {},
        nonce: 0,
      },
      {
        _id: "block3",
        timestamp: "2024-11-01T00:02:00Z",
        data: {},
        nonce: 0,
      },
    ]);
  });

  it("devrait gérer les erreurs de connexion pour certains pairs", async () => {
    const peers = ["http://peer1", "http://peer2"];
    const blockchain = [];

    axiosGetStub.onFirstCall().rejects(new Error("Connexion refusée"));
    axiosGetStub.onSecondCall().resolves({ data: [{
        _id: "block2",
        timestamp: "2024-11-01T00:01:00Z",
        data: {},
        nonce: 0,
      }] });

    rebuildChainStub.resolves([{
        _id: "block2",
        timestamp: "2024-11-01T00:01:00Z",
        data: {},
        nonce: 0,
      }]);

    const result = await synchronizeBlockChain(blockchain, peers);

    expect(axiosGetStub.callCount).to.equal(peers.length);
    expect(result).to.deep.equal([{
        _id: "block2",
        timestamp: "2024-11-01T00:01:00Z",
        data: {},
        nonce: 0,
      }]);
  });

  it("devrait appeler rebuildChain avec les blocs fusionnés et la blockchain existante", async () => {
    const peers = ["http://peer1"];
    const blockchain = [ {
        _id: "block1",
        timestamp: "2024-11-01T00:00:00Z",
        data: {},
        nonce: 0,
      }];

    axiosGetStub.resolves({ data: [{
        _id: "block2",
        timestamp: "2024-11-01T00:01:00Z",
        data: {},
        nonce: 0,
      }] });

    rebuildChainStub.resolves([...blockchain, {
        _id: "block2",
        timestamp: "2024-11-01T00:01:00Z",
        data: {},
        nonce: 0,
      }]);

    await synchronizeBlockChain(blockchain, peers);

    expect(rebuildChainStub.calledOnce).to.be.true;
    expect(rebuildChainStub.firstCall.args[0]).to.deep.equal([
      {
        _id: "block2",
        timestamp: "2024-11-01T00:01:00Z",
        data: {},
        nonce: 0,
      },
    ]);
    expect(rebuildChainStub.firstCall.args[1]).to.deep.equal(blockchain);
  });
});
