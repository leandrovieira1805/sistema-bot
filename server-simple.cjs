const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuração do servidor
app.set('trust proxy', 1);
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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

let whatsappClient = null;
let isAuthenticated = false;
let isInitializing = false;
let qrCodeTimeout = null;
let currentQRCode = null;

// Funções auxiliares
function getAllProducts() {
  return categories.flatMap(cat => cat.products);
}

function findProductByName(name) {
  const normalizedName = name.toLowerCase().trim();
  return getAllProducts().find(product => 
    product.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(product.name.toLowerCase())
  );
}

// Sistema de IA para reconhecimento de produtos
class AIProductMatcher {
  constructor() {
    this.commonTypos = {
      'piza': 'pizza',
      'pizz': 'pizza',
      'calabreza': 'calabresa',
      'margarita': 'margherita',
      'coca': 'coca-cola',
      'refri': 'refrigerante',
      'bebida': 'bebidas'
    };
  }

  calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
          matches++;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractNumbers(text) {
    const numbers = text.match(/\d+/g);
    return numbers ? numbers.map(n => parseInt(n)) : [];
  }

  correctCommonTypos(text) {
    let corrected = text;
    for (const [typo, correction] of Object.entries(this.commonTypos)) {
      corrected = corrected.replace(new RegExp(typo, 'gi'), correction);
    }
    return corrected;
  }

  findProductWithAI(inputText, products) {
    const normalizedInput = this.normalizeText(inputText);
    const correctedInput = this.correctCommonTypos(normalizedInput);
    const numbers = this.extractNumbers(inputText);
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const product of products) {
      const normalizedName = this.normalizeText(product.name);
      const correctedName = this.correctCommonTypos(normalizedName);
      
      const score1 = this.calculateSimilarity(normalizedInput, normalizedName);
      const score2 = this.calculateSimilarity(correctedInput, correctedName);
      const score3 = this.calculateSimilarity(normalizedInput, correctedName);
      const score4 = this.calculateSimilarity(correctedInput, normalizedName);
      
      const maxScore = Math.max(score1, score2, score3, score4);
      
      if (maxScore > bestScore && maxScore > 0.3) {
        bestScore = maxScore;
        bestMatch = product;
      }
    }
    
    return {
      product: bestMatch,
      confidence: bestScore,
      numbers: numbers,
      input: inputText,
      normalized: normalizedInput,
      corrected: correctedInput
    };
  }

  generateSmartResponse(aiResult, products) {
    if (!aiResult.product) {
      return "Desculpe, não encontrei esse produto no nosso cardápio. Pode tentar novamente ou digite '1' para ver o cardápio completo.";
    }
    
    const { product, confidence, numbers } = aiResult;
    const quantity = numbers.length > 0 ? numbers[0] : 1;
    const total = product.price * quantity;
    
    if (confidence > 0.7) {
      return `Perfeito! Encontrei o ${product.name} por R$ ${product.price.toFixed(2)}. Quantidade: ${quantity}. Total: R$ ${total.toFixed(2)}. Deseja adicionar ao pedido? (sim/não)`;
    } else {
      return `Acho que você quer ${product.name} (R$ ${product.price.toFixed(2)}). Está correto? (sim/não)`;
    }
  }
}

const aiMatcher = new AIProductMatcher();

// Função para limpar sessão do WhatsApp
async function clearWhatsAppSession() {
  const sessionDir = './whatsapp_auth';
  if (fs.existsSync(sessionDir)) {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log('Sessão anterior limpa com sucesso');
    } catch (error) {
      console.log('Erro ao limpar sessão:', error.message);
    }
  }
}

// Função para calcular total do carrinho
function calculateCartTotal(cart) {
  const getProductPrice = (product) => {
    const foundProduct = findProductByName(product.name);
    return foundProduct ? foundProduct.price : 0;
  };
  
  return cart.reduce((total, item) => {
    const price = getProductPrice(item.product);
    return total + (price * item.quantity);
  }, 0);
}

