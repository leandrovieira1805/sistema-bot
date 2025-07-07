import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { StoreSettings } from './components/Dashboard/StoreSettings';
import { CategoryManager } from './components/Dashboard/CategoryManager';
import { ProductManager } from './components/Dashboard/ProductManager';
import { MenuManager } from './components/Dashboard/MenuManager';
import { PromotionManager } from './components/Dashboard/PromotionManager';
import { OrdersPanel } from './components/Dashboard/OrdersPanel';
import { WhatsAppBot } from './components/Bot/WhatsAppBot';
import { AITester } from './components/Dashboard/AITester';
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
  const isMountedRef = useRef(true);

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

  const safeSetState = (setter: (value: any) => void, value: any) => {
    if (isMountedRef.current) {
      setter(value);
    }
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleUpdateMenuImage = (imageUrl: string) => {
    updateStoreConfig({ menuImage: imageUrl });
  };

  useEffect(() => {
    function initIfConnected() {
      initializeWhatsApp(
        undefined,
        () => {
          safeSetState(setBotConnected, true);
          safeSetState(setShowWhatsAppModal, false);
        },
        () => {
          safeSetState(setBotConnected, false);
          safeSetState(setShowWhatsAppModal, true);
        }
      );
    }

    const socket = whatsappService.getSocket && whatsappService.getSocket();
    if (socket && socket.connected) {
      initIfConnected();
    } else if (socket) {
      socket.on('connect', () => {
        if (isMountedRef.current) {
          initIfConnected();
        }
      });
    } else {
      // fallback: tenta inicializar normalmente
      initIfConnected();
    }
  }, []);

  const handleOpenWhatsAppSettings = () => {
    safeSetState(setShowWhatsAppModal, true);
  };

  const handleWhatsAppConnectionChange = (connected: boolean) => {
    safeSetState(setBotConnected, connected);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'menu': return 'Imagem do Cardápio';
      case 'categories': return 'Gestão de Categorias';
      case 'products': return selectedCategory ? `Produtos - ${selectedCategory.name}` : 'Produtos';
      case 'promotions': return 'Promoções';
      case 'orders': return 'Pedidos';
      case 'bot': return 'Simulador Bot WhatsApp';
      case 'ai-tester': return 'Testador de IA';
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
    const isDelivery = session.customerData?.deliveryType === 'delivery';
    const deliveryFee = isDelivery ? storeConfig.deliveryFee : 0;
    const total = subtotal + deliveryFee;
    const change = session.customerData?.cashAmount ? session.customerData.cashAmount - total : undefined;

    const newOrder: Omit<Order, 'id' | 'createdAt'> = {
      customerName: session.customerData?.name,
      customerPhone: session.phone,
      items: session.cart,
      subtotal,
      deliveryFee,
      total,
      address: session.customerData?.address,
      deliveryType: session.customerData?.deliveryType,
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
        return <Dashboard orders={orders} categories={categories} onTabChange={setActiveTab} />;
      
      case 'menu':
        return (
          <MenuManager
            menuImage={storeConfig.menuImage}
            onUpdateMenuImage={handleUpdateMenuImage}
          />
        );
      
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
      
      case 'ai-tester':
        return (
          <AITester
            onBack={() => setActiveTab('dashboard')}
          />
        );
      
      case 'settings':
        return (
          <StoreSettings
            config={storeConfig}
            onUpdate={updateStoreConfig}
          />
        );
      
      default:
        return <Dashboard orders={orders} categories={categories} onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'bot' && !showWhatsAppModal) {
            setTimeout(() => {
              if (isMountedRef.current) {
                setShowWhatsAppModal(true);
              }
            }, 100);
          }
        }}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={getPageTitle()}
          botConnected={botConnected}
          onWhatsAppConnectionChange={handleWhatsAppConnectionChange}
          onOpenWhatsAppSettings={handleOpenWhatsAppSettings}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {renderContent()}
        </main>
      </div>

      {printOrder && (
        <PrintModal
          order={printOrder}
          onClose={() => setPrintOrder(null)}
          storeName={storeConfig.name}
          storeAddress={storeConfig.address}
        />
      )}

      {showWhatsAppModal && (
        <WhatsAppModal
          key={`whatsapp-modal-${Date.now()}`}
          isOpen={showWhatsAppModal}
          onClose={() => {
            if (isMountedRef.current) {
              setShowWhatsAppModal(false);
            }
          }}
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