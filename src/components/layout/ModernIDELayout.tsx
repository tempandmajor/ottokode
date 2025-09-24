import React, { useState, useEffect } from 'react';
import { useUIStore, useEditorStore, useAuthStore } from '../../store';

// Icons for activity bar
const ActivityBarIcons = {
  explorer: '📁',
  search: '🔍',
  sourceControl: '🔀',
  chat: '💬',
  agents: '🤖',
  extensions: '🧩',
  settings: '⚙️'
};

interface ModernIDELayoutProps {
  children: React.ReactNode;
}

export const ModernIDELayout: React.FC<ModernIDELayoutProps> = ({ children }) => {
  const [activePanel, setActivePanel] = useState<string>('explorer');
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [panelWidth, setPanelWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);

  const { authState } = useAuthStore();

  // Handle panel visibility toggle
  const togglePanel = (panelId: string) => {
    if (activePanel === panelId && isPanelVisible) {
      setIsPanelVisible(false);
    } else {
      setActivePanel(panelId);
      setIsPanelVisible(true);
    }
  };

  // Handle panel resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(600, e.clientX));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="modern-ide-layout">
      {/* Title Bar (macOS style) */}
      <div className="title-bar">
        <div className="title-bar-controls">
          <div className="traffic-lights">
            <div className="traffic-light close"></div>
            <div className="traffic-light minimize"></div>
            <div className="traffic-light maximize"></div>
          </div>
        </div>
        <div className="title-bar-title">Ottokode</div>
        <div className="title-bar-user">
          {authState.user ? (
            <div className="user-avatar">
              {authState.user.avatar_url ? (
                <img src={authState.user.avatar_url} alt="User" />
              ) : (
                <span>{authState.user.name?.[0] || authState.user.email[0]}</span>
              )}
            </div>
          ) : (
            <button className="sign-in-btn">Sign In</button>
          )}
        </div>
      </div>

      <div className="ide-body">
        {/* Activity Bar (left) */}
        <div className="activity-bar">
          <div className="activity-items">
            <ActivityBarItem
              id="explorer"
              icon={ActivityBarIcons.explorer}
              tooltip="Explorer"
              isActive={activePanel === 'explorer' && isPanelVisible}
              onClick={() => togglePanel('explorer')}
            />
            <ActivityBarItem
              id="search"
              icon={ActivityBarIcons.search}
              tooltip="Search"
              isActive={activePanel === 'search' && isPanelVisible}
              onClick={() => togglePanel('search')}
            />
            <ActivityBarItem
              id="sourceControl"
              icon={ActivityBarIcons.sourceControl}
              tooltip="Source Control"
              isActive={activePanel === 'sourceControl' && isPanelVisible}
              onClick={() => togglePanel('sourceControl')}
            />
            <ActivityBarItem
              id="chat"
              icon={ActivityBarIcons.chat}
              tooltip="AI Chat"
              isActive={activePanel === 'chat' && isPanelVisible}
              onClick={() => togglePanel('chat')}
            />
            <ActivityBarItem
              id="agents"
              icon={ActivityBarIcons.agents}
              tooltip="AI Agents"
              isActive={activePanel === 'agents' && isPanelVisible}
              onClick={() => togglePanel('agents')}
            />
          </div>
          <div className="activity-items-bottom">
            <ActivityBarItem
              id="extensions"
              icon={ActivityBarIcons.extensions}
              tooltip="Extensions"
              isActive={activePanel === 'extensions' && isPanelVisible}
              onClick={() => togglePanel('extensions')}
            />
            <ActivityBarItem
              id="settings"
              icon={ActivityBarIcons.settings}
              tooltip="Settings"
              isActive={activePanel === 'settings' && isPanelVisible}
              onClick={() => togglePanel('settings')}
            />
          </div>
        </div>

        {/* Primary Sidebar Panel */}
        {isPanelVisible && (
          <div
            className="primary-sidebar"
            style={{ width: panelWidth }}
          >
            <div className="panel-header">
              <h3 className="panel-title">
                {getPanelTitle(activePanel)}
              </h3>
              <div className="panel-actions">
                <button
                  className="panel-action-btn"
                  onClick={() => setIsPanelVisible(false)}
                  title="Close Panel"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="panel-content">
              <PanelContent activePanel={activePanel} />
            </div>

            {/* Resize Handle */}
            <div
              className="resize-handle"
              onMouseDown={handleMouseDown}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="main-content">
          {children}
        </div>
      </div>

      <style jsx>{`
        .modern-ide-layout {
          height: 100vh;
          background: #1e1e1e;
          color: #cccccc;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .title-bar {
          height: 28px;
          background: #323233;
          display: flex;
          align-items: center;
          padding: 0 16px;
          user-select: none;
          -webkit-app-region: drag;
        }

        .title-bar-controls {
          display: flex;
          align-items: center;
        }

        .traffic-lights {
          display: flex;
          gap: 8px;
        }

        .traffic-light {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          -webkit-app-region: no-drag;
          cursor: pointer;
        }

        .traffic-light.close {
          background: #ff5f57;
        }

        .traffic-light.minimize {
          background: #febc2e;
        }

        .traffic-light.maximize {
          background: #28ca42;
        }

        .title-bar-title {
          flex: 1;
          text-align: center;
          font-size: 13px;
          font-weight: 500;
          color: #cccccc;
        }

        .title-bar-user {
          -webkit-app-region: no-drag;
        }

        .user-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #4F46E5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
          overflow: hidden;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sign-in-btn {
          background: none;
          border: 1px solid #464647;
          color: #cccccc;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
        }

        .sign-in-btn:hover {
          background: #3c3c3c;
        }

        .ide-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .activity-bar {
          width: 48px;
          background: #2c2c2c;
          border-right: 1px solid #3c3c3c;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 8px 0;
        }

        .activity-items,
        .activity-items-bottom {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .primary-sidebar {
          background: #252526;
          border-right: 1px solid #3c3c3c;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .panel-header {
          height: 35px;
          padding: 0 16px;
          background: #2d2d30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #3c3c3c;
        }

        .panel-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #cccccc;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .panel-actions {
          display: flex;
          gap: 4px;
        }

        .panel-action-btn {
          background: none;
          border: none;
          color: #888888;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 2px;
          font-size: 16px;
          line-height: 1;
        }

        .panel-action-btn:hover {
          background: #3c3c3c;
          color: #cccccc;
        }

        .panel-content {
          flex: 1;
          overflow: hidden;
        }

        .resize-handle {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          cursor: ew-resize;
          background: transparent;
        }

        .resize-handle:hover {
          background: #007acc;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

// Activity Bar Item Component
interface ActivityBarItemProps {
  id: string;
  icon: string;
  tooltip: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

const ActivityBarItem: React.FC<ActivityBarItemProps> = ({
  id,
  icon,
  tooltip,
  isActive,
  onClick,
  badge
}) => {
  return (
    <div className="activity-bar-item-container">
      <button
        className={`activity-bar-item ${isActive ? 'active' : ''}`}
        onClick={onClick}
        title={tooltip}
        data-testid={`activity-${id}`}
      >
        <span className="activity-icon">{icon}</span>
        {badge && <span className="activity-badge">{badge}</span>}
      </button>
      {isActive && <div className="activity-indicator" />}

      <style jsx>{`
        .activity-bar-item-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .activity-bar-item {
          width: 32px;
          height: 32px;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 4px;
          position: relative;
          transition: all 0.15s ease;
        }

        .activity-bar-item:hover {
          background: #3c3c3c;
        }

        .activity-bar-item.active {
          background: #094771;
        }

        .activity-icon {
          font-size: 16px;
          filter: grayscale(0.3);
        }

        .activity-bar-item.active .activity-icon {
          filter: none;
        }

        .activity-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #f14c4c;
          color: white;
          font-size: 9px;
          font-weight: bold;
          padding: 1px 4px;
          border-radius: 8px;
          min-width: 14px;
          text-align: center;
          line-height: 1.2;
        }

        .activity-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 16px;
          background: #007acc;
          border-radius: 0 1px 1px 0;
        }
      `}</style>
    </div>
  );
};

// Panel Content Component
interface PanelContentProps {
  activePanel: string;
}

const PanelContent: React.FC<PanelContentProps> = ({ activePanel }) => {
  const renderPanelContent = () => {
    switch (activePanel) {
      case 'explorer':
        return <ExplorerPanel />;
      case 'search':
        return <SearchPanel />;
      case 'sourceControl':
        return <SourceControlPanel />;
      case 'chat':
        return <ChatPanel />;
      case 'agents':
        return <AgentsPanel />;
      case 'extensions':
        return <ExtensionsPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <div>Panel not found</div>;
    }
  };

  return (
    <div className="panel-content-wrapper">
      {renderPanelContent()}

      <style jsx>{`
        .panel-content-wrapper {
          height: 100%;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

// Individual Panel Components
const ExplorerPanel: React.FC = () => (
  <div className="explorer-panel">
    <div className="panel-section">
      <div className="section-header">
        <span>FOLDER</span>
        <button className="section-action" title="Open Folder">📂</button>
      </div>
      <div className="file-tree">
        <div className="file-item folder">
          <span className="file-icon">📁</span>
          <span>src</span>
        </div>
        <div className="file-item file">
          <span className="file-icon">📄</span>
          <span>package.json</span>
        </div>
      </div>
    </div>
  </div>
);

const SearchPanel: React.FC = () => (
  <div className="search-panel">
    <div className="search-input-container">
      <input
        type="text"
        placeholder="Search files..."
        className="search-input"
      />
      <button className="search-btn">🔍</button>
    </div>
    <div className="search-results">
      <div className="search-result">
        <div className="result-file">src/App.tsx</div>
        <div className="result-line">Line 42: console.log</div>
      </div>
    </div>
  </div>
);

const SourceControlPanel: React.FC = () => (
  <div className="source-control-panel">
    <div className="panel-section">
      <div className="section-header">
        <span>CHANGES</span>
        <span className="change-count">2</span>
      </div>
      <div className="changes-list">
        <div className="change-item modified">
          <span className="change-status">M</span>
          <span>src/App.tsx</span>
        </div>
        <div className="change-item added">
          <span className="change-status">A</span>
          <span>src/NewFile.tsx</span>
        </div>
      </div>
    </div>
  </div>
);

const ChatPanel: React.FC = () => (
  <div className="chat-panel">
    <div className="chat-header">
      <button className="new-chat-btn">+ New Chat</button>
    </div>
    <div className="chat-messages">
      <div className="message user">
        <div className="message-content">How do I implement authentication?</div>
      </div>
      <div className="message assistant">
        <div className="message-content">I can help you implement authentication. Here are the key approaches...</div>
      </div>
    </div>
    <div className="chat-input-container">
      <textarea
        placeholder="Ask anything about your codebase..."
        className="chat-input"
        rows={3}
      />
      <button className="send-btn">Send</button>
    </div>
  </div>
);

const AgentsPanel: React.FC = () => (
  <div className="agents-panel">
    <div className="panel-section">
      <div className="section-header">
        <span>ACTIVE AGENTS</span>
        <button className="section-action" title="New Agent">+</button>
      </div>
      <div className="agents-list">
        <div className="agent-item active">
          <div className="agent-status"></div>
          <div className="agent-info">
            <div className="agent-name">Code Reviewer</div>
            <div className="agent-task">Reviewing PR #123</div>
          </div>
        </div>
        <div className="agent-item">
          <div className="agent-status idle"></div>
          <div className="agent-info">
            <div className="agent-name">Test Generator</div>
            <div className="agent-task">Idle</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ExtensionsPanel: React.FC = () => (
  <div className="extensions-panel">
    <div className="search-input-container">
      <input
        type="text"
        placeholder="Search extensions..."
        className="search-input"
      />
    </div>
    <div className="extensions-list">
      <div className="extension-item">
        <div className="extension-icon">🎨</div>
        <div className="extension-info">
          <div className="extension-name">Theme Studio</div>
          <div className="extension-author">Ottokode</div>
        </div>
        <button className="install-btn">Install</button>
      </div>
    </div>
  </div>
);

const SettingsPanel: React.FC = () => (
  <div className="settings-panel">
    <div className="settings-search">
      <input
        type="text"
        placeholder="Search settings..."
        className="search-input"
      />
    </div>
    <div className="settings-sections">
      <div className="settings-section">
        <div className="section-title">Editor</div>
        <div className="setting-item">
          <label>
            <input type="checkbox" defaultChecked />
            Auto Save
          </label>
        </div>
      </div>
      <div className="settings-section">
        <div className="section-title">AI</div>
        <div className="setting-item">
          <label>
            <input type="checkbox" defaultChecked />
            Code Completion
          </label>
        </div>
      </div>
    </div>
  </div>
);

// Helper function to get panel titles
const getPanelTitle = (panelId: string): string => {
  const titles = {
    explorer: 'Explorer',
    search: 'Search',
    sourceControl: 'Source Control',
    chat: 'AI Chat',
    agents: 'AI Agents',
    extensions: 'Extensions',
    settings: 'Settings'
  };
  return titles[panelId as keyof typeof titles] || 'Panel';
};

export default ModernIDELayout;