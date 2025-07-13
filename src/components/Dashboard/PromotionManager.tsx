import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Gift, DollarSign, Eye, EyeOff } from 'lucide-react';
import { Promotion } from '../../types';

interface PromotionManagerProps {
  promotions: Promotion[];
  onAddPromotion: (promotion: Omit<Promotion, 'id'>) => void;
  onUpdatePromotion: (id: string, updates: Partial<Promotion>) => void;
  onDeletePromotion: (id: string) => void;
}

export function PromotionManager({ 
  promotions, 
  onAddPromotion, 
  onUpdatePromotion, 
  onDeletePromotion 
}: PromotionManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: 0,
    image: '',
    active: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.description.trim()) {
      if (editingId) {
        onUpdatePromotion(editingId, formData);
        setEditingId(null);
      } else {
        onAddPromotion(formData);
      }
      setFormData({ title: '', description: '', discount: 0, image: '', active: true });
      setShowAddForm(false);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingId(promotion.id);
    setFormData({
      title: promotion.title,
      description: promotion.description,
      discount: promotion.discount,
      image: promotion.image,
      active: promotion.active
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', discount: 0, image: '', active: true });
    setShowAddForm(false);
  };

  const toggleActive = (id: string, currentActive: boolean) => {
    onUpdatePromotion(id, { active: !currentActive });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gift className="text-orange-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-800">Promoções</h3>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus size={18} />
            Nova Promoção
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-medium mb-4">
              {editingId ? 'Editar Promoção' : 'Nova Promoção'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Promoção
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: Pizza em Dobro"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desconto (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição da Promoção
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Descreva os detalhes da promoção..."
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Imagem da Promoção
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://exemplo.com/promocao.jpg"
              />
              <p className="text-sm text-gray-500 mt-1">
                Esta imagem será enviada pelo bot quando o cliente escolher "Ver Promoções"
              </p>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">Promoção ativa</span>
              </label>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                {editingId ? 'Salvar' : 'Adicionar'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promotion) => (
            <div key={promotion.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {promotion.image && (
                <img
                  src={promotion.image}
                  alt={promotion.title}
                  className="w-full h-48 object-cover"
                />
              )}
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-gray-800">{promotion.title}</h5>
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} className="text-orange-600" />
                    <span className="text-sm font-bold text-orange-600">
                      {promotion.discount}% OFF
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{promotion.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    promotion.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {promotion.active ? <Eye size={12} /> : <EyeOff size={12} />}
                    {promotion.active ? 'Ativa' : 'Inativa'}
                  </span>
                  
                  <button
                    onClick={() => toggleActive(promotion.id, promotion.active)}
                    className={`text-xs px-2 py-1 rounded ${
                      promotion.active 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } transition-colors`}
                  >
                    {promotion.active ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(promotion)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => onDeletePromotion(promotion.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {promotions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Gift size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhuma promoção criada ainda.</p>
            <p className="text-sm">Adicione promoções para atrair mais clientes!</p>
          </div>
        )}
      </div>
    </div>
  );
}