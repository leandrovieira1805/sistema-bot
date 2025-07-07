import { useState, useEffect, useRef } from 'react';
import { QrCode, Smartphone, X, CheckCircle, RefreshCw } from 'lucide-react';
import { initializeWhatsApp, disconnectWhatsApp } from '../../services/whatsappService';

interface WhatsAppConnectionProps {
  onConnectionChange: (connected: boolean) => void;
  onQRCode: (qr: string) => void;
}

export function WhatsAppConnection({ onConnectionChange, onQRCode }: WhatsAppConnectionProps) {
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(true);
  const isMountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Delay para garantir que o componente está totalmente montado
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setIsRendering(false);
      }
    }, 100);

    return () => {
      isMountedRef.current = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      clearTimeout(timer);
    };
  }, []);

  const safeSetState = (setter: (value: any) => void, value: any) => {
    if (isMountedRef.current && !isRendering) {
      setter(value);
    }
  };

  const handleGenerateQR = async () => {
    if (isRendering) return; // Não executar durante renderização
    
    safeSetState(setError, '');
    safeSetState(setQrCodeData, '');
    safeSetState(setIsConnected, false);
    safeSetState(setIsLoading, true);
    
    // Delay para evitar conflitos de estado
    initTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        initializeWhatsApp(
          (qr: string) => {
            if (isMountedRef.current && !isRendering) {
              // Delay adicional para o callback onQR
              setTimeout(() => {
                if (isMountedRef.current && !isRendering) {
                  safeSetState(setQrCodeData, qr);
                  safeSetState(setIsLoading, false);
                  onQRCode(qr);
                }
              }, 50);
            }
          },
          () => {
            if (isMountedRef.current && !isRendering) {
              // Delay maior para o callback onReady (onde o erro acontece)
              setTimeout(() => {
                if (isMountedRef.current && !isRendering) {
                  console.log('Executando callback onReady com proteção...');
                  safeSetState(setQrCodeData, '');
                  safeSetState(setIsConnected, true);
                  safeSetState(setIsLoading, false);
                  onConnectionChange(true);
                  console.log('Callback onReady executado com sucesso');
                }
              }, 150);
            }
          },
          () => {
            if (isMountedRef.current && !isRendering) {
              // Delay para o callback onDisconnected
              setTimeout(() => {
                if (isMountedRef.current && !isRendering) {
                  safeSetState(setQrCodeData, '');
                  safeSetState(setIsConnected, false);
                  safeSetState(setIsLoading, false);
                  onConnectionChange(false);
                }
              }, 50);
            }
          },
          undefined,
          (error: string) => {
            if (isMountedRef.current && !isRendering) {
              // Delay para o callback onError
              setTimeout(() => {
                if (isMountedRef.current && !isRendering) {
                  safeSetState(setError, error);
                  safeSetState(setIsConnected, false);
                  safeSetState(setIsLoading, false);
                }
              }, 50);
            }
          }
        );
      }
    }, 200);
  };

  const handleCloseQR = () => {
    if (isRendering) return;
    
    safeSetState(setQrCodeData, '');
    safeSetState(setError, '');
    safeSetState(setIsConnected, false);
    safeSetState(setIsLoading, false);
    disconnectWhatsApp();
  };

  const handleDisconnect = () => {
    if (isRendering) return;
    
    safeSetState(setIsConnected, false);
    disconnectWhatsApp();
    onConnectionChange(false);
  };

  // Não renderizar durante a inicialização
  if (isRendering) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 min-h-[400px] flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 mb-6">
          <Smartphone className="text-green-600" size={24} />
          <h3 className="text-xl font-semibold text-gray-800">Conexão WhatsApp</h3>
        </div>
        <div className="flex flex-col items-center">
          <RefreshCw size={64} className="mx-auto text-gray-400 mb-4 animate-spin" />
          <h4 className="text-lg font-medium text-gray-800 mb-2">
            Inicializando...
          </h4>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 min-h-[400px] flex flex-col items-center justify-center">
      {/* Banner de sucesso quando conectado */}
      {isConnected && (
        <div className="w-full mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-lg text-center flex items-center justify-center gap-2">
          <CheckCircle size={20} className="text-green-600" />
          <span>WhatsApp conectado com sucesso!</span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Smartphone className="text-green-600" size={24} />
        <h3 className="text-xl font-semibold text-gray-800">Conexão WhatsApp</h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Renderização condicional com proteção */}
      {(() => {
        if (isConnected) {
          return (
            <div className="flex flex-col items-center">
              <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                WhatsApp Conectado!
              </h4>
              <p className="text-gray-600 text-sm">
                Seu bot está pronto para receber pedidos via WhatsApp
              </p>
              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={handleDisconnect}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Desconectar
                </button>
                <button
                  onClick={handleGenerateQR}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Reconectar
                </button>
              </div>
            </div>
          );
        } else if (isLoading) {
          return (
            <div className="flex flex-col items-center">
              <div className="w-[300px] h-[300px] flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg mb-4">
                <RefreshCw size={80} className="text-gray-400 animate-spin" />
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Aguarde, gerando QR Code...
              </h4>
            </div>
          );
        } else if (qrCodeData) {
          return (
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-lg mb-4">
                <img 
                  src={qrCodeData} 
                  alt="QR Code WhatsApp" 
                  className="w-[300px] h-[300px] object-contain"
                />
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Escaneie o QR Code com o app do WhatsApp
              </h4>
              <div className="space-y-1 text-sm text-gray-600 mb-4 max-w-sm mx-auto">
                <p>1. Abra o WhatsApp no seu celular</p>
                <p>2. Toque em <strong>Menu</strong> ou <strong>Configurações</strong></p>
                <p>3. Toque em <strong>Aparelhos conectados</strong></p>
                <p>4. Toque em <strong>Conectar um aparelho</strong></p>
                <p>5. Aponte seu celular para esta tela para capturar o código</p>
              </div>
              <button
                onClick={handleCloseQR}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Cancelar
              </button>
            </div>
          );
        } else {
          return (
            <div className="flex flex-col items-center">
              <QrCode size={64} className="mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Conectar WhatsApp Web
              </h4>
              <p className="text-gray-600 text-sm mb-6">
                Clique no botão abaixo para gerar um QR Code e conectar seu WhatsApp
              </p>
              <button
                onClick={handleGenerateQR}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <QrCode size={20} />
                Gerar QR Code
              </button>
            </div>
          );
        }
      })()}
    </div>
  );
}