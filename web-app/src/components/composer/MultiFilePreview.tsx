"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Code,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  Edit3,
  Trash2,
  RotateCcw,
  Download,
  GitBranch,
  Layers,
  Clock,
  Zap,
  X,
  ChevronRight,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

interface FileChange {
  id: string;
  filePath: string;
  fileName: string;
  type: 'create' | 'modify' | 'delete' | 'rename' | 'move';
  status: 'pending' | 'approved' | 'rejected' | 'applying' | 'completed' | 'failed';
  language?: string;
  size?: number;
  changes: CodeChange[];
  preview: {
    original?: string;
    modified: string;
    diff: DiffLine[];
  };
  metadata: {
    linesAdded: number;
    linesRemoved: number;
    linesModified: number;
    complexity: 'low' | 'medium' | 'high';
    confidence: number;
    estimatedTime: number;
  };
  dependencies: string[];
  warnings: string[];
  suggestions: string[];
}

interface CodeChange {
  id: string;
  type: 'add' | 'remove' | 'modify';
  startLine: number;
  endLine: number;
  content: string;
  description: string;
  confidence: number;
}

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'modified';
  lineNumber: {
    original?: number;
    modified?: number;
  };
  content: string;
}

interface Changeset {
  id: string;
  title: string;
  description: string;
  files: FileChange[];
  status: 'draft' | 'ready' | 'applying' | 'completed' | 'failed';
  createdAt: Date;
  estimatedDuration: number;
  metadata: {
    totalLinesAdded: number;
    totalLinesRemoved: number;
    totalFilesChanged: number;
    overallConfidence: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

interface MultiFilePreviewProps {
  changeset?: Changeset;
  onApplyChanges?: (fileIds: string[]) => void;
  onRejectChanges?: (fileIds: string[]) => void;
  onModifyChange?: (fileId: string, changeId: string) => void;
  onPreviewModeChange?: (mode: 'side-by-side' | 'unified' | 'split') => void;
}

const CHANGE_TYPE_ICONS = {
  create: Plus,
  modify: Edit3,
  delete: Trash2,
  rename: RotateCcw,
  move: GitBranch
};

const CHANGE_TYPE_COLORS = {
  create: 'bg-green-100 text-green-800',
  modify: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  rename: 'bg-yellow-100 text-yellow-800',
  move: 'bg-purple-100 text-purple-800'
};

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  applying: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
};

export function MultiFilePreview({
  changeset,
  onApplyChanges,
  onRejectChanges,
  onModifyChange,
  onPreviewModeChange
}: MultiFilePreviewProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [previewMode, setPreviewMode] = useState<'side-by-side' | 'unified' | 'split'>('unified');
  const [showDetails, setShowDetails] = useState(false);
  const [filteredFiles, setFilteredFiles] = useState<FileChange[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'create' | 'modify' | 'delete'>('all');

  // Mock changeset data
  const mockChangeset: Changeset = {
    id: 'changeset-1',
    title: 'Authentication System Improvements',
    description: 'Add input validation, error handling, and improve user experience',
    status: 'ready',
    createdAt: new Date(),
    estimatedDuration: 180000, // 3 minutes
    metadata: {
      totalLinesAdded: 45,
      totalLinesRemoved: 12,
      totalFilesChanged: 4,
      overallConfidence: 0.89,
      riskLevel: 'medium'
    },
    files: [
      {
        id: 'file-1',
        filePath: '/src/components/auth/LoginForm.tsx',
        fileName: 'LoginForm.tsx',
        type: 'modify',
        status: 'pending',
        language: 'typescript',
        size: 2340,
        changes: [
          {
            id: 'change-1-1',
            type: 'add',
            startLine: 15,
            endLine: 20,
            content: 'const validateEmail = (email: string) => {\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);\n};',
            description: 'Add email validation function',
            confidence: 0.95
          },
          {
            id: 'change-1-2',
            type: 'modify',
            startLine: 35,
            endLine: 40,
            content: 'if (!validateEmail(email)) {\n  setError("Please enter a valid email address");\n  return;\n}',
            description: 'Add email validation to form submission',
            confidence: 0.92
          }
        ],
        preview: {
          modified: `import React, { useState } from 'react';\n\nexport function LoginForm() {\n  const [email, setEmail] = useState('');\n  const [password, setPassword] = useState('');\n  const [error, setError] = useState('');\n\n  const validateEmail = (email: string) => {\n    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);\n  };\n\n  const handleSubmit = (e: React.FormEvent) => {\n    e.preventDefault();\n    setError('');\n\n    if (!validateEmail(email)) {\n      setError('Please enter a valid email address');\n      return;\n    }\n\n    // Continue with login...\n  };\n\n  return (\n    <form onSubmit={handleSubmit}>\n      {/* Form content */}\n    </form>\n  );\n}`,
          diff: [
            { type: 'unchanged', lineNumber: { original: 1, modified: 1 }, content: "import React, { useState } from 'react';" },
            { type: 'unchanged', lineNumber: { original: 2, modified: 2 }, content: '' },
            { type: 'unchanged', lineNumber: { original: 3, modified: 3 }, content: 'export function LoginForm() {' },
            { type: 'unchanged', lineNumber: { original: 4, modified: 4 }, content: "  const [email, setEmail] = useState('');" },
            { type: 'unchanged', lineNumber: { original: 5, modified: 5 }, content: "  const [password, setPassword] = useState('');" },
            { type: 'unchanged', lineNumber: { original: 6, modified: 6 }, content: "  const [error, setError] = useState('');" },
            { type: 'unchanged', lineNumber: { original: 7, modified: 7 }, content: '' },
            { type: 'added', lineNumber: { modified: 8 }, content: '  const validateEmail = (email: string) => {' },
            { type: 'added', lineNumber: { modified: 9 }, content: '    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);' },
            { type: 'added', lineNumber: { modified: 10 }, content: '  };' },
            { type: 'added', lineNumber: { modified: 11 }, content: '' },
            { type: 'unchanged', lineNumber: { original: 8, modified: 12 }, content: '  const handleSubmit = (e: React.FormEvent) => {' },
            { type: 'unchanged', lineNumber: { original: 9, modified: 13 }, content: '    e.preventDefault();' },
            { type: 'unchanged', lineNumber: { original: 10, modified: 14 }, content: "    setError('');" },
            { type: 'added', lineNumber: { modified: 15 }, content: '' },
            { type: 'added', lineNumber: { modified: 16 }, content: '    if (!validateEmail(email)) {' },
            { type: 'added', lineNumber: { modified: 17 }, content: "      setError('Please enter a valid email address');" },
            { type: 'added', lineNumber: { modified: 18 }, content: '      return;' },
            { type: 'added', lineNumber: { modified: 19 }, content: '    }' }
          ]
        },
        metadata: {
          linesAdded: 9,
          linesRemoved: 0,
          linesModified: 0,
          complexity: 'low',
          confidence: 0.93,
          estimatedTime: 30000
        },
        dependencies: [],
        warnings: [],
        suggestions: ['Consider adding password strength validation as well']
      },
      {
        id: 'file-2',
        filePath: '/src/hooks/useAuth.ts',
        fileName: 'useAuth.ts',
        type: 'modify',
        status: 'pending',
        language: 'typescript',
        size: 1200,
        changes: [
          {
            id: 'change-2-1',
            type: 'add',
            startLine: 10,
            endLine: 15,
            content: 'const [authError, setAuthError] = useState<string | null>(null);',
            description: 'Add error state management',
            confidence: 0.88
          }
        ],
        preview: {
          modified: `import { useState, useEffect } from 'react';\n\nexport function useAuth() {\n  const [isAuthenticated, setIsAuthenticated] = useState(false);\n  const [user, setUser] = useState(null);\n  const [authError, setAuthError] = useState<string | null>(null);\n\n  // Auth logic...\n}`,
          diff: [
            { type: 'unchanged', lineNumber: { original: 1, modified: 1 }, content: "import { useState, useEffect } from 'react';" },
            { type: 'unchanged', lineNumber: { original: 2, modified: 2 }, content: '' },
            { type: 'unchanged', lineNumber: { original: 3, modified: 3 }, content: 'export function useAuth() {' },
            { type: 'unchanged', lineNumber: { original: 4, modified: 4 }, content: '  const [isAuthenticated, setIsAuthenticated] = useState(false);' },
            { type: 'unchanged', lineNumber: { original: 5, modified: 5 }, content: '  const [user, setUser] = useState(null);' },
            { type: 'added', lineNumber: { modified: 6 }, content: '  const [authError, setAuthError] = useState<string | null>(null);' },
            { type: 'unchanged', lineNumber: { original: 6, modified: 7 }, content: '' },
            { type: 'unchanged', lineNumber: { original: 7, modified: 8 }, content: '  // Auth logic...' },
            { type: 'unchanged', lineNumber: { original: 8, modified: 9 }, content: '}' }
          ]
        },
        metadata: {
          linesAdded: 1,
          linesRemoved: 0,
          linesModified: 0,
          complexity: 'low',
          confidence: 0.88,
          estimatedTime: 15000
        },
        dependencies: ['file-1'],
        warnings: ['Make sure to handle the error state in components using this hook'],
        suggestions: []
      },
      {
        id: 'file-3',
        filePath: '/src/utils/constants.ts',
        fileName: 'constants.ts',
        type: 'create',
        status: 'pending',
        language: 'typescript',
        size: 300,
        changes: [],
        preview: {
          modified: `// Authentication constants\nexport const AUTH_ERRORS = {\n  INVALID_EMAIL: 'Please enter a valid email address',\n  WEAK_PASSWORD: 'Password must be at least 8 characters long',\n  LOGIN_FAILED: 'Invalid email or password',\n  NETWORK_ERROR: 'Network error. Please try again.'\n};\n\nexport const EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;`,
          diff: [
            { type: 'added', lineNumber: { modified: 1 }, content: '// Authentication constants' },
            { type: 'added', lineNumber: { modified: 2 }, content: 'export const AUTH_ERRORS = {' },
            { type: 'added', lineNumber: { modified: 3 }, content: "  INVALID_EMAIL: 'Please enter a valid email address'," },
            { type: 'added', lineNumber: { modified: 4 }, content: "  WEAK_PASSWORD: 'Password must be at least 8 characters long'," },
            { type: 'added', lineNumber: { modified: 5 }, content: "  LOGIN_FAILED: 'Invalid email or password'," },
            { type: 'added', lineNumber: { modified: 6 }, content: "  NETWORK_ERROR: 'Network error. Please try again.'" },
            { type: 'added', lineNumber: { modified: 7 }, content: '};' },
            { type: 'added', lineNumber: { modified: 8 }, content: '' },
            { type: 'added', lineNumber: { modified: 9 }, content: 'export const EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;' }
          ]
        },
        metadata: {
          linesAdded: 9,
          linesRemoved: 0,
          linesModified: 0,
          complexity: 'low',
          confidence: 0.95,
          estimatedTime: 10000
        },
        dependencies: [],
        warnings: [],
        suggestions: ['Consider adding more validation constants for future use']
      }
    ]
  };

  const currentChangeset = changeset || mockChangeset;

  useEffect(() => {
    const filtered = currentChangeset.files.filter(file =>
      filterType === 'all' || file.type === filterType
    );
    setFilteredFiles(filtered);
  }, [currentChangeset, filterType]);

  useEffect(() => {
    // Auto-select all files initially
    const allFileIds = new Set(currentChangeset.files.map(f => f.id));
    setSelectedFiles(allFileIds);
  }, [currentChangeset]);

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const toggleFileExpansion = (fileId: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedFiles(newExpanded);
  };

  const selectAll = () => {
    const allFileIds = new Set(filteredFiles.map(f => f.id));
    setSelectedFiles(allFileIds);
  };

  const selectNone = () => {
    setSelectedFiles(new Set());
  };

  const getChangeTypeIcon = (type: FileChange['type']) => {
    const Icon = CHANGE_TYPE_ICONS[type];
    return <Icon className="w-4 h-4" />;
  };

  const formatDuration = (ms: number) => {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  const renderDiffLine = (line: DiffLine, index: number) => {
    const bgColor =
      line.type === 'added' ? 'bg-green-50' :
      line.type === 'removed' ? 'bg-red-50' :
      line.type === 'modified' ? 'bg-yellow-50' :
      '';

    const textColor =
      line.type === 'added' ? 'text-green-800' :
      line.type === 'removed' ? 'text-red-800' :
      line.type === 'modified' ? 'text-yellow-800' :
      'text-gray-700';

    const prefix =
      line.type === 'added' ? '+' :
      line.type === 'removed' ? '-' :
      ' ';

    return (
      <div key={index} className={`flex font-mono text-sm ${bgColor} ${textColor}`}>
        <div className="flex-shrink-0 w-16 px-2 py-1 text-xs text-gray-500 bg-gray-50 border-r">
          {line.lineNumber.original && (
            <span className="mr-1">{line.lineNumber.original}</span>
          )}
          {line.lineNumber.modified && (
            <span>{line.lineNumber.modified}</span>
          )}
        </div>
        <div className="flex-1 px-3 py-1">
          <span className="mr-2 font-bold">{prefix}</span>
          {line.content}
        </div>
      </div>
    );
  };

  const handleApplySelected = () => {
    onApplyChanges?.(Array.from(selectedFiles));
  };

  const handleRejectSelected = () => {
    onRejectChanges?.(Array.from(selectedFiles));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{currentChangeset.title}</h2>
          <p className="text-muted-foreground">{currentChangeset.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={
            currentChangeset.metadata.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
            currentChangeset.metadata.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }>
            {currentChangeset.metadata.riskLevel} risk
          </Badge>
          <Badge variant="outline">
            {Math.round(currentChangeset.metadata.overallConfidence * 100)}% confidence
          </Badge>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Files Changed</p>
                <p className="text-2xl font-bold">{currentChangeset.metadata.totalFilesChanged}</p>
              </div>
              <Layers className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Lines Added</p>
                <p className="text-2xl font-bold text-green-600">+{currentChangeset.metadata.totalLinesAdded}</p>
              </div>
              <Plus className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Lines Removed</p>
                <p className="text-2xl font-bold text-red-600">-{currentChangeset.metadata.totalLinesRemoved}</p>
              </div>
              <Minus className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Est. Time</p>
                <p className="text-2xl font-bold">{formatDuration(currentChangeset.estimatedDuration)}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone}>
              Select None
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Tabs value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-2 py-1">All</TabsTrigger>
                <TabsTrigger value="create" className="text-xs px-2 py-1">Create</TabsTrigger>
                <TabsTrigger value="modify" className="text-xs px-2 py-1">Modify</TabsTrigger>
                <TabsTrigger value="delete" className="text-xs px-2 py-1">Delete</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <Tabs value={previewMode} onValueChange={(value: any) => setPreviewMode(value)}>
              <TabsList className="h-8">
                <TabsTrigger value="unified" className="text-xs px-2 py-1">Unified</TabsTrigger>
                <TabsTrigger value="side-by-side" className="text-xs px-2 py-1">Split</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {selectedFiles.size} of {filteredFiles.length} selected
          </span>
          <Button
            variant="outline"
            onClick={handleRejectSelected}
            disabled={selectedFiles.size === 0}
          >
            Reject Selected
          </Button>
          <Button
            onClick={handleApplySelected}
            disabled={selectedFiles.size === 0}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Apply Selected ({selectedFiles.size})
          </Button>
        </div>
      </div>

      {/* File Changes */}
      <div className="space-y-4">
        {filteredFiles.map((file) => (
          <Card key={file.id} className={selectedFiles.has(file.id) ? 'ring-2 ring-blue-200' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedFiles.has(file.id)}
                    onCheckedChange={() => toggleFileSelection(file.id)}
                  />
                  <button
                    onClick={() => toggleFileExpansion(file.id)}
                    className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded"
                  >
                    {expandedFiles.has(file.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <div className="flex items-center space-x-2">
                      {getChangeTypeIcon(file.type)}
                      <span className="font-medium">{file.fileName}</span>
                    </div>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={CHANGE_TYPE_COLORS[file.type]}>
                    {file.type}
                  </Badge>
                  <Badge variant="outline" className={STATUS_COLORS[file.status]}>
                    {file.status}
                  </Badge>
                  <Badge variant="outline">
                    {Math.round(file.metadata.confidence * 100)}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground ml-8">
                <span>{file.filePath}</span>
                <div className="flex items-center space-x-4">
                  <span>+{file.metadata.linesAdded} -{file.metadata.linesRemoved}</span>
                  <span>{formatDuration(file.metadata.estimatedTime)}</span>
                </div>
              </div>

              {(file.warnings.length > 0 || file.suggestions.length > 0) && (
                <div className="ml-8 space-y-1">
                  {file.warnings.map((warning, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>{warning}</span>
                    </div>
                  ))}
                  {file.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-blue-600">
                      <Zap className="w-4 h-4" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardHeader>

            {expandedFiles.has(file.id) && (
              <CardContent className="pt-0">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b flex items-center justify-between">
                    <span className="text-sm font-medium">Preview</span>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="h-6">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6">
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="max-h-96">
                    <div className="text-sm">
                      {file.preview.diff.map((line, index) => renderDiffLine(line, index))}
                    </div>
                  </ScrollArea>
                </div>

                {file.dependencies.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-blue-800">
                      <GitBranch className="w-4 h-4" />
                      <span>Depends on: {file.dependencies.join(', ')}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Changes Found</h3>
            <p className="text-gray-500">
              {filterType === 'all'
                ? 'No file changes in this changeset.'
                : `No ${filterType} operations found.`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}