import React, { useState, useEffect } from 'react';
import { aiProviderService } from '../services/ai/AIProviderService';
import './AIProviderSettings.css';

interface AIProviderSettingsProps {
  onClose: () => void;
}

interface ProviderConfig {
  name: string;
  displayName: string;
  apiKey: string;
  baseUrl: string;
  isConfigured: boolean;
  models: Array<{
    id: string;
    name: string;
    costPer1KTokens: { input: number; output: number };
  }>;
}

export const AIProviderSettings: React.FC<AIProviderSettingsProps> = ({ onClose }) => {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({});
  const [baseUrls, setBaseUrls] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{ [key: string]: 'success' | 'error' | 'testing' }>({});

  useEffect(() => {
    loadProviders();
    loadSavedConfigs();
  }, []);

  const loadProviders = () => {
    const availableProviders = aiProviderService.getProviders();
    const providerConfigs: ProviderConfig[] = availableProviders.map(provider => ({
      name: provider.name,
      displayName: provider.displayName,
      apiKey: provider.apiKey || '',
      baseUrl: provider.baseUrl || getDefaultBaseUrl(provider.name),
      isConfigured: provider.isConfigured,
      models: provider.models.map(model => ({
        id: model.id,
        name: model.name,
        costPer1KTokens: model.costPer1KTokens
      }))
    }));

    setProviders(providerConfigs);
    if (providerConfigs.length > 0) {
      setActiveProvider(providerConfigs[0].name);
    }
  };

  const loadSavedConfigs = () => {
    // Load from localStorage or secure storage
    const savedKeys = localStorage.getItem('ai_provider_keys');
    const savedUrls = localStorage.getItem('ai_provider_urls');

    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys));
      } catch (error) {
        console.error('Failed to load saved API keys:', error);
      }
    }

    if (savedUrls) {
      try {
        setBaseUrls(JSON.parse(savedUrls));
      } catch (error) {
        console.error('Failed to load saved URLs:', error);
      }
    }
  };

  const getDefaultBaseUrl = (providerName: string): string => {
    switch (providerName) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'anthropic':
        return 'https://api.anthropic.com';
      case 'google':
        return 'https://generativelanguage.googleapis.com/v1';
      case 'ollama':
        return 'http://localhost:11434';
      default:
        return '';
    }
  };

  const handleApiKeyChange = (providerName: string, apiKey: string) => {
    setApiKeys(prev => ({ ...prev, [providerName]: apiKey }));
  };

  const handleBaseUrlChange = (providerName: string, baseUrl: string) => {
    setBaseUrls(prev => ({ ...prev, [providerName]: baseUrl }));
  };

  const handleSaveProvider = async (providerName: string) => {
    setIsLoading(true);
    try {
      const config = {
        apiKey: apiKeys[providerName] || '',
        baseUrl: baseUrls[providerName] || getDefaultBaseUrl(providerName)
      };

      const success = aiProviderService.configureProvider(providerName, config);

      if (success) {
        // Save to localStorage (in production, use secure storage)
        localStorage.setItem('ai_provider_keys', JSON.stringify(apiKeys));
        localStorage.setItem('ai_provider_urls', JSON.stringify(baseUrls));

        // Update provider state
        setProviders(prev => prev.map(p =>
          p.name === providerName ? { ...p, isConfigured: true, apiKey: config.apiKey, baseUrl: config.baseUrl } : p
        ));

        alert(`✅ ${providerName} configured successfully!`);
      } else {
        alert(`❌ Failed to configure ${providerName}`);
      }
    } catch (error) {
      console.error('Configuration error:', error);
      alert(`❌ Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestProvider = async (providerName: string) => {
    setTestResults(prev => ({ ...prev, [providerName]: 'testing' }));

    try {
      // Test with a simple completion request
      const result = await aiProviderService.chat(
        providerName,
        getFirstModelId(providerName),
        [{ role: 'user', content: 'Hello! This is a test message. Please respond with "OK".', timestamp: new Date() }],
        { maxTokens: 10 }
      );

      if (result && result.content) {
        setTestResults(prev => ({ ...prev, [providerName]: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, [providerName]: 'error' }));
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults(prev => ({ ...prev, [providerName]: 'error' }));
    }
  };

  const getFirstModelId = (providerName: string): string => {
    const provider = providers.find(p => p.name === providerName);
    return provider?.models[0]?.id || '';
  };

  const getProviderIcon = (providerName: string): string => {
    switch (providerName) {
      case 'openai': return '🤖';
      case 'anthropic': return '🧠';
      case 'google': return '🔍';
      case 'ollama': return '🦙';
      default: return '🔧';
    }
  };

  const getProviderInstructions = (providerName: string): { steps: string[]; docsUrl: string } => {
    switch (providerName) {
      case 'openai':
        return {
          steps: [
            '1. Go to platform.openai.com',
            '2. Sign in to your account',
            '3. Navigate to API Keys section',
            '4. Create a new API key',
            '5. Copy and paste it below'
          ],
          docsUrl: 'https://platform.openai.com/api-keys'
        };
      case 'anthropic':
        return {
          steps: [
            '1. Go to console.anthropic.com',
            '2. Sign in to your account',
            '3. Navigate to API Keys',
            '4. Generate a new key',
            '5. Copy and paste it below'
          ],
          docsUrl: 'https://console.anthropic.com/'
        };
      case 'google':
        return {
          steps: [
            '1. Go to Google AI Studio',
            '2. Sign in with your Google account',
            '3. Create a new API key',
            '4. Copy the generated key',
            '5. Paste it below'
          ],
          docsUrl: 'https://aistudio.google.com/app/apikey'
        };
      case 'ollama':
        return {
          steps: [
            '1. Install Ollama from ollama.ai',
            '2. Start Ollama with: ollama serve',
            '3. Pull a model: ollama pull codellama:7b',
            '4. Ensure it\'s running on localhost:11434',
            '5. No API key needed for local models'
          ],
          docsUrl: 'https://ollama.ai/download'
        };
      default:
        return { steps: [], docsUrl: '' };
    }
  };

  const activeProviderData = providers.find(p => p.name === activeProvider);

  return (
    <div className="ai-provider-settings">
      <div className="settings-header">
        <h2>🔑 AI Provider Settings</h2>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      <div className="settings-content">
        <div className="provider-sidebar">
          <h3>Providers</h3>
          <div className="provider-list">
            {providers.map(provider => (
              <div
                key={provider.name}
                className={`provider-item ${activeProvider === provider.name ? 'active' : ''} ${provider.isConfigured ? 'configured' : ''}`}
                onClick={() => setActiveProvider(provider.name)}
              >
                <span className="provider-icon">{getProviderIcon(provider.name)}</span>
                <span className="provider-name">{provider.displayName}</span>
                <span className="provider-status">
                  {provider.isConfigured ? '✅' : '⚪'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="provider-config">
          {activeProviderData && (
            <>
              <div className="config-header">
                <h3>
                  {getProviderIcon(activeProviderData.name)} {activeProviderData.displayName}
                </h3>
                <div className="provider-actions">
                  {activeProviderData.isConfigured && (
                    <button
                      onClick={() => handleTestProvider(activeProviderData.name)}
                      className="test-button"
                      disabled={testResults[activeProviderData.name] === 'testing'}
                    >
                      {testResults[activeProviderData.name] === 'testing' ? '🔄 Testing...' :
                       testResults[activeProviderData.name] === 'success' ? '✅ Test Passed' :
                       testResults[activeProviderData.name] === 'error' ? '❌ Test Failed' : '🧪 Test Connection'}
                    </button>
                  )}
                </div>
              </div>

              <div className="config-form">
                {activeProviderData.name !== 'ollama' && (
                  <div className="form-group">
                    <label>API Key:</label>
                    <div className="api-key-input">
                      <input
                        type="password"
                        value={apiKeys[activeProviderData.name] || ''}
                        onChange={(e) => handleApiKeyChange(activeProviderData.name, e.target.value)}
                        placeholder="Enter your API key..."
                        className="api-key-field"
                      />
                      <button
                        onClick={() => {
                          const input = document.querySelector('.api-key-field') as HTMLInputElement;
                          input.type = input.type === 'password' ? 'text' : 'password';
                        }}
                        className="toggle-visibility"
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Base URL:</label>
                  <input
                    type="text"
                    value={baseUrls[activeProviderData.name] || getDefaultBaseUrl(activeProviderData.name)}
                    onChange={(e) => handleBaseUrlChange(activeProviderData.name, e.target.value)}
                    placeholder="Enter base URL..."
                    className="base-url-field"
                  />
                </div>

                <div className="form-actions">
                  <button
                    onClick={() => handleSaveProvider(activeProviderData.name)}
                    className="save-button"
                    disabled={isLoading || (!apiKeys[activeProviderData.name] && activeProviderData.name !== 'ollama')}
                  >
                    {isLoading ? '💾 Saving...' : '💾 Save Configuration'}
                  </button>
                </div>
              </div>

              <div className="provider-info">
                <div className="setup-instructions">
                  <h4>Setup Instructions</h4>
                  <ol>
                    {getProviderInstructions(activeProviderData.name).steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                  <a
                    href={getProviderInstructions(activeProviderData.name).docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="docs-link"
                  >
                    📖 Official Documentation
                  </a>
                </div>

                <div className="available-models">
                  <h4>Available Models</h4>
                  <div className="models-list">
                    {activeProviderData.models.map(model => (
                      <div key={model.id} className="model-item">
                        <div className="model-name">{model.name}</div>
                        <div className="model-cost">
                          Input: ${model.costPer1KTokens.input}/1K tokens
                          <br />
                          Output: ${model.costPer1KTokens.output}/1K tokens
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="security-notice">
                  <h4>🔒 Security Notice</h4>
                  <p>
                    API keys are stored locally and never sent to external servers except the respective AI providers.
                    For enhanced security, consider using environment variables or a dedicated secrets manager.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};