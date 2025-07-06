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
      console.log('Carregando configurações para usuário:', user.email);
      
      // Definir usuário atual no socket
      const socket = whatsappService.getSocket();
      if (socket) {
        socket.emit('set-current-user', user.id);
      }
      
      // Carregar configurações específicas do usuário
      fetch(`/api/user/${user.id}/config`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(config => {
          console.log('Configurações carregadas do servidor:', config);
          setStoreConfig(config);
        })
        .catch(error => {
          console.error('Erro ao carregar configurações do usuário:', error);
          // Usar configurações padrão se não conseguir carregar
          setStoreConfig(defaultStoreConfig);
        });

      // Carregar categorias do usuário
      fetch(`/api/user/${user.id}/categories`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(categoriesData => {
          console.log('Categorias carregadas do servidor:', categoriesData);
          setCategories(categoriesData);
        })
        .catch(error => {
          console.error('Erro ao carregar categorias do usuário:', error);
          // Usar categorias padrão se não conseguir carregar
          setCategories(sampleCategories);
        });

      // Carregar promoções do usuário
      fetch(`/api/user/${user.id}/promotions`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(promotionsData => {
          console.log('Promoções carregadas do servidor:', promotionsData);
          setPromotions(promotionsData);
        })
        .catch(error => {
          console.error('Erro ao carregar promoções do usuário:', error);
          setPromotions([]);
        });

      // Carregar pedidos do usuário
      fetch(`/api/user/${user.id}/orders`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(ordersData => {
          console.log('Pedidos carregados do servidor:', ordersData);
          setOrders(ordersData);
        })
        .catch(error => {
          console.error('Erro ao carregar pedidos do usuário:', error);
          setOrders([]);
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
    console.log('=== SINCRONIZANDO COM BACKEND ===');
    console.log('Dados sendo enviados:', JSON.stringify(data, null, 2));
    
    const socket = whatsappService.getSocket();
    if (socket) {
      console.log('Socket encontrado, enviando dados...');
      socket.emit('update-store-data', data);
      console.log('Dados enviados com sucesso!');
    } else {
      console.log('ERRO: Socket não encontrado!');
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
      } else {
        console.error('Erro ao atualizar configurações:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
    }
  };

  // Categories and Products
  const addCategory = async (name: string) => {
    if (!user) return;

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

    // Salvar no backend
    try {
      const response = await fetch(`/api/user/${user.id}/categories`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...categories, newCategory]),
      });

      if (!response.ok) {
        console.error('Erro ao salvar categoria:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    }
  };

  const updateCategory = async (id: string, name: string) => {
    if (!user) return;

    setCategories(prev => {
      const newCategories = prev.map(cat => 
        cat.id === id ? { ...cat, name } : cat
      );
      syncWithBackend({ categories: newCategories });
      return newCategories;
    });

    // Salvar no backend
    try {
      const response = await fetch(`/api/user/${user.id}/categories`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categories.map(cat => 
          cat.id === id ? { ...cat, name } : cat
        )),
      });

      if (!response.ok) {
        console.error('Erro ao atualizar categoria:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;

    setCategories(prev => {
      const newCategories = prev.filter(cat => cat.id !== id);
      syncWithBackend({ categories: newCategories });
      return newCategories;
    });

    // Salvar no backend
    try {
      const response = await fetch(`/api/user/${user.id}/categories`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categories.filter(cat => cat.id !== id)),
      });

      if (!response.ok) {
        console.error('Erro ao deletar categoria:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
    }
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
        messages: [],
        customerData: {
            name: undefined,
            address: undefined,
            street: undefined,
            number: undefined,
            district: undefined,
            city: undefined,
            reference: undefined,
            deliveryType: undefined,
            paymentMethod: undefined,
            cashAmount: undefined,
            change: undefined
        }
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