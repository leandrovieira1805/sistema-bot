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

// Variáveis do WhatsApp
let whatsappClient = null;
let isAuthenticated = false;
let isInitializing = false;
let qrCodeTimeout = null;
let currentQRCode = null;

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

// Dados da loja
let storeData = {
  config: {
    name: 'Pizzaria Delícia',
    greeting: 'Olá! Seja bem-vindo à Pizzaria Delícia. Digite o número da opção desejada:\n1. Ver Cardápio 📖\n2. Ver Promoções 🔥',
    deliveryFee: 5.00,
    pixKey: 'contato@pizzariadelicia.com.br',
    address: 'Rua das Pizzas, 123 - Centro - Cidade Exemplo',
    menuImage: 'https://exemplo.com/cardapio.jpg'
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
      customerData: {},
      messages: [],
      step: 'greeting'
    };
  }

  const text = message.body.toLowerCase().trim();
  let response = '';
  let shouldSendImage = false;
  let imageUrl = '';

  switch (session.step) {
    case 'greeting':
      if (text === '1' || text.includes('cardápio') || text.includes('cardapio')) {
        response = 'Aqui está nosso cardápio! 🍕\n\n';
        response += getAllProducts().map(product => 
          `${product.name} - R$ ${product.price.toFixed(2)}`
        ).join('\n');
        response += '\n\nPara fazer um pedido, digite o nome do produto desejado.';
        session.step = 'ordering';
        shouldSendImage = true;
        imageUrl = storeData.config.menuImage;
      } else if (text === '2' || text.includes('promoção') || text.includes('promocao')) {
        response = 'Promoções da semana:\n🔥 Pizza + Bebida por R$ 50,00\n🎉 Delivery grátis em pedidos acima de R$ 60,00';
        session.step = 'greeting';
      } else {
        response = storeData.config.greeting;
      }
      break;

    case 'ordering':
      const product = findProductByName(text);
      if (product) {
        const existingItem = session.cart.find(item => item.product.id === product.id);
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          session.cart.push({
            product,
            quantity: 1
          });
        }
        
        const cartTotal = calculateCartTotal(session.cart);
        response = `✅ ${product.name} adicionado ao carrinho!\n\n`;
        response += `Carrinho atual:\n`;
        response += session.cart.map(item => 
          `${item.product.name} x${item.quantity} - R$ ${(item.product.price * item.quantity).toFixed(2)}`
        ).join('\n');
        response += `\n\nSubtotal: R$ ${cartTotal.subtotal.toFixed(2)}`;
        response += `\nTaxa de entrega: R$ ${cartTotal.deliveryFee.toFixed(2)}`;
        response += `\nTotal: R$ ${cartTotal.total.toFixed(2)}`;
        response += `\n\nDigite "finalizar" para concluir o pedido ou continue adicionando produtos.`;
        session.step = 'ordering';
      } else if (text === 'finalizar' || text === 'finalizar pedido') {
        if (session.cart.length === 0) {
          response = 'Seu carrinho está vazio. Adicione produtos antes de finalizar.';
          session.step = 'ordering';
        } else {
          response = 'Ótimo! Vamos finalizar seu pedido.\n\n';
          response += 'Por favor, me informe:\n';
          response += '1. Seu nome completo\n';
          response += '2. Endereço completo para entrega\n';
          response += '3. Forma de pagamento (PIX ou Dinheiro)\n\n';
          response += 'Digite as informações separadas por vírgula.';
          session.step = 'customer_info';
        }
      } else {
        response = 'Produto não encontrado. Digite o nome correto do produto ou "finalizar" para concluir o pedido.';
      }
      break;

    case 'customer_info':
      const info = text.split(',').map(item => item.trim());
      if (info.length >= 3) {
        session.customerData = {
          name: info[0],
          address: info[1],
          paymentMethod: info[2].toLowerCase()
        };
        
        const cartTotal = calculateCartTotal(session.cart);
        response = `Pedido confirmado!\n\n`;
        response += `Cliente: ${session.customerData.name}\n`;
        response += `Endereço: ${session.customerData.address}\n`;
        response += `Pagamento: ${session.customerData.paymentMethod}\n\n`;
        response += `Itens:\n`;
        response += session.cart.map(item => 
          `${item.product.name} x${item.quantity} - R$ ${(item.product.price * item.quantity).toFixed(2)}`
        ).join('\n');
        response += `\nSubtotal: R$ ${cartTotal.subtotal.toFixed(2)}`;
        response += `\nTaxa de entrega: R$ ${cartTotal.deliveryFee.toFixed(2)}`;
        response += `\nTotal: R$ ${cartTotal.total.toFixed(2)}`;
        
        if (session.customerData.paymentMethod === 'pix') {
          response += `\n\nChave PIX: ${storeData.config.pixKey}`;
        }
        
        response += `\n\nPedido enviado para a cozinha! 🍕`;
        
        // Criar pedido
        const order = {
          id: Date.now().toString(),
          customerName: session.customerData.name,
          customerPhone: phone,
          items: [...session.cart],
          subtotal: cartTotal.subtotal,
          deliveryFee: storeData.config.deliveryFee,
          total: cartTotal.total,
          address: session.customerData.address,
          paymentMethod: session.customerData.paymentMethod.toUpperCase(),
          status: 'NEW',
          createdAt: new Date()
        };
        
        orders.push(order);
        
        // Emitir evento para o frontend
        io.emit('new-order', order);
        
        // Limpar sessão
        customerSessions.delete(phone);
      } else {
        response = 'Por favor, forneça todas as informações necessárias: nome, endereço e forma de pagamento, separadas por vírgula.';
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

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    whatsapp: {
      client: !!whatsappClient,
      authenticated: isAuthenticated,
      initializing: isInitializing
    }
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
      
      console.log('WhatsApp desconectado com sucesso');
    } catch (error) {
      console.error('Erro ao desconectar WhatsApp:', error);
    }
  });

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
  console.log(`WhatsApp implementado: ✅`);
}); 