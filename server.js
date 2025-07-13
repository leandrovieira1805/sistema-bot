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

// Importar o serviço de IA
import { AIService } from './src/services/aiService.js';

// Arquivos de persistência
const STORE_DATA_FILE = path.join(__dirname, 'data', 'store-data.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

// Declarar orders antes de usar
let orders = [];

// Criar diretório data se não existir
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Funções para persistência de dados
function saveStoreData() {
  try {
    console.log('💾 Salvando configurações em:', STORE_DATA_FILE);
    console.log('📋 Dados a serem salvos:', JSON.stringify(storeData, null, 2));
    fs.writeFileSync(STORE_DATA_FILE, JSON.stringify(storeData, null, 2));
    console.log('✅ Configurações da loja salvas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar configurações:', error);
  }
}

function loadStoreData() {
  try {
    console.log('🔍 Tentando carregar configurações de:', STORE_DATA_FILE);
    if (fs.existsSync(STORE_DATA_FILE)) {
      const data = fs.readFileSync(STORE_DATA_FILE, 'utf8');
      const loadedData = JSON.parse(data);
      console.log('✅ Configurações da loja carregadas com sucesso');
      console.log('📋 Dados carregados:', JSON.stringify(loadedData, null, 2));
      return loadedData;
    } else {
      console.log('⚠️ Arquivo de configurações não encontrado, usando dados padrão');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar configurações:', error);
  }
  return null;
}

function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('✅ Usuários salvos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar usuários:', error);
  }
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      const loadedUsers = JSON.parse(data);
      console.log('✅ Usuários carregados com sucesso');
      return loadedUsers;
    }
  } catch (error) {
    console.error('❌ Erro ao carregar usuários:', error);
  }
  return null;
}

function saveOrders() {
  try {
    // Limpar pedidos antigos antes de salvar
    cleanOldOrders();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    console.log('✅ Pedidos salvos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar pedidos:', error);
  }
}

function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf8');
      const loadedOrders = JSON.parse(data);
      console.log('✅ Pedidos carregados com sucesso');
      
      // Limpar pedidos antigos ao carregar
      orders = loadedOrders;
      cleanOldOrders();
      
      return orders;
    }
  } catch (error) {
    console.error('❌ Erro ao carregar pedidos:', error);
  }
  return [];
}

// Função para limpar pedidos antigos (mais de 1 semana)
function cleanOldOrders() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const initialCount = orders.length;
  orders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate > oneWeekAgo;
  });
  
  const removedCount = initialCount - orders.length;
  if (removedCount > 0) {
    console.log(`🧹 Removidos ${removedCount} pedidos antigos (mais de 1 semana)`);
  }
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3002", "http://127.0.0.1:3002", "http://192.168.1.193:3002"], // Origens específicas
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: ["http://localhost:3002", "http://127.0.0.1:3002", "http://192.168.1.193:3002"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Configurar multer para upload de arquivos
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Configurar storage para upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}_${uuidv4()}.${file.originalname.split('.').pop()}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'), false);
    }
  }
});

// Rota para upload de imagens
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    console.log('✅ Imagem enviada com sucesso:', imageUrl);
    
    res.json({ 
      success: true, 
      url: imageUrl,
      filename: req.file.filename 
    });
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Servir arquivos estáticos do build apenas se o diretório existir
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('Servindo arquivos estáticos do diretório dist');
} else {
  console.log('Diretório dist não encontrado - executando apenas API');
}

// Servir arquivos de upload
const uploadsPath = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
  console.log('Servindo arquivos de upload do diretório uploads');
} else {
  console.log('Diretório uploads não encontrado');
}

let whatsappClient = null;
let isAuthenticated = false;
let isInitializing = false;
let qrCodeTimeout = null;
let currentQRCode = null;
let aiService = null; // Variável global para o serviço de IA

