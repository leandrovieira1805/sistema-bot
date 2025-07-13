import React, { useState } from 'react';
import { 
  ShoppingBag, 
  DollarSign, 
  Users, 
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  Store,
  Truck,
  MessageCircle
} from 'lucide-react';
import { Order, Category, StoreConfig } from '../../types';
import { WhatsAppConnection } from '../WhatsApp/WhatsAppConnection';

interface DashboardProps {
  orders: Order[];
  categories: Category[];
  storeConfig: StoreConfig;
  onTabChange: (tab: string) => void;
  onOpenWhatsAppSettings?: () => void;
}

export function Dashboard({ orders, categories, storeConfig, onTabChange, onOpenWhatsAppSettings }: DashboardProps) {
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalProducts = categories.reduce((sum, category) => sum + category.products.length, 0);
  const todayOrders = orders.filter(order => {
    const today = new Date();
    const orderDate = new Date(order.createdAt);
    return orderDate.toDateString() === today.toDateString();
  });

  const newOrders = orders.filter(order => order.status === 'NEW').length;
  const preparingOrders = orders.filter(order => order.status === 'PREPARING').length;
  const completedOrders = orders.filter(order => order.status === 'COMPLETED').length;

  const businessInfo = { 
    type: 'loja', 
    name: storeConfig?.name || 'Sistema Bot WhatsApp' 
  };

  const stats = [
    {
      title: 'Pedidos Hoje',
      value: todayOrders.length,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Receita Total',
      value: `R$ ${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: businessInfo.type === 'distribuidora' ? 'Produtos/Fardos' : 'Produtos Ativos',
      value: totalProducts,
      icon: Package,
      color: 'bg-purple-500',
      change: '+2'
    },
    {
      title: 'Ticket Médio',
      value: orders.length > 0 ? `R$ ${(totalRevenue / orders.length).toFixed(2)}` : 'R$ 0,00',
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+5%'
    }
  ];

  const orderStatusStats = [
    {
      title: 'Novos',
      value: newOrders,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Preparando',
      value: preparingOrders,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Finalizados',
      value: completedOrders,
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header do Dashboard */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4">
          {businessInfo.type === 'pizzaria' ? (
            <Store className="text-red-500" size={32} />
          ) : businessInfo.type === 'distribuidora' ? (
            <Truck className="text-blue-500" size={32} />
          ) : (
            <Store className="text-gray-500" size={32} />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{businessInfo.name}</h1>
            <p className="text-gray-600">
              {businessInfo.type === 'pizzaria' && 'Sistema de pedidos para pizzaria'}
              {businessInfo.type === 'distribuidora' && 'Sistema de vendas para distribuidora de bebidas'}
              {businessInfo.type === 'loja' && 'Sistema de pedidos personalizado'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600 font-medium">{stat.change}</p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status dos Pedidos</h3>
          <div className="space-y-4">
            {orderStatusStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className={stat.color} size={20} />
                    <span className="font-medium text-gray-700">{stat.title}</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{stat.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pedidos Recentes</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">#{order.id}</p>
                  <p className="text-sm text-gray-600">{order.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">R$ {order.total.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'NEW' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.status === 'NEW' ? 'Novo' :
                     order.status === 'PREPARING' ? 'Preparando' : 'Finalizado'}
                  </span>
                </div>
              </div>
            ))}
            
            {orders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package size={32} className="mx-auto mb-2 opacity-50" />
                <p>Nenhum pedido ainda</p>
                <p className="text-sm">
                  {businessInfo.type === 'distribuidora' 
                    ? 'Aguardando pedidos de bebidas...' 
                    : 'Aguardando pedidos...'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-green-500 hover:bg-green-50 transition-colors"
            onClick={() => onTabChange('products')}
          >
            <Package className="mx-auto mb-2 text-gray-400" size={24} />
            <p className="text-sm font-medium text-gray-600">
              {businessInfo.type === 'distribuidora' ? 'Adicionar Bebida' : 'Adicionar Produto'}
            </p>
          </button>
          
          <button
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
            onClick={() => onTabChange('orders')}
          >
            <ShoppingBag className="mx-auto mb-2 text-gray-400" size={24} />
            <p className="text-sm font-medium text-gray-600">Ver Pedidos</p>
          </button>
          
          <button
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-purple-500 hover:bg-purple-50 transition-colors"
            onClick={() => onTabChange('bot')}
          >
            <Users className="mx-auto mb-2 text-gray-400" size={24} />
            <p className="text-sm font-medium text-gray-600">Configurar Bot</p>
          </button>
          
          {onOpenWhatsAppSettings && (
            <button
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-green-500 hover:bg-green-50 transition-colors"
              onClick={onOpenWhatsAppSettings}
            >
              <MessageCircle className="mx-auto mb-2 text-gray-400" size={24} />
              <p className="text-sm font-medium text-gray-600">WhatsApp QR Code</p>
            </button>
          )}
          
          <button
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-orange-500 hover:bg-orange-50 transition-colors"
            onClick={() => onTabChange('settings')}
          >
            <Store className="mx-auto mb-2 text-gray-400" size={24} />
            <p className="text-sm font-medium text-gray-600">Configurar Loja</p>
          </button>
        </div>
      </div>

      {/* WhatsApp Connection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="text-green-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">Conexão WhatsApp</h3>
          <div className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
            whatsappConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {whatsappConnected ? 'Conectado' : 'Desconectado'}
          </div>
        </div>
        
        {/* Botão de teste para abrir modal */}
        {onOpenWhatsAppSettings && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm mb-2">
              Para configurar o WhatsApp, clique no botão abaixo:
            </p>
            <button
              onClick={onOpenWhatsAppSettings}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <MessageCircle size={16} />
              Abrir Configuração WhatsApp
            </button>
          </div>
        )}
        
        <WhatsAppConnection 
          onConnectionChange={setWhatsappConnected} 
          onQRCode={setQrCodeData}
        />
      </div>
    </div>
  );
}