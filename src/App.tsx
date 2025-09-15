import { useState, useEffect } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { LazyMonacoEditor } from './components/LazyMonacoEditor';
import { FileTree } from './components/FileTree';
import { SetupChecklist } from './components/SetupChecklist';
import { EnhancedTerminal } from './components/EnhancedTerminal';
import { StatusBar } from './components/StatusBar';
// import { AIChat } from './components/AIChat';
import { CostDashboard } from './components/CostDashboard';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { AgentDashboard } from './components/AgentDashboard';
import { CollaborationPanel } from './components/CollaborationPanel';
import { SecureNotepad } from './components/SecureNotepad';
import { OllamaManager } from './components/OllamaManager';
import { GitPanel } from './components/GitPanel';
import { PluginMarketplace } from './components/PluginMarketplace';
import { EnhancedAIProviderSettings } from './components/EnhancedAIProviderSettings';
import { EnhancedAIChat } from './components/EnhancedAIChat';
import { BillingDashboard } from './components/BillingDashboard';
import { Auth } from './components/Auth';
import { aiCodeCompletionProvider } from './services/ai/CodeCompletionProvider';
import { authService, AuthState } from './services/auth/AuthService';
import "./App.css";

interface EditorFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
}

function App() {
  const [activeFile, setActiveFile] = useState<EditorFile | null>(null);
  const [openFiles, setOpenFiles] = useState<EditorFile[]>([]);
  const [showSetupChecklist, setShowSetupChecklist] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showCostDashboard, setShowCostDashboard] = useState(false);
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [showAgentDashboard, setShowAgentDashboard] = useState(false);
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const [showSecureNotepad, setShowSecureNotepad] = useState(false);
  const [showOllamaManager, setShowOllamaManager] = useState(false);
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [showPluginMarketplace, setShowPluginMarketplace] = useState(false);
  const [showAIProviderSettings, setShowAIProviderSettings] = useState(false);
  const [showBillingDashboard, setShowBillingDashboard] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [aiCompletionEnabled, setAiCompletionEnabled] = useState(true);
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((newState: AuthState) => {
      setAuthState(newState);
    });

    return unsubscribe;
  }, []);

  const handleFileOpen = (file: EditorFile) => {
    if (!openFiles.find(f => f.id === file.id)) {
      setOpenFiles([...openFiles, file]);
    }
    setActiveFile(file);
  };

  const handleFileClose = (fileId: string) => {
    const newOpenFiles = openFiles.filter(f => f.id !== fileId);
    setOpenFiles(newOpenFiles);
    
    if (activeFile?.id === fileId) {
      setActiveFile(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      const updatedFile = { ...activeFile, content: value };
      setActiveFile(updatedFile);
      setOpenFiles(openFiles.map(f => f.id === activeFile.id ? updatedFile : f));
    }
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor/esm/vs/editor/editor.api')) => {
    // Register AI completion provider for all languages
    const languages = ['typescript', 'javascript', 'python', 'java', 'csharp', 'cpp', 'c', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'dart', 'scala', 'shell', 'powershell', 'sql', 'html', 'css', 'scss', 'json', 'yaml', 'xml', 'markdown'];

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
  };

  return (
    <div className="app">
      <div className="app-header">
        <div className="app-title">AI Code IDE</div>
        <div className="app-controls">
          <button 
            onClick={() => setShowSetupChecklist(!showSetupChecklist)}
            className="header-button"
          >
            Setup Guide
          </button>
          <button 
            onClick={() => setShowTerminal(!showTerminal)}
            className="header-button"
          >
            Terminal
          </button>
          <button
            onClick={() => setShowAIChat(!showAIChat)}
            className="header-button"
          >
            AI Assistant
          </button>
          <button
            onClick={() => setShowCostDashboard(!showCostDashboard)}
            className="header-button"
          >
            Cost Analytics
          </button>
          <button
            onClick={() => setAiCompletionEnabled(!aiCompletionEnabled)}
            className={`header-button ${aiCompletionEnabled ? 'active' : ''}`}
            title={`AI Code Completion: ${aiCompletionEnabled ? 'Enabled' : 'Disabled'}`}
          >
            AI Completion
          </button>
          <button
            onClick={() => setShowPerformanceDashboard(!showPerformanceDashboard)}
            className="header-button"
          >
            Performance
          </button>
          <button
            onClick={() => setShowAgentDashboard(!showAgentDashboard)}
            className="header-button"
          >
            🤖 AI Agents
          </button>
          <button
            onClick={() => setShowCollaborationPanel(!showCollaborationPanel)}
            className="header-button"
          >
            👥 Collaborate
          </button>
          <button
            onClick={() => setShowSecureNotepad(!showSecureNotepad)}
            className="header-button"
          >
            🔐 Notepad
          </button>
          <button
            onClick={() => setShowOllamaManager(!showOllamaManager)}
            className="header-button"
          >
            🦙 Ollama
          </button>
          <button
            onClick={() => setShowGitPanel(!showGitPanel)}
            className="header-button"
          >
            🔀 Git
          </button>
          <button
            onClick={() => setShowPluginMarketplace(!showPluginMarketplace)}
            className="header-button"
          >
            🔌 Plugins
          </button>
          <button
            onClick={() => setShowAIProviderSettings(!showAIProviderSettings)}
            className="header-button"
          >
            🔑 AI Providers
          </button>
          <button
            onClick={() => setShowBillingDashboard(!showBillingDashboard)}
            className="header-button"
          >
            💳 Billing
          </button>
          <button
            onClick={() => setShowAuth(!showAuth)}
            className="header-button"
          >
{authState.user ? `👤 ${authState.user.name || authState.user.email}` : '🔐 Login'}
          </button>
        </div>
      </div>

      <div className="app-body">
        {showSetupChecklist && (
          <div className="setup-sidebar">
            <SetupChecklist onClose={() => setShowSetupChecklist(false)} />
          </div>
        )}

        <div className="file-sidebar">
          <FileTree onFileOpen={handleFileOpen} />
        </div>

        <div className="editor-area">
          <div className="editor-tabs">
            {openFiles.map(file => (
              <div 
                key={file.id}
                className={`editor-tab ${activeFile?.id === file.id ? 'active' : ''}`}
                onClick={() => setActiveFile(file)}
              >
                <span>{file.name}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileClose(file.id);
                  }}
                  className="tab-close"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="editor-container">
            {activeFile ? (
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

        {showAIChat && (
          <div className="ai-chat-sidebar">
            <EnhancedAIChat onClose={() => setShowAIChat(false)} />
          </div>
        )}

        {showCostDashboard && (
          <div className="cost-dashboard-sidebar">
            <CostDashboard onClose={() => setShowCostDashboard(false)} />
          </div>
        )}

        {showPerformanceDashboard && (
          <div className="cost-dashboard-sidebar">
            <PerformanceDashboard onClose={() => setShowPerformanceDashboard(false)} />
          </div>
        )}

        {showAgentDashboard && (
          <div className="agent-dashboard-sidebar">
            <AgentDashboard onClose={() => setShowAgentDashboard(false)} />
          </div>
        )}

        {showCollaborationPanel && (
          <div className="collaboration-sidebar">
            <CollaborationPanel onClose={() => setShowCollaborationPanel(false)} />
          </div>
        )}

        {showSecureNotepad && (
          <div className="secure-notepad-sidebar">
            <SecureNotepad onClose={() => setShowSecureNotepad(false)} />
          </div>
        )}

        {showOllamaManager && (
          <div className="ollama-manager-sidebar">
            <OllamaManager onClose={() => setShowOllamaManager(false)} />
          </div>
        )}

        {showGitPanel && (
          <div className="git-panel-sidebar">
            <GitPanel onClose={() => setShowGitPanel(false)} />
          </div>
        )}

        {showPluginMarketplace && (
          <div className="plugin-marketplace-sidebar">
            <PluginMarketplace onClose={() => setShowPluginMarketplace(false)} />
          </div>
        )}

        {showAIProviderSettings && (
          <div className="ai-provider-settings-sidebar">
            <EnhancedAIProviderSettings onClose={() => setShowAIProviderSettings(false)} />
          </div>
        )}

        {showBillingDashboard && (
          <div className="billing-dashboard-sidebar">
            <BillingDashboard onClose={() => setShowBillingDashboard(false)} />
          </div>
        )}

        {showAuth && (
          <Auth onClose={() => setShowAuth(false)} />
        )}
      </div>

      <StatusBar 
        activeFile={activeFile}
        terminalVisible={showTerminal}
      />
    </div>
  );
}

export default App;