// Processamento de mensagens do cliente
async function processCustomerMessage(message, contactName) {
  const text = message.toLowerCase().trim();
  const session = customerSessions.find(s => s.phone === contactName) || {
    phone: contactName,
    cart: [],
    customerData: null,
    lastActivity: new Date()
  };
  
  if (!customerSessions.find(s => s.phone === contactName)) {
    customerSessions.push(session);
  }
  
  session.lastActivity = new Date();
  
  // Atualizar sessão
  const sessionIndex = customerSessions.findIndex(s => s.phone === contactName);
  if (sessionIndex !== -1) {
    customerSessions[sessionIndex] = session;
  }
  
  let response = '';
  
  // Verificar se é uma opção do menu principal
  if (text === '1' || text.includes('cardápio') || text.includes('menu')) {
    response = `📖 *CARDÁPIO ${storeConfig.name.toUpperCase()}*\n\n`;
    
    categories.forEach(category => {
      response += `*${category.name.toUpperCase()}*\n`;
      category.products.forEach(product => {
        response += `• ${product.name} - R$ ${product.price.toFixed(2)}\n`;
      });
      response += '\n';
    });
    
    response += `Para fazer um pedido, digite o nome do produto desejado.\n\n`;
    response += `*Taxa de entrega:* R$ ${storeConfig.deliveryFee.toFixed(2)}\n`;
    response += `*Endereço:* ${storeConfig.address}`;
    
    // Enviar imagem do cardápio se disponível
    if (storeConfig.menuImage) {
      try {
        await whatsappClient.sendMessage(contactName, {
          media: { url: storeConfig.menuImage },
          caption: '📖 Cardápio visual'
        });
      } catch (error) {
        console.log('Erro ao enviar imagem do cardápio:', error.message);
      }
    }
    
  } else if (text === '2' || text.includes('promoção') || text.includes('promoções')) {
    if (promotions.length > 0) {
      response = `🔥 *PROMOÇÕES ATIVAS*\n\n`;
      promotions.forEach(promo => {
        response += `*${promo.name}*\n`;
        response += `${promo.description}\n`;
        response += `Preço: R$ ${promo.price.toFixed(2)}\n\n`;
      });
    } else {
      response = "No momento não temos promoções ativas. Digite '1' para ver o cardápio completo!";
    }
    
  } else if (text.includes('pedido') || text.includes('finalizar') || text.includes('concluir')) {
    if (session.cart.length === 0) {
      response = "Você ainda não tem itens no carrinho. Digite '1' para ver o cardápio e fazer seu pedido!";
    } else {
      response = await finalizeOrder(session, contactName);
    }
    
  } else if (text.includes('carrinho') || text.includes('itens')) {
    if (session.cart.length === 0) {
      response = "Seu carrinho está vazio. Digite '1' para ver o cardápio!";
    } else {
      const total = calculateCartTotal(session.cart);
      response = `🛒 *SEU CARRINHO*\n\n`;
      session.cart.forEach(item => {
        response += `• ${item.product.name} x${item.quantity} - R$ ${(item.product.price * item.quantity).toFixed(2)}\n`;
      });
      response += `\n*Total:* R$ ${total.toFixed(2)}\n\n`;
      response += `Digite "finalizar pedido" para concluir sua compra!`;
    }
    
  } else {
    // Tentar encontrar produto usando IA
    const aiResult = aiMatcher.findProductWithAI(text, getAllProducts());
    const smartResponse = aiMatcher.generateSmartResponse(aiResult, getAllProducts());
    
    if (aiResult.product && aiResult.confidence > 0.3) {
      response = smartResponse;
      
      // Se a confiança for alta, perguntar sobre quantidade
      if (aiResult.confidence > 0.7 && aiResult.numbers.length === 0) {
        response += `\n\nQuantos ${aiResult.product.name} você gostaria?`;
      }
    } else {
      response = storeConfig.greeting;
    }
  }
  
  return response;
}

// Finalizar pedido
async function finalizeOrder(session, phone) {
  if (session.cart.length === 0) {
    return "Você ainda não tem itens no carrinho. Digite '1' para ver o cardápio!";
  }
  
  const subtotal = calculateCartTotal(session.cart);
  const deliveryFee = storeConfig.deliveryFee;
  const total = subtotal + deliveryFee;
  
  const order = {
    id: Date.now().toString(),
    customerName: session.customerData?.name || 'Cliente',
    customerPhone: phone,
    items: session.cart,
    subtotal,
    deliveryFee,
    total,
    address: session.customerData?.address || 'Endereço não informado',
    deliveryType: session.customerData?.deliveryType || 'delivery',
    paymentMethod: session.customerData?.paymentMethod || 'PIX',
    cashAmount: session.customerData?.cashAmount,
    change: session.customerData?.cashAmount ? session.customerData.cashAmount - total : undefined,
    status: 'NEW',
    createdAt: new Date()
  };
  
  orders.push(order);
  
  // Limpar carrinho
  session.cart = [];
  const sessionIndex = customerSessions.findIndex(s => s.phone === phone);
  if (sessionIndex !== -1) {
    customerSessions[sessionIndex] = session;
  }
  
  let response = `✅ *PEDIDO FINALIZADO COM SUCESSO!*\n\n`;
  response += `*Pedido #${order.id}*\n`;
  response += `*Cliente:* ${order.customerName}\n`;
  response += `*Itens:*\n`;
  order.items.forEach(item => {
    response += `• ${item.product.name} x${item.quantity} - R$ ${(item.product.price * item.quantity).toFixed(2)}\n`;
  });
  response += `\n*Subtotal:* R$ ${order.subtotal.toFixed(2)}\n`;
  response += `*Taxa de entrega:* R$ ${order.deliveryFee.toFixed(2)}\n`;
  response += `*Total:* R$ ${order.total.toFixed(2)}\n\n`;
  response += `*Forma de pagamento:* ${order.paymentMethod}\n`;
  
  if (order.paymentMethod === 'PIX') {
    response += `*Chave PIX:* ${storeConfig.pixKey}\n\n`;
  } else if (order.paymentMethod === 'dinheiro') {
    response += `*Valor recebido:* R$ ${order.cashAmount?.toFixed(2)}\n`;
    if (order.change) {
      response += `*Troco:* R$ ${order.change.toFixed(2)}\n`;
    }
    response += '\n';
  }
  
  response += `*Endereço:* ${order.address}\n\n`;
  response += `Aguarde, seu pedido está sendo preparado! 🍕`;
  
  return response;
}

