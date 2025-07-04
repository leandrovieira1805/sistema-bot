import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import whatsapp from 'whatsapp-web.js';
import qrcode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client, LocalAuth } = whatsapp;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3002;

// Configurações para funcionar no Railway
app.set('trust proxy', 1);
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Servir arquivos estáticos do build
app.use(express.static(path.join(__dirname, 'dist')));

// Dados de usuários
let users = [
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

// Variáveis do WhatsApp
let whatsappClient = null;
let isAuthenticated = false;
let isInitializing = false;

// Rota de teste para verificar se o servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rotas de autenticação
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

// Rota para servir o index.html - deve ser a última rota
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Rota catch-all para SPA - deve ser a última rota
app.get('*', (req, res) => {
  // Verificar se é uma requisição para API
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint não encontrado' });
  }
  
  // Para todas as outras rotas, servir o index.html
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Socket.IO para WhatsApp
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('init-whatsapp', async () => {
    try {
      if (isInitializing) return;
      
      isInitializing = true;
      
      whatsappClient = new Client({
        authStrategy: new LocalAuth({
          dataPath: './whatsapp_auth',
        }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      whatsappClient.on('qr', async (qr) => {
        const qrCodeDataUrl = await qrcode.toDataURL(qr);
        socket.emit('qr-code', qrCodeDataUrl);
        socket.emit('whatsapp-status', { connected: false, status: 'qr_received' });
      });

      whatsappClient.on('ready', () => {
        isAuthenticated = true;
        isInitializing = false;
        socket.emit('whatsapp-status', { connected: true, status: 'ready' });
      });

      whatsappClient.on('disconnected', () => {
        whatsappClient = null;
        isAuthenticated = false;
        isInitializing = false;
        socket.emit('whatsapp-status', { connected: false, status: 'disconnected' });
      });

      await whatsappClient.initialize();
    } catch (error) {
      console.error('Erro ao inicializar WhatsApp:', error);
      isInitializing = false;
      socket.emit('error', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=== SERVIDOR INICIADO ===`);
  console.log(`Porta: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Railway URL: ${process.env.RAILWAY_STATIC_URL || 'N/A'}`);
}); 