import { io } from 'socket.io-client';

console.log('=== TESTE ESPECÍFICO DO QR CODE ===');

const socket = io('http://localhost:3002');

let qrReceived = false;
let statusReceived = false;

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
  statusReceived = true;
  
  if (status.status === 'qr_received') {
    console.log('✅ Status qr_received recebido!');
  }
});

socket.on('qr-code', (qrCodeDataUrl) => {
  console.log('📱 QR Code recebido!');
  console.log('Tamanho do QR Code:', qrCodeDataUrl?.length || 0);
  console.log('QR Code válido?', !!qrCodeDataUrl && qrCodeDataUrl.length > 100);
  console.log('QR Code (primeiros 50 chars):', qrCodeDataUrl?.substring(0, 50) + '...');
  console.log('QR Code (últimos 50 chars):', qrCodeDataUrl?.substring(qrCodeDataUrl.length - 50) + '...');
  
  qrReceived = true;
  
  // Verificar se é uma imagem válida
  if (qrCodeDataUrl && qrCodeDataUrl.startsWith('data:image/')) {
    console.log('✅ QR Code parece ser uma imagem válida');
  } else {
    console.log('❌ QR Code não parece ser uma imagem válida');
  }
});

socket.on('error', (error) => {
  console.error('❌ Erro:', error);
});

// Timeout para encerrar o teste
setTimeout(() => {
  console.log('\n=== RESUMO DO TESTE ===');
  console.log('Status recebido?', statusReceived);
  console.log('QR Code recebido?', qrReceived);
  
  if (!qrReceived) {
    console.log('❌ PROBLEMA: QR Code não foi recebido!');
  } else {
    console.log('✅ QR Code foi recebido com sucesso!');
  }
  
  socket.disconnect();
  process.exit(0);
}, 15000); 