import { Product, Promotion, StoreConfig, CustomerSession } from '../types';

// Sistema de IA para atendimento humanizado com fluxo completo
export class AIService {
  private storeConfig: StoreConfig;
  private products: Product[];
  private promotions: Promotion[];

  constructor(storeConfig: StoreConfig, products: Product[], promotions: Promotion[]) {
    this.storeConfig = storeConfig;
    this.products = products;
    this.promotions = promotions;
  }

  // Processar mensagem do cliente com IA
  processMessage(session: CustomerSession, message: string): {
    response: string;
    nextStep: string;
    shouldSendImage?: string;
    context?: any;
    cartUpdate?: any[];
  } {
    const lowerMessage = message.toLowerCase().trim();
    const context = this.analyzeContext(session, message);

    // Fluxo principal baseado no step atual
    switch (session.step) {
      case 'greeting':
        return this.handleGreeting(session, message, context);
      
      case 'ordering':
        return this.handleOrdering(session, message, context);
      
      case 'delivery_type':
        return this.handleDeliveryType(session, message, context);
      
      case 'address_street':
      case 'address_number':
      case 'address_district':
      case 'address_city':
      case 'address_reference':
        return this.handleAddress(session, message, session.step, context);
      
      case 'customer_name':
        return this.handleCustomerName(session, message, context);
      
      case 'payment_method':
        return this.handlePayment(session, message, context);
      
      case 'cash_amount':
        return this.handleCashAmount(session, message, context);
      
      case 'waiting_pix_proof':
        return this.handlePixProof(session, message, context);
      
      default:
        return this.handleUnknown(session, message, context);
    }
  }

  // Analisar contexto da conversa
  private analyzeContext(session: CustomerSession, message: string) {
    const context = {
      isFirstTime: (session.messages?.length || 0) < 3,
      hasCart: session.cart && session.cart.length > 0,
      cartTotal: session.cart?.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) || 0,
      customerName: session.customerData?.name,
      timeOfDay: this.getTimeOfDay(),
      messageSentiment: this.analyzeSentiment(message),
      previousMessages: session.messages?.slice(-3) || [],
      isRushHour: this.isRushHour()
    };