// Carregar dados salvos ou usar padrões
let users = loadUsers() || [
  {
    id: '1',
    username: 'admin',
    email: 'admin@exemplo.com',
    password: 'admin123', // Em produção, use hash bcrypt
    storeConfig: {
      name: 'Pizzaria Delícia',
      greeting: 'Olá! Seja bem-vindo à Pizzaria Delícia. Digite o número da opção desejada:\n1. Ver Cardápio 📖\n2. Ver Promoções 🔥',
      deliveryFee: 5.00,
      pixKey: 'contato@pizzariadelicia.com.br',
      address: 'Rua das Pizzas, 123 - Centro - Cidade Exemplo',
      menuImage: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    username: 'evellyn',
    email: 'evellynlavinian@gmail.com',
    password: 'evellyn.nsouza',
    storeConfig: {
      name: 'Bebidas Delícia',
      greeting: 'Olá! Seja bem-vindo à Bebidas Delícia. Digite o número da opção desejada:\n1. Ver Catálogo de Bebidas 🥤\n2. Ver Promoções 🔥',
      deliveryFee: 3.00,
      pixKey: 'evellyn@bebidasdelicia.com.br',
      address: 'Rua das Bebidas, 456 - Centro - Cidade Exemplo',
      menuImage: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Carregar dados da loja salvos ou usar padrões
console.log('🚀 Inicializando dados da loja...');
const loadedStoreData = loadStoreData();
console.log('📊 Dados carregados:', loadedStoreData ? 'SIM' : 'NÃO');

let storeData = loadedStoreData || {
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
  ],
  promotions: []
};

// Se não havia dados salvos, salvar os dados padrão
if (!loadedStoreData) {
  console.log('💾 Salvando dados padrão pela primeira vez...');
  saveStoreData();
}

// Inicializar o serviço de IA com os dados da loja
aiService = new AIService(storeData.config, getAllProducts(), storeData.promotions);
console.log('🤖 Serviço de IA inicializado com sucesso');

// Sessões de clientes
const customerSessions = new Map();

// Configurar limpeza automática de pedidos antigos (a cada 24 horas)
setInterval(() => {
  console.log('🕐 Executando limpeza automática de pedidos antigos...');
  cleanOldOrders();
  saveOrders(); // Salvar após a limpeza
}, 24 * 60 * 60 * 1000); // 24 horas em milissegundos

console.log('⏰ Limpeza automática de pedidos configurada (a cada 24 horas)');

// Carregar pedidos salvos
orders = loadOrders();

// Rotas de autenticação
app.post('/api/auth/login', (req, res) => {
  console.log('Tentativa de login:', req.body);
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Em produção, não envie a senha
    const { password: _, ...userWithoutPassword } = user;
    console.log('Login bem-sucedido para:', email);
    res.json(userWithoutPassword);
  } else {
    console.log('Login falhou para:', email);
    res.status(401).json({ message: 'Usuário ou senha inválidos' });
  }
});

app.get('/api/auth/me', (req, res) => {
  // Em produção, verifique o token JWT
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
    
    // Atualizar também os dados da loja
    storeData.config = { ...storeData.config, ...req.body };
    
    // Salvar dados
    saveUsers();
    saveStoreData();
    
    res.json(users[userIndex].storeConfig);
  } else {
    res.status(404).json({ message: 'Usuário não encontrado' });
  }
});

// Rota para obter dados da loja
app.get('/api/store-data', (req, res) => {
  res.json(storeData);
});

// Rota para obter estatísticas dos pedidos
app.get('/api/orders/stats', (req, res) => {
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const stats = {
    totalOrders: orders.length,
    ordersThisWeek: orders.filter(order => new Date(order.createdAt) > oneWeekAgo).length,
    oldestOrder: orders.length > 0 ? orders[orders.length - 1].createdAt : null,
    newestOrder: orders.length > 0 ? orders[0].createdAt : null,
    lastCleanup: new Date().toISOString()
  };
  
  res.json(stats);
});

// Rota para atualizar dados da loja
app.put('/api/store-data', (req, res) => {
  storeData = { ...storeData, ...req.body };
  saveStoreData();
  res.json(storeData);
});

// Rota para adicionar/atualizar categoria
app.post('/api/categories', (req, res) => {
  const { name, products } = req.body;
  const newCategory = {
    id: Date.now().toString(),
    name,
    products: products || []
  };
  
  storeData.categories.push(newCategory);
  saveStoreData();
  res.json(newCategory);
});

// Rota para atualizar categoria
app.put('/api/categories/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  const categoryIndex = storeData.categories.findIndex(c => c.id === categoryId);
  
  if (categoryIndex !== -1) {
    storeData.categories[categoryIndex] = { ...storeData.categories[categoryIndex], ...req.body };
    saveStoreData();
    res.json(storeData.categories[categoryIndex]);
  } else {
    res.status(404).json({ message: 'Categoria não encontrada' });
  }
});

