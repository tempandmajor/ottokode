import React, { useState, useCallback, useEffect, useRef } from 'react';
import { agentOrchestrator, Task, TaskResult } from '../../services/agents/AgentOrchestrator';
import { taskPlanner, TaskDecompositionRequest } from '../../services/agents/TaskPlanner';
import './ComposerInterface.css';

export interface ComposerMode {
  mode: 'ask' | 'edit' | 'agent';
  description: string;
  icon: string;
  capabilities: string[];
}

export interface FileContext {
  path: string;
  content: string;
  language: string;
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  isModified?: boolean;
}

export interface ComposerSession {
  id: string;
  mode: ComposerMode['mode'];
  query: string;
  files: FileContext[];
  agent?: string;
  status: 'idle' | 'processing' | 'preview' | 'applying' | 'completed' | 'error';
  taskId?: string;
  result?: TaskResult;
  startTime: Date;
  endTime?: Date;
}

export interface ComposerProps {
  initialFiles?: FileContext[];
  onFilesChanged?: (files: FileContext[]) => void;
  onClose?: () => void;
  className?: string;
}

const COMPOSER_MODES: ComposerMode[] = [
  {
    mode: 'ask',
    description: 'Ask questions about your code',
    icon: '❓',
    capabilities: ['code analysis', 'explanations', 'suggestions']
  },
  {
    mode: 'edit',
    description: 'Generate or edit code',
    icon: '✏️',
    capabilities: ['code generation', 'modifications', 'refactoring']
  },
  {
    mode: 'agent',
    description: 'Complex multi-step operations',
    icon: '🤖',
    capabilities: ['planning', 'coordination', 'automation']
  }
];

