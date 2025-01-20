import crypto from "crypto";
import axios from "axios";

// Fonction pour calculer le hash d'un bloc
export const calculateHash = (index, timestamp, data, previousHash, nonce) => {
  if (typeof index !== "number" || index < 0) {
    throw new Error("Invalid index: must be a non-negative number.");
  }
  if (typeof timestamp !== "string" || timestamp === "") {
    throw new Error("Invalid timestamp: must be a string.");
  }
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid data: must be a non-null object.");
  }
  if (typeof previousHash !== "string") {
    throw new Error("Invalid previousHash: must be a string.");
  }
  if (typeof nonce !== "number" || nonce === undefined) {
    throw new Error("Invalid nonce: must be a number.");
  }

  const blockString = `${index}${timestamp}${JSON.stringify(
    data
  )}${previousHash}${nonce}`;
  return crypto.createHash("sha256").update(blockString).digest("hex");
};

export const mineBlock = (
  index,
  timestamp,
  data,
  previousHash,
  difficulty = 4
) => {
  let nonce = 0;
  let hash = "";

  // Répète jusqu'à trouver un hash qui commence par le bon nombre de zéros
  do {
    nonce++;
    hash = calculateHash(index, timestamp, data, previousHash, nonce);
  } while (!hash.startsWith("0".repeat(difficulty)));

  return { hash, nonce };
};

// Fonction pour vérifier la validité d'une blockchain
// en vérifiant les hash et les previousHash de chaque bloc
// en calculant les hash à nouveau
export const isBlockchainValid = (blockschain) => {
  if (blockschain === undefined || blockschain.length === 0) {
    return { isValid: false, errorMessageBlockChain: "La blockchain est vide" };
  }
  if (blockschain[0].index !== 0) {
    return {
      isValid: false,
      errorMessageBlockChain: "Le premier bloc n'est pas le bloc Genesis",
    };
  }
  if (blockschain.length === 1) {
    return { isValid: true };
  }
  for (let i = 1; i < blockschain.length; i++) {
    const currentBlock = blockschain[i];
    const previousBlock = blockschain[i - 1];

    const currentBlockHash = calculateHash(
      currentBlock.index,
      currentBlock.timestamp,
      currentBlock.data,
      currentBlock.previousHash,
      currentBlock.nonce
    );

    if (currentBlock.hash !== currentBlockHash) {
      return {
        errorMessageBlockChain: `Le hash du bloc #${currentBlock.index} est invalide`,
        isValid: false,
      };
    }

    if (currentBlock.previousHash !== previousBlock.hash) {
      return {
        errorMessageBlockChain: `Le bloc #${currentBlock.index} a un previousHash invalide`,
        isValid: false,
      };
    }
  }
  return { isValid: true };
};

export const synchronizeBlockChain = async (blockchain, peers) => {
  const incomingBlocks = [];
  // Récupérer les blocs des pairs
  for (const peer of peers) {
    try {
      const response = await axios.get(`${peer}/blocks`);
      incomingBlocks.push(...response.data);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des blocs de ${peer}:`,
        error.message
      );
    }
  }

  // Fusionner et reconstruire une chaîne valide
  const output = incomingBlocks.reduce((acc, obj) => {
    if (!acc.some((o) => o._id === obj._id)) {
      acc.push(obj);
    }
    return acc;
  }, []);
  const mergedChain = await rebuildChain(output, blockchain);
  return mergedChain;
};

// Fonction pour reconstruire une chaîne valide
export async function rebuildChain(allBlocks, blockchain) {
  // Supprimer les doublons (basé sur les _id)
  const existingIds = blockchain.map((block) => block._id.toString());
  for (const block of allBlocks) {
    if (!existingIds.includes(block._id)) {
      blockchain.push(block);
    }
  }

  // Trier les blocs par timestamp (ou index si nécessaire)
  blockchain.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Recréer une chaîne valide avec des index cohérents
  const newChain = [];
  let previousHash = "0"; // Hash initial pour le bloc de genèse

  for (let i = 0; i < blockchain.length; i++) {
    const block = blockchain[i];

    const newBlock = {
      ...block,
      index: i, // Réattribuer l'index
      previousHash,
      hash: calculateHash(
        i,
        block.timestamp,
        block.data,
        previousHash,
        block.nonce
      ), // Recalculer le hash
    };

    newChain.push(newBlock);
    previousHash = newBlock.hash; // Mettre à jour pour le prochain bloc
  }
  return newChain;
}

// Vérifier la validité d'une chaîne, en vérifiant les previousHash
// sans recalculer les hash
function isValidChain(chain) {
  for (let i = 1; i < chain.length; i++) {
    const currentBlock = chain[i];
    const previousBlock = chain[i - 1];

    if (currentBlock.previousHash !== previousBlock.hash) {
      return false;
    }
    // Ajoute d'autres vérifications si nécessaire (comme la validation du hash)
  }
  return true;
}
