import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import whatsapp from 'whatsapp-web.js';
import qrcode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client, LocalAuth } = whatsapp;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3002;

// Configurações básicas
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Dados de usuários com suas próprias configurações e produtos
const users = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@exemplo.com',
    password: 'admin123',
    storeConfig: {
      name: 'Pizzaria Delícia',
      greeting: 'Olá! Seja bem-vindo à Pizzaria Delícia. Digite o número da opção desejada:\n1. Ver Cardápio 📖\n2. Ver Promoções 🔥',
      deliveryFee: 5.00,
      pixKey: 'contato@pizzariadelicia.com.br',
      address: 'Rua das Pizzas, 123 - Centro - Cidade Exemplo',
      menuImage: 'https://exemplo.com/cardapio.jpg'
    },
    categories: [
      {
        id: '1',
        name: 'Pizzas',
        products: [
          {
            id: '1',
            name: 'Pizza Margherita',
            price: 25.00,
            image: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=400',
            categoryId: '1',
            unit: 'unit',
            unitLabel: 'unidade',
            packSize: 1,
            packPrice: 0,
            unitPrice: 25.00
          },
          {
            id: '2',
            name: 'Pizza Calabresa',
            price: 28.00,
            image: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=400',
            categoryId: '1',
            unit: 'unit',
            unitLabel: 'unidade',
            packSize: 1,
            packPrice: 0,
            unitPrice: 28.00
          }
        ]
      },
      {
        id: '2',
        name: 'Bebidas',
        products: [
          {
            id: '3',
            name: 'Coca-Cola 2L',
            price: 8.00,
            image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
            categoryId: '2',
            unit: 'unit',
            unitLabel: 'unidade',
            packSize: 1,
            packPrice: 0,
            unitPrice: 8.00
          }
        ]
      }
    ],
    promotions: [],
    orders: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    username: 'evellynlavinian',
    email: 'evellynlavinian@gmail.com',
    password: 'evellyn.nsouza',
    storeConfig: {
      name: 'Bebidas Delícia',
      greeting: 'Olá! Seja bem-vindo à Bebidas Delícia. Digite o número da opção desejada:\n1. Ver Catálogo de Bebidas 🥤\n2. Ver Promoções 🔥',
      deliveryFee: 3.00,
      pixKey: 'contato@bebidasdelicia.com.br',
      address: 'Rua das Bebidas, 123 - Centro - Cidade Exemplo',
      menuImage: 'https://exemplo.com/cardapio-bebidas.jpg'
    },
    categories: [
      {
        id: '1',
        name: 'Cervejas',
        products: [
          {
            id: '1',
            name: 'Heineken',
            price: 4.50,
            image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=400',
            categoryId: '1',
            unit: 'pack',
            unitLabel: 'fardo',
            packSize: 12,
            packPrice: 45.00,
            unitPrice: 4.50
          },
          {
            id: '2', 
            name: 'Brahma',
            price: 3.00,
            image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=400',
            categoryId: '1',
            unit: 'pack',
            unitLabel: 'fardo',
            packSize: 12,
            packPrice: 30.00,
            unitPrice: 3.00
          }
        ]
      },
      {
        id: '2',
        name: 'Refrigerantes',
        products: [
          {
            id: '3',
            name: 'Coca-Cola 2L',
            price: 8.00,
            image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
            categoryId: '2',
            unit: 'pack',
            unitLabel: 'fardo',
            packSize: 6,
            packPrice: 42.00,
            unitPrice: 8.00
          },
          {
            id: '4',
            name: 'Pepsi 2L',
            price: 7.50,
            image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
            categoryId: '2',
            unit: 'pack',
            unitLabel: 'fardo',
            packSize: 6,
            packPrice: 39.00,
            unitPrice: 7.50
          }
        ]
      },
      {
        id: '3',
        name: 'Bebidas Especiais',
        products: [
          {
            id: '5',
            name: 'Red Bull 250ml',
            price: 12.00,
            image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=400',
            categoryId: '3',
            unit: 'unit',
            unitLabel: 'unidade',
            packSize: 1,
            packPrice: 0,
            unitPrice: 12.00
          },
          {
            id: '6',
            name: 'Água Crystal 500ml',
            price: 2.50,
            image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=400',
            categoryId: '3',
            unit: 'pack',
            unitLabel: 'fardo',
            packSize: 12,
            packPrice: 25.00,
            unitPrice: 2.50
          }
        ]
      }
    ],
    promotions: [],
    orders: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Função para obter dados do usuário atual
function getCurrentUserData(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) {
    return null;
  }
  
  return {
    config: user.storeConfig,
    categories: user.categories,
    promotions: user.promotions,
    orders: user.orders
  };
}

