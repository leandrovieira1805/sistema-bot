import React, { useState } from 'react';
import { Brain, TestTube, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

interface AITesterProps {
  onBack: () => void;
}

interface AIResponse {
  input: string;
  normalized: string;
  corrected: string;
  numbers: number[];
  aiResult: {
    bestMatch: any;
    suggestions: any[];
    confidence: number;
    numbers: number[];
    correctedInput: string;
  };
  response: {
    success: boolean;
    product?: any;
    message: string;
    suggestions?: any[];
    confidence: number;
  };
}

export function AITester({ onBack }: AITesterProps) {
  const [testText, setTestText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);

  const testAI = async () => {
    if (!testText.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: testText }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        console.error('Erro ao testar IA');
      }
    } catch (error) {
      console.error('Erro ao testar IA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    testAI();
  };

  const examples = [
    'quero uma piza',
    'dois hamburguer',
    'uma pizza margherita',
    'tres refrigerante',
    'batata frita',
    'suco natural',
    'um hamburguer e dois refrigerante',
    'pizzza margarita',
    'hamburguer com batata',
    'sobremesa doce'
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Voltar
          </button>
          <Brain className="text-purple-600" size={24} />
          <h3 className="text-xl font-semibold text-gray-800">
            Testador de IA - Correção de Digitações
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Área de Teste */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digite um texto para testar a IA:
              </label>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Ex: quero uma piza"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={isLoading || !testText.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Testando...
                    </>
                  ) : (
                    <>
                      <TestTube size={18} />
                      Testar IA
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Exemplos */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Exemplos para testar:
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setTestText(example)}
                    className="text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200 hover:border-purple-300 transition-colors"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">
              Resultado da IA:
            </h4>
            
            {result && (
              <div className="space-y-4">
                {/* Status */}
                <div className={`p-3 rounded-lg border ${
                  result.response.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {result.response.success ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : (
                      <AlertCircle className="text-yellow-600" size={20} />
                    )}
                    <span className="font-medium">
                      {result.response.success ? 'Produto Encontrado!' : 'Produto Não Encontrado'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Confiança: {(result.response.confidence * 100).toFixed(1)}%
                  </p>
                </div>

                {/* Detalhes */}
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Texto Original:</h5>
                    <p className="text-sm bg-gray-50 p-2 rounded">{result.input}</p>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Texto Normalizado:</h5>
                    <p className="text-sm bg-gray-50 p-2 rounded">{result.normalized}</p>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Texto Corrigido:</h5>
                    <p className="text-sm bg-gray-50 p-2 rounded">{result.corrected}</p>
                  </div>

                  {result.numbers.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Números Detectados:</h5>
                      <p className="text-sm bg-blue-50 p-2 rounded">
                        {result.numbers.join(', ')}
                      </p>
                    </div>
                  )}

                  {result.response.success && result.response.product && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Produto Encontrado:</h5>
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <p className="font-medium text-green-800">{result.response.product.name}</p>
                        <p className="text-sm text-green-600">R$ {result.response.product.price.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  {result.response.suggestions && result.response.suggestions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Sugestões:</h5>
                      <div className="space-y-2">
                        {result.response.suggestions.map((suggestion, index) => (
                          <div key={index} className="bg-yellow-50 p-2 rounded border border-yellow-200">
                            <p className="text-sm font-medium">{suggestion.product.name}</p>
                            <p className="text-xs text-gray-600">
                              Confiança: {(suggestion.score * 100).toFixed(1)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Resposta da IA:</h5>
                    <p className="text-sm bg-purple-50 p-3 rounded border border-purple-200">
                      {result.response.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!result && (
              <div className="text-center py-8 text-gray-500">
                <Brain size={48} className="mx-auto mb-4 opacity-50" />
                <p>Digite um texto para testar o sistema de IA</p>
                <p className="text-sm">A IA irá corrigir digitações e identificar produtos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 