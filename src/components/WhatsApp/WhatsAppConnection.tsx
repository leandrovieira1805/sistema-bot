import { useState } from 'react';
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

  const handleGenerateQR = async () => {
      setError('');
      setQrCodeData('');
      setIsConnected(false);
    setIsLoading(true);
      initializeWhatsApp(
        (qr: string) => {
          setQrCodeData(qr);
        setIsLoading(false);
          onQRCode(qr);
        },
        () => {
          setQrCodeData('');
          setIsConnected(true);
        setIsLoading(false);
          onConnectionChange(true);
        },
        () => {
          setQrCodeData('');
          setIsConnected(false);
        setIsLoading(false);
          onConnectionChange(false);
        },
      undefined,
        (error: string) => {
          setError(error);
          setIsConnected(false);
        setIsLoading(false);
      }
    );
  };

  const handleCloseQR = () => {
    setQrCodeData('');
    setError('');
    setIsConnected(false);
    setIsLoading(false);
    disconnectWhatsApp();
  };

  const handleDisconnect = () => {
    setIsConnected(false);
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

      {/* Estado inicial: botão */}
      {!isConnected && !isLoading && !qrCodeData && (
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
      )}

      {/* Estado carregando: spinner centralizado */}
      {!isConnected && isLoading && !qrCodeData && (
        <div className="flex flex-col items-center">
          <div className="w-[350px] h-[350px] flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg mb-4">
            <RefreshCw size={80} className="text-gray-400 animate-spin" />
          </div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">
            Aguarde, gerando QR Code...
          </h4>
        </div>
      )}

      {/* Estado QR code exibido */}
      {qrCodeData && !isConnected && (
        <div className="flex flex-col items-center">
            <img 
              src={qrCodeData} 
              alt="QR Code WhatsApp" 
            className="mx-auto mb-4 border border-gray-200 rounded-lg shadow-lg"
            style={{ maxWidth: '350px', width: '100%' }}
            />
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
      )}

      {/* Estado conectado */}
      {isConnected && (
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
      )}
    </div>
  );
}