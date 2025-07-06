import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, User } from 'lucide-react';
import { CustomerSession, ChatMessage, Product, StoreConfig, Promotion } from '../../types';

interface WhatsAppBotProps {
  storeConfig: StoreConfig;
  products: Product[];
  promotions: Promotion[];
  sessions: CustomerSession[];
  onUpdateSession: (phone: string, updates: Partial<CustomerSession>) => void;
  onCreateOrder: (sessionPhone: string) => void;
}

export function WhatsAppBot({ 
  storeConfig, 
  products, 
  promotions,
  sessions, 
  onUpdateSession, 
  onCreateOrder 
}: WhatsAppBotProps) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [simulatedPhone, setSimulatedPhone] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedSession, sessions]);

  const createNewSession = () => {
    if (!simulatedPhone.trim()) return;
    
    const phone = simulatedPhone.trim();
    const existingSession = sessions.find(s => s.phone === phone);
    
    if (!existingSession) {
      const newSession: CustomerSession = {
        phone,
        cart: [],
        step: 'greeting',
        messages: [],
        customerData: {}
      };
      
      onUpdateSession(phone, newSession);
    }
    
    setSelectedSession(phone);
    setSimulatedPhone('');
  };

  const sendMessage = (content: string, type: 'customer' | 'bot' = 'customer') => {
    if (!selectedSession) return;

    const session = sessions.find(s => s.phone === selectedSession);
    if (!session) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };

    const updatedMessages = [...session.messages, newMessage];
    onUpdateSession(selectedSession, { messages: updatedMessages });

    if (type === 'customer') {
      // Process customer message and generate bot response
      setTimeout(() => {
        processCustomerMessage(session, content);
      }, 500);
    }
  };

  const sendBotMessage = (content: string, image?: string) => {
    if (!selectedSession) return;

    const session = sessions.find(s => s.phone === selectedSession);
    if (!session) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      image,
      timestamp: new Date()
    };

    const updatedMessages = [...session.messages, newMessage];
    onUpdateSession(selectedSession, { messages: updatedMessages });
  };

  const processCustomerMessage = (session: CustomerSession, message: string) => {
    const lowerMessage = message.toLowerCase().trim();

    switch (session.step) {
      case 'greeting':
        if (lowerMessage === '1') {
          showMenu(session);
        } else if (lowerMessage === '2') {
          showPromotions(session);
        } else {
          sendBotMessage(storeConfig.greeting);
        }
        break;

      case 'menu':
      case 'ordering':
        if (lowerMessage === 'finalizar' || lowerMessage === 'finalizar pedido') {
          finalizeOrder(session);
        } else {
          addProductToCart(session, message);
        }
        break;

      case 'delivery_type':
        handleDeliveryType(session, lowerMessage);
        break;

      case 'address_street':
      case 'address_number':
      case 'address_district':
      case 'address_city':
      case 'address_reference':
        handleAddressStep(session, message, session.step);
        break;

      case 'customer_name':
        handleCustomerName(session, message);
        break;

      case 'payment_method':
        handlePayment(session, lowerMessage);
        break;

      case 'cash_amount':
        handleCashAmount(session, message);
        break;

      case 'waiting_pix_proof':
        sendBotMessage('✅ Comprovante PIX recebido!\n\nPedido confirmado e enviado para a cozinha! 🍕\nObrigado pela preferência!');
        setTimeout(() => {
          onCreateOrder(session.phone);
        }, 2000);
        break;

      default:
        sendBotMessage(storeConfig.greeting);
        onUpdateSession(session.phone, { step: 'greeting' });
    }
  };

  const showMenu = (session: CustomerSession) => {
    onUpdateSession(session.phone, { step: 'menu' });
    
    // Send product images with names and prices
    products.forEach((product, index) => {
      setTimeout(() => {
        sendBotMessage(
          `${product.name} - R$ ${product.price.toFixed(2)}`,
          product.image
        );
      }, index * 1000);
    });

    setTimeout(() => {
      sendBotMessage(
        'Este é o nosso cardápio. Estou aguardando seu pedido! 😊 Para adicionar um item, basta escrever o nome do que você deseja.'
      );
    }, products.length * 1000 + 500);
  };

  const showPromotions = (session: CustomerSession) => {
    const activePromotions = promotions.filter(p => p.active);
    
    if (activePromotions.length === 0) {
      sendBotMessage('No momento não temos promoções ativas. Digite 1 para ver nosso cardápio! 😊');
      return;
    }

    onUpdateSession(session.phone, { step: 'promotions' });
    
    // Send promotion images with details
    activePromotions.forEach((promotion, index) => {
      setTimeout(() => {
        sendBotMessage(
          `🔥 ${promotion.title}\n${promotion.description}\n💰 ${promotion.discount}% de desconto!`,
          promotion.image
        );
      }, index * 1500);
    });

    setTimeout(() => {
      sendBotMessage(
        'Essas são nossas promoções ativas! 🔥 Digite 1 para ver o cardápio completo ou o nome de um produto para fazer seu pedido.'
      );
    }, activePromotions.length * 1500 + 500);
  };

  const addProductToCart = (session: CustomerSession, productName: string) => {
    const product = products.find(p => 
      p.name.toLowerCase().includes(productName.toLowerCase()) ||
      productName.toLowerCase().includes(p.name.toLowerCase())
    );

    if (product) {
      const existingItem = session.cart.find(item => item.product.id === product.id);
      let updatedCart;

      if (existingItem) {
        updatedCart = session.cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedCart = [...session.cart, { product, quantity: 1 }];
      }

      // Calcular preço baseado na unidade do produto
      const getProductPrice = (product: Product) => {
        if (product.packPrice && product.packPrice > 0) {
          return product.packPrice;
        } else if (product.unitPrice && product.unitPrice > 0) {
          return product.unitPrice;
        } else {
          return product.price;
        }
      };

      const productPrice = getProductPrice(product);
      const total = updatedCart.reduce((sum, item) => sum + (getProductPrice(item.product) * item.quantity), 0);

      onUpdateSession(session.phone, {
        cart: updatedCart,
        step: 'ordering'
      });

      // Mensagem com informações de unidade
      let priceMessage = '';
      if (product.packPrice && product.packPrice > 0 && product.unitPrice && product.unitPrice > 0) {
        priceMessage = `\n💰 Preços:\n• ${product.packSize || 1}x ${product.unitLabel || 'unidade'}: R$ ${product.packPrice.toFixed(2)}\n• 1 ${product.unitLabel || 'unidade'}: R$ ${product.unitPrice.toFixed(2)}`;
      } else if (product.packPrice && product.packPrice > 0) {
        priceMessage = `\n💰 Preço: R$ ${product.packPrice.toFixed(2)} por ${product.packSize || 1}x ${product.unitLabel || 'unidade'}`;
      } else if (product.unitPrice && product.unitPrice > 0) {
        priceMessage = `\n💰 Preço: R$ ${product.unitPrice.toFixed(2)} por ${product.unitLabel || 'unidade'}`;
      } else {
        priceMessage = `\n💰 Preço: R$ ${product.price.toFixed(2)}`;
      }

      sendBotMessage(
        `✅ ${product.name} adicionado!${priceMessage}\n\nO total do seu pedido está em R$ ${total.toFixed(2)}. Deseja mais alguma coisa? (Digite o nome de outro item ou 'finalizar' para concluir).`
      );
    } else {
      sendBotMessage(
        'Desculpe, não encontrei esse item no nosso cardápio. Por favor, verifique o nome do produto ou digite um dos itens do menu mostrado acima.'
      );
    }
  };

  const finalizeOrder = (session: CustomerSession) => {
    if (session.cart.length === 0) {
      sendBotMessage('Seu carrinho está vazio! Digite o nome de um produto para adicionar ao pedido.');
      return;
    }

    onUpdateSession(session.phone, { step: 'delivery_type' });
    sendBotMessage('📋 *FINALIZAR PEDIDO*\n\nSeu pedido é para entrega ou retirada?\nDigite "entrega" ou "retirada":');
  };

  const handleDeliveryType = (session: CustomerSession, deliveryType: string) => {
    if (deliveryType === 'entrega') {
      onUpdateSession(session.phone, { 
        customerData: { ...session.customerData, deliveryType: 'delivery' },
        step: 'address_street'
      });
      sendBotMessage('📍 *ENDEREÇO DE ENTREGA*\n\nPor favor, me informe sua rua:');
    } else if (deliveryType === 'retirada') {
      onUpdateSession(session.phone, { 
        customerData: { ...session.customerData, deliveryType: 'pickup' },
        step: 'customer_name'
      });
      sendBotMessage('✅ Pedido para retirada!\n\nPor favor, me informe seu nome:');
    } else {
      sendBotMessage('Por favor, digite "entrega" ou "retirada":');
    }
  };

  const handleAddressStep = (session: CustomerSession, message: string, step: string) => {
    const updates: Partial<CustomerSession> = { customerData: { ...session.customerData } };
    
    switch (step) {
      case 'address_street':
        updates.customerData!.street = message;
        updates.step = 'address_number';
        sendBotMessage('Agora me informe o número:');
        break;
      case 'address_number':
        updates.customerData!.number = message;
        updates.step = 'address_district';
        sendBotMessage('Agora me informe o bairro:');
        break;
      case 'address_district':
        updates.customerData!.district = message;
        updates.step = 'address_city';
        sendBotMessage('Agora me informe a cidade:');
        break;
      case 'address_city':
        updates.customerData!.city = message;
        updates.step = 'address_reference';
        sendBotMessage('Por último, me informe um ponto de referência (opcional):');
        break;
      case 'address_reference':
        updates.customerData!.reference = message;
        
        // Montar endereço completo
        let address = `${session.customerData.street}, ${session.customerData.number} - ${session.customerData.district}, ${session.customerData.city}`;
        if (message) {
          address += ` (Ref: ${message})`;
        }
        updates.customerData!.address = address;
        updates.step = 'customer_name';
        sendBotMessage('✅ Endereço completo registrado!\n\nPor favor, me informe seu nome:');
        break;
    }
    
    onUpdateSession(session.phone, updates);
  };

  const handleCustomerName = (session: CustomerSession, name: string) => {
    const cartTotal = session.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const isDelivery = session.customerData.deliveryType === 'delivery';
    const total = isDelivery ? cartTotal + storeConfig.deliveryFee : cartTotal;
    
    onUpdateSession(session.phone, {
      customerData: { ...session.customerData, name },
      step: 'payment_method'
    });
    
    sendBotMessage(
      `💰 *VALOR TOTAL*\n\n` +
      `Subtotal: R$ ${cartTotal.toFixed(2)}\n` +
      (isDelivery ? `Taxa de entrega: R$ ${storeConfig.deliveryFee.toFixed(2)}\n` : '') +
      `*Total: R$ ${total.toFixed(2)}*\n\n` +
      `💳 *FORMA DE PAGAMENTO*\n\n` +
      `Escolha a forma de pagamento:\n` +
      `1. PIX\n` +
      `2. Dinheiro\n` +
      `3. Cartão\n\n` +
      `Digite o número da opção:`
    );
  };

  const handlePayment = (session: CustomerSession, method: string) => {
    const cartTotal = session.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const isDelivery = session.customerData.deliveryType === 'delivery';
    const total = isDelivery ? cartTotal + storeConfig.deliveryFee : cartTotal;

    if (method === '1' || method === 'pix') {
      onUpdateSession(session.phone, {
        customerData: { ...session.customerData, paymentMethod: 'PIX' },
        step: 'waiting_pix_proof'
      });
      
      sendBotMessage(
        `💳 *PAGAMENTO VIA PIX*\n\n` +
        `*Valor total:* R$ ${total.toFixed(2)}\n` +
        `*Chave PIX:* ${storeConfig.pixKey}\n\n` +
        `Após o pagamento, envie o comprovante para finalizar o pedido!`
      );

    } else if (method === '2' || method === 'dinheiro') {
      onUpdateSession(session.phone, {
        customerData: { ...session.customerData, paymentMethod: 'CASH' },
        step: 'cash_amount'
      });
      
      sendBotMessage(
        `💵 *PAGAMENTO EM DINHEIRO*\n\n` +
        `*Valor total:* R$ ${total.toFixed(2)}\n` +
        `Informe o valor que você vai pagar:`
      );

    } else if (method === '3' || method === 'cartão' || method === 'cartao') {
      onUpdateSession(session.phone, {
        customerData: { ...session.customerData, paymentMethod: 'CARD' },
        step: 'completed'
      });
      
      sendBotMessage(
        `💳 *PAGAMENTO COM CARTÃO*\n\n` +
        `*Valor total:* R$ ${total.toFixed(2)}\n` +
        `Pedido confirmado! O pagamento será realizado na entrega/retirada.`
      );
      
      setTimeout(() => {
        onCreateOrder(session.phone);
        sendBotMessage('Pedido registrado com sucesso! Obrigado pela preferência! 😊');
      }, 2000);

    } else {
      sendBotMessage('Opção inválida. Digite "1" para PIX, "2" para dinheiro ou "3" para cartão.');
    }
  };

  const handleCashAmount = (session: CustomerSession, amount: string) => {
    const cartTotal = session.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const isDelivery = session.customerData.deliveryType === 'delivery';
    const total = isDelivery ? cartTotal + storeConfig.deliveryFee : cartTotal;
    
    const cashAmount = parseFloat(amount.replace(',', '.'));
    
    if (isNaN(cashAmount) || cashAmount < total) {
      sendBotMessage(`O valor deve ser maior ou igual ao total de R$ ${total.toFixed(2)}. Informe novamente:`);
      return;
    }
    
        const change = cashAmount - total;
        
        onUpdateSession(session.phone, {
          customerData: { 
            ...session.customerData, 
            paymentMethod: 'CASH',
            cashAmount,
        change
          },
          step: 'completed'
        });
        
        sendBotMessage(
      `💵 *PAGAMENTO EM DINHEIRO*\n\n` +
      `*Valor total:* R$ ${total.toFixed(2)}\n` +
      `*Valor pago:* R$ ${cashAmount.toFixed(2)}\n` +
      `*Troco:* R$ ${change.toFixed(2)}\n\n` +
      `Pedido confirmado e enviado para a cozinha! 🍕\n` +
      `Obrigado pela preferência!`
        );
        
        setTimeout(() => {
          onCreateOrder(session.phone);
    }, 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedSession) {
      sendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const currentSession = selectedSession ? sessions.find(s => s.phone === selectedSession) : null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 text-white p-4">
          <h3 className="text-xl font-semibold">Simulador do Bot WhatsApp</h3>
          <p className="text-green-100 text-sm">
            Simule conversas para testar o fluxo de pedidos
          </p>
        </div>

        <div className="flex h-96">
          {/* Sessions List */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simulatedPhone}
                  onChange={(e) => setSimulatedPhone(e.target.value)}
                  placeholder="Simular número..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={createNewSession}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Iniciar
                </button>
              </div>
            </div>

            <div className="overflow-y-auto h-full">
              {sessions.map((session) => (
                <button
                  key={session.phone}
                  onClick={() => setSelectedSession(session.phone)}
                  className={`w-full p-3 text-left border-b border-gray-200 hover:bg-gray-100 transition-colors ${
                    selectedSession === session.phone ? 'bg-green-50 border-r-2 border-green-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-600" />
                    <span className="font-medium">{session.phone}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {session.cart.length} itens • {session.step}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentSession ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {currentSession.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.type === 'customer'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {message.image && (
                          <img
                            src={message.image}
                            alt=""
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.type === 'customer' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <User size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Selecione uma conversa ou inicie uma nova</p>
                  <p className="text-sm">para testar o bot</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}