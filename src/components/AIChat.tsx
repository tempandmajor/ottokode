import React, { useState, useRef, useEffect } from 'react';
import { AIMessage, AIProvider, AIModel } from '../types/ai';
import { aiProviderService } from '../services/ai/AIProviderService';
import { secureAIService } from '../services/ai/SecureAIService';
import { mcpRegistry } from '../services/mcp/MCPRegistry';
import './AIChat.css';

interface AIChatProps {
  onClose: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI coding assistant with access to MCP servers for Stripe, Supabase, Vercel, and more. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('local');
  const [selectedModel, setSelectedModel] = useState('ottokode-assistant');
  const [includeMCP, setIncludeMCP] = useState(false);
  const [streamingEnabled, setStreamingEnabled] = useState(false);
  const [currentCost, setCurrentCost] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usageLimits, setUsageLimits] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);

  useEffect(() => {
    loadProviders();
    checkAuthentication();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    updateAvailableModels();
  }, [selectedProvider, providers]);

  const loadProviders = async () => {
    const allProviders = aiProviderService.getProviders();

    // Add secure providers
    const secureProviders = await secureAIService.getAvailableProviders();

    // Always ensure local provider is available
    const localProvider: AIProvider = {
      name: 'local',
      displayName: 'Ottokode AI (Free)',
      models: [{
        id: 'ottokode-assistant',
        name: 'Ottokode Assistant',
        provider: 'local',
        contextLength: 4000,
        costPer1KTokens: { input: 0, output: 0 },
        capabilities: {
          chat: true,
          completion: true,
          codeGeneration: true,
          functionCalling: false,
          vision: false,
          reasoning: true
        }
      }],
      isConfigured: true,
      supportsStreaming: false,
      supportsCodeCompletion: true,
      supportsFunctionCalling: false
    };

    const mergedProviders = [localProvider, ...allProviders];
    setProviders(mergedProviders);

    // Set default to local provider
    setSelectedProvider('local');
    setSelectedModel('ottokode-assistant');
  };

  const updateAvailableModels = () => {
    const provider = providers.find(p => p.name === selectedProvider);
    if (provider) {
      setAvailableModels(provider.models);
      if (provider.models.length > 0 && !provider.models.find(m => m.id === selectedModel)) {
        setSelectedModel(provider.models[0].id);
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

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use secure AI service for all requests
      const response = await secureAIService.chat({
        provider: selectedProvider as any,
        model: selectedModel,
        messages: [...messages, userMessage],
        options: {
          maxTokens: 2000,
          temperature: 0.7,
          stream: false
        }
      });

      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: response.timestamp,
        tokens: response.tokens,
        cost: response.cost || 0
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (assistantMessage.cost) {
        setCurrentCost(prev => prev + assistantMessage.cost!);
      }

      // Update usage limits
      await loadUsageLimits();

    } catch (error) {
      let errorContent = `Error: ${error}`;

      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          errorContent = '🔐 **Authentication Required**\n\nTo use AI features, please sign in to your account. This enables:\n• Usage tracking and limits\n• Access to premium AI models\n• Conversation history\n\nClick the sign-in button in the top right corner to continue.';
        } else if (error.message.includes('Usage limit exceeded')) {
          errorContent = '📊 **Usage Limit Reached**\n\nYou\'ve reached your daily AI usage limit. Limits reset every 24 hours.\n\n**Free Tier Limits:**\n• 50,000 tokens per day\n• $1.00 cost limit per day\n\nUpgrade your account for higher limits and priority access.';
        }
      }

      const errorMessage: AIMessage = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date()
    }]);
    setCurrentCost(0);
  };

  const formatCost = (cost: number) => {
    return cost < 0.01 ? `<$0.01` : `$${cost.toFixed(3)}`;
  };

  const getAvailableTools = () => {
    if (!includeMCP) return [];
    return mcpRegistry.getAvailableTools();
  };

  const insertExample = (example: string) => {
    setInput(example);
  };

  const checkAuthentication = async () => {
    const authStatus = await secureAIService.isAuthenticated();
    setIsAuthenticated(authStatus);

    if (authStatus) {
      await loadUsageLimits();
    }
  };

  const loadUsageLimits = async () => {
    try {
      const limits = await secureAIService.getUsageLimits();
      setUsageLimits(limits);
    } catch (error) {
      console.warn('Could not load usage limits:', error);
    }
  };

  const examplePrompts = [
    "Help me create a React component",
    "Explain async/await in JavaScript",
    "Show me TypeScript best practices",
    "How do I handle errors in Node.js?",
    "Generate a REST API endpoint",
    "Debug this code for me"
  ];

  return (
    <div className="ai-chat">
      <div className="chat-header">
        <div className="chat-title">
          <h3>AI Assistant</h3>
          <div className="status-indicators">
            <span className="cost-indicator">Cost: {formatCost(currentCost)}</span>
            {isAuthenticated && usageLimits && (
              <span className="usage-indicator">
                Tokens: {(usageLimits.dailyTokenLimit - usageLimits.remainingTokens).toLocaleString()}/{usageLimits.dailyTokenLimit.toLocaleString()}
              </span>
            )}
            {!isAuthenticated && (
              <span className="auth-indicator">⚠️ Not signed in</span>
            )}
          </div>
        </div>
        <div className="chat-controls">
          <button onClick={clearChat} className="clear-btn" title="Clear chat">
            🗑️
          </button>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
      </div>

      <div className="chat-settings">
        <div className="setting-group">
          <label>Provider:</label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            disabled={isLoading}
          >
            {providers.filter(p => p.isConfigured).map(provider => (
              <option key={provider.name} value={provider.name}>
                {provider.displayName} {provider.name === 'local' ? '(Free)' : isAuthenticated ? '(Premium)' : '(Requires Sign In)'}
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

        <div className="setting-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeMCP}
              onChange={(e) => setIncludeMCP(e.target.checked)}
              disabled={isLoading || selectedProvider === 'local'}
            />
            Enable MCP Tools {selectedProvider === 'local' ? '(Premium only)' : ''}
          </label>
        </div>

        <div className="setting-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={streamingEnabled}
              onChange={(e) => setStreamingEnabled(e.target.checked)}
              disabled={isLoading}
            />
            Streaming
          </label>
        </div>
      </div>

      {includeMCP && (
        <div className="mcp-status">
          <span className="mcp-label">Available MCP Tools:</span>
          <div className="mcp-tools">
            {getAvailableTools().map(tool => (
              <span key={`${tool.serverName}-${tool.toolName}`} className="mcp-tool">
                {tool.serverName}:{tool.toolName}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="example-prompts">
        <span className="examples-label">Quick examples:</span>
        <div className="examples-grid">
          {examplePrompts.map((example, index) => (
            <button 
              key={index}
              className="example-btn"
              onClick={() => insertExample(example)}
              disabled={isLoading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-header">
              <span className="message-role">
                {message.role === 'user' ? '👤 You' : '🤖 Assistant'}
              </span>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </span>
              {message.cost && (
                <span className="message-cost">
                  {formatCost(message.cost)}
                </span>
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
              <span className="typing-indicator">typing...</span>
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

      {!isAuthenticated && selectedProvider !== 'local' && (
        <div className="config-warning">
          🔐 Sign in required for premium AI providers. Using free Ottokode AI assistant.
        </div>
      )}

      {isAuthenticated && usageLimits && usageLimits.remainingTokens < 1000 && (
        <div className="usage-warning">
          ⚠️ You're approaching your daily usage limit. {usageLimits.remainingTokens} tokens remaining.
        </div>
      )}
    </div>
  );
};