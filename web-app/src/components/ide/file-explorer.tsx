'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileCreate: (parentId: string | null, name: string, type: 'file' | 'folder') => void;
  onFileDelete: (fileId: string) => void;
  selectedFileId?: string;
}

export function FileExplorer({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  selectedFileId
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingFile, setCreatingFile] = useState<{ parentId: string | null; type: 'file' | 'folder' } | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onFileCreate(creatingFile?.parentId || null, newFileName.trim(), creatingFile?.type || 'file');
      setCreatingFile(null);
      setNewFileName('');
    }
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.id) ?
        <FolderOpen className="h-4 w-4 text-blue-400" /> :
        <Folder className="h-4 w-4 text-blue-400" />;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'ts':
      case 'tsx':
        return <File className="h-4 w-4 text-blue-500" />;
      case 'js':
      case 'jsx':
        return <File className="h-4 w-4 text-yellow-500" />;
      case 'css':
        return <File className="h-4 w-4 text-pink-500" />;
      case 'html':
        return <File className="h-4 w-4 text-orange-500" />;
      case 'json':
        return <File className="h-4 w-4 text-green-500" />;
      case 'md':
        return <File className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  const renderFileNode = (file: FileNode, depth = 0) => {
    const isExpanded = expandedFolders.has(file.id);
    const isSelected = selectedFileId === file.id;

    return (
      <div key={file.id}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-muted/50 cursor-pointer group ${
            isSelected ? 'bg-ai-primary/10 border-r-2 border-ai-primary' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (file.type === 'folder') {
              toggleFolder(file.id);
            } else {
              onFileSelect(file);
            }
          }}
        >
          {file.type === 'folder' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(file.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}

          {getFileIcon(file)}

          <span className="ml-2 text-sm flex-1 truncate">{file.name}</span>

          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
            {file.type === 'folder' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreatingFile({ parentId: file.id, type: 'file' });
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              onClick={(e) => {
                e.stopPropagation();
                onFileDelete(file.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {creatingFile?.parentId === file.id && (
          <div
            className="flex items-center py-1 px-2"
            style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
          >
            <File className="h-4 w-4 text-gray-400 mr-2" />
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile();
                } else if (e.key === 'Escape') {
                  setCreatingFile(null);
                  setNewFileName('');
                }
              }}
              onBlur={() => {
                if (newFileName.trim()) {
                  handleCreateFile();
                } else {
                  setCreatingFile(null);
                }
              }}
              className="h-6 text-xs"
              placeholder={`New ${creatingFile?.type}...`}
              autoFocus
            />
          </div>
        )}

        {file.type === 'folder' && isExpanded && file.children && (
          <div>
            {file.children.map((child) => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-sidebar border-r">
      <div className="p-3 border-b bg-sidebar">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Explorer</h3>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setCreatingFile({ parentId: null, type: 'file' })}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setCreatingFile({ parentId: null, type: 'folder' })}
            >
              <Folder className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto">
        {creatingFile?.parentId === null && (
          <div className="flex items-center py-1 px-2">
            {creatingFile.type === 'folder' ? (
              <Folder className="h-4 w-4 text-blue-400 mr-2" />
            ) : (
              <File className="h-4 w-4 text-gray-400 mr-2" />
            )}
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile();
                } else if (e.key === 'Escape') {
                  setCreatingFile(null);
                  setNewFileName('');
                }
              }}
              onBlur={() => {
                if (newFileName.trim()) {
                  handleCreateFile();
                } else {
                  setCreatingFile(null);
                }
              }}
              className="h-6 text-xs"
              placeholder={`New ${creatingFile.type}...`}
              autoFocus
            />
          </div>
        )}

        {files.map((file) => renderFileNode(file))}
      </div>
    </div>
  );
}