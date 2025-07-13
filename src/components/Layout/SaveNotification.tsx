import React, { useEffect, useState } from 'react';
import { useStore } from '../../hooks/useStore';

const SaveNotification: React.FC = () => {
  const { isSaving, lastSaveStatus } = useStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isSaving || lastSaveStatus) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isSaving, lastSaveStatus]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`
        flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform
        ${isSaving 
          ? 'bg-blue-50 border-blue-400 text-blue-800' 
          : lastSaveStatus === 'success'
          ? 'bg-green-50 border-green-400 text-green-800'
          : 'bg-red-50 border-red-400 text-red-800'
        }
      `}>
        {isSaving && (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="font-medium">Salvando alterações...</span>
          </>
        )}
        
        {lastSaveStatus === 'success' && (
          <>
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Alterações salvas com sucesso!</span>
          </>
        )}
        
        {lastSaveStatus === 'error' && (
          <>
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Erro ao salvar alterações</span>
          </>
        )}
      </div>
    </div>
  );
};

export default SaveNotification; 