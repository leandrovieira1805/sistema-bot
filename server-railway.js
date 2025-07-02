import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3002;

// Configurações básicas
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Dados de usuários
const users = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@exemplo.com',
    password: 'admin123',
    storeConfig: {
      name: 'Pizzaria Delícia',
      greeting: 'Olá! Seja bem-vindo à Pizzaria Delícia. Digite o número da opção desejada:\n1. Ver Cardápio 📖\n2. Ver Promoções 🔥',
      deliveryFee: 5.00,
      pixKey: 'contato@pizzariadelicia.com.br',
      address: 'Rua das Pizzas, 123 - Centro - Cidade Exemplo',
      menuImage: 'https://exemplo.com/cardapio.jpg'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota de login
app.post('/api/auth/login', (req, res) => {
  console.log('Tentativa de login:', req.body);
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username e password são obrigatórios' });
  }
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    console.log('Login bem-sucedido para:', username);
    res.json(userWithoutPassword);
  } else {
    console.log('Login falhou para:', username);
    res.status(401).json({ message: 'Usuário ou senha inválidos' });
  }
});

// Rota para obter usuário atual
app.get('/api/auth/me', (req, res) => {
  const userId = req.headers['user-id'];
  const user = users.find(u => u.id === userId);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ message: 'Usuário não autenticado' });
  }
});

// Rota para obter configurações do usuário
app.get('/api/user/:userId/config', (req, res) => {
  const { userId } = req.params;
  const user = users.find(u => u.id === userId);
  
  if (user) {
    res.json(user.storeConfig);
  } else {
    res.status(404).json({ message: 'Usuário não encontrado' });
  }
});

// Rota para atualizar configurações do usuário
app.put('/api/user/:userId/config', (req, res) => {
  const { userId } = req.params;
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    users[userIndex].storeConfig = { ...users[userIndex].storeConfig, ...req.body };
    users[userIndex].updatedAt = new Date();
    res.json(users[userIndex].storeConfig);
  } else {
    res.status(404).json({ message: 'Usuário não encontrado' });
  }
});

// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Socket.IO básico
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`=== SERVIDOR RAILWAY INICIADO ===`);
  console.log(`Porta: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 