// Função para atualizar dados do usuário
function updateUserData(userId, data) {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return false;
  }
  
  if (data.config) {
    users[userIndex].storeConfig = { ...users[userIndex].storeConfig, ...data.config };
  }
  if (data.categories) {
    users[userIndex].categories = data.categories;
  }
  if (data.promotions) {
    users[userIndex].promotions = data.promotions;
  }
  if (data.orders) {
    users[userIndex].orders = data.orders;
  }
  
  users[userIndex].updatedAt = new Date();
  return true;
}

// Função para obter todos os produtos do usuário
function getAllProducts(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) {
    return [];
  }
  
  return user.categories.flatMap(category => category.products);
}

// Função para encontrar produto por nome do usuário
function findProductByName(name, userId) {
  const user = users.find(u => u.id === userId);
  if (!user) {
    return null;
  }
  
  for (const category of user.categories) {
    const product = category.products.find(p => 
      p.name.toLowerCase().includes(name.toLowerCase())
    );
    if (product) {
      return product;
    }
  }
  return null;
}

// Variáveis do WhatsApp
let whatsappClient = null;
let isAuthenticated = false;
let isInitializing = false;
let qrCodeTimeout = null;
let currentQRCode = null;
let currentUserId = null; // Usuário atual conectado ao WhatsApp

// Sessões de clientes (mantém separado por usuário)
const customerSessions = new Map();

// Sistema de IA para correção de digitações e reconhecimento
class AIProductMatcher {
  constructor() {
    // Dicionário de números por extenso
    this.numberWords = {
      'zero': 0, 'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'tres': 3, 'três': 3,
      'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
      'onze': 11, 'doze': 12, 'treze': 13, 'quatorze': 14, 'catorze': 14, 'quinze': 15,
      'dezesseis': 16, 'dezessete': 17, 'dezoito': 18, 'dezenove': 19, 'vinte': 20,
      'trinta': 30, 'quarenta': 40, 'cinquenta': 50, 'sessenta': 60, 'setenta': 70,
      'oitenta': 80, 'noventa': 90, 'cem': 100, 'cento': 100, 'mil': 1000
    };

    // Palavras comuns que podem ser ignoradas
    this.stopWords = ['quero', 'gostaria', 'desejo', 'pedir', 'pedido', 'por', 'favor', 'me', 'dê', 'de', 'uma', 'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];
    
    // Correções comuns de digitação
    this.commonTypos = {
      'piza': 'pizza', 'pizz': 'pizza', 'pizzza': 'pizza',
      'hamburguer': 'hambúrguer', 'hamburguer': 'hambúrguer',
      'refrigerante': 'refrigerante', 'refri': 'refrigerante',
      'batata': 'batata frita', 'batatas': 'batata frita', 'fritas': 'batata frita',
      'suco': 'suco natural', 'sucos': 'suco natural', 'natural': 'suco natural',
      'sobremesa': 'sobremesa', 'sobremesas': 'sobremesa', 'doce': 'sobremesa',
      'salada': 'salada', 'saladas': 'salada', 'verdura': 'salada',
      // Adicionar variações para Coca-Cola
      'coca': 'coca cola', 'coca cola': 'coca cola', 'cocacola': 'coca cola',
      'coca-cola': 'coca cola', 'coca cola 2l': 'coca cola 2l', 'coca 2l': 'coca cola 2l',
      'coca cola 2 litros': 'coca cola 2l', 'coca 2 litros': 'coca cola 2l',
      'refrigerante coca': 'coca cola 2l', 'refri coca': 'coca cola 2l',
      // Adicionar variações para Pepsi
      'pepsi': 'pepsi 2l', 'pepsi 2 litros': 'pepsi 2l', 'refrigerante pepsi': 'pepsi 2l',
      // Adicionar variações para Heineken
      'heineken': 'heineken', 'cerveja heineken': 'heineken', 'heineken cerveja': 'heineken',
      // Adicionar variações para Brahma
      'brahma': 'brahma', 'cerveja brahma': 'brahma', 'brahma cerveja': 'brahma',
      // Adicionar variações para Red Bull
      'red bull': 'red bull 250ml', 'redbull': 'red bull 250ml', 'energetico': 'red bull 250ml',
      'energético': 'red bull 250ml', 'red bull 250': 'red bull 250ml',
      // Adicionar variações para Água
      'agua': 'agua crystal 500ml', 'água': 'agua crystal 500ml', 'agua crystal': 'agua crystal 500ml',
      'água crystal': 'agua crystal 500ml', 'agua 500ml': 'agua crystal 500ml'
    };
  }

  // Calcular similaridade entre duas strings (algoritmo de Levenshtein)
  calculateSimilarity(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
  }

  // Normalizar texto removendo acentos e caracteres especiais
  normalizeText(text) {
    let normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Aplicar correções comuns
    for (const [wrong, correct] of Object.entries(this.commonTypos)) {
      if (normalized.includes(wrong)) {
        normalized = normalized.replace(wrong, correct);
      }
    }
    
    return normalized;
  }

  // Extrair números do texto
  extractNumbers(text) {
    const normalizedText = this.normalizeText(text);
    const words = normalizedText.split(' ');
    const numbers = [];
    let currentNumber = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      if (this.numberWords[word] !== undefined) {
        const num = this.numberWords[word];
        if (num >= 100) {
          currentNumber = currentNumber * num;
        } else if (num >= 10 && num % 10 === 0) {
          currentNumber = currentNumber + num;
        } else {
          currentNumber = currentNumber + num;
        }
      } else if (/\d+/.test(word)) {
        numbers.push(parseInt(word));
      } else if (currentNumber > 0) {
        numbers.push(currentNumber);
        currentNumber = 0;
      }
    }

    if (currentNumber > 0) {
      numbers.push(currentNumber);
    }

    return numbers;
  }

