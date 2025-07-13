import { io } from 'socket.io-client';

console.log('=== TESTE DE CONEXÃO SOCKET.IO ===');

const socket = io('http://localhost:3002');

socket.on('connect', () => {
  console.log('✅ Conectado ao servidor Socket.IO');
  console.log('Socket ID:', socket.id);
  
  // Testar inicialização do WhatsApp
  console.log('🔄 Iniciando WhatsApp...');
  socket.emit('init-whatsapp');
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado do servidor');
});

socket.on('whatsapp-status', (status) => {
  console.log('📱 Status WhatsApp:', status);
});

socket.on('qr-code', (qrCodeDataUrl) => {
  console.log('📱 QR Code recebido!');
  console.log('QR Code (primeiros 50 chars):', qrCodeDataUrl.substring(0, 50) + '...');
});

socket.on('error', (error) => {
  console.error('❌ Erro:', error);
});

// Timeout para encerrar o teste
setTimeout(() => {
  console.log('⏰ Teste finalizado');
  socket.disconnect();
  process.exit(0);
}, 10000); 