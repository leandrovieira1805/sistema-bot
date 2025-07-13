import { Printer, Clock, CheckCircle, Package, MapPin, DollarSign } from 'lucide-react';
import { Order } from '../../types';

interface OrdersPanelProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: Order['status']) => void;
  onPrint: (order: Order) => void;
}

export function OrdersPanel({ orders, onUpdateStatus, onPrint }: OrdersPanelProps) {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'NEW': return 'bg-yellow-100 text-yellow-800';
      case 'PREPARING': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'NEW': return <Clock size={16} />;
      case 'PREPARING': return <Package size={16} />;
      case 'COMPLETED': return <CheckCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'NEW': return 'Novo';
      case 'PREPARING': return 'Preparando';
      case 'COMPLETED': return 'Finalizado';
      default: return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="text-green-600" size={24} />
          <h3 className="text-xl font-semibold text-gray-800">Pedidos</h3>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
            {orders.length} pedidos
          </span>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    Pedido #{order.id}
                  </h4>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {getStatusText(order.status)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => onUpdateStatus(order.id, e.target.value as Order['status'])}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="NEW">Novo</option>
                    <option value="PREPARING">Preparando</option>
                    <option value="COMPLETED">Finalizado</option>
                  </select>
                  
                  <button
                    onClick={() => onPrint(order)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Printer size={16} />
                    Imprimir
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Cliente</h5>
                  <p className="text-gray-600">{order.customerName || 'Nome não informado'}</p>
                  <p className="text-gray-600">{order.customerPhone}</p>
                  <p className="text-sm text-gray-500">
                    {order.createdAt instanceof Date 
                      ? order.createdAt.toLocaleString() 
                      : new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                {order.address && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <MapPin size={16} />
                      Endereço de Entrega
                    </h5>
                    <p className="text-gray-600 text-sm">{order.address}</p>
                  </div>
                )}

                <div>
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <DollarSign size={16} />
                    Pagamento
                  </h5>
                  <p className="text-gray-600">
                    {order.paymentMethod === 'PIX' ? 'PIX' : 
                     order.paymentMethod === 'CASH' ? 'Dinheiro' : 'Cartão'}
                  </p>
                  {order.paymentMethod === 'CASH' && order.cashAmount && (
                    <>
                      <p className="text-sm text-gray-500">Valor pago: R$ {order.cashAmount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Troco: R$ {order.change?.toFixed(2)}</p>
                    </>
                  )}
                  {order.deliveryType && (
                    <p className="text-sm text-gray-500">
                      Tipo: {order.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">Itens do Pedido</h5>
                <div className="bg-gray-50 rounded-lg p-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <span className="text-gray-700">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="font-medium text-gray-800">
                        R$ {(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Subtotal:</span>
                      <span>R$ {order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Taxa de entrega:</span>
                      <span>R$ {order.deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-800">
                      <span>Total:</span>
                      <span>R$ {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum pedido recebido ainda.</p>
            <p className="text-sm">Os pedidos do WhatsApp aparecerão aqui automaticamente!</p>
          </div>
        )}
      </div>
    </div>
  );
}