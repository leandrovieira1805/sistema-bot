import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, User } from 'lucide-react';
import { CustomerSession, ChatMessage, Product, StoreConfig, Promotion } from '../../types';
import { AIService } from '../../services/aiService';

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
  
  // Instanciar serviço de IA
  const aiService = new AIService(storeConfig, products, promotions);

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
        customerData: {},
        lastActivity: new Date()
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

    const updatedMessages = [...(session.messages || []), newMessage];
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

    const updatedMessages = [...(session.messages || []), newMessage];
    onUpdateSession(selectedSession, { messages: updatedMessages });
  };

  const processCustomerMessage = (session: CustomerSession, message: string) => {
    // Usar o serviço de IA para processar a mensagem
    const aiResponse = aiService.processMessage(session, message);
    
    // Enviar resposta do bot
    sendBotMessage(aiResponse.response, aiResponse.shouldSendImage);
    
    // Atualizar sessão com próximo passo e dados do carrinho
    const updates: Partial<CustomerSession> = { 
      step: aiResponse.nextStep,
      lastActivity: new Date()
    };
    
    // Se a IA processou um produto, atualizar o carrinho
    if (aiResponse.nextStep === 'ordering' && message.toLowerCase().includes('finalizar') === false) {
    const product = products.find(p => 
        p.name.toLowerCase().includes(message.toLowerCase()) ||
        message.toLowerCase().includes(p.name.toLowerCase())
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

        updates.cart = updatedCart;
      }
    }
    
    // Se for entrega, marcar o tipo
    if (aiResponse.nextStep === 'address_street') {
      updates.customerData = { ...session.customerData, deliveryType: 'delivery' };
    }
    
    // Se for retirada, marcar o tipo
    if (aiResponse.nextStep === 'payment_method' && session.customerData?.deliveryType !== 'delivery') {
      updates.customerData = { ...session.customerData, deliveryType: 'pickup' };
    }
    
    // Processar dados do endereço
    if (aiResponse.nextStep === 'address_number') {
      updates.customerData = { 
        ...session.customerData, 
        street: message
      };
    }
    
    if (aiResponse.nextStep === 'address_district') {
      updates.customerData = { 
        ...session.customerData, 
        number: message
      };
    }
    
    if (aiResponse.nextStep === 'address_city') {
      updates.customerData = { 
        ...session.customerData, 
        district: message
      };
    }
    
    if (aiResponse.nextStep === 'address_reference') {
      updates.customerData = { 
        ...session.customerData, 
        city: message
      };
    }
    
    if (aiResponse.nextStep === 'payment_method') {
      updates.customerData = { 
        ...session.customerData, 
        reference: message
      };
    }
    
    // Processar nome do cliente
    if (aiResponse.nextStep === 'payment_method' && session.step === 'customer_name') {
      updates.customerData = { ...session.customerData, name: message };
    }
    
    // Processar método de pagamento
    if (aiResponse.nextStep === 'cash_amount' || aiResponse.nextStep === 'waiting_pix_proof') {
      const lowerMessage = message.toLowerCase();
      let paymentMethod: 'PIX' | 'CASH' | 'CARD' = 'PIX';
    
      if (lowerMessage.includes('dinheiro') || lowerMessage === '2') {
        paymentMethod = 'CASH';
      } else if (lowerMessage.includes('cartão') || lowerMessage.includes('cartao') || lowerMessage === '3') {
        paymentMethod = 'CARD';
      }
      
      updates.customerData = { ...session.customerData, paymentMethod };
    }
    
    // Se for valor em dinheiro
    if (aiResponse.nextStep === 'completed' && session.customerData?.paymentMethod === 'CASH') {
      const amount = parseFloat(message.replace(/[^\d,.]/g, '').replace(',', '.'));
      const cartTotal = session.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const isDelivery = session.customerData?.deliveryType === 'delivery';
      const total = isDelivery ? cartTotal + storeConfig.deliveryFee : cartTotal;
      const change = amount - total;
      
      updates.customerData = { 
        ...session.customerData, 
        cashAmount: amount,
        change
      };
    }
    
    onUpdateSession(session.phone, updates);
    
    // Se finalizou o pedido, criar ordem
    if (aiResponse.nextStep === 'completed') {
      setTimeout(() => {
        onCreateOrder(session.phone);
      }, 2000);
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
            Simule conversas para testar o fluxo de pedidos com IA
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
                  {(currentSession.messages || []).map((message) => (
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
                  <p className="text-sm">para testar o bot com IA</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}