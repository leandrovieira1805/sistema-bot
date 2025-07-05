import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Package, DollarSign, Image, Upload } from 'lucide-react';
import { Category, Product } from '../../types';

interface ProductManagerProps {
  category: Category;
  onBack: () => void;
  onAddProduct: (categoryId: string, product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (categoryId: string, productId: string, updates: Partial<Product>) => void;
  onDeleteProduct: (categoryId: string, productId: string) => void;
}

export function ProductManager({ 
  category, 
  onBack, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct 
}: ProductManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    image: '',
    unit: 'unit' as 'unit' | 'pack' | 'box',
    unitLabel: 'unidade',
    packSize: 1,
    packPrice: 0,
    unitPrice: 0
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.price > 0) {
      if (editingId) {
        onUpdateProduct(category.id, editingId, formData);
        setEditingId(null);
      } else {
        onAddProduct(category.id, {
          ...formData,
          categoryId: category.id
        });
      }
      setFormData({ name: '', price: 0, image: '', unit: 'unit', unitLabel: 'unidade', packSize: 1, packPrice: 0, unitPrice: 0 });
      setImagePreview(null);
      setShowAddForm(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price,
      image: product.image,
      unit: product.unit,
      unitLabel: product.unitLabel,
      packSize: product.packSize,
      packPrice: product.packPrice,
      unitPrice: product.unitPrice
    });
    setImagePreview(product.image || null);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', price: 0, image: '', unit: 'unit', unitLabel: 'unidade', packSize: 1, packPrice: 0, unitPrice: 0 });
    setImagePreview(null);
    setShowAddForm(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, image: url }));
    setImagePreview(url || null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <Package className="text-green-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-800">
              Produtos - {category.name}
            </h3>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={18} />
            Novo Produto
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-medium mb-4">
              {editingId ? 'Editar Produto' : 'Novo Produto'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Produto
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ex: Pizza Margherita"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Unidade
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => {
                      const unit = e.target.value as 'unit' | 'pack' | 'box';
                      const unitLabels = {
                        unit: 'unidade',
                        pack: 'fardo',
                        box: 'caixa'
                      };
                      setFormData(prev => ({ 
                        ...prev, 
                        unit,
                        unitLabel: unitLabels[unit]
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="unit">Unidade</option>
                    <option value="pack">Fardo</option>
                    <option value="box">Caixa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade por {formData.unitLabel}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.packSize}
                    onChange={(e) => setFormData(prev => ({ ...prev, packSize: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço por {formData.unitLabel} (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.packPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, packPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço por unidade (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL da Imagem
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.image}
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                    <Image className="absolute right-3 top-2.5 text-gray-400" size={20} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cole aqui o link da imagem do produto
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview da Imagem
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-64 flex items-center justify-center">
                  {imagePreview ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onError={() => setImagePreview(null)}
                      />
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <Upload size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Imagem aparecerá aqui</p>
                      <p className="text-xs">Cole o link da imagem no campo ao lado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
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
          {category.products.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {product.image ? (
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling!.style.display = 'flex';
                    }}
                  />
                  <div className="hidden items-center justify-center w-full h-full text-gray-400">
                    <Image size={48} />
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Image size={48} className="mx-auto mb-2" />
                    <p className="text-sm">Sem imagem</p>
                  </div>
                </div>
              )}
              
              <div className="p-4">
                <h5 className="font-semibold text-gray-800 mb-2">{product.name}</h5>
                
                {/* Informações de Unidade */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Package size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {product.unitLabel || 'unidade'}
                    </span>
                  </div>
                  
                  {/* Preços */}
                  <div className="space-y-1">
                    {product.packPrice && product.packPrice > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {product.packSize || 1}x {product.unitLabel || 'unidade'}:
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          R$ {product.packPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {product.unitPrice && product.unitPrice > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          1 {product.unitLabel || 'unidade'}:
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          R$ {product.unitPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {/* Preço padrão (fallback) */}
                    {(!product.packPrice || product.packPrice === 0) && (!product.unitPrice || product.unitPrice === 0) && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Preço:</span>
                        <span className="text-lg font-bold text-green-600">
                          R$ {product.price.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => onDeleteProduct(category.id, product.id)}
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

        {category.products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum produto adicionado ainda.</p>
            <p className="text-sm">Adicione produtos a esta categoria!</p>
          </div>
        )}
      </div>
    </div>
  );
}