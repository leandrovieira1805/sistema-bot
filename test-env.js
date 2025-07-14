import 'dotenv/config';

console.log('=== TESTE DE VARIÁVEIS DE AMBIENTE ===');
console.log('API Key configurada:', !!process.env.OPENAI_API_KEY);
console.log('Primeiros 10 caracteres:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
console.log('Porta configurada:', process.env.PORT || 'não definida');
console.log('NODE_ENV:', process.env.NODE_ENV || 'não definido');
console.log('=== FIM DO TESTE ==='); 