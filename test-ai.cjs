const express = require('express');
const cors = require('cors');

// Simular dados do cardápio
const storeData = {
  categories: [
    {
      id: '1',
      name: 'Pizzas',
      products: [
        { id: '1', name: 'Pizza Margherita', price: 25.00, categoryId: '1' },
        { id: '2', name: 'Pizza Calabresa', price: 28.00, categoryId: '1' },
        { id: '3', name: 'Pizza Quatro Queijos', price: 32.00, categoryId: '1' },
        { id: '4', name: 'Pizza Frango com Catupiry', price: 30.00, categoryId: '1' }
      ]
    },
    {
      id: '2',
      name: 'Hambúrgueres',
      products: [
        { id: '5', name: 'Hambúrguer Clássico', price: 18.00, categoryId: '2' },
        { id: '6', name: 'Hambúrguer Duplo', price: 25.00, categoryId: '2' },
        { id: '7', name: 'Hambúrguer Vegetariano', price: 20.00, categoryId: '2' }
      ]
    },
    {
      id: '3',
      name: 'Bebidas',
      products: [
        { id: '8', name: 'Refrigerante', price: 6.00, categoryId: '3' },
        { id: '9', name: 'Suco Natural', price: 8.00, categoryId: '3' },
        { id: '10', name: 'Água', price: 4.00, categoryId: '3' }
      ]
    },
    {
      id: '4',
      name: 'Acompanhamentos',
      products: [
        { id: '11', name: 'Batata Frita', price: 12.00, categoryId: '4' },
        { id: '12', name: 'Salada', price: 10.00, categoryId: '4' }
      ]
    }
  ]
};

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
      'salada': 'salada', 'saladas': 'salada', 'verdura': 'salada'
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
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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
    
    // Extrair números do input
    const numbers = this.extractNumbers(inputText);
    
    // Remover palavras irrelevantes
    const relevantWords = correctedInput
      .split(' ')
      .filter(word => !this.stopWords.includes(word) && word.length > 2)
      .join(' ');

    let bestMatch = null;
    let bestScore = 0;
    let suggestions = [];

    for (const product of products) {
      const normalizedProductName = this.normalizeText(product.name);
      
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

    return {
      bestMatch: bestScore > 0.5 ? bestMatch : null,
      suggestions: suggestions.slice(0, 3),
      confidence: bestScore,
      numbers: numbers,
      correctedInput: correctedInput
    };
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

// Função para obter todos os produtos
function getAllProducts() {
  return storeData.categories.flatMap(cat => cat.products);
}

// Testes
const testCases = [
  'quero uma piza',
  'dois hamburguer',
  'uma pizza margherita',
  'tres refrigerante',
  'batata frita',
  'suco natural',
  'um hamburguer e dois refrigerante',
  'pizzza margarita',
  'hamburguer com batata',
  'sobremesa doce',
  'quero uma pizza quatro queijos',
  'dois hamburgueres classicos',
  'uma salada e um suco',
  'pizza calabresa',
  'refri'
];

console.log('=== TESTE DO SISTEMA DE IA ===\n');

testCases.forEach((testCase, index) => {
  console.log(`Teste ${index + 1}: "${testCase}"`);
  console.log('-'.repeat(50));
  
  const products = getAllProducts();
  const aiResult = aiMatcher.findProductWithAI(testCase, products);
  const smartResponse = aiMatcher.generateSmartResponse(aiResult, products);
  
  console.log(`Texto normalizado: "${aiMatcher.normalizeText(testCase)}"`);
  console.log(`Texto corrigido: "${aiMatcher.correctCommonTypos(aiMatcher.normalizeText(testCase))}"`);
  console.log(`Números detectados: [${aiResult.numbers.join(', ')}]`);
  console.log(`Confiança: ${(aiResult.confidence * 100).toFixed(1)}%`);
  
  if (aiResult.bestMatch) {
    console.log(`✅ Produto encontrado: "${aiResult.bestMatch.name}" - R$ ${aiResult.bestMatch.price.toFixed(2)}`);
  } else if (aiResult.suggestions.length > 0) {
    console.log(`❓ Sugestões:`);
    aiResult.suggestions.forEach(suggestion => {
      console.log(`   - ${suggestion.product.name} (${(suggestion.score * 100).toFixed(1)}%)`);
    });
  } else {
    console.log(`❌ Nenhum produto encontrado`);
  }
  
  console.log(`Resposta: ${smartResponse.message}`);
  console.log('\n');
});

console.log('=== FIM DOS TESTES ==='); 