import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_DATA_FILE = path.join(__dirname, 'data', 'store-data.json');

// Criar diretório data se não existir
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Diretório data criado');
}

const storeData = {
  config: {
    name: 'Pizzaria Delícia',
    greeting: 'Olá! Seja bem-vindo à Pizzaria Delícia. Digite o número da opção desejada:\n1. Ver Cardápio 📖\n2. Ver Promoções 🔥',
    deliveryFee: 5.00,
    pixKey: 'contato@pizzariadelicia.com.br',
    address: 'Rua das Pizzas, 123 - Centro - Cidade Exemplo',
    menuImage: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800'
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
        }
      ]
    }
  ],
  promotions: []
};

try {
  console.log('💾 Salvando em:', STORE_DATA_FILE);
  fs.writeFileSync(STORE_DATA_FILE, JSON.stringify(storeData, null, 2));
  console.log('✅ Arquivo salvo com sucesso!');
  
  // Testar leitura
  const loadedData = fs.readFileSync(STORE_DATA_FILE, 'utf8');
  const parsedData = JSON.parse(loadedData);
  console.log('✅ Arquivo lido com sucesso!');
  console.log('📋 Nome da loja:', parsedData.config.name);
  
} catch (error) {
  console.error('❌ Erro:', error);
} 