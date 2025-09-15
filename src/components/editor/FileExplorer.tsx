import React, { useState, useEffect } from 'react';
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  MoreVertical,
  FolderPlus,
  FilePlus,
  Trash2,
  Edit3,
  Copy,
  Download
} from 'lucide-react';

export interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  parentId?: string;
  children?: FileSystemItem[];
  size?: number;
  lastModified?: Date;
  content?: string;
}

interface FileExplorerProps {
  files: FileSystemItem[];
  onFileSelect?: (file: FileSystemItem) => void;
  onFileCreate?: (name: string, type: 'file' | 'folder', parentPath: string) => void;
  onFileDelete?: (file: FileSystemItem) => void;
  onFileRename?: (file: FileSystemItem, newName: string) => void;
  selectedFile?: FileSystemItem;
  className?: string;
}

interface FileItemProps {
  item: FileSystemItem;
  level: number;
  onSelect: (file: FileSystemItem) => void;
  onContextMenu: (file: FileSystemItem, event: React.MouseEvent) => void;
  isSelected: boolean;
  expandedFolders: Set<string>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const FileItem: React.FC<FileItemProps> = ({
  item,
  level,
  onSelect,
  onContextMenu,
  isSelected,
  expandedFolders,
  setExpandedFolders
}) => {
  const isExpanded = expandedFolders.has(item.id);
  const hasChildren = item.children && item.children.length > 0;

  const toggleExpanded = () => {
    if (item.type === 'folder') {
      const newExpanded = new Set(expandedFolders);
      if (isExpanded) {
        newExpanded.delete(item.id);
      } else {
        newExpanded.add(item.id);
      }
      setExpandedFolders(newExpanded);
    }
  };

  const handleClick = () => {
    if (item.type === 'folder') {
      toggleExpanded();
    } else {
      onSelect(item);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'js': '🟨', 'jsx': '🔵', 'ts': '🔷', 'tsx': '🔷',
      'py': '🐍', 'java': '☕', 'cpp': '⚙️', 'c': '⚙️',
      'html': '🌐', 'css': '🎨', 'scss': '🎨', 'less': '🎨',
      'json': '📄', 'xml': '📄', 'yaml': '📄', 'yml': '📄',
      'md': '📝', 'txt': '📝', 'env': '🔧', 'gitignore': '🚫',
      'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️',
      'svg': '🎭', 'ico': '🎯'
    };
    return iconMap[extension || ''] || '📄';
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer select-none ${
          isSelected ? 'bg-blue-600' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(item, e);
        }}
      >
        {item.type === 'folder' && (
          <div className="mr-1 text-gray-400">
            {hasChildren ? (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              <div className="w-3.5" />
            )}
          </div>
        )}

        <div className="mr-2 text-sm">
          {item.type === 'folder' ? (
            <Folder size={16} className={isExpanded ? 'text-blue-400' : 'text-gray-400'} />
          ) : (
            <span className="text-sm">{getFileIcon(item.name)}</span>
          )}
        </div>

        <span className="text-sm text-gray-200 truncate">{item.name}</span>

        {item.type === 'file' && item.size && (
          <span className="ml-auto text-xs text-gray-500">
            {formatFileSize(item.size)}
          </span>
        )}
      </div>

      {item.type === 'folder' && isExpanded && hasChildren && (
        <div>
          {item.children!.map((child) => (
            <FileItem
              key={child.id}
              item={child}
              level={level + 1}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              isSelected={child.id === (isSelected ? item.id : '')}
              expandedFolders={expandedFolders}
              setExpandedFolders={setExpandedFolders}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  selectedFile,
  className = ''
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    file: FileSystemItem;
    x: number;
    y: number;
  } | null>(null);
  const [filteredFiles, setFilteredFiles] = useState<FileSystemItem[]>(files);

  // Filter files based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFiles(files);
      return;
    }

    const filterItems = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.reduce((acc: FileSystemItem[], item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredChildren = item.children ? filterItems(item.children) : [];

        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...item,
            children: filteredChildren
          });

          // Auto-expand folders that contain matches
          if (filteredChildren.length > 0 && item.type === 'folder') {
            setExpandedFolders(prev => new Set([...prev, item.id]));
          }
        }

        return acc;
      }, []);
    };

    setFilteredFiles(filterItems(files));
  }, [files, searchQuery]);

  const handleContextMenu = (file: FileSystemItem, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      file,
      x: event.clientX,
      y: event.clientY
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleFileAction = (action: string, file?: FileSystemItem) => {
    const targetFile = file || contextMenu?.file;
    if (!targetFile) return;

    switch (action) {
      case 'rename':
        const newName = prompt('Enter new name:', targetFile.name);
        if (newName && newName !== targetFile.name) {
          onFileRename?.(targetFile, newName);
        }
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${targetFile.name}"?`)) {
          onFileDelete?.(targetFile);
        }
        break;
      case 'new-file':
        const fileName = prompt('Enter file name:');
        if (fileName) {
          onFileCreate?.(fileName, 'file', targetFile.path);
        }
        break;
      case 'new-folder':
        const folderName = prompt('Enter folder name:');
        if (folderName) {
          onFileCreate?.(folderName, 'folder', targetFile.path);
        }
        break;
    }
    closeContextMenu();
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  return (
    <div className={`bg-gray-800 text-white h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-200">Explorer</h3>
          <div className="flex space-x-1">
            <button
              onClick={() => handleFileAction('new-file')}
              className="p-1 hover:bg-gray-700 rounded"
              title="New File"
            >
              <FilePlus size={14} />
            </button>
            <button
              onClick={() => handleFileAction('new-folder')}
              className="p-1 hover:bg-gray-700 rounded"
              title="New Folder"
            >
              <FolderPlus size={14} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchQuery ? 'No files match your search' : 'No files to display'}
          </div>
        ) : (
          filteredFiles.map((item) => (
            <FileItem
              key={item.id}
              item={item}
              level={0}
              onSelect={onFileSelect || (() => {})}
              onContextMenu={handleContextMenu}
              isSelected={selectedFile?.id === item.id}
              expandedFolders={expandedFolders}
              setExpandedFolders={setExpandedFolders}
            />
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-700 border border-gray-600 rounded shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleFileAction('rename')}
            className="w-full px-3 py-1 text-sm text-left hover:bg-gray-600 flex items-center space-x-2"
          >
            <Edit3 size={14} />
            <span>Rename</span>
          </button>
          <button
            onClick={() => handleFileAction('delete')}
            className="w-full px-3 py-1 text-sm text-left hover:bg-gray-600 flex items-center space-x-2 text-red-400"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
          {contextMenu.file.type === 'folder' && (
            <>
              <div className="border-t border-gray-600 my-1" />
              <button
                onClick={() => handleFileAction('new-file')}
                className="w-full px-3 py-1 text-sm text-left hover:bg-gray-600 flex items-center space-x-2"
              >
                <FilePlus size={14} />
                <span>New File</span>
              </button>
              <button
                onClick={() => handleFileAction('new-folder')}
                className="w-full px-3 py-1 text-sm text-left hover:bg-gray-600 flex items-center space-x-2"
              >
                <FolderPlus size={14} />
                <span>New Folder</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};