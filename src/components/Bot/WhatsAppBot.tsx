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
        if (lowerMessage === 'não' || lowerMessage === 'nao') {
          finalizeOrder(session);
        } else {
          addProductToCart(session, message);
        }
        break;

      case 'address':
        onUpdateSession(session.phone, {
          customerData: { ...session.customerData, address: message },
          step: 'payment'
        });
        
        const deliveryTotal = session.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) + storeConfig.deliveryFee;
        
        sendBotMessage(
          `Endereço recebido! O valor do seu pedido é R$ ${session.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)} + R$ ${storeConfig.deliveryFee.toFixed(2)} (taxa de entrega), totalizando R$ ${deliveryTotal.toFixed(2)}. Qual será a forma de pagamento? (Digite 'PIX' ou 'Dinheiro')`
        );
        break;

      case 'payment':
        handlePayment(session, lowerMessage);
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

      const total = updatedCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

      onUpdateSession(session.phone, {
        cart: updatedCart,
        step: 'ordering'
      });

      sendBotMessage(
        `✅ ${product.name} adicionado! O total do seu pedido está em R$ ${total.toFixed(2)}. Deseja mais alguma coisa? (Digite o nome de outro item ou 'não' para finalizar).`
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

    onUpdateSession(session.phone, { step: 'address' });
    sendBotMessage('Entendido! Seu pedido é para entrega? (Responda "sim" ou "não")');
    
    setTimeout(() => {
      sendBotMessage('Ótimo! Por favor, me informe seu endereço completo para a entrega (Rua, Número, Bairro, Cidade e Ponto de Referência).');
    }, 1000);
  };

  const handlePayment = (session: CustomerSession, method: string) => {
    if (method === 'pix') {
      onUpdateSession(session.phone, {
        customerData: { ...session.customerData, paymentMethod: 'PIX' },
        step: 'completed'
      });
      
      sendBotMessage(
        `Certo! Nossa chave PIX é: ${storeConfig.pixKey}. Assim que fizer o pagamento, por favor, me envie o comprovante. Vou registrar seu pedido!`
      );
      
      setTimeout(() => {
        onCreateOrder(session.phone);
        sendBotMessage('Pedido registrado com sucesso! Obrigado pela preferência! 😊');
      }, 2000);

    } else if (method === 'dinheiro') {
      sendBotMessage('Pagamento em dinheiro. Você precisa de troco? Se sim, para qual valor? (Ex: "troco para 100")');
      
      // Handle cash payment logic here
      setTimeout(() => {
        const total = session.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) + storeConfig.deliveryFee;
        const cashAmount = 100; // This would come from user input
        const change = cashAmount - total;
        
        onUpdateSession(session.phone, {
          customerData: { 
            ...session.customerData, 
            paymentMethod: 'CASH',
            cashAmount,
          },
          step: 'completed'
        });
        
        sendBotMessage(
          `Combinado! O entregador levará troco para R$ ${cashAmount.toFixed(2)} (seu troco será de R$ ${change.toFixed(2)}). Pedido confirmado! Agradecemos a preferência.`
        );
        
        setTimeout(() => {
          onCreateOrder(session.phone);
        }, 1000);
      }, 3000);

    } else {
      sendBotMessage('Por favor, escolha entre "PIX" ou "Dinheiro" como forma de pagamento.');
    }
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