  // Corrigir digitações comuns
  correctCommonTypos(text) {
    const normalizedText = this.normalizeText(text);
    let correctedText = normalizedText;

    for (const [typo, correction] of Object.entries(this.commonTypos)) {
      correctedText = correctedText.replace(new RegExp(`\\b${typo}\\b`, 'g'), correction);
    }

    return correctedText;
  }

  // Encontrar produto com IA
  findProductWithAI(inputText, products) {
    const normalizedInput = this.normalizeText(inputText);
    const correctedInput = this.correctCommonTypos(normalizedInput);
    
    console.log(`=== BUSCA DE PRODUTO ===`);
    console.log(`Input original: "${inputText}"`);
    console.log(`Input normalizado: "${normalizedInput}"`);
    console.log(`Input corrigido: "${correctedInput}"`);
    
    // Extrair números do input
    const numbers = this.extractNumbers(inputText);
    
    // Remover palavras irrelevantes
    const relevantWords = correctedInput
      .split(' ')
      .filter(word => !this.stopWords.includes(word) && word.length > 2)
      .join(' ');

    console.log(`Palavras relevantes: "${relevantWords}"`);

    let bestMatch = null;
    let bestScore = 0;
    let suggestions = [];

    for (const product of products) {
      const normalizedProductName = this.normalizeText(product.name);
      console.log(`Comparando com: "${product.name}" (normalizado: "${normalizedProductName}")`);
      
      // Calcular similaridade com o nome do produto
      const nameSimilarity = this.calculateSimilarity(relevantWords, normalizedProductName);
      
      // Verificar se há palavras-chave do produto no input
      const productWords = normalizedProductName.split(' ');
      const inputWords = relevantWords.split(' ');
      let keywordMatches = 0;
      
      for (const productWord of productWords) {
        for (const inputWord of inputWords) {
          if (this.calculateSimilarity(productWord, inputWord) > 0.7) {
            keywordMatches++;
          }
        }
      }
      
      const keywordScore = keywordMatches / Math.max(productWords.length, 1);
      
      // Score final combinando similaridade e palavras-chave
      const finalScore = (nameSimilarity * 0.6) + (keywordScore * 0.4);
      
      console.log(`Score para "${product.name}": ${(finalScore * 100).toFixed(1)}% (similaridade: ${(nameSimilarity * 100).toFixed(1)}%, keywords: ${(keywordScore * 100).toFixed(1)}%)`);
      
      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestMatch = product;
      }
      
      // Adicionar sugestões para produtos com score > 0.3
      if (finalScore > 0.3) {
        suggestions.push({
          product,
          score: finalScore,
          reason: finalScore > 0.7 ? 'Correspondência exata' : 'Produto similar'
        });
      }
    }

    // Ordenar sugestões por score
    suggestions.sort((a, b) => b.score - a.score);

    const result = {
      bestMatch: bestScore > 0.5 ? bestMatch : null,
      suggestions: suggestions.slice(0, 3), // Limitar a 3 sugestões
      confidence: bestScore,
      correctedInput: correctedInput,
      numbers: numbers
    };

    console.log(`Melhor match: ${bestMatch ? bestMatch.name : 'Nenhum'} (confiança: ${(bestScore * 100).toFixed(1)}%)`);
    console.log(`Sugestões: ${suggestions.length}`);
    console.log(`========================`);

    return result;
  }

  // Gerar resposta inteligente
  generateSmartResponse(aiResult, products) {
    if (aiResult.bestMatch) {
      return {
        success: true,
        product: aiResult.bestMatch,
        message: `✅ ${aiResult.bestMatch.name} encontrado!`,
        confidence: aiResult.confidence
      };
    } else if (aiResult.suggestions.length > 0) {
      const suggestions = aiResult.suggestions
        .map(s => `${s.product.name}`)
        .join(', ');
      
      return {
        success: false,
        message: `Não encontrei "${aiResult.correctedInput}". Você quis dizer: ${suggestions}?`,
        suggestions: aiResult.suggestions,
        confidence: aiResult.confidence
      };
    } else {
      return {
        success: false,
        message: `Produto "${aiResult.correctedInput}" não encontrado. Digite "cardápio" para ver nossas opções.`,
        confidence: 0
      };
    }
  }
}

