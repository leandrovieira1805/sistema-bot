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
    origin: "http://localhost:3002",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

let whatsappClient = null;
let isAuthenticated = false;
let isInitializing = false; // Nova flag para controlar inicialização

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

      if (whatsappClient && isAuthenticated) {
        console.log('Já está conectado e autenticado');
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

      console.log('Criando novo cliente WhatsApp (MODO DEBUG)...');
      whatsappClient = new Client({
        authStrategy: new LocalAuth({
          dataPath: './whatsapp_auth',
        }),
        webVersion: '2.2402.5',
        webVersionCache: {
          type: 'none'
        },
        puppeteer: {
          headless: false, // MODO DEBUG: mostrar navegador
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1200,800'
          ]
        }
      });

      console.log('Configurando eventos do cliente...');

      whatsappClient.on('qr', async (qr) => {
        try {
          console.log('=== QR CODE GERADO ===');
          console.log('QR Code recebido do WhatsApp Web, tamanho:', qr?.length || 0);
          console.log('QR Code válido?', !!qr && qr.length > 0);
          isAuthenticated = false;
          isInitializing = false;
          
          console.log('Convertendo QR Code para Data URL...');
          const qrCodeDataUrl = await qrcode.toDataURL(qr);
          console.log('QR Code convertido para Data URL, tamanho:', qrCodeDataUrl?.length || 0);
          console.log('Data URL válida?', !!qrCodeDataUrl && qrCodeDataUrl.startsWith('data:image/'));
          
          console.log('Enviando QR Code para o cliente...');
          socket.emit('qr-code', qrCodeDataUrl);
          socket.emit('whatsapp-status', { 
            connected: false, 
            status: 'qr_received' 
          });
          
          console.log('QR Code enviado para o cliente com sucesso!');
        } catch (error) {
          console.error('=== ERRO AO GERAR QR CODE ===');
          console.error('Erro completo:', error);
          console.error('Stack trace:', error.stack);
          isInitializing = false;
          socket.emit('error', `Erro ao gerar QR Code: ${error.message}`);
        }
      });

      whatsappClient.on('ready', () => {
        console.log('=== WHATSAPP PRONTO ===');
        isAuthenticated = true;
        isInitializing = false;
        socket.emit('whatsapp-status', { 
          connected: true, 
          status: 'ready' 
        });
      });

      whatsappClient.on('disconnected', (reason) => {
        console.log('=== WHATSAPP DESCONECTADO ===');
        console.log('Motivo:', reason);
        whatsappClient = null;
        isAuthenticated = false;
        isInitializing = false;
        socket.emit('whatsapp-status', { 
          connected: false, 
          status: 'disconnected' 
        });
      });

      whatsappClient.on('message', (message) => {
        console.log('Mensagem recebida:', message.body);
        socket.emit('message-received', {
          from: message.from,
          body: message.body,
          timestamp: message.timestamp
        });
      });

      whatsappClient.on('auth_failure', (msg) => {
        console.error('=== FALHA NA AUTENTICAÇÃO ===');
        console.error('Mensagem:', msg);
        whatsappClient = null;
        isAuthenticated = false;
        isInitializing = false;
        socket.emit('whatsapp-status', { 
          connected: false, 
          status: 'auth_failed' 
        });
      });

      whatsappClient.on('loading_screen', (percent, message) => {
        console.log('Carregando WhatsApp:', percent + '%', message);
      });

      // Adicionar mais eventos para debug
      whatsappClient.on('authenticated', () => {
        console.log('=== WHATSAPP AUTENTICADO ===');
      });

      whatsappClient.on('auth_failure', (msg) => {
        console.error('=== FALHA NA AUTENTICAÇÃO ===');
        console.error('Mensagem:', msg);
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

server.listen(PORT, () => {
  console.log(`=== SERVIDOR INICIADO ===`);
  console.log(`Porta: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Socket.IO: http://localhost:${PORT}`);
  console.log(`Frontend deve conectar em: http://localhost:3002`);
});
