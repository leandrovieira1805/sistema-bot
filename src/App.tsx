import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
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
import SaveNotification from './components/Layout/SaveNotification';
import { useStore } from './hooks/useStore';
import { Category, Order } from './types';
import { initializeWhatsApp } from './services/whatsappService';
import { whatsappService } from './services/whatsappService';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [botConnected, setBotConnected] = useState(false);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false); // Flag para evitar inicializações duplicadas

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

  // Atualizar título da página com o nome da loja
  useEffect(() => {
    const pageTitle = getPageTitle();
    const storeName = storeConfig?.name || 'Sistema Bot WhatsApp';
    document.title = `${pageTitle} - ${storeName}`;
  }, [activeTab, storeConfig?.name, selectedCategory]);

  const handleUpdateMenuImage = (imageUrl: string) => {
    updateStoreConfig({ menuImage: imageUrl });
  };

  const handleUpdateMenuImages = (images: string[]) => {
    updateStoreConfig({ menuImages: images });
  };

  useEffect(() => {
    // Evitar inicializações duplicadas
    if (hasInitializedRef.current) {
      console.log('WhatsApp já foi inicializado, pulando...');
      return;
    }

    function initIfConnected() {
      console.log('=== APP: Inicializando WhatsApp ===');
      hasInitializedRef.current = true;
      
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
      console.log('Socket já conectado, inicializando WhatsApp...');
      initIfConnected();
    } else if (socket) {
      console.log('Socket existe mas não conectado, aguardando conexão...');
      socket.on('connect', () => {
        console.log('Socket conectou, inicializando WhatsApp...');
        if (isMountedRef.current && !hasInitializedRef.current) {
          initIfConnected();
        }
      });
    } else {
      console.log('Socket não existe, aguardando criação...');
      // Aguardar um pouco para o socket ser criado
      setTimeout(() => {
        if (isMountedRef.current && !hasInitializedRef.current) {
          const retrySocket = whatsappService.getSocket && whatsappService.getSocket();
          if (retrySocket && retrySocket.connected) {
            console.log('Socket criado e conectado, inicializando WhatsApp...');
            initIfConnected();
          } else if (retrySocket) {
            console.log('Socket criado mas não conectado, aguardando...');
            retrySocket.on('connect', () => {
              if (isMountedRef.current && !hasInitializedRef.current) {
                initIfConnected();
              }
            });
          } else {
            console.log('Socket ainda não disponível, tentando inicializar mesmo assim...');
      initIfConnected();
          }
        }
      }, 2000);
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
        return <Dashboard orders={orders} categories={categories} storeConfig={storeConfig} onTabChange={setActiveTab} onOpenWhatsAppSettings={handleOpenWhatsAppSettings} />;
      
      case 'menu':
        return (
          <MenuManager
            menuImage={storeConfig.menuImage}
            menuImages={storeConfig.menuImages}
            onUpdateMenuImage={handleUpdateMenuImage}
            onUpdateMenuImages={handleUpdateMenuImages}
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
        return <Dashboard orders={orders} categories={categories} storeConfig={storeConfig} onTabChange={setActiveTab} />;
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
        <Header onOpenWhatsAppSettings={handleOpenWhatsAppSettings} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {renderContent()}
        </main>
      </div>

      <SaveNotification />

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

export default App;