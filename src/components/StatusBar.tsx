import React from 'react';
import './StatusBar.css';

interface EditorFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
}

interface StatusBarProps {
  activeFile: EditorFile | null;
  terminalVisible: boolean;
  isOnline?: boolean;
  pendingOperations?: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ activeFile, terminalVisible }) => {
  const getFileStats = () => {
    if (!activeFile) return { lines: 0, chars: 0, words: 0 };
    
    const lines = activeFile.content.split('\n').length;
    const chars = activeFile.content.length;
    const words = activeFile.content.trim() ? activeFile.content.trim().split(/\s+/).length : 0;
    
    return { lines, chars, words };
  };

  const stats = getFileStats();

  return (
    <div className="status-bar">
      <div className="status-left">
        {activeFile && (
          <>
            <span className="status-item">
              📄 {activeFile.name}
            </span>
            <span className="status-item">
              🔤 {activeFile.language}
            </span>
            <span className="status-item">
              📊 Ln {stats.lines}, Ch {stats.chars}
            </span>
          </>
        )}
      </div>

      <div className="status-center">
        <span className="status-item">
          🚀 AI Code IDE v1.0.0
        </span>
      </div>

      <div className="status-right">
        <span className="status-item">
          ⚡ Tauri + React
        </span>
        <span className="status-item">
          🖥️ Terminal: {terminalVisible ? 'On' : 'Off'}
        </span>
        <span className="status-item">
          🕒 {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};