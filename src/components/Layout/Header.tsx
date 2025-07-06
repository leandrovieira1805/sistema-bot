import { QrCode, Wifi, WifiOff, Settings, LogOut, User, Store, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title: string;
  botConnected: boolean;
  onWhatsAppConnectionChange: (connected: boolean) => void;
  onOpenWhatsAppSettings: () => void;
}

export function Header({ title, botConnected, onWhatsAppConnectionChange, onOpenWhatsAppSettings }: HeaderProps) {
  const { user, logout } = useAuth();

  const getUserTypeInfo = () => {
    if (!user) return { label: 'Usuário', icon: User, color: 'bg-gray-500' };
    
    const email = user.email?.toLowerCase() || '';
    
    if (email === 'admin@exemplo.com') {
      return {
        label: 'Pizzaria Delícia',
        icon: Store,
        color: 'bg-red-500'
      };
    } else if (email === 'evellynlavinian@gmail.com') {
      return {
        label: 'Bebidas Delícia',
        icon: Package,
        color: 'bg-blue-500'
      };
    }
    
    return {
      label: user.email || 'Usuário',
      icon: User,
      color: 'bg-gray-500'
    };
  };

  const userInfo = getUserTypeInfo();
  const UserIcon = userInfo.icon;

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
            <div className={`flex items-center gap-2 px-3 py-1 ${userInfo.color} text-white rounded-full text-sm`}>
              <UserIcon size={16} />
              {userInfo.label}
            </div>
            
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              title="Sair"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}