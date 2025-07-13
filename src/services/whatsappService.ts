import { io, Socket } from 'socket.io-client';

// Detectar automaticamente se está em produção ou desenvolvimento
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const SOCKET_URL = isProduction 
  ? window.location.origin // Usar o mesmo domínio em produção
  : 'http://localhost:3002'; // Usar localhost em desenvolvimento

console.log('🌍 Ambiente detectado:', isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
console.log('🔗 Socket URL:', SOCKET_URL);
console.log('📍 Hostname:', window.location.hostname);

class WhatsAppService {
  private socket: Socket | null = null;
  private isInitializing: boolean = false; // Flag para evitar inicializações simultâneas
  private callbacks: {
    onQR: (qr: string) => void;
    onReady: () => void;
    onDisconnected: () => void;
    onMessage: (message: any) => void;
    onError: (error: string) => void;
  } = {
    onQR: () => console.log('Callback onQR não fornecido'),
    onReady: () => console.log('Callback onReady não fornecido'),
    onDisconnected: () => console.log('Callback onDisconnected não fornecido'),
    onMessage: () => console.log('Callback onMessage não fornecido'),
    onError: (error: string) => console.error('Erro não tratado:', error)
  };

  constructor() {
    this.connect();
  }

  // Função segura para executar callbacks
  private safeExecuteCallback(callback: () => void, name: string) {
    try {
      // Executar de forma assíncrona para evitar bloqueios de DOM
      setTimeout(() => {
        try {
          console.log(`Executando callback ${name} de forma segura...`);
          callback();
          console.log(`Callback ${name} executado com sucesso`);
        } catch (error) {
          console.error(`Erro ao executar callback ${name}:`, error);
        }
      }, 0);
    } catch (error) {
      console.error(`Erro ao agendar callback ${name}:`, error);
    }
  }

  private connect() {
    console.log('=== WHATSAPP SERVICE: Conectando ao servidor ===');
    console.log('Socket URL:', SOCKET_URL);
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Conectado ao servidor WhatsApp');
      console.log('Socket ID:', this.socket?.id);
      console.log('Socket conectado?', this.socket?.connected);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor WhatsApp');
      console.log('Socket conectado?', this.socket?.connected);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão:', error);
    });

    this.socket.on('qr-code', (qrCodeDataUrl: string) => {
      console.log('=== QR CODE RECEBIDO NO SERVICE ===');
      console.log('QR Code recebido, tamanho:', qrCodeDataUrl?.length || 0);
      console.log('QR Code válido?', !!qrCodeDataUrl && qrCodeDataUrl.length > 100);
      console.log('Primeiros 50 chars:', qrCodeDataUrl?.substring(0, 50) + '...');
      console.log('Últimos 50 chars:', qrCodeDataUrl?.substring(qrCodeDataUrl.length - 50) + '...');
      console.log('Callbacks disponíveis:', Object.keys(this.callbacks));
      console.log('Callback onQR existe?', !!this.callbacks.onQR);
      
      // Executar callback de forma segura
      this.safeExecuteCallback(() => this.callbacks.onQR(qrCodeDataUrl), 'onQR');
    });

    this.socket.on('whatsapp-status', (status: { connected: boolean; status: string }) => {
      console.log('📱 Status WhatsApp recebido:', status);
      console.log('Status completo:', JSON.stringify(status, null, 2));
      
      // Reset da flag de inicialização quando receber qualquer status
      if (this.isInitializing) {
        console.log('🔄 Resetando flag de inicialização');
        this.isInitializing = false;
      }
      
      if (status.connected) {
        console.log('Chamando callback onReady de forma segura...');
        // Delay adicional para o callback onReady
        setTimeout(() => {
          this.safeExecuteCallback(() => this.callbacks.onReady(), 'onReady');
        }, 100);
      } else if (
        !status.connected &&
        status.status !== 'qr_received' &&
        status.status !== 'initializing'
      ) {
        console.log('Chamando callback onDisconnected de forma segura...');
        this.safeExecuteCallback(() => this.callbacks.onDisconnected(), 'onDisconnected');
      }
    });

    this.socket.on('message-received', (message: any) => {
      console.log('📨 Mensagem recebida:', message);
      this.safeExecuteCallback(() => this.callbacks.onMessage(message), 'onMessage');
    });

    this.socket.on('error', (error: string) => {
      console.error('❌ Erro do servidor:', error);
      
      // Reset da flag de inicialização em caso de erro
      if (this.isInitializing) {
        console.log('🔄 Resetando flag de inicialização devido a erro');
        this.isInitializing = false;
      }
      
      this.safeExecuteCallback(() => this.callbacks.onError(error), 'onError');
    });
  }

  public initializeWhatsApp(
    onQR?: (qr: string) => void,
    onReady?: () => void,
    onDisconnected?: () => void,
    onMessage?: (message: any) => void,
    onError?: (error: string) => void
  ) {
    console.log('=== WHATSAPP SERVICE: initializeWhatsApp ===');
    console.log('Socket conectado?', this.socket?.connected);
    console.log('Socket ID:', this.socket?.id);
    console.log('Já está inicializando?', this.isInitializing);
    console.log('Callbacks recebidos:', { 
      onQR: !!onQR, 
      onReady: !!onReady, 
      onDisconnected: !!onDisconnected, 
      onMessage: !!onMessage, 
      onError: !!onError 
    });
    
    // Evitar inicializações simultâneas
    if (this.isInitializing) {
      console.log('⚠️ WhatsApp já está sendo inicializado, ignorando nova chamada');
      return;
    }
    
    // Atualizar callbacks com os fornecidos ou manter os padrões
    this.callbacks = { 
      onQR: onQR || this.callbacks.onQR,
      onReady: onReady || this.callbacks.onReady,
      onDisconnected: onDisconnected || this.callbacks.onDisconnected,
      onMessage: onMessage || this.callbacks.onMessage,
      onError: onError || this.callbacks.onError
    };
    
    // Função para tentar inicializar
    const tryInitialize = () => {
    if (this.socket && this.socket.connected) {
      console.log('✅ Socket conectado, emitindo init-whatsapp...');
        this.isInitializing = true;
      this.socket.emit('init-whatsapp');
      console.log('✅ init-whatsapp emitido com sucesso');
    } else {
        console.log('⏳ Socket não conectado ainda, aguardando...');
        // Tentar novamente em 500ms (mais rápido)
        setTimeout(() => {
          if (this.socket && this.socket.connected) {
            tryInitialize();
          } else {
            console.error('❌ Socket não conectou após timeout');
            this.isInitializing = false;
            if (onError) {
              this.safeExecuteCallback(() => onError('Socket não conseguiu conectar'), 'onError');
            }
          }
        }, 500);
      }
    };
    
    // Iniciar tentativa de inicialização
    tryInitialize();
  }

  public disconnectWhatsApp() {
    console.log('=== WHATSAPP SERVICE: disconnectWhatsApp ===');
    
    // Reset da flag de inicialização
    this.isInitializing = false;
    
    if (this.socket) {
      this.socket.emit('disconnect-whatsapp');
      console.log('disconnect-whatsapp emitido');
    }
  }

  public sendMessage(to: string, message: string) {
    if (this.socket) {
      this.socket.emit('send-message', { to, message });
    }
  }

  public checkStatus() {
    if (this.socket) {
      this.socket.emit('check-status');
    }
  }

  public isConnected(): boolean {
    console.log('=== WHATSAPP SERVICE: isConnected ===');
    console.log('Socket existe?', !!this.socket);
    console.log('Socket conectado?', this.socket?.connected);
    const connected = this.socket?.connected || false;
    console.log('Retornando:', connected);
    return connected;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public getSocket() {
    return this.socket;
  }
}

// Instância singleton
export const whatsappService = new WhatsAppService();

export const initializeWhatsApp = (
  onQR?: (qr: string) => void,
  onReady?: () => void,
  onDisconnected?: () => void,
  onMessage?: (message: any) => void,
  onError?: (error: string) => void
) => {
  console.log('=== EXPORT: initializeWhatsApp ===');
  whatsappService.initializeWhatsApp(onQR, onReady, onDisconnected, onMessage, onError);
};

export const disconnectWhatsApp = () => {
  console.log('=== EXPORT: disconnectWhatsApp ===');
  whatsappService.disconnectWhatsApp();
};

export const sendMessage = (to: string, message: string) => {
  whatsappService.sendMessage(to, message);
};

export const isConnected = (): boolean => {
  return whatsappService.isConnected();
};

export const getWhatsAppClient = () => {
  return null; // Não exposto no frontend
}; 

// Exportar o socket para uso em outros componentes
export const socket = whatsappService.getSocket(); 