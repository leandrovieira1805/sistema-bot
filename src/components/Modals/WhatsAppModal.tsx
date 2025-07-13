import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const isMountedRef = useRef(true);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Criar container para o portal
    const container = document.createElement('div');
    container.id = 'whatsapp-modal-portal';
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      isMountedRef.current = false;
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      // Limpar container do portal
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
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

  const handleQRCode = (qr: string) => {
    console.log('=== WHATSAPP MODAL: handleQRCode ===');
    console.log('QR Code recebido no modal, tamanho:', qr?.length || 0);
    safeSetState(setQrCode, qr);
  };

  const handleConnectionChange = (connected: boolean) => {
    console.log('=== WHATSAPP MODAL: handleConnectionChange ===');
    console.log('Status de conexão:', connected);
    
    if (isProcessingConnection || isConnecting) return;
    
    safeSetState(setIsProcessingConnection, true);
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    
    connectionTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        console.log('Executando onConnectionChange com:', connected);
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
          }, 2000);
        }
        
        safeSetState(setIsProcessingConnection, false);
      }
    }, 500);
  };

  // Não renderizar nada se não estiver aberto ou se estiver fechando/conectando
  if (!isOpen || isClosing || isConnecting || !portalContainer) {
    return null;
  }

  // Conteúdo do modal
  const modalContent = (
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

  // Renderizar usando portal para isolar completamente do resto da aplicação
  return createPortal(modalContent, portalContainer);
}