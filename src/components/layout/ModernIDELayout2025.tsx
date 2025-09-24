import React, { useState, useEffect, useRef } from 'react';
import { useUIStore, useEditorStore, useAuthStore } from '../../store';

// Modern 2025 Icons (more refined)
const ActivityBarIcons = {
  explorer: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M14.5 3H7.71l-.85-.85L6.51 2h-5L1 2.5v11l.5.5h13l.5-.5v-10L14.5 3zm-.51 10.49H2V13h11.99v.49zm0-7.99H8.49l-.35-.15-.86-.86H2v-.49h11.99V5.5z"/>
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M15.7 13.3l-3.81-3.83A5.93 5.93 0 0 0 13 6c0-3.31-2.69-6-6-6S1 2.69 1 6s2.69 6 6 6c1.3 0 2.48-.41 3.47-1.11l3.83 3.81c.19.2.45.3.7.3.25 0 .52-.09.7-.3a.996.996 0 0 0 0-1.4zM7 10.7c-2.59 0-4.7-2.11-4.7-4.7 0-2.59 2.11-4.7 4.7-4.7 2.59 0 4.7 2.11 4.7 4.7 0 2.59-2.11 4.7-4.7 4.7z"/>
    </svg>
  ),
  sourceControl: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.75 1a.75.75 0 0 0-.75.75V3h-.5a.5.5 0 0 0 0 1H4v1.25c0 .414.336.75.75.75s.75-.336.75-.75V4h.5a.5.5 0 0 0 0-1h-.5V1.75A.75.75 0 0 0 4.75 1zm6.5 0a.75.75 0 0 0-.75.75V3h-.5a.5.5 0 0 0 0 1h.5v1.25c0 .414.336.75.75.75s.75-.336.75-.75V4h.5a.5.5 0 0 0 0-1h-.5V1.75A.75.75 0 0 0 11.25 1z"/>
    </svg>
  ),
  chat: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414l-3.707 3.707A1 1 0 0 1 0 14V2a1 1 0 0 1 1-1h13z"/>
    </svg>
  ),
  cascade: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0L6.5 1.5 8 3 9.5 1.5 8 0zM3 6.5L1.5 8 3 9.5 4.5 8 3 6.5zM13 6.5L11.5 8 13 9.5 14.5 8 13 6.5zM8 13L6.5 14.5 8 16 9.5 14.5 8 13z"/>
    </svg>
  ),
  agent: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM6.5 5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm4.879 6.606A6.966 6.966 0 0 1 8 13a6.966 6.966 0 0 1-3.379-1.394A3.002 3.002 0 0 1 7 9h2a3.002 3.002 0 0 1 2.379 2.606z"/>
    </svg>
  ),
  extensions: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8.5 1L7 3.5 4.5 5 7 6.5 8.5 9 10 6.5 12.5 5 10 3.5 8.5 1zM1 8.5L2.5 10 5 8.5 3.5 7 1 8.5zM11 8.5L12.5 7 15 8.5 12.5 10 11 8.5zM8.5 15L7 12.5 4.5 11 7 9.5 8.5 7 10 9.5 12.5 11 10 12.5 8.5 15z"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
    </svg>
  )
};

interface ModernIDELayout2025Props {
  children: React.ReactNode;
}

