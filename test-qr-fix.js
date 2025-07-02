import { io } from 'socket.io-client';

const socket = io('http://localhost:3002');

console.log('=== TESTE QR CODE ===');

socket.on('connect', () => {
  console.log('✅ Conectado ao servidor');
  console.log('Socket ID:', socket.id);
  
  // Emitir evento para inicializar WhatsApp
  console.log('Emitting init-whatsapp...');
  socket.emit('init-whatsapp');
});

socket.on('whatsapp-status', (status) => {
  console.log('📱 Status WhatsApp:', status);
});

socket.on('qr-code', async (qrCodeDataUrl) => {
  console.log('=== QR CODE RECEBIDO ===');
  console.log('QR Code recebido, tamanho:', qrCodeDataUrl?.length || 0);
  console.log('QR Code válido?', !!qrCodeDataUrl && qrCodeDataUrl.length > 100);
  console.log('Primeiros 50 chars:', qrCodeDataUrl?.substring(0, 50) + '...');
  
  // Salvar QR code em arquivo para verificar
  const fs = await import('fs');
  fs.writeFileSync('qr-code-test.png', qrCodeDataUrl.replace('data:image/png;base64,', ''), 'base64');
  console.log('✅ QR Code salvo em qr-code-test.png');
  
  // Desconectar após receber QR code
  setTimeout(() => {
    console.log('Desconectando...');
    socket.disconnect();
    process.exit(0);
  }, 5000);
});

socket.on('error', (error) => {
  console.error('❌ Erro:', error);
  socket.disconnect();
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado do servidor');
});

// Timeout de 30 segundos
setTimeout(() => {
  console.log('⏰ Timeout - não recebeu QR code em 30 segundos');
  socket.disconnect();
  process.exit(1);
}, 30000); 