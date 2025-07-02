import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { StoreSettings } from './components/Dashboard/StoreSettings';
import { CategoryManager } from './components/Dashboard/CategoryManager';
import { ProductManager } from './components/Dashboard/ProductManager';
import { PromotionManager } from './components/Dashboard/PromotionManager';
import { OrdersPanel } from './components/Dashboard/OrdersPanel';
import { WhatsAppBot } from './components/Bot/WhatsAppBot';
import { PrintModal } from './components/Modals/PrintModal';
import { WhatsAppModal } from './components/Modals/WhatsAppModal';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { useStore } from './hooks/useStore';
import { Category, Order, OrderItem } from './types';
import { initializeWhatsApp, getWhatsAppClient } from './services/whatsappService';
import { whatsappService } from './services/whatsappService';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [botConnected, setBotConnected] = useState(false);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const {
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
  } = useStore();

  useEffect(() => {
    function initIfConnected() {
      initializeWhatsApp(
        undefined,
        () => {
          setBotConnected(true);
          setShowWhatsAppModal(false);
        },
        () => {
          setBotConnected(false);
          setShowWhatsAppModal(true);
        }
      );
    }

    const socket = whatsappService.getSocket && whatsappService.getSocket();
    if (socket && socket.connected) {
      initIfConnected();
    } else if (socket) {
      socket.on('connect', () => {
        initIfConnected();
      });
    } else {
      // fallback: tenta inicializar normalmente
      initIfConnected();
    }
  }, []);

  const handleOpenWhatsAppSettings = () => {
    setShowWhatsAppModal(true);
  };

  const handleWhatsAppConnectionChange = (connected: boolean) => {
    setBotConnected(connected);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'categories': return 'Gestão de Categorias';
      case 'products': return selectedCategory ? `Produtos - ${selectedCategory.name}` : 'Produtos';
      case 'promotions': return 'Promoções';
      case 'orders': return 'Pedidos';
      case 'bot': return 'Simulador Bot WhatsApp';
      case 'settings': return 'Configurações da Loja';
      default: return 'Dashboard';
    }
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setActiveTab('products');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setActiveTab('categories');
  };

  const handleCreateOrder = (sessionPhone: string) => {
    const session = customerSessions.find(s => s.phone === sessionPhone);
    if (!session || session.cart.length === 0) return;

    const subtotal = session.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const total = subtotal + storeConfig.deliveryFee;
    const change = session.customerData?.cashAmount ? session.customerData.cashAmount - total : undefined;

    const newOrder: Omit<Order, 'id' | 'createdAt'> = {
      customerName: session.customerData?.name,
      customerPhone: session.phone,
      items: session.cart,
      subtotal,
      deliveryFee: storeConfig.deliveryFee,
      total,
      address: session.customerData?.address,
      paymentMethod: session.customerData?.paymentMethod || 'PIX',
      cashAmount: session.customerData?.cashAmount,
      change,
      status: 'NEW'
    };

    addOrder(newOrder);
  };

  const handlePrintOrder = (order: Order) => {
    setPrintOrder(order);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard orders={orders} categories={categories} />;
      
      case 'categories':
        return (
          <CategoryManager
            categories={categories}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
            onSelectCategory={handleSelectCategory}
          />
        );
      
      case 'products':
        return selectedCategory ? (
          <ProductManager
            category={selectedCategory}
            onBack={handleBackToCategories}
            onAddProduct={addProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
          />
        ) : (
          <CategoryManager
            categories={categories}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
            onSelectCategory={handleSelectCategory}
          />
        );
      
      case 'promotions':
        return (
          <PromotionManager
            promotions={promotions}
            onAddPromotion={addPromotion}
            onUpdatePromotion={updatePromotion}
            onDeletePromotion={deletePromotion}
          />
        );
      
      case 'orders':
        return (
          <OrdersPanel
            orders={orders}
            onUpdateStatus={updateOrderStatus}
            onPrint={handlePrintOrder}
          />
        );
      
      case 'bot':
        return (
          <WhatsAppBot
            storeConfig={storeConfig}
            products={getAllProducts()}
            promotions={promotions}
            sessions={customerSessions}
            onUpdateSession={updateSession}
            onCreateOrder={handleCreateOrder}
          />
        );
      
      case 'settings':
        return (
          <StoreSettings
            config={storeConfig}
            onUpdateConfig={updateStoreConfig}
            onOpenWhatsAppSettings={handleOpenWhatsAppSettings}
          />
        );
      
      default:
        return <Dashboard orders={orders} categories={categories} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={getPageTitle()} 
          botConnected={botConnected}
          onWhatsAppConnectionChange={handleWhatsAppConnectionChange}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {renderContent()}
        </main>
      </div>

      {printOrder && (
        <PrintModal
          order={printOrder}
          onClose={() => setPrintOrder(null)}
        />
      )}

      {showWhatsAppModal && (
        <WhatsAppModal
          onClose={() => setShowWhatsAppModal(false)}
          onConnectionChange={handleWhatsAppConnectionChange}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;