import { Image, Upload, Save, X } from 'lucide-react';
import { useState } from 'react';

interface MenuManagerProps {
  menuImage: string;
  menuImages?: string[];
  onUpdateMenuImage: (imageUrl: string) => void;
  onUpdateMenuImages: (images: string[]) => void;
}

export function MenuManager({ menuImage, menuImages = [], onUpdateMenuImage, onUpdateMenuImages }: MenuManagerProps) {
  const [imageUrl, setImageUrl] = useState(menuImage);
  const [multipleImages, setMultipleImages] = useState<string[]>(menuImages);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Função para upload de imagem principal
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
        setImageUrl(data.url);
      } else {
        alert('Erro ao fazer upload da imagem');
      }
    } catch (err) {
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  // Função para upload de múltiplas imagens
  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload
        });
        const data = await res.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }
      
      if (uploadedUrls.length > 0) {
        setMultipleImages(prev => [...prev, ...uploadedUrls]);
      }
    } catch (err) {
      alert('Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
    }
  };

  // Função para remover imagem do array
  const removeImage = (index: number) => {
    setMultipleImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onUpdateMenuImage(imageUrl);
    onUpdateMenuImages(multipleImages);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setImageUrl(menuImage);
    setMultipleImages(menuImages);
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
                Imagem do Cardápio
              </label>
              
              {/* Campo de URL */}
              <div className="relative mb-3">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://exemplo.com/cardapio.jpg"
                />
                <Image className="absolute right-3 top-2.5 text-gray-400" size={20} />
              </div>
              
              {/* Upload de arquivo */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                </div>
                {uploading && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Upload className="animate-spin" size={16}/>
                    <span>Enviando...</span>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-1">
                Cole o link da imagem ou faça upload de um arquivo do seu computador
              </p>
            </div>

            {/* Seção de múltiplas imagens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagens Adicionais do Cardápio
              </label>
              
              {/* Upload de múltiplas imagens */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleImageUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {uploading && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Upload className="animate-spin" size={16}/>
                    <span>Enviando...</span>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mb-3">
                Selecione múltiplas imagens para adicionar ao cardápio (Ctrl+Click para selecionar várias)
              </p>

              {/* Grid de imagens adicionais */}
              {multipleImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {multipleImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Cardápio ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover imagem"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                <h4 className="font-medium text-gray-800 mb-3">Imagem Principal do Cardápio</h4>
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

            {/* Visualização das imagens adicionais */}
            {menuImages && menuImages.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Imagens Adicionais do Cardápio</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {menuImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Cardápio ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
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
