import React, { useState } from 'react';
import { Image, Upload, Save, X } from 'lucide-react';

interface MenuManagerProps {
  menuImage: string;
  onUpdateMenuImage: (imageUrl: string) => void;
}

export function MenuManager({ menuImage, onUpdateMenuImage }: MenuManagerProps) {
  const [imageUrl, setImageUrl] = useState(menuImage);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdateMenuImage(imageUrl);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setImageUrl(menuImage);
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Image className="text-green-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-800">Imagem do Cardapio</h3>
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Image size={18} />
              Editar Imagem
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Imagem do Cardapio
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://exemplo.com/cardapio.jpg"
                />
                <Image className="absolute right-3 top-2.5 text-gray-400" size={20} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Cole aqui o link da imagem do seu cardapio completo
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview da Imagem
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-96 flex items-center justify-center">
                {imageUrl ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Cardapio"
                      className="max-w-full max-h-full object-contain rounded-lg"
                      onError={() => setImageUrl('')}
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <Upload size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Imagem do cardapio aparecera aqui</p>
                    <p className="text-xs">Cole o link da imagem no campo acima</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save size={18} />
                Salvar
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X size={18} />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {menuImage ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <img
                  src={menuImage}
                  alt="Cardapio Atual"
                  className="w-full h-auto max-h-96 object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <Image size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma imagem de cardapio definida</p>
                <p className="text-sm">Clique em "Editar Imagem" para adicionar uma</p>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Como funciona:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Esta imagem sera enviada quando o cliente pedir o cardapio</li>
                <li>• Use uma imagem clara e organizada do seu cardapio completo</li>
                <li>• A imagem deve ser legivel e mostrar todos os produtos disponiveis</li>
                <li>• Apos enviar a imagem, o bot aguardara o pedido do cliente</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