// Rotas da API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Bot API'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'WhatsApp Bot API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota para testar o sistema de IA
app.post('/api/ai/test', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ message: 'Texto é obrigatório' });
  }
  
  const products = getAllProducts();
  const aiResult = aiMatcher.findProductWithAI(text, products);
  const smartResponse = aiMatcher.generateSmartResponse(aiResult, products);
  
  res.json({
    input: text,
    normalized: aiMatcher.normalizeText(text),
    corrected: aiMatcher.correctCommonTypos(aiMatcher.normalizeText(text)),
    numbers: aiResult.numbers,
    aiResult: aiResult,
    response: smartResponse
  });
});

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
          
          currentQRCode = qrCodeDataUrl;
          socket.emit('qr-code', qrCodeDataUrl);
          socket.emit('whatsapp-status', { 
            connected: false, 
            status: 'qr_received' 
          });
          
          console.log('QR Code enviado para o cliente com sucesso!');
        } catch (error) {
          console.error('Erro ao processar QR Code:', error);
          socket.emit('error', 'Erro ao gerar QR Code');
        }
      });

      whatsappClient.on('ready', () => {
        console.log('=== [EVENTO] WHATSAPP PRONTO ===');
        console.log('WhatsApp Web autenticado e pronto para uso!');
        isAuthenticated = true;
        isInitializing = false;
        currentQRCode = null;
        
        socket.emit('whatsapp-status', { 
          connected: true, 
          status: 'ready' 
        });
        
        console.log('Status de pronto enviado para o cliente!');
      });

      whatsappClient.on('authenticated', () => {
        console.log('=== [EVENTO] AUTENTICADO ===');
        console.log('WhatsApp Web autenticado com sucesso!');
      });

      whatsappClient.on('auth_failure', (msg) => {
        console.log('=== [EVENTO] FALHA NA AUTENTICAÇÃO ===');
        console.log('Falha na autenticação do WhatsApp:', msg);
        isAuthenticated = false;
        isInitializing = false;
        socket.emit('whatsapp-status', { 
          connected: false, 
          status: 'auth_failed' 
        });
      });

      whatsappClient.on('disconnected', (reason) => {
        console.log('=== [EVENTO] DESCONECTADO ===');
        console.log('WhatsApp Web desconectado:', reason);
        isAuthenticated = false;
        isInitializing = false;
        whatsappClient = null;
        socket.emit('whatsapp-status', { 
          connected: false, 
          status: 'disconnected' 
        });
      });

      whatsappClient.on('message', async (msg) => {
        try {
          console.log('=== [EVENTO] MENSAGEM RECEBIDA ===');
          console.log('De:', msg.from);
          console.log('Mensagem:', msg.body);
          
          if (msg.fromMe) {
            console.log('Mensagem própria, ignorando...');
            return;
          }
          
          const response = await processCustomerMessage(msg.body, msg.from);
          console.log('Resposta gerada:', response);
          
          await whatsappClient.sendMessage(msg.from, response);
          console.log('Resposta enviada com sucesso!');
          
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
          try {
            await whatsappClient.sendMessage(msg.from, 'Desculpe, ocorreu um erro. Tente novamente.');
          } catch (sendError) {
            console.error('Erro ao enviar mensagem de erro:', sendError);
          }
        }
      });

      console.log('Eventos configurados. Inicializando cliente...');
      await whatsappClient.initialize();
      console.log('Cliente inicializado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao inicializar WhatsApp:', error);
      isInitializing = false;
      socket.emit('error', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('=== CLIENTE DESCONECTADO ===');
    console.log('Socket ID:', socket.id);
  });
});

// Rota catch-all para SPA
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.json({ 
      status: 'ok', 
      message: 'API funcionando, mas frontend não encontrado',
      timestamp: new Date().toISOString()
    });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 WhatsApp Bot API iniciado`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
});