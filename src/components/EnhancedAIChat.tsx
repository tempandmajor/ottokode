import React, { useState, useRef, useEffect } from 'react';
import { AIMessage, AIProvider } from '../types/ai';
import { aiService } from '../services/ai/ResponsesAIService';
import { conversationService, AIConversation } from '../services/ai/ConversationService';
import { authService } from '../services/auth/AuthService';
import {
  CodeGenerationResponse,
  CodeReviewResponse,
  ErrorExplanationResponse,
  LearningResponse
} from '../types/responses-api';
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
      content: 'Hello! I\'m your enhanced AI assistant with structured response capabilities. How can I help you today?',
      timestamp: new Date()
    }],
    totalCost: 0,
    totalTokens: 0
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-5');
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [persistConversation, setPersistConversation] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [useMode, setUseMode] = useState<'general' | 'code'>('general');
  const [responseMode, setResponseMode] = useState<'normal' | 'structured'>('normal');
  const [structuredResponseType, setStructuredResponseType] = useState<'code_generation' | 'code_review' | 'error_explanation' | 'learning'>('code_generation');
  const [autoSelectModel, setAutoSelectModel] = useState(false);

  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [showConversationsList, setShowConversationsList] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProviders();
    loadConversations();
    checkAuth();

    // Listen for auth changes
    const unsubscribe = authService.subscribe(() => {
      checkAuth();
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAuth = () => {
    const authState = authService.getAuthState();
    setIsAuthenticated(authState.isAuthenticated);
  };

  const loadProviders = () => {
    const allProviders = aiService.getAvailableProviders();
    setProviders(allProviders);

    const configuredProviders = aiService.getConfiguredProviders();
    if (configuredProviders.length > 0) {
      setSelectedProvider(configuredProviders[0]);
    }
  };

  const loadConversations = async () => {
    if (!isAuthenticated) return;

    try {
      const userConversations = await conversationService.getUserConversations();
      setConversations(userConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setCurrentSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setInput('');
    setIsLoading(true);

    try {
      if (responseMode === 'structured' && aiService.isStructuredResponseSupported()) {
        await handleStructuredResponse(userMessage);
      } else {
        await handleNormalResponse(userMessage);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
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

  const handleStructuredResponse = async (userMessage: AIMessage) => {
    let structuredResponse: any;
    const optimalModel = selectBestModelForTask(structuredResponseType, userMessage.content.length);

    try {
      switch (structuredResponseType) {
        case 'code_generation':
          structuredResponse = await aiService.generateCodeWithStructure(
            userMessage.content,
            'typescript', // Default to TypeScript, could be made configurable
            { model: optimalModel }
          );
          break;
        case 'code_review':
          structuredResponse = await aiService.reviewCodeWithStructure(
            userMessage.content,
            'typescript',
            { model: optimalModel }
          );
          break;
        case 'error_explanation':
          structuredResponse = await aiService.explainErrorWithStructure(
            userMessage.content,
            'typescript',
            { model: optimalModel }
          );
          break;
        case 'learning':
          structuredResponse = await aiService.generateLearningContent(
            userMessage.content,
            'intermediate',
            { model: optimalModel }
          );
          break;
        default:
          throw new Error('Unsupported structured response type');
      }

      const formattedResponse = formatStructuredResponse(structuredResponse, structuredResponseType);

      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: formattedResponse,
        timestamp: new Date()
      };

      setCurrentSession(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage]
      }));

    } catch (error) {
      throw error;
    }
  };

  const handleNormalResponse = async (userMessage: AIMessage) => {
    const chatMessages = [...currentSession.messages, userMessage];
    const optimalModel = selectBestModelForTask('general', userMessage.content.length);

    try {
      const response = await aiService.complete(chatMessages, {
        provider: selectedProvider as AIProvider,
        model: optimalModel,
        temperature,
        maxTokens,
      });

      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      };

      setCurrentSession(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        totalTokens: prev.totalTokens + (response.usage?.totalTokens || 0)
      }));

    } catch (error) {
      throw error;
    }
  };

  const formatStructuredResponse = (response: any, type: string): string => {
    switch (type) {
      case 'code_generation':
        const codeResp = response as CodeGenerationResponse;
        return `**Generated Code:**\n\n\`\`\`${codeResp.language}\n${codeResp.code}\n\`\`\`\n\n**Explanation:**\n${codeResp.explanation}\n\n**Dependencies:**\n${codeResp.dependencies.join(', ')}\n\n**Best Practices:**\n${codeResp.best_practices.map(practice => `• ${practice}`).join('\n')}`;

      case 'code_review':
        const reviewResp = response as CodeReviewResponse;
        return `**Code Review - Overall Score: ${reviewResp.overall_score}/100**\n\n**Issues Found:**\n${
          reviewResp.issues.map(issue => `• Line ${issue.line}: **${issue.severity.toUpperCase()}** - ${issue.message}`).join('\n')
        }\n\n**Suggested Improvements:**\n${reviewResp.improvements.map(improvement => `• ${improvement}`).join('\n')}\n\n**Security Concerns:**\n${reviewResp.security_concerns.map(concern => `• ${concern}`).join('\n')}\n\n**Performance Tips:**\n${reviewResp.performance_tips.map(tip => `• ${tip}`).join('\n')}`;

      case 'error_explanation':
        const errorResp = response as ErrorExplanationResponse;
        return `**Error Analysis**\n\n**Error Type:** ${errorResp.error_type}\n\n**Root Causes:**\n${errorResp.causes.map(cause => `• ${cause}`).join('\n')}\n\n**Solutions:**\n${errorResp.fixes.map((fix, index) => `${index + 1}. ${fix}`).join('\n')}\n\n**Prevention Tips:**\n${errorResp.prevention_tips.map(tip => `• ${tip}`).join('\n')}\n\n**Related Concepts:**\n${errorResp.related_concepts.map(concept => `• ${concept}`).join('\n')}`;

      case 'learning':
        const learningResp = response as LearningResponse;
        return `**${learningResp.topic}** (${learningResp.difficulty})\n\n**Summary:**\n${learningResp.summary}\n\n**Key Points:**\n${learningResp.key_points.map(point => `• ${point}`).join('\n')}\n\n**Code Examples:**\n${learningResp.code_examples.map(example => `\`\`\`${example.language}\n${example.code}\n\`\`\`\n*${example.explanation}*`).join('\n\n')}\n\n**Practice Exercises:**\n${learningResp.exercises.map((exercise, index) => `${index + 1}. ${exercise.description}\n   *Difficulty: ${exercise.difficulty}*`).join('\n')}`;

      default:
        return JSON.stringify(response, null, 2);
    }
  };

  const newConversation = () => {
    setCurrentSession({
      title: 'New Chat',
      messages: [{
        role: 'assistant',
        content: 'Hello! I\'m your enhanced AI assistant with structured response capabilities. How can I help you today?',
        timestamp: new Date()
      }],
      totalCost: 0,
      totalTokens: 0
    });
  };

  const loadConversation = (conversation: AIConversation) => {
    setCurrentSession({
      id: conversation.id,
      title: conversation.title,
      messages: conversation.messages || [],
      totalCost: 0,
      totalTokens: 0
    });
    setShowConversationsList(false);
  };

  const getAvailableModels = () => {
    const config = aiService.getProviderConfig(selectedProvider as AIProvider);
    return config?.models || [];
  };

  const getModelDisplayInfo = (modelId: string) => {
    // Enhanced model display with capabilities and pricing
    const allProviders = aiService.getAvailableProviders();
    for (const provider of allProviders) {
      const config = aiService.getProviderConfig(provider);
      if (config?.models?.includes(modelId)) {
        // For now, return basic info - this would be enhanced with actual model metadata
        const modelNames: Record<string, any> = {
          'gpt-5': { name: 'GPT-5', provider: 'OpenAI', capabilities: ['Coding', 'Reasoning', 'Structured Output'], tier: 'Premium' },
          'claude-opus-4.1': { name: 'Claude Opus 4.1', provider: 'Anthropic', capabilities: ['Advanced Coding', 'Agentic Tasks', 'Hybrid Reasoning'], tier: 'Premium' },
          'claude-sonnet-4': { name: 'Claude Sonnet 4', provider: 'Anthropic', capabilities: ['Coding', 'Reasoning', 'Hybrid Mode'], tier: 'Standard' },
          'claude-3-5-sonnet-20241022': { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', capabilities: ['General', 'Coding'], tier: 'Standard' },
          'claude-3-haiku-20240307': { name: 'Claude 3 Haiku', provider: 'Anthropic', capabilities: ['Fast', 'Efficient'], tier: 'Economy' }
        };
        return modelNames[modelId] || { name: modelId, provider, capabilities: [], tier: 'Standard' };
      }
    }
    return { name: modelId, provider: 'Unknown', capabilities: [], tier: 'Standard' };
  };

  const selectBestModelForTask = (taskType: string, inputLength: number) => {
    // Auto-select best model based on task complexity (like Cursor's Auto-Select)
    if (!autoSelectModel) return selectedModel;

    const availableModels = getAvailableModels();

    // For complex coding tasks or long inputs, prefer premium models
    if ((taskType === 'code_generation' || taskType === 'code_review' || inputLength > 1000) &&
        availableModels.includes('claude-opus-4.1')) {
      return 'claude-opus-4.1';
    }

    // For structured responses, prefer models with structured output capability
    if (responseMode === 'structured' && availableModels.includes('gpt-5')) {
      return 'gpt-5';
    }

    // For general tasks, use standard models
    if (availableModels.includes('claude-sonnet-4')) {
      return 'claude-sonnet-4';
    }

    // Fallback to current selection
    return selectedModel;
  };

  return (
    <div className="enhanced-ai-chat">
      <div className="chat-header">
        <div className="header-left">
          <h2>AI Assistant</h2>
          <span className="model-badge">{selectedModel}</span>
        </div>

        <div className="header-controls">
          <button
            className="icon-button"
            onClick={() => setShowConversationsList(!showConversationsList)}
            title="Conversation History"
          >
            📋
          </button>

          <button
            className="icon-button"
            onClick={newConversation}
            title="New Conversation"
          >
            ➕
          </button>

          <button
            className="icon-button close-button"
            onClick={onClose}
            title="Close Chat"
          >
            ✕
          </button>
        </div>
      </div>

      {showConversationsList && (
        <div className="conversations-list">
          <h3>Recent Conversations</h3>
          {conversations.length === 0 ? (
            <p>No conversations yet</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className="conversation-item"
                onClick={() => loadConversation(conv)}
              >
                <div className="conversation-title">{conv.title}</div>
                <div className="conversation-date">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="chat-settings">
        <div className="setting-group">
          <label>Provider:</label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            {providers.map(provider => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>
        </div>

        <div className="setting-group">
          <div className="model-header">
            <label>Model:</label>
            <label className="auto-select-toggle">
              <input
                type="checkbox"
                checked={autoSelectModel}
                onChange={(e) => setAutoSelectModel(e.target.checked)}
              />
              Auto-Select
            </label>
          </div>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="model-selector"
            disabled={autoSelectModel}
          >
            {getAvailableModels().map(model => {
              const modelInfo = getModelDisplayInfo(model);
              return (
                <option key={model} value={model}>
                  {modelInfo.name} - {modelInfo.tier} ({modelInfo.capabilities.join(', ')})
                </option>
              );
            })}
          </select>
          {autoSelectModel && (
            <div className="auto-select-info">
              <small>Model will be automatically selected based on task complexity and requirements</small>
            </div>
          )}
        </div>

        <div className="setting-group">
          <label>Response Mode:</label>
          <select
            value={responseMode}
            onChange={(e) => setResponseMode(e.target.value as 'normal' | 'structured')}
          >
            <option value="normal">Normal</option>
            <option value="structured">Structured</option>
          </select>
        </div>

        {responseMode === 'structured' && (
          <div className="setting-group">
            <label>Response Type:</label>
            <select
              value={structuredResponseType}
              onChange={(e) => setStructuredResponseType(e.target.value as any)}
            >
              <option value="code_generation">Code Generation</option>
              <option value="code_review">Code Review</option>
              <option value="error_explanation">Error Explanation</option>
              <option value="learning">Learning Content</option>
            </select>
          </div>
        )}
      </div>

      <div className="chat-messages">
        {currentSession.messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role}`}
          >
            <div className="message-content">
              <div dangerouslySetInnerHTML={{
                __html: message.content.replace(/\n/g, '<br>').replace(/```(\w+)?\n([\s\S]*?)\n```/g, '<pre><code>$2</code></pre>')
              }} />
            </div>
            {message.timestamp && (
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="input-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="chat-input"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
      </form>

      <div className="chat-footer">
        <div className="session-stats">
          Tokens: {currentSession.totalTokens} |
          Messages: {currentSession.messages.length - 1}
        </div>
      </div>
    </div>
  );
};