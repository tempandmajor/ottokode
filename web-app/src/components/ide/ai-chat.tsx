'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Bot, User, Code, Lightbulb, Zap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeSnippet?: string;
}

interface AIChatProps {
  onCodeSuggestion?: (code: string) => void;
}

export function AIChat({ onCodeSuggestion }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI coding assistant. I can help you with code completion, debugging, refactoring, and answering programming questions. What would you like to work on?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use real AI service
      const { aiService } = await import('@/lib/ai-providers');

      const chatMessages = messages.concat(userMessage).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      const aiResponse = await aiService.generateResponse(chatMessages);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.content,
        codeSnippet: aiResponse.codeSnippet,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI response error:', error);

      // Fallback to mock response
      const aiResponse = generateAIResponse(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I'm having trouble connecting to AI services right now. Here's a helpful response: ${aiResponse.content}`,
        codeSnippet: aiResponse.codeSnippet,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userInput: string): { content: string; codeSnippet?: string } => {
    const input = userInput.toLowerCase();

    if (input.includes('function') || input.includes('create')) {
      return {
        content: 'I can help you create a function! Here\'s a template with TypeScript types and error handling:',
        codeSnippet: `function ${input.includes('async') ? 'async ' : ''}processData(data: any[]): ${input.includes('async') ? 'Promise<' : ''}any${input.includes('async') ? '>' : ''} {
  try {
    // Validate input
    if (!Array.isArray(data)) {
      throw new Error('Input must be an array');
    }

    // Process your data here
    const result = data.map(item => {
      // Add your processing logic
      return item;
    });

    return result;
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
}`
      };
    }

    if (input.includes('react') || input.includes('component')) {
      return {
        content: 'Here\'s a modern React component with TypeScript and proper styling:',
        codeSnippet: `interface MyComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export function MyComponent({ title, description, onAction }: MyComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onAction?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg border">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-2">{description}</p>
      )}
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className="mt-4"
      >
        {isLoading ? 'Loading...' : 'Action'}
      </Button>
    </div>
  );
}`
      };
    }

    if (input.includes('debug') || input.includes('error') || input.includes('fix')) {
      return {
        content: 'Here are some common debugging techniques and error handling patterns:',
        codeSnippet: `// 1. Add comprehensive logging
console.log('Function called with:', { param1, param2 });

// 2. Use try-catch for error handling
try {
  const result = riskyOperation();
  console.log('Success:', result);
} catch (error) {
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
}

// 3. Validate inputs
function validateInput(input: any): boolean {
  if (input == null) {
    throw new Error('Input cannot be null or undefined');
  }
  return true;
}`
      };
    }

    if (input.includes('optimize') || input.includes('performance')) {
      return {
        content: 'Here are some performance optimization techniques:',
        codeSnippet: `// 1. Use React.memo for component optimization
const OptimizedComponent = React.memo(({ data }) => {
  return <div>{data.name}</div>;
});

// 2. Implement useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// 3. Use useCallback for event handlers
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);

// 4. Debounce user input
const debouncedSearch = useMemo(
  () => debounce((term: string) => {
    performSearch(term);
  }, 300),
  []
);`
      };
    }

    // Default responses
    const responses = [
      'I\'d be happy to help with that! Can you provide more details about what you\'re trying to accomplish?',
      'That\'s an interesting question! Here\'s what I would suggest based on best practices...',
      'Great question! Let me break this down for you with some practical examples.',
      'I can definitely help with that. Here\'s a clean and efficient approach:'
    ];

    return {
      content: responses[Math.floor(Math.random() * responses.length)]
    };
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center">
          <Bot className="h-4 w-4 mr-2 text-ai-primary" />
          Otto
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-ai-primary/10 text-ai-primary'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                <div className={`flex-1 space-y-2 ${
                  message.role === 'user' ? 'text-right' : ''
                }`}>
                  <div
                    className={`inline-block px-3 py-2 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                    dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                  />

                  {message.codeSnippet && (
                    <div className="bg-background border rounded-lg p-3 font-mono text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Code className="h-3 w-3" />
                          <span className="text-xs text-muted-foreground">Code Suggestion</span>
                        </div>
                        {onCodeSuggestion && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onCodeSuggestion(message.codeSnippet!)}
                            className="h-6 text-xs"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Insert
                          </Button>
                        )}
                      </div>
                      <pre className="text-xs overflow-x-auto">
                        <code>{message.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-ai-primary/10 text-ai-primary flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-ai-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-ai-primary rounded-full animate-bounce-delay-100"></div>
                    <div className="w-2 h-2 bg-ai-primary rounded-full animate-bounce-delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask me anything about code..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              size="sm"
              className="bg-ai-primary hover:bg-ai-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {['Create a function', 'Debug this code', 'Optimize performance', 'React component'].map((suggestion) => (
              <Button
                key={suggestion}
                variant="ghost"
                size="sm"
                className="text-xs h-6"
                onClick={() => setInput(suggestion)}
                disabled={isLoading}
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}