export const ComposerInterface: React.FC<ComposerProps> = ({
  initialFiles = [],
  onFilesChanged,
  onClose,
  className = ''
}) => {
  const [currentMode, setCurrentMode] = useState<ComposerMode['mode']>('edit');
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<FileContext[]>(initialFiles);
  const [sessions, setSessions] = useState<ComposerSession[]>([]);
  const [activeSession, setActiveSession] = useState<ComposerSession | null>(null);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const queryInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Load available agents
    const agents = agentOrchestrator.getAllAgents();
    setAvailableAgents(agents);

    // Set default agent based on mode
    if (agents.length > 0 && !selectedAgent) {
      const defaultAgent = agents.find(a => a.type === 'multi_file_specialist') || agents[0];
      setSelectedAgent(defaultAgent.id);
    }
  }, [selectedAgent]);

  useEffect(() => {
    // Listen for orchestrator events
    const handleTaskCompleted = (event: any) => {
      const { task, result } = event;
      updateSessionResult(task.id, result);
    };

    const handleTaskFailed = (event: any) => {
      const { task, error } = event;
      updateSessionError(task.id, error);
    };

    agentOrchestrator.on('taskCompleted', handleTaskCompleted);
    agentOrchestrator.on('taskFailed', handleTaskFailed);

    return () => {
      agentOrchestrator.off('taskCompleted', handleTaskCompleted);
      agentOrchestrator.off('taskFailed', handleTaskFailed);
    };
  }, []);

  const updateSessionResult = useCallback((taskId: string, result: TaskResult) => {
    setSessions(prev => prev.map(session => {
      if (session.taskId === taskId) {
        return {
          ...session,
          status: 'completed',
          result,
          endTime: new Date()
        };
      }
      return session;
    }));

    setActiveSession(prev => {
      if (prev?.taskId === taskId) {
        return {
          ...prev,
          status: 'completed',
          result,
          endTime: new Date()
        };
      }
      return prev;
    });
  }, []);

  const updateSessionError = useCallback((taskId: string, error: any) => {
    setSessions(prev => prev.map(session => {
      if (session.taskId === taskId) {
        return {
          ...session,
          status: 'error',
          result: {
            success: false,
            errors: [error?.message || 'Unknown error']
          } as TaskResult,
          endTime: new Date()
        };
      }
      return session;
    }));

    setActiveSession(prev => {
      if (prev?.taskId === taskId) {
        return {
          ...prev,
          status: 'error',
          result: {
            success: false,
            errors: [error?.message || 'Unknown error']
          } as TaskResult,
          endTime: new Date()
        };
      }
      return prev;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!query.trim() || !files.length) {
      return;
    }

    const session: ComposerSession = {
      id: generateSessionId(),
      mode: currentMode,
      query: query.trim(),
      files: [...files],
      agent: selectedAgent || undefined,
      status: 'processing',
      startTime: new Date()
    };

    setSessions(prev => [session, ...prev]);
    setActiveSession(session);
    setQuery('');

    try {
      let taskId: string;

      switch (currentMode) {
        case 'ask':
          taskId = await handleAskMode(session);
          break;
        case 'edit':
          taskId = await handleEditMode(session);
          break;
        case 'agent':
          taskId = await handleAgentMode(session);
          break;
        default:
          throw new Error(`Unknown mode: ${currentMode}`);
      }

      // Update session with task ID
      setSessions(prev => prev.map(s =>
        s.id === session.id ? { ...s, taskId } : s
      ));
      setActiveSession(prev =>
        prev?.id === session.id ? { ...prev, taskId } : prev
      );

    } catch (error) {
      updateSessionError('', error);
    }
  }, [query, files, currentMode, selectedAgent]);

  const handleAskMode = async (session: ComposerSession): Promise<string> => {
    const task: Partial<Task> = {
      type: 'code_review',
      description: session.query,
      context: {
        language: detectPrimaryLanguage(session.files),
        files: session.files.map(f => f.path),
        selectedCode: getSelectedCode(session.files),
        currentFile: session.files[0]?.path,
        requirements: ['analysis', 'explanation', 'suggestions']
      },
      priority: 'medium'
    };

    return await agentOrchestrator.createTask(task);
  };

  const handleEditMode = async (session: ComposerSession): Promise<string> => {
    const task: Partial<Task> = {
      type: session.files.length > 1 ? 'multi_file_operation' : 'code_generation',
      description: session.query,
      context: {
        language: detectPrimaryLanguage(session.files),
        files: session.files.map(f => f.path),
        selectedCode: getSelectedCode(session.files),
        currentFile: session.files[0]?.path,
        requirements: ['code_modification', 'generation', 'refactoring']
      },
      priority: 'high'
    };

    return await agentOrchestrator.createTask(task);
  };

  const handleAgentMode = async (session: ComposerSession): Promise<string> => {
    // Use task planner for complex operations
    const request: TaskDecompositionRequest = {
      originalTask: {
        id: generateSessionId(),
        type: 'multi_file_operation',
        description: session.query,
        context: {
          language: detectPrimaryLanguage(session.files),
          files: session.files.map(f => f.path),
          selectedCode: getSelectedCode(session.files),
          currentFile: session.files[0]?.path
        },
        priority: 'high',
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      availableAgents: availableAgents
    };

    const plan = await taskPlanner.createTaskPlan(request);

    // Execute the plan through the orchestrator
    return await agentOrchestrator.createTask({
      type: 'multi_file_operation',
      description: `Execute planned task: ${session.query}`,
      context: request.originalTask.context,
      priority: 'high'
    });
  };

  const handleFileAdd = useCallback((newFiles: FileContext[]) => {
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChanged?.(updatedFiles);
  }, [files, onFilesChanged]);

  const handleFileRemove = useCallback((filePath: string) => {
    const updatedFiles = files.filter(f => f.path !== filePath);
    setFiles(updatedFiles);
    onFilesChanged?.(updatedFiles);
  }, [files, onFilesChanged]);

  const handleModeChange = useCallback((mode: ComposerMode['mode']) => {
    setCurrentMode(mode);
    // Auto-select appropriate agent for mode
    if (mode === 'agent') {
      const multiFileAgent = availableAgents.find(a => a.type === 'multi_file_specialist');
      if (multiFileAgent) {
        setSelectedAgent(multiFileAgent.id);
      }
    } else if (mode === 'edit') {
      const codeGenAgent = availableAgents.find(a => a.type === 'code_generator');
      if (codeGenAgent) {
        setSelectedAgent(codeGenAgent.id);
      }
    } else {
      const reviewerAgent = availableAgents.find(a => a.type === 'code_reviewer');
      if (reviewerAgent) {
        setSelectedAgent(reviewerAgent.id);
      }
    }
  }, [availableAgents]);

  const handlePreviewChanges = useCallback(async () => {
    if (!activeSession?.result?.files) return;

    setPreviewData({
      files: activeSession.result.files,
      session: activeSession
    });

    // Update session status
    setActiveSession(prev => prev ? { ...prev, status: 'preview' } : null);
  }, [activeSession]);

  const handleApplyChanges = useCallback(async () => {
    if (!previewData?.files) return;

    setActiveSession(prev => prev ? { ...prev, status: 'applying' } : null);

    try {
      // Apply changes through file system integration
      const updatedFiles = await applyFileChanges(previewData.files);
      setFiles(updatedFiles);
      onFilesChanged?.(updatedFiles);

      setActiveSession(prev => prev ? { ...prev, status: 'completed' } : null);
      setPreviewData(null);
    } catch (error) {
      console.error('Error applying changes:', error);
      setActiveSession(prev => prev ? { ...prev, status: 'error' } : null);
    }
  }, [previewData, onFilesChanged]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const currentModeInfo = COMPOSER_MODES.find(m => m.mode === currentMode);

  return (
    <div className={`composer-interface ${className} ${isExpanded ? 'expanded' : ''}`}>
      <div className="composer-header">
        <div className="composer-title">
          <div className="composer-icon">{currentModeInfo?.icon}</div>
          <h3>AI Composer</h3>
          <div className="mode-indicator">
            {currentModeInfo?.description}
          </div>
        </div>

        <div className="composer-actions">
          <button
            className="btn btn-ghost expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '⤢' : '⤡'}
          </button>
          {onClose && (
            <button className="btn btn-ghost close-button" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="composer-modes">
        {COMPOSER_MODES.map(mode => (
          <button
            key={mode.mode}
            className={`mode-button ${currentMode === mode.mode ? 'active' : ''}`}
            onClick={() => handleModeChange(mode.mode)}
            title={mode.description}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-name">{mode.mode}</span>
          </button>
        ))}
      </div>

      <div className="composer-content">
        <div className="composer-input-section">
          <div className="query-input-container">
            <textarea
              ref={queryInputRef}
              className="query-input"
              placeholder={`What would you like me to ${currentMode}?`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={isExpanded ? 4 : 2}
            />

            <div className="input-controls">
              <div className="file-count">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </div>

              <button
                className="btn btn-primary submit-button"
                onClick={handleSubmit}
                disabled={!query.trim() || !files.length || activeSession?.status === 'processing'}
              >
                {activeSession?.status === 'processing' ? (
                  <>
                    <span className="spinner">⟳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    {currentModeInfo?.icon} {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}
                  </>
                )}
              </button>
            </div>
          </div>

          {currentMode === 'agent' && (
            <div className="agent-selection">
              <label className="agent-label">
                Agent:
                <select
                  value={selectedAgent || ''}
                  onChange={(e) => setSelectedAgent(e.target.value || null)}
                  className="agent-select"
                >
                  <option value="">Auto-select</option>
                  {availableAgents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.type})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="composer-files">
          <div className="files-header">
            <h4>Selected Files</h4>
            <button className="btn btn-ghost add-files-button">
              + Add Files
            </button>
          </div>

          <div className="files-list">
            {files.map((file, index) => (
              <div key={file.path} className="file-item">
                <div className="file-info">
                  <div className="file-icon">
                    {getFileIcon(file.language)}
                  </div>
                  <div className="file-details">
                    <div className="file-path">{file.path}</div>
                    <div className="file-meta">
                      {file.language} • {file.content.split('\n').length} lines
                      {file.selection && (
                        <span className="selection-info">
                          • Selected: {file.selection.end.line - file.selection.start.line + 1} lines
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-ghost remove-file-button"
                  onClick={() => handleFileRemove(file.path)}
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            ))}

            {files.length === 0 && (
              <div className="empty-files">
                <div className="empty-icon">📁</div>
                <div className="empty-message">
                  Select files to get started with AI assistance
                </div>
              </div>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="composer-sessions">
            <div className="sessions-header">
              <h4>Recent Sessions</h4>
              {sessions.length > 0 && (
                <button className="btn btn-ghost clear-sessions-button">
                  Clear All
                </button>
              )}
            </div>

            <div className="sessions-list">
              {sessions.slice(0, 5).map(session => (
                <div
                  key={session.id}
                  className={`session-item ${session.id === activeSession?.id ? 'active' : ''}`}
                  onClick={() => setActiveSession(session)}
                >
                  <div className="session-header">
                    <div className="session-mode">{COMPOSER_MODES.find(m => m.mode === session.mode)?.icon}</div>
                    <div className="session-status">
                      <SessionStatusIndicator status={session.status} />
                    </div>
                    <div className="session-time">
                      {formatRelativeTime(session.startTime)}
                    </div>
                  </div>

                  <div className="session-query">
                    {session.query.substring(0, 100)}
                    {session.query.length > 100 ? '...' : ''}
                  </div>

                  <div className="session-files">
                    {session.files.length} file{session.files.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}

              {sessions.length === 0 && (
                <div className="empty-sessions">
                  <div className="empty-message">No recent sessions</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSession?.status === 'completed' && activeSession.result?.files && (
          <div className="result-actions">
            <button
              className="btn btn-primary"
              onClick={handlePreviewChanges}
            >
              📋 Preview Changes
            </button>
          </div>
        )}

        {previewData && (
          <div className="preview-overlay">
            <div className="preview-modal">
              <div className="preview-header">
                <h3>Preview Changes</h3>
                <button
                  className="btn btn-ghost"
                  onClick={() => setPreviewData(null)}
                >
                  ✕
                </button>
              </div>

              <div className="preview-content">
                {/* Preview component will be implemented separately */}
                <div className="preview-placeholder">
                  Changes preview will be shown here
                </div>
              </div>

              <div className="preview-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setPreviewData(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleApplyChanges}
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
const SessionStatusIndicator: React.FC<{ status: ComposerSession['status'] }> = ({ status }) => {
  const statusConfig = {
    idle: { icon: '⭕', color: '#666' },
    processing: { icon: '⟳', color: '#007acc' },
    preview: { icon: '👁️', color: '#ff9500' },
    applying: { icon: '⚡', color: '#ff9500' },
    completed: { icon: '✅', color: '#28a745' },
    error: { icon: '❌', color: '#dc3545' }
  };

  const config = statusConfig[status];
  return (
    <span className={`status-indicator ${status}`} style={{ color: config.color }}>
      {config.icon}
    </span>
  );
};

// Helper Functions
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function detectPrimaryLanguage(files: FileContext[]): string {
  if (files.length === 0) return 'typescript';

  const languageCounts = files.reduce((acc, file) => {
    acc[file.language] = (acc[file.language] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(languageCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'typescript';
}

function getSelectedCode(files: FileContext[]): string {
  return files
    .filter(f => f.selection)
    .map(f => {
      if (!f.selection) return '';
      const lines = f.content.split('\n');
      return lines.slice(f.selection.start.line, f.selection.end.line + 1).join('\n');
    })
    .join('\n\n');
}

function getFileIcon(language: string): string {
  const icons: Record<string, string> = {
    typescript: '🟦',
    javascript: '🟨',
    react: '⚛️',
    css: '🎨',
    html: '🌐',
    json: '📄',
    markdown: '📝',
    python: '🐍',
    java: '☕',
    cpp: '⚡',
    rust: '🦀',
    go: '🐹'
  };

  return icons[language.toLowerCase()] || '📄';
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function applyFileChanges(fileChanges: any[]): Promise<FileContext[]> {
  // This would integrate with the actual file system
  // For now, return the current state
  return fileChanges.map(change => ({
    path: change.path,
    content: change.content || '',
    language: change.language || 'typescript',
    isModified: true
  }));
}

export default ComposerInterface;