import React, { useState } from 'react';
import { Save, Store, Upload } from 'lucide-react';
import { StoreConfig } from '../../types';

interface StoreSettingsProps {
  config: StoreConfig;
  onUpdate: (config: Partial<StoreConfig>) => void;
}

export function StoreSettings({ config, onUpdate }: StoreSettingsProps) {
  const [formData, setFormData] = useState(config);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleChange = (field: keyof StoreConfig, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Novo: upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      });
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, menuImage: data.url }));
      } else {
        alert('Erro ao fazer upload da imagem');
      }
    } catch (err) {
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Store className="text-green-600" size={24} />
          <h3 className="text-xl font-semibold text-gray-800">Configurações da Loja</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Loja
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Entrega (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.deliveryFee}
                onChange={(e) => handleChange('deliveryFee', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave PIX
              </label>
              <input
                type="text"
                value={formData.pixKey}
                onChange={(e) => handleChange('pixKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Titular da Chave PIX
              </label>
              <input
                type="text"
                value={formData.pixKeyHolder || ''}
                onChange={(e) => handleChange('pixKeyHolder', e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço da Loja
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* Upload de imagem do cardápio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagem do Cardápio
            </label>
            <div className="space-y-4">
              {/* Checkbox para ativar/desativar */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableMenuImage"
                  checked={!!formData.menuImage}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      handleChange('menuImage', '');
                    } else if (!formData.menuImage) {
                      // Se ativou mas não tem imagem, usar uma padrão
                      handleChange('menuImage', 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800');
                    }
                  }}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="enableMenuImage" className="text-sm text-gray-700">
                  Enviar imagem do cardápio nas conversas
                </label>
              </div>
              
              {/* Upload de imagem */}
              {formData.menuImage && (
                <div className="flex items-center gap-4">
                  <img src={formData.menuImage} alt="Cardápio" className="h-24 rounded shadow border" />
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="block"
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('menuImage', '')}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      Remover imagem
                    </button>
                    {uploading && <span className="text-sm text-gray-500 flex items-center gap-1"><Upload className="animate-spin" size={16}/> Enviando...</span>}
                  </div>
                </div>
              )}
              
              {/* Mensagem informativa */}
              <p className="text-xs text-gray-500">
                {formData.menuImage 
                  ? "✅ A imagem do cardápio será enviada automaticamente nas conversas."
                  : "❌ Apenas o texto será enviado, sem imagem do cardápio."
                }
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem de Saudação do Bot
            </label>
            <textarea
              value={formData.greeting}
              onChange={(e) => handleChange('greeting', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save size={18} />
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}