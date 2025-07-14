import React from 'react';
import { useStore } from '../../hooks/useStore';
import { Settings, MessageSquare } from 'lucide-react';

interface HeaderProps {
  onOpenWhatsAppSettings?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenWhatsAppSettings }) => {
  const { isSaving, lastSaveStatus, storeConfig } = useStore();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {storeConfig?.name || 'Sistema Bot WhatsApp'}
            </h1>
            <p className="text-sm text-gray-600">Painel Administrativo</p>
          </div>
        
          {/* Indicador de status de salvamento */}
          <div className="flex items-center space-x-2">
            {isSaving && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Salvando...</span>
              </div>
            )}
            
            {lastSaveStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Salvo!</span>
              </div>
            )}
            
            {lastSaveStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-600">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Erro ao salvar</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Todas as alterações são salvas automaticamente
          </div>
          
          {onOpenWhatsAppSettings && (
          <button
            onClick={onOpenWhatsAppSettings}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
              <MessageSquare size={18} />
              Configurar WhatsApp
          </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;