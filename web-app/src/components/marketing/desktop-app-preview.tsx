'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Search,
  GitBranch,
  Settings,
  Bot,
  Terminal,
  FolderTree,
  ChevronRight,
  Circle,
  MessageSquare,
  Zap,
  Play,
  Code,
  Database
} from 'lucide-react';

export function DesktopAppPreview() {
  return (
    <div className="w-full max-w-6xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl overflow-hidden shadow-2xl border">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Ottokode - AI-Powered IDE
        </div>
        <div className="w-16"></div>
      </div>

      <div className="flex h-[500px]">
        {/* Activity Bar */}
        <div className="w-12 bg-gray-200 dark:bg-gray-900 border-r flex flex-col items-center py-2 space-y-2">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-blue-500/20 text-blue-600">
            <FileText className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Search className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <GitBranch className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Bot className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Terminal className="h-4 w-4" />
          </Button>
          <div className="flex-1"></div>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar */}
        <div className="w-64 bg-gray-50 dark:bg-gray-850 border-r flex flex-col">
          <div className="p-3 border-b">
            <h3 className="text-sm font-semibold">Explorer</h3>
          </div>
          <div className="flex-1 p-2 space-y-1">
            <div className="flex items-center space-x-2 text-sm">
              <ChevronRight className="h-3 w-3" />
              <FolderTree className="h-3 w-3" />
              <span>my-project</span>
            </div>
            <div className="ml-5 space-y-1">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Circle className="h-2 w-2" />
                <Code className="h-3 w-3" />
                <span>App.tsx</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <Circle className="h-2 w-2 fill-blue-600" />
                <Code className="h-3 w-3" />
                <span>components/</span>
              </div>
              <div className="ml-3 space-y-1">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Circle className="h-2 w-2" />
                  <Code className="h-3 w-3" />
                  <span>Header.tsx</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b px-2">
            <div className="flex items-center space-x-1 text-sm bg-background px-3 py-2 border-t border-l border-r rounded-t">
              <Code className="h-3 w-3" />
              <span>App.tsx</span>
            </div>
          </div>

          <div className="flex-1 bg-gray-900 text-gray-100 p-4 font-mono text-sm">
            <div className="space-y-1">
              <div className="flex">
                <span className="text-gray-500 w-8">1</span>
                <span className="text-purple-400">import</span>
                <span className="text-white"> React </span>
                <span className="text-purple-400">from</span>
                <span className="text-green-400"> 'react'</span>
                <span className="text-white">;</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-8">2</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-8">3</span>
                <span className="text-blue-400">function</span>
                <span className="text-yellow-400"> App</span>
                <span className="text-white">() {'{'}  </span>
              </div>
              <div className="flex bg-blue-500/10 border-l-2 border-blue-500">
                <span className="text-gray-500 w-8">4</span>
                <span className="text-white">  </span>
                <span className="text-purple-400">return</span>
                <span className="text-white"> (</span>
                <Badge className="ml-2 bg-blue-500 text-white text-xs">AI Suggestion</Badge>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-8">5</span>
                <span className="text-white">    &lt;</span>
                <span className="text-red-400">div</span>
                <span className="text-white">&gt;Welcome to Ottokode&lt;/</span>
                <span className="text-red-400">div</span>
                <span className="text-white">&gt;</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-8">6</span>
                <span className="text-white">  );</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-8">7</span>
                <span className="text-white">{'}'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Panel */}
        <div className="w-80 bg-background border-l flex flex-col">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold">AI Assistant</h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-2 w-2 mr-1" />
              Turbo
            </Badge>
          </div>

          <div className="flex-1 p-3 space-y-3">
            <Card className="p-3 bg-muted/50">
              <div className="flex items-start space-x-2">
                <Bot className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p>I can help you build this React component. Would you like me to add error handling or optimize performance?</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p>You: Can you add TypeScript types?</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 bg-muted/50">
              <div className="flex items-start space-x-2">
                <Bot className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p>I'll add TypeScript types for you:</p>
                  <div className="bg-gray-900 text-gray-100 p-2 rounded text-xs font-mono">
                    interface Props {'{'}
                    <br />
                    &nbsp;&nbsp;title: string;
                    <br />
                    {'}'}
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline" className="h-6 text-xs">
                      <Play className="h-2 w-2 mr-1" />
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="p-3 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Ask AI anything..."
                className="flex-1 text-sm px-3 py-2 border rounded-md bg-background"
              />
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <MessageSquare className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-blue-600 text-white text-xs">
        <div className="flex items-center space-x-4">
          <span>● JavaScript React</span>
          <span>UTF-8</span>
          <span>Ln 4, Col 12</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Circle className="h-2 w-2 fill-green-400" />
            <span>Connected</span>
          </span>
          <span>AI: Active</span>
        </div>
      </div>
    </div>
  );
}