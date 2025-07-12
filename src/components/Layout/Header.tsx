import { QrCode, Wifi, WifiOff, Settings, Store } from 'lucide-react';

interface HeaderProps {
  title: string;
  botConnected: boolean;
  onWhatsAppConnectionChange: (connected: boolean) => void;
  onOpenWhatsAppSettings: () => void;
}

export function Header({ title, botConnected, onWhatsAppConnectionChange, onOpenWhatsAppSettings }: HeaderProps) {

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            botConnected 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {botConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            Bot {botConnected ? 'Conectado' : 'Desconectado'}
          </div>
          
          <button
            onClick={onOpenWhatsAppSettings}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Settings size={18} />
            WhatsApp
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
              <Store size={16} />
              Sistema Bot
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}