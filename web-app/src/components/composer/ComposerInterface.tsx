"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Send,
  Bot,
  FileText,
  Code,
  Eye,
  Wand2,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  GitBranch,
  MessageSquare,
  Lightbulb,
  Zap,
  Brain,
  Target
} from 'lucide-react';

interface ComposerMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  files?: FileReference[];
  metadata?: {
    mode: ComposerMode;
    agentUsed?: string;
    executionTime?: number;
    tokensUsed?: number;
  };
}

interface FileReference {
  path: string;
  name: string;
  type: 'file' | 'directory';
  language?: string;
  size?: number;
  lastModified?: Date;
  selected: boolean;
  preview?: string;
}

interface ComposerOperation {
  id: string;
  type: 'create' | 'modify' | 'delete' | 'rename' | 'move';
  filePath: string;
  description: string;
  status: 'pending' | 'applying' | 'completed' | 'failed';
  preview?: string;
  diff?: string;
  error?: string;
}

type ComposerMode = 'ask' | 'edit' | 'agent';

interface ComposerState {
  mode: ComposerMode;
  selectedFiles: FileReference[];
  operations: ComposerOperation[];
  isProcessing: boolean;
  currentAgent?: string;
  context?: string;
}

interface ComposerInterfaceProps {
  onFilesChanged?: (files: FileReference[]) => void;
  onOperationCompleted?: (operation: ComposerOperation) => void;
}

const MODE_CONFIGS = {
  ask: {
    title: 'Ask Mode',
    description: 'Ask questions about your codebase',
    icon: MessageSquare,
    placeholder: 'Ask a question about your code...',
    color: 'bg-blue-100 text-blue-800'
  },
  edit: {
    title: 'Edit Mode',
    description: 'Make targeted changes to your files',
    icon: Code,
    placeholder: 'Describe the changes you want to make...',
    color: 'bg-green-100 text-green-800'
  },
  agent: {
    title: 'Agent Mode',
    description: 'Let AI agents handle complex tasks',
    icon: Bot,
    placeholder: 'Describe what you want to accomplish...',
    color: 'bg-purple-100 text-purple-800'
  }
};

