import { useState } from 'react';
import { X } from 'lucide-react';
import { WhatsAppConnection } from '../WhatsApp/WhatsAppConnection';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange: (connected: boolean) => void;
}

export function WhatsAppModal({ isOpen, onClose, onConnectionChange }: WhatsAppModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQRCode = (qr: string) => {
    setQrCode(qr); // Salva o QR Code para exibir no modal
  };

  const handleConnectionChange = (connected: boolean) => {
    onConnectionChange(connected);
    if (connected) {
      setQrCode(null);
      setTimeout(onClose, 300); // Delay de 300ms para evitar erro de DOM
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">Configuração WhatsApp</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <WhatsAppConnection 
            onConnectionChange={handleConnectionChange}
            onQRCode={handleQRCode}
          />
          {/* Exibe o QR Code em destaque se existir */}
          {qrCode && (
            <div className="flex flex-col items-center mt-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-lg">
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  className="w-[300px] h-[300px] object-contain"
                />
              </div>
              <p className="mt-4 text-gray-700 text-center max-w-md">
                Escaneie este QR Code com o app do WhatsApp para conectar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}