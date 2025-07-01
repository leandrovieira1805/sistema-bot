
import { X } from 'lucide-react';
import { WhatsAppConnection } from '../WhatsApp/WhatsAppConnection';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange: (connected: boolean) => void;
}

export function WhatsAppModal({ isOpen, onClose, onConnectionChange }: WhatsAppModalProps) {
  if (!isOpen) return null;

  const handleQRCode = (qr: string) => {
    // QR Code gerado - pode ser usado para logs ou outras funcionalidades
    console.log('QR Code gerado:', qr);
  };

  const handleConnectionChange = (connected: boolean) => {
    onConnectionChange(connected);
    if (connected) {
      onClose(); // Fecha o modal automaticamente ao conectar
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Configuração WhatsApp</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <WhatsAppConnection 
            onConnectionChange={handleConnectionChange}
            onQRCode={handleQRCode}
          />
        </div>
      </div>
    </div>
  );
}