    return context;
  }

  // Analisar sentimento da mensagem
  private analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['obrigado', 'valeu', 'legal', 'bom', 'ótimo', 'excelente', 'gostei', 'adoro', 'perfeito'];
    const negativeWords = ['ruim', 'péssimo', 'horrível', 'não gosto', 'detesto', 'problema', 'erro', 'cancelar'];
    
    const lowerMessage = message.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Obter período do dia
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  // Verificar se é horário de pico
  private isRushHour(): boolean {
    const hour = new Date().getHours();
    return (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);
  }

  // Tratar saudação inicial - SEMPRE envia foto do cardápio
  private handleGreeting(session: CustomerSession, message: string, context: any) {
    const lowerMessage = message.toLowerCase();
    
    // Se for primeira mensagem, sempre envia boas-vindas + cardápio
    if (context.isFirstTime) {
      return {
        response: this.generateWelcomeResponse(context),
        nextStep: 'ordering',
        shouldSendImage: this.storeConfig.menuImage && this.storeConfig.menuImage.trim() !== '' ? this.storeConfig.menuImage : undefined
      };
    }
    
    // Se não for primeira vez, verifica intenções
    if (lowerMessage.includes('cardápio') || lowerMessage.includes('cardapio') || lowerMessage === '1') {
      return {
        response: this.generateMenuResponse(context),
        nextStep: 'ordering',
        shouldSendImage: this.storeConfig.menuImage && this.storeConfig.menuImage.trim() !== '' ? this.storeConfig.menuImage : undefined
      };
    }
    
    if (lowerMessage.includes('promoção') || lowerMessage.includes('promocao') || lowerMessage === '2') {
      return {
        response: this.generatePromotionsResponse(context),
        nextStep: 'ordering'
      };
    }
    
    // Para qualquer outra mensagem, volta ao cardápio
    return {
      response: this.generateMenuResponse(context),
      nextStep: 'ordering',
      shouldSendImage: this.storeConfig.menuImage && this.storeConfig.menuImage.trim() !== '' ? this.storeConfig.menuImage : undefined
    };
  }

  // Gerar resposta de boas-vindas
  private generateWelcomeResponse(context: any): string {
    const timeGreetings: Record<string, string> = {
      morning: 'Bom dia',
      afternoon: 'Boa tarde',
      evening: 'Boa noite',
      night: 'Boa noite'
    };
    
    const greeting = timeGreetings[context.timeOfDay] || 'Olá';
    const storeName = this.storeConfig.name;
    
    const welcomeMessages = [
      `${greeting}! 👋 Que alegria ter você aqui na ${storeName}! 😊\n\nAcabei de preparar nosso cardápio especial pra você! 🍕✨\n\nMe conta, o que você tá com vontade de experimentar hoje? 😋`,
      
      `${greeting}! 🎉 Bem-vindo(a) à ${storeName}! Tô super feliz de te atender! 😄\n\nOlha só que cardápio incrível preparei pra você! 🍕🔥\n\nQual delícia vai ser hoje? 🤔`,
      
      `${greeting}! 🌟 Oi, tudo bem? Que bom que você veio pra ${storeName}! 😊\n\nDá uma olhada no nosso cardápio que tá uma delícia! 🍕💫\n\nMe fala o que você tá afim de comer! 😍`,
      
      `${greeting}! 🎊 Seja muito bem-vindo(a) à ${storeName}! Tô aqui pra te ajudar! 😄\n\nAcabei de organizar nosso cardápio com as melhores opções! 🍕⭐\n\nO que você gostaria de pedir? 😋`,
      
      `${greeting}! 🥰 Oi! Que felicidade ter você aqui na ${storeName}! 😊\n\nPreparei nosso cardápio com muito carinho pra você! 🍕💖\n\nMe conta, qual delícia você tá com vontade? 😋`,
      
      `${greeting}! 🌈 Bem-vindo(a) à ${storeName}! Tô super animado pra te atender! 😄\n\nDá uma olhada no nosso cardápio que tá incrível! 🍕✨\n\nO que você gostaria de experimentar hoje? 🤔`
    ];
    
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  }

  // Gerar resposta do cardápio
  private generateMenuResponse(context: any): string {
    const menuMessages = [
      `Perfeito! 🍕 Aqui está nosso cardápio completo da ${this.storeConfig.name}!\n\nTodas as opções estão fresquinhas e prontas pra você! 😊\n\nMe conta, qual delícia você tá com vontade? 😋`,
      
      `Ótima escolha! 📖 Aqui está nosso cardápio com todas as opções disponíveis!\n\nCada item foi preparado com muito carinho! ❤️\n\nO que você gostaria de experimentar hoje? 🤔`,
      
      `Claro! 🍽️ Aqui está nosso cardápio completo!\n\nTodas as opções estão uma delícia, pode escolher sem medo! 😄\n\nQual vai ser sua escolha? 😍`,
      
      `Beleza! 🍕 Aqui está nosso cardápio da ${this.storeConfig.name}!\n\nTodas as opções estão incríveis, vai ser difícil escolher! 😅\n\nMe fala o que você tá afim! 😋`,
      
      `Aqui está! 🍕 Nosso cardápio completo da ${this.storeConfig.name}!\n\nTodas as opções estão fresquinhas e deliciosas! 😊\n\nO que você gostaria de pedir? 🤔`,
      
      `Pronto! 📋 Aqui está nosso cardápio com todas as opções!\n\nCada item foi preparado com muito amor! ❤️\n\nMe conta, qual delícia você tá afim? 😋`
    ];
    
    return menuMessages[Math.floor(Math.random() * menuMessages.length)];
  }

  // Gerar resposta de promoções
  private generatePromotionsResponse(context: any): string {
    const activePromotions = this.promotions.filter(p => p.active);
    
    if (activePromotions.length === 0) {
      const noPromoMessages = [
        `No momento não temos promoções ativas, mas nosso cardápio está recheado de opções deliciosas! 😊\n\nQue tal dar uma olhada no nosso cardápio? Digite "1" ou "cardápio"! 🍕`,
        
        `Hoje não temos promoções, mas nosso cardápio está uma delícia! 😄\n\nDá uma olhada nas nossas opções! Digite "1" ou "cardápio"! 🍕✨`,
        
        `Promoções acabaram, mas nosso cardápio continua incrível! 😊\n\nVem ver as opções! Digite "1" ou "cardápio"! 🍕💫`
      ];
      
      return noPromoMessages[Math.floor(Math.random() * noPromoMessages.length)];
    }
    
    const promoMessages = [
      `🔥 Temos promoções incríveis para você!\n\n${activePromotions.map(p => `• ${p.title}: ${p.description} (${p.discount}% OFF)`).join('\n')}\n\nAproveite essas ofertas especiais! 😄`,
      
      `🎉 Promoções imperdíveis pra você!\n\n${activePromotions.map(p => `• ${p.title}: ${p.description} (${p.discount}% OFF)`).join('\n')}\n\nCorre aproveitar! 😍`,
      
      `💥 Ofertas especiais só pra você!\n\n${activePromotions.map(p => `• ${p.title}: ${p.description} (${p.discount}% OFF)`).join('\n')}\n\nNão perde essa chance! 🚀`
    ];
    
    return promoMessages[Math.floor(Math.random() * promoMessages.length)];
  }

  // Tratar pedidos
  private handleOrdering(session: CustomerSession, message: string, context: any) {
    const lowerMessage = message.toLowerCase();
    
    // Detectar finalização
    if (lowerMessage.includes('finalizar') || lowerMessage.includes('terminar') || lowerMessage.includes('pronto') || lowerMessage.includes('acabei') || 
        lowerMessage.includes('sim') || lowerMessage.includes('também') || lowerMessage.includes('tambem') || lowerMessage.includes('quero finalizar') ||
        lowerMessage.includes('finalizar pedido') || lowerMessage.includes('terminar pedido') || lowerMessage.includes('pronto pedido') ||
        lowerMessage === 'sim' || lowerMessage === 'também' || lowerMessage === 'tambem' || lowerMessage === 'finalizar') {
      if (!context.hasCart) {
        const emptyCartMessages = [
          `Ops! 😅 Ainda não adicionamos nada ao seu pedido.\n\nQue tal escolher algo delicioso do nosso cardápio primeiro? 🍕\n\nPode me dizer o que você gostaria de experimentar! 😊`,
          
          `Hmm! 🤔 Seu carrinho ainda está vazio!\n\nQue tal dar uma olhada no nosso cardápio e escolher algo incrível? 🍕\n\nMe conta o que você tá afim de comer! 😋`,
          
          `😅 Ops! Ainda não tem nada no seu pedido!\n\nVamos escolher algo delicioso do nosso cardápio? 🍕\n\nTem várias opções incríveis pra você! 😍`,
          
          `🤔 Hmm, seu carrinho tá vazio!\n\nQue tal escolher algo gostoso do nosso cardápio? 🍕\n\nTô aqui pra te ajudar a escolher! 😄`
        ];
        
        return {
          response: emptyCartMessages[Math.floor(Math.random() * emptyCartMessages.length)],
          nextStep: 'ordering'
        };
      }
      
      return {
        response: this.generateFinalizeResponse(session, context),
        nextStep: 'delivery_type'
      };
    }
    
    // Detectar remoção de produtos
    if (lowerMessage.includes('remove') || lowerMessage.includes('tira') || lowerMessage.includes('retira') || lowerMessage.includes('tirar') || lowerMessage.includes('remover')) {
      return this.handleRemoveProduct(session, message, context);
    }
    
    // Detectar múltiplos produtos na mesma mensagem
    const multipleProducts = this.findMultipleProducts(message);
    if (multipleProducts.length > 0) {
      return this.handleMultipleProducts(session, multipleProducts, message, context);
    }
    
    // Detectar produto único
    const product = this.findProduct(message);
    if (product) {
      return {
        response: this.generateProductAddedResponse(product, session, context),
        nextStep: 'ordering'
      };
    }
    
    // Resposta para mensagem não reconhecida
    return {
      response: this.generateUnknownProductResponse(context),
      nextStep: 'ordering'
    };
  }

  // Encontrar produto na mensagem
  private findProduct(message: string): Product | null {
    const lowerMessage = message.toLowerCase();
    
    return this.products.find(product => {
      const productName = product.name.toLowerCase();
      return lowerMessage.includes(productName) || 
             productName.split(' ').some(word => lowerMessage.includes(word));
    }) || null;
  }

  // Encontrar múltiplos produtos na mesma mensagem
  private findMultipleProducts(message: string): Product[] {
    const lowerMessage = message.toLowerCase();
    const foundProducts: Product[] = [];
    const usedWords = new Set<string>();

    // Ordenar produtos por nome (mais específicos primeiro)
    const sortedProducts = [...this.products].sort((a, b) => 
      b.name.split(' ').length - a.name.split(' ').length
    );

    sortedProducts.forEach(product => {
      const productName = product.name.toLowerCase();
      const productWords = productName.split(' ');
      
      // Verificar se todas as palavras do produto estão na mensagem
      const allWordsFound = productWords.every(word => {
        // Verificar se a palavra não foi usada por outro produto
        if (usedWords.has(word)) return false;
        
        // Verificar se a palavra está na mensagem
        return lowerMessage.includes(word);
      });
      
      if (allWordsFound) {
        foundProducts.push(product);
        // Marcar palavras como usadas
        productWords.forEach(word => usedWords.add(word));
      }
    });

    return foundProducts;
  }

  // Tratar múltiplos produtos na mesma mensagem
  private handleMultipleProducts(session: CustomerSession, products: Product[], message: string, context: any) {
    const lowerMessage = message.toLowerCase();
    const updatedCart = [...(session.cart || [])];
    const addedProducts: string[] = [];

    console.log('🔍 Processando múltiplos produtos:', products.map(p => p.name));
    console.log('📝 Mensagem:', message);

    products.forEach(product => {
      // Extrair quantidade específica para este produto
      const quantity = this.extractQuantityForProduct(lowerMessage, product);
      
      console.log(`📊 Produto: ${product.name}, Quantidade detectada: ${quantity}`);
      
      if (quantity > 0) {
        // Verificar se o produto já está no carrinho
        const existingItem = updatedCart.find(item => item.product.id === product.id);
        
        if (existingItem) {
          // Atualizar quantidade existente
          existingItem.quantity += quantity;
          console.log(`🔄 Atualizando ${product.name}: ${existingItem.quantity - quantity} + ${quantity} = ${existingItem.quantity}`);
        } else {
          // Adicionar novo produto
          updatedCart.push({ product, quantity });
          console.log(`➕ Adicionando ${product.name}: ${quantity}`);
        }
        
        addedProducts.push(`${quantity}x ${product.name}`);
      }
    });

    console.log('📋 Produtos adicionados:', addedProducts);
    console.log('🛒 Carrinho atualizado:', updatedCart);

    if (addedProducts.length === 0) {
      return {
        response: `Hmm, não consegui identificar as quantidades dos produtos. Pode me dizer algo como "2 pizza de calabresa e 1 coca cola"? 😊`,
        nextStep: 'ordering'
      };
    }

    const cartSummary = this.getCartSummaryFromItems(updatedCart);
    const addedText = addedProducts.join(', ');

    const multipleProductsMessages = [
      `🎉 Perfeito! Adicionei ${addedText} ao seu pedido! 😊\n\n📋 *Seu carrinho:*\n${cartSummary}\n\nQuer adicionar mais alguma coisa ou finalizar o pedido? 🤔`,
      
      `✅ Beleza! ${addedText} foram adicionados com sucesso! 😄\n\n📋 *Seu carrinho:*\n${cartSummary}\n\nVai querer mais alguma coisa ou finalizar? 😋`,
      
      `🌟 Ótima escolha! ${addedText} estão no seu carrinho! 😍\n\n📋 *Seu carrinho:*\n${cartSummary}\n\nQuer adicionar mais alguma coisa ou finalizar? 🤔`,
      
      `💫 Incrível! ${addedText} foram adicionados ao seu pedido! ✨\n\n📋 *Seu carrinho:*\n${cartSummary}\n\nVai querer mais alguma coisa ou finalizar? 😊`
    ];

    return {
      response: multipleProductsMessages[Math.floor(Math.random() * multipleProductsMessages.length)],
      nextStep: 'ordering',
      cartUpdate: updatedCart
    };
  }

  // Extrair quantidade específica para um produto
  private extractQuantityForProduct(message: string, product: Product): number {
    const lowerMessage = message.toLowerCase();
    const productName = product.name.toLowerCase();
    
    // Dicionário de números por extenso
    const numberWords: { [key: string]: number } = {
      'zero': 0, 'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'tres': 3, 'três': 3,
      'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
      'onze': 11, 'doze': 12, 'treze': 13, 'quatorze': 14, 'catorze': 14, 'quinze': 15,
      'dezesseis': 16, 'dezessete': 17, 'dezoito': 18, 'dezenove': 19, 'vinte': 20
    };
    
    // Padrões para encontrar quantidade antes do produto
    const patterns = [
      // Padrão: "2 pizza de calabresa"
      new RegExp(`(\\d+)\\s*${productName.replace(/\s+/g, '\\s+')}`, 'i'),
      // Padrão: "pizza de calabresa 2"
      new RegExp(`${productName.replace(/\s+/g, '\\s+')}\\s*(\\d+)`, 'i'),
      // Padrão: "duas pizza de calabresa"
      new RegExp(`(${Object.keys(numberWords).join('|')})\\s+${productName.replace(/\s+/g, '\\s+')}`, 'i'),
      // Padrão: "pizza de calabresa duas"
      new RegExp(`${productName.replace(/\s+/g, '\\s+')}\\s+(${Object.keys(numberWords).join('|')})`, 'i'),
      // Padrão: "2 pizza"
      new RegExp(`(\\d+)\\s*${productName.split(' ')[0]}`, 'i'),
      // Padrão: "duas pizza"
      new RegExp(`(${Object.keys(numberWords).join('|')})\\s+${productName.split(' ')[0]}`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        const quantity = match[1];
        // Se for número, converter diretamente
        if (/^\d+$/.test(quantity)) {
          return parseInt(quantity);
        }
        // Se for palavra, usar o dicionário
        if (numberWords[quantity]) {
          return numberWords[quantity];
        }
      }
    }
    
    // Se não encontrou padrão específico, procurar por números próximos ao produto
    const words = lowerMessage.split(/\s+/);
    const productWords = productName.split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
      if (productWords.some(word => words[i].includes(word))) {
        // Verificar se há número antes ou depois
        if (i > 0) {
          const prevWord = words[i - 1];
          if (/^\d+$/.test(prevWord)) {
            return parseInt(prevWord);
          }
          if (numberWords[prevWord]) {
            return numberWords[prevWord];
          }
        }
        if (i < words.length - 1) {
          const nextWord = words[i + 1];
          if (/^\d+$/.test(nextWord)) {
            return parseInt(nextWord);
          }
          if (numberWords[nextWord]) {
            return numberWords[nextWord];
          }
        }
      }
    }
    
    // Se não encontrou quantidade específica, retornar 1
    return 1;
  }

  // Gerar resposta de produto adicionado
  private generateProductAddedResponse(product: Product, session: CustomerSession, context: any): string {
    const cartItems = session.cart?.map(item => 
      `${item.quantity}x ${item.product.name}`
    ).join(', ') || '';
    
    const productMessages = [
      `🎉 Perfeito! Adicionei ${product.name} ao seu pedido! 😊\n\n📋 *Seu carrinho:*\n${cartItems}\n\nQuer adicionar mais alguma coisa ou finalizar o pedido? 🤔`,
      
      `✅ Beleza! ${product.name} foi adicionado com sucesso! 😄\n\n📋 *Seu pedido:*\n${cartItems}\n\nVai querer mais alguma coisa ou finalizar? 😋`,
      
      `🌟 Ótima escolha! ${product.name} tá no seu carrinho! 😍\n\n📋 *Seu pedido:*\n${cartItems}\n\nQuer adicionar mais alguma coisa ou finalizar? 🤔`,
      
      `💫 Incrível! ${product.name} foi adicionado ao seu pedido! ✨\n\n📋 *Seu carrinho:*\n${cartItems}\n\nVai querer mais alguma coisa ou finalizar? 😊`,
      
      `🥰 Que delícia! ${product.name} tá no seu carrinho! 😊\n\n📋 *Seu pedido:*\n${cartItems}\n\nQuer adicionar mais alguma coisa ou finalizar? 🤔`,
      
      `✨ Perfeito! ${product.name} foi adicionado! 😄\n\n📋 *Seu carrinho:*\n${cartItems}\n\nVai querer mais alguma coisa ou finalizar? 😋`,
      
      `🎊 Beleza! ${product.name} tá no seu pedido! 😍\n\n📋 *Seu carrinho:*\n${cartItems}\n\nQuer adicionar mais alguma coisa ou finalizar? 🤔`
    ];
    
    return productMessages[Math.floor(Math.random() * productMessages.length)];
  }

  // Gerar resposta para produto não encontrado
  private generateUnknownProductResponse(context: any): string {
    const unknownMessages = [
      `Hmm, não encontrei esse produto no nosso cardápio! 😅\n\nPode me dizer o nome exato ou dar uma olhada no cardápio? 🍕\n\nTô aqui pra te ajudar a encontrar o que você quer! 😊`,
      
      `Ops! Não tenho esse produto disponível! 😅\n\nQue tal dar uma olhada no nosso cardápio pra ver as opções? 🍕\n\nTem várias delícias pra você escolher! 😋`,
      
      `Desculpa, não encontrei esse produto! 😅\n\nDá uma olhada no nosso cardápio que tem várias opções incríveis! 🍕\n\nMe fala o que você tá afim! 😊`,
      
      `Não tenho esse produto no cardápio! 😅\n\nOlha só as opções que temos disponíveis! 🍕\n\nTem coisa muito boa pra você! 😍`,
      
      `Hmm, não tenho esse produto! 😅\n\nQue tal dar uma olhada no nosso cardápio? 🍕\n\nTem várias delícias pra você escolher! 😊`,
      
      `Ops! Não encontrei esse produto! 😅\n\nDá uma olhada no nosso cardápio que tem várias opções incríveis! 🍕\n\nMe conta o que você tá afim! 😋`,
      
      `Desculpa, não tenho esse produto disponível! 😅\n\nOlha só o nosso cardápio que tem várias opções deliciosas! 🍕\n\nTô aqui pra te ajudar a escolher! 😊`
    ];
    
    return unknownMessages[Math.floor(Math.random() * unknownMessages.length)];
  }

  // Tratar finalização do pedido
  private generateFinalizeResponse(session: CustomerSession, context: any): string {
    const cartItems = session.cart?.map(item => 
      `${item.quantity}x ${item.product.name} - R$ ${(item.product.price * item.quantity).toFixed(2)}`
    ).join('\n') || '';
    
    const subtotal = context.cartTotal;
    
    const finalizeMessages = [
      `🎉 Perfeito! Vamos finalizar seu pedido!\n\n📋 *RESUMO DO PEDIDO:*\n${cartItems}\n\n💰 *Subtotal: R$ ${subtotal.toFixed(2)}*\n\nAgora preciso saber:\n\n🚚 É para *ENTREGA* ou *RETIRADA*?\n\nDigite:\n• "Entrega" ou "1" para entrega\n• "Retirada" ou "2" para retirar no local`,
      
      `✅ Beleza! Vamos finalizar seu pedido!\n\n📋 *RESUMO DO PEDIDO:*\n${cartItems}\n\n💰 *Subtotal: R$ ${subtotal.toFixed(2)}*\n\nAgora me conta:\n\n🚚 É para *ENTREGA* ou *RETIRADA*?\n\nDigite:\n• "Entrega" ou "1" para entrega\n• "Retirada" ou "2" para retirar no local`,
      
      `🌟 Incrível! Vamos finalizar seu pedido!\n\n📋 *RESUMO DO PEDIDO:*\n${cartItems}\n\n💰 *Subtotal: R$ ${subtotal.toFixed(2)}*\n\nAgora preciso saber:\n\n🚚 É para *ENTREGA* ou *RETIRADA*?\n\nDigite:\n• "Entrega" ou "1" para entrega\n• "Retirada" ou "2" para retirar no local`
    ];
    
    return finalizeMessages[Math.floor(Math.random() * finalizeMessages.length)];
  }

  // Tratar tipo de entrega
  private handleDeliveryType(session: CustomerSession, message: string, context: any) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('entrega') || lowerMessage === '1') {
      // Atualizar dados do cliente
      const updatedSession = {
        ...session,
        customerData: { ...session.customerData, deliveryType: 'delivery' }
      };
      
      const deliveryMessages = [
        `🚚 Perfeito! Vamos fazer a entrega na sua casa!\n\n📝 Preciso dos dados do endereço:\n\n🏠 *Rua/Avenida:*\n\nDigite o nome da sua rua ou avenida:`,
        
        `🚚 Beleza! Vamos entregar na sua casa!\n\n📝 Me conta os dados do endereço:\n\n🏠 *Rua/Avenida:*\n\nDigite o nome da sua rua ou avenida:`,
        
        `🚚 Incrível! Vamos levar até você!\n\n📝 Preciso dos dados do endereço:\n\n🏠 *Rua/Avenida:*\n\nDigite o nome da sua rua ou avenida:`
      ];
      
      return {
        response: deliveryMessages[Math.floor(Math.random() * deliveryMessages.length)],
        nextStep: 'address_street'
      };
    }
    
    if (lowerMessage.includes('retirada') || lowerMessage === '2') {
      // Atualizar dados do cliente
      const updatedSession = {
        ...session,
        customerData: { ...session.customerData, deliveryType: 'pickup' }
      };
      
      const pickupMessages = [
        `✅ Ótimo! Você vai retirar no local!\n\n📋 *RESUMO FINAL DO PEDIDO:*\n${this.generateOrderSummary(session, context)}\n\n💳 Como você gostaria de pagar?\n\nDigite:\n• "PIX" ou "1" para PIX\n• "Dinheiro" ou "2" para dinheiro\n• "Cartão" ou "3" para cartão`,
        
        `🎉 Perfeito! Vai retirar no local!\n\n📋 *RESUMO FINAL DO PEDIDO:*\n${this.generateOrderSummary(session, context)}\n\n💳 Como você gostaria de pagar?\n\nDigite:\n• "PIX" ou "1" para PIX\n• "Dinheiro" ou "2" para dinheiro\n• "Cartão" ou "3" para cartão`,
        
        `🌟 Beleza! Retirada no local!\n\n📋 *RESUMO FINAL DO PEDIDO:*\n${this.generateOrderSummary(session, context)}\n\n💳 Como você gostaria de pagar?\n\nDigite:\n• "PIX" ou "1" para PIX\n• "Dinheiro" ou "2" para dinheiro\n• "Cartão" ou "3" para cartão`
      ];
      
      return {
        response: pickupMessages[Math.floor(Math.random() * pickupMessages.length)],
        nextStep: 'payment_method'
      };
    }
    
    const errorMessages = [
      `❓ Desculpe, não entendi!\n\nÉ para *ENTREGA* ou *RETIRADA*?\n\nDigite:\n• "Entrega" ou "1" para entrega\n• "Retirada" ou "2" para retirar no local`,
      
      `🤔 Ops! Não entendi direito!\n\nÉ para *ENTREGA* ou *RETIRADA*?\n\nDigite:\n• "Entrega" ou "1" para entrega\n• "Retirada" ou "2" para retirar no local`,
      
      `😅 Desculpa! Pode repetir?\n\nÉ para *ENTREGA* ou *RETIRADA*?\n\nDigite:\n• "Entrega" ou "1" para entrega\n• "Retirada" ou "2" para retirar no local`
    ];
    
    return {
      response: errorMessages[Math.floor(Math.random() * errorMessages.length)],
      nextStep: 'delivery_type'
    };
  }

  // Tratar endereço
  private handleAddress(session: CustomerSession, message: string, step: string, context: any) {
    const addressData = session.customerData?.address || {};
    
    switch (step) {
      case 'address_street':
        const streetMessages = [
          `🏠 Rua: ${message}\n\n🏢 *Número:*\n\nDigite o número da casa/apartamento:`,
          `🏠 Rua: ${message}\n\n🏢 *Número:*\n\nMe conta o número da casa/apartamento:`,
          `🏠 Rua: ${message}\n\n🏢 *Número:*\n\nQual é o número da casa/apartamento?`
        ];
        return {
          response: streetMessages[Math.floor(Math.random() * streetMessages.length)],
          nextStep: 'address_number'
        };
      
      case 'address_number':
        const numberMessages = [
          `🏢 Número: ${message}\n\n🏘️ *Bairro:*\n\nDigite o nome do bairro:`,
          `🏢 Número: ${message}\n\n🏘️ *Bairro:*\n\nMe conta o nome do bairro:`,
          `🏢 Número: ${message}\n\n🏘️ *Bairro:*\n\nQual é o nome do bairro?`
        ];
        return {
          response: numberMessages[Math.floor(Math.random() * numberMessages.length)],
          nextStep: 'address_district'
        };
      
      case 'address_district':
        const districtMessages = [
          `🏘️ Bairro: ${message}\n\n🏙️ *Cidade:*\n\nDigite o nome da cidade:`,
          `🏘️ Bairro: ${message}\n\n🏙️ *Cidade:*\n\nMe conta o nome da cidade:`,
          `🏘️ Bairro: ${message}\n\n🏙️ *Cidade:*\n\nQual é o nome da cidade?`
        ];
        return {
          response: districtMessages[Math.floor(Math.random() * districtMessages.length)],
          nextStep: 'address_city'
        };
      
      case 'address_city':
        const cityMessages = [
          `🏙️ Cidade: ${message}\n\n📍 *Ponto de Referência:*\n\nDigite um ponto de referência (opcional):`,
          `🏙️ Cidade: ${message}\n\n📍 *Ponto de Referência:*\n\nMe conta um ponto de referência (opcional):`,
          `🏙️ Cidade: ${message}\n\n📍 *Ponto de Referência:*\n\nAlgum ponto de referência? (opcional)`
        ];
        return {
          response: cityMessages[Math.floor(Math.random() * cityMessages.length)],
          nextStep: 'address_reference'
        };
      
      case 'address_reference':
        const street = session.customerData?.street || '';
        const number = session.customerData?.number || '';
        const district = session.customerData?.district || '';
        const city = session.customerData?.city || '';
        const fullAddress = `${street}, ${number} - ${district}, ${city}`;
        
        const referenceMessages = [
          `📍 Referência: ${message}\n\n📋 *RESUMO FINAL DO PEDIDO:*\n${this.generateOrderSummary(session, context)}\n\n🏠 *ENDEREÇO:*\n${fullAddress}\n\n💳 Como você gostaria de pagar?\n\nDigite:\n• "PIX" ou "1" para PIX\n• "Dinheiro" ou "2" para dinheiro\n• "Cartão" ou "3" para cartão`,
          
          `📍 Referência: ${message}\n\n📋 *RESUMO FINAL DO PEDIDO:*\n${this.generateOrderSummary(session, context)}\n\n🏠 *ENDEREÇO:*\n${fullAddress}\n\n💳 Como você gostaria de pagar?\n\nDigite:\n• "PIX" ou "1" para PIX\n• "Dinheiro" ou "2" para dinheiro\n• "Cartão" ou "3" para cartão`
        ];
    
    return {
          response: referenceMessages[Math.floor(Math.random() * referenceMessages.length)],
          nextStep: 'payment_method'
        };
      
      default:
        return {
          response: `❓ Erro no processamento do endereço. Tente novamente.`,
          nextStep: 'address_street'
        };
    }
  }

  // Tratar nome do cliente
  private handleCustomerName(session: CustomerSession, message: string, context: any) {
    const nameMessages = [
      `👤 Nome: ${message}\n\n📋 *RESUMO FINAL DO PEDIDO:*\n${this.generateOrderSummary(session, context)}\n\n💳 Como você gostaria de pagar?\n\nDigite:\n• "PIX" ou "1" para PIX\n• "Dinheiro" ou "2" para dinheiro\n• "Cartão" ou "3" para cartão`,
      
      `👤 Nome: ${message}\n\n📋 *RESUMO FINAL DO PEDIDO:*\n${this.generateOrderSummary(session, context)}\n\n💳 Como você gostaria de pagar?\n\nDigite:\n• "PIX" ou "1" para PIX\n• "Dinheiro" ou "2" para dinheiro\n• "Cartão" ou "3" para cartão`
    ];
    
    return {
      response: nameMessages[Math.floor(Math.random() * nameMessages.length)],
      nextStep: 'payment_method'
    };
  }

  // Tratar método de pagamento
  private handlePayment(session: CustomerSession, message: string, context: any) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('pix') || lowerMessage === '1') {
      const pixKey = this.storeConfig.pixKey;
      const total = this.calculateTotal(session, context);
      
      const pixMessages = [
        `💳 PIX selecionado!\n\n📱 *Chave PIX:* ${pixKey}\n💰 *Valor:* R$ ${total.toFixed(2)}\n\n📸 Envie o comprovante do PIX para finalizarmos seu pedido!\n\n⏰ *Prazo:* 10 minutos`,
        
        `💳 Beleza! PIX é uma ótima escolha!\n\n📱 *Chave PIX:* ${pixKey}\n💰 *Valor:* R$ ${total.toFixed(2)}\n\n📸 Manda o comprovante do PIX pra gente finalizar!\n\n⏰ *Prazo:* 10 minutos`,
        
        `💳 Perfeito! PIX é super prático!\n\n📱 *Chave PIX:* ${pixKey}\n💰 *Valor:* R$ ${total.toFixed(2)}\n\n📸 Envia o comprovante do PIX pra finalizarmos!\n\n⏰ *Prazo:* 10 minutos`
      ];
      
      return {
        response: pixMessages[Math.floor(Math.random() * pixMessages.length)],
        nextStep: 'waiting_pix_proof'
      };
    }
    
    if (lowerMessage.includes('dinheiro') || lowerMessage === '2') {
      const total = this.calculateTotal(session, context);
      
      const cashMessages = [
        `💵 Dinheiro selecionado!\n\n💰 *Total do pedido:* R$ ${total.toFixed(2)}\n\n💸 Qual valor você vai pagar?\n\nDigite o valor (ex: 50.00):`,
        
        `💵 Beleza! Dinheiro é sempre uma boa opção!\n\n💰 *Total do pedido:* R$ ${total.toFixed(2)}\n\n💸 Qual valor você vai pagar?\n\nDigite o valor (ex: 50.00):`,
        
        `💵 Perfeito! Dinheiro é super prático!\n\n💰 *Total do pedido:* R$ ${total.toFixed(2)}\n\n💸 Qual valor você vai pagar?\n\nDigite o valor (ex: 50.00):`
      ];
      
      return {
        response: cashMessages[Math.floor(Math.random() * cashMessages.length)],
        nextStep: 'cash_amount'
      };
    }
    
    if (lowerMessage.includes('cartão') || lowerMessage.includes('cartao') || lowerMessage === '3') {
      return this.finalizeOrder(session, context, 'CARD');
    }
    
    const paymentErrorMessages = [
      `❓ Desculpe, não entendi!\n\n💳 Como você gostaria de pagar?\n\nDigite:\n• "PIX" ou "1" para PIX\n• "Dinheiro" ou "2" para dinheiro\n• "Cartão" ou "3" para cartão`,
      
      `🤔 Ops! Não entendi direito!\n\n💳 Como você gostaria de pagar?\n\nDigite:\n• "PIX" ou "1" para PIX\n• "Dinheiro" ou "2" para dinheiro\n• "Cartão" ou "3" para cartão`,
      
      `😅 Desculpa! Pode repetir?\n\n💳 Como você gostaria de pagar?\n\nDigite:\n• "PIX" ou "1" para PIX\n• "Dinheiro" ou "2" para dinheiro\n• "Cartão" ou "3" para cartão`
    ];
    
    return {
      response: paymentErrorMessages[Math.floor(Math.random() * paymentErrorMessages.length)],
      nextStep: 'payment_method'
    };
  }

  // Tratar valor em dinheiro
  private handleCashAmount(session: CustomerSession, message: string, context: any) {
    const amount = parseFloat(message.replace(/[^\d,.]/g, '').replace(',', '.'));
    const total = this.calculateTotal(session, context);
    
    if (isNaN(amount) || amount < total) {
      const errorMessages = [
        `❌ Valor inválido!\n\n💰 *Total do pedido:* R$ ${total.toFixed(2)}\n\n💸 Digite um valor maior ou igual ao total:`,
        
        `😅 Ops! O valor precisa ser maior que o total!\n\n💰 *Total do pedido:* R$ ${total.toFixed(2)}\n\n💸 Digite um valor maior ou igual ao total:`,
        
        `🤔 Hmm, esse valor não dá!\n\n💰 *Total do pedido:* R$ ${total.toFixed(2)}\n\n💸 Digite um valor maior ou igual ao total:`
      ];
      
      return {
        response: errorMessages[Math.floor(Math.random() * errorMessages.length)],
        nextStep: 'cash_amount'
      };
    }
    
    const change = amount - total;
    
    return this.finalizeOrder(session, context, 'CASH', amount, change);
  }

  // Tratar comprovante PIX
  private handlePixProof(session: CustomerSession, message: string, context: any) {
    return this.finalizeOrder(session, context, 'PIX');
  }

  // Finalizar pedido
  private finalizeOrder(session: CustomerSession, context: any, paymentMethod: string, cashAmount?: number, change?: number) {
    const total = this.calculateTotal(session, context);
    const deliveryType = session.customerData?.deliveryType || 'pickup';
    const customerName = session.customerData?.name || 'Cliente';
    
    const finalizeMessages = [
      `🎉 *PEDIDO FINALIZADO COM SUCESSO!*\n\n👤 *Cliente:* ${customerName}\n📋 *Resumo:* ${this.generateOrderSummary(session, context)}\n💰 *Total:* R$ ${total.toFixed(2)}\n🚚 *Tipo:* ${deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}\n💳 *Pagamento:* ${this.getPaymentMethodText(paymentMethod)}${paymentMethod === 'CASH' && cashAmount && change !== undefined ? `\n💸 *Valor pago:* R$ ${cashAmount.toFixed(2)}\n🔄 *Troco:* R$ ${change.toFixed(2)}` : ''}${deliveryType === 'delivery' && session.customerData ? `\n🏠 *Endereço:* ${session.customerData.street}, ${session.customerData.number} - ${session.customerData.district}, ${session.customerData.city}${session.customerData.reference ? `\n📍 *Referência:* ${session.customerData.reference}` : ''}` : ''}\n\n⏰ *Tempo estimado:* ${deliveryType === 'delivery' ? '30-45 minutos' : '15-20 minutos'}\n📞 *Contato:* ${this.storeConfig.address}\n\nObrigado pela preferência! 😊`,
      
      `✅ *PEDIDO CONFIRMADO!*\n\n👤 *Cliente:* ${customerName}\n📋 *Resumo:* ${this.generateOrderSummary(session, context)}\n💰 *Total:* R$ ${total.toFixed(2)}\n🚚 *Tipo:* ${deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}\n💳 *Pagamento:* ${this.getPaymentMethodText(paymentMethod)}${paymentMethod === 'CASH' && cashAmount && change !== undefined ? `\n💸 *Valor pago:* R$ ${cashAmount.toFixed(2)}\n🔄 *Troco:* R$ ${change.toFixed(2)}` : ''}${deliveryType === 'delivery' && session.customerData ? `\n🏠 *Endereço:* ${session.customerData.street}, ${session.customerData.number} - ${session.customerData.district}, ${session.customerData.city}${session.customerData.reference ? `\n📍 *Referência:* ${session.customerData.reference}` : ''}` : ''}\n\n⏰ *Tempo estimado:* ${deliveryType === 'delivery' ? '30-45 minutos' : '15-20 minutos'}\n📞 *Contato:* ${this.storeConfig.address}\n\nMuito obrigado! 😍`,
      
      `🌟 *PEDIDO FINALIZADO!*\n\n👤 *Cliente:* ${customerName}\n📋 *Resumo:* ${this.generateOrderSummary(session, context)}\n💰 *Total:* R$ ${total.toFixed(2)}\n🚚 *Tipo:* ${deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}\n💳 *Pagamento:* ${this.getPaymentMethodText(paymentMethod)}${paymentMethod === 'CASH' && cashAmount && change !== undefined ? `\n💸 *Valor pago:* R$ ${cashAmount.toFixed(2)}\n🔄 *Troco:* R$ ${change.toFixed(2)}` : ''}${deliveryType === 'delivery' && session.customerData ? `\n🏠 *Endereço:* ${session.customerData.street}, ${session.customerData.number} - ${session.customerData.district}, ${session.customerData.city}${session.customerData.reference ? `\n📍 *Referência:* ${session.customerData.reference}` : ''}` : ''}\n\n⏰ *Tempo estimado:* ${deliveryType === 'delivery' ? '30-45 minutos' : '15-20 minutos'}\n📞 *Contato:* ${this.storeConfig.address}\n\nObrigado! 😄`
    ];
    
    return {
      response: finalizeMessages[Math.floor(Math.random() * finalizeMessages.length)],
      nextStep: 'completed'
    };
  }

  // Gerar resumo do pedido
  private generateOrderSummary(session: CustomerSession, context: any): string {
    const cartItems = session.cart?.map(item => 
      `${item.quantity}x ${item.product.name}`
    ).join(', ') || '';
    
    const subtotal = context.cartTotal;
    const deliveryFee = session.customerData?.deliveryType === 'delivery' ? this.storeConfig.deliveryFee : 0;
    const total = subtotal + deliveryFee;
    
    let summary = `${cartItems}`;
    if (deliveryFee > 0) {
      summary += `\n🚚 Taxa de entrega: R$ ${deliveryFee.toFixed(2)}`;
    }
    summary += `\n💰 Total: R$ ${total.toFixed(2)}`;
    
    return summary;
  }

  // Calcular total do pedido
  private calculateTotal(session: CustomerSession, context: any): number {
    const subtotal = context.cartTotal;
    const deliveryFee = session.customerData?.deliveryType === 'delivery' ? this.storeConfig.deliveryFee : 0;
    return subtotal + deliveryFee;
  }

  // Obter texto do método de pagamento
  private getPaymentMethodText(method: string): string {
    switch (method) {
      case 'PIX': return 'PIX';
      case 'CASH': return 'Dinheiro';
      case 'CARD': return 'Cartão';
      default: return method;
    }
  }

  // Tratar mensagem desconhecida
  private handleUnknown(session: CustomerSession, message: string, context: any) {
    const unknownMessages = [
      `Hmm, não entendi muito bem! 😅\n\nQue tal dar uma olhada no nosso cardápio? Digite "cardápio" ou "1"! 🍕\n\nTô aqui pra te ajudar! 😊`,
      
      `Ops! Não consegui entender! 🤔\n\nDá uma olhada no nosso cardápio! Digite "cardápio" ou "1"! 🍕\n\nTem várias delícias pra você! 😋`,
      
      `Desculpa, não entendi! 😅\n\nQue tal ver nosso cardápio? Digite "cardápio" ou "1"! 🍕\n\nTô aqui pra te ajudar a escolher! 😄`,
      
      `🤔 Hmm, não entendi direito!\n\nDá uma olhada no nosso cardápio! Digite "cardápio" ou "1"! 🍕\n\nTem coisa muito boa pra você! 😍`
    ];
    
    return {
      response: unknownMessages[Math.floor(Math.random() * unknownMessages.length)],
      nextStep: 'ordering'
    };
  }

  // Tratar remoção de produtos
  private handleRemoveProduct(session: CustomerSession, message: string, context: any) {
    const lowerMessage = message.toLowerCase();
    
    // Se não há carrinho, informar que está vazio
    if (!context.hasCart) {
      const emptyCartMessages = [
        `😅 Ops! Seu carrinho está vazio!\n\nQue tal adicionar algo delicioso primeiro? 🍕\n\nMe conta o que você gostaria de experimentar! 😊`,
        
        `🤔 Hmm, não tem nada no seu carrinho!\n\nQue tal escolher algo gostoso do nosso cardápio? 🍕\n\nTô aqui pra te ajudar! 😄`,
        
        `😅 Seu carrinho tá vazio!\n\nVamos adicionar algo delicioso primeiro? 🍕\n\nTem várias opções incríveis! 😍`
      ];
      
      return {
        response: emptyCartMessages[Math.floor(Math.random() * emptyCartMessages.length)],
        nextStep: 'ordering'
      };
    }
    
    // Encontrar produto na mensagem
    const product = this.findProduct(message);
    if (!product) {
      const notFoundMessages = [
        `🤔 Não encontrei esse produto no seu carrinho!\n\n📋 *Seu carrinho atual:*\n${this.getCartSummary(session)}\n\nMe fala qual produto você quer remover! 😊`,
        
        `😅 Ops! Não tenho esse produto no seu carrinho!\n\n📋 *Seu carrinho:*\n${this.getCartSummary(session)}\n\nQual produto você quer remover? 🤔`,
        
        `Hmm, não encontrei esse produto!\n\n📋 *Seu carrinho:*\n${this.getCartSummary(session)}\n\nMe conta qual produto você quer remover! 😊`
      ];
      
      return {
        response: notFoundMessages[Math.floor(Math.random() * notFoundMessages.length)],
        nextStep: 'ordering'
      };
    }
    
    // Verificar se o produto está no carrinho
    const cartItem = session.cart?.find(item => item.product.id === product.id);
    if (!cartItem) {
      const notInCartMessages = [
        `😅 Ops! ${product.name} não está no seu carrinho!\n\n📋 *Seu carrinho:*\n${this.getCartSummary(session)}\n\nQual produto você quer remover? 🤔`,
        
        `🤔 ${product.name} não está no seu carrinho!\n\n📋 *Seu carrinho:*\n${this.getCartSummary(session)}\n\nMe fala qual produto você quer remover! 😊`,
        
        `Hmm, ${product.name} não está no seu carrinho!\n\n📋 *Seu carrinho:*\n${this.getCartSummary(session)}\n\nQual produto você quer remover? 🤔`
      ];
      
      return {
        response: notInCartMessages[Math.floor(Math.random() * notInCartMessages.length)],
        nextStep: 'ordering'
      };
    }
    
    // Detectar quantidade a remover
    const quantityToRemove = this.extractQuantity(message, cartItem.quantity);
    
    // Remover produto do carrinho
    const updatedCart = session.cart?.map(item => {
      if (item.product.id === product.id) {
        const newQuantity = Math.max(0, item.quantity - quantityToRemove);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0) || [];
    
    // Gerar resposta
    if (quantityToRemove >= cartItem.quantity) {
      // Removeu tudo
      const removedAllMessages = [
        `✅ Pronto! Removi ${product.name} do seu carrinho! 😊\n\n📋 *Seu carrinho:*\n${this.getCartSummaryFromItems(updatedCart)}\n\nQuer adicionar mais alguma coisa ou finalizar? 🤔`,
        
        `🎉 Beleza! ${product.name} foi removido do seu carrinho! 😄\n\n📋 *Seu carrinho:*\n${this.getCartSummaryFromItems(updatedCart)}\n\nVai querer adicionar mais alguma coisa ou finalizar? 😋`,
        
        `🌟 Perfeito! ${product.name} foi removido! 😍\n\n📋 *Seu carrinho:*\n${this.getCartSummaryFromItems(updatedCart)}\n\nQuer adicionar mais alguma coisa ou finalizar? 🤔`
      ];
      
      return {
        response: removedAllMessages[Math.floor(Math.random() * removedAllMessages.length)],
        nextStep: 'ordering',
        cartUpdate: updatedCart
      };
    } else {
      // Removeu parcialmente
      const removedPartialMessages = [
        `✅ Pronto! Removi ${quantityToRemove} ${product.name} do seu carrinho! 😊\n\n📋 *Seu carrinho:*\n${this.getCartSummaryFromItems(updatedCart)}\n\nQuer adicionar mais alguma coisa ou finalizar? 🤔`,
        
        `🎉 Beleza! Removi ${quantityToRemove} ${product.name}! 😄\n\n📋 *Seu carrinho:*\n${this.getCartSummaryFromItems(updatedCart)}\n\nVai querer adicionar mais alguma coisa ou finalizar? 😋`,
        
        `🌟 Perfeito! Removi ${quantityToRemove} ${product.name}! 😍\n\n📋 *Seu carrinho:*\n${this.getCartSummaryFromItems(updatedCart)}\n\nQuer adicionar mais alguma coisa ou finalizar? 🤔`
      ];
      
      return {
        response: removedPartialMessages[Math.floor(Math.random() * removedPartialMessages.length)],
        nextStep: 'ordering',
        cartUpdate: updatedCart
      };
    }
  }

  // Extrair quantidade da mensagem
  private extractQuantity(message: string, maxQuantity: number): number {
    const lowerMessage = message.toLowerCase();
    
    // Procurar por números
    const numberMatch = lowerMessage.match(/(\d+)/);
    if (numberMatch) {
      const quantity = parseInt(numberMatch[1]);
      return Math.min(quantity, maxQuantity);
    }
    
    // Se não encontrou número, remover 1
    return 1;
  }

  // Obter resumo do carrinho
  private getCartSummary(session: CustomerSession): string {
    return session.cart?.map(item => 
      `${item.quantity}x ${item.product.name}`
    ).join('\n') || 'Vazio';
  }

  // Obter resumo do carrinho a partir de itens
  private getCartSummaryFromItems(items: any[]): string {
    return items.map(item => 
      `${item.quantity}x ${item.product.name}`
    ).join('\n') || 'Vazio';
  }
} 