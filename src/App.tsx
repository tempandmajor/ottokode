import React, { useEffect, useMemo } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// Components
import { LazyMonacoEditor } from './components/LazyMonacoEditor';
import { FileTree } from './components/FileTree';
import { SetupChecklist } from './components/SetupChecklist';
import { EnhancedTerminal } from './components/EnhancedTerminal';
import { StatusBar } from './components/StatusBar';
import { CostDashboard } from './components/CostDashboard';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { AgentDashboard } from './components/AgentDashboard';
import { CollaborationPanel } from './components/CollaborationPanel';
import { SecureNotepad } from './components/SecureNotepad';
import { GitPanel } from './components/GitPanel';
import { EnhancedAIProviderSettings } from './components/EnhancedAIProviderSettings';
import { EnhancedAIChat } from './components/EnhancedAIChat';
import { BillingDashboard } from './components/BillingDashboard';
import { Auth } from './components/Auth';
import { ErrorBoundary, FileSystemErrorBoundary, AIServiceErrorBoundary, EditorErrorBoundary } from './components/ErrorBoundary';

// Store and hooks
import { useUIStore, useEditorStore, useAuthStore, useSettingsStore, useAppStatus } from './store';
import { useOfflineSupport } from './hooks/useOfflineSupport';
import { useMemoizedCallback } from './hooks/usePerformance';

// Services
import { aiCodeCompletionProvider } from './services/ai/CodeCompletionProvider';
import { authService } from './services/auth/AuthService';

// Styles
import './App.css';
import './components/ErrorBoundary.css';

// Optimized Header Component
const AppHeader = React.memo(() => {
  const {
    showSetupChecklist,
    showTerminal,
    showAIChat,
    showCostDashboard,
    showPerformanceDashboard,
    showAgentDashboard,
    showCollaborationPanel,
    showSecureNotepad,
    showGitPanel,
    showAIProviderSettings,
    showBillingDashboard,
    showAuth,
    togglePanel,
  } = useUIStore();

  const { authState } = useAuthStore();
  const { aiCompletionEnabled, setAiCompletionEnabled } = useSettingsStore();

  const handleToggleAICompletion = useMemoizedCallback(() => {
    setAiCompletionEnabled(!aiCompletionEnabled);
  }, [aiCompletionEnabled, setAiCompletionEnabled]);

  return (
    <div className="app-header">
      <div className="app-title">AI Code IDE</div>
      <div className="app-controls">
        <button
          onClick={() => togglePanel('showSetupChecklist')}
          className="header-button"
          aria-label="Toggle Setup Guide"
        >
          Setup Guide
        </button>
        <button
          onClick={() => togglePanel('showTerminal')}
          className="header-button"
          aria-label="Toggle Terminal"
        >
          Terminal
        </button>
        <button
          onClick={() => togglePanel('showAIChat')}
          className="header-button"
          aria-label="Toggle AI Assistant"
        >
          AI Assistant
        </button>
        <button
          onClick={() => togglePanel('showCostDashboard')}
          className="header-button"
          aria-label="Toggle Cost Analytics"
        >
          Cost Analytics
        </button>
        <button
          onClick={handleToggleAICompletion}
          className={`header-button ${aiCompletionEnabled ? 'active' : ''}`}
          title={`AI Code Completion: ${aiCompletionEnabled ? 'Enabled' : 'Disabled'}`}
          aria-label="Toggle AI Code Completion"
        >
          AI Completion
        </button>
        <button
          onClick={() => togglePanel('showPerformanceDashboard')}
          className="header-button"
          aria-label="Toggle Performance Dashboard"
        >
          Performance
        </button>
        <button
          onClick={() => togglePanel('showAgentDashboard')}
          className="header-button"
          aria-label="Toggle AI Agents"
        >
          🤖 AI Agents
        </button>
        <button
          onClick={() => togglePanel('showCollaborationPanel')}
          className="header-button"
          aria-label="Toggle Collaboration"
        >
          👥 Collaborate
        </button>
        <button
          onClick={() => togglePanel('showSecureNotepad')}
          className="header-button"
          aria-label="Toggle Secure Notepad"
        >
          🔐 Notepad
        </button>
        <button
          onClick={() => togglePanel('showGitPanel')}
          className="header-button"
          aria-label="Toggle Git Panel"
        >
          🔀 Git
        </button>
        <button
          onClick={() => togglePanel('showAIProviderSettings')}
          className="header-button"
          aria-label="Toggle AI Provider Settings"
        >
          🔑 AI Providers
        </button>
        <button
          onClick={() => togglePanel('showBillingDashboard')}
          className="header-button"
          aria-label="Toggle Billing Dashboard"
        >
          💳 Billing
        </button>
        <button
          onClick={() => togglePanel('showAuth')}
          className="header-button"
          aria-label="Toggle Authentication"
        >
          {authState.user ? `👤 ${authState.user.name || authState.user.email}` : '🔐 Login'}
        </button>
      </div>
    </div>
  );
});