// Rota para deletar categoria
app.delete('/api/categories/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  const categoryIndex = storeData.categories.findIndex(c => c.id === categoryId);
  
  if (categoryIndex !== -1) {
    storeData.categories.splice(categoryIndex, 1);
    saveStoreData();
    res.json({ message: 'Categoria deletada com sucesso' });
  } else {
    res.status(404).json({ message: 'Categoria não encontrada' });
  }
});

// Rota para adicionar produto
app.post('/api/categories/:categoryId/products', (req, res) => {
  const { categoryId } = req.params;
  const { name, price, image } = req.body;
  
  const category = storeData.categories.find(c => c.id === categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Categoria não encontrada' });
  }
  
  const newProduct = {
    id: Date.now().toString(),
    name,
    price: parseFloat(price),
    image,
    categoryId
  };
  
  category.products.push(newProduct);
  saveStoreData();
  res.json(newProduct);
});

// Rota para atualizar produto
app.put('/api/products/:productId', (req, res) => {
  const { productId } = req.params;
  
  for (const category of storeData.categories) {
    const productIndex = category.products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      category.products[productIndex] = { ...category.products[productIndex], ...req.body };
      saveStoreData();
      return res.json(category.products[productIndex]);
    }
  }
  
  res.status(404).json({ message: 'Produto não encontrado' });
});

// Rota para deletar produto
app.delete('/api/products/:productId', (req, res) => {
  const { productId } = req.params;
  
  for (const category of storeData.categories) {
    const productIndex = category.products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      category.products.splice(productIndex, 1);
      saveStoreData();
      return res.json({ message: 'Produto deletado com sucesso' });
    }
  }
  
  res.status(404).json({ message: 'Produto não encontrado' });
});

// Função para obter todos os produtos
function getAllProducts() {
  return storeData.categories.flatMap(cat => cat.products);
}

// Função para encontrar produto por nome
function findProductByName(name) {
  const products = getAllProducts();
  const searchTerm = name.toLowerCase().trim();
  
  // Busca exata primeiro
  let product = products.find(product => 
    product.name.toLowerCase() === searchTerm
  );
  
  // Se não encontrar, busca por inclusão
  if (!product) {
    product = products.find(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      searchTerm.includes(product.name.toLowerCase())
    );
  }
  
  // Se ainda não encontrar, busca por palavras-chave
  if (!product) {
    const keywords = searchTerm.split(' ');
    product = products.find(product => {
      const productName = product.name.toLowerCase();
      return keywords.some(keyword => 
        keyword.length > 2 && productName.includes(keyword)
      );
    });
  }
  
  console.log(`🔍 Buscando produto: "${name}"`);
  console.log(`📦 Produtos disponíveis:`, products.map(p => p.name));
  console.log(`✅ Produto encontrado:`, product ? product.name : 'Nenhum');
  
  return product;
}

// Função para calcular total do carrinho
function calculateCartTotal(cart) {
  const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const deliveryFee = storeData.config.deliveryFee;
  return {
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee
  };
}

