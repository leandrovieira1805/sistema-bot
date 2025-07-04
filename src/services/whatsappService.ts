import { io, Socket } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

class WhatsAppService {
  private socket: Socket | null = null;
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

  private connect() {
    console.log('=== WHATSAPP SERVICE: Conectando ao servidor ===');
    console.log('Socket URL:', SOCKET_URL);
    this.socket = io(SOCKET_URL);

    this.socket.on('connect', () => {
      console.log('✅ Conectado ao servidor WhatsApp');
      console.log('Socket ID:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor WhatsApp');
    });

    this.socket.on('qr-code', (qrCodeDataUrl: string) => {
      console.log('=== QR CODE RECEBIDO NO SERVICE ===');
      console.log('QR Code recebido, tamanho:', qrCodeDataUrl?.length || 0);
      console.log('QR Code válido?', !!qrCodeDataUrl && qrCodeDataUrl.length > 100);
      console.log('Primeiros 50 chars:', qrCodeDataUrl?.substring(0, 50) + '...');
      
      // Sempre chamar o callback (agora sempre definido)
      console.log('Chamando callback onQR...');
      this.callbacks.onQR(qrCodeDataUrl);
      console.log('Callback onQR executado');
    });

    this.socket.on('whatsapp-status', (status: { connected: boolean; status: string }) => {
      console.log('📱 Status WhatsApp recebido:', status);
      if (status.connected) {
        console.log('Chamando callback onReady...');
        this.callbacks.onReady();
      } else if (
        !status.connected &&
        status.status !== 'qr_received' &&
        status.status !== 'initializing'
      ) {
        console.log('Chamando callback onDisconnected...');
        this.callbacks.onDisconnected();
      }
    });

    this.socket.on('message-received', (message: any) => {
      console.log('📨 Mensagem recebida:', message);
      this.callbacks.onMessage(message);
    });

    this.socket.on('error', (error: string) => {
      console.error('❌ Erro do servidor:', error);
      this.callbacks.onError(error);
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
    console.log('Callbacks recebidos:', { 
      onQR: !!onQR, 
      onReady: !!onReady, 
      onDisconnected: !!onDisconnected, 
      onMessage: !!onMessage, 
      onError: !!onError 
    });
    
    // Atualizar callbacks com os fornecidos ou manter os padrões
    this.callbacks = { 
      onQR: onQR || this.callbacks.onQR,
      onReady: onReady || this.callbacks.onReady,
      onDisconnected: onDisconnected || this.callbacks.onDisconnected,
      onMessage: onMessage || this.callbacks.onMessage,
      onError: onError || this.callbacks.onError
    };
    
    if (this.socket && this.socket.connected) {
      console.log('✅ Socket conectado, emitindo init-whatsapp...');
      this.socket.emit('init-whatsapp');
      console.log('✅ init-whatsapp emitido com sucesso');
    } else {
      console.error('❌ Socket não está disponível ou não conectado!');
      console.log('Socket existe?', !!this.socket);
      console.log('Socket conectado?', this.socket?.connected);
      if (onError) {
        onError('Socket não está conectado');
      }
    }
  }

  public disconnectWhatsApp() {
    console.log('=== WHATSAPP SERVICE: disconnectWhatsApp ===');
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