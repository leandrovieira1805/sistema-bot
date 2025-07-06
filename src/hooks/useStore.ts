import { useState, useEffect } from 'react';
import { StoreConfig, Category, Promotion, Order, CustomerSession, Product } from '../types';
import { whatsappService } from '../services/whatsappService';
import { useAuth } from '../contexts/AuthContext';

// Configurações padrão para diferentes tipos de usuário
const getUserDefaultConfig = (userType: string): StoreConfig => {
  switch (userType) {
    case 'admin':
      return {
        name: 'Pizzaria Delícia',
        greeting: 'Olá! Seja bem-vindo à Pizzaria Delícia. Digite o número da opção desejada:\n1. Ver Cardápio 📖\n2. Ver Promoções 🔥',
        deliveryFee: 5.00,
        pixKey: 'contato@pizzariadelicia.com.br',
        address: 'Rua das Pizzas, 123 - Centro - Cidade Exemplo',
        menuImage: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800'
      };
    case 'evellyn':
      return {
        name: 'Bebidas Delícia',
        greeting: 'Olá! Seja bem-vindo à Bebidas Delícia. Digite o número da opção desejada:\n1. Ver Catálogo de Bebidas 🥤\n2. Ver Promoções 🔥',
        deliveryFee: 3.00,
        pixKey: 'evellyn@bebidasdelicia.com.br',
        address: 'Rua das Bebidas, 456 - Centro - Cidade Exemplo',
        menuImage: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=800'
      };
    default:
      return {
        name: 'Minha Loja',
        greeting: 'Olá! Seja bem-vindo à nossa loja. Digite o número da opção desejada:\n1. Ver Cardápio 📖\n2. Ver Promoções 🔥',
        deliveryFee: 5.00,
        pixKey: 'contato@minhaloja.com.br',
        address: 'Endereço da loja',
        menuImage: ''
      };
  }
};

// Categorias padrão para diferentes tipos de usuário
const getUserDefaultCategories = (userType: string): Category[] => {
  switch (userType) {
    case 'admin':
      return [
        {
          id: '1',
          name: 'Pizzas',
          products: [
            {
              id: '1',
              name: 'Pizza de Calabresa',
              price: 45.50,
              image: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400',
              categoryId: '1',
              unit: 'unit',
              unitLabel: 'unidade',
              packSize: 1,
              packPrice: 0,
              unitPrice: 45.50
            },
            {
              id: '2', 
              name: 'Pizza Margherita',
              price: 42.00,
              image: 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400',
              categoryId: '1',
              unit: 'unit',
              unitLabel: 'unidade',
              packSize: 1,
              packPrice: 0,
              unitPrice: 42.00
            },
            {
              id: '3',
              name: 'Pizza Quatro Queijos',
              price: 48.00,
              image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?auto=compress&cs=tinysrgb&w=400',
              categoryId: '1',
              unit: 'unit',
              unitLabel: 'unidade',
              packSize: 1,
              packPrice: 0,
              unitPrice: 48.00
            }
          ]
        },
        {
          id: '2',
          name: 'Bebidas',
          products: [
            {
              id: '4',
              name: 'Coca-Cola 2L',
              price: 8.00,
              image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
              categoryId: '2',
              unit: 'unit',
              unitLabel: 'unidade',
              packSize: 1,
              packPrice: 0,
              unitPrice: 8.00
            },
            {
              id: '5',
              name: 'Guaraná Antarctica 2L',
              price: 7.50,
              image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
              categoryId: '2',
              unit: 'unit',
              unitLabel: 'unidade',
              packSize: 1,
              packPrice: 0,
              unitPrice: 7.50
            }
          ]
        }
      ];
    case 'evellyn':
      return [
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
            },
            {
              id: '3',
              name: 'Skol',
              price: 2.80,
              image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=400',
              categoryId: '1',
              unit: 'pack',
              unitLabel: 'fardo',
              packSize: 12,
              packPrice: 28.00,
              unitPrice: 2.80
            }
          ]
        },
        {
          id: '2',
          name: 'Refrigerantes',
          products: [
            {
              id: '4',
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
              id: '5',
              name: 'Pepsi 2L',
              price: 7.50,
              image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
              categoryId: '2',
              unit: 'pack',
              unitLabel: 'fardo',
              packSize: 6,
              packPrice: 39.00,
              unitPrice: 7.50
            },
            {
              id: '6',
              name: 'Guaraná Antarctica 2L',
              price: 7.00,
              image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
              categoryId: '2',
              unit: 'pack',
              unitLabel: 'fardo',
              packSize: 6,
              packPrice: 36.00,
              unitPrice: 7.00
            }
          ]
        },
        {
          id: '3',
          name: 'Bebidas Especiais',
          products: [
            {
              id: '7',
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
              id: '8',
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
      ];
    default:
      return [];
  }
};

export function useStore() {
  const { user } = useAuth();
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(getUserDefaultConfig('admin'));
  const [categories, setCategories] = useState<Category[]>(getUserDefaultCategories('admin'));
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerSessions, setCustomerSessions] = useState<CustomerSession[]>([]);

  // Carregar configurações específicas do usuário logado
  useEffect(() => {
    if (user) {
      console.log('Carregando configurações para usuário:', user.username);
      
      // Determinar tipo de usuário baseado no username
      const userType = user.username.toLowerCase();
      
      // Carregar configurações padrão baseadas no tipo de usuário
      const defaultConfig = getUserDefaultConfig(userType);
      const defaultCategories = getUserDefaultCategories(userType);
      
      setStoreConfig(defaultConfig);
      setCategories(defaultCategories);
      
      // Tentar carregar configurações salvas do usuário
      fetch(`/api/user/${user.id}/config`)
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Configurações não encontradas');
        })
        .then(config => {
          console.log('Configurações carregadas do servidor:', config);
          setStoreConfig(config);
        })
        .catch(error => {
          console.log('Usando configurações padrão para:', userType);
          // Manter as configurações padrão já definidas
        });
    }
  }, [user]);

  // Sincronizar com o backend
  useEffect(() => {
    const socket = whatsappService.getSocket();
    if (!socket) return;

    // Receber dados da loja do backend
    socket.on('store-data', (data: any) => {
      console.log('Dados da loja recebidos do backend:', data);
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
      console.log('Sincronizando dados com backend:', data);
      socket.emit('update-store-data', data);
    }
  };

  // Store Config
  const updateStoreConfig = async (config: Partial<StoreConfig>) => {
    if (!user) return;

    try {
      console.log('Atualizando configurações para usuário:', user.id, config);
      
      const response = await fetch(`/api/user/${user.id}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const updatedConfig = await response.json();
        console.log('Configurações atualizadas:', updatedConfig);
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
    setPromotions(prev => {
      const newPromotions = [...prev, newPromotion];
      syncWithBackend({ promotions: newPromotions });
      return newPromotions;
    });
  };

  const updatePromotion = (id: string, updates: Partial<Promotion>) => {
    setPromotions(prev => {
      const newPromotions = prev.map(promo => 
        promo.id === id ? { ...promo, ...updates } : promo
      );
      syncWithBackend({ promotions: newPromotions });
      return newPromotions;
    });
  };

  const deletePromotion = (id: string) => {
    setPromotions(prev => {
      const newPromotions = prev.filter(promo => promo.id !== id);
      syncWithBackend({ promotions: newPromotions });
      return newPromotions;
    });
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