async function processCustomerMessage(message, contactName) {
  const phone = message.from;
  let session = customerSessions.get(phone);
  
  if (!session) {
    session = {
      phone,
      cart: [],
      step: 'greeting',
      customerData: {
        name: contactName || null // Usar o nome do contato do WhatsApp se disponível
      },
      messages: []
    };
    customerSessions.set(phone, session);
  }
  
  // Adicionar mensagem do cliente ao histórico
  session.messages.push({
    id: Date.now().toString(),
    type: 'customer',
    content: message.body,
    timestamp: new Date()
  });

  // Usar o serviço de IA para processar a mensagem
  const aiResponse = aiService.processMessage(session, message.body);
  
  // Atualizar sessão com o próximo passo
  session.step = aiResponse.nextStep;
  
  // Processar dados específicos baseados no step
  if (aiResponse.nextStep === 'address_street') {
    session.customerData.deliveryType = 'delivery';
  }
  
  if (aiResponse.nextStep === 'payment_method' && session.customerData?.deliveryType !== 'delivery') {
    session.customerData.deliveryType = 'pickup';
  }
  
  // Processar dados do endereço
  if (aiResponse.nextStep === 'address_number') {
    session.customerData.street = message.body;
  }
  
  if (aiResponse.nextStep === 'address_district') {
    session.customerData.number = message.body;
  }
  
  if (aiResponse.nextStep === 'address_city') {
    session.customerData.district = message.body;
  }
  
  if (aiResponse.nextStep === 'address_reference') {
    session.customerData.city = message.body;
  }
  
  if (aiResponse.nextStep === 'payment_method') {
    session.customerData.reference = message.body;
  }
  
  // Processar nome do cliente
  if (aiResponse.nextStep === 'payment_method' && session.step === 'customer_name') {
    session.customerData.name = message.body;
  }
  
  // Processar método de pagamento
  if (aiResponse.nextStep === 'cash_amount' || aiResponse.nextStep === 'waiting_pix_proof') {
    const lowerMessage = message.body.toLowerCase();
    if (lowerMessage.includes('dinheiro') || lowerMessage === '2') {
      session.customerData.paymentMethod = 'CASH';
    } else if (lowerMessage.includes('cartão') || lowerMessage.includes('cartao') || lowerMessage === '3') {
      session.customerData.paymentMethod = 'CARD';
        } else {
      session.customerData.paymentMethod = 'PIX';
    }
  }
  
  // Se finalizou o pedido, criar ordem
  if (aiResponse.nextStep === 'completed') {
    const { subtotal, deliveryFee, total } = calculateCartTotal(session.cart);
    
        const order = {
          id: Date.now().toString(),
      customerName: session.customerData.name || 'Cliente',
          customerPhone: phone,
          items: [...session.cart],
      subtotal,
      deliveryFee,
      total,
      address: session.customerData.address || `${session.customerData.street}, ${session.customerData.number} - ${session.customerData.district}, ${session.customerData.city}`,
      deliveryType: session.customerData.deliveryType || 'pickup',
      paymentMethod: session.customerData.paymentMethod || 'PIX',
      cashAmount: session.customerData.cashAmount,
      change: session.customerData.change,
          status: 'NEW',
          createdAt: new Date()
        };
        
        orders.push(order);
        saveOrders();
        io.emit('new-order', order);
        
    // Limpar sessão após finalizar
    setTimeout(() => {
        customerSessions.delete(phone);
    }, 5000);
  }

  console.log('🤖 Resposta da IA:', {
    response: aiResponse.response?.substring(0, 100) + '...',
    shouldSendImage: aiResponse.shouldSendImage,
    nextStep: aiResponse.nextStep
  });

  return {
    response: aiResponse.response,
    shouldSendImage: aiResponse.shouldSendImage
  };
}

// Função para transcrever áudio
async function transcribeAudio(audioPath) {
  try {
    console.log('🎵 Iniciando transcrição do áudio:', audioPath);
    
    // Opção 1: Usar API gratuita (Whisper API ou similar)
    // Por enquanto, vamos simular uma transcrição
    // Você pode integrar com: OpenAI Whisper, Google Speech-to-Text, etc.
    
    // Simulação de transcrição (para teste)
    const possibleTranscripts = [
      "quero uma pizza de calabresa",
      "qual o preço da coca cola",
      "fazer um pedido",
      "quero ver o cardápio",
      "qual o endereço da loja",
      "aceitam cartão de crédito",
      "quero delivery",
      "qual o tempo de entrega"
    ];
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Retornar uma transcrição aleatória para teste
    const randomTranscript = possibleTranscripts[Math.floor(Math.random() * possibleTranscripts.length)];
    
    console.log('📝 Transcrição simulada:', randomTranscript);
    return randomTranscript;
    
    // Para implementar transcrição real, você pode usar:
    // 1. OpenAI Whisper API
    // 2. Google Speech-to-Text
    // 3. Azure Speech Services
    // 4. Amazon Transcribe
    
    // Exemplo com OpenAI Whisper (requer API key):
    /*
    const FormData = require('form-data');
    const fs = require('fs');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath));
    form.append('model', 'whisper-1');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    const result = await response.json();
    return result.text;
    */
    
  } catch (error) {
    console.error('❌ Erro na transcrição:', error);
    return null;
  }
}

