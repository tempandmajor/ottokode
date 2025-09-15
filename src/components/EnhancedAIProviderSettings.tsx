import React, { useState, useEffect } from 'react';
import { enhancedAIService, AIServiceConfig } from '../services/ai/EnhancedAIService';
import { AIProvider } from '../types/ai';
import './EnhancedAIProviderSettings.css';

interface EnhancedAIProviderSettingsProps {
  onClose: () => void;
}

export const EnhancedAIProviderSettings: React.FC<EnhancedAIProviderSettingsProps> = ({ onClose }) => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [configurations, setConfigurations] = useState<{ [key: string]: Partial<AIServiceConfig> }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{ [key: string]: 'success' | 'error' | 'testing' }>({});
  const [savedConfigurations, setSavedConfigurations] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadProviders();
    loadSavedConfigurations();

    // Listen for provider configuration events
    const handleProviderConfigured = (providerName: string) => {
      setSavedConfigurations(prev => ({ ...prev, [providerName]: true }));
      loadProviders(); // Refresh provider states
    };

    const handleProviderRemoved = (providerName: string) => {
      setSavedConfigurations(prev => ({ ...prev, [providerName]: false }));
      loadProviders();
    };

    enhancedAIService.on('providerConfigured', handleProviderConfigured);
    enhancedAIService.on('providerRemoved', handleProviderRemoved);

    return () => {
      enhancedAIService.off('providerConfigured', handleProviderConfigured);
      enhancedAIService.off('providerRemoved', handleProviderRemoved);
    };
  }, []);

  const loadProviders = () => {
    const availableProviders = enhancedAIService.getProviders();
    setProviders(availableProviders);

    if (availableProviders.length > 0 && !activeProvider) {
      setActiveProvider(availableProviders[0].name);
    }

    // Update saved configurations state
    const saved: { [key: string]: boolean } = {};
    availableProviders.forEach(provider => {
      saved[provider.name] = provider.isConfigured;
    });
    setSavedConfigurations(saved);
  };

  const loadSavedConfigurations = () => {
    // Initialize configurations with default values
    const initialConfigs: { [key: string]: Partial<AIServiceConfig> } = {};

    enhancedAIService.getProviders().forEach(provider => {
      initialConfigs[provider.name] = {
        provider: provider.name,
        apiKey: '',
        baseUrl: getDefaultBaseUrl(provider.name),
        organizationId: ''
      };
    });

    setConfigurations(initialConfigs);
  };

  const getDefaultBaseUrl = (providerName: string): string => {
    switch (providerName) {
      case 'openai': return 'https://api.openai.com/v1';
      case 'anthropic': return 'https://api.anthropic.com';
      case 'google': return 'https://generativelanguage.googleapis.com/v1';
      case 'cohere': return 'https://api.cohere.ai/v1';
      case 'mistral': return 'https://api.mistral.ai/v1';
      case 'ollama': return 'http://localhost:11434';
      default: return '';
    }
  };

  const handleConfigChange = (providerName: string, field: keyof AIServiceConfig, value: string) => {
    setConfigurations(prev => ({
      ...prev,
      [providerName]: {
        ...prev[providerName],
        [field]: value
      }
    }));
  };

  const handleSaveProvider = async (providerName: string) => {
    setIsLoading(true);

    try {
      const config = configurations[providerName];
      if (!config) {
        throw new Error('Configuration not found');
      }

      // Validate required fields
      if (providerName !== 'ollama' && !config.apiKey) {
        throw new Error('API Key is required');
      }

      const fullConfig: AIServiceConfig = {
        provider: providerName,
        apiKey: config.apiKey || '',
        baseUrl: config.baseUrl,
        organizationId: config.organizationId
      };

      await enhancedAIService.configureProvider(fullConfig);

      // Show success message
      setTestResults(prev => ({ ...prev, [providerName]: 'success' }));

      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setTestResults(prev => {
          const newResults = { ...prev };
          delete newResults[providerName];
          return newResults;
        });
      }, 3000);

    } catch (error) {
      console.error('Configuration error:', error);
      setTestResults(prev => ({ ...prev, [providerName]: 'error' }));
      alert(`❌ Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestProvider = async (providerName: string) => {
    if (!savedConfigurations[providerName]) {
      alert('Please save the configuration first');
      return;
    }

    setTestResults(prev => ({ ...prev, [providerName]: 'testing' }));

    try {
      const provider = enhancedAIService.getProvider(providerName);
      const firstModel = provider?.models[0];

      if (!firstModel) {
        throw new Error('No models available for this provider');
      }

      const result = await enhancedAIService.chat(
        providerName,
        firstModel.id,
        [{ role: 'user', content: 'Hello! Please respond with just "OK" to confirm you are working.', timestamp: new Date() }],
        { maxTokens: 10, temperature: 0.1 }
      );

      if (result && result.content.trim()) {
        setTestResults(prev => ({ ...prev, [providerName]: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, [providerName]: 'error' }));
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults(prev => ({ ...prev, [providerName]: 'error' }));
    }
  };

  const handleRemoveProvider = (providerName: string) => {
    if (confirm(`Are you sure you want to remove the configuration for ${providerName}?`)) {
      enhancedAIService.removeProvider(providerName);

      // Clear local configuration
      setConfigurations(prev => ({
        ...prev,
        [providerName]: {
          provider: providerName,
          apiKey: '',
          baseUrl: getDefaultBaseUrl(providerName),
          organizationId: ''
        }
      }));

      // Clear test results
      setTestResults(prev => {
        const newResults = { ...prev };
        delete newResults[providerName];
        return newResults;
      });
    }
  };

  const getProviderIcon = (providerName: string): string => {
    switch (providerName) {
      case 'openai': return '🤖';
      case 'anthropic': return '🧠';
      case 'google': return '🔍';
      case 'cohere': return '🌐';
      case 'mistral': return '🚀';
      case 'ollama': return '🦙';
      default: return '🔧';
    }
  };

  const getProviderInstructions = (providerName: string): { steps: string[]; docsUrl: string; features: string[] } => {
    switch (providerName) {
      case 'openai':
        return {
          steps: [
            '1. Visit platform.openai.com and sign in',
            '2. Navigate to API Keys section',
            '3. Create a new secret key',
            '4. Copy the key (it won\'t be shown again)',
            '5. Paste it in the API Key field below'
          ],
          docsUrl: 'https://platform.openai.com/api-keys',
          features: ['Chat completions', 'Code generation', 'Function calling', 'Vision (GPT-4o)', 'Streaming responses']
        };
      case 'anthropic':
        return {
          steps: [
            '1. Go to console.anthropic.com',
            '2. Sign in or create an account',
            '3. Navigate to API Keys',
            '4. Generate a new API key',
            '5. Copy and paste it below'
          ],
          docsUrl: 'https://console.anthropic.com/',
          features: ['Claude 3.5 Sonnet', 'Long context (200K tokens)', 'Code generation', 'Function calling', 'Reasoning']
        };
      case 'google':
        return {
          steps: [
            '1. Visit Google AI Studio (aistudio.google.com)',
            '2. Sign in with your Google account',
            '3. Go to "Get API key" section',
            '4. Create a new API key',
            '5. Copy the generated key'
          ],
          docsUrl: 'https://aistudio.google.com/app/apikey',
          features: ['Gemini Pro models', 'Vision capabilities', 'Free tier available', 'Fast inference']
        };
      case 'cohere':
        return {
          steps: [
            '1. Sign up at cohere.ai',
            '2. Go to your dashboard',
            '3. Navigate to API Keys',
            '4. Generate a new API key',
            '5. Copy and use it below'
          ],
          docsUrl: 'https://dashboard.cohere.ai/api-keys',
          features: ['Command R+ model', 'RAG capabilities', 'Multilingual support', 'Enterprise features']
        };
      case 'mistral':
        return {
          steps: [
            '1. Sign up at console.mistral.ai',
            '2. Access your account dashboard',
            '3. Create a new API key',
            '4. Copy the generated key',
            '5. Enter it in the field below'
          ],
          docsUrl: 'https://console.mistral.ai/',
          features: ['Mistral Large model', 'European AI', 'Code generation', 'Multilingual', 'Function calling']
        };
      case 'ollama':
        return {
          steps: [
            '1. Download Ollama from ollama.ai',
            '2. Install and start Ollama service',
            '3. Pull models: ollama pull codellama:7b',
            '4. Ensure it runs on localhost:11434',
            '5. No API key needed - it\'s local!'
          ],
          docsUrl: 'https://ollama.ai/download',
          features: ['Local inference', 'No API costs', 'Privacy-focused', 'Code Llama models', 'Offline capable']
        };
      default:
        return { steps: [], docsUrl: '', features: [] };
    }
  };

  const activeProviderData = providers.find(p => p.name === activeProvider);
  const activeConfig = configurations[activeProvider || ''];
  const instructions = activeProviderData ? getProviderInstructions(activeProviderData.name) : null;

  return (
    <div className="enhanced-ai-provider-settings">
      <div className="settings-header">
        <h2>🔑 AI Provider Configuration</h2>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      <div className="settings-content">
        <div className="provider-sidebar">
          <h3>Available Providers</h3>
          <div className="provider-list">
            {providers.map(provider => (
              <div
                key={provider.name}
                className={`provider-item ${activeProvider === provider.name ? 'active' : ''} ${provider.isConfigured ? 'configured' : ''}`}
                onClick={() => setActiveProvider(provider.name)}
              >
                <div className="provider-info">
                  <span className="provider-icon">{getProviderIcon(provider.name)}</span>
                  <div className="provider-details">
                    <span className="provider-name">{provider.displayName}</span>
                    <span className="provider-models">{provider.models.length} models</span>
                  </div>
                </div>
                <div className="provider-status">
                  {provider.isConfigured ? '✅' : '⚪'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="provider-config">
          {activeProviderData && activeConfig && instructions && (
            <>
              <div className="config-header">
                <h3>
                  {getProviderIcon(activeProviderData.name)} {activeProviderData.displayName}
                </h3>
                <div className="provider-actions">
                  {savedConfigurations[activeProviderData.name] && (
                    <>
                      <button
                        onClick={() => handleTestProvider(activeProviderData.name)}
                        className={`test-button ${testResults[activeProviderData.name] || ''}`}
                        disabled={testResults[activeProviderData.name] === 'testing'}
                      >
                        {testResults[activeProviderData.name] === 'testing' ? '🔄 Testing...' :
                         testResults[activeProviderData.name] === 'success' ? '✅ Test Passed' :
                         testResults[activeProviderData.name] === 'error' ? '❌ Test Failed' : '🧪 Test Connection'}
                      </button>
                      <button
                        onClick={() => handleRemoveProvider(activeProviderData.name)}
                        className="remove-button"
                      >
                        🗑️ Remove
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="config-form">
                {activeProviderData.name !== 'ollama' && (
                  <div className="form-group">
                    <label>API Key *</label>
                    <div className="input-with-toggle">
                      <input
                        type="password"
                        value={activeConfig.apiKey || ''}
                        onChange={(e) => handleConfigChange(activeProviderData.name, 'apiKey', e.target.value)}
                        placeholder="Enter your API key..."
                        className="form-input"
                        id={`api-key-${activeProviderData.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById(`api-key-${activeProviderData.name}`) as HTMLInputElement;
                          input.type = input.type === 'password' ? 'text' : 'password';
                        }}
                        className="toggle-visibility"
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                )}

                {activeProviderData.name === 'openai' && (
                  <div className="form-group">
                    <label>Organization ID (Optional)</label>
                    <input
                      type="text"
                      value={activeConfig.organizationId || ''}
                      onChange={(e) => handleConfigChange(activeProviderData.name, 'organizationId', e.target.value)}
                      placeholder="org-..."
                      className="form-input"
                    />
                    <small>Only needed if you belong to multiple organizations</small>
                  </div>
                )}

                <div className="form-group">
                  <label>Base URL</label>
                  <input
                    type="text"
                    value={activeConfig.baseUrl || ''}
                    onChange={(e) => handleConfigChange(activeProviderData.name, 'baseUrl', e.target.value)}
                    placeholder="Enter base URL..."
                    className="form-input"
                  />
                  <small>Use default unless you have a custom endpoint</small>
                </div>

                <div className="form-actions">
                  <button
                    onClick={() => handleSaveProvider(activeProviderData.name)}
                    className="save-button"
                    disabled={isLoading || (activeProviderData.name !== 'ollama' && !activeConfig.apiKey)}
                  >
                    {isLoading ? '💾 Saving...' : savedConfigurations[activeProviderData.name] ? '💾 Update Configuration' : '💾 Save Configuration'}
                  </button>
                </div>
              </div>

              <div className="provider-details">
                <div className="setup-instructions">
                  <h4>📋 Setup Instructions</h4>
                  <ol>
                    {instructions.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                  <a
                    href={instructions.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="docs-link"
                  >
                    📖 Official Documentation
                  </a>
                </div>

                <div className="provider-features">
                  <h4>✨ Features</h4>
                  <ul className="features-list">
                    {instructions.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="available-models">
                  <h4>🤖 Available Models</h4>
                  <div className="models-grid">
                    {activeProviderData.models.map(model => (
                      <div key={model.id} className="model-card">
                        <div className="model-header">
                          <h5>{model.name}</h5>
                          <span className="model-id">{model.id}</span>
                        </div>
                        <div className="model-specs">
                          <div>Context: {model.contextLength.toLocaleString()} tokens</div>
                          <div className="model-pricing">
                            <div>Input: ${model.costPer1KTokens.input.toFixed(4)}/1K</div>
                            <div>Output: ${model.costPer1KTokens.output.toFixed(4)}/1K</div>
                          </div>
                        </div>
                        <div className="model-capabilities">
                          {Object.entries(model.capabilities)
                            .filter(([_, enabled]) => enabled)
                            .map(([capability]) => (
                              <span key={capability} className="capability-tag">
                                {capability}
                              </span>
                            ))
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="security-notice">
                <h4>🔒 Security & Privacy</h4>
                <div className="security-content">
                  <p>
                    • API keys are stored locally in your browser and never sent to external servers except the respective AI providers<br/>
                    • All communication is direct between your browser and the AI provider<br/>
                    • For production use, consider environment variables or dedicated secrets management<br/>
                    • Ollama runs locally and doesn't require external API calls
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