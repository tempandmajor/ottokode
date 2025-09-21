'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Code,
  Play,
  Save,
  Settings,
  Terminal,
  MessageCircle,
  FolderOpen,
  Download,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { MonacoEditor } from '@/components/ide/monaco-editor';
import { FileExplorer, FileNode } from '@/components/ide/file-explorer';
import { AIChat } from '@/components/ide/ai-chat';
import { useAuth } from '@/components/auth/auth-provider';
import { UserMenu } from '@/components/auth/user-menu';
import { useTheme } from '@/components/theme-provider';
import { ProjectStorageService, Project } from '@/services/storage/ProjectStorageService';
import { WebTerminalService } from '@/services/terminal/WebTerminalService';
import Image from 'next/image';
import Link from 'next/link';

// Force dynamic rendering to avoid SSR issues with Supabase client
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function IDEPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();

  // Project and file management
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(384); // 24rem default
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Terminal state
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '🚀 Ottokode Terminal initialized',
    '📁 Working directory: /project',
    '✨ AI assistant available - type "otto help" for commands',
    ''
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  // Services
  const [storageService] = useState(() => new ProjectStorageService());
  const [terminalService] = useState(() => new WebTerminalService());
  const [files, setFiles] = useState<FileNode[]>([]);

  const initializeProject = useCallback(async () => {
    try {
      setIsLoading(true);

      // Try to load existing projects or create a default one
      const projects = await storageService.listProjects(user!.id);

      if (projects.length > 0) {
        // Load the most recently accessed project
        const project = projects[0];
        setCurrentProject(project);
        const projectFiles = await storageService.getProjectFiles(project.id);
        setFiles(projectFiles);
      } else {
        // Create a default "Welcome" project
        const defaultProject = await storageService.createProject({
          name: 'Welcome to Ottokode',
          description: 'Your first AI-powered project',
          user_id: user!.id,
          is_public: false,
          file_tree: []
        });

        setCurrentProject(defaultProject);

        // Create default files
        const defaultFiles: Omit<FileNode, 'id'>[] = [
          {
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
          }
        ];

        // Save default files to storage
        for (const file of defaultFiles) {
          await storageService.saveFile(defaultProject.id, {
            ...file,
            id: crypto.randomUUID()
          });
        }

        // Reload files from storage
        const projectFiles = await storageService.getProjectFiles(defaultProject.id);
        setFiles(projectFiles);
      }
    } catch (error) {
      console.error('Error initializing project:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageService, user]);

  // Initialize project and load files
  useEffect(() => {
    if (user && !loading) {
      initializeProject();
    }
  }, [user, loading, initializeProject]);

  const handleFileSelect = useCallback((file: FileNode) => {
    setActiveFile(file);
    if (!openFiles.find(f => f.id === file.id)) {
      setOpenFiles(prev => [...prev, file]);
    }
  }, [openFiles]);

  const handleFileCreate = useCallback(async (parentId: string | null, name: string, type: 'file' | 'folder') => {
    if (!currentProject) return;

    const newFile: FileNode = {
      id: crypto.randomUUID(),
      name,
      type,
      content: type === 'file' ? '// New file\n' : undefined,
      children: type === 'folder' ? [] : undefined
    };

    try {
      // Save to storage
      await storageService.saveFile(currentProject.id, newFile);

      // Update local state
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
    } catch (error) {
      console.error('Error creating file:', error);
    }
  }, [currentProject, storageService]);

  const handleFileDelete = useCallback(async (fileId: string) => {
    if (!currentProject) return;

    try {
      // Delete from storage
      await storageService.deleteFile(currentProject.id, fileId);

      // Update local state
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
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }, [activeFile, openFiles, currentProject, storageService]);

  const handleCodeChange = useCallback(async (newCode: string) => {
    if (activeFile && currentProject) {
      const updatedFile = { ...activeFile, content: newCode };
      setActiveFile(updatedFile);

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

      // Auto-save to storage with debounce
      try {
        await storageService.saveFile(currentProject.id, updatedFile);
      } catch (error) {
        console.error('Error auto-saving file:', error);
      }
    }
  }, [activeFile, currentProject, storageService]);

  // Terminal functionality
  const executeCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    const trimmedCommand = command.trim();
    setTerminalOutput(prev => [...prev, `$ ${trimmedCommand}`]);
    setCommandHistory(prev => [...prev, trimmedCommand]);

    try {
      if (currentProject) {
        const result = await terminalService.executeCommand(currentProject.id, trimmedCommand);
        setTerminalOutput(prev => [...prev, ...result.output]);
      } else {
        // Handle commands without a project
        setTerminalOutput(prev => [...prev, 'Error: No project loaded']);
      }
    } catch (error) {
      setTerminalOutput(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }

    setTerminalInput('');
    setHistoryIndex(-1);
  }, [terminalService, currentProject]);

  const handleTerminalKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(terminalInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput('');
      }
    }
  }, [terminalInput, commandHistory, historyIndex, executeCommand]);

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

  const saveFile = useCallback(async () => {
    if (activeFile && currentProject) {
      try {
        await storageService.saveFile(currentProject.id, activeFile);
        console.log('File saved successfully:', activeFile.name);
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  }, [activeFile, currentProject, storageService]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading or redirect if not authenticated
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loading ? 'Authenticating...' : 'Loading your projects...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* IDE Header */}
      <div className="border-b bg-card shadow-sm backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Image
                src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
                alt="Ottokode"
                width={56}
                height={56}
                className="h-14 w-14"
              />
              <span className="text-lg font-semibold">IDE</span>
            </div>

            {/* Project Selector */}
            {currentProject && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-muted/50 rounded-md">
                <FolderOpen className="h-4 w-4 text-ai-primary" />
                <span className="text-sm font-medium text-foreground">{currentProject.name}</span>
                <button className="text-xs text-muted-foreground hover:text-foreground">
                  ↓
                </button>
              </div>
            )}

            <Badge variant="outline" className="border-ai-primary/20">
              Web Version
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            {/* Mobile Panel Toggles */}
            <div className="flex lg:hidden">
              <Button size="sm" variant="ghost" onClick={() => setLeftPanelOpen(!leftPanelOpen)}>
                <FolderOpen className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRightPanelOpen(!rightPanelOpen)}>
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>

            {/* Primary Actions */}
            <Button size="sm" className="bg-ai-primary hover:bg-ai-primary/90 text-ai-primary-foreground" onClick={runCode} disabled={!activeFile}>
              <Play className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Run</span>
            </Button>

            {/* Secondary Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline sm:ml-2">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={saveFile} disabled={!activeFile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save File
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Project
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/ai">
                    <Settings className="h-4 w-4 mr-2" />
                    AI Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <UserMenu />
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)] relative">
        {/* Left Sidebar */}
        <div className={`${leftPanelOpen ? 'w-80' : 'w-0'} lg:w-80 border-r transition-all duration-300 ${leftPanelOpen ? 'block' : 'hidden lg:block'} ${!leftPanelOpen ? 'lg:w-12' : ''} bg-card/50 backdrop-blur relative shadow-lg`}>
          {/* Toggle Button for Mobile/Tablet */}
          {!leftPanelOpen && (
            <button
              onClick={() => setLeftPanelOpen(true)}
              className="absolute top-4 right-2 z-10 p-2 bg-card border rounded-lg shadow-md lg:hidden"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {leftPanelOpen && (
            <>
              {/* Close Button for Mobile */}
              <div className="absolute top-4 left-4 z-10 lg:hidden">
                <button
                  onClick={() => setLeftPanelOpen(false)}
                  className="p-2 bg-card border rounded-lg shadow-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <Tabs defaultValue="files" className="h-full">
                <TabsList className="grid w-full grid-cols-2 bg-sidebar">
                  <TabsTrigger value="files" className="text-xs">
                    <FolderOpen className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Explorer</span>
                  </TabsTrigger>
                  <TabsTrigger value="terminal" className="text-xs">
                    <Terminal className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Terminal</span>
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
                <div className="text-sm font-medium flex items-center justify-between">
                  <span>Integrated Terminal</span>
                  <button
                    onClick={() => setTerminalOutput(['🚀 Ottokode Terminal initialized', '📁 Working directory: /project', '✨ AI assistant available - type "otto help" for commands', ''])}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-black border rounded-md p-3 font-mono text-sm h-64 overflow-y-auto shadow-inner">
                  <div className="space-y-1">
                    {terminalOutput.map((line, index) => (
                      <div key={index} className={`${
                        line.startsWith('$') ? 'text-green-400' :
                        line.startsWith('Error:') ? 'text-red-400' :
                        line.includes('✓') ? 'text-green-400' :
                        line.includes('⚡') ? 'text-yellow-400' :
                        line.includes('🚀') || line.includes('✨') ? 'text-blue-400' :
                        'text-gray-300'
                      }`}>
                        {line}
                      </div>
                    ))}
                    <div className="flex items-center text-green-400">
                      <span>$ </span>
                      <input
                        ref={terminalInputRef}
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        onKeyDown={handleTerminalKeyDown}
                        className="bg-transparent outline-none text-gray-300 flex-1 ml-1"
                        placeholder="Type a command..."
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* File Tabs */}
          <div className="flex items-center border-b bg-muted/30 px-4 py-2 overflow-x-auto shadow-sm">
            <div className="flex space-x-2">
              {openFiles.map((file, index) => (
                <div
                  key={file.id}
                  className={`group bg-card border rounded-md px-3 py-1 text-sm flex items-center cursor-pointer transition-all hover:shadow-md ${
                    activeFile?.id === file.id ? 'border-ai-primary bg-ai-primary/5 shadow-sm' : 'hover:border-ai-primary/50'
                  }`}
                  onClick={() => setActiveFile(file)}
                >
                  <Code className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button
                    className="ml-2 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newFiles = openFiles.filter(f => f.id !== file.id);
                      setOpenFiles(newFiles);
                      if (activeFile?.id === file.id && newFiles.length > 0) {
                        setActiveFile(newFiles[Math.max(0, index - 1)]);
                      } else if (newFiles.length === 0) {
                        setActiveFile(null);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
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

          {/* Enhanced Status Bar */}
          <div className="border-t bg-gradient-to-r from-card to-muted/50 px-4 py-2 flex items-center justify-between text-xs shadow-inner">
            <div className="flex items-center space-x-4 text-muted-foreground">
              <span className="font-medium">
                {activeFile ?
                  (activeFile.name.includes('.ts') ? '⚡ TypeScript' :
                   activeFile.name.includes('.js') ? '🟨 JavaScript' :
                   activeFile.name.includes('.css') ? '🎨 CSS' :
                   activeFile.name.includes('.html') ? '🌐 HTML' :
                   activeFile.name.includes('.json') ? '📋 JSON' :
                   activeFile.name.includes('.md') ? '📝 Markdown' : '📄 Plain Text')
                  : '📁 No file selected'}
              </span>
              <div className="h-3 w-px bg-border"></div>
              <span>UTF-8</span>
              {activeFile && (
                <>
                  <div className="h-3 w-px bg-border"></div>
                  <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
                  <div className="h-3 w-px bg-border"></div>
                  <span className="text-ai-primary">{(activeFile.content || '').split('\n').length} lines</span>
                  <div className="h-3 w-px bg-border"></div>
                  <span>{(activeFile.content || '').length} chars</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-ai-primary font-medium">Otto Ready</span>
              </div>
              <div className="h-3 w-px bg-border"></div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <span>🔒 Secure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Chat */}
        <div
          className={`${rightPanelOpen ? `w-${Math.floor(rightPanelWidth/16)}` : 'w-0'} lg:w-96 border-l transition-all duration-300 ${rightPanelOpen ? 'block' : 'hidden lg:block'} ${!rightPanelOpen ? 'lg:w-12' : ''} relative`}
          style={{ width: rightPanelOpen ? `${rightPanelWidth}px` : undefined }}
        >
          {/* Toggle Button for Mobile/Tablet */}
          {!rightPanelOpen && (
            <button
              onClick={() => setRightPanelOpen(true)}
              className="absolute top-4 left-2 z-10 p-2 bg-card border rounded-lg shadow-md lg:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {rightPanelOpen && (
            <>
              {/* Resize Handle */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize bg-border hover:bg-ai-primary/50 transition-colors hidden lg:block"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startWidth = rightPanelWidth;

                  const handleMouseMove = (e: MouseEvent) => {
                    const newWidth = Math.max(280, Math.min(600, startWidth - (e.clientX - startX)));
                    setRightPanelWidth(newWidth);
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />

              {/* Close Button for Mobile */}
              <div className="absolute top-4 right-4 z-10 lg:hidden">
                <button
                  onClick={() => setRightPanelOpen(false)}
                  className="p-2 bg-card border rounded-lg shadow-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="h-full pl-1">
                <AIChat onCodeSuggestion={handleCodeSuggestion} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}