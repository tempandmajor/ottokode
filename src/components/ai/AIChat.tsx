import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Code,
  Copy,
  Check,
  Trash2,
  Settings,
  RefreshCw,
  Zap,
  MessageSquare,
  FileText,
  Bug,
  Lightbulb
} from 'lucide-react';
import { aiService, type AIMessage, type AIProvider } from '../../services/ai/AIService';

interface AIChatProps {
  onSettingsClick?: () => void;
  selectedCode?: string;
  currentFile?: {
    path: string;
    language: string;
    content: string;
  };
}

interface ChatMessage extends AIMessage {
  id: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  requiresCode?: boolean;
}

export const AIChat: React.FC<AIChatProps> = ({
  onSettingsClick,
  selectedCode,
  currentFile
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('openai');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'explain',
      label: 'Explain Code',
      icon: <FileText size={16} />,
      prompt: 'Please explain this code and what it does:',
      requiresCode: true
    },
    {
      id: 'optimize',
      label: 'Optimize',
      icon: <Zap size={16} />,
      prompt: 'Please optimize this code for better performance and readability:',
      requiresCode: true
    },
    {
      id: 'bugs',
      label: 'Find Bugs',
      icon: <Bug size={16} />,
      prompt: 'Please analyze this code for potential bugs and issues:',
      requiresCode: true
    },
    {
      id: 'refactor',
      label: 'Refactor',
      icon: <RefreshCw size={16} />,
      prompt: 'Please refactor this code to improve its structure and maintainability:',
      requiresCode: true
    },
    {
      id: 'generate',
      label: 'Generate Code',
      icon: <Code size={16} />,
      prompt: 'Please generate code for:',
      requiresCode: false
    },
    {
      id: 'suggest',
      label: 'Suggestions',
      icon: <Lightbulb size={16} />,
      prompt: 'Please provide suggestions for improving this code:',
      requiresCode: true
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setCurrentProvider(aiService.getCurrentProvider());
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (content: string, role: 'user' | 'assistant', error?: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      error
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content || isLoading) return;

    // Check if any provider is configured
    const configuredProviders = aiService.getConfiguredProviders();
    if (configuredProviders.length === 0) {
      addMessage('', 'assistant', 'No AI providers are configured. Please configure at least one provider in settings.');
      return;
    }

    setInput('');
    setIsLoading(true);

    // Add user message
    const userMessageId = addMessage(content, 'user');

    // Add loading assistant message
    const assistantMessageId = addMessage('', 'assistant');
    updateMessage(assistantMessageId, { isLoading: true });

    try {
      // Prepare conversation context
      const conversationMessages: AIMessage[] = [
        {
          role: 'system',
          content: 'You are an AI coding assistant. Help with code-related questions, explanations, debugging, and generation. Be concise but thorough in your responses.'
        },
        ...messages.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content }
      ];

      const response = await aiService.complete(conversationMessages, {
        provider: currentProvider,
        temperature: 0.7,
        maxTokens: 2000
      });

      updateMessage(assistantMessageId, {
        content: response.content,
        isLoading: false
      });

    } catch (error) {
      updateMessage(assistantMessageId, {
        content: '',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get AI response'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    let prompt = action.prompt;

    if (action.requiresCode) {
      const codeToUse = selectedCode || currentFile?.content;
      if (!codeToUse) {
        addMessage('', 'assistant', 'No code selected or available. Please select some code or open a file first.');
        return;
      }

      const language = currentFile?.language || 'code';
      prompt += `\n\n\`\`\`${language}\n${codeToUse}\n\`\`\``;
    }

    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    if (isSystem) return null;

    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} space-x-2`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-600 ml-2' : 'bg-gray-600 mr-2'
          }`}>
            {isUser ? (
              <User size={16} className="text-white" />
            ) : (
              <Bot size={16} className="text-white" />
            )}
          </div>

          {/* Message content */}
          <div className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
          }`}>
            {message.isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            ) : message.error ? (
              <div className="text-red-600 dark:text-red-400">
                <p className="font-medium">Error:</p>
                <p className="text-sm">{message.error}</p>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>
            )}

            {/* Message actions */}
            {!isUser && !message.isLoading && !message.error && message.content && (
              <div className="flex items-center justify-end space-x-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => copyToClipboard(message.content, message.id)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Copy message"
                >
                  {copiedMessageId === message.id ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Bot className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">AI Assistant</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Powered by {aiService.getProviderConfig(currentProvider)?.name || 'AI'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Clear chat"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onSettingsClick}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="AI Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-wrap gap-2">
          {quickActions.map(action => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              disabled={action.requiresCode && !selectedCode && !currentFile?.content}
              className="flex items-center space-x-1 px-3 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        {selectedCode && (
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            📝 {selectedCode.length} characters selected
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h4 className="text-lg font-medium mb-2">AI Assistant Ready</h4>
            <p className="text-sm mb-4">
              Ask questions about your code, request explanations, or get help with development tasks.
            </p>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Try selecting some code and using the quick actions above, or start a conversation below.
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your code, request explanations, or get coding help..."
            rows={1}
            className="flex-1 resize-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{aiService.getConfiguredProviders().length} provider(s) available</span>
        </div>
      </div>
    </div>
  );
};