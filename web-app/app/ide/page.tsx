'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code,
  Play,
  Save,
  Settings,
  Terminal,
  MessageCircle,
  FolderOpen,
  Download
} from 'lucide-react';

import { MonacoEditor } from '@/components/ide/monaco-editor';
import { FileExplorer, FileNode } from '@/components/ide/file-explorer';
import { AIChat } from '@/components/ide/ai-chat';
import { useAuth } from '@/components/auth/auth-provider';
import { UserMenu } from '@/components/auth/user-menu';

// Force dynamic rendering to avoid SSR issues with Supabase client
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function IDEPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [files, setFiles] = useState<FileNode[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      children: [
        {
          id: '2',
          name: 'main.ts',
          type: 'file',
          content: `// Welcome to Ottokode IDE
console.log('Hello, World!');

// Your AI-powered coding environment
function createAmazing(): string {
  return "Let's build something incredible!";
}

// AI-powered suggestions will appear as you type
interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  try {
    const response = await fetch(\`/api/users/\${id}\`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}`
        },
        {
          id: '3',
          name: 'utils.ts',
          type: 'file',
          content: `// Utility functions
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}`
        },
        {
          id: '4',
          name: 'components.tsx',
          type: 'file',
          content: `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors';
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
  };

  return (
    <button
      className={\`\${baseStyles} \${variantStyles[variant]}\`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}`
        }
      ]
    },
    {
      id: '5',
      name: 'package.json',
      type: 'file',
      content: `{
  "name": "ottokode-project",
  "version": "1.0.0",
  "description": "modern development project",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.0.0",
    "next": "^14.0.0",
    "typescript": "^5.0.0"
  }
}`
    },
    {
      id: '6',
      name: 'README.md',
      type: 'file',
      content: `# Ottokode Project

This is an modern development project created with Ottokode IDE.

## Features

- ✨ AI-powered code completion
- 🔧 Intelligent debugging assistance
- 🚀 Automated refactoring suggestions
- 📝 Smart documentation generation

## Getting Started

1. Install dependencies: \`npm install\`
2. Start development server: \`npm run dev\`
3. Open your browser and start coding!

## AI Assistant

Use the AI chat panel to:
- Ask questions about your code
- Get optimization suggestions
- Debug issues
- Learn new patterns

Happy coding! 🎉`
    }
  ]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleFileSelect = useCallback((file: FileNode) => {
    setActiveFile(file);
    if (!openFiles.find(f => f.id === file.id)) {
      setOpenFiles(prev => [...prev, file]);
    }
  }, [openFiles]);

  const handleFileCreate = useCallback((parentId: string | null, name: string, type: 'file' | 'folder') => {
    const newFile: FileNode = {
      id: Date.now().toString(),
      name,
      type,
      content: type === 'file' ? '// New file\n' : undefined,
      children: type === 'folder' ? [] : undefined
    };

    setFiles(prev => {
      if (!parentId) {
        return [...prev, newFile];
      }

      const addToParent = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.id === parentId && node.type === 'folder') {
            return {
              ...node,
              children: [...(node.children || []), newFile]
            };
          }
          if (node.children) {
            return {
              ...node,
              children: addToParent(node.children)
            };
          }
          return node;
        });
      };

      return addToParent(prev);
    });
  }, []);

  const handleFileDelete = useCallback((fileId: string) => {
    setFiles(prev => {
      const removeFile = (nodes: FileNode[]): FileNode[] => {
        return nodes.filter(node => {
          if (node.id === fileId) return false;
          if (node.children) {
            node.children = removeFile(node.children);
          }
          return true;
        });
      };
      return removeFile(prev);
    });

    setOpenFiles(prev => prev.filter(f => f.id !== fileId));
    if (activeFile?.id === fileId) {
      setActiveFile(openFiles[0] || null);
    }
  }, [activeFile, openFiles]);

  const handleCodeChange = useCallback((newCode: string) => {
    if (activeFile) {
      setActiveFile({ ...activeFile, content: newCode });
      setFiles(prev => {
        const updateFile = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
            if (node.id === activeFile.id) {
              return { ...node, content: newCode };
            }
            if (node.children) {
              return { ...node, children: updateFile(node.children) };
            }
            return node;
          });
        };
        return updateFile(prev);
      });
    }
  }, [activeFile]);

  const handleCodeSuggestion = useCallback((code: string) => {
    if (activeFile) {
      const newCode = (activeFile.content || '') + '\n\n' + code;
      handleCodeChange(newCode);
    }
  }, [activeFile, handleCodeChange]);

  const closeFile = useCallback((fileId: string) => {
    setOpenFiles(prev => prev.filter(f => f.id !== fileId));
    if (activeFile?.id === fileId) {
      const remainingFiles = openFiles.filter(f => f.id !== fileId);
      setActiveFile(remainingFiles[0] || null);
    }
  }, [activeFile, openFiles]);

  const runCode = useCallback(() => {
    // Simulate code execution
    console.log('Running code...', activeFile?.content);
    // In a real IDE, this would execute the code
  }, [activeFile]);

  const saveFile = useCallback(() => {
    // Simulate saving
    console.log('Saving file...', activeFile?.name);
    // In a real IDE, this would save to the filesystem
  }, [activeFile]);

  return (
    <div className="min-h-screen bg-background">
      {/* IDE Header */}
      <div className="border-b bg-card">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
              Ottokode IDE
            </h1>
            <Badge variant="outline" className="border-ai-primary/20">
              Web Version
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={saveFile} disabled={!activeFile}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button size="sm" className="bg-ai-primary hover:bg-ai-primary/90" onClick={runCode} disabled={!activeFile}>
              <Play className="h-4 w-4 mr-2" />
              Run
            </Button>
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Sidebar */}
        <div className="w-80 border-r">
          <Tabs defaultValue="files" className="h-full">
            <TabsList className="grid w-full grid-cols-2 bg-sidebar">
              <TabsTrigger value="files" className="text-xs">
                <FolderOpen className="h-3 w-3 mr-1" />
                Explorer
              </TabsTrigger>
              <TabsTrigger value="terminal" className="text-xs">
                <Terminal className="h-3 w-3 mr-1" />
                Terminal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="h-full p-0">
              <FileExplorer
                files={files}
                onFileSelect={handleFileSelect}
                onFileCreate={handleFileCreate}
                onFileDelete={handleFileDelete}
                selectedFileId={activeFile?.id}
              />
            </TabsContent>

            <TabsContent value="terminal" className="p-4">
              <div className="space-y-3">
                <div className="text-sm font-medium">Integrated Terminal</div>
                <div className="bg-black rounded-md p-3 font-mono text-sm text-green-400 h-64 overflow-y-auto">
                  <div>$ npm run dev</div>
                  <div className="text-gray-400">Starting development server...</div>
                  <div className="text-green-400">✓ Ready on http://localhost:3001</div>
                  <div className="text-gray-400">✓ TypeScript compilation complete</div>
                  <div className="text-blue-400">✓ AI assistant initialized</div>
                  <div className="text-yellow-400">⚡ Hot reload enabled</div>
                  <div className="cursor-blink">$ _</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* File Tabs */}
          <div className="flex items-center border-b bg-muted/30 px-4 py-2 overflow-x-auto">
            <div className="flex space-x-2">
              {openFiles.map((file) => (
                <div
                  key={file.id}
                  className={`bg-card border rounded-md px-3 py-1 text-sm flex items-center cursor-pointer ${
                    activeFile?.id === file.id ? 'border-ai-primary bg-ai-primary/5' : ''
                  }`}
                  onClick={() => setActiveFile(file)}
                >
                  <Code className="h-3 w-3 mr-2" />
                  {file.name}
                  <button
                    className="ml-2 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFile(file.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1">
            {activeFile ? (
              <MonacoEditor
                value={activeFile.content || ''}
                onChange={handleCodeChange}
                language={
                  activeFile.name.endsWith('.ts') || activeFile.name.endsWith('.tsx') ? 'typescript' :
                  activeFile.name.endsWith('.js') || activeFile.name.endsWith('.jsx') ? 'javascript' :
                  activeFile.name.endsWith('.css') ? 'css' :
                  activeFile.name.endsWith('.html') ? 'html' :
                  activeFile.name.endsWith('.json') ? 'json' :
                  activeFile.name.endsWith('.md') ? 'markdown' : 'plaintext'
                }
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a file to start editing</p>
                  <p className="text-sm mt-1">Use the Explorer panel to open or create files</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="border-t bg-muted/50 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>{activeFile ?
                (activeFile.name.includes('.ts') ? 'TypeScript' :
                 activeFile.name.includes('.js') ? 'JavaScript' :
                 activeFile.name.includes('.css') ? 'CSS' :
                 activeFile.name.includes('.html') ? 'HTML' :
                 activeFile.name.includes('.json') ? 'JSON' :
                 activeFile.name.includes('.md') ? 'Markdown' : 'Plain Text')
                : 'No file selected'}</span>
              <span>UTF-8</span>
              {activeFile && <span>Lines: {(activeFile.content || '').split('\n').length}</span>}
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>AI Assistant Ready</span>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Chat */}
        <div className="w-96 border-l">
          <AIChat onCodeSuggestion={handleCodeSuggestion} />
        </div>
      </div>
    </div>
  );
}