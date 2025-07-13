import { useState, useEffect, useRef } from 'react';
import { QrCode, Smartphone, X, CheckCircle, RefreshCw, Search } from 'lucide-react';
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
  const [hasStarted, setHasStarted] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = (setter: (value: any) => void, value: any) => {
    if (isMountedRef.current) {
      setter(value);
    }
  };

  const handleGenerateQR = async () => {
    console.log('=== WHATSAPP CONNECTION: handleGenerateQR ===');
    safeSetState(setError, '');
    safeSetState(setQrCodeData, '');
    safeSetState(setIsConnected, false);
    safeSetState(setIsLoading, true);
    safeSetState(setHasStarted, true);
    
    // Delay reduzido para gerar QR code mais rapidamente
    setTimeout(() => {
      console.log('Chamando initializeWhatsApp...');
    initializeWhatsApp(
      (qr: string) => {
          console.log('=== CALLBACK QR RECEBIDO NO COMPONENTE ===');
          console.log('QR Code recebido, tamanho:', qr?.length || 0);
          console.log('QR Code válido?', !!qr && qr.length > 100);
          console.log('Primeiros 50 chars:', qr?.substring(0, 50) + '...');
          
          if (isMountedRef.current) {
            console.log('Componente ainda montado, atualizando estado...');
          safeSetState(setQrCodeData, qr);
          safeSetState(setIsLoading, false);
          onQRCode(qr);
            console.log('Estado atualizado com sucesso');
          } else {
            console.log('Componente desmontado, ignorando atualização');
        }
      },
      () => {
          console.log('=== CALLBACK READY RECEBIDO NO COMPONENTE ===');
        if (isMountedRef.current) {
          console.log('Callback onReady - apenas notificar, sem manipular DOM');
          // Apenas notificar, sem manipular estados locais
          onConnectionChange(true);
        }
      },
      () => {
          console.log('=== CALLBACK DISCONNECTED RECEBIDO NO COMPONENTE ===');
        if (isMountedRef.current) {
          safeSetState(setQrCodeData, '');
          safeSetState(setIsConnected, false);
          safeSetState(setIsLoading, false);
          onConnectionChange(false);
        }
      },
      (message: any) => {
        if (isMountedRef.current) {
          console.log('=== MENSAGEM RECEBIDA NO FRONTEND ===');
          console.log('De:', message.from);
          console.log('Mensagem:', message.body);
          console.log('Timestamp:', message.timestamp);
          
          // O backend já processa automaticamente as mensagens
          // Este callback é apenas para logging e UI
        }
      },
      (error: string) => {
          console.log('=== CALLBACK ERROR RECEBIDO NO COMPONENTE ===');
          console.log('Erro:', error);
        if (isMountedRef.current) {
          safeSetState(setError, error);
          safeSetState(setIsConnected, false);
          safeSetState(setIsLoading, false);
        }
      }
    );
      console.log('initializeWhatsApp chamado com sucesso');
    }, 300); // Delay reduzido para 300ms - mais rápido!
  };

  const handleCloseQR = () => {
    safeSetState(setQrCodeData, '');
    safeSetState(setError, '');
    safeSetState(setIsConnected, false);
    safeSetState(setIsLoading, false);
    disconnectWhatsApp();
  };

  const handleDisconnect = () => {
    safeSetState(setIsConnected, false);
    disconnectWhatsApp();
    onConnectionChange(false);
  };

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

      {/* Renderização condicional simplificada */}
      {(() => {
        console.log('=== RENDERIZAÇÃO WHATSAPP CONNECTION ===');
        console.log('isConnected:', isConnected);
        console.log('isLoading:', isLoading);
        console.log('hasStarted:', hasStarted);
        console.log('qrCodeData existe:', !!qrCodeData);
        console.log('qrCodeData tamanho:', qrCodeData?.length || 0);
        
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
        } else if (isLoading || hasStarted) {
          console.log('Renderizando loading...');
          return (
            <div className="flex flex-col items-center">
              <div className="w-[300px] h-[300px] flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg mb-4 shadow-lg">
                <div className="flex flex-col items-center">
                  <Search size={80} className="text-green-500 animate-pulse mb-4" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">
                🔍 Procurando QR Code...
              </h4>
              <p className="text-gray-600 text-sm text-center max-w-sm">
                Conectando ao servidor WhatsApp e preparando seu QR Code para conexão
              </p>
              <div className="mt-4 flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Procurando...</span>
              </div>
            </div>
          );
        } else if (qrCodeData) {
          console.log('Renderizando QR Code...');
          return (
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-xl border-2 border-green-200 shadow-xl mb-6">
                <div className="bg-white p-2 rounded-lg shadow-inner">
                <img 
                  src={qrCodeData} 
                  alt="QR Code WhatsApp" 
                  className="w-[300px] h-[300px] object-contain"
                />
              </div>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-3">
                📱 Escaneie o QR Code
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-sm">
                <h5 className="font-semibold text-blue-800 mb-2">📋 Como conectar:</h5>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                    <span>Abra o WhatsApp no seu celular</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                    <span>Toque em <strong>Menu</strong> ou <strong>Configurações</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                    <span>Toque em <strong>Aparelhos conectados</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
                    <span>Toque em <strong>Conectar um aparelho</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">5</span>
                    <span>Aponte seu celular para esta tela</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateQR}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Gerar Novo QR
                </button>
              <button
                onClick={handleCloseQR}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Cancelar
              </button>
              </div>
            </div>
          );
        } else {
          console.log('Renderizando botão inicial...');
          return (
            <div className="flex flex-col items-center">
              <div className="w-[200px] h-[200px] bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <QrCode size={80} className="text-green-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                🔗 Conectar WhatsApp
              </h4>
              <p className="text-gray-600 text-center mb-8 max-w-sm">
                Clique no botão abaixo para gerar um QR Code e conectar seu WhatsApp ao sistema
              </p>
              <button
                onClick={handleGenerateQR}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <QrCode size={24} />
                <span className="font-semibold text-lg">Gerar QR Code</span>
              </button>
              <p className="text-xs text-gray-500 mt-4 text-center">
                ⚡ Conexão rápida e segura
              </p>
            </div>
          );
        }
      })()}
    </div>
  );
}