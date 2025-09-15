import React, { useState, useRef, useEffect } from 'react';
import { AIMessage, AIProvider, AIModel } from '../types/ai';
import { enhancedAIService } from '../services/ai/EnhancedAIService';
import { hybridAIService, PlatformModel, UserCredits } from '../services/ai/HybridAIService';
import { conversationService, AIConversation } from '../services/ai/ConversationService';
import { authService } from '../services/auth/AuthService';
import './EnhancedAIChat.css';

interface EnhancedAIChatProps {
  onClose: () => void;
}

interface ChatSession {
  id?: string;
  title: string;
  messages: AIMessage[];
  totalCost: number;
  totalTokens: number;
}

export const EnhancedAIChat: React.FC<EnhancedAIChatProps> = ({ onClose }) => {
  const [currentSession, setCurrentSession] = useState<ChatSession>({
    title: 'New Chat',
    messages: [{
      role: 'assistant',
      content: 'Hello! I\'m your enhanced AI assistant with integrated cost tracking and conversation persistence. How can I help you today?',
      timestamp: new Date()
    }],
    totalCost: 0,
    totalTokens: 0
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [persistConversation, setPersistConversation] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [useMode, setUseMode] = useState<'own_keys' | 'platform_credits' | 'auto'>('auto');

  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [platformModels, setPlatformModels] = useState<PlatformModel[]>([]);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [showConversationsList, setShowConversationsList] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProviders();
    loadPlatformModels();
    loadConversations();
    checkAuth();

    // Listen for auth changes
    const unsubscribe = authService.onAuthStateChange((authState) => {
      setIsAuthenticated(authState.isAuthenticated);
      if (authState.isAuthenticated) {
        loadConversations();
        loadUserCredits();
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession.messages]);

  useEffect(() => {
    updateAvailableModels();
  }, [selectedProvider, providers]);

  const checkAuth = () => {
    const authState = authService.getAuthState();
    setIsAuthenticated(authState.isAuthenticated);
  };

  const loadProviders = () => {
    const allProviders = enhancedAIService.getProviders();
    setProviders(allProviders);

    // Set default selections from configured providers
    const configuredProviders = enhancedAIService.getConfiguredProviders();
    if (configuredProviders.length > 0) {
      const defaultProvider = configuredProviders[0];
      setSelectedProvider(defaultProvider.name);
      if (defaultProvider.models.length > 0) {
        setSelectedModel(defaultProvider.models[0].id);
      }
    }
  };

  const loadPlatformModels = async () => {
    await hybridAIService.loadPlatformModels();
    const models = hybridAIService.getPlatformModels();
    setPlatformModels(models);
  };

  const loadUserCredits = async () => {
    if (!isAuthenticated) return;
    await hybridAIService.loadUserCredits();
    const credits = hybridAIService.getUserCredits();
    setUserCredits(credits);
  };

  const loadConversations = async () => {
    if (!isAuthenticated) return;

    try {
      const convos = await conversationService.getConversationSummaries(20);
      setConversations(convos);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const updateAvailableModels = () => {
    const provider = providers.find(p => p.name === selectedProvider);
    if (provider) {
      // Combine own keys models and platform models
      const ownKeysModels = provider.models;
      const providerPlatformModels = platformModels
        .filter(m => m.provider === selectedProvider)
        .map(m => ({
          id: m.model_id,
          name: `${m.display_name} (Platform)`,
          contextLength: m.context_length,
          costPer1KTokens: {
            input: m.final_cost_per_1k_input_tokens,
            output: m.final_cost_per_1k_output_tokens
          },
          maxTokens: 4000,
          isPlatform: true
        }));

      const allModels = [...ownKeysModels, ...providerPlatformModels];
      setAvailableModels(allModels);

      // Update selected model if it's not available for the new provider
      if (allModels.length > 0 && !allModels.find(m => m.id === selectedModel)) {
        setSelectedModel(allModels[0].id);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setCurrentSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setInput('');
    setIsLoading(true);

    try {
      const selectedModelInfo = availableModels.find(m => m.id === selectedModel);
      const isPlatformModel = selectedModelInfo && 'isPlatform' in selectedModelInfo && selectedModelInfo.isPlatform;

      // Determine if we need to check provider configuration
      if (!isPlatformModel) {
        const provider = providers.find(p => p.name === selectedProvider);
        if (!provider?.isConfigured) {
          throw new Error(`Provider ${selectedProvider} is not configured. Please configure it in settings or use platform credits.`);
        }
      }

      const chatMessages = [...currentSession.messages, userMessage];

      if (streamingEnabled) {
        // Streaming response
        const streamingMessage: AIMessage = {
          role: 'assistant',
          content: '',
          timestamp: new Date()
        };

        setCurrentSession(prev => ({
          ...prev,
          messages: [...prev.messages, streamingMessage]
        }));

        await hybridAIService.chat(
          selectedProvider,
          selectedModel,
          chatMessages,
          {
            streaming: true,
            maxTokens,
            temperature,
            persistConversation,
            conversationId: currentSession.id,
            useMode,
            onStream: (response) => {
              if (!response.done) {
                setCurrentSession(prev => {
                  const newMessages = [...prev.messages];
                  const lastMessage = newMessages[newMessages.length - 1];
                  lastMessage.content += response.content;
                  return { ...prev, messages: newMessages };
                });
              } else {
                // Update final message with token/cost info
                setCurrentSession(prev => {
                  const newMessages = [...prev.messages];
                  const lastMessage = newMessages[newMessages.length - 1];
                  lastMessage.tokens = response.usage?.totalTokens || 0;
                  lastMessage.cost = response.usage?.cost || 0;

                  return {
                    ...prev,
                    messages: newMessages,
                    totalCost: prev.totalCost + (response.usage?.cost || 0),
                    totalTokens: prev.totalTokens + (response.usage?.totalTokens || 0)
                  };
                });

                // Reload user credits if using platform credits
                if (isPlatformModel || useMode === 'platform_credits') {
                  loadUserCredits();
                }
              }
            }
          }
        );
      } else {
        // Non-streaming response
        const assistantMessage = await hybridAIService.chat(
          selectedProvider,
          selectedModel,
          chatMessages,
          {
            maxTokens,
            temperature,
            persistConversation,
            conversationId: currentSession.id,
            useMode
          }
        );

        setCurrentSession(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          totalCost: prev.totalCost + (assistantMessage.cost || 0),
          totalTokens: prev.totalTokens + (assistantMessage.tokens || 0)
        }));

        // Reload user credits if using platform credits
        if (isPlatformModel || useMode === 'platform_credits') {
          loadUserCredits();
        }
      }

      // Generate title if it's a new conversation and we have enough messages
      if (!currentSession.id && currentSession.messages.length === 1) {
        const title = userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '');
        setCurrentSession(prev => ({ ...prev, title }));
      }

      // Reload conversations if persistence is enabled
      if (persistConversation && isAuthenticated) {
        loadConversations();
      }

    } catch (error) {
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      setCurrentSession(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewConversation = () => {
    setCurrentSession({
      title: 'New Chat',
      messages: [{
        role: 'assistant',
        content: 'Hello! How can I help you with your next question?',
        timestamp: new Date()
      }],
      totalCost: 0,
      totalTokens: 0
    });
    setShowConversationsList(false);
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const conversation = await conversationService.getConversation(conversationId);

      setCurrentSession({
        id: conversation.id,
        title: conversation.title,
        messages: conversation.messages,
        totalCost: conversation.total_cost,
        totalTokens: conversation.total_tokens
      });

      setShowConversationsList(false);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      alert('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await conversationService.deleteConversation(conversationId);
      await loadConversations();

      // If we're viewing the deleted conversation, start a new one
      if (currentSession.id === conversationId) {
        startNewConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation');
    }
  };

  const exportConversation = async () => {
    if (!currentSession.id) {
      alert('Please save the conversation first');
      return;
    }

    try {
      const exportData = await conversationService.exportConversation(currentSession.id);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${currentSession.title.replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export conversation:', error);
      alert('Failed to export conversation');
    }
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.001) return '<$0.001';
    return `$${cost.toFixed(3)}`;
  };

  const getSelectedModelInfo = () => {
    const provider = providers.find(p => p.name === selectedProvider);
    return provider?.models.find(m => m.id === selectedModel);
  };

  const modelInfo = getSelectedModelInfo();

  return (
    <div className="enhanced-ai-chat">
      <div className="chat-header">
        <div className="chat-title-section">
          <h3>{currentSession.title}</h3>
          <div className="session-stats">
            <span className="cost-indicator">Cost: {formatCost(currentSession.totalCost)}</span>
            <span className="tokens-indicator">Tokens: {currentSession.totalTokens.toLocaleString()}</span>
          </div>
        </div>

        <div className="header-actions">
          {isAuthenticated && (
            <button
              onClick={() => setShowConversationsList(!showConversationsList)}
              className="conversations-btn"
              title="Conversation history"
            >
              💬
            </button>
          )}

          <button onClick={startNewConversation} className="new-chat-btn" title="New chat">
            ➕
          </button>

          {currentSession.id && (
            <button onClick={exportConversation} className="export-btn" title="Export conversation">
              📥
            </button>
          )}

          <button onClick={onClose} className="close-btn">×</button>
        </div>
      </div>

      {showConversationsList && isAuthenticated && (
        <div className="conversations-list">
          <div className="conversations-header">
            <h4>Recent Conversations</h4>
            <button onClick={() => setShowConversationsList(false)}>×</button>
          </div>
          <div className="conversations-items">
            {conversations.length === 0 ? (
              <p>No conversations yet</p>
            ) : (
              conversations.map(conv => (
                <div key={conv.id} className="conversation-item">
                  <div
                    className="conversation-info"
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div className="conversation-title">{conv.title}</div>
                    <div className="conversation-meta">
                      <span>{conv.message_count} messages</span>
                      <span>{formatCost(conv.total_cost)}</span>
                      <span>{new Date(conv.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteConversation(conv.id)}
                    className="delete-conversation-btn"
                    title="Delete conversation"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="chat-settings">
        {/* Credits and Mode Selection */}
        {isAuthenticated && userCredits && (
          <div className="credits-section">
            <div className="credits-info">
              <span className="credits-balance">💰 Credits: ${userCredits.available_credits.toFixed(2)}</span>
              <span className="credits-used">Used: ${userCredits.used_credits.toFixed(2)}</span>
            </div>
            <div className="use-mode-selector">
              <label>Payment Mode:</label>
              <select
                value={useMode}
                onChange={(e) => setUseMode(e.target.value as 'own_keys' | 'platform_credits' | 'auto')}
                disabled={isLoading}
              >
                <option value="auto">🤖 Auto (Smart Selection)</option>
                <option value="own_keys">🔑 Use My API Keys</option>
                <option value="platform_credits">💳 Use Platform Credits</option>
              </select>
            </div>
          </div>
        )}

        <div className="settings-row">
          <div className="setting-group">
            <label>Provider:</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              disabled={isLoading}
            >
              {hybridAIService.getAvailableProviders().map(provider => (
                <option key={provider.provider} value={provider.provider}>
                  {provider.provider} {provider.hasOwnKeys ? '🔑' : ''} {provider.hasPlatformModels ? '💳' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label>Model:</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isLoading}
            >
              {availableModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="settings-row">
          <div className="setting-group">
            <label>Temperature:</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              disabled={isLoading}
            />
            <span>{temperature}</span>
          </div>

          <div className="setting-group">
            <label>Max Tokens:</label>
            <input
              type="number"
              min="100"
              max="4000"
              step="100"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="setting-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={streamingEnabled}
                onChange={(e) => setStreamingEnabled(e.target.checked)}
                disabled={isLoading}
              />
              Streaming Response
            </label>
          </div>

          {isAuthenticated && (
            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={persistConversation}
                  onChange={(e) => setPersistConversation(e.target.checked)}
                  disabled={isLoading}
                />
                Save Conversation
              </label>
            </div>
          )}
        </div>
      </div>

      {modelInfo && (
        <div className="model-info">
          <span className="model-name">🤖 {modelInfo.name}</span>
          <span className="model-context">📝 {modelInfo.contextLength.toLocaleString()} tokens</span>
          <span className="model-cost">💰 ${modelInfo.costPer1KTokens.input}/${ modelInfo.costPer1KTokens.output} per 1K tokens</span>
        </div>
      )}

      <div className="chat-messages">
        {currentSession.messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-header">
              <span className="message-role">
                {message.role === 'user' ? '👤 You' : '🤖 Assistant'}
              </span>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </span>
              {message.tokens && message.tokens > 0 && (
                <span className="message-tokens">{message.tokens} tokens</span>
              )}
              {message.cost && message.cost > 0 && (
                <span className="message-cost">{formatCost(message.cost)}</span>
              )}
            </div>
            <div className="message-content">
              <pre>{message.content}</pre>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant loading">
            <div className="message-header">
              <span className="message-role">🤖 Assistant</span>
              <span className="typing-indicator">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Shift+Enter for new line)"
          disabled={isLoading}
          rows={3}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="send-btn"
        >
          {isLoading ? '⏳' : '📤'}
        </button>
      </div>

      {!isAuthenticated && persistConversation && (
        <div className="auth-notice">
          💡 Sign in to save conversations and access platform credits
        </div>
      )}

      {!isAuthenticated && (
        <div className="platform-info">
          🚀 Sign in to access platform credits and ChatGPT-5, Claude 3.5, and other latest models!
        </div>
      )}

      {hybridAIService.getAvailableProviders().length === 0 && (
        <div className="config-warning">
          ⚠️ No AI providers available. Please configure API keys in settings or sign in for platform credits.
        </div>
      )}

      {isAuthenticated && userCredits && userCredits.available_credits <= 0 && useMode === 'platform_credits' && (
        <div className="credits-warning">
          ⚠️ No platform credits available. Switch to your own API keys or purchase credits.
        </div>
      )}
    </div>
  );
};