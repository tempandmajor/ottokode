import React, { useState, useRef, useEffect } from 'react';
import { CommandSuggestions } from './CommandSuggestions';
import { ApprovalDialog } from './ApprovalDialog';
import { ExecutionMonitor } from './ExecutionMonitor';
import { useTerminalAI } from '../../hooks/useTerminalAI';

interface AITerminalProps {
  onClose?: () => void;
}

interface TerminalSession {
  id: string;
  name: string;
  commands: TerminalCommand[];
  isActive: boolean;
}

interface TerminalCommand {
  id: string;
  input: string;
  output: string;
  timestamp: Date;
  status: 'pending' | 'running' | 'completed' | 'error';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  parsed?: ParsedCommand;
}

interface ParsedCommand {
  command: string;
  args: string[];
  confidence: number;
  description: string;
  riskAssessment: string;
}

const AITerminal: React.FC<AITerminalProps> = ({ onClose }) => {
  // Hook into AI terminal service for suggestions, approvals, and execution
  const {
    partialInput,
    setPartialInput,
    suggestions,
    loading,
    history,
    pendingApproval,
    approvePending,
    cancelPending,
    executeNaturalLanguage,
  } = useTerminalAI();
  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: '1',
      name: 'Main Session',
      commands: [],
      isActive: true
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('1');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const parseNaturalLanguage = async (query: string): Promise<ParsedCommand> => {
    // Mock AI parsing for demo
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockCommands: Record<string, ParsedCommand> = {
      'list files': {
        command: 'ls',
        args: ['-la'],
        confidence: 0.95,
        description: 'List all files and directories with detailed information',
        riskAssessment: 'Low risk - read-only operation'
      },
      'show git status': {
        command: 'git',
        args: ['status'],
        confidence: 0.92,
        description: 'Display the current Git repository status',
        riskAssessment: 'Low risk - informational command'
      },
      'install packages': {
        command: 'npm',
        args: ['install'],
        confidence: 0.88,
        description: 'Install Node.js dependencies from package.json',
        riskAssessment: 'Medium risk - modifies node_modules'
      },
      'build project': {
        command: 'npm',
        args: ['run', 'build'],
        confidence: 0.90,
        description: 'Build the project for production',
        riskAssessment: 'Low risk - build operation'
      }
    };

    const normalizedQuery = query.toLowerCase();
    for (const [key, value] of Object.entries(mockCommands)) {
      if (normalizedQuery.includes(key)) {
        return value;
      }
    }

    return {
      command: query,
      args: [],
      confidence: 0.3,
      description: `Execute: ${query}`,
      riskAssessment: 'Unknown risk - command not recognized'
    };
  };

  const executeCommand = async (parsed: ParsedCommand): Promise<string> => {
    // Mock command execution
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockOutputs: Record<string, string> = {
      'ls': `drwxr-xr-x  12 user  staff    384 Jan  1 12:00 .
drwxr-xr-x   5 user  staff    160 Jan  1 11:00 ..
-rw-r--r--   1 user  staff   1024 Jan  1 12:00 package.json
-rw-r--r--   1 user  staff    512 Jan  1 11:30 README.md
drwxr-xr-x   8 user  staff    256 Jan  1 11:45 src
drwxr-xr-x  15 user  staff    480 Jan  1 11:50 node_modules`,
      'git': `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/App.tsx

no changes added to commit (use "git add" or "git commit -a")`,
      'npm': `> ottokode@1.0.0 build
> npm run build:shared && npm run build --workspace=web-app

Build completed successfully!
✓ All files processed
✓ Output generated in build/`
    };

    return mockOutputs[parsed.command] || `Command executed: ${parsed.command} ${parsed.args.join(' ')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeSession) return;

    // Also drive the new AI terminal pipeline
    executeNaturalLanguage(input.trim());

    const commandId = Date.now().toString();
    const newCommand: TerminalCommand = {
      id: commandId,
      input: input.trim(),
      output: '',
      timestamp: new Date(),
      status: 'pending'
    };

    // Add command to session
    setSessions(prev => prev.map(session =>
      session.id === activeSessionId
        ? { ...session, commands: [...session.commands, newCommand] }
        : session
    ));

    setInput('');
    setIsLoading(true);

    try {
      // Parse natural language
      const parsed = await parseNaturalLanguage(newCommand.input);

      // Update with parsed info
      setSessions(prev => prev.map(session =>
        session.id === activeSessionId
          ? {
              ...session,
              commands: session.commands.map(cmd =>
                cmd.id === commandId
                  ? {
                      ...cmd,
                      parsed,
                      status: 'running',
                      riskLevel: parsed.riskAssessment.includes('High') ? 'high'
                               : parsed.riskAssessment.includes('Medium') ? 'medium' : 'low'
                    }
                  : cmd
              )
            }
          : session
      ));

      // Execute command
      const output = await executeCommand(parsed);

      // Update with output
      setSessions(prev => prev.map(session =>
        session.id === activeSessionId
          ? {
              ...session,
              commands: session.commands.map(cmd =>
                cmd.id === commandId
                  ? { ...cmd, output, status: 'completed' }
                  : cmd
              )
            }
          : session
      ));

    } catch (error) {
      setSessions(prev => prev.map(session =>
        session.id === activeSessionId
          ? {
              ...session,
              commands: session.commands.map(cmd =>
                cmd.id === commandId
                  ? { ...cmd, output: `Error: ${error}`, status: 'error' }
                  : cmd
              )
            }
          : session
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = () => {
    const newSession: TerminalSession = {
      id: Date.now().toString(),
      name: `Session ${sessions.length + 1}`,
      commands: [],
      isActive: false
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#6b7280';
      case 'running': return '#3b82f6';
      case 'completed': return '#22c55e';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="ai-terminal-container">
      <div className="terminal-header">
        <div className="terminal-title">
          <h3>💻 AI Terminal</h3>
          <div className="terminal-subtitle">Natural Language Command Interface</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="close-button">×</button>
        )}
      </div>

      <div className="terminal-tabs">
        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className={`terminal-tab ${session.id === activeSessionId ? 'active' : ''}`}
          >
            {session.name}
          </button>
        ))}
        <button onClick={createNewSession} className="terminal-tab new-tab">+</button>
      </div>

      <div className="terminal-content">
        <div className="terminal-output">
          {activeSession?.commands.map(command => (
            <div key={command.id} className="command-block">
              <div className="command-input">
                <span className="prompt">$</span>
                <span className="user-input">{command.input}</span>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(command.status) }}
                >
                  {command.status}
                </span>
              </div>

              {command.parsed && (
                <div className="parsed-command">
                  <div className="parsed-header">
                    <span className="parsed-title">Parsed Command:</span>
                    <span
                      className="confidence-badge"
                      style={{ backgroundColor: command.parsed.confidence > 0.8 ? '#22c55e' : '#f59e0b' }}
                    >
                      {Math.round(command.parsed.confidence * 100)}% confidence
                    </span>
                  </div>
                  <div className="parsed-details">
                    <code>{command.parsed.command} {command.parsed.args.join(' ')}</code>
                  </div>
                  <div className="parsed-description">{command.parsed.description}</div>
                  <div
                    className="risk-assessment"
                    style={{ color: getRiskColor(command.riskLevel) }}
                  >
                    {command.parsed.riskAssessment}
                  </div>
                </div>
              )}

              {command.output && (
                <div className="command-output">
                  <pre>{command.output}</pre>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="loading-indicator">
              <span>Processing command...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="terminal-input-form">
          <div className="input-container">
            <span className="input-prompt">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setPartialInput(e.target.value);
              }}
              placeholder="Describe what you want to do... (e.g., 'list files', 'show git status', 'build project')"
              disabled={isLoading || loading}
              className="terminal-input"
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              Execute
            </button>
          </div>
        </form>
        {/* Suggestions Panel */}
        {partialInput.trim() && (
          <div style={{ padding: 16, background: '#252526', borderTop: '1px solid #333' }}>
            <CommandSuggestions
              partialInput={partialInput}
              onPick={(cmd) => {
                setInput(cmd);
                setPartialInput(cmd);
              }}
            />
          </div>
        )}

        {/* Live Execution Monitor (AI pipeline) */}
        <div style={{ padding: 16, background: '#1e1e1e', borderTop: '1px solid #333' }}>
          <ExecutionMonitor />
        </div>
      </div>

      <div className="terminal-help">
        <div className="help-section">
          <h4>🚀 Natural Language Commands</h4>
          <div className="help-examples">
            <span>Try: "list files", "show git status", "install packages", "build project"</span>
          </div>
        </div>
      </div>

      {/* Approval dialog for high-risk/low-confidence commands */}
      <ApprovalDialog
        open={!!pendingApproval}
        command={pendingApproval?.command || ''}
        riskLevel={
          (pendingApproval as any)?.result?.warnings?.length ? 'high' : 'medium'
        }
        reason={(pendingApproval as any)?.result?.warnings?.[0]}
        onApprove={approvePending}
        onCancel={cancelPending}
      />

      <style>{`
        .ai-terminal-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1e1e1e;
          color: #ffffff;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .terminal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #333;
          background: #252526;
        }

        .terminal-title h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .terminal-subtitle {
          font-size: 12px;
          color: #888;
          margin-top: 2px;
        }

        .close-button {
          background: none;
          border: none;
          color: #888;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
        }

        .close-button:hover {
          color: #fff;
        }

        .terminal-tabs {
          display: flex;
          background: #2d2d30;
          border-bottom: 1px solid #333;
        }

        .terminal-tab {
          padding: 8px 16px;
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          border-right: 1px solid #333;
        }

        .terminal-tab:hover {
          background: #3a3a3a;
          color: #fff;
        }

        .terminal-tab.active {
          background: #1e1e1e;
          color: #fff;
        }

        .terminal-tab.new-tab {
          font-weight: bold;
          color: #4CAF50;
        }

        .terminal-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .terminal-output {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          font-size: 14px;
        }

        .command-block {
          margin-bottom: 16px;
        }

        .command-input {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .prompt {
          color: #4CAF50;
          font-weight: bold;
        }

        .user-input {
          color: #fff;
        }

        .status-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          color: white;
          text-transform: uppercase;
        }

        .parsed-command {
          background: #2a2a2a;
          border-left: 3px solid #4CAF50;
          padding: 8px 12px;
          margin: 8px 0;
          font-size: 12px;
        }

        .parsed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .parsed-title {
          color: #4CAF50;
          font-weight: bold;
        }

        .confidence-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          color: white;
        }

        .parsed-details {
          margin: 4px 0;
        }

        .parsed-details code {
          background: #333;
          padding: 2px 4px;
          border-radius: 2px;
          color: #FFD700;
        }

        .parsed-description {
          color: #ccc;
          font-style: italic;
        }

        .risk-assessment {
          font-weight: bold;
          margin-top: 4px;
        }

        .command-output {
          background: #000;
          padding: 8px;
          border-radius: 4px;
          margin-top: 8px;
        }

        .command-output pre {
          margin: 0;
          white-space: pre-wrap;
          color: #ddd;
          font-size: 13px;
        }

        .loading-indicator {
          padding: 8px;
          color: #888;
          font-style: italic;
        }

        .terminal-input-form {
          border-top: 1px solid #333;
          background: #252526;
        }

        .input-container {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          gap: 8px;
        }

        .input-prompt {
          color: #4CAF50;
          font-weight: bold;
        }

        .terminal-input {
          flex: 1;
          background: #1e1e1e;
          border: 1px solid #444;
          color: #fff;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: inherit;
        }

        .terminal-input:focus {
          outline: none;
          border-color: #4CAF50;
        }

        .terminal-input::placeholder {
          color: #666;
        }

        .input-container button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .input-container button:hover:not(:disabled) {
          background: #45a049;
        }

        .input-container button:disabled {
          background: #666;
          cursor: not-allowed;
        }

        .terminal-help {
          border-top: 1px solid #333;
          padding: 8px 16px;
          background: #2d2d30;
        }

        .help-section h4 {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: #4CAF50;
        }

        .help-examples {
          font-size: 11px;
          color: #888;
        }
      `}</style>
    </div>
  );
};

export default AITerminal;