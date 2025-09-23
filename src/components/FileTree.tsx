import React, { useState, useEffect } from 'react';
import { FileSystemService } from '../services/filesystem/FileSystemService';
import { useEditorStore, useWorkspaceStore } from '../store';
import './FileTree.css';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  expanded?: boolean;
}

interface EditorFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
}

export const FileTree: React.FC = () => {
  const { openFile } = useEditorStore();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const fileSystemService = new FileSystemService();

  useEffect(() => {
    loadWorkspaceFiles();
  }, []);

  const loadWorkspaceFiles = async () => {
    setLoading(true);
    try {
      // Try to load current workspace, or default to current directory
      const workspacePath = currentWorkspace || await getCurrentWorkingDirectory();
      if (workspacePath) {
        const files = await fileSystemService.listDirectory(workspacePath);
        const tree = await buildFileTree(files, workspacePath);
        setFileTree(tree);
        setCurrentWorkspace(workspacePath);
      }
    } catch (error) {
      console.error('Failed to load workspace files:', error);
      // Fallback to showing an empty workspace message
      setFileTree([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWorkingDirectory = async (): Promise<string> => {
    try {
      // Use Tauri API to get current working directory
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('get_current_dir');
    } catch {
      // Fallback to a default directory
      return process.cwd?.() || '.';
    }
  };

  const buildFileTree = async (files: any[], basePath: string): Promise<FileNode[]> => {
    return files.map(file => ({
      name: file.name,
      path: file.path,
      isDirectory: file.children !== undefined,
      children: file.children ? file.children.map((child: any) => ({
        name: child.name,
        path: child.path,
        isDirectory: child.children !== undefined,
        expanded: false
      })) : undefined,
      expanded: false
    }));
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'json':
        return 'json';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'md':
        return 'markdown';
      case 'yml':
      case 'yaml':
        return 'yaml';
      case 'toml':
        return 'toml';
      case 'rs':
        return 'rust';
      case 'go':
        return 'go';
      case 'java':
        return 'java';
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'cpp';
      case 'c':
        return 'c';
      case 'sh':
        return 'shell';
      default:
        return 'plaintext';
    }
  };

  const getFileContent = async (filePath: string): Promise<string> => {
    try {
      return await fileSystemService.readFile(filePath);
    } catch (error) {
      console.error('Failed to read file:', error);
      return `// Error reading file: ${filePath}\n// ${error}`;
    }
  };

  const getSampleContent = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
        return `import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const ${filename.replace('.tsx', '')}: React.FC<Props> = ({ children }) => {
  return (
    <div className="${filename.toLowerCase().replace('.tsx', '')}">
      {children}
    </div>
  );
};

export default ${filename.replace('.tsx', '')};`;
      case 'ts':
        return `// ${filename}
export interface Config {
  apiUrl: string;
  timeout: number;
}

export const defaultConfig: Config = {
  apiUrl: 'http://localhost:3000',
  timeout: 5000,
};`;
      case 'js':
        return `// ${filename}
function main() {
  console.log('Hello from ${filename}');
}

main();`;
      case 'json':
        return `{
  "name": "demo-project",
  "version": "1.0.0",
  "description": "A demo project",
  "main": "index.js",
  "scripts": {
    "start": "npm run dev",
    "dev": "vite",
    "build": "vite build"
  }
}`;
      case 'md':
        return `# ${filename.replace('.md', '')}

This is a demo markdown file.

## Features

- Feature 1
- Feature 2
- Feature 3

\`\`\`typescript
const example = "Hello World";
console.log(example);
\`\`\``;
      case 'html':
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo App</title>
</head>
<body>
    <div id="root"></div>
    <script src="./main.tsx"></script>
</body>
</html>`;
      case 'css':
        return `.${filename.replace('.css', '')} {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  margin: 8px;
}`;
      default:
        return `// ${filename}
// This is a sample file for demonstration
// Edit this content to see the editor in action

console.log('Hello from ${filename}');`;
    }
  };

  const toggleExpanded = (path: string) => {
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === path) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    setFileTree(updateNode(fileTree));
  };

  const handleFileClick = async (node: FileNode) => {
    if (node.isDirectory) {
      toggleExpanded(node.path);
    } else {
      try {
        const content = await getFileContent(node.path);
        const file: EditorFile = {
          id: node.path,
          name: node.name,
          path: node.path,
          content,
          language: getLanguageFromExtension(node.name)
        };
        openFile(file);
      } catch (error) {
        console.error('Failed to open file:', error);
        // Fallback to empty content
        const file: EditorFile = {
          id: node.path,
          name: node.name,
          path: node.path,
          content: `// Unable to load file content\n// Error: ${error}`,
          language: getLanguageFromExtension(node.name)
        };
        openFile(file);
      }
    }
  };

  const openFolder = async () => {
    setLoading(true);
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const folderPath = await open({
        directory: true,
        multiple: false,
      });

      if (folderPath) {
        const workspace = await fileSystemService.openWorkspace(folderPath as string);
        setCurrentWorkspace(workspace.path);
        await loadWorkspaceFiles();
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
    setLoading(false);
  };

  const renderFileNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    return (
      <div key={node.path}>
        <div
          className={`file-node ${node.isDirectory ? 'directory' : 'file'}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleFileClick(node)}
        >
          <span className="file-icon">
            {node.isDirectory ? (
              node.expanded ? '📂' : '📁'
            ) : (
              getFileIcon(node.name)
            )}
          </span>
          <span className="file-name">{node.name}</span>
        </div>
        {node.isDirectory && node.expanded && node.children && (
          <div className="file-children">
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getFileIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return '⚛️';
      case 'ts':
        return '🔷';
      case 'js':
        return '📜';
      case 'json':
        return '📄';
      case 'css':
        return '🎨';
      case 'html':
        return '🌐';
      case 'md':
        return '📝';
      case 'py':
        return '🐍';
      case 'rs':
        return '🦀';
      case 'go':
        return '🐹';
      default:
        return '📄';
    }
  };

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        <h3>Explorer</h3>
        <button onClick={openFolder} disabled={loading} className="open-folder-btn">
          {loading ? '...' : '📁'}
        </button>
      </div>

      <div className="file-tree-content">
        {fileTree.length === 0 ? (
          <div className="empty-state">
            <p>No folder opened</p>
            <p>Click the folder icon to open a project</p>
          </div>
        ) : (
          fileTree.map(node => renderFileNode(node))
        )}
      </div>
    </div>
  );
};