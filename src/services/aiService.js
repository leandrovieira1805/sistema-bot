// Sistema de IA para atendimento humanizado com fluxo completo
export class AIService {
  constructor(storeConfig, products, promotions) {
    this.storeConfig = storeConfig;
    this.products = products;
    this.promotions = promotions;
  }

  // Processar mensagem do cliente com IA
  processMessage(session, message) {
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
  analyzeContext(session, message) {
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
  analyzeSentiment(message) {
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
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  // Verificar se é horário de pico
  isRushHour() {
    const hour = new Date().getHours();
    return (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);
  }

  // Tratar saudação inicial - SEMPRE envia foto do cardápio
  handleGreeting(session, message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Se for primeira mensagem, sempre envia boas-vindas + cardápio
    if (context.isFirstTime) {
      const customerName = session.customerData?.name || null;
      return {
        response: this.generateWelcomeResponse(context, customerName),
        nextStep: 'ordering',
        shouldSendImage: this.storeConfig.menuImage || this.storeConfig.menuImages?.[0]
      };
    }
    
    // Se não for primeira vez, verifica intenções
    if (lowerMessage.includes('cardápio') || lowerMessage.includes('cardapio') || lowerMessage === '1') {
      return {
        response: this.generateMenuResponse(context),
        nextStep: 'ordering',
        shouldSendImage: this.storeConfig.menuImage || this.storeConfig.menuImages?.[0]
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
      shouldSendImage: this.storeConfig.menuImage || this.storeConfig.menuImages?.[0]
    };
  }

  // Gerar resposta de boas-vindas
  generateWelcomeResponse(context, customerName = null) {
    // Usar a mensagem de saudação configurada nas configurações da loja
    if (this.storeConfig.greeting) {
      const nameGreeting = customerName ? `, ${customerName}` : '';
      const personalizedGreeting = this.storeConfig.greeting.replace(
        /Olá!|Oi!|Bem-vindo/gi, 
        (match) => {
          const timeGreetings = {
            morning: 'Bom dia',
            afternoon: 'Boa tarde', 
            evening: 'Boa noite',
            night: 'Boa noite'
          };
          const greeting = timeGreetings[context.timeOfDay] || 'Olá';
          return `${greeting}${nameGreeting}!`;
        }
      );
      
      return personalizedGreeting;
    }
    
    // Fallback para mensagem padrão se não houver configuração
    const timeGreetings = {
      morning: 'Bom dia',
      afternoon: 'Boa tarde', 
      evening: 'Boa noite',
      night: 'Boa noite'
    };
    
    const greeting = timeGreetings[context.timeOfDay] || 'Olá';
    const storeName = this.storeConfig.name;
    const nameGreeting = customerName ? `, ${customerName}` : '';
    
    const welcomeMessages = [
      `${greeting}${nameGreeting}! 👋 Que alegria ter você aqui na ${storeName}! 😊\n\nAcabei de preparar nosso cardápio especial pra você! 🍕✨\n\nMe conta, o que você tá com vontade de experimentar hoje? 😋`,
      
      `${greeting}${nameGreeting}! 🎉 Bem-vindo(a) à ${storeName}! Tô super feliz de te atender! 😄\n\nOlha só que cardápio incrível preparei pra você! 🍕🔥\n\nQual delícia vai ser hoje? 🤔`,
      
      `${greeting}${nameGreeting}! 🌟 Oi, tudo bem? Que bom que você veio pra ${storeName}! 😊\n\nDá uma olhada no nosso cardápio que tá uma delícia! 🍕💫\n\nMe fala o que você tá afim de comer! 😍`,
      
      `${greeting}${nameGreeting}! 🎊 Seja muito bem-vindo(a) à ${storeName}! Tô aqui pra te ajudar! 😄\n\nAcabei de organizar nosso cardápio com as melhores opções! 🍕⭐\n\nO que você gostaria de pedir? 😋`
    ];
    
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  }

  // Gerar resposta do cardápio
  generateMenuResponse(context) {
    const menuMessages = [
      `Perfeito! 🍕 Aqui está nosso cardápio completo da ${this.storeConfig.name}!\n\nTodas as opções estão fresquinhas e prontas pra você! 😊\n\nMe conta, qual delícia você tá com vontade? 😋`,
      
      `Ótima escolha! 📖 Aqui está nosso cardápio com todas as opções disponíveis!\n\nCada item foi preparado com muito carinho! ❤️\n\nO que você gostaria de experimentar hoje? 🤔`,
      
      `Claro! 🍽️ Aqui está nosso cardápio completo!\n\nTodas as opções estão uma delícia, pode escolher sem medo! 😄\n\nQual vai ser sua escolha? 😍`,
      
      `Beleza! 🍕 Aqui está nosso cardápio da ${this.storeConfig.name}!\n\nTodas as opções estão incríveis, vai ser difícil escolher! 😅\n\nMe fala o que você tá afim! 😋`
    ];
    
    return menuMessages[Math.floor(Math.random() * menuMessages.length)];
  }

  // Gerar resposta de promoções
  generatePromotionsResponse(context) {
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
  handleOrdering(session, message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Detectar finalização
    if (lowerMessage.includes('finalizar') || lowerMessage.includes('terminar') || lowerMessage.includes('pronto') || lowerMessage.includes('acabei')) {
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
    
    // Detectar produto
    const product = this.findProduct(message);
    
    if (product) {
      // Adicionar produto ao carrinho
      const existingItem = session.cart?.find(item => item.product.id === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        if (!session.cart) session.cart = [];
        session.cart.push({
          product,
          quantity: 1
        });
      }
      
      return {
        response: this.generateProductAddedResponse(product, session, context),
        nextStep: 'ordering'
      };
    }
    
    return {
      response: this.generateUnknownProductResponse(context),
      nextStep: 'ordering'
    };
  }

  // Encontrar produto por nome
  findProduct(message) {
    const lowerMessage = message.toLowerCase();
    return this.products.find(product => 
      product.name.toLowerCase().includes(lowerMessage) ||
      lowerMessage.includes(product.name.toLowerCase())
    ) || null;
  }

  // Gerar resposta de produto adicionado
  generateProductAddedResponse(product, session, context) {
    const cartItems = session.cart?.map(item => 
      `${item.quantity}x ${item.product.name}`
    ).join(', ') || '';
    
    const productMessages = [
      `🎉 Perfeito! Adicionei ${product.name} ao seu pedido! 😊\n\n📋 *Seu carrinho:*\n${cartItems}\n\nQuer adicionar mais alguma coisa ou finalizar o pedido? 🤔`,
      
      `✅ Beleza! ${product.name} foi adicionado com sucesso! 😄\n\n📋 *Seu pedido:*\n${cartItems}\n\nVai querer mais alguma coisa ou finalizar? 😋`,
      
      `🌟 Ótima escolha! ${product.name} tá no seu carrinho! 😍\n\n📋 *Seu pedido:*\n${cartItems}\n\nQuer adicionar mais alguma coisa ou finalizar? 🤔`,
      
      `💫 Incrível! ${product.name} foi adicionado ao seu pedido! ✨\n\n📋 *Seu carrinho:*\n${cartItems}\n\nVai querer mais alguma coisa ou finalizar? 😊`
    ];
    
    return productMessages[Math.floor(Math.random() * productMessages.length)];
  }

  // Gerar resposta de produto não encontrado
  generateUnknownProductResponse(context) {
    const unknownMessages = [
      `Hmm, não encontrei esse produto no nosso cardápio! 😅\n\nPode me dizer o nome exato ou dar uma olhada no cardápio? 🍕\n\nTô aqui pra te ajudar a encontrar o que você quer! 😊`,
      
      `Ops! Não tenho esse produto disponível! 😅\n\nQue tal dar uma olhada no nosso cardápio pra ver as opções? 🍕\n\nTem várias delícias pra você escolher! 😋`,
      
      `Desculpa, não encontrei esse produto! 😅\n\nDá uma olhada no nosso cardápio que tem várias opções incríveis! 🍕\n\nMe fala o que você tá afim! 😊`,
      
      `Não tenho esse produto no cardápio! 😅\n\nOlha só as opções que temos disponíveis! 🍕\n\nTem coisa muito boa pra você! 😍`
    ];
    
    return unknownMessages[Math.floor(Math.random() * unknownMessages.length)];
  }

  // Tratar finalização do pedido
  generateFinalizeResponse(session, context) {
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
  handleDeliveryType(session, message, context) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('entrega') || lowerMessage === '1') {
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
  handleAddress(session, message, step, context) {
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
  handleCustomerName(session, message, context) {
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
  handlePayment(session, message, context) {
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
  handleCashAmount(session, message, context) {
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
  handlePixProof(session, message, context) {
    return this.finalizeOrder(session, context, 'PIX');
  }

  // Finalizar pedido
  finalizeOrder(session, context, paymentMethod, cashAmount, change) {
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
  generateOrderSummary(session, context) {
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
  calculateTotal(session, context) {
    const subtotal = context.cartTotal;
    const deliveryFee = session.customerData?.deliveryType === 'delivery' ? this.storeConfig.deliveryFee : 0;
    return subtotal + deliveryFee;
  }

  // Obter texto do método de pagamento
  getPaymentMethodText(method) {
    switch (method) {
      case 'PIX': return 'PIX';
      case 'CASH': return 'Dinheiro';
      case 'CARD': return 'Cartão';
      default: return method;
    }
  }

  // Tratar mensagem desconhecida
  handleUnknown(session, message, context) {
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
} 