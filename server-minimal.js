import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import whatsapp from 'whatsapp-web.js';
import qrcode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

const PORT = 3000;

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('Servindo arquivos estáticos do diretório dist');
}

let whatsappClient = null;
let isAuthenticated = false;
let isInitializing = false;
let currentQRCode = null;

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
      menuImage: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
  }
];

// Dados da loja
let storeData = {
  config: {
    name: 'Pizzaria Delícia',
    greeting: 'Olá! Seja bem-vindo à Pizzaria Delícia. Digite o número da opção desejada:\n1. Ver Cardápio 📖\n2. Ver Promoções 🔥',
    deliveryFee: 5.00,
    pixKey: 'contato@pizzariadelicia.com.br',
    address: 'Rua das Pizzas, 123 - Centro - Cidade Exemplo',
    menuImage: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  categories: [
    {
      id: '1',
      name: 'Pizzas',
      products: [
        {
          id: '1',
          name: 'Pizza de Calabresa',
          price: 45.50,
          image: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400',
          categoryId: '1'
        },
        {
          id: '2', 
          name: 'Pizza Margherita',
          price: 42.00,
          image: 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400',
          categoryId: '1'
        }
      ]
    }
  ],
  promotions: []
};

let orders = [];

// Rotas básicas
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
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

app.get('/api/user/:userId/config', (req, res) => {
  const { userId } = req.params;
  const user = users.find(u => u.id === userId);
  
  if (user) {
    res.json(user.storeConfig);
  } else {
    res.status(404).json({ message: 'Usuário não encontrado' });
  }
});

app.put('/api/user/:userId/config', (req, res) => {
  const { userId } = req.params;
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    users[userIndex].storeConfig = { ...users[userIndex].storeConfig, ...req.body };
    res.json(users[userIndex].storeConfig);
  } else {
    res.status(404).json({ message: 'Usuário não encontrado' });
  }
});

app.get('/api/store', (req, res) => {
  res.json(storeData);
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const order = {
    id: Date.now().toString(),
    ...req.body,
    status: 'NEW',
    createdAt: new Date()
  };
  orders.push(order);
  res.json(order);
});

app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const orderIndex = orders.findIndex(o => o.id === id);
  
  if (orderIndex !== -1) {
    orders[orderIndex] = { ...orders[orderIndex], ...req.body };
    res.json(orders[orderIndex]);
  } else {
    res.status(404).json({ message: 'Pedido não encontrado' });
  }
});

// Socket.IO para WhatsApp
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('init-whatsapp', async () => {
    try {
      console.log('Inicializando WhatsApp...');
      
      if (isInitializing) {
        console.log('WhatsApp já está sendo inicializado...');
        return;
      }
      
      if (whatsappClient && isAuthenticated) {
        console.log('WhatsApp já está conectado!');
        socket.emit('whatsapp-status', { 
          connected: true, 
          status: 'ready' 
        });
        return;
      }
      
      isInitializing = true;
      
      if (whatsappClient) {
        try {
          await whatsappClient.destroy();
        } catch (error) {
          console.log('Erro ao destruir cliente anterior:', error.message);
        }
        whatsappClient = null;
      }
      
      whatsappClient = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      whatsappClient.on('qr', async (qr) => {
        console.log('QR Code gerado');
        try {
          const qrCodeDataUrl = await qrcode.toDataURL(qr);
          currentQRCode = qrCodeDataUrl;
          socket.emit('qr-code', qrCodeDataUrl);
          socket.emit('whatsapp-status', { 
            connected: false, 
            status: 'qr_received' 
          });
        } catch (error) {
          console.error('Erro ao gerar QR Code:', error);
          socket.emit('error', 'Erro ao gerar QR Code');
        }
      });

      whatsappClient.on('ready', () => {
        console.log('WhatsApp pronto');
        isAuthenticated = true;
        isInitializing = false;
        currentQRCode = null;
        
        socket.emit('whatsapp-status', { 
          connected: true, 
          status: 'ready' 
        });
      });

      whatsappClient.on('message', async (message) => {
        console.log('Mensagem recebida:', message.body);
        
        socket.emit('message-received', {
          from: message.from,
          body: message.body,
          timestamp: new Date()
        });
      });

      whatsappClient.on('auth_failure', (msg) => {
        console.error('Falha na autenticação:', msg);
        whatsappClient = null;
        isAuthenticated = false;
        isInitializing = false;
        currentQRCode = null;
        
        socket.emit('whatsapp-status', { 
          connected: false, 
          status: 'auth_failed' 
        });
      });

      whatsappClient.on('disconnected', (reason) => {
        console.log('WhatsApp desconectado:', reason);
        whatsappClient = null;
        isAuthenticated = false;
        isInitializing = false;
        currentQRCode = null;
        
        socket.emit('whatsapp-status', { 
          connected: false, 
          status: 'disconnected' 
        });
      });

      await whatsappClient.initialize();
      console.log('Cliente inicializado com sucesso');

    } catch (error) {
      console.error('Erro ao inicializar WhatsApp:', error);
      
      isAuthenticated = false;
      isInitializing = false;
      whatsappClient = null;
      
      socket.emit('error', `Erro ao inicializar WhatsApp Web: ${error.message}`);
      socket.emit('whatsapp-status', { 
        connected: false, 
        status: 'error' 
      });
    }
  });

  socket.on('disconnect-whatsapp', async () => {
    try {
      console.log('Desconectando WhatsApp...');
      if (whatsappClient) {
        await whatsappClient.destroy();
        whatsappClient = null;
        isAuthenticated = false;
        isInitializing = false;
      }
      
      currentQRCode = null;
      
      socket.emit('whatsapp-status', { 
        connected: false, 
        status: 'disconnected' 
      });
    } catch (error) {
      console.error('Erro ao desconectar WhatsApp:', error);
      socket.emit('error', 'Erro ao desconectar WhatsApp');
    }
  });

  socket.on('send-message', async (data) => {
    try {
      const { to, message } = data;
      
      if (!whatsappClient || !isAuthenticated) {
        socket.emit('error', 'WhatsApp não está conectado');
        return;
      }

      const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
      await whatsappClient.sendMessage(chatId, message);
      
      socket.emit('message-sent', { success: true });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      socket.emit('error', 'Erro ao enviar mensagem');
    }
  });

  socket.on('check-status', () => {
    const isConnected = whatsappClient !== null && isAuthenticated;
    socket.emit('whatsapp-status', { 
      connected: isConnected,
      status: isConnected ? 'ready' : 'disconnected'
    });
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Rota principal
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ 
      message: 'API do WhatsApp Bot funcionando!', 
      status: 'ok'
    });
  }
});

server.listen(PORT, () => {
  console.log(`=== SERVIDOR MINIMALISTA INICIADO ===`);
  console.log(`Porta: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
}); 