import React, { useState, useEffect } from 'react';
import { ollamaProvider, OllamaModel } from '../services/ai/providers/OllamaProvider';
import './OllamaManager.css';

interface OllamaManagerProps {
  onClose: () => void;
}

export const OllamaManager: React.FC<OllamaManagerProps> = ({ onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [pullProgress, setPullProgress] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'models' | 'install' | 'settings'>('models');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const connected = await ollamaProvider.testConnection();
      setIsConnected(connected);
      setConnectionStatus(connected ? 'connected' : 'disconnected');

      if (connected) {
        await loadModels();
        setCurrentModel(ollamaProvider.getCurrentModel());
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  };

  const loadModels = async () => {
    try {
      await ollamaProvider.loadAvailableModels();
      setAvailableModels(ollamaProvider.getAvailableModels());
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handlePullModel = async (modelName: string) => {
    if (!modelName.trim()) return;

    setIsLoading(true);
    setPullProgress({ ...pullProgress, [modelName]: 0 });

    try {
      await ollamaProvider.pullModel(modelName);
      await loadModels();
      setNewModelName('');
      setPullProgress({ ...pullProgress, [modelName]: 100 });
    } catch (error) {
      console.error('Failed to pull model:', error);
      alert(`Failed to pull model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setPullProgress(prev => {
          const updated = { ...prev };
          delete updated[modelName];
          return updated;
        });
      }, 2000);
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    if (!confirm(`Are you sure you want to delete ${modelName}? This cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await ollamaProvider.deleteModel(modelName);
      await loadModels();

      // If deleted model was current, switch to first available
      if (modelName === currentModel && availableModels.length > 0) {
        const newModel = availableModels[0].name;
        await ollamaProvider.setModel(newModel);
        setCurrentModel(newModel);
      }
    } catch (error) {
      console.error('Failed to delete model:', error);
      alert(`Failed to delete model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetCurrentModel = async (modelName: string) => {
    try {
      await ollamaProvider.setModel(modelName);
      setCurrentModel(modelName);
    } catch (error) {
      console.error('Failed to set model:', error);
      alert(`Failed to set model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getRecommendedModels = () => {
    return [
      { name: 'codellama:7b', description: 'Fast code generation and completion', size: '2.6GB' },
      { name: 'codellama:13b-instruct', description: 'Better code understanding and chat', size: '7.8GB' },
      { name: 'llama2:7b', description: 'General chat capabilities', size: '3.8GB' },
      { name: 'tinyllama:1.1b', description: 'Ultra-fast responses, lower quality', size: '0.6GB' },
      { name: 'codellama:7b-code', description: 'Specialized for code completion', size: '2.6GB' },
      { name: 'mistral:7b', description: 'High-quality general purpose model', size: '4.1GB' },
    ];
  };

  return (
    <div className="ollama-manager">
      <div className="ollama-header">
        <h2>🦙 Ollama Local AI</h2>
        <div className="header-actions">
          <div className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'checking' && '🔄 Checking...'}
            {connectionStatus === 'connected' && '🟢 Connected'}
            {connectionStatus === 'disconnected' && '🔴 Disconnected'}
          </div>
          <button onClick={checkConnection} className="refresh-button" title="Refresh Connection">
            🔄
          </button>
          <button onClick={onClose} className="close-button">×</button>
        </div>
      </div>

      <div className="ollama-tabs">
        <button
          className={`tab ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          Models ({availableModels.length})
        </button>
        <button
          className={`tab ${activeTab === 'install' ? 'active' : ''}`}
          onClick={() => setActiveTab('install')}
        >
          Install & Setup
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="ollama-content">
        {!isConnected && activeTab === 'models' && (
          <div className="not-connected">
            <div className="not-connected-content">
              <h3>Ollama Not Connected</h3>
              <p>Ollama is not running or not accessible. Please make sure Ollama is installed and running.</p>
              <div className="connection-actions">
                <button onClick={checkConnection} className="retry-button">
                  Retry Connection
                </button>
                <button onClick={() => setActiveTab('install')} className="setup-button">
                  Setup Instructions
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && isConnected && (
          <div className="models-tab">
            <div className="pull-model-section">
              <h3>Pull New Model</h3>
              <div className="pull-form">
                <input
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="Enter model name (e.g., codellama:7b)"
                  onKeyPress={(e) => e.key === 'Enter' && handlePullModel(newModelName)}
                />
                <button
                  onClick={() => handlePullModel(newModelName)}
                  disabled={isLoading || !newModelName.trim()}
                  className="pull-button"
                >
                  Pull Model
                </button>
              </div>

              <div className="recommended-models">
                <h4>Recommended Models:</h4>
                <div className="recommended-grid">
                  {getRecommendedModels().map(model => (
                    <div key={model.name} className="recommended-item">
                      <div className="model-info">
                        <strong>{model.name}</strong>
                        <span className="model-size">({model.size})</span>
                      </div>
                      <p>{model.description}</p>
                      <button
                        onClick={() => handlePullModel(model.name)}
                        disabled={isLoading || ollamaProvider.isModelAvailable(model.name)}
                        className="quick-pull-button"
                      >
                        {ollamaProvider.isModelAvailable(model.name) ? 'Installed' : 'Pull'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="installed-models-section">
              <h3>Installed Models</h3>
              {availableModels.length === 0 ? (
                <div className="no-models">
                  <p>No models installed. Pull a model to get started.</p>
                </div>
              ) : (
                <div className="models-list">
                  {availableModels.map(model => (
                    <div key={model.name} className={`model-card ${model.name === currentModel ? 'current' : ''}`}>
                      <div className="model-header">
                        <div className="model-name-section">
                          <h4>{model.name}</h4>
                          {model.name === currentModel && <span className="current-badge">Current</span>}
                        </div>
                        <div className="model-actions">
                          {model.name !== currentModel && (
                            <button
                              onClick={() => handleSetCurrentModel(model.name)}
                              className="use-button"
                            >
                              Use
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteModel(model.name)}
                            className="delete-button"
                            disabled={isLoading}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="model-details">
                        <div className="detail-row">
                          <span>Size:</span>
                          <span>{formatFileSize(model.size_vb)}</span>
                        </div>
                        <div className="detail-row">
                          <span>Family:</span>
                          <span>{model.details.family}</span>
                        </div>
                        <div className="detail-row">
                          <span>Parameters:</span>
                          <span>{model.details.parameter_size}</span>
                        </div>
                        <div className="detail-row">
                          <span>Format:</span>
                          <span>{model.details.format}</span>
                        </div>
                      </div>

                      {pullProgress[model.name] !== undefined && (
                        <div className="pull-progress">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${pullProgress[model.name]}%` }}
                            ></div>
                          </div>
                          <span>{pullProgress[model.name]}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'install' && (
          <div className="install-tab">
            <div className="install-content">
              <h3>Ollama Installation & Setup</h3>

              <div className="install-section">
                <h4>1. Install Ollama</h4>
                <div className="install-methods">
                  <div className="install-method">
                    <h5>macOS & Linux</h5>
                    <div className="code-block">
                      <code>curl -fsSL https://ollama.ai/install.sh | sh</code>
                      <button
                        onClick={() => navigator.clipboard.writeText('curl -fsSL https://ollama.ai/install.sh | sh')}
                        className="copy-code-button"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div className="install-method">
                    <h5>Windows</h5>
                    <p>Download the installer from <a href="https://ollama.ai/download" target="_blank" rel="noopener noreferrer">ollama.ai/download</a></p>
                  </div>
                </div>
              </div>

              <div className="install-section">
                <h4>2. Start Ollama Service</h4>
                <div className="code-block">
                  <code>ollama serve</code>
                  <button
                    onClick={() => navigator.clipboard.writeText('ollama serve')}
                    className="copy-code-button"
                  >
                    📋
                  </button>
                </div>
                <p>This starts the Ollama API server on localhost:11434</p>
              </div>

              <div className="install-section">
                <h4>3. Pull Your First Model</h4>
                <div className="code-block">
                  <code>ollama pull codellama:7b</code>
                  <button
                    onClick={() => navigator.clipboard.writeText('ollama pull codellama:7b')}
                    className="copy-code-button"
                  >
                    📋
                  </button>
                </div>
                <p>This downloads the CodeLlama 7B model (recommended for code generation)</p>
              </div>

              <div className="install-section">
                <h4>4. Verify Installation</h4>
                <button onClick={checkConnection} className="verify-button">
                  Test Connection
                </button>
                <p>Click to test if the AI IDE can connect to your Ollama installation.</p>
              </div>

              <div className="benefits-section">
                <h4>Why Use Local AI?</h4>
                <ul>
                  <li>🔒 <strong>Privacy:</strong> Your code never leaves your machine</li>
                  <li>💰 <strong>Cost-Free:</strong> No per-token charges or API costs</li>
                  <li>⚡ <strong>Always Available:</strong> Works offline, no internet required</li>
                  <li>🎛️ <strong>Full Control:</strong> Choose and customize your models</li>
                  <li>🔧 <strong>Customizable:</strong> Fine-tune models for your specific needs</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="settings-content">
              <h3>Ollama Settings</h3>

              <div className="setting-group">
                <h4>Connection</h4>
                <div className="setting-item">
                  <label>Ollama Server URL:</label>
                  <input
                    type="text"
                    value="http://localhost:11434"
                    disabled
                    className="setting-input"
                  />
                  <p className="setting-help">Currently only localhost is supported</p>
                </div>
              </div>

              <div className="setting-group">
                <h4>Current Model</h4>
                <div className="setting-item">
                  <label>Active Model:</label>
                  <select
                    value={currentModel}
                    onChange={(e) => handleSetCurrentModel(e.target.value)}
                    className="setting-select"
                    disabled={!isConnected}
                  >
                    {availableModels.map(model => (
                      <option key={model.name} value={model.name}>
                        {model.name} ({formatFileSize(model.size_vb)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="setting-group">
                <h4>Model Information</h4>
                {currentModel && availableModels.length > 0 && (
                  <div className="current-model-info">
                    {(() => {
                      const model = availableModels.find(m => m.name === currentModel);
                      return model ? (
                        <div className="model-info-details">
                          <div className="info-row">
                            <span>Family:</span>
                            <span>{model.details.family}</span>
                          </div>
                          <div className="info-row">
                            <span>Parameters:</span>
                            <span>{model.details.parameter_size}</span>
                          </div>
                          <div className="info-row">
                            <span>Quantization:</span>
                            <span>{model.details.quantization_level}</span>
                          </div>
                          <div className="info-row">
                            <span>Size:</span>
                            <span>{formatFileSize(model.size_vb)}</span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              <div className="setting-group">
                <h4>Performance Tips</h4>
                <div className="tips-list">
                  <div className="tip-item">
                    <strong>For faster responses:</strong> Use smaller models like tinyllama:1.1b
                  </div>
                  <div className="tip-item">
                    <strong>For better quality:</strong> Use larger models like codellama:13b-instruct
                  </div>
                  <div className="tip-item">
                    <strong>For code completion:</strong> codellama:7b-code is optimized for this task
                  </div>
                  <div className="tip-item">
                    <strong>Memory usage:</strong> Larger models require more RAM (7B ≈ 4GB, 13B ≈ 8GB)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};