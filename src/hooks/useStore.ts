import { useState, useEffect } from 'react';
import { StoreConfig, Category, Promotion, Order, CustomerSession, Product } from '../types';
import { whatsappService } from '../services/whatsappService';

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
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(defaultStoreConfig);
  const [categories, setCategories] = useState<Category[]>(sampleCategories);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerSessions, setCustomerSessions] = useState<CustomerSession[]>([]);

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
    const newConfig = { ...storeConfig, ...config };
    setStoreConfig(newConfig);
    syncWithBackend({ config: newConfig });
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
    syncWithBackend({ categories: newCategories });
  };

  const updateCategory = async (id: string, name: string) => {
    const newCategories = categories.map((cat: Category) => 
      cat.id === id ? { ...cat, name } : cat
    );
    setCategories(newCategories);
    syncWithBackend({ categories: newCategories });
  };

  const deleteCategory = async (id: string) => {
    const newCategories = categories.filter((cat: Category) => cat.id !== id);
    setCategories(newCategories);
    syncWithBackend({ categories: newCategories });
  };

  // Products
  const addProduct = (categoryId: string, product: Omit<Product, 'id'>) => {
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
    syncWithBackend({ categories: newCategories });
  };

  const updateProduct = (categoryId: string, productId: string, updates: Partial<Product>) => {
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
    syncWithBackend({ categories: newCategories });
  };

  const deleteProduct = (categoryId: string, productId: string) => {
    const newCategories = categories.map((cat: Category) => 
      cat.id === categoryId 
        ? { ...cat, products: cat.products.filter((prod: Product) => prod.id !== productId) }
        : cat
    );
    setCategories(newCategories);
    syncWithBackend({ categories: newCategories });
  };

  // Promotions
  const addPromotion = (promotion: Omit<Promotion, 'id'>) => {
    const newPromotion: Promotion = { ...promotion, id: Date.now().toString() };
    const newPromotions = [...promotions, newPromotion];
    setPromotions(newPromotions);
    syncWithBackend({ promotions: newPromotions });
  };

  const updatePromotion = (id: string, updates: Partial<Promotion>) => {
    const newPromotions = promotions.map((promo: Promotion) => 
      promo.id === id ? { ...promo, ...updates } : promo
    );
    setPromotions(newPromotions);
    syncWithBackend({ promotions: newPromotions });
  };

  const deletePromotion = (id: string) => {
    const newPromotions = promotions.filter((promo: Promotion) => promo.id !== id);
    setPromotions(newPromotions);
    syncWithBackend({ promotions: newPromotions });
  };

  // Orders
  const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = { ...order, id: Date.now().toString(), createdAt: new Date() };
    const newOrders = [newOrder, ...orders];
    setOrders(newOrders);
    syncWithBackend({ orders: newOrders });
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    const newOrders = orders.map((order: Order) => 
      order.id === id ? { ...order, status } : order
    );
    setOrders(newOrders);
    syncWithBackend({ orders: newOrders });
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
    setCustomerSessions((prev: CustomerSession[]) => 
      prev.map((session: CustomerSession) => 
        session.phone === phone 
          ? { ...session, ...updates, lastActivity: new Date() }
          : session
      )
    );
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
    getAllProducts
  };
}