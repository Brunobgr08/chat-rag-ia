import React, { useState, useEffect } from 'react';
import { Save, Key, Cpu, MessageSquare, TestTube } from 'lucide-react';
import { AppConfig, Model } from '../../../shared/types';
import api from '../lib/api';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AppConfig>({
    openRouterApiKey: '',
    selectedModel: 'openai/gpt-3.5-turbo',
    systemPrompt:
      'Você é um assistente útil que responde perguntas com base no contexto fornecido.',
    evolutionApiUrl: 'https://evodevs.cordex.ai',
    evolutionApiKey: 'V0e3EBKbaJFnKREYfFCqOnoi904vAPV7',
  });

  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const data = await api.config.get();

      if (data.success) {
        setConfig(data.data);
        setAvailableModels(data.availableModels);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      showMessage('error', 'Erro ao carregar configurações');
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    try {
      const data = await api.config.save(config);

      if (data.success) {
        showMessage('success', 'Configurações salvas com sucesso!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      showMessage('error', 'Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const testApiKey = async () => {
    setIsTesting(true);
    try {
      const data = await api.config.validateApiKey(config.openRouterApiKey);

      if (data.success && data.valid) {
        showMessage('success', 'API Key válida!');
      } else {
        showMessage('error', data.error || 'API Key inválida');
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      showMessage('error', 'Erro ao testar API Key');
    } finally {
      setIsTesting(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Configurações</h2>
          <p className="text-gray-600 mt-1">Configure as chaves de API e modelos de IA</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Open Router API Key */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Key className="w-4 h-4 mr-2" />
              Open Router API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={config.openRouterApiKey}
                onChange={(e) => setConfig({ ...config, openRouterApiKey: e.target.value })}
                placeholder="sk-or-..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={testApiKey}
                disabled={isTesting || !config.openRouterApiKey}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TestTube className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Obtenha sua API key em{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                className="text-blue-500 hover:underline"
              >
                openrouter.ai/keys
              </a>
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Cpu className="w-4 h-4 mr-2" />
              Modelo de IA
            </label>
            <select
              value={config.selectedModel}
              onChange={(e) => setConfig({ ...config, selectedModel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider}) - {model.contextLength.toLocaleString()} tokens
                </option>
              ))}
            </select>
          </div>

          {/* System Prompt */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 mr-2" />
              System Prompt
            </label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Defina o comportamento padrão do assistente..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Este prompt define como o assistente se comporta em todas as conversas
            </p>
          </div>

          {/* Evolution API Configuration */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuração do WhatsApp</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Evolution API URL
                </label>
                <input
                  type="text"
                  value={config.evolutionApiUrl}
                  onChange={(e) => setConfig({ ...config, evolutionApiUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Evolution API Key
                </label>
                <input
                  type="password"
                  value={config.evolutionApiKey}
                  onChange={(e) => setConfig({ ...config, evolutionApiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-md ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={saveConfig}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
