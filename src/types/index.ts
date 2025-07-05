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
  unit?: 'unit' | 'pack' | 'box'; // unidade, fardo, caixa
  unitLabel?: string; // "unidade", "fardo", "caixa"
  packSize?: number; // quantidade no fardo/caixa
  packPrice?: number; // preço do fardo/caixa
  unitPrice?: number; // preço da unidade
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
  deliveryType?: 'delivery' | 'pickup';
  paymentMethod: 'PIX' | 'CASH' | 'CARD';
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
  step: 'greeting' | 'menu' | 'ordering' | 'delivery_type' | 'address_street' | 'address_number' | 'address_district' | 'address_city' | 'address_reference' | 'customer_name' | 'payment_method' | 'cash_amount' | 'waiting_pix_proof' | 'completed';
  messages: ChatMessage[];
  customerData: {
    name?: string;
    address?: string;
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    reference?: string;
    deliveryType?: 'delivery' | 'pickup';
    paymentMethod?: 'PIX' | 'CASH' | 'CARD';
    cashAmount?: number;
    change?: number;
  };
  suggestions?: string[];
}

export interface User {
  id: string;
  email: string;
  password?: string; // Não expor senha no frontend
  storeConfig: StoreConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}