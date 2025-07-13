const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuração básica
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Adicionar dependência do multer para upload de arquivos
const multer = require('multer');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = 'menu_' + Date.now() + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Rota de upload de imagem
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  // URL acessível pelo frontend
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// Servir arquivos da pasta uploads
app.use('/uploads', express.static(uploadDir));

// Servir arquivos estáticos do build
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('Servindo arquivos estáticos do diretório dist');
} else {
  console.log('Diretório dist não encontrado - executando apenas API');
}

// Dados padrão da loja
const defaultStoreConfig = {
  name: 'Pizzaria Delícia',
  greeting: 'Olá! Seja bem-vindo à Pizzaria Delícia. Digite o número da opção desejada:\n1. Ver Cardápio 📖\n2. Ver Promoções 🔥',
  deliveryFee: 5.00,
  pixKey: 'contato@pizzariadelicia.com.br',
  address: 'Rua das Pizzas, 123 - Centro - Cidade Exemplo',
  menuImage: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800'
};

const defaultCategories = [
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
  },
  {
    id: '2',
    name: 'Bebidas',
    products: [
      {
        id: '3',
        name: 'Coca-Cola 2L',
        price: 8.00,
        image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
        categoryId: '2'
      }
    ]
  }
];

// Estado global
let storeConfig = { ...defaultStoreConfig };
let categories = [...defaultCategories];
let promotions = [];
let orders = [];
let customerSessions = [];

// Rotas da API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Bot API'
  });
});

app.get('/', (req, res) => {
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.json({ 
      status: 'ok', 
      message: 'WhatsApp Bot API está funcionando!',
      timestamp: new Date().toISOString()
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('=== CLIENTE CONECTADO ===');
  console.log('Socket ID:', socket.id);

  // Enviar dados iniciais
  socket.emit('store-data', {
    config: storeConfig,
    categories: categories,
    promotions: promotions,
    orders: orders
  });

  // Atualizar dados da loja
  socket.on('update-store-data', (data) => {
    console.log('=== ATUALIZANDO DADOS DA LOJA ===');
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    if (data.config) {
      console.log('Atualizando configurações...');
      storeConfig = { ...storeConfig, ...data.config };
    }
    if (data.categories) {
      console.log('Atualizando categorias...');
      categories = data.categories;
    }
    if (data.promotions) {
      console.log('Atualizando promoções...');
      promotions = data.promotions;
    }
    if (data.orders) {
      console.log('Atualizando pedidos...');
      orders = data.orders;
    }
    console.log('=== DADOS ATUALIZADOS ===');
  });

  socket.on('disconnect', () => {
    console.log('=== CLIENTE DESCONECTADO ===');
    console.log('Socket ID:', socket.id);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 WhatsApp Bot API iniciado`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
}); 