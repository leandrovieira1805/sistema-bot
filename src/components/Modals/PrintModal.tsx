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
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Cupom Fiscal</h3>
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

        <div className="p-4 print:p-2" id="print-content">
          {/* Cabeçalho do Cupom */}
          <div className="text-center mb-4 print:mb-2 border-b border-gray-300 pb-2">
            <h1 className="text-lg font-bold text-gray-800 print:text-base">{storeName}</h1>
            <p className="text-xs text-gray-600 print:text-xs">{storeAddress}</p>
            <p className="text-xs text-gray-600 print:text-xs mt-1">
              CNPJ: 00.000.000/0001-00
            </p>
            <p className="text-xs text-gray-600 print:text-xs">
              IE: 000.000.000.000
            </p>
          </div>

          {/* Informações do Pedido */}
          <div className="mb-4 print:mb-2">
            <div className="text-center mb-2">
              <h2 className="text-sm font-bold text-gray-800 print:text-xs">CUPOM NÃO FISCAL</h2>
              <p className="text-xs text-gray-600 print:text-xs">#{order.id}</p>
            </div>

            <div className="text-xs text-gray-600 print:text-xs space-y-1">
              <p><strong>Data:</strong> {order.createdAt instanceof Date 
                ? order.createdAt.toLocaleDateString() 
                : new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Hora:</strong> {order.createdAt instanceof Date 
                ? order.createdAt.toLocaleTimeString() 
                : new Date(order.createdAt).toLocaleTimeString()}</p>
              <p><strong>Cliente:</strong> {order.customerName || 'Não informado'}</p>
              <p><strong>Telefone:</strong> {order.customerPhone}</p>
              <p><strong>Tipo:</strong> {order.deliveryType === 'delivery' ? 'ENTREGA' : 'RETIRADA'}</p>
              </div>
          </div>

          {/* Endereço (se for entrega) */}
          {order.deliveryType === 'delivery' && order.address && (
            <div className="mb-4 print:mb-2 border-t border-gray-300 pt-2">
              <h3 className="text-xs font-bold text-gray-800 print:text-xs mb-1">ENDEREÇO DE ENTREGA</h3>
              <p className="text-xs text-gray-600 print:text-xs">{order.address}</p>
            </div>
          )}

          {/* Itens do Pedido */}
          <div className="mb-4 print:mb-2 border-t border-gray-300 pt-2">
            <h3 className="text-xs font-bold text-gray-800 print:text-xs mb-2">ITENS DO PEDIDO</h3>
            <div className="space-y-1">
                  {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-xs print:text-xs">
                  <span className="flex-1">
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="font-medium">
                        R$ {(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
                  ))}
            </div>
          </div>

          {/* Totais */}
          <div className="mb-4 print:mb-2 border-t border-gray-300 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs print:text-xs">
                <span>Subtotal:</span>
                <span>R$ {order.subtotal.toFixed(2)}</span>
              </div>
              {order.deliveryType === 'delivery' && (
                <div className="flex justify-between text-xs print:text-xs">
                <span>Taxa de Entrega:</span>
                <span>R$ {order.deliveryFee.toFixed(2)}</span>
              </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-800 print:text-xs border-t border-gray-300 pt-1">
                <span>TOTAL:</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="mb-4 print:mb-2 border-t border-gray-300 pt-2">
            <h3 className="text-xs font-bold text-gray-800 print:text-xs mb-1">FORMA DE PAGAMENTO</h3>
            <div className="text-xs text-gray-600 print:text-xs space-y-1">
              <p>
                {order.paymentMethod === 'PIX' ? 'PIX' : 
                 order.paymentMethod === 'CASH' ? 'DINHEIRO' : 'CARTÃO'}
                </p>
                {order.paymentMethod === 'CASH' && order.cashAmount && (
                  <>
                  <p>Valor Pago: R$ {order.cashAmount.toFixed(2)}</p>
                  <p>Troco: R$ {order.change?.toFixed(2)}</p>
                  </>
                )}
            </div>
              </div>

          {/* Status */}
          <div className="mb-4 print:mb-2 border-t border-gray-300 pt-2">
            <h3 className="text-xs font-bold text-gray-800 print:text-xs mb-1">STATUS</h3>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium print:text-xs ${
                  order.status === 'NEW' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
              {order.status === 'NEW' ? 'NOVO' :
               order.status === 'PREPARING' ? 'EM PREPARO' : 'FINALIZADO'}
                </span>
              </div>

          {/* Rodapé */}
          <div className="text-center border-t border-gray-300 pt-2">
            <p className="text-xs text-gray-600 print:text-xs">
              Obrigado pela preferência!
            </p>
            <p className="text-xs text-gray-600 print:text-xs">
              {storeName}
            </p>
            <p className="text-xs text-gray-600 print:text-xs">
              {storeAddress}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}