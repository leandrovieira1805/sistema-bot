import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { WhatsAppConnection } from '../WhatsApp/WhatsAppConnection';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange: (connected: boolean) => void;
}

export function WhatsAppModal({ isOpen, onClose, onConnectionChange }: WhatsAppModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const isMountedRef = useRef(true);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Reset closing state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const safeSetState = (setter: (value: any) => void, value: any) => {
    if (isMountedRef.current) {
      setter(value);
    }
  };

  const handleClose = () => {
    if (isClosing) return; // Evita múltiplos fechamentos
    
    safeSetState(setIsClosing, true);
    
    // Limpar timeout anterior se existir
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    
    // Delay maior para evitar erro de DOM
    closeTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        onClose();
        safeSetState(setIsClosing, false);
      }
    }, 500); // Aumentado para 500ms
  };

  if (!isOpen || isClosing) return null;

  const handleQRCode = (qr: string) => {
    safeSetState(setQrCode, qr);
  };

  const handleConnectionChange = (connected: boolean) => {
    onConnectionChange(connected);
    if (connected) {
      safeSetState(setQrCode, null);
      // Delay maior para conexão bem-sucedida
      setTimeout(() => {
        if (isMountedRef.current) {
          handleClose();
        }
      }, 800); // Aumentado para 800ms
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">Configuração WhatsApp</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isClosing}
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