// Instanciar o sistema de IA
const aiMatcher = new AIProductMatcher();

// Função para limpar sessão do WhatsApp
async function clearWhatsAppSession() {
  try {
    const sessionPath = './whatsapp_auth/session/Default';
    if (fs.existsSync(sessionPath)) {
      // Tentar remover o arquivo chrome_debug.log especificamente
      const debugLogPath = path.join(sessionPath, 'chrome_debug.log');
      if (fs.existsSync(debugLogPath)) {
        try {
          fs.unlinkSync(debugLogPath);
          console.log('Arquivo chrome_debug.log removido com sucesso');
        } catch (error) {
          console.log('Não foi possível remover chrome_debug.log:', error.message);
        }
      }
      
      // Tentar remover outros arquivos de log que podem estar bloqueados
      const filesToRemove = ['chrome_debug.log', 'chrome_debug.log.old'];
      filesToRemove.forEach(file => {
        const filePath = path.join(sessionPath, file);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Arquivo ${file} removido com sucesso`);
          } catch (error) {
            console.log(`Não foi possível remover ${file}:`, error.message);
          }
        }
      });
    }
  } catch (error) {
    console.log('Erro ao limpar sessão:', error.message);
  }
}

// Função para calcular total do carrinho
function calculateCartTotal(cart) {
  const getProductPrice = (product) => {
    if (product.packPrice && product.packPrice > 0) {
      return product.packPrice;
    } else if (product.unitPrice && product.unitPrice > 0) {
      return product.unitPrice;
    } else {
      return product.price;
    }
  };

  const subtotal = cart.reduce((total, item) => total + (getProductPrice(item.product) * item.quantity), 0);
  const deliveryFee = getCurrentUserData(currentUserId).config.deliveryFee;
  return {
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee
  };
}

// Função para processar mensagem do cliente
async function processCustomerMessage(message, contactName) {
  const phone = message.from;
  let session = customerSessions.get(phone);
  
  if (!session) {
    session = {
      phone,
      cart: [],
      customerData: {},
      messages: [],
      step: 'greeting'
    };
  }

  const text = message.body.toLowerCase().trim();
  let response = '';
  let shouldSendImage = false;
  let imageUrl = '';

  switch (session.step) {
    case 'greeting':
      if (text === '1' || text.includes('cardápio') || text.includes('cardapio')) {
        // Enviar apenas a imagem do cardápio
        shouldSendImage = true;
        imageUrl = getCurrentUserData(currentUserId).config.menuImage;
        
        // Enviar mensagem de aguardando pedido após a imagem
        setTimeout(() => {
          const waitingMessage = {
            id: (Date.now() + 2).toString(),
            type: 'bot',
            content: 'Aguardando pedido... 😊\n\nDigite o nome do produto desejado.',
            timestamp: new Date()
          };
          session.messages.push(waitingMessage);
          customerSessions.set(phone, session);
        }, 1000);
        
        session.step = 'ordering';
      } else if (text === '2' || text.includes('promoção') || text.includes('promocao')) {
        response = 'Promoções em breve! Digite 1 para ver o cardápio.';
      } else {
        response = getCurrentUserData(currentUserId).config.greeting;
      }
      break;

    case 'ordering':
      // Usar IA para encontrar produto
      const aiResult = aiMatcher.findProductWithAI(text, getAllProducts(currentUserId));
      
      if (aiResult.bestMatch) {
        const product = aiResult.bestMatch;
        const existingItem = session.cart.find(item => item.product.id === product.id);
        
        // Verificar se há números no texto para quantidade
        const numbers = aiResult.numbers;
        const quantity = numbers.length > 0 ? numbers[0] : 1;
        
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          session.cart.push({
            product,
            quantity: quantity
          });
        }
        
        const cartTotal = calculateCartTotal(session.cart);
        response = `✅ ${product.name} x${quantity} adicionado ao carrinho!\n\n`;
        response += `Carrinho atual:\n`;
        response += session.cart.map(item => 
          `${item.product.name} x${item.quantity} - R$ ${(item.product.price * item.quantity).toFixed(2)}`
        ).join('\n');
        response += `\n\nSubtotal: R$ ${cartTotal.subtotal.toFixed(2)}`;
        response += `\nTaxa de entrega: R$ ${cartTotal.deliveryFee.toFixed(2)}`;
        response += `\nTotal: R$ ${cartTotal.total.toFixed(2)}`;
        response += `\n\nDigite "finalizar" para concluir o pedido ou continue adicionando produtos.`;
        session.step = 'ordering';
      } else if (text === 'finalizar' || text === 'finalizar pedido') {
        if (session.cart.length === 0) {
          response = 'Seu carrinho está vazio. Adicione produtos antes de finalizar.';
          session.step = 'ordering';
        } else {
          response = '📋 *FINALIZAR PEDIDO*\n\n';
          response += 'Seu pedido é para entrega ou retirada?\n';
          response += 'Digite "entrega" ou "retirada":';
          session.step = 'delivery_type';
        }
      } else {
        // Gerar resposta inteligente com sugestões
        const smartResponse = aiMatcher.generateSmartResponse(aiResult, getAllProducts(currentUserId));
        response = smartResponse.message;
        
        // Se há sugestões, adicionar ao histórico para referência
        if (smartResponse.suggestions && smartResponse.suggestions.length > 0) {
          session.suggestions = smartResponse.suggestions.map(s => s.product.name);
        }
      }
      break;

    case 'delivery_type':
      if (text === 'entrega' || text === 'delivery') {
        session.customerData.deliveryType = 'delivery';
        response = '📍 *ENDEREÇO DE ENTREGA*\n\n';
        response += 'Por favor, me informe sua rua:';
        session.step = 'address_street';
      } else if (text === 'retirada' || text === 'pickup') {
        session.customerData.deliveryType = 'pickup';
        response = '✅ Pedido para retirada!\n\n';
        response += 'Por favor, me informe seu nome:';
        session.step = 'customer_name';
      } else {
        response = 'Por favor, digite "entrega" ou "retirada":';
      }
      break;

    case 'address_street':
      session.customerData.street = message.body.trim();
      response = 'Agora me informe o número:';
      session.step = 'address_number';
      break;

    case 'address_number':
      session.customerData.number = message.body.trim();
      response = 'Agora me informe o bairro:';
      session.step = 'address_district';
      break;

    case 'address_district':
      session.customerData.district = message.body.trim();
      response = 'Agora me informe a cidade:';
      session.step = 'address_city';
      break;

    case 'address_city':
      session.customerData.city = message.body.trim();
      response = 'Por último, me informe um ponto de referência (opcional):';
      session.step = 'address_reference';
      break;

    case 'address_reference':
      session.customerData.reference = message.body.trim();
      
      // Montar endereço completo
      const address = `${session.customerData.street}, ${session.customerData.number} - ${session.customerData.district}, ${session.customerData.city}`;
      if (session.customerData.reference) {
        address += ` (Ref: ${session.customerData.reference})`;
      }
      session.customerData.address = address;
      
      response = '✅ Endereço completo registrado!\n\n';
      response += 'Por favor, me informe seu nome:';
      session.step = 'customer_name';
      break;

    case 'customer_name':
      session.customerData.name = message.body.trim();
      
      const cartTotalForCustomer = calculateCartTotal(session.cart);
      const isDelivery = session.customerData.deliveryType === 'delivery';
      
      response = `💰 *VALOR TOTAL*\n\n`;
      response += `Subtotal: R$ ${cartTotalForCustomer.subtotal.toFixed(2)}\n`;
      if (isDelivery) {
        response += `Taxa de entrega: R$ ${cartTotalForCustomer.deliveryFee.toFixed(2)}\n`;
      }
      response += `*Total: R$ ${cartTotalForCustomer.total.toFixed(2)}*\n\n`;
      response += `💳 *FORMA DE PAGAMENTO*\n\n`;
      response += `Escolha a forma de pagamento:\n`;
      response += `1. PIX\n`;
      response += `2. Dinheiro\n`;
      response += `3. Cartão\n\n`;
      response += `Digite o número da opção:`;
      session.step = 'payment_method';
      break;

    case 'payment_method':
      if (text === '1' || text === 'pix') {
        session.customerData.paymentMethod = 'PIX';
        const cartTotalForPayment = calculateCartTotal(session.cart);
        
        response = '💳 *PAGAMENTO VIA PIX*\n\n';
        response += `*Valor total:* R$ ${cartTotalForPayment.total.toFixed(2)}\n`;
        response += `*Chave PIX:* ${getCurrentUserData(currentUserId).config.pixKey}\n\n`;
        response += 'Após o pagamento, envie o comprovante para finalizar o pedido!';
        
        session.step = 'waiting_pix_proof';
        
      } else if (text === '2' || text === 'dinheiro') {
        session.customerData.paymentMethod = 'CASH';
        const cartTotalForCash = calculateCartTotal(session.cart);
        
        response = '💵 *PAGAMENTO EM DINHEIRO*\n\n';
        response += `*Valor total:* R$ ${cartTotalForCash.total.toFixed(2)}\n`;
        response += 'Informe o valor que você vai pagar:';
        session.step = 'cash_amount';
        
      } else if (text === '3' || text === 'cartão' || text === 'cartao') {
        session.customerData.paymentMethod = 'CARD';
        const cartTotalForCard = calculateCartTotal(session.cart);
        
        response = '💳 *PAGAMENTO COM CARTÃO*\n\n';
        response += `*Valor total:* R$ ${cartTotalForCard.total.toFixed(2)}\n`;
        response += 'Pedido confirmado! O pagamento será realizado na entrega/retirada.';
        
        // Finalizar pedido com cartão
        finalizeOrder(session, phone);
        
      } else {
        response = 'Opção inválida. Digite "1" para PIX, "2" para dinheiro ou "3" para cartão.';
      }
      break;

    case 'waiting_pix_proof':
      // Verificar se é uma imagem (comprovante PIX)
      if (message.hasMedia) {
        response = '✅ Comprovante PIX recebido!\n\n';
        response += 'Pedido confirmado e enviado para a cozinha! 🍕\n';
        response += 'Obrigado pela preferência!';
        
        // Finalizar pedido com PIX
        finalizeOrder(session, phone);
      } else {
        response = 'Por favor, envie o comprovante PIX (imagem) para finalizar o pedido.';
      }
      break;

    case 'cash_amount':
      const cashAmount = parseFloat(text.replace(',', '.'));
      const cartTotal = calculateCartTotal(session.cart);
      
      if (isNaN(cashAmount) || cashAmount < cartTotal.total) {
        response = `O valor deve ser maior ou igual ao total de R$ ${cartTotal.total.toFixed(2)}. Informe novamente:`;
      } else {
        const change = cashAmount - cartTotal.total;
        session.customerData.cashAmount = cashAmount;
        session.customerData.change = change;
        
        response = '💵 *PAGAMENTO EM DINHEIRO*\n\n';
        response += `*Valor total:* R$ ${cartTotal.total.toFixed(2)}\n`;
        response += `*Valor pago:* R$ ${cashAmount.toFixed(2)}\n`;
        response += `*Troco:* R$ ${change.toFixed(2)}\n\n`;
        response += 'Pedido confirmado e enviado para a cozinha! 🍕\n';
        response += 'Obrigado pela preferência!';
        
        // Finalizar pedido com dinheiro
        finalizeOrder(session, phone);
      }
      break;
  }

  // Adicionar resposta do bot ao histórico
  if (response) {
    session.messages.push({
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: response,
      timestamp: new Date()
    });
  }

  // Atualizar sessão
  customerSessions.set(phone, session);

  return { response, shouldSendImage, imageUrl };
}

// Função para finalizar pedido
function finalizeOrder(session, phone) {
  const cartTotal = calculateCartTotal(session.cart);
  const isDelivery = session.customerData.deliveryType === 'delivery';
  
  // Criar pedido
  const order = {
    id: Date.now().toString(),
    customerName: session.customerData.name,
    customerPhone: phone,
    items: [...session.cart],
    subtotal: cartTotal.subtotal,
    deliveryFee: isDelivery ? getCurrentUserData(currentUserId).config.deliveryFee : 0,
    total: cartTotal.total,
    address: session.customerData.address,
    deliveryType: session.customerData.deliveryType,
    paymentMethod: session.customerData.paymentMethod,
    cashAmount: session.customerData.cashAmount,
    change: session.customerData.change,
    status: 'NEW',
    createdAt: new Date()
  };
  
  // Adicionar pedido ao usuário atual
  const userIndex = users.findIndex(u => u.id === currentUserId);
  if (userIndex !== -1) {
    users[userIndex].orders.push(order);
    users[userIndex].updatedAt = new Date();
  }
  
  // Emitir evento para o frontend
  io.emit('new-order', order);
  
  // Limpar sessão
  customerSessions.delete(phone);
}

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    whatsapp: {
      client: !!whatsappClient,
      authenticated: isAuthenticated,
      initializing: isInitializing
    }
  });
});



// Rota para testar o sistema de IA
app.post('/api/ai/test', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ message: 'Texto é obrigatório' });
  }
  
  const products = getAllProducts(currentUserId);
  const aiResult = aiMatcher.findProductWithAI(text, products);
  const smartResponse = aiMatcher.generateSmartResponse(aiResult, products);
  
  res.json({
    input: text,
    normalized: aiMatcher.normalizeText(text),
    corrected: aiMatcher.correctCommonTypos(aiMatcher.normalizeText(text)),
    numbers: aiResult.numbers,
    aiResult: aiResult,
    response: smartResponse
  });
});



// Endpoint de healthcheck para o Railway
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Bot API'
  });
});

// Endpoint raiz também para healthcheck
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'WhatsApp Bot API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

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

  // Atualizar dados da loja
  socket.on('update-store-data', (data) => {
    console.log('=== ATUALIZANDO DADOS DA LOJA ===');
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    if (data.config) {
      console.log('Atualizando configurações...');
      updateUserData(currentUserId, { config: { ...getCurrentUserData(currentUserId).config, ...data.config } });
    }
    if (data.categories) {
      console.log('Atualizando categorias...');
      console.log('Categorias antigas:', getCurrentUserData(currentUserId).categories.length);
      updateUserData(currentUserId, { categories: data.categories });
      console.log('Categorias novas:', getCurrentUserData(currentUserId).categories.length);
      
      // Log detalhado dos produtos
      const totalProducts = getCurrentUserData(currentUserId).categories.reduce((sum, cat) => sum + cat.products.length, 0);
      console.log('Total de produtos após atualização:', totalProducts);
      
      getCurrentUserData(currentUserId).categories.forEach((cat, catIndex) => {
        console.log(`Categoria ${catIndex + 1}: ${cat.name} (${cat.products.length} produtos)`);
        cat.products.forEach((prod, prodIndex) => {
          console.log(`  - ${prodIndex + 1}. ${prod.name} - R$ ${prod.price.toFixed(2)}`);
        });
      });
    }
    if (data.promotions) {
      console.log('Atualizando promoções...');
      updateUserData(currentUserId, { promotions: data.promotions });
    }
    console.log('=== DADOS ATUALIZADOS ===');
  });

  // Definir usuário atual
  socket.on('set-current-user', (userId) => {
    console.log('=== DEFININDO USUÁRIO ATUAL ===');
    console.log('Usuário anterior:', currentUserId);
    console.log('Novo usuário:', userId);
    currentUserId = userId;
    console.log('Usuário atual definido:', currentUserId);
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

      // Só destruir cliente se estiver autenticado
      if (whatsappClient && isAuthenticated) {
        console.log('Já está conectado e autenticado, não precisa reinicializar');
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

      // Limpar sessão anterior para evitar conflitos
      console.log('Limpando sessão anterior...');
      await clearWhatsAppSession();

      console.log('Criando novo cliente WhatsApp...');
      
      whatsappClient = new Client({
        authStrategy: new LocalAuth({
          dataPath: './whatsapp_auth',
          clientId: 'whatsapp-bot-' + Date.now(),
        }),
        webVersion: '2.2402.5',
        webVersionCache: {
          type: 'none'
        },
        puppeteer: {
          headless: true,
          timeout: 60000,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--disable-extensions',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--mute-audio',
            '--no-zygote',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-software-rasterizer',
            '--disable-background-networking',
            '--safebrowsing-disable-auto-update',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--allow-running-insecure-content',
            '--disable-logging',
            '--log-level=3',
            '--silent-launch',
            '--disable-logging-redirect'
          ],
          ignoreDefaultArgs: ['--disable-extensions', '--enable-logging']
        }
      });

      console.log('Cliente WhatsApp inicializado. Configurando eventos...');

      whatsappClient.on('qr', async (qr) => {
        try {
          console.log('=== [EVENTO] QR CODE GERADO ===');
          console.log('QR Code recebido do WhatsApp Web, tamanho:', qr?.length || 0);
          console.log('QR Code válido?', !!qr && qr.length > 0);
          isAuthenticated = false;
          isInitializing = false;
          
          console.log('Convertendo QR Code para Data URL...');
          const qrCodeDataUrl = await qrcode.toDataURL(qr);
          console.log('QR Code convertido para Data URL, tamanho:', qrCodeDataUrl?.length || 0);
          console.log('Data URL válida?', !!qrCodeDataUrl && qrCodeDataUrl.startsWith('data:image/'));
          
          // Salvar QR code atual
          currentQRCode = qrCodeDataUrl;
          
          console.log('Enviando QR Code para o cliente...');
          socket.emit('qr-code', qrCodeDataUrl);
          socket.emit('whatsapp-status', { 
            connected: false, 
            status: 'qr_received' 
          });
          
          // Limpar timeout anterior se existir
          if (qrCodeTimeout) {
            clearInterval(qrCodeTimeout);
            qrCodeTimeout = null;
          }
          
          console.log('QR Code enviado para o cliente com sucesso!');
        } catch (error) {
          console.error('=== ERRO AO GERAR QR CODE ===');
          console.error('Erro completo:', error);
          console.error('Stack trace:', error.stack);
          isInitializing = false;
          socket.emit('error', `Erro ao gerar QR Code: ${error.message}`);
        }
      });

      whatsappClient.on('ready', async () => {
        console.log('=== [EVENTO] WHATSAPP PRONTO (ready) ===');
        try {
          const info = await whatsappClient.info;
          console.log('Info do cliente WhatsApp:', info);
        } catch (e) {
          console.log('Não foi possível obter info do cliente WhatsApp.');
        }
        isAuthenticated = true;
        isInitializing = false;
        if (qrCodeTimeout) {
          clearInterval(qrCodeTimeout);
          qrCodeTimeout = null;
        }
        currentQRCode = null;
        socket.emit('whatsapp-status', { 
          connected: true, 
          status: 'ready' 
        });
      });

      whatsappClient.on('disconnected', (reason) => {
        console.log('=== [EVENTO] WHATSAPP DESCONECTADO (disconnected) ===');
        console.log('Motivo:', reason);

        // Só destrua o cliente se o motivo for erro real
        if (reason && reason !== 'NAVIGATION' && reason !== 'RESTART_REQUIRED') {
          whatsappClient = null;
          isAuthenticated = false;
          isInitializing = false;
          
          // Limpar timeout do QR code
          if (qrCodeTimeout) {
            clearInterval(qrCodeTimeout);
            qrCodeTimeout = null;
          }
          currentQRCode = null;
          
          socket.emit('whatsapp-status', { 
            connected: false, 
            status: 'disconnected' 
          });
        } else {
          // Apenas logue, não destrua o cliente nem envie status desconectado
          console.log('Desconexão temporária, aguardando reconexão automática...');
        }
      });

      whatsappClient.on('message', async (message) => {
        console.log('=== [EVENTO] MENSAGEM RECEBIDA (message) ===');
        console.log('Mensagem recebida:', message.body);
        console.log('Remetente:', message.from);
        
        try {
          const info = whatsappClient.info;
          if (info && info.wid && message.from === info.wid._serialized) {
            console.log('Mensagem recebida do próprio número do bot. Ignorando.');
            return;
          }
        } catch (e) {
          console.log('Não foi possível obter info do cliente para comparar número.');
        }

        // Emitir mensagem recebida para o frontend
        socket.emit('message-received', {
          from: message.from,
          body: message.body,
          timestamp: message.timestamp
        });

        // Obter nome do contato
        let contactName = '';
        try {
          const contact = await message.getContact();
          contactName = contact.pushname || contact.name || '';
        } catch (e) {
          contactName = '';
        }

        // Processar mensagem do cliente
        try {
          const result = await processCustomerMessage(message, contactName);
          
          if (result.response) {
            // Enviar resposta de texto
            await message.reply(result.response);
            console.log('Resposta enviada com sucesso!');
            
            // Se deve enviar imagem, enviar após a resposta de texto
            if (result.shouldSendImage && result.imageUrl) {
              try {
                const media = await whatsappClient.downloadMediaMessage(result.imageUrl);
                await message.reply(media);
                console.log('Imagem do cardápio enviada com sucesso!');
              } catch (imgError) {
                console.error('Erro ao enviar imagem:', imgError);
              }
            }
          }
        } catch (error) {
          console.error('Erro ao processar mensagem do cliente:', error);
          // Enviar mensagem de erro genérica
          try {
            await message.reply('Desculpe, ocorreu um erro. Tente novamente em alguns instantes.');
          } catch (replyError) {
            console.error('Erro ao enviar mensagem de erro:', replyError);
          }
        }
      });

      whatsappClient.on('auth_failure', (msg) => {
        console.error('=== [EVENTO] FALHA NA AUTENTICAÇÃO (auth_failure) ===');
        console.error('Mensagem:', msg);
        whatsappClient = null;
        isAuthenticated = false;
        isInitializing = false;
        
        // Limpar timeout do QR code
        if (qrCodeTimeout) {
          clearInterval(qrCodeTimeout);
          qrCodeTimeout = null;
        }
        currentQRCode = null;
        
        socket.emit('whatsapp-status', { 
          connected: false, 
          status: 'auth_failed' 
        });
      });

      whatsappClient.on('loading_screen', (percent, message) => {
        console.log('=== [EVENTO] LOADING SCREEN ===', percent + '%', message);
      });

      whatsappClient.on('authenticated', () => {
        console.log('=== [EVENTO] WHATSAPP AUTENTICADO (authenticated) ===');
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
      
      // Limpar timeout do QR code
      if (qrCodeTimeout) {
        clearInterval(qrCodeTimeout);
        qrCodeTimeout = null;
      }
      currentQRCode = null;
      
      socket.emit('whatsapp-status', { 
        connected: false, 
        status: 'disconnected' 
      });
      
      console.log('WhatsApp desconectado com sucesso');
    } catch (error) {
      console.error('Erro ao desconectar WhatsApp:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`=== SERVIDOR RAILWAY INICIADO ===`);
  console.log(`Porta: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`WhatsApp implementado: ✅`);
}); 