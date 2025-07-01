import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Package, DollarSign } from 'lucide-react';
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
    image: ''
  });

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
      setFormData({ name: '', price: 0, image: '' });
      setShowAddForm(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price,
      image: product.image
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', price: 0, image: '' });
    setShowAddForm(false);
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Imagem
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://exemplo.com/imagem.jpg"
              />
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
            <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              )}
              
              <div className="p-4">
                <h5 className="font-semibold text-gray-800 mb-2">{product.name}</h5>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign size={16} className="text-green-600" />
                  <span className="text-lg font-bold text-green-600">
                    R$ {product.price.toFixed(2)}
                  </span>
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