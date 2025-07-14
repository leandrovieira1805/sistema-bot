import { 
  Store, 
  Menu, 
  Package, 
  Gift, 
  ClipboardList, 
  MessageSquare, 
  Brain,
  Settings 
} from 'lucide-react';
import { useStore } from '../../hooks/useStore';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Store },
  { id: 'menu', label: 'Cardápio', icon: Menu },
  { id: 'categories', label: 'Categorias', icon: Package },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'promotions', label: 'Promoções', icon: Gift },
  { id: 'orders', label: 'Pedidos', icon: ClipboardList },
  { id: 'bot', label: 'Bot WhatsApp', icon: MessageSquare },
  { id: 'ai-tester', label: 'Testador IA', icon: Brain },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { storeConfig } = useStore();

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="text-green-600" size={24} />
          {storeConfig?.name || 'Sistema Bot'}
        </h1>
        <p className="text-xs text-gray-500 mt-1">Painel de Controle</p>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                isActive 
                  ? 'bg-green-50 text-green-700 border-r-2 border-green-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}