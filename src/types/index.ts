export interface StoreConfig {
  name: string;
  greeting: string;
  deliveryFee: number;
  pixKey: string;
  address: string;
  menuImage: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  image: string;
  active: boolean;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName?: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address?: string;
  paymentMethod: 'PIX' | 'CASH';
  cashAmount?: number;
  change?: number;
  status: 'NEW' | 'PREPARING' | 'COMPLETED';
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  type: 'customer' | 'bot';
  content: string;
  image?: string;
  timestamp: Date;
}

export interface CustomerSession {
  phone: string;
  cart: OrderItem[];
  step: 'greeting' | 'menu' | 'ordering' | 'address' | 'payment' | 'completed';
  customerData?: {
    name?: string;
    address?: string;
    paymentMethod?: 'PIX' | 'CASH';
    cashAmount?: number;
  };
  messages: ChatMessage[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // Será hasheada
  storeConfig: StoreConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}