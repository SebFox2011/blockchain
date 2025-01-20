import { calculateHash } from "./crypto.js";
export const users = [
  {
    name: "Utilisateur 1",
    email: "utilisateur1@example.com",
    balance: 0,
    history: [],
  },
  {
    name: "Utilisateur 2",
    email: "utilisateur2@example.com",
    balance: 0,
    history: [],
  },
  {
    name: "Utilisateur 3",
    email: "utilisateur3@example.com",
    balance: 0,
    history: [],
  }
];

export const firstBlock = (port) => {
  const timestamp = new Date().toISOString();
  const data = {
    user: `System ${port}`,
    action: `Initialisation de la blockchain ${port}`,
    balances: {
      " System": 0,
    },
  };
  return {
    index: 0,
    timestamp,
    data,
    previousHash: "0",
    hash: calculateHash(0, timestamp, data,"0", 0),
    nonce: 0,
  };
};
