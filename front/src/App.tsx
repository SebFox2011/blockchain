import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Stack,
} from '@mui/material';

interface User {
  name: string;
  email: string;
  balance: number;
  port?: number;
}

interface Block {
  index: number;
  timestamp: string;
  previousHash: string;
  hash: string;
}

const portMapping: Record<string, number> = {
  'Utilisateur 1': 3000,
  'Utilisateur 2': 3001,
  'Utilisateur 3': 3002,
};

const App: React.FC = () => {
  const [port, setPort] = useState<number>(3000);
  const [users, setUsers] = useState<User[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchBlocks();
    checkValidity();
  }, [port]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`http://localhost:${port}/users`);
      if (res.ok) {
        const data: User[] = await res.json();
        data.sort((a, b) => a.name.localeCompare(b.name));
        data.forEach((u) => (u.port = portMapping[u.name]));
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBlocks = async () => {
    try {
      const res = await fetch(`http://localhost:${port}/blocks`);
      if (res.ok) {
        setBlocks(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBalances = async (): Promise<Record<string, number>> => {
    const res = await fetch(`http://localhost:${port}/users`);
    const data: User[] = await res.json();
    const balances: Record<string, number> = {};
    data.forEach((u) => {
      balances[u.name] = u.balance;
    });
    return balances;
  };

  const updateUser = async (user: User, amount: number) => {
    if (!amount) return;
    const action = amount > 0 ? `Ajouté ${amount}€` : `Retiré ${-amount}€`;
    const balances = await fetchBalances();
    balances[user.name] += amount;

    await fetch(`http://localhost:${user.port ?? port}/addBlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, action, balances }),
    });

    await fetch(`http://localhost:${user.port ?? port}/updateUser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, action, amount }),
    });

    setAmounts((prev) => ({ ...prev, [user.email]: 0 }));
    fetchUsers();
    fetchBlocks();
    checkValidity();
  };

  const handleAmountChange = (email: string, value: number) => {
    setAmounts((prev) => ({ ...prev, [email]: value }));
  };

  const checkValidity = async () => {
    try {
      const res = await fetch(`http://localhost:${port}/isBlockchainValid`);
      if (res.ok) {
        const { isValid } = await res.json();
        setIsValid(isValid);
      } else {
        setIsValid(false);
      }
    } catch {
      setIsValid(false);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Soldes
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Port sélectionné: {port} - Blockchain {isValid ? 'valide' : 'invalide'}
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start">
        <Box flex={1}>
          <Typography variant="h5">Utilisateurs</Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {users.map((user) => (
              <Card key={user.email} variant="outlined">
                <CardContent>
                  <Typography variant="h6">{user.name}</Typography>
                  <Typography variant="body2" gutterBottom>
                    {user.email}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Solde : {user.balance} €
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      type="number"
                      size="small"
                      value={amounts[user.email] || ''}
                      onChange={(e) => handleAmountChange(user.email, Number(e.target.value))}
                    />
                    <Button variant="contained" onClick={() => updateUser(user, amounts[user.email] || 0)}>
                      +
                    </Button>
                    <Button variant="outlined" onClick={() => updateUser(user, -(amounts[user.email] || 0))}>
                      -
                    </Button>
                    <Button variant="text" onClick={() => setPort(user.port ?? port)}>
                      Choisir
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
        <Box flex={1}>
          <Typography variant="h5">Blockchain</Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {blocks.map((block) => (
              <Card key={block.hash} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1">
                    #{block.index} - {new Date(block.timestamp).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">Hash: {block.hash}</Typography>
                  <Typography variant="body2">Précedent: {block.previousHash}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default App;
