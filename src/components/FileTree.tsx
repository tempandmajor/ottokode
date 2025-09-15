import React, { useState, useEffect } from 'react';
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

interface FileTreeProps {
  onFileOpen: (file: EditorFile) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ onFileOpen }) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);

  // Sample file tree for demo
  useEffect(() => {
    // Initialize with some sample files for demo
    const sampleTree: FileNode[] = [
      {
        name: 'src',
        path: '/demo/src',
        isDirectory: true,
        expanded: true,
        children: [
          {
            name: 'components',
            path: '/demo/src/components',
            isDirectory: true,
            expanded: false,
            children: [
              {
                name: 'Button.tsx',
                path: '/demo/src/components/Button.tsx',
                isDirectory: false
              },
              {
                name: 'Modal.tsx',
                path: '/demo/src/components/Modal.tsx',
                isDirectory: false
              }
            ]
          },
          {
            name: 'App.tsx',
            path: '/demo/src/App.tsx',
            isDirectory: false
          },
          {
            name: 'main.tsx',
            path: '/demo/src/main.tsx',
            isDirectory: false
          }
        ]
      },
      {
        name: 'public',
        path: '/demo/public',
        isDirectory: true,
        expanded: false,
        children: [
          {
            name: 'index.html',
            path: '/demo/public/index.html',
            isDirectory: false
          }
        ]
      },
      {
        name: 'package.json',
        path: '/demo/package.json',
        isDirectory: false
      },
      {
        name: 'README.md',
        path: '/demo/README.md',
        isDirectory: false
      }
    ];
    setFileTree(sampleTree);
  }, []);

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

  const handleFileClick = (node: FileNode) => {
    if (node.isDirectory) {
      toggleExpanded(node.path);
    } else {
      const file: EditorFile = {
        id: node.path,
        name: node.name,
        path: node.path,
        content: getSampleContent(node.name),
        language: getLanguageFromExtension(node.name)
      };
      onFileOpen(file);
    }
  };

  const openFolder = async () => {
    setLoading(true);
    try {
      // This would normally use Tauri's file system API
      // For demo purposes, we'll use the sample tree
      console.log('Opening folder...');
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