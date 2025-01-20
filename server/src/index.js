import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import { isBlockchainValid, mineBlock,synchronizeBlockChain } from "./crypto.js";
import { firstBlock,users } from "./initBdd.js";

const app = express();
let port = 3000;
let bddIndex = 0;

process.argv.forEach((val, index)=> {
  if(index === 2){
    port = val || 3000;
  }
  else if(index === 3){
    bddIndex = val || 0;
  }
});

// Liste des pairs (autres nœuds)
const peersList = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];

const peers = peersList.filter((peer) => peer !== `http://localhost:${port}`);

// Middleware
app.use(bodyParser.json());
// Cors
app.use(cors());

// Connexion à MongoDB (Remplacez par votre URI MongoDB)
mongoose
  .connect(`mongodb://127.0.0.1:27017/blockchain6-${bddIndex}`)
  .then(() => console.log(`Connecté à MongoDB blockchain6-${bddIndex}`))
  .catch((err) => console.log("Erreur de connexion à MongoDB:", err));

const blockSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    timestamp: { type: String, required: true },
    data: {
      user: { type: Object, required: true },
      action: { type: String, required: true },
      balances: {
        type: Object, // Les soldes des utilisateurs sont des nombres
        required: true,
      },
    },
    previousHash: { type: String, required: true },
    hash: { type: String, required: true },
    nonce: { type: Number, required: true }, // Nouveau champ pour le Proof of Work
  },
  {
    versionKey: false, // You should be aware of the outcome after set to false
  }
);

// Modèle Blockchain
const Block = mongoose.model("Block", blockSchema);

// Schéma Utilisateur
const   userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    balance: Number,
    history: [
      {
        action: String,
        timestamp: String,
      },
    ],
  },
  {
    versionKey: false, // You should be aware of the outcome after set to false
  }
);

// Modèle Utilisateur
const User = mongoose.model("User", userSchema);

// Route pour ajouter un bloc
app.post("/addBlock", async (req, res) => {
  try {
    const { user, action, balances } = req.body;

    // Récupérer le dernier bloc pour obtenir son hash
    const blocks = await Block.find().sort({ index: -1 }).limit(1);
    const previousBlock = blocks[0] || { hash: "0", index: 0 };

    const timestamp = new Date().toISOString();

    // Définir la difficulté (ex. : 4 zéros)
    const difficulty = 4;

    // Miner le bloc
    const { hash, nonce } = mineBlock(
      previousBlock.index + 1,
      timestamp,
      {
        user,
        action,
        balances,
      },
      previousBlock.hash,
      difficulty
    );

    // Créer un nouveau bloc
    const newBlock = new Block({
      index: previousBlock.index + 1,
      timestamp,
      data: {
        user, // Utilisateur initiant l'action
        action, // Description de l'action (ex. : paiement)
        balances, // Soldes actualisés
      },
      previousHash: previousBlock.hash,
      hash,
      nonce,
    });

    // Ajouter le bloc à la base MongoDB
    await newBlock.save();
    res.status(200).json(newBlock);
  } catch (error) {
    console.error("Erreur lors de l'ajout du bloc :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour obtenir tous les blocs
app.get("/blocks", async (req, res) => {
  try {
    const blocks = await Block.find().sort({ index: -1 });
    res.status(200).json(blocks);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des blocs" });
  }
});

// Ajouter un bloc reçu d’un autre nœud
app.post("/receiveBlock", async (req, res) => {
  const receivedBlock = req.body;
  const lastBlock = await Block.findOne().sort({ index: -1 });

  if (lastBlock.hash === receivedBlock.previousHash) {
    // Vérifie que le nouveau bloc est valide
    await Block.create(receivedBlock);
    res.json({ message: "Bloc ajouté avec succès" });
  } else {
    res.status(400).json({ error: "Bloc non valide ou non aligné" });
  }
});

// Synchroniser la blockchain (récupère des peers)
// par fusion des chaînes locales et distantes
app.get("/sync", async (req, res) => {
  try {
    const blockchain = await Block.find().sort({ index: 1 }).lean();
    const mergedChain = await synchronizeBlockChain(blockchain, peers);

    if (isBlockchainValid(mergedChain)) {
      const newBlockchain = mergedChain; // Remplacer la chaîne locale
      Block.deleteMany({}).then(() => {
        Block.insertMany(newBlockchain);
        console.log("Chaîne fusionnée avec succès !");
        res.json({ message: "Synchronisation terminée", newBlockchain });
      });
    } else {
      console.error("La chaîne fusionnée est invalide !");
    }
  } catch (error) {
    console.error("Erreur lors de la synchronisation:", error.message);
    res.status(500).json({ error: "Erreur lors de la synchronisation" });
  }
});

// Route pour récupérer le dernier bloc
app.get("/lastBlock", async (req, res) => {
  try {
    const lastBlock = await Block.findOne().sort({ index: -1 }); // Tri décroissant par index
    res.status(200).json(lastBlock);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du dernier bloc" });
  }
});

// Route pour récupérer tous les utilisateurs
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des utilisateurs" });
  }
});

// Route pour mettre à jour un utilisateur
app.post("/updateUser", async (req, res) => {
  const { email, action, amount } = req.body;

  try {
    // Trouver l'utilisateur par email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    // Mettre à jour le solde et l'historique
    user.balance += amount;
    user.history.push({ action, timestamp: new Date().toISOString() });
    await user.save();

    res.status(200).json(user);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
  }
});

// Route pour vérifier la validité de la blockchain
app.get("/isBlockchainValid", async (req, res) => {
  try {
    const blockchain = await Block.find().sort({ index: 1 }).lean();
    const { isValid, errorMessageBlockChain } = isBlockchainValid(blockchain);
    res.statusMessage = errorMessageBlockChain;
    if (isValid) {
      res.status(200).json();
    } else {
      res.status(400).json({ isValid, error: errorMessageBlockChain });
    }
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de la vérification de la chaîne" });
  }
});

async function initializeUsers() {
  const existingUsers = await User.countDocuments();
  if (existingUsers === 0) {
    await User.insertMany(users);
    console.log("Utilisateurs initiaux créés !");
  }
}

async function initializeBlockchain() {
  const existingBlockchain = await Block.countDocuments();
  if (existingBlockchain === 0) {
    const block = new Block(firstBlock(port));
    await block.save();
    console.log("Blockchain initialisée !");
  }
}

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur Node.js démarré sur http://localhost:${port}`);
});

initializeUsers();
initializeBlockchain();
