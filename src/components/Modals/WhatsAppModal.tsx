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
  const [isProcessingConnection, setIsProcessingConnection] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const isMountedRef = useRef(true);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setIsProcessingConnection(false);
      setIsConnecting(false);
    }
  }, [isOpen]);

  const safeSetState = (setter: (value: any) => void, value: any) => {
    if (isMountedRef.current) {
      setter(value);
    }
  };

  const handleClose = () => {
    if (isClosing || isProcessingConnection || isConnecting) return;
    
    safeSetState(setIsClosing, true);
    
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    
    closeTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        onClose();
        safeSetState(setIsClosing, false);
      }
    }, 1000);
  };

  // Não renderizar nada se estiver fechando ou conectando
  if (!isOpen || isClosing || isConnecting) {
    return null;
  }

  const handleQRCode = (qr: string) => {
    safeSetState(setQrCode, qr);
  };

  const handleConnectionChange = (connected: boolean) => {
    if (isProcessingConnection || isConnecting) return;
    
    safeSetState(setIsProcessingConnection, true);
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    
    connectionTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        onConnectionChange(connected);
        
        if (connected) {
          // Desabilitar completamente o modal durante conexão
          safeSetState(setIsConnecting, true);
          safeSetState(setQrCode, null);
          
          // Fechar o modal após um delay maior
          setTimeout(() => {
            if (isMountedRef.current) {
              handleClose();
            }
          }, 2000); // Delay muito maior
        }
        
        safeSetState(setIsProcessingConnection, false);
      }
    }, 500); // Delay maior para processamento
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">Configuração WhatsApp</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isClosing || isProcessingConnection || isConnecting}
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