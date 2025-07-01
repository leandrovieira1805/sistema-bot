import { io } from 'socket.io-client';

console.log('=== TESTE SIMPLES DO QR CODE ===');

const socket = io('http://localhost:3002');

socket.on('connect', () => {
  console.log('✅ Conectado ao servidor');
  console.log('Socket ID:', socket.id);
  
  // Aguardar 2 segundos e então iniciar WhatsApp
  setTimeout(() => {
    console.log('🔄 Iniciando WhatsApp...');
    socket.emit('init-whatsapp');
  }, 2000);
});

socket.on('whatsapp-status', (status) => {
  console.log('📱 Status:', status);
});

socket.on('qr-code', (qrCodeDataUrl) => {
  console.log('📱 QR Code recebido!');
  console.log('Tamanho:', qrCodeDataUrl?.length || 0);
  console.log('Válido?', !!qrCodeDataUrl && qrCodeDataUrl.startsWith('data:image/'));
  console.log('Primeiros 50 chars:', qrCodeDataUrl?.substring(0, 50) + '...');
  
  if (qrCodeDataUrl && qrCodeDataUrl.startsWith('data:image/')) {
    console.log('✅ QR Code válido recebido!');
  } else {
    console.log('❌ QR Code inválido ou vazio');
  }
});

socket.on('error', (error) => {
  console.error('❌ Erro:', error);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado do servidor');
});

// Timeout para parar o teste após 30 segundos
setTimeout(() => {
  console.log('⏰ Teste finalizado');
  socket.disconnect();
  process.exit(0);
}, 30000); 