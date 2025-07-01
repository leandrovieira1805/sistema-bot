import React from 'react';
import { QrCode, Wifi, WifiOff, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
  onOpenWhatsAppSettings: () => void;
  botConnected: boolean;
}

export function Header({ title, onOpenWhatsAppSettings, botConnected }: HeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 ml-64">
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
        </div>
      </div>
    </div>
  );
}