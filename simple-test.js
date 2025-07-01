import qrcode from 'qrcode';

console.log('=== TESTE SIMPLES DO QR CODE ===');

// Teste 1: Gerar QR code simples
const testData = 'https://wa.me/5511999999999';
console.log('Gerando QR code para:', testData);

try {
  const qrCodeDataUrl = await qrcode.toDataURL(testData);
  console.log('✅ QR Code gerado com sucesso!');
  console.log('Tamanho:', qrCodeDataUrl.length);
  console.log('Primeiros 50 chars:', qrCodeDataUrl.substring(0, 50) + '...');
  console.log('É uma imagem válida?', qrCodeDataUrl.startsWith('data:image/'));
} catch (error) {
  console.error('❌ Erro ao gerar QR code:', error);
}

console.log('Teste concluído!'); 