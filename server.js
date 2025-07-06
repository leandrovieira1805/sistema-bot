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
    origin: "*", // Permitir todas as origens em produção
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do build apenas se o diretório existir
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('Servindo arquivos estáticos do diretório dist');
} else {
  console.log('Diretório dist não encontrado - executando apenas API');
}

let whatsappClient = null;
let isAuthenticated = false;
let isInitializing = false;
let qrCodeTimeout = null;
let currentQRCode = null;

// Dados de usuários (em produção, use um banco de dados)
let users = [
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

// Dados da loja (serão sincronizados com o frontend)
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

// Sessões de clientes
const customerSessions = new Map();

// Pedidos
let orders = [];

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
    res.json(users[userIndex].storeConfig);
  } else {
    res.status(404).json({ message: 'Usuário não encontrado' });
  }
});

// Função para obter todos os produtos
function getAllProducts() {
  return storeData.categories.flatMap(cat => cat.products);
}

// Função para encontrar produto por nome
function findProductByName(name) {
  const products = getAllProducts();
  return products.find(product => 
    product.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(product.name.toLowerCase())
  );
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

// Função para processar mensagem do cliente
async function processCustomerMessage(message, contactName) {
  const phone = message.from;
  let session = customerSessions.get(phone);
  
  if (!session) {
    session = {
      phone,
      cart: [],
      step: 'greeting',
      customerData: {},
      messages: []
    };
    customerSessions.set(phone, session);
  }

  const userMessage = message.body.trim().toLowerCase();
  
  // Adicionar mensagem do cliente ao histórico
  session.messages.push({
    id: Date.now().toString(),
    type: 'customer',
    content: message.body,
    timestamp: new Date()
  });

  let response = '';
  let shouldSendImage = false;
  let imageUrl = '';

  switch (session.step) {
    case 'greeting':
      if (userMessage === 'oi' || userMessage === 'olá' || userMessage === 'ola') {
        response = contactName 
          ? `Olá, ${contactName}! ${storeData.config.greeting}`
          : `Olá! ${storeData.config.greeting}`;
        session.step = 'menu';
      } else if (userMessage === '1' || userMessage.includes('cardápio') || userMessage.includes('cardapio')) {
        // Enviar apenas a imagem do cardápio
        const menuImage = storeData.config.menuImage;
        if (menuImage) {
          shouldSendImage = true;
          imageUrl = menuImage;
          response = 'Aqui está o nosso cardápio! Faça seu pedido digitando o nome do item.';
        } else {
          response = 'Desculpe, o cardápio não está disponível no momento.';
        }
        session.step = 'ordering';
      } else if (userMessage === '2' || userMessage.includes('promoção') || userMessage.includes('promocao')) {
        if (storeData.promotions.length > 0) {
          response = '🔥 *PROMOÇÕES ATIVAS*\n\n';
          storeData.promotions.forEach(promo => {
            response += `*${promo.title}*\n${promo.description}\nDesconto: ${promo.discount}%\n\n`;
          });
        } else {
          response = 'Não há promoções ativas no momento. Digite "1" para ver o cardápio!';
        }
        session.step = 'menu';
      } else {
        response = storeData.config.greeting;
        session.step = 'menu';
      }
      break;

    case 'menu':
      if (userMessage === '1' || userMessage.includes('cardápio') || userMessage.includes('cardapio')) {
        const menuImage = storeData.config.menuImage;
        if (menuImage) {
          shouldSendImage = true;
          imageUrl = menuImage;
          response = 'Aqui está o nosso cardápio! Faça seu pedido digitando o nome do item.';
        } else {
          response = 'Desculpe, o cardápio não está disponível no momento.';
        }
        session.step = 'ordering';
      } else if (userMessage === '2' || userMessage.includes('promoção') || userMessage.includes('promocao')) {
        if (storeData.promotions.length > 0) {
          response = '🔥 *PROMOÇÕES ATIVAS*\n\n';
          storeData.promotions.forEach(promo => {
            response += `*${promo.title}*\n${promo.description}\nDesconto: ${promo.discount}%\n\n`;
          });
        } else {
          response = 'Não há promoções ativas no momento. Digite "1" para ver o cardápio!';
        }
      } else {
        response = storeData.config.greeting;
      }
      break;

    case 'ordering':
      const product = findProductByName(userMessage);
      if (product) {
        // Adicionar produto ao carrinho
        const existingItem = session.cart.find(item => item.product.id === product.id);
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          session.cart.push({
            product,
            quantity: 1
          });
        }

        const { subtotal, deliveryFee, total } = calculateCartTotal(session.cart);
        
        response = `✅ *${product.name}* adicionado ao carrinho!\n\n`;
        response += '*Seu pedido atual:*\n';
        session.cart.forEach(item => {
          response += `• ${item.product.name} x${item.quantity} - R$ ${(item.product.price * item.quantity).toFixed(2)}\n`;
        });
        response += `\n*Subtotal:* R$ ${subtotal.toFixed(2)}\n`;
        response += `*Taxa de entrega:* R$ ${deliveryFee.toFixed(2)}\n`;
        response += `*Total:* R$ ${total.toFixed(2)}\n\n`;
        response += 'Deseja adicionar mais algum item? (Digite o nome do produto)\n';
        response += 'Ou digite "finalizar" para concluir o pedido.';
      } else if (userMessage === 'finalizar' || userMessage === 'finalizar pedido') {
        if (session.cart.length === 0) {
          response = 'Seu carrinho está vazio. Digite o nome de um produto para começar a pedir!';
        } else {
          response = '📋 *FINALIZAR PEDIDO*\n\n';
          response += 'Por favor, informe seu nome:';
          session.step = 'customer_name';
        }
      } else {
        response = 'Produto não encontrado. Digite o nome correto do produto ou "finalizar" para concluir o pedido.';
      }
      break;

    case 'customer_name':
      session.customerData.name = message.body.trim();
      response = 'Agora informe seu endereço para entrega:';
      session.step = 'address';
      break;

    case 'address':
      session.customerData.address = message.body.trim();
      response = '💳 *FORMA DE PAGAMENTO*\n\n';
      response += 'Escolha a forma de pagamento:\n';
      response += '1. PIX\n';
      response += '2. Dinheiro\n\n';
      response += 'Digite o número da opção:';
      session.step = 'payment_method';
      break;

    case 'payment_method':
      if (userMessage === '1' || userMessage === 'pix') {
        session.customerData.paymentMethod = 'PIX';
        const { total } = calculateCartTotal(session.cart);
        
        response = '💳 *PAGAMENTO VIA PIX*\n\n';
        response += `*Valor total:* R$ ${total.toFixed(2)}\n`;
        response += `*Chave PIX:* ${storeData.config.pixKey}\n\n`;
        response += 'Após o pagamento, seu pedido será processado!\n';
        response += 'Obrigado pela preferência! 🍕';
        
        // Criar pedido
        const order = {
          id: Date.now().toString(),
          customerName: session.customerData.name,
          customerPhone: phone,
          items: [...session.cart],
          subtotal: calculateCartTotal(session.cart).subtotal,
          deliveryFee: storeData.config.deliveryFee,
          total: calculateCartTotal(session.cart).total,
          address: session.customerData.address,
          paymentMethod: 'PIX',
          status: 'NEW',
          createdAt: new Date()
        };
        
        orders.push(order);
        
        // Emitir evento para o frontend
        io.emit('new-order', order);
        
        // Limpar sessão
        customerSessions.delete(phone);
        
      } else if (userMessage === '2' || userMessage === 'dinheiro') {
        session.customerData.paymentMethod = 'CASH';
        const { total } = calculateCartTotal(session.cart);
        
        response = '💵 *PAGAMENTO EM DINHEIRO*\n\n';
        response += `*Valor total:* R$ ${total.toFixed(2)}\n`;
        response += 'Informe o valor que você vai pagar:';
        session.step = 'cash_amount';
      } else {
        response = 'Opção inválida. Digite "1" para PIX ou "2" para dinheiro.';
      }
      break;

    case 'cash_amount':
      const cashAmount = parseFloat(userMessage.replace(',', '.'));
      const { total } = calculateCartTotal(session.cart);
      
      if (isNaN(cashAmount) || cashAmount < total) {
        response = `O valor deve ser maior ou igual ao total de R$ ${total.toFixed(2)}. Informe novamente:`;
      } else {
        const change = cashAmount - total;
        session.customerData.cashAmount = cashAmount;
        session.customerData.change = change;
        
        response = '💵 *PAGAMENTO EM DINHEIRO*\n\n';
        response += `*Valor total:* R$ ${total.toFixed(2)}\n`;
        response += `*Valor pago:* R$ ${cashAmount.toFixed(2)}\n`;
        response += `*Troco:* R$ ${change.toFixed(2)}\n\n`;
        response += 'Pedido confirmado! Obrigado pela preferência! 🍕';
        
        // Criar pedido
        const order = {
          id: Date.now().toString(),
          customerName: session.customerData.name,
          customerPhone: phone,
          items: [...session.cart],
          subtotal: calculateCartTotal(session.cart).subtotal,
          deliveryFee: storeData.config.deliveryFee,
          total: calculateCartTotal(session.cart).total,
          address: session.customerData.address,
          paymentMethod: 'CASH',
          cashAmount: cashAmount,
          change: change,
          status: 'NEW',
          createdAt: new Date()
        };
        
        orders.push(order);
        
        // Emitir evento para o frontend
        io.emit('new-order', order);
        
        // Limpar sessão
        customerSessions.delete(phone);
      }
      break;
  }

  // Adicionar resposta do bot ao histórico
  if (response) {
    session.messages.push({
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: response,
      timestamp: new Date()
    });
  }

  // Atualizar sessão
  customerSessions.set(phone, session);

  return { response, shouldSendImage, imageUrl };
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

        // Emitir mensagem recebida para o frontend
        socket.emit('message-received', {
          from: message.from,
          body: message.body,
          timestamp: message.timestamp
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
            if (result.shouldSendImage && result.imageUrl) {
              try {
                const media = await whatsappClient.downloadMediaMessage(result.imageUrl);
                await message.reply(media);
                console.log('Imagem do cardápio enviada com sucesso!');
              } catch (imgError) {
                console.error('Erro ao enviar imagem:', imgError);
              }
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
      await whatsappClient.initialize();
      console.log('Cliente inicializado com sucesso');

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
        await whatsappClient.destroy();
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
      socket.emit('error', 'Erro ao desconectar WhatsApp');
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
  if (req.path.startsWith('/api/')) {
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