// Função para limpar sessão do WhatsApp
async function clearWhatsAppSession() {
  try {
    const sessionPath = './whatsapp_auth/session/Default';
    if (fs.existsSync(sessionPath)) {
      // Tentar remover o arquivo chrome_debug.log especificamente
      const debugLogPath = path.join(sessionPath, 'chrome_debug.log');
      if (fs.existsSync(debugLogPath)) {
        try {
          fs.unlinkSync(debugLogPath);
          console.log('Arquivo chrome_debug.log removido com sucesso');
        } catch (error) {
          console.log('Não foi possível remover chrome_debug.log:', error.message);
        }
      }
      
      // Tentar remover outros arquivos de log que podem estar bloqueados
      const filesToRemove = ['chrome_debug.log', 'chrome_debug.log.old'];
      filesToRemove.forEach(file => {
        const filePath = path.join(sessionPath, file);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Arquivo ${file} removido com sucesso`);
          } catch (error) {
            console.log(`Não foi possível remover ${file}:`, error.message);
          }
        }
      });
    }
  } catch (error) {
    console.log('Erro ao limpar sessão:', error.message);
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('=== CLIENTE CONECTADO ===');
  console.log('Socket ID:', socket.id);
  console.log('WhatsApp Client existe?', !!whatsappClient);
  console.log('Está autenticado?', isAuthenticated);
  console.log('Está inicializando?', isInitializing);

  // Enviar status atual para o cliente
  const isConnected = whatsappClient !== null && isAuthenticated;
  socket.emit('whatsapp-status', { 
    connected: isConnected, 
    status: isConnected ? 'ready' : 'disconnected' 
  });

  // Enviar dados da loja para o frontend
  socket.emit('store-data', storeData);

  // Inicializar WhatsApp
  socket.on('init-whatsapp', async () => {
    try {
      console.log('=== INICIANDO WHATSAPP ===');
      console.log('Status atual - Client:', !!whatsappClient, 'Auth:', isAuthenticated, 'Init:', isInitializing);
      
      if (isInitializing) {
        console.log('Já está inicializando, ignorando nova requisição');
        return;
      }

      // Só destruir cliente se estiver autenticado
      if (whatsappClient && isAuthenticated) {
        console.log('Já está conectado e autenticado, não precisa reinicializar');
        socket.emit('whatsapp-status', { 
          connected: true, 
          status: 'ready' 
        });
        return;
      }

      // Resetar estado
      isInitializing = true;
      isAuthenticated = false;
      if (whatsappClient) {
        console.log('Destruindo cliente anterior...');
        try {
          await whatsappClient.destroy();
        } catch (err) {
          console.log('Erro ao destruir cliente anterior:', err.message);
        }
        whatsappClient = null;
      }

      console.log('Enviando status: initializing');
      socket.emit('whatsapp-status', { 
        connected: false, 
        status: 'initializing' 
      });

      // Limpar sessão anterior para evitar conflitos
      console.log('Limpando sessão anterior...');
      await clearWhatsAppSession();

      console.log('Criando novo cliente WhatsApp...');
      
      whatsappClient = new Client({
        authStrategy: new LocalAuth({
          dataPath: './whatsapp_auth',
          clientId: 'whatsapp-bot-' + Date.now(),
        }),
        webVersion: '2.2402.5',
        webVersionCache: {
          type: 'none'
        },
        puppeteer: {
          headless: true,
          timeout: 60000,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--disable-extensions',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--mute-audio',
            '--no-zygote',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-software-rasterizer',
            '--disable-background-networking',
            '--safebrowsing-disable-auto-update',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--allow-running-insecure-content',
            '--disable-logging',
            '--log-level=3',
            '--silent-launch',
            '--disable-logging-redirect'
          ],
          ignoreDefaultArgs: ['--disable-extensions', '--enable-logging']
        }
      });

      console.log('Cliente WhatsApp inicializado. Configurando eventos...');

      whatsappClient.on('qr', async (qr) => {
        try {
          console.log('=== [EVENTO] QR CODE GERADO ===');
          console.log('QR Code recebido do WhatsApp Web, tamanho:', qr?.length || 0);
          console.log('QR Code válido?', !!qr && qr.length > 0);
          isAuthenticated = false;
          isInitializing = false;
          
          console.log('Convertendo QR Code para Data URL...');
          const qrCodeDataUrl = await qrcode.toDataURL(qr);
          console.log('QR Code convertido para Data URL, tamanho:', qrCodeDataUrl?.length || 0);
          console.log('Data URL válida?', !!qrCodeDataUrl && qrCodeDataUrl.startsWith('data:image/'));
          
          // Salvar QR code atual
          currentQRCode = qrCodeDataUrl;
          
          console.log('Enviando QR Code para o cliente...');
          socket.emit('qr-code', qrCodeDataUrl);
          socket.emit('whatsapp-status', { 
            connected: false, 
            status: 'qr_received' 
          });
          
          // Limpar timeout anterior se existir
          if (qrCodeTimeout) {
            clearInterval(qrCodeTimeout);
            qrCodeTimeout = null;
          }
          
          console.log('QR Code enviado para o cliente com sucesso!');
        } catch (error) {
          console.error('=== ERRO AO GERAR QR CODE ===');
          console.error('Erro completo:', error);
          console.error('Stack trace:', error.stack);
          isInitializing = false;
          socket.emit('error', `Erro ao gerar QR Code: ${error.message}`);
        }
      });

      whatsappClient.on('ready', async () => {
        console.log('=== [EVENTO] WHATSAPP PRONTO (ready) ===');
        try {
          const info = await whatsappClient.info;
          console.log('Info do cliente WhatsApp:', info);
        } catch (e) {
          console.log('Não foi possível obter info do cliente WhatsApp.');
        }
        isAuthenticated = true;
        isInitializing = false;
        if (qrCodeTimeout) {
          clearInterval(qrCodeTimeout);
          qrCodeTimeout = null;
        }
        currentQRCode = null;
        socket.emit('whatsapp-status', { 
          connected: true, 
          status: 'ready' 
        });
      });

      whatsappClient.on('disconnected', (reason) => {
        console.log('=== [EVENTO] WHATSAPP DESCONECTADO (disconnected) ===');
        console.log('Motivo:', reason);

        // Só destrua o cliente se o motivo for erro real
        if (reason && reason !== 'NAVIGATION' && reason !== 'RESTART_REQUIRED') {
        whatsappClient = null;
        isAuthenticated = false;
        isInitializing = false;
        
        // Limpar timeout do QR code
        if (qrCodeTimeout) {
          clearInterval(qrCodeTimeout);
          qrCodeTimeout = null;
        }
        currentQRCode = null;
        
        socket.emit('whatsapp-status', { 
          connected: false, 
          status: 'disconnected' 
        });
        } else {
          // Apenas logue, não destrua o cliente nem envie status desconectado
          console.log('Desconexão temporária, aguardando reconexão automática...');
        }
      });

      whatsappClient.on('message', async (message) => {
        console.log('=== [EVENTO] MENSAGEM RECEBIDA (message) ===');
        console.log('Tipo de mensagem:', message.type);
        console.log('Mensagem recebida:', message.body);
        console.log('Remetente:', message.from);
        
        try {
          const info = whatsappClient.info;
          if (info && info.wid && message.from === info.wid._serialized) {
            console.log('Mensagem recebida do próprio número do bot. Ignorando.');
            return;
          }
        } catch (e) {
          console.log('Não foi possível obter info do cliente para comparar número.');
        }

        // Verificar se é uma mensagem de áudio
        if (message.type === 'ptt' || message.type === 'audio') {
          console.log('🎵 Mensagem de áudio detectada!');
          
          try {
            // Baixar o áudio
            const media = await message.downloadMedia();
            if (media && media.data) {
              console.log('✅ Áudio baixado com sucesso');
              
              // Salvar o áudio temporariamente
              const audioBuffer = Buffer.from(media.data, 'base64');
              const audioPath = path.join(__dirname, 'uploads', `audio_${Date.now()}.ogg`);
              fs.writeFileSync(audioPath, audioBuffer);
              
              // Enviar mensagem informando que está processando
              await message.reply('🎵 Processando seu áudio...');
              
              // Aqui você pode integrar com uma API de transcrição
              // Por enquanto, vamos simular uma transcrição
              const transcribedText = await transcribeAudio(audioPath);
              
              // Limpar arquivo temporário
              try {
                fs.unlinkSync(audioPath);
              } catch (e) {
                console.log('Erro ao deletar arquivo temporário:', e.message);
              }
              
              if (transcribedText) {
                console.log('📝 Texto transcrito:', transcribedText);
                
                // Criar uma mensagem simulada com o texto transcrito
                const audioMessage = {
                  ...message,
                  body: transcribedText,
                  type: 'text',
                  isTranscribedAudio: true
                };
                
                // Processar a mensagem transcrita
                const result = await processCustomerMessage(audioMessage, contactName);
                
                if (result.response) {
                  await message.reply(result.response);
                  console.log('Resposta enviada para áudio transcrito!');
                }
              } else {
                await message.reply('Desculpe, não consegui entender o áudio. Pode enviar por texto?');
              }
            } else {
              await message.reply('Desculpe, não consegui processar o áudio. Pode enviar por texto?');
            }
          } catch (audioError) {
            console.error('❌ Erro ao processar áudio:', audioError);
            await message.reply('Desculpe, ocorreu um erro ao processar o áudio. Pode enviar por texto?');
          }
          return; // Não processar como mensagem de texto
        }

        // Emitir mensagem recebida para o frontend
        socket.emit('message-received', {
          from: message.from,
          body: message.body,
          timestamp: message.timestamp,
          type: message.type
        });

        // Obter nome do contato
        let contactName = '';
        try {
          const contact = await message.getContact();
          contactName = contact.pushname || contact.name || '';
        } catch (e) {
          contactName = '';
        }

        // Processar mensagem do cliente
        try {
          const result = await processCustomerMessage(message, contactName);
          
          if (result.response) {
            // Enviar resposta de texto
            await message.reply(result.response);
            console.log('Resposta enviada com sucesso!');
            
            // Se deve enviar imagem, enviar após a resposta de texto
            if (result.shouldSendImage) {
              console.log('🖼️ Tentando enviar imagem do cardápio:', result.shouldSendImage);
              try {
                // Enviar imagem diretamente pela URL
                await whatsappClient.sendMessage(message.from, {
                  image: { url: result.shouldSendImage },
                  caption: '📖 *Nosso Cardápio*'
                });
                console.log('✅ Imagem do cardápio enviada com sucesso!');
              } catch (imgError) {
                console.error('❌ Erro ao enviar imagem:', imgError);
                console.error('URL da imagem:', result.shouldSendImage);
                // Se falhar, enviar apenas o texto
                await message.reply('📖 *Nosso Cardápio*\n\n' + result.shouldSendImage);
              }
            } else {
              console.log('ℹ️ Nenhuma imagem para enviar');
            }
          }
        } catch (error) {
          console.error('Erro ao processar mensagem do cliente:', error);
          // Enviar mensagem de erro genérica
          try {
            await message.reply('Desculpe, ocorreu um erro. Tente novamente em alguns instantes.');
          } catch (replyError) {
            console.error('Erro ao enviar mensagem de erro:', replyError);
          }
        }
      });

      whatsappClient.on('auth_failure', (msg) => {
        console.error('=== [EVENTO] FALHA NA AUTENTICAÇÃO (auth_failure) ===');
        console.error('Mensagem:', msg);
        whatsappClient = null;
        isAuthenticated = false;
        isInitializing = false;
        
        // Limpar timeout do QR code
        if (qrCodeTimeout) {
          clearInterval(qrCodeTimeout);
          qrCodeTimeout = null;
        }
        currentQRCode = null;
        
        socket.emit('whatsapp-status', { 
          connected: false, 
          status: 'auth_failed' 
        });
      });

      whatsappClient.on('loading_screen', (percent, message) => {
        console.log('=== [EVENTO] LOADING SCREEN ===', percent + '%', message);
      });

      whatsappClient.on('authenticated', () => {
        console.log('=== [EVENTO] WHATSAPP AUTENTICADO (authenticated) ===');
      });

      console.log('Inicializando cliente...');
      try {
        await whatsappClient.initialize();
        console.log('✅ Cliente inicializado com sucesso');
      } catch (initError) {
        console.error('❌ Erro ao inicializar cliente WhatsApp:', initError);
        throw initError;
      }

    } catch (error) {
      console.error('=== ERRO AO INICIALIZAR WHATSAPP ===');
      console.error('Erro completo:', error);
      console.error('Stack trace:', error.stack);
      
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

  // Desconectar WhatsApp
  socket.on('disconnect-whatsapp', async () => {
    try {
      console.log('=== DESCONECTANDO WHATSAPP ===');
      if (whatsappClient) {
        try {
        await whatsappClient.destroy();
          console.log('Cliente WhatsApp destruído com sucesso');
        } catch (destroyError) {
          console.error('Erro ao destruir cliente WhatsApp:', destroyError);
          console.log('Continuando com a limpeza de estado...');
        }
        whatsappClient = null;
        isAuthenticated = false;
        isInitializing = false;
      }
      
      // Limpar timeout do QR code
      if (qrCodeTimeout) {
        clearInterval(qrCodeTimeout);
        qrCodeTimeout = null;
      }
      currentQRCode = null;
      
      socket.emit('whatsapp-status', { 
        connected: false, 
        status: 'disconnected' 
      });
    } catch (error) {
      console.error('Erro ao desconectar WhatsApp:', error);
      // Não emitir erro para o cliente, apenas logar
      console.log('Continuando operação mesmo com erro...');
    }
  });

  // Enviar mensagem
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

  // Verificar status
  socket.on('check-status', () => {
    const isConnected = whatsappClient !== null && isAuthenticated;
    socket.emit('whatsapp-status', { 
      connected: isConnected,
      status: isConnected ? 'ready' : 'disconnected'
    });
  });

  // Atualizar dados da loja
  socket.on('update-store-data', (data) => {
    console.log('=== ATUALIZANDO DADOS DA LOJA ===');
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    try {
      // Atualizar storeData com os novos dados
      if (data.config) {
        storeData.config = { ...storeData.config, ...data.config };
        console.log('✅ Configuração da loja atualizada');
      }
      
      if (data.categories) {
        storeData.categories = data.categories;
        console.log('✅ Categorias atualizadas');
      }
      
      if (data.promotions) {
        storeData.promotions = data.promotions;
        console.log('✅ Promoções atualizadas');
      }
      
      if (data.orders) {
        orders = data.orders;
        console.log('✅ Pedidos atualizados');
        saveOrders();
      }
      
      // Salvar no arquivo com backup automático
      try {
        saveStoreData();
        console.log('💾 Dados salvos com sucesso no arquivo');
        
        // Criar backup automático
        const backupFile = STORE_DATA_FILE.replace('.json', `_backup_${Date.now()}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(storeData, null, 2));
        console.log('💾 Backup criado:', backupFile);
        
        // Manter apenas os últimos 5 backups
        const backupDir = path.dirname(STORE_DATA_FILE);
        const backupFiles = fs.readdirSync(backupDir)
          .filter(file => file.includes('_backup_'))
          .sort()
          .reverse();
        
        if (backupFiles.length > 5) {
          backupFiles.slice(5).forEach(file => {
            fs.unlinkSync(path.join(backupDir, file));
            console.log('🗑️ Backup antigo removido:', file);
          });
        }
        
      } catch (saveError) {
        console.error('❌ Erro ao salvar dados:', saveError);
        throw saveError;
      }
      
      // Reinstanciar o aiService com os novos dados
      aiService = new AIService(storeData.config, getAllProducts(), storeData.promotions);
      console.log('🤖 AI Service atualizado com novos dados');
      
      // Enviar confirmação para o frontend
      socket.emit('store-data-updated', { success: true });
      
      console.log('✅ Dados da loja atualizados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar dados da loja:', error);
      socket.emit('store-data-updated', { success: false, error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('=== CLIENTE DESCONECTADO ===');
    console.log('Socket ID:', socket.id);
  });
});

// Rotas REST para compatibilidade
app.get('/api/whatsapp/status', (req, res) => {
  const isConnected = whatsappClient !== null && isAuthenticated;
  res.json({ 
    connected: isConnected,
    status: isConnected ? 'ready' : 'disconnected'
  });
});

app.post('/api/whatsapp/init', (req, res) => {
  res.json({ success: true, message: 'Use Socket.IO para inicializar WhatsApp' });
});

app.post('/api/whatsapp/disconnect', (req, res) => {
  res.json({ success: true, message: 'Use Socket.IO para desconectar WhatsApp' });
});

// Rota simples para servir o index.html apenas se existir
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ 
      message: 'API do WhatsApp Bot funcionando!', 
      status: 'ok',
      note: 'Execute "npm run build" para gerar os arquivos do frontend'
    });
  }
});

// Rota catch-all para SPA apenas se o dist existir
app.get('*', (req, res) => {
  // Verificar se é uma requisição para API
  if (req.path && req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint não encontrado' });
  }
  
  // Para todas as outras rotas, servir o index.html se existir
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      message: 'Página não encontrada',
      note: 'Execute "npm run build" para gerar os arquivos do frontend'
    });
  }
});

server.listen(PORT, () => {
  console.log(`=== SERVIDOR INICIADO ===`);
  console.log(`Porta: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Socket.IO: http://localhost:${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`Diretório dist existe: ${fs.existsSync(path.join(__dirname, 'dist'))}`);
});

// Salvar dados quando o servidor for encerrado
process.on('SIGINT', () => {
  console.log('\n=== ENCERRANDO SERVIDOR ===');
  console.log('💾 Salvando dados finais...');
  try {
    saveStoreData();
    saveOrders();
    console.log('✅ Dados salvos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar dados finais:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n=== ENCERRANDO SERVIDOR ===');
  console.log('💾 Salvando dados finais...');
  try {
    saveStoreData();
    saveOrders();
    console.log('✅ Dados salvos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar dados finais:', error);
  }
  process.exit(0);
});