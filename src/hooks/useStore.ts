import { useState, useEffect } from 'react';
import { StoreConfig, Category, Promotion, Order, CustomerSession, Product } from '../types';
import { whatsappService } from '../services/whatsappService';

const defaultStoreConfig: StoreConfig = {
  name: 'Pizzaria Delícia',
  greeting: 'Olá! Seja bem-vindo à Pizzaria Delícia. Digite o número da opção desejada:\n1. Ver Cardápio 📖\n2. Ver Promoções 🔥',
  deliveryFee: 5.00,
  pixKey: 'contato@pizzariadelicia.com.br',
  pixKeyHolder: 'João Silva',
  address: 'Rua das Pizzas, 123 - Centro - Cidade Exemplo',
  menuImage: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800',
  menuImages: []
};

const sampleCategories: Category[] = [
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
      },
      {
        id: '2', 
        name: 'Pizza Margherita',
        price: 42.00,
        image: 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400',
        categoryId: '1'
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
        categoryId: '2'
      }
    ]
  }
];

export function useStore() {
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(defaultStoreConfig);
  const [categories, setCategories] = useState<Category[]>(sampleCategories);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerSessions, setCustomerSessions] = useState<CustomerSession[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveStatus, setLastSaveStatus] = useState<'success' | 'error' | null>(null);

  // Sincronizar com o backend
  useEffect(() => {
    const socket = whatsappService.getSocket();
    if (!socket) return;

    // Receber dados da loja do backend
    socket.on('store-data', (data: any) => {
      if (data.config) setStoreConfig(data.config);
      if (data.categories) setCategories(data.categories);
      if (data.promotions) setPromotions(data.promotions);
    });

    // Receber pedidos do backend
    socket.on('orders-update', (newOrders: Order[]) => {
      setOrders(newOrders);
    });

    // Receber novos pedidos
    socket.on('new-order', (order: Order) => {
      setOrders((prev: Order[]) => [order, ...prev]);
    });

    // Receber confirmação de salvamento
    socket.on('store-data-updated', (response: any) => {
      setIsSaving(false);
      if (response.success) {
        setLastSaveStatus('success');
        console.log('✅ Dados salvos com sucesso no servidor');
        // Limpar status após 3 segundos
        setTimeout(() => setLastSaveStatus(null), 3000);
      } else {
        setLastSaveStatus('error');
        console.error('❌ Erro ao salvar dados:', response.error);
        // Limpar status após 5 segundos
        setTimeout(() => setLastSaveStatus(null), 5000);
      }
    });

    return () => {
      socket.off('store-data');
      socket.off('orders-update');
      socket.off('new-order');
      socket.off('store-data-updated');
    };
  }, []);

  // Sincronizar mudanças com o backend com retry automático
  const syncWithBackend = async (data: any, retryCount = 0) => {
    console.log('=== SINCRONIZANDO COM BACKEND ===');
    console.log('Dados sendo enviados:', JSON.stringify(data, null, 2));
    
    setIsSaving(true);
    
    const socket = whatsappService.getSocket();
    if (socket) {
      console.log('Socket encontrado, enviando dados...');
      
      try {
      socket.emit('update-store-data', data);
      console.log('Dados enviados com sucesso!');
        
        // Timeout para aguardar confirmação
        const timeout = setTimeout(() => {
          if (isSaving) {
            console.log('⚠️ Timeout na confirmação, tentando novamente...');
            if (retryCount < 3) {
              syncWithBackend(data, retryCount + 1);
            } else {
              setIsSaving(false);
              setLastSaveStatus('error');
              console.error('❌ Falha após 3 tentativas de salvamento');
            }
          }
        }, 5000);
        
        // Limpar timeout se receber confirmação
        socket.once('store-data-updated', () => {
          clearTimeout(timeout);
        });
        
      } catch (error) {
        console.error('❌ Erro ao enviar dados:', error);
        setIsSaving(false);
        setLastSaveStatus('error');
        
        // Retry automático
        if (retryCount < 3) {
          console.log(`🔄 Tentativa ${retryCount + 1} de 3...`);
          setTimeout(() => syncWithBackend(data, retryCount + 1), 1000);
        }
      }
    } else {
      console.log('ERRO: Socket não encontrado!');
      setIsSaving(false);
      setLastSaveStatus('error');
      
      // Tentar reconectar e salvar
      if (retryCount < 3) {
        console.log('🔄 Tentando reconectar socket...');
        setTimeout(() => {
          // Tentar reconectar automaticamente
          setTimeout(() => syncWithBackend(data, retryCount + 1), 1000);
        }, 1000);
      }
    }
  };

  // Store Config
  const updateStoreConfig = async (config: Partial<StoreConfig>) => {
    const newConfig = { ...storeConfig, ...config };
    setStoreConfig(newConfig);
    await syncWithBackend({ config: newConfig });
  };

  // Categories
  const addCategory = async (name: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      products: []
    };
    
    const newCategories = [...categories, newCategory];
    setCategories(newCategories);
    await syncWithBackend({ categories: newCategories });
  };

  const updateCategory = async (id: string, name: string) => {
    const newCategories = categories.map((cat: Category) => 
        cat.id === id ? { ...cat, name } : cat
      );
    setCategories(newCategories);
    await syncWithBackend({ categories: newCategories });
  };

  const deleteCategory = async (id: string) => {
    const newCategories = categories.filter((cat: Category) => cat.id !== id);
    setCategories(newCategories);
    await syncWithBackend({ categories: newCategories });
  };

  // Products
  const addProduct = async (categoryId: string, product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      categoryId
    };
    
    const newCategories = categories.map((cat: Category) => 
      cat.id === categoryId 
        ? { ...cat, products: [...cat.products, newProduct] }
        : cat
      );
    setCategories(newCategories);
    await syncWithBackend({ categories: newCategories });
  };

  const updateProduct = async (categoryId: string, productId: string, updates: Partial<Product>) => {
    const newCategories = categories.map((cat: Category) => 
        cat.id === categoryId 
          ? { 
              ...cat, 
            products: cat.products.map((prod: Product) => 
                prod.id === productId ? { ...prod, ...updates } : prod
              )
            }
          : cat
      );
    setCategories(newCategories);
    await syncWithBackend({ categories: newCategories });
  };

  const deleteProduct = async (categoryId: string, productId: string) => {
    const newCategories = categories.map((cat: Category) => 
        cat.id === categoryId 
        ? { ...cat, products: cat.products.filter((prod: Product) => prod.id !== productId) }
          : cat
      );
    setCategories(newCategories);
    await syncWithBackend({ categories: newCategories });
  };

  // Promotions
  const addPromotion = async (promotion: Omit<Promotion, 'id'>) => {
    const newPromotion: Promotion = { ...promotion, id: Date.now().toString() };
    const newPromotions = [...promotions, newPromotion];
    setPromotions(newPromotions);
    await syncWithBackend({ promotions: newPromotions });
  };

  const updatePromotion = async (id: string, updates: Partial<Promotion>) => {
    const newPromotions = promotions.map((promo: Promotion) => 
      promo.id === id ? { ...promo, ...updates } : promo
    );
    setPromotions(newPromotions);
    await syncWithBackend({ promotions: newPromotions });
  };

  const deletePromotion = async (id: string) => {
    const newPromotions = promotions.filter((promo: Promotion) => promo.id !== id);
    setPromotions(newPromotions);
    await syncWithBackend({ promotions: newPromotions });
  };

  // Orders
  const addOrder = async (order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = { ...order, id: Date.now().toString(), createdAt: new Date() };
    const newOrders = [newOrder, ...orders];
    setOrders(newOrders);
    await syncWithBackend({ orders: newOrders });
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    const newOrders = orders.map((order: Order) => 
      order.id === id ? { ...order, status } : order
    );
    setOrders(newOrders);
    await syncWithBackend({ orders: newOrders });
  };

  // Customer Sessions
  const getOrCreateSession = (phone: string): CustomerSession => {
    let session = customerSessions.find((s: CustomerSession) => s.phone === phone);
    if (!session) {
      session = {
        phone,
        cart: [],
        customerData: null,
        lastActivity: new Date()
      };
      setCustomerSessions((prev: CustomerSession[]) => [...prev, session!]);
    }
    return session;
  };

  const updateSession = (phone: string, updates: Partial<CustomerSession>) => {
    console.log('=== ATUALIZANDO SESSÃO ===');
    console.log('Telefone:', phone);
    console.log('Atualizações:', updates);
    console.log('Sessões atuais:', customerSessions);
    
    setCustomerSessions((prev: CustomerSession[]) => {
      const sessionIndex = prev.findIndex((session: CustomerSession) => session.phone === phone);
      console.log('Índice da sessão:', sessionIndex);
      
      if (sessionIndex === -1) {
        console.log('❌ Sessão não encontrada, criando nova...');
        // Se a sessão não existe, criar uma nova
        const newSession: CustomerSession = {
          phone,
          cart: [],
          step: 'greeting',
          messages: [],
          customerData: {},
          lastActivity: new Date(),
          ...updates
        };
        console.log('Nova sessão criada:', newSession);
        return [...prev, newSession];
      } else {
        console.log('✅ Sessão encontrada, atualizando...');
        const updatedSessions = prev.map((session: CustomerSession, index: number) => {
          if (index === sessionIndex) {
            const updatedSession = { 
              ...session, 
              ...updates, 
              lastActivity: new Date() 
            };
            console.log('Sessão atualizada:', updatedSession);
            return updatedSession;
          }
          return session;
        });
        console.log('Sessões após atualização:', updatedSessions);
        return updatedSessions;
      }
    });
  };

  const getAllProducts = () => {
    return categories.flatMap((cat: Category) => cat.products);
  };

  return {
    storeConfig,
    updateStoreConfig,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    promotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    orders,
    addOrder,
    updateOrderStatus,
    customerSessions,
    getOrCreateSession,
    updateSession,
    getAllProducts,
    isSaving,
    lastSaveStatus
  };
}