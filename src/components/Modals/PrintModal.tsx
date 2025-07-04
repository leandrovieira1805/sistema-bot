import { X, Printer } from 'lucide-react';
import { Order } from '../../types';

interface PrintModalProps {
  order: Order;
  onClose: () => void;
  storeName: string;
  storeAddress: string;
}

export function PrintModal({ order, onClose, storeName, storeAddress }: PrintModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Comanda do Pedido</h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Printer size={16} />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 print:p-4" id="print-content">
          <div className="text-center mb-6 print:mb-4">
            <h1 className="text-2xl font-bold text-gray-800 print:text-xl">{storeName}</h1>
            <p className="text-gray-600 print:text-sm">{storeAddress}</p>
            <div className="mt-4 print:mt-2">
              <h2 className="text-xl font-semibold text-gray-800 print:text-lg">COMANDA DE PEDIDO</h2>
              <p className="text-gray-600 print:text-sm">#{order.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4 mb-6 print:mb-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2 print:text-sm">Dados do Cliente</h3>
              <p className="text-gray-600 print:text-xs">
                <strong>Nome:</strong> {order.customerName || 'Não informado'}
              </p>
              <p className="text-gray-600 print:text-xs">
                <strong>Telefone:</strong> {order.customerPhone}
              </p>
              <p className="text-gray-600 print:text-xs">
                <strong>Data/Hora:</strong> {order.createdAt.toLocaleString()}
              </p>
            </div>

            {order.address && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 print:text-sm">Endereço de Entrega</h3>
                <p className="text-gray-600 text-sm print:text-xs">{order.address}</p>
              </div>
            )}
          </div>

          <div className="mb-6 print:mb-4">
            <h3 className="font-semibold text-gray-800 mb-3 print:text-sm print:mb-2">Itens do Pedido</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden print:border-gray-400">
              <table className="w-full">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 print:text-xs print:px-2 print:py-1">Item</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 print:text-xs print:px-2 print:py-1">Qtd</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 print:text-xs print:px-2 print:py-1">Preço Unit.</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 print:text-xs print:px-2 print:py-1">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-800 print:text-xs print:px-2 print:py-1">
                        {item.product.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800 text-center print:text-xs print:px-2 print:py-1">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800 text-right print:text-xs print:px-2 print:py-1">
                        R$ {item.product.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800 text-right font-medium print:text-xs print:px-2 print:py-1">
                        R$ {(item.product.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 print:pt-2">
            <div className="space-y-2 print:space-y-1">
              <div className="flex justify-between text-sm text-gray-600 print:text-xs">
                <span>Subtotal dos Produtos:</span>
                <span>R$ {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 print:text-xs">
                <span>Taxa de Entrega:</span>
                <span>R$ {order.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-800 border-t border-gray-200 pt-2 print:text-sm print:pt-1">
                <span>Total do Pedido:</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 print:mt-4 pt-4 print:pt-2 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 print:text-sm print:mb-1">Forma de Pagamento</h3>
                <p className="text-gray-600 print:text-xs">
                  {order.paymentMethod === 'PIX' ? 'PIX' : 'Dinheiro'}
                </p>
                {order.paymentMethod === 'CASH' && order.cashAmount && (
                  <>
                    <p className="text-gray-600 text-sm print:text-xs">
                      Valor Pago: R$ {order.cashAmount.toFixed(2)}
                    </p>
                    <p className="text-gray-600 text-sm print:text-xs">
                      Troco: R$ {order.change?.toFixed(2)}
                    </p>
                  </>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2 print:text-sm print:mb-1">Status</h3>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium print:text-xs ${
                  order.status === 'NEW' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {order.status === 'NEW' ? 'Novo' :
                   order.status === 'PREPARING' ? 'Em Preparo' : 'Finalizado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}