export function ComposerInterface({ onFilesChanged, onOperationCompleted }: ComposerInterfaceProps) {
  const [state, setState] = useState<ComposerState>({
    mode: 'ask',
    selectedFiles: [],
    operations: [],
    isProcessing: false
  });

  const [messages, setMessages] = useState<ComposerMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<FileReference[]>([]);
  const [showOperationsPreview, setShowOperationsPreview] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock available files
  useEffect(() => {
    setAvailableFiles([
      {
        path: '/src/components/auth/LoginForm.tsx',
        name: 'LoginForm.tsx',
        type: 'file',
        language: 'typescript',
        size: 2340,
        lastModified: new Date(),
        selected: false,
        preview: 'import React from "react";\n\nexport function LoginForm() {\n  // Login form implementation\n}'
      },
      {
        path: '/src/components/auth/AuthProvider.tsx',
        name: 'AuthProvider.tsx',
        type: 'file',
        language: 'typescript',
        size: 1890,
        lastModified: new Date(),
        selected: false,
        preview: 'Context provider for authentication state...'
      },
      {
        path: '/src/hooks/useAuth.ts',
        name: 'useAuth.ts',
        type: 'file',
        language: 'typescript',
        size: 567,
        lastModified: new Date(),
        selected: false,
        preview: 'Custom hook for authentication logic...'
      },
      {
        path: '/src/types/auth.ts',
        name: 'auth.ts',
        type: 'file',
        language: 'typescript',
        size: 234,
        lastModified: new Date(),
        selected: false,
        preview: 'TypeScript types for authentication...'
      }
    ]);
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleModeChange = (mode: ComposerMode) => {
    setState(prev => ({ ...prev, mode }));
    setInputValue('');
  };

  const handleFileToggle = (filePath: string) => {
    const updatedFiles = availableFiles.map(file =>
      file.path === filePath
        ? { ...file, selected: !file.selected }
        : file
    );
    setAvailableFiles(updatedFiles);

    const selectedFiles = updatedFiles.filter(f => f.selected);
    setState(prev => ({ ...prev, selectedFiles }));
    onFilesChanged?.(selectedFiles);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || state.isProcessing) return;

    const userMessage: ComposerMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      files: state.selectedFiles,
      metadata: {
        mode: state.mode
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setState(prev => ({ ...prev, isProcessing: true }));

    // Simulate AI processing
    setTimeout(async () => {
      let assistantResponse: ComposerMessage;
      let operations: ComposerOperation[] = [];

      switch (state.mode) {
        case 'ask':
          assistantResponse = {
            id: `msg-${Date.now()}`,
            type: 'assistant',
            content: generateAskResponse(userMessage.content, state.selectedFiles),
            timestamp: new Date(),
            metadata: {
              mode: 'ask',
              executionTime: 2340,
              tokensUsed: 156
            }
          };
          break;

        case 'edit':
          operations = generateEditOperations(userMessage.content, state.selectedFiles);
          assistantResponse = {
            id: `msg-${Date.now()}`,
            type: 'assistant',
            content: generateEditResponse(operations),
            timestamp: new Date(),
            metadata: {
              mode: 'edit',
              executionTime: 4120,
              tokensUsed: 324
            }
          };
          setState(prev => ({ ...prev, operations }));
          if (operations.length > 0) {
            setShowOperationsPreview(true);
          }
          break;

        case 'agent':
          assistantResponse = {
            id: `msg-${Date.now()}`,
            type: 'assistant',
            content: generateAgentResponse(userMessage.content, state.selectedFiles),
            timestamp: new Date(),
            metadata: {
              mode: 'agent',
              agentUsed: 'workflow_coordinator',
              executionTime: 6780,
              tokensUsed: 542
            }
          };
          break;

        default:
          assistantResponse = {
            id: `msg-${Date.now()}`,
            type: 'assistant',
            content: 'I\'m ready to help! Please select a mode and describe what you need.',
            timestamp: new Date()
          };
      }

      setMessages(prev => [...prev, assistantResponse]);
      setState(prev => ({ ...prev, isProcessing: false }));
    }, 2000);
  };

  const generateAskResponse = (question: string, files: FileReference[]): string => {
    return `Based on your question about "${question}" and the ${files.length} selected files, here's what I found:

The authentication system appears to be well-structured with:
- **LoginForm.tsx**: Handles user input and validation
- **AuthProvider.tsx**: Manages authentication state across the app
- **useAuth.ts**: Provides authentication logic as a custom hook
- **auth.ts**: Defines TypeScript interfaces for type safety

The current implementation follows React best practices with proper separation of concerns. Would you like me to analyze any specific aspect in more detail?`;
  };

  const generateEditOperations = (description: string, files: FileReference[]): ComposerOperation[] => {
    return [
      {
        id: `op-${Date.now()}-1`,
        type: 'modify',
        filePath: '/src/components/auth/LoginForm.tsx',
        description: 'Add email validation to login form',
        status: 'pending',
        diff: `+ // Add email validation
+ const validateEmail = (email: string) => {
+   return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
+ };`
      },
      {
        id: `op-${Date.now()}-2`,
        type: 'modify',
        filePath: '/src/hooks/useAuth.ts',
        description: 'Add error handling for authentication',
        status: 'pending',
        diff: `+ const [authError, setAuthError] = useState<string | null>(null);
+
+ const handleAuthError = (error: Error) => {
+   setAuthError(error.message);
+   console.error('Auth error:', error);
+ };`
      }
    ];
  };

  const generateEditResponse = (operations: ComposerOperation[]): string => {
    return `I've analyzed your request and prepared ${operations.length} file modifications:

**Planned Changes:**
${operations.map(op => `- **${op.filePath}**: ${op.description}`).join('\n')}

These changes will improve your authentication system by adding validation and error handling. Review the changes in the preview panel and click "Apply All" when ready.`;
  };

  const generateAgentResponse = (task: string, files: FileReference[]): string => {
    return `I'll coordinate multiple agents to handle this task: "${task}"

**Agent Plan:**
1. **Code Analyzer** - Review current implementation
2. **Security Auditor** - Check authentication security
3. **Test Generator** - Create comprehensive tests
4. **Documentation Writer** - Update documentation

The agents will work together to ensure all aspects are covered. Estimated completion time: 8-12 minutes.

Would you like me to proceed with this plan?`;
  };

  const applyOperations = async () => {
    setState(prev => ({ ...prev, isProcessing: true }));

    // Simulate applying operations
    for (let i = 0; i < state.operations.length; i++) {
      const operation = state.operations[i];
      setState(prev => ({
        ...prev,
        operations: prev.operations.map(op =>
          op.id === operation.id ? { ...op, status: 'applying' } : op
        )
      }));

      await new Promise(resolve => setTimeout(resolve, 1000));

      setState(prev => ({
        ...prev,
        operations: prev.operations.map(op =>
          op.id === operation.id ? { ...op, status: 'completed' } : op
        )
      }));

      onOperationCompleted?.(operation);
    }

    setState(prev => ({ ...prev, isProcessing: false }));

    // Add confirmation message
    const confirmationMessage: ComposerMessage = {
      id: `msg-${Date.now()}`,
      type: 'system',
      content: `✅ Successfully applied ${state.operations.length} changes to your files.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, confirmationMessage]);

    setShowOperationsPreview(false);
    setState(prev => ({ ...prev, operations: [] }));
  };

  const clearOperations = () => {
    setState(prev => ({ ...prev, operations: [] }));
    setShowOperationsPreview(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / 1048576)} MB`;
  };

  const getLanguageIcon = (language: string) => {
    return <Code className="w-4 h-4" />;
  };

  const getCurrentModeConfig = () => MODE_CONFIGS[state.mode];

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {React.createElement(getCurrentModeConfig().icon, { className: "w-5 h-5" })}
            <h2 className="text-lg font-semibold">Composer</h2>
          </div>
          <Badge variant="outline" className={getCurrentModeConfig().color}>
            {getCurrentModeConfig().title}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFileSelector(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Files ({state.selectedFiles.length})
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="p-4 border-b">
        <Tabs value={state.mode} onValueChange={(value) => handleModeChange(value as ComposerMode)}>
          <TabsList className="grid w-full grid-cols-3">
            {Object.entries(MODE_CONFIGS).map(([mode, config]) => (
              <TabsTrigger key={mode} value={mode} className="flex items-center space-x-2">
                {React.createElement(config.icon, { className: "w-4 h-4" })}
                <span>{config.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-2 text-sm text-muted-foreground text-center">
            {getCurrentModeConfig().description}
          </div>
        </Tabs>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                {React.createElement(getCurrentModeConfig().icon, {
                  className: "w-12 h-12 text-muted-foreground"
                })}
              </div>
              <h3 className="text-lg font-medium mb-2">{getCurrentModeConfig().title}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {getCurrentModeConfig().description}. Select files and describe what you need.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.type === 'system'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-gray-50 border'
                }`}>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>

                  {message.files && message.files.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <div className="flex flex-wrap gap-1">
                        {message.files.map((file) => (
                          <Badge key={file.path} variant="secondary" className="text-xs">
                            {file.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.metadata && (
                    <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-70">
                      {message.metadata.executionTime && (
                        <span>⏱️ {message.metadata.executionTime}ms</span>
                      )}
                      {message.metadata.tokensUsed && (
                        <span className="ml-2">🔹 {message.metadata.tokensUsed} tokens</span>
                      )}
                      {message.metadata.agentUsed && (
                        <span className="ml-2">🤖 {message.metadata.agentUsed}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {state.isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {state.mode === 'ask' && 'Analyzing your question...'}
                    {state.mode === 'edit' && 'Planning file modifications...'}
                    {state.mode === 'agent' && 'Coordinating agents...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={getCurrentModeConfig().placeholder}
              className="min-h-[44px] max-h-32 resize-none pr-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || state.isProcessing}
              size="sm"
              className="absolute right-2 bottom-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {state.selectedFiles.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {state.selectedFiles.map((file) => (
              <Badge key={file.path} variant="outline" className="text-xs">
                {getLanguageIcon(file.language || '')}
                <span className="ml-1">{file.name}</span>
                <button
                  onClick={() => handleFileToggle(file.path)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* File Selector Dialog */}
      <Dialog open={showFileSelector} onOpenChange={setShowFileSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Files</DialogTitle>
            <DialogDescription>
              Choose files to include in your request
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {availableFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => handleFileToggle(file.path)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    file.selected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getLanguageIcon(file.language || '')}
                      <div>
                        <div className="font-medium text-sm">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{file.path}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.size && (
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                      )}
                      {file.selected && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Operations Preview Dialog */}
      <Dialog open={showOperationsPreview} onOpenChange={setShowOperationsPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview Changes</DialogTitle>
            <DialogDescription>
              Review the planned changes before applying them
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {state.operations.map((operation) => (
                <Card key={operation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {operation.type}
                        </Badge>
                        <span className="font-medium text-sm">{operation.filePath}</span>
                      </div>
                      <Badge variant="outline" className={
                        operation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        operation.status === 'applying' ? 'bg-blue-100 text-blue-800' :
                        operation.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {operation.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {operation.description}
                    </p>
                    {operation.diff && (
                      <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                        <pre>{operation.diff}</pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={clearOperations}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={applyOperations} disabled={state.isProcessing}>
              {state.isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Apply All
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}