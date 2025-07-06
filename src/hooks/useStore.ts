import { useState, useEffect } from 'react';
import { StoreConfig, Category, Promotion, Order, CustomerSession, Product } from '../types';
import { whatsappService } from '../services/whatsappService';
import { useAuth } from '../contexts/AuthContext';

const defaultStoreConfig: StoreConfig = {
  name: 'Pizzaria Delícia',
  greeting: 'Olá! Seja bem-vindo à Pizzaria Delícia. Digite o número da opção desejada:\n1. Ver Cardápio 📖\n2. Ver Promoções 🔥',
  deliveryFee: 5.00,
  pixKey: 'contato@pizzariadelicia.com.br',
  address: 'Rua das Pizzas, 123 - Centro - Cidade Exemplo',
  menuImage: 'https://exemplo.com/cardapio.jpg'
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
  const { user } = useAuth();
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(defaultStoreConfig);
  const [categories, setCategories] = useState<Category[]>(sampleCategories);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerSessions, setCustomerSessions] = useState<CustomerSession[]>([]);

  // Carregar configurações do usuário logado
  useEffect(() => {
    if (user) {
      // Carregar configurações específicas do usuário
      fetch(`/api/user/${user.id}/config`)
        .then(res => res.json())
        .then(config => {
          setStoreConfig(config);
        })
        .catch(error => {
          console.error('Erro ao carregar configurações do usuário:', error);
        });
    }
  }, [user]);

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
      setOrders(prev => [order, ...prev]);
    });

    return () => {
      socket.off('store-data');
      socket.off('orders-update');
      socket.off('new-order');
    };
  }, []);

  // Sincronizar mudanças com o backend
  const syncWithBackend = (data: any) => {
    const socket = whatsappService.getSocket();
    if (socket) {
      socket.emit('update-store-data', data);
    }
  };

  // Store Config
  const updateStoreConfig = async (config: Partial<StoreConfig>) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/user/${user.id}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const updatedConfig = await response.json();
        setStoreConfig(updatedConfig);
        syncWithBackend({ config: updatedConfig });
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
    }
  };

  // Categories and Products
  const addCategory = (name: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      products: []
    };
    setCategories(prev => {
      const newCategories = [...prev, newCategory];
      syncWithBackend({ categories: newCategories });
      return newCategories;
    });
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(prev => {
      const newCategories = prev.map(cat => 
      cat.id === id ? { ...cat, name } : cat
      );
      syncWithBackend({ categories: newCategories });
      return newCategories;
    });
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => {
      const newCategories = prev.filter(cat => cat.id !== id);
      syncWithBackend({ categories: newCategories });
      return newCategories;
    });
  };

  const addProduct = (categoryId: string, product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString()
    };
    
    setCategories(prev => {
      const newCategories = prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, products: [...cat.products, newProduct] }
        : cat
      );
      syncWithBackend({ categories: newCategories });
      return newCategories;
    });
  };

  const updateProduct = (categoryId: string, productId: string, updates: Partial<Product>) => {
    setCategories(prev => {
      const newCategories = prev.map(cat => 
        cat.id === categoryId 
          ? { 
              ...cat, 
              products: cat.products.map(prod => 
                prod.id === productId ? { ...prod, ...updates } : prod
              )
            }
          : cat
      );
      syncWithBackend({ categories: newCategories });
      return newCategories;
    });
  };

  const deleteProduct = (categoryId: string, productId: string) => {
    setCategories(prev => {
      const newCategories = prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, products: cat.products.filter(prod => prod.id !== productId) }
          : cat
      );
      syncWithBackend({ categories: newCategories });
      return newCategories;
    });
  };

  // Promotions
  const addPromotion = (promotion: Omit<Promotion, 'id'>) => {
    const newPromotion: Promotion = {
      ...promotion,
      id: Date.now().toString()
    };
    setPromotions(prev => [...prev, newPromotion]);
  };

  const updatePromotion = (id: string, updates: Partial<Promotion>) => {
    setPromotions(prev => prev.map(promo => 
      promo.id === id ? { ...promo, ...updates } : promo
    ));
  };

  const deletePromotion = (id: string) => {
    setPromotions(prev => prev.filter(promo => promo.id !== id));
  };

  // Orders
  const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setOrders(prev => [newOrder, ...prev]);
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === id ? { ...order, status } : order
    ));
  };

  // Customer Sessions
  const getOrCreateSession = (phone: string): CustomerSession => {
    const existing = customerSessions.find(session => session.phone === phone);
    if (existing) return existing;

    const newSession: CustomerSession = {
      phone,
      cart: [],
      step: 'greeting',
      messages: []
    };

    setCustomerSessions(prev => [...prev, newSession]);
    return newSession;
  };

  const updateSession = (phone: string, updates: Partial<CustomerSession>) => {
    setCustomerSessions(prev => prev.map(session => 
      session.phone === phone ? { ...session, ...updates } : session
    ));
  };

  // Get all products across categories
  const getAllProducts = () => {
    return categories.flatMap(cat => cat.products);
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
    getAllProducts
  };
}