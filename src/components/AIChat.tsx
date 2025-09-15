import React, { useState, useRef, useEffect } from 'react';
import { AIMessage, AIProvider, AIModel } from '../types/ai';
import { aiProviderService } from '../services/ai/AIProviderService';
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
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [includeMCP, setIncludeMCP] = useState(true);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [currentCost, setCurrentCost] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    updateAvailableModels();
  }, [selectedProvider, providers]);

  const loadProviders = () => {
    const allProviders = aiProviderService.getProviders();
    setProviders(allProviders);
    
    // Set default selections
    const configuredProviders = aiProviderService.getConfiguredProviders();
    if (configuredProviders.length > 0) {
      setSelectedProvider(configuredProviders[0].name);
    }
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
      const provider = providers.find(p => p.name === selectedProvider);
      if (!provider?.isConfigured) {
        throw new Error(`Provider ${selectedProvider} is not configured. Please configure it in settings.`);
      }

      let assistantMessage: AIMessage;

      if (streamingEnabled) {
        // Streaming response
        const streamingMessage: AIMessage = {
          role: 'assistant',
          content: '',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, streamingMessage]);

        await aiProviderService.chat(
          selectedProvider,
          selectedModel,
          [...messages, userMessage],
          {
            streaming: true,
            includeMCP,
            onStream: (response) => {
              if (!response.done) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  lastMessage.content += response.content;
                  return newMessages;
                });
              } else {
                // Final message with usage info
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  lastMessage.tokens = response.usage?.totalTokens;
                  lastMessage.cost = response.usage?.cost;
                  return newMessages;
                });
                if (response.usage?.cost) {
                  setCurrentCost(prev => prev + response.usage!.cost);
                }
              }
            }
          }
        );
      } else {
        // Non-streaming response
        assistantMessage = await aiProviderService.chat(
          selectedProvider,
          selectedModel,
          [...messages, userMessage],
          { includeMCP }
        );

        setMessages(prev => [...prev, assistantMessage]);
        if (assistantMessage.cost) {
          setCurrentCost(prev => prev + assistantMessage.cost!);
        }
      }
    } catch (error) {
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: `Error: ${error}`,
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

  const examplePrompts = [
    "Create a Stripe customer for john@example.com",
    "List my recent Vercel deployments",
    "Query users table from Supabase",
    "Show me the analytics for my project",
    "Help me refactor this React component",
    "Generate a TypeScript interface for this API"
  ];

  return (
    <div className="ai-chat">
      <div className="chat-header">
        <div className="chat-title">
          <h3>AI Assistant</h3>
          <span className="cost-indicator">Cost: {formatCost(currentCost)}</span>
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
                {provider.displayName}
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
              disabled={isLoading}
            />
            Enable MCP Tools
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

      {!providers.some(p => p.isConfigured) && (
        <div className="config-warning">
          ⚠️ No AI providers configured. Please configure at least one provider in the Setup Guide.
        </div>
      )}
    </div>
  );
};