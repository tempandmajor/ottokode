import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Zap,
  Globe,
  Shield,
  HelpCircle
} from 'lucide-react';
import { aiService, type AIProvider, type AIProviderConfig } from '../../services/ai/AIService';

interface AISettingsProps {
  onClose?: () => void;
}

interface ProviderStatus {
  configured: boolean;
  testing: boolean;
  error?: string;
}

export const AISettings: React.FC<AISettingsProps> = ({ onClose }) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({} as Record<AIProvider, string>);
  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({} as Record<AIProvider, boolean>);
  const [providerStatus, setProviderStatus] = useState<Record<AIProvider, ProviderStatus>>({} as Record<AIProvider, ProviderStatus>);
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('openai');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const providers = aiService.getAvailableProviders();
    const keys: Record<AIProvider, string> = {} as Record<AIProvider, string>;
    const status: Record<AIProvider, ProviderStatus> = {} as Record<AIProvider, ProviderStatus>;

    providers.forEach(provider => {
      keys[provider] = aiService.getAPIKey(provider) || '';
      status[provider] = {
        configured: aiService.isProviderConfigured(provider),
        testing: false
      };
    });

    setApiKeys(keys);
    setProviderStatus(status);
    setCurrentProvider(aiService.getCurrentProvider());
  };

  const handleAPIKeyChange = (provider: AIProvider, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  const handleSaveAPIKey = async (provider: AIProvider) => {
    const key = apiKeys[provider];
    if (!key.trim()) return;

    setProviderStatus(prev => ({
      ...prev,
      [provider]: { ...prev[provider], testing: true, error: undefined }
    }));

    try {
      aiService.setAPIKey(provider, key);

      // Test the API key with a simple request
      await testAPIKey(provider);

      setProviderStatus(prev => ({
        ...prev,
        [provider]: { configured: true, testing: false }
      }));
    } catch (error) {
      setProviderStatus(prev => ({
        ...prev,
        [provider]: {
          configured: false,
          testing: false,
          error: error instanceof Error ? error.message : 'Invalid API key'
        }
      }));
    }
  };

  const testAPIKey = async (provider: AIProvider) => {
    await aiService.complete([{
      role: 'user',
      content: 'Hello'
    }], {
      provider,
      maxTokens: 10,
      temperature: 0.1
    });
  };

  const handleRemoveAPIKey = (provider: AIProvider) => {
    aiService.removeAPIKey(provider);
    setApiKeys(prev => ({ ...prev, [provider]: '' }));
    setProviderStatus(prev => ({
      ...prev,
      [provider]: { configured: false, testing: false }
    }));
  };

  const handleSetCurrentProvider = (provider: AIProvider) => {
    if (providerStatus[provider]?.configured) {
      aiService.setCurrentProvider(provider);
      setCurrentProvider(provider);
    }
  };

  const toggleShowKey = (provider: AIProvider) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const getProviderIcon = (provider: AIProvider) => {
    const icons = {
      openai: '🤖',
      anthropic: '🧠',
      google: '🌟',
      cohere: '🔮',
      mistral: '🌪️'
    };
    return icons[provider] || '🤖';
  };

  const getProviderDescription = (provider: AIProvider) => {
    const descriptions = {
      openai: 'Advanced language models including GPT-4 for code generation and chat',
      anthropic: 'Claude models optimized for safety and helpful assistance',
      google: 'Gemini models with multimodal capabilities and code understanding',
      cohere: 'Language models focused on text generation and understanding',
      mistral: 'Open-source compatible models with strong performance'
    };
    return descriptions[provider] || '';
  };

  const getAPIKeyPlaceholder = (provider: AIProvider) => {
    const placeholders = {
      openai: 'sk-...',
      anthropic: 'sk-ant-...',
      google: 'AI...',
      cohere: 'Your Cohere API key',
      mistral: 'Your Mistral API key'
    };
    return placeholders[provider] || 'Your API key';
  };

  const renderProviderCard = (provider: AIProvider, config: AIProviderConfig) => {
    const status = providerStatus[provider];
    const isSelected = selectedProvider === provider;
    const isCurrent = currentProvider === provider;

    return (
      <div
        key={provider}
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
        onClick={() => setSelectedProvider(provider)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getProviderIcon(provider)}</span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {config.name}
                </h3>
                {isCurrent && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getProviderDescription(provider)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {status?.configured ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <X className="w-5 h-5 text-red-500" />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Key
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type={showKeys[provider] ? 'text' : 'password'}
                  value={apiKeys[provider] || ''}
                  onChange={(e) => handleAPIKeyChange(provider, e.target.value)}
                  placeholder={getAPIKeyPlaceholder(provider)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(provider)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showKeys[provider] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                onClick={() => handleSaveAPIKey(provider)}
                disabled={!apiKeys[provider]?.trim() || status?.testing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {status?.testing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Key size={16} />
                )}
                <span>{status?.testing ? 'Testing...' : 'Save'}</span>
              </button>

              {status?.configured && (
                <button
                  onClick={() => handleRemoveAPIKey(provider)}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {status?.error && (
              <div className="mt-2 flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle size={16} />
                <span className="text-sm">{status.error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Zap size={14} />
                <span>Models: {config.models.length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Globe size={14} />
                <span>{config.supportsStreaming ? 'Streaming' : 'No streaming'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield size={14} />
                <span>{config.supportsCodeCompletion ? 'Code completion' : 'Chat only'}</span>
              </div>
            </div>

            {status?.configured && (
              <button
                onClick={() => handleSetCurrentProvider(provider)}
                disabled={isCurrent}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isCurrent ? 'Active' : 'Use Provider'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              AI Provider Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Configure AI Providers
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Add your API keys to enable AI-powered features like code completion, chat assistance,
              and code generation. Your API keys are stored locally and never sent to our servers.
            </p>
          </div>

          <div className="space-y-4">
            {aiService.getAvailableProviders().map(provider => {
              const config = aiService.getProviderConfig(provider);
              return config ? renderProviderCard(provider, config) : null;
            })}
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Security & Privacy
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  API keys are encrypted and stored locally. Code sent to AI providers
                  is subject to their respective privacy policies. Consider using provider-specific
                  privacy controls if available.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {aiService.getConfiguredProviders().length} of {aiService.getAvailableProviders().length} providers configured
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};