// Optimized Editor Area Component
const EditorArea = React.memo(() => {
  const { showTerminal } = useUIStore();
  const { activeFile, openFiles, closeFile, setActiveFile, updateFileContent } = useEditorStore();
  const { aiCompletionEnabled } = useSettingsStore();

  const handleEditorChange = useMemoizedCallback((value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile.id, value);
    }
  }, [activeFile, updateFileContent]);

  const handleEditorDidMount = useMemoizedCallback((
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor/esm/vs/editor/editor.api')
  ) => {
    // Register AI completion provider for all languages
    const languages = [
      'typescript', 'javascript', 'python', 'java', 'csharp', 'cpp', 'c', 'go', 'rust',
      'php', 'ruby', 'swift', 'kotlin', 'dart', 'scala', 'shell', 'powershell', 'sql',
      'html', 'css', 'scss', 'json', 'yaml', 'xml', 'markdown'
    ];

    if (aiCompletionEnabled) {
      languages.forEach(language => {
        monaco.languages.registerCompletionItemProvider(language, aiCodeCompletionProvider);
      });
    }

    // Configure editor for better AI completion experience
    editor.updateOptions({
      suggest: {
        showWords: true,
        showSnippets: true,
        showIcons: true,
        showMethods: true,
        showFunctions: true,
        showConstructors: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showStructs: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showUnits: true,
        showValues: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showKeywords: true,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeParameters: true,
        showUsers: true,
        showIssues: true,
        insertMode: 'replace',
        filterGraceful: true,
        snippetsPreventQuickSuggestions: false,
        localityBonus: true
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      wordBasedSuggestions: 'matchingDocuments'
    });
  }, [aiCompletionEnabled]);

  const handleFileClose = useMemoizedCallback((fileId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    closeFile(fileId);
  }, [closeFile]);

  return (
    <div className="editor-area">
      <div className="editor-tabs">
        {openFiles.map(file => (
          <div
            key={file.id}
            className={`editor-tab ${activeFile?.id === file.id ? 'active' : ''}`}
            onClick={() => setActiveFile(file)}
          >
            <span>{file.name}{file.isDirty ? ' •' : ''}</span>
            <button
              onClick={(e) => handleFileClose(file.id, e)}
              className="tab-close"
              aria-label={`Close ${file.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="editor-container">
        {activeFile ? (
          <EditorErrorBoundary>
            <LazyMonacoEditor
              height="100%"
              language={activeFile.language}
              value={activeFile.content}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </EditorErrorBoundary>
        ) : (
          <div className="editor-welcome">
            <h2>Welcome to AI Code IDE</h2>
            <p>Open a file from the sidebar to start coding</p>
            <p>Check the Setup Guide for configuration steps</p>
          </div>
        )}
      </div>

      {showTerminal && (
        <div className="terminal-container">
          <EnhancedTerminal />
        </div>
      )}
    </div>
  );
});

// Optimized Sidebar Panels Component
const SidebarPanels = React.memo(() => {
  const {
    showAIChat,
    showCostDashboard,
    showPerformanceDashboard,
    showAgentDashboard,
    showCollaborationPanel,
    showSecureNotepad,
    showGitPanel,
    showAIProviderSettings,
    showBillingDashboard,
    setPanel,
  } = useUIStore();

  const handleClose = useMemoizedCallback((panel: string) => {
    setPanel(panel as any, false);
  }, [setPanel]);

  return (
    <>
      {showAIChat && (
        <div className="ai-chat-sidebar">
          <AIServiceErrorBoundary>
            <EnhancedAIChat onClose={() => handleClose('showAIChat')} />
          </AIServiceErrorBoundary>
        </div>
      )}

      {showCostDashboard && (
        <div className="cost-dashboard-sidebar">
          <CostDashboard onClose={() => handleClose('showCostDashboard')} />
        </div>
      )}

      {showPerformanceDashboard && (
        <div className="cost-dashboard-sidebar">
          <PerformanceDashboard onClose={() => handleClose('showPerformanceDashboard')} />
        </div>
      )}

      {showAgentDashboard && (
        <div className="agent-dashboard-sidebar">
          <AIServiceErrorBoundary>
            <AgentDashboard onClose={() => handleClose('showAgentDashboard')} />
          </AIServiceErrorBoundary>
        </div>
      )}

      {showCollaborationPanel && (
        <div className="collaboration-sidebar">
          <CollaborationPanel onClose={() => handleClose('showCollaborationPanel')} />
        </div>
      )}

      {showSecureNotepad && (
        <div className="secure-notepad-sidebar">
          <SecureNotepad onClose={() => handleClose('showSecureNotepad')} />
        </div>
      )}

      {showGitPanel && (
        <div className="git-panel-sidebar">
          <GitPanel onClose={() => handleClose('showGitPanel')} />
        </div>
      )}

      {showAIProviderSettings && (
        <div className="ai-provider-settings-sidebar">
          <AIServiceErrorBoundary>
            <EnhancedAIProviderSettings onClose={() => handleClose('showAIProviderSettings')} />
          </AIServiceErrorBoundary>
        </div>
      )}

      {showBillingDashboard && (
        <div className="billing-dashboard-sidebar">
          <BillingDashboard onClose={() => handleClose('showBillingDashboard')} />
        </div>
      )}
    </>
  );
});

// Network Status Indicator
const NetworkStatus = React.memo(() => {
  const { isOnline, pendingOperations } = useOfflineSupport();

  if (isOnline && pendingOperations.length === 0) {
    return null;
  }

  return (
    <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? (
        pendingOperations.length > 0 && (
          <span>📤 Syncing {pendingOperations.length} operations...</span>
        )
      ) : (
        <span>📵 Offline - Changes will sync when reconnected</span>
      )}
    </div>
  );
});

// Main App Component
function App() {
  const { showSetupChecklist, showAuth, setPanel } = useUIStore();
  const { activeFile } = useEditorStore();
  const { authState, setAuthState } = useAuthStore();
  const { isLoading, error, setError } = useAppStatus();
  const { showTerminal } = useUIStore();

  // Initialize offline support
  const offlineSupport = useOfflineSupport();

  // Auth state synchronization
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((newState) => {
      setAuthState(newState);
    });

    return unsubscribe;
  }, [setAuthState]);

  // Error handling
  const handleGlobalError = useMemoizedCallback((error: Error) => {
    setError(error.message);
    console.error('Global error:', error);
  }, [setError]);

  // Memoized components to prevent unnecessary re-renders
  const memoizedContent = useMemo(() => (
    <div className="app-body">
      {showSetupChecklist && (
        <div className="setup-sidebar">
          <SetupChecklist onClose={() => setPanel('showSetupChecklist', false)} />
        </div>
      )}

      <div className="file-sidebar">
        <FileSystemErrorBoundary>
          <FileTree />
        </FileSystemErrorBoundary>
      </div>

      <EditorArea />
      <SidebarPanels />

      {showAuth && (
        <Auth onClose={() => setPanel('showAuth', false)} />
      )}
    </div>
  ), [showSetupChecklist, showAuth, setPanel]);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">⏳</div>
        <p>Loading AI Code IDE...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={handleGlobalError}>
      <div className="app" data-theme="dark">
        <NetworkStatus />

        {error && (
          <div className="global-error">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <AppHeader />
        {memoizedContent}

        <StatusBar
          activeFile={activeFile}
          terminalVisible={showTerminal}
          isOnline={offlineSupport.isOnline}
          pendingOperations={offlineSupport.pendingOperations.length}
        />
      </div>
    </ErrorBoundary>
  );
}

export default React.memo(App);