export const ModernIDELayout2025: React.FC<ModernIDELayout2025Props> = ({ children }) => {
  const [activePanel, setActivePanel] = useState<string>('explorer');
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [panelWidth, setPanelWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [cascadeMode, setCascadeMode] = useState<'chat' | 'agent' | 'turbo'>('chat');
  const [compactMode, setCompactMode] = useState(false);

  const { authState } = useAuthStore();
  const resizeRef = useRef<HTMLDivElement>(null);

  // Handle panel visibility toggle (Cursor/Windsurf style)
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
    <div className="modern-ide-layout-2025">
      {/* macOS-style Title Bar with Traffic Lights */}
      <div className="title-bar">
        <div className="title-bar-left">
          <div className="traffic-lights">
            <div className="traffic-light close" />
            <div className="traffic-light minimize" />
            <div className="traffic-light maximize" />
          </div>
          <div className="title-text">Ottokode</div>
        </div>
        <div className="title-bar-center">
          {/* Command Palette Trigger */}
          <div className="command-palette-hint">
            Press ⌘K to open command palette
          </div>
        </div>
        <div className="title-bar-right">
          {/* User Account & Settings */}
          {authState.user ? (
            <div className="user-profile">
              <div className="user-avatar">
                {authState.user.avatar_url ? (
                  <img src={authState.user.avatar_url} alt="User" />
                ) : (
                  <span>{authState.user.name?.[0] || authState.user.email[0]}</span>
                )}
              </div>
              <span className="user-name">{authState.user.name || 'User'}</span>
            </div>
          ) : (
            <button className="sign-in-btn" onClick={() => togglePanel('auth')}>
              Sign In
            </button>
          )}
        </div>
      </div>

      <div className="ide-body">
        {/* Activity Bar (Cursor 2025 style) */}
        <div className="activity-bar">
          <div className="activity-top">
            <ActivityBarItem2025
              id="explorer"
              icon={ActivityBarIcons.explorer}
              tooltip="Explorer (⇧⌘E)"
              isActive={activePanel === 'explorer' && isPanelVisible}
              onClick={() => togglePanel('explorer')}
              shortcut="⇧⌘E"
            />
            <ActivityBarItem2025
              id="search"
              icon={ActivityBarIcons.search}
              tooltip="Search (⇧⌘F)"
              isActive={activePanel === 'search' && isPanelVisible}
              onClick={() => togglePanel('search')}
              shortcut="⇧⌘F"
            />
            <ActivityBarItem2025
              id="sourceControl"
              icon={ActivityBarIcons.sourceControl}
              tooltip="Source Control (⌃⇧G)"
              isActive={activePanel === 'sourceControl' && isPanelVisible}
              onClick={() => togglePanel('sourceControl')}
              badge={3} // Example: 3 changes
              shortcut="⌃⇧G"
            />
            <ActivityBarItem2025
              id="chat"
              icon={ActivityBarIcons.chat}
              tooltip="AI Chat (⌘L)"
              isActive={activePanel === 'chat' && isPanelVisible}
              onClick={() => togglePanel('chat')}
              shortcut="⌘L"
              isAI={true}
            />
            <ActivityBarItem2025
              id="cascade"
              icon={ActivityBarIcons.cascade}
              tooltip="Cascade (⌘K)"
              isActive={activePanel === 'cascade' && isPanelVisible}
              onClick={() => togglePanel('cascade')}
              shortcut="⌘K"
              isAI={true}
              isNew={true}
            />
            <ActivityBarItem2025
              id="agent"
              icon={ActivityBarIcons.agent}
              tooltip="AI Agents (⌘⇧A)"
              isActive={activePanel === 'agent' && isPanelVisible}
              onClick={() => togglePanel('agent')}
              shortcut="⌘⇧A"
              isAI={true}
              badge={2} // Example: 2 active agents
            />
          </div>
          <div className="activity-bottom">
            <ActivityBarItem2025
              id="extensions"
              icon={ActivityBarIcons.extensions}
              tooltip="Extensions (⇧⌘X)"
              isActive={activePanel === 'extensions' && isPanelVisible}
              onClick={() => togglePanel('extensions')}
              shortcut="⇧⌘X"
            />
            <ActivityBarItem2025
              id="settings"
              icon={ActivityBarIcons.settings}
              tooltip="Settings (⌘,)"
              isActive={activePanel === 'settings' && isPanelVisible}
              onClick={() => togglePanel('settings')}
              shortcut="⌘,"
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
              <div className="panel-title-area">
                <h3 className="panel-title">
                  {getPanelTitle2025(activePanel)}
                </h3>
                {activePanel === 'cascade' && (
                  <div className="cascade-mode-selector">
                    <button
                      className={cascadeMode === 'chat' ? 'active' : ''}
                      onClick={() => setCascadeMode('chat')}
                    >
                      Chat
                    </button>
                    <button
                      className={cascadeMode === 'agent' ? 'active' : ''}
                      onClick={() => setCascadeMode('agent')}
                    >
                      Agent
                    </button>
                    <button
                      className={cascadeMode === 'turbo' ? 'active' : ''}
                      onClick={() => setCascadeMode('turbo')}
                    >
                      Turbo
                    </button>
                  </div>
                )}
              </div>
              <div className="panel-actions">
                {(activePanel === 'chat' || activePanel === 'cascade') && (
                  <button className="panel-action-btn" title="New Conversation">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                      <path d="M7.5 1.5V6h4.5v1H7.5v4.5h-1V7H2v-1h4.5V1.5h1z"/>
                    </svg>
                  </button>
                )}
                <button
                  className="panel-action-btn"
                  onClick={() => setCompactMode(!compactMode)}
                  title="Toggle Compact Mode"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <path d="M2 3h10v1H2V3zm0 3h10v1H2V6zm0 3h7v1H2V9z"/>
                  </svg>
                </button>
                <button
                  className="panel-action-btn"
                  onClick={() => setIsPanelVisible(false)}
                  title="Close Panel"
                >
                  ×
                </button>
              </div>
            </div>
            <div className={`panel-content ${compactMode ? 'compact' : ''}`}>
              <PanelContent2025 activePanel={activePanel} cascadeMode={cascadeMode} compactMode={compactMode} />
            </div>

            {/* Resize Handle */}
            <div
              ref={resizeRef}
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
        .modern-ide-layout-2025 {
          height: 100vh;
          background: #1e1e1e;
          color: #cccccc;
          display: flex;
          flex-direction: column;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 13px;
        }

        .title-bar {
          height: 32px;
          background: linear-gradient(180deg, #3c3c3c 0%, #323233 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          user-select: none;
          -webkit-app-region: drag;
          border-bottom: 1px solid #2d2d30;
        }

        .title-bar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          -webkit-app-region: no-drag;
        }

        .traffic-lights {
          display: flex;
          gap: 8px;
        }

        .traffic-light {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .traffic-light:hover {
          opacity: 0.8;
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

        .title-text {
          font-size: 13px;
          font-weight: 500;
          color: #cccccc;
        }

        .title-bar-center {
          flex: 1;
          display: flex;
          justify-content: center;
          -webkit-app-region: no-drag;
        }

        .command-palette-hint {
          font-size: 11px;
          color: #8c8c8c;
          background: #2d2d30;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid #3c3c3c;
        }

        .title-bar-right {
          display: flex;
          align-items: center;
          -webkit-app-region: no-drag;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .user-profile:hover {
          background: #3c3c3c;
        }

        .user-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #007acc;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: 600;
          overflow: hidden;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-name {
          font-size: 12px;
          color: #cccccc;
        }

        .sign-in-btn {
          background: #007acc;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .sign-in-btn:hover {
          background: #005a9e;
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

        .activity-top,
        .activity-bottom {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: center;
        }

        .primary-sidebar {
          background: #252526;
          border-right: 1px solid #3c3c3c;
          display: flex;
          flex-direction: column;
          position: relative;
          min-width: 200px;
          max-width: 600px;
        }

        .panel-header {
          height: 40px;
          padding: 0 16px;
          background: #2d2d30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #3c3c3c;
        }

        .panel-title-area {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .panel-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #cccccc;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .cascade-mode-selector {
          display: flex;
          background: #1e1e1e;
          border-radius: 6px;
          padding: 2px;
          gap: 1px;
        }

        .cascade-mode-selector button {
          background: none;
          border: none;
          color: #8c8c8c;
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cascade-mode-selector button:hover {
          color: #cccccc;
        }

        .cascade-mode-selector button.active {
          background: #007acc;
          color: white;
        }

        .panel-actions {
          display: flex;
          gap: 2px;
        }

        .panel-action-btn {
          background: none;
          border: none;
          color: #8c8c8c;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 4px;
          font-size: 14px;
          line-height: 1;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .panel-action-btn:hover {
          background: #3c3c3c;
          color: #cccccc;
        }

        .panel-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .panel-content.compact {
          font-size: 12px;
        }

        .resize-handle {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          cursor: ew-resize;
          background: transparent;
          transition: background 0.2s;
        }

        .resize-handle:hover {
          background: #007acc;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #1e1e1e;
        }
      `}</style>
    </div>
  );
};

// Modern Activity Bar Item Component (2025 style)
interface ActivityBarItem2025Props {
  id: string;
  icon: React.ReactNode;
  tooltip: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
  shortcut?: string;
  isAI?: boolean;
  isNew?: boolean;
}

const ActivityBarItem2025: React.FC<ActivityBarItem2025Props> = ({
  id,
  icon,
  tooltip,
  isActive,
  onClick,
  badge,
  shortcut,
  isAI = false,
  isNew = false
}) => {
  return (
    <div className="activity-bar-item-container">
      <div
        className={`activity-bar-item ${isActive ? 'active' : ''} ${isAI ? 'ai-item' : ''}`}
        onClick={onClick}
        title={`${tooltip} ${shortcut || ''}`}
        data-testid={`activity-${id}`}
      >
        <div className="activity-icon">{icon}</div>
        {badge && <div className="activity-badge">{badge}</div>}
        {isNew && <div className="activity-new-badge">NEW</div>}
        {isAI && <div className="ai-indicator" />}
      </div>
      {isActive && <div className="activity-indicator" />}

      <style jsx>{`
        .activity-bar-item-container {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
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
          border-radius: 6px;
          position: relative;
          transition: all 0.2s ease;
          margin: 0 auto;
        }

        .activity-bar-item:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.05);
        }

        .activity-bar-item.active {
          background: #007acc;
          color: white;
        }

        .activity-bar-item.ai-item {
          border: 1px solid rgba(0, 122, 204, 0.3);
        }

        .activity-bar-item.ai-item:hover {
          border-color: #007acc;
          box-shadow: 0 0 8px rgba(0, 122, 204, 0.3);
        }

        .activity-icon {
          color: #cccccc;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .activity-bar-item.active .activity-icon {
          color: white;
        }

        .activity-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #f14c4c;
          color: white;
          font-size: 9px;
          font-weight: 600;
          padding: 1px 4px;
          border-radius: 8px;
          min-width: 14px;
          text-align: center;
          line-height: 1.2;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .activity-new-badge {
          position: absolute;
          top: -4px;
          right: -8px;
          background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
          color: white;
          font-size: 7px;
          font-weight: 700;
          padding: 1px 3px;
          border-radius: 3px;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
        }

        .ai-indicator {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 6px;
          height: 6px;
          background: linear-gradient(45deg, #00d4aa, #00b794);
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(0, 212, 170, 0.5);
        }

        .activity-indicator {
          position: absolute;
          left: -1px;
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

// Modern Panel Content Component (2025 style)
interface PanelContent2025Props {
  activePanel: string;
  cascadeMode?: 'chat' | 'agent' | 'turbo';
  compactMode?: boolean;
}

const PanelContent2025: React.FC<PanelContent2025Props> = ({
  activePanel,
  cascadeMode = 'chat',
  compactMode = false
}) => {
  const renderPanelContent = () => {
    switch (activePanel) {
      case 'explorer':
        return <ExplorerPanel2025 compactMode={compactMode} />;
      case 'search':
        return <SearchPanel2025 compactMode={compactMode} />;
      case 'sourceControl':
        return <SourceControlPanel2025 compactMode={compactMode} />;
      case 'chat':
        return <ChatPanel2025 compactMode={compactMode} />;
      case 'cascade':
        return <CascadePanel2025 mode={cascadeMode} compactMode={compactMode} />;
      case 'agent':
        return <AgentPanel2025 compactMode={compactMode} />;
      case 'extensions':
        return <ExtensionsPanel2025 compactMode={compactMode} />;
      case 'settings':
        return <SettingsPanel2025 compactMode={compactMode} />;
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
          overflow-x: hidden;
        }

        .panel-content-wrapper::-webkit-scrollbar {
          width: 6px;
        }

        .panel-content-wrapper::-webkit-scrollbar-track {
          background: #2d2d30;
        }

        .panel-content-wrapper::-webkit-scrollbar-thumb {
          background: #424245;
          border-radius: 3px;
        }

        .panel-content-wrapper::-webkit-scrollbar-thumb:hover {
          background: #4e4e50;
        }
      `}</style>
    </div>
  );
};

// Modern Panel Components for 2025
const ExplorerPanel2025: React.FC<{ compactMode: boolean }> = ({ compactMode }) => (
  <div className={`explorer-panel-2025 ${compactMode ? 'compact' : ''}`}>
    <div className="panel-section">
      <div className="section-header">
        <div className="section-title">
          <span>WORKSPACE</span>
          <span className="file-count">12 files</span>
        </div>
        <div className="section-actions">
          <button className="section-action" title="New File">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M7.5 1.5V6h4.5v1H7.5v4.5h-1V7H2v-1h4.5V1.5h1z"/>
            </svg>
          </button>
          <button className="section-action" title="New Folder">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M1.5 2.5v9h11v-7H8L7 3.5H1.5zm0-1h5l1 1h5.5v8.5h-12v-10z"/>
            </svg>
          </button>
          <button className="section-action" title="Refresh">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M7 1a6 6 0 0 0-5.27 8.87l.54-.84A5 5 0 1 1 7 12v-1a4 4 0 1 0-3.46-6l.54.84L2 7h3V4L3.54 5.46A5 5 0 0 1 7 1z"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="file-tree">
        <FileTreeItem name="src" type="folder" level={0} expanded={true} />
        <FileTreeItem name="components" type="folder" level={1} expanded={true} />
        <FileTreeItem name="App.tsx" type="file" level={2} active={true} />
        <FileTreeItem name="package.json" type="file" level={0} />
        <FileTreeItem name="README.md" type="file" level={0} />
      </div>
    </div>

    <style jsx>{`
      .explorer-panel-2025 {
        padding: 12px;
      }

      .explorer-panel-2025.compact {
        padding: 8px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid #3c3c3c;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        font-weight: 600;
        color: #cccccc;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .file-count {
        color: #8c8c8c;
        font-weight: 400;
      }

      .section-actions {
        display: flex;
        gap: 2px;
      }

      .section-action {
        background: none;
        border: none;
        color: #8c8c8c;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .section-action:hover {
        background: #3c3c3c;
        color: #cccccc;
      }
    `}</style>
  </div>
);

const FileTreeItem: React.FC<{
  name: string;
  type: 'file' | 'folder';
  level: number;
  expanded?: boolean;
  active?: boolean;
}> = ({ name, type, level, expanded = false, active = false }) => (
  <div
    className={`file-tree-item ${active ? 'active' : ''}`}
    style={{ paddingLeft: `${level * 16 + 8}px` }}
  >
    <div className="file-item-content">
      {type === 'folder' ? (
        <span className="file-icon">{expanded ? '📂' : '📁'}</span>
      ) : (
        <span className="file-icon">📄</span>
      )}
      <span className="file-name">{name}</span>
    </div>

    <style jsx>{`
      .file-tree-item {
        padding: 3px 8px;
        cursor: pointer;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .file-tree-item:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .file-tree-item.active {
        background: #007acc;
        color: white;
      }

      .file-item-content {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .file-icon {
        font-size: 14px;
      }

      .file-name {
        font-size: 13px;
        color: #cccccc;
      }

      .file-tree-item.active .file-name {
        color: white;
      }
    `}</style>
  </div>
);

const SearchPanel2025: React.FC<{ compactMode: boolean }> = ({ compactMode }) => (
  <div className={`search-panel-2025 ${compactMode ? 'compact' : ''}`}>
    <div className="search-input-container">
      <input
        type="text"
        placeholder="Search files..."
        className="search-input"
      />
      <button className="search-btn">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M15.7 13.3l-3.81-3.83A5.93 5.93 0 0 0 13 6c0-3.31-2.69-6-6-6S1 2.69 1 6s2.69 6 6 6c1.3 0 2.48-.41 3.47-1.11l3.83 3.81c.19.2.45.3.7.3.25 0 .52-.09.7-.3a.996.996 0 0 0 0-1.4zM7 10.7c-2.59 0-4.7-2.11-4.7-4.7 0-2.59 2.11-4.7 4.7-4.7 2.59 0 4.7 2.11 4.7 4.7 0 2.59-2.11 4.7-4.7 4.7z"/>
        </svg>
      </button>
    </div>
    <div className="search-options">
      <label><input type="checkbox" /> Match Case</label>
      <label><input type="checkbox" /> Match Whole Word</label>
      <label><input type="checkbox" /> Use Regex</label>
    </div>
    <div className="search-results">
      <div className="results-summary">2 results in 2 files</div>
      <div className="search-result">
        <div className="result-file">
          <span className="file-icon">📄</span>
          <span>src/App.tsx</span>
          <span className="match-count">1</span>
        </div>
        <div className="result-matches">
          <div className="result-match">
            <span className="line-number">42</span>
            <span className="match-text">console.log('Hello World')</span>
          </div>
        </div>
      </div>
    </div>

    <style jsx>{`
      .search-panel-2025 {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .search-input-container {
        position: relative;
      }

      .search-input {
        width: 100%;
        padding: 8px 32px 8px 12px;
        background: #3c3c3c;
        border: 1px solid #5a5a5a;
        border-radius: 6px;
        color: #cccccc;
        font-size: 13px;
        outline: none;
        transition: border-color 0.2s;
      }

      .search-input:focus {
        border-color: #007acc;
      }

      .search-btn {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #8c8c8c;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
      }

      .search-btn:hover {
        background: #5a5a5a;
        color: #cccccc;
      }

      .search-options {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .search-options label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #cccccc;
        cursor: pointer;
      }

      .search-results {
        flex: 1;
        overflow-y: auto;
      }

      .results-summary {
        font-size: 11px;
        color: #8c8c8c;
        margin-bottom: 8px;
        padding: 4px 8px;
        background: #2d2d30;
        border-radius: 4px;
      }

      .search-result {
        margin-bottom: 8px;
      }

      .result-file {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        background: #2d2d30;
        border-radius: 4px;
        font-size: 12px;
        color: #cccccc;
      }

      .match-count {
        margin-left: auto;
        background: #007acc;
        color: white;
        padding: 1px 6px;
        border-radius: 8px;
        font-size: 10px;
      }

      .result-matches {
        margin-top: 4px;
        margin-left: 20px;
      }

      .result-match {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 2px 8px;
        font-size: 11px;
        color: #a0a0a0;
        cursor: pointer;
        border-radius: 4px;
      }

      .result-match:hover {
        background: #3c3c3c;
      }

      .line-number {
        color: #8c8c8c;
        min-width: 24px;
      }
    `}</style>
  </div>
);

const SourceControlPanel2025: React.FC<{ compactMode: boolean }> = ({ compactMode }) => (
  <div className={`source-control-panel-2025 ${compactMode ? 'compact' : ''}`}>
    <div className="panel-section">
      <div className="section-header">
        <div className="section-title">
          <span>CHANGES</span>
          <span className="change-count">3</span>
        </div>
        <div className="section-actions">
          <button className="section-action" title="Stage All Changes">+</button>
          <button className="section-action" title="Refresh">↻</button>
        </div>
      </div>
      <div className="changes-list">
        <ChangeItem file="src/App.tsx" status="M" />
        <ChangeItem file="src/NewFile.tsx" status="A" />
        <ChangeItem file="package.json" status="M" />
      </div>
    </div>

    <div className="commit-section">
      <textarea
        placeholder="Commit message..."
        className="commit-message"
        rows={3}
      />
      <button className="commit-btn">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 0L6 1v6l1 1 1-1V1L7 0zM3 3l1 1v3L3 8V3zm8 0v5l-1 1V4l1-1z"/>
        </svg>
        Commit
      </button>
    </div>

    <style jsx>{`
      .source-control-panel-2025 {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .commit-section {
        border-top: 1px solid #3c3c3c;
        padding-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .commit-message {
        width: 100%;
        padding: 8px 12px;
        background: #3c3c3c;
        border: 1px solid #5a5a5a;
        border-radius: 6px;
        color: #cccccc;
        font-size: 13px;
        font-family: inherit;
        outline: none;
        resize: vertical;
        min-height: 60px;
      }

      .commit-message:focus {
        border-color: #007acc;
      }

      .commit-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background: #007acc;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }

      .commit-btn:hover {
        background: #005a9e;
      }

      .commit-btn:disabled {
        background: #5a5a5a;
        cursor: not-allowed;
      }
    `}</style>
  </div>
);

const ChangeItem: React.FC<{ file: string; status: 'M' | 'A' | 'D' | 'R' }> = ({ file, status }) => (
  <div className="change-item">
    <div className="change-content">
      <span className={`change-status status-${status.toLowerCase()}`}>{status}</span>
      <span className="file-name">{file}</span>
    </div>
    <div className="change-actions">
      <button className="change-action" title="Stage">+</button>
      <button className="change-action" title="Discard">↶</button>
    </div>

    <style jsx>{`
      .change-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .change-item:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .change-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .change-status {
        font-size: 11px;
        font-weight: 600;
        width: 12px;
        text-align: center;
      }

      .change-status.status-m {
        color: #ff9500;
      }

      .change-status.status-a {
        color: #00d4aa;
      }

      .change-status.status-d {
        color: #f14c4c;
      }

      .file-name {
        font-size: 13px;
        color: #cccccc;
      }

      .change-actions {
        display: flex;
        gap: 2px;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .change-item:hover .change-actions {
        opacity: 1;
      }

      .change-action {
        background: none;
        border: none;
        color: #8c8c8c;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 2px;
        font-size: 12px;
        transition: all 0.2s;
      }

      .change-action:hover {
        background: #3c3c3c;
        color: #cccccc;
      }
    `}</style>
  </div>
);

const ChatPanel2025: React.FC<{ compactMode: boolean }> = ({ compactMode }) => (
  <div className={`chat-panel-2025 ${compactMode ? 'compact' : ''}`}>
    <div className="chat-header">
      <button className="new-chat-btn">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M7.5 1.5V6h4.5v1H7.5v4.5h-1V7H2v-1h4.5V1.5h1z"/>
        </svg>
        New Chat
      </button>
      <div className="chat-model-selector">
        <select className="model-select">
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="claude-3-opus">Claude 3 Opus</option>
          <option value="gemini-pro">Gemini Pro</option>
        </select>
      </div>
    </div>

    <div className="chat-messages">
      <ChatMessage
        role="user"
        content="How do I implement authentication in React?"
        timestamp="2 min ago"
      />
      <ChatMessage
        role="assistant"
        content="I can help you implement authentication in React. Here are the key approaches you can use..."
        timestamp="1 min ago"
        isStreaming={false}
      />
    </div>

    <div className="chat-input-container">
      <textarea
        placeholder="Ask anything about your codebase..."
        className="chat-input"
        rows={2}
      />
      <div className="input-actions">
        <button className="attach-btn" title="Attach Files">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M8.5 1L7 3.5 4.5 5 7 6.5 8.5 9 10 6.5 12.5 5 10 3.5 8.5 1z"/>
          </svg>
        </button>
        <button className="send-btn">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M1 7l12-6-12 6 3 3 9-9-9 9-3-3z"/>
          </svg>
        </button>
      </div>
    </div>

    <style jsx>{`
      .chat-panel-2025 {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .chat-header {
        padding: 12px;
        border-bottom: 1px solid #3c3c3c;
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .new-chat-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #007acc;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }

      .new-chat-btn:hover {
        background: #005a9e;
      }

      .chat-model-selector {
        flex: 1;
      }

      .model-select {
        width: 100%;
        background: #3c3c3c;
        color: #cccccc;
        border: 1px solid #5a5a5a;
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 12px;
        outline: none;
      }

      .chat-messages {
        flex: 1;
        padding: 12px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .chat-input-container {
        border-top: 1px solid #3c3c3c;
        padding: 12px;
      }

      .chat-input {
        width: 100%;
        padding: 8px 12px;
        background: #3c3c3c;
        border: 1px solid #5a5a5a;
        border-radius: 6px;
        color: #cccccc;
        font-size: 13px;
        font-family: inherit;
        outline: none;
        resize: none;
        margin-bottom: 8px;
        transition: border-color 0.2s;
      }

      .chat-input:focus {
        border-color: #007acc;
      }

      .input-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .attach-btn,
      .send-btn {
        background: none;
        border: none;
        color: #8c8c8c;
        cursor: pointer;
        padding: 6px;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .attach-btn:hover,
      .send-btn:hover {
        background: #3c3c3c;
        color: #cccccc;
      }

      .send-btn {
        background: #007acc;
        color: white;
      }

      .send-btn:hover {
        background: #005a9e;
      }
    `}</style>
  </div>
);

const ChatMessage: React.FC<{
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
}> = ({ role, content, timestamp, isStreaming = false }) => (
  <div className={`chat-message ${role}`}>
    <div className="message-header">
      <div className="message-avatar">
        {role === 'user' ? '👤' : '🤖'}
      </div>
      <div className="message-info">
        <span className="message-role">{role === 'user' ? 'You' : 'Assistant'}</span>
        {timestamp && <span className="message-timestamp">{timestamp}</span>}
      </div>
      {isStreaming && <div className="streaming-indicator">...</div>}
    </div>
    <div className="message-content">
      {content}
    </div>

    <style jsx>{`
      .chat-message {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .message-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .message-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #007acc;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
      }

      .chat-message.user .message-avatar {
        background: #5a5a5a;
      }

      .message-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .message-role {
        font-size: 12px;
        font-weight: 600;
        color: #cccccc;
      }

      .message-timestamp {
        font-size: 11px;
        color: #8c8c8c;
      }

      .streaming-indicator {
        color: #007acc;
        animation: pulse 1s infinite;
      }

      @keyframes pulse {
        0%, 50% { opacity: 1; }
        25%, 75% { opacity: 0.5; }
      }

      .message-content {
        padding: 8px 12px;
        background: #2d2d30;
        border-radius: 8px;
        border-left: 3px solid #007acc;
        font-size: 13px;
        line-height: 1.5;
        color: #cccccc;
        margin-left: 32px;
      }

      .chat-message.user .message-content {
        border-left-color: #5a5a5a;
        background: #3c3c3c;
      }
    `}</style>
  </div>
);

const CascadePanel2025: React.FC<{
  mode: 'chat' | 'agent' | 'turbo';
  compactMode: boolean
}> = ({ mode, compactMode }) => (
  <div className={`cascade-panel-2025 ${compactMode ? 'compact' : ''}`}>
    <div className="cascade-status">
      <div className="status-indicator active"></div>
      <span>Cascade {mode} mode active</span>
    </div>

    {mode === 'turbo' && (
      <div className="turbo-controls">
        <button className="turbo-btn">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 0L6 1v6l1 1 1-1V1L7 0z"/>
          </svg>
          Start Turbo Agent
        </button>
        <div className="turbo-status">
          Ready to execute autonomous tasks
        </div>
      </div>
    )}

    <div className="cascade-content">
      {mode === 'chat' ? (
        <div className="cascade-chat">
          <div className="system-message">
            Cascade is ready with full codebase awareness. Ask anything about your project.
          </div>
          <textarea
            placeholder="Describe what you want to build..."
            className="cascade-input"
            rows={4}
          />
        </div>
      ) : mode === 'agent' ? (
        <div className="cascade-agent">
          <div className="agent-tasks">
            <h4>Active Tasks</h4>
            <div className="task-item">
              <div className="task-status running"></div>
              <span>Analyzing component structure...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="cascade-turbo">
          <div className="turbo-queue">
            <h4>Turbo Queue</h4>
            <div className="queue-empty">
              No autonomous tasks queued
            </div>
          </div>
        </div>
      )}
    </div>

    <style jsx>{`
      .cascade-panel-2025 {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        height: 100%;
      }

      .cascade-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #2d2d30;
        border-radius: 6px;
        font-size: 12px;
        color: #cccccc;
      }

      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #00d4aa;
        animation: pulse 2s infinite;
      }

      .turbo-controls {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .turbo-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .turbo-btn:hover {
        transform: scale(1.02);
      }

      .turbo-status {
        font-size: 11px;
        color: #8c8c8c;
        text-align: center;
      }

      .cascade-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .system-message {
        padding: 8px 12px;
        background: #3c3c3c;
        border-radius: 6px;
        font-size: 12px;
        color: #00d4aa;
        margin-bottom: 12px;
      }

      .cascade-input {
        width: 100%;
        padding: 12px;
        background: #3c3c3c;
        border: 1px solid #5a5a5a;
        border-radius: 6px;
        color: #cccccc;
        font-size: 13px;
        font-family: inherit;
        outline: none;
        resize: vertical;
        min-height: 100px;
      }

      .cascade-input:focus {
        border-color: #007acc;
      }

      .agent-tasks h4,
      .turbo-queue h4 {
        font-size: 12px;
        color: #cccccc;
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .task-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: #2d2d30;
        border-radius: 4px;
        font-size: 12px;
        color: #cccccc;
      }

      .task-status {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #ff9500;
      }

      .task-status.running {
        animation: pulse 1s infinite;
      }

      .queue-empty {
        padding: 20px;
        text-align: center;
        color: #8c8c8c;
        font-size: 12px;
      }
    `}</style>
  </div>
);

const AgentPanel2025: React.FC<{ compactMode: boolean }> = ({ compactMode }) => (
  <div className={`agent-panel-2025 ${compactMode ? 'compact' : ''}`}>
    <div className="panel-section">
      <div className="section-header">
        <div className="section-title">
          <span>ACTIVE AGENTS</span>
          <span className="agent-count">2</span>
        </div>
        <button className="section-action" title="New Agent">+</button>
      </div>
      <div className="agents-list">
        <AgentItem
          name="Code Reviewer"
          status="active"
          task="Reviewing PR #123"
          progress={75}
        />
        <AgentItem
          name="Test Generator"
          status="idle"
          task="Waiting for tasks"
          progress={0}
        />
      </div>
    </div>

    <style jsx>{`
      .agent-panel-2025 {
        padding: 12px;
      }
    `}</style>
  </div>
);

const AgentItem: React.FC<{
  name: string;
  status: 'active' | 'idle' | 'error';
  task: string;
  progress: number;
}> = ({ name, status, task, progress }) => (
  <div className="agent-item">
    <div className="agent-header">
      <div className={`agent-status-indicator ${status}`}></div>
      <div className="agent-info">
        <div className="agent-name">{name}</div>
        <div className="agent-task">{task}</div>
      </div>
      <div className="agent-actions">
        <button className="agent-action" title="Configure">⚙️</button>
        <button className="agent-action" title="Stop">⏹️</button>
      </div>
    </div>
    {status === 'active' && progress > 0 && (
      <div className="agent-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="progress-text">{progress}%</span>
      </div>
    )}

    <style jsx>{`
      .agent-item {
        padding: 8px 12px;
        background: #2d2d30;
        border-radius: 6px;
        margin-bottom: 8px;
      }

      .agent-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .agent-status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .agent-status-indicator.active {
        background: #00d4aa;
        animation: pulse 2s infinite;
      }

      .agent-status-indicator.idle {
        background: #8c8c8c;
      }

      .agent-status-indicator.error {
        background: #f14c4c;
      }

      .agent-info {
        flex: 1;
      }

      .agent-name {
        font-size: 13px;
        font-weight: 600;
        color: #cccccc;
        margin-bottom: 2px;
      }

      .agent-task {
        font-size: 11px;
        color: #8c8c8c;
      }

      .agent-actions {
        display: flex;
        gap: 4px;
      }

      .agent-action {
        background: none;
        border: none;
        color: #8c8c8c;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 2px;
        font-size: 11px;
        transition: all 0.2s;
      }

      .agent-action:hover {
        background: #3c3c3c;
        color: #cccccc;
      }

      .agent-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .progress-bar {
        flex: 1;
        height: 4px;
        background: #3c3c3c;
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: #00d4aa;
        transition: width 0.3s ease;
      }

      .progress-text {
        font-size: 10px;
        color: #8c8c8c;
        min-width: 30px;
        text-align: right;
      }
    `}</style>
  </div>
);

const ExtensionsPanel2025: React.FC<{ compactMode: boolean }> = ({ compactMode }) => (
  <div className={`extensions-panel-2025 ${compactMode ? 'compact' : ''}`}>
    <div className="search-input-container">
      <input
        type="text"
        placeholder="Search extensions..."
        className="search-input"
      />
    </div>
    <div className="extensions-categories">
      <button className="category-btn active">Popular</button>
      <button className="category-btn">AI Tools</button>
      <button className="category-btn">Themes</button>
      <button className="category-btn">Languages</button>
    </div>
    <div className="extensions-list">
      <ExtensionItem
        name="AI Code Assistant"
        author="Ottokode"
        rating={4.8}
        downloads="2.1M"
        installed={true}
      />
      <ExtensionItem
        name="Theme Studio Pro"
        author="ThemeForge"
        rating={4.6}
        downloads="856K"
        installed={false}
      />
    </div>

    <style jsx>{`
      .extensions-panel-2025 {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .extensions-categories {
        display: flex;
        gap: 4px;
        margin-bottom: 8px;
      }

      .category-btn {
        background: #3c3c3c;
        color: #8c8c8c;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .category-btn:hover {
        background: #4a4a4a;
        color: #cccccc;
      }

      .category-btn.active {
        background: #007acc;
        color: white;
      }
    `}</style>
  </div>
);

const ExtensionItem: React.FC<{
  name: string;
  author: string;
  rating: number;
  downloads: string;
  installed: boolean;
}> = ({ name, author, rating, downloads, installed }) => (
  <div className="extension-item">
    <div className="extension-icon">🧩</div>
    <div className="extension-info">
      <div className="extension-name">{name}</div>
      <div className="extension-meta">
        <span className="extension-author">{author}</span>
        <span className="extension-rating">⭐ {rating}</span>
        <span className="extension-downloads">{downloads}</span>
      </div>
    </div>
    <button className={`install-btn ${installed ? 'installed' : ''}`}>
      {installed ? 'Installed' : 'Install'}
    </button>

    <style jsx>{`
      .extension-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        background: #2d2d30;
        border-radius: 6px;
        margin-bottom: 8px;
      }

      .extension-icon {
        font-size: 16px;
        width: 24px;
        text-align: center;
      }

      .extension-info {
        flex: 1;
      }

      .extension-name {
        font-size: 13px;
        font-weight: 600;
        color: #cccccc;
        margin-bottom: 2px;
      }

      .extension-meta {
        display: flex;
        gap: 8px;
        font-size: 11px;
        color: #8c8c8c;
      }

      .install-btn {
        background: #007acc;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }

      .install-btn:hover {
        background: #005a9e;
      }

      .install-btn.installed {
        background: #00d4aa;
        cursor: default;
      }
    `}</style>
  </div>
);

const SettingsPanel2025: React.FC<{ compactMode: boolean }> = ({ compactMode }) => (
  <div className={`settings-panel-2025 ${compactMode ? 'compact' : ''}`}>
    <div className="settings-search">
      <input
        type="text"
        placeholder="Search settings..."
        className="search-input"
      />
    </div>
    <div className="settings-sections">
      <SettingsSection
        title="Editor"
        settings={[
          { key: 'autoSave', label: 'Auto Save', type: 'checkbox', value: true },
          { key: 'fontSize', label: 'Font Size', type: 'number', value: 14 },
          { key: 'theme', label: 'Color Theme', type: 'select', value: 'dark', options: ['dark', 'light', 'auto'] }
        ]}
      />
      <SettingsSection
        title="AI"
        settings={[
          { key: 'aiCompletion', label: 'Code Completion', type: 'checkbox', value: true },
          { key: 'aiModel', label: 'Default Model', type: 'select', value: 'gpt-4-turbo', options: ['gpt-4-turbo', 'claude-3-opus', 'gemini-pro'] }
        ]}
      />
      <SettingsSection
        title="Workspace"
        settings={[
          { key: 'compactMode', label: 'Compact Mode', type: 'checkbox', value: false },
          { key: 'showMinimap', label: 'Show Minimap', type: 'checkbox', value: true }
        ]}
      />
    </div>

    <style jsx>{`
      .settings-panel-2025 {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .settings-search {
        margin-bottom: 8px;
      }

      .settings-sections {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
    `}</style>
  </div>
);

const SettingsSection: React.FC<{
  title: string;
  settings: Array<{
    key: string;
    label: string;
    type: 'checkbox' | 'number' | 'select' | 'text';
    value: any;
    options?: string[];
  }>;
}> = ({ title, settings }) => (
  <div className="settings-section">
    <div className="section-title">{title}</div>
    <div className="settings-list">
      {settings.map((setting) => (
        <SettingItem key={setting.key} {...setting} />
      ))}
    </div>

    <style jsx>{`
      .section-title {
        font-size: 12px;
        font-weight: 600;
        color: #cccccc;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid #3c3c3c;
      }

      .settings-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    `}</style>
  </div>
);

const SettingItem: React.FC<{
  key: string;
  label: string;
  type: 'checkbox' | 'number' | 'select' | 'text';
  value: any;
  options?: string[];
}> = ({ label, type, value, options }) => (
  <div className="setting-item">
    <label className="setting-label">{label}</label>
    <div className="setting-control">
      {type === 'checkbox' && (
        <input type="checkbox" defaultChecked={value} />
      )}
      {type === 'number' && (
        <input type="number" defaultValue={value} className="number-input" />
      )}
      {type === 'select' && options && (
        <select defaultValue={value} className="select-input">
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )}
      {type === 'text' && (
        <input type="text" defaultValue={value} className="text-input" />
      )}
    </div>

    <style jsx>{`
      .setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 8px;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .setting-item:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .setting-label {
        font-size: 13px;
        color: #cccccc;
        flex: 1;
      }

      .setting-control {
        flex-shrink: 0;
      }

      .number-input,
      .text-input,
      .select-input {
        background: #3c3c3c;
        color: #cccccc;
        border: 1px solid #5a5a5a;
        border-radius: 4px;
        padding: 4px 6px;
        font-size: 12px;
        outline: none;
        min-width: 80px;
      }

      .number-input:focus,
      .text-input:focus,
      .select-input:focus {
        border-color: #007acc;
      }
    `}</style>
  </div>
);

// Helper function to get panel titles
const getPanelTitle2025 = (panelId: string): string => {
  const titles = {
    explorer: 'Explorer',
    search: 'Search',
    sourceControl: 'Source Control',
    chat: 'AI Chat',
    cascade: 'Cascade',
    agent: 'AI Agents',
    extensions: 'Extensions',
    settings: 'Settings'
  };
  return titles[panelId as keyof typeof titles] || 'Panel';
};

export default ModernIDELayout2025;