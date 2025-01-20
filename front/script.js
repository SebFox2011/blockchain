// Description: Script pour la gestion des soldes des utilisateurs et de la blockchain
// Auteur: Sébastien PHILIPPE
// Date: 01/06/2021

let port = 3000;

// Fonction pour ajouter un bloc à la blockchain
async function addBlock(user, action, balances) {
  try {
    const response = await fetch(`http://localhost:${port}/addBlock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user, action, balances }),
    });
    const newBlock = await response.json();

    // Afficher le bloc ajouté
    displayBlock(newBlock);
  } catch (error) {
    console.error("Erreur de communication avec le serveur:", error);
  }
}

// Fonction pour récupérer les utilisateurs depuis MongoDB
async function fetchUsers() {
  try {
    const response = await fetch(`http://localhost:${port}/users`);
    if (response.ok) {
      const users = await response.json();
      users.sort((a, b) => a.name.localeCompare(b.name)); // Trier par nom
      for (const user of users) {
        for (const user of users) {
          if (user.name === "Utilisateur 1") {
            user.port = 3000;
          } else if (user.name === "Utilisateur 2") {
            user.port = 3001;
          } else if (user.name === "Utilisateur 3") {
            user.port = 3002;
          }
          displayUsers(users); // Réafficher les utilisateurs
        }
      }
      displayUsers(users); // Réafficher les utilisateurs
    } else {
      console.error("Erreur lors de la récupération des utilisateurs");
    }
  } catch (err) {
    console.error("Erreur de communication avec le serveur:", err);
  }
}

// Fonction pour mettre à jour un utilisateur
async function updateUser(email, action, amount) {
  try {
    const response = await fetch(`http://localhost:${port}/updateUser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, action, amount }),
    });

    if (response.ok) {
      fetchUsers(); // Recharger les utilisateurs après mise à jour
    } else {
      console.error("Erreur lors de la mise à jour de l'utilisateur");
    }
  } catch (err) {
    console.error("Erreur de communication avec le serveur:", err);
  }
}

// Fonction pour payer un forfait
async function pay(user, amount, action) {
  const balances = await fetchBalances(); // Récupère les soldes actuels des utilisateurs
  balances[user.name] += amount;

  await addBlock(user, action, balances);
  await updateUser(user.email, action, amount);
  port = user.port;
  initializeBlockchain();
}

// Fonction pour afficher les utilisateurs sur la page
function displayUsers(users) {
  const usersContainer = document.getElementById("usersContainer");
  usersContainer.innerHTML = ""; // Réinitialiser le contenu
  if (users.length > 0) {
    users.forEach((user, index) => {
      // Créer les éléments HTML pour chaque utilisateur
      const userDiv = document.createElement("div");
      userDiv.className = "user";

      // Nom et email
      const userInfo = document.createElement("p");
      userInfo.innerHTML = `<strong>${user.name}</strong> (${user.email})`;

      // Solde
      const userBalance = document.createElement("p");
      userBalance.innerHTML = `Solde : <strong>${user.balance} €</strong>`;
      userBalance.id = `balance${index}`; // ID pour mise à jour dynamique

      // Input pour le montant
      const input = document.createElement("input");
      input.type = "number";
      input.id = `input${index}`;
      input.className = "amount-input";
      input.placeholder = "Montant";

      // Boutons Ajouter et Enlever
      const addButton = document.createElement("button");
      addButton.innerText = "+";
      addButton.onclick = () => {
        const amount = Number.parseInt(input.value, 10);
        if (!Number.isNaN(amount) && amount > 0) {
          pay(user, amount, `Ajouté ${amount}€`);
          input.value = ""; // Réinitialiser l'input
        }
      };

      const removeButton = document.createElement("button");
      removeButton.innerText = "-";
      removeButton.onclick = () => {
        const amount = Number.parseInt(input.value, 10);
        if (!Number.isNaN(amount) && amount > 0) {
          pay(user, -amount, `Enlevé ${Math.abs(amount)}€`);
          input.value = ""; // Réinitialiser l'input
        }
      };

      // Menu déroulant pour les forfaits
      const select = document.createElement("select");
      select.id = `select${index}`;
      const options = [
        { text: "Forfait TV", value: -3 },
        { text: "Forfait Mobile", value: -5 },
      ];
      for (const option of options) {
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.text = option.text;
        select.add(opt);
      }

      // Bouton Payer
      const payButton = document.createElement("button");
      payButton.innerText = "Payer";
      payButton.onclick = () =>
        pay(
          user,
          Number.parseInt(select.value),
          select.options[select.selectedIndex].text
        );

      // Bouton Sync
      const syncButton = document.createElement("button");
      syncButton.innerText = "Sync";
      syncButton.onclick = () => {
        port = user.port;
        synchronizeBlocChain(user.port);
        initializeBlockchain();
      };
      // Historique des actions
      const userHistory = document.createElement("div");
      userHistory.id = `history${index}`;
      userHistory.className = "user-history";
      userHistory.innerHTML = "<strong>Historique :</strong><br>";

      for (const entry of user.history) {
        const actionDiv = document.createElement("div");
        actionDiv.innerText = `${entry.timestamp} - ${entry.action}`;
        userHistory.appendChild(actionDiv);
      }

      // Ajouter tous les éléments au conteneur utilisateur
      userDiv.appendChild(userInfo);
      userDiv.appendChild(userBalance);
      userDiv.appendChild(input);
      userDiv.appendChild(addButton);
      userDiv.appendChild(removeButton);
      userDiv.appendChild(select);
      userDiv.appendChild(payButton);
      userDiv.appendChild(syncButton);
      userDiv.appendChild(userHistory);

      // Ajouter l'utilisateur au conteneur principal
      usersContainer.appendChild(userDiv);
    });
  }
}

// Fonction pour afficher un bloc sur la page
function displayBlock(block) {
  const blockchainContainer = document.getElementById("blockchain");
  const blockDiv = document.createElement("div");
  blockDiv.classList.add("block");

  blockDiv.innerHTML = `
       <strong>Index : ${block.index}</strong>
        <p><strong>Timestamp : ${new Date(
          block.timestamp
        ).toLocaleString()}</strong> </p>
         <p><strong>Action : ${block.data.user.name} - ${
    block.data.action
  }</strong> </p>
        <p><strong>Balances :</strong> ${JSON.stringify(
          block.data.balances
        )}</p>
        <p><strong>Historique :</strong> ${JSON.stringify(block.data.user.history)}</p>
        <p><strong>Previous Hash :</strong> ${block.previousHash}</p>
        <p><strong>Hash :</strong> ${block.hash}</p>
        <p><strong>Nonce : ${block.nonce}</strong> </p>
    `;

  blockchainContainer.appendChild(blockDiv);
}

function displayBlockChain(blocks) {
  const blockchainListeContainer = document.getElementById("blockchain-list");
  blockchainListeContainer.innerHTML = ""; // Réinitialiser le contenu
  if (blocks.length > 0) {
    blocks.forEach((block, index) => {
      // Créer les éléments HTML pour chaque bloc
      const blockDiv = document.createElement("div");
      blockDiv.className = "block";

      blockDiv.innerHTML = `
        <strong>Index : ${block.index}</strong> 
        <p><strong>Timestamp : ${new Date(
          block.timestamp
        ).toLocaleString()}</strong> </p>
        <p><strong>User :  ${JSON.stringify(block.data.user.email)}</strong></p>
        <p><strong>Previous Hash :</strong> ${block.previousHash}</p>
        <p><strong>Hash :</strong> ${block.hash}</p>
        <p><strong>Nonce : ${block.nonce}</strong> </p>
    `;

      blockchainListeContainer.appendChild(blockDiv);
    });
  }
}

// Fonction pour récupérer les soldes actuels des utilisateurs
async function fetchBalances() {
  try {
    const response = await fetch(`http://localhost:${port}/users`);
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des soldes");
    }
    const users = await response.json();

    // Transformer la liste d'utilisateurs en un objet avec les soldes
    const balances = {};
    for (const user of users) {
      balances[user.name] = user.balance;
    }
    return balances;
  } catch (error) {
    console.error("Erreur de communication avec le serveur:", error);
    return {};
  }
}

// Fonction pour récupérer le dernier bloc depuis MongoDB
async function getLastBlock() {
  try {
    const response = await fetch(`http://localhost:${port}/lastBlock`);
    if (response.ok) {
      const lastBlock = await response.json();
      return lastBlock;
    }
    console.error("Erreur lors de la récupération du dernier bloc");
    return null;
  } catch (err) {
    console.error("Erreur de communication avec le serveur:", err);
    return null;
  }
}

async function fetchBlocks() {
  try {
    const response = await fetch(`http://localhost:${port}/blocks`);
    if (response.ok) {
      const blocks = await response.json();
      return blocks;
    }
    console.error("Erreur lors de la récupération des blocs");
    return [];
  } catch (err) {
    console.error("Erreur de communication avec le serveur:", err);
    return [];
  }
}

// Initialisation de la blockchain avec le dernier bloc
async function initializeBlockchain() {
  const lastBlock = await getLastBlock();
  const blocks = await fetchBlocks();

  if (lastBlock) {
    blockchain.push({
      index: lastBlock.index,
      timestamp: lastBlock.timestamp,
      data: lastBlock.data,
      previousHash: lastBlock.previousHash,
      hash: lastBlock.hash,
    });
  }
  displayBlock(lastBlock);
  displayBlockChain(blocks);
  await updateBlockchainStatus(); // Vérifie et met à jour le statut
}

// Fonction pour vérifier si la blockchain est valide
async function isBlockchainValid() {
  try {
    const response = await fetch(`http://localhost:${port}/isBlockchainValid`);
    if (response.ok) {
      const result = await response.json();
      errorMessageBlockChain = result.error;
      return result.isValid;
    }
    console.error("Erreur lors de la validation de la blockchain");
    return false;
  } catch (err) {
    console.error("Erreur de communication avec le serveur:", err);
    return false;
  }
}

// Fonction pour synchroniser la blockchain d'un utilisateur
async function synchronizeBlocChain(port) {
  try {
    const response = await fetch(`http://localhost:${port}/sync`);
    if (response.ok) {
      console.log(`Blockchain synchronisée avec succès sur le port ${port}`);
      return true;
    }
    console.error("Erreur lors de la synchronisation de la blockchain");
    return false;
  } catch (err) {
    console.error("Erreur de communication avec le serveur:", err);
    return false;
  }
}

// Fonction pour mettre à jour le statut de la blockchain
async function updateBlockchainStatus() {
  const statusIcon = document.getElementById("status-icon");
  const statusText = document.getElementById("status-text");
  const response = await fetch(`http://localhost:${port}/isBlockchainValid`);
  if (response.ok) {
    statusIcon.innerHTML = "✔️"; // Icône valide
    statusIcon.style.color = "green";
    statusText.innerText = `Blockchain valide sur le port ${port}`;
  } else {
    statusIcon.innerHTML = "❌"; // Icône invalide
    statusIcon.style.color = "red";
    statusText.innerText = `Blockchain invalide: ${errorMessageBlockChain} sur le port ${port}`;
  }
}

// Appeler l'initialisation lors du chargement de la page
const blockchain = [];

let errorMessageBlockChain = "";

fetchUsers(); // Charger les utilisateurs depuis MongoDB
initializeBlockchain(); // Charger la blockchain depuis MongoDB

const test = [
  {
    action: "Forfait TV",
    timestamp: "2024-11-26T19:06:16.839Z",
    _id: "67461c2888ecf52b6d507c48",
  },
  {
    action: "Ajouté 15€",
    timestamp: "2024-11-27T18:38:40.493Z",
    _id: "674767307d02db6a04766bc0",
  },
  {
    action: "Ajouté 10€",
    timestamp: "2024-11-27T18:42:13.102Z",
    _id: "674768057d02db6a04766c26",
  },
  {
    action: "Forfait TV",
    timestamp: "2024-11-27T18:42:44.600Z",
    _id: "674768247d02db6a04766c70",
  },
  {
    action: "Ajouté 10€",
    timestamp: "2024-11-27T18:42:56.720Z",
    _id: "674768307d02db6a04766cbd",
  },
  {
    action: "Ajouté 100€",
    timestamp: "2024-11-27T18:43:55.513Z",
    _id: "6747686b7d02db6a04766d99",
  },
  {
    action: "Forfait TV",
    timestamp: "2024-11-27T18:45:15.605Z",
    _id: "674768bb7d02db6a04766e71",
  },
  {
    action: "Forfait TV",
    timestamp: "2024-11-27T18:45:34.530Z",
    _id: "674768ce7d02db6a04766eed",
  },
  {
    action: "Ajouté 10€",
    timestamp: "2024-11-27T18:46:15.703Z",
    _id: "674768f77d02db6a04767001",
  },
  {
    action: "Ajouté 10€",
    timestamp: "2024-11-27T18:50:03.446Z",
    _id: "674769db697804e055cf9bd0",
  },
];
