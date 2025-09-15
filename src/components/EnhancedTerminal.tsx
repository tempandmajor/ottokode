import React, { useState, useRef, useEffect } from 'react';
import { claudeCodeService, ClaudeCodeCommand } from '../services/terminal/ClaudeCodeService';
import { hybridAIService } from '../services/ai/HybridAIService';
import './EnhancedTerminal.css';

export const EnhancedTerminal: React.FC = () => {
  const [output, setOutput] = useState<string[]>([
    '🤖 AI Code IDE Terminal with Claude Code Integration',
    '💡 Type "claude help" for Claude Code commands',
    '📘 Type "help" for general terminal commands',
    ''
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('/workspace');

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when output changes
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    // Listen for Claude Code events
    const handleCommandStarted = (command: ClaudeCodeCommand) => {
      setOutput(prev => [...prev, `🔄 Executing: claude ${command.command} ${command.args.join(' ')}`]);
    };

    const handleCommandCompleted = (command: ClaudeCodeCommand) => {
      setOutput(prev => [...prev, ...command.output, '']);
    };

    const handleCommandFailed = (command: ClaudeCodeCommand) => {
      setOutput(prev => [...prev, `❌ Error: ${command.error}`, '']);
    };

    claudeCodeService.on('commandStarted', handleCommandStarted);
    claudeCodeService.on('commandCompleted', handleCommandCompleted);
    claudeCodeService.on('commandFailed', handleCommandFailed);

    return () => {
      claudeCodeService.off('commandStarted', handleCommandStarted);
      claudeCodeService.off('commandCompleted', handleCommandCompleted);
      claudeCodeService.off('commandFailed', handleCommandFailed);
    };
  }, []);

  const executeCommand = async (command: string) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Add command to output
    setOutput(prev => [...prev, `${currentDirectory}$ ${trimmedCommand}`]);

    // Add to history
    setHistory(prev => [...prev, trimmedCommand]);
    setHistoryIndex(-1);
    setIsExecuting(true);

    try {
      const [cmd, ...args] = trimmedCommand.split(' ');

      // Handle Claude Code commands
      if (cmd === 'claude') {
        await handleClaudeCodeCommand(args);
        return;
      }

      // Handle AI-related commands
      if (cmd === 'ai') {
        await handleAICommand(args);
        return;
      }

      // Handle built-in terminal commands
      await handleBuiltInCommand(cmd, args);

    } catch (error) {
      setOutput(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : String(error)}`, '']);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClaudeCodeCommand = async (args: string[]) => {
    if (args.length === 0) {
      setOutput(prev => [...prev, '❓ Usage: claude <command> [args]', 'Try: claude help', '']);
      return;
    }

    const [subCommand, ...subArgs] = args;

    try {
      const command = await claudeCodeService.executeCommand(subCommand, subArgs, {
        workingDirectory: currentDirectory
      });

      // Output is handled by the event listeners
    } catch (error) {
      setOutput(prev => [...prev, `❌ Claude Code error: ${error instanceof Error ? error.message : String(error)}`, '']);
    }
  };

  const handleAICommand = async (args: string[]) => {
    if (args.length === 0) {
      setOutput(prev => [...prev,
        '🤖 AI Commands:',
        '  ai models          - List available AI models',
        '  ai providers       - List available providers',
        '  ai credits         - Show credit balance',
        '  ai ask <question>  - Ask AI a question',
        ''
      ]);
      return;
    }

    const [subCommand, ...subArgs] = args;

    switch (subCommand) {
      case 'models':
        const platformModels = hybridAIService.getPlatformModels();
        setOutput(prev => [...prev,
          '🤖 Available AI Models:',
          ...platformModels.map(model =>
            `  ${model.provider}/${model.model_id} - ${model.display_name} ($${model.final_cost_per_1k_input_tokens.toFixed(4)}/1K)`
          ),
          ''
        ]);
        break;

      case 'providers':
        const providers = hybridAIService.getAvailableProviders();
        setOutput(prev => [...prev,
          '🔌 Available Providers:',
          ...providers.map(p =>
            `  ${p.provider} - Own Keys: ${p.hasOwnKeys ? '✅' : '❌'} | Platform: ${p.hasPlatformModels ? '✅' : '❌'}`
          ),
          ''
        ]);
        break;

      case 'credits':
        const credits = hybridAIService.getUserCredits();
        if (credits) {
          setOutput(prev => [...prev,
            '💰 Credit Balance:',
            `  Available: $${credits.available_credits.toFixed(2)}`,
            `  Total: $${credits.total_credits.toFixed(2)}`,
            `  Used: $${credits.used_credits.toFixed(2)}`,
            ''
          ]);
        } else {
          setOutput(prev => [...prev, '❌ No credit information available. Please sign in.', '']);
        }
        break;

      case 'ask':
        const question = subArgs.join(' ');
        if (!question) {
          setOutput(prev => [...prev, '❓ Usage: ai ask <your question>', '']);
          return;
        }

        setOutput(prev => [...prev,
          '🤖 Processing your question...',
          '💡 For better AI interactions, use the AI Assistant panel!',
          '',
          `Question: ${question}`,
          '',
          'The AI Assistant provides:',
          '✅ Streaming responses',
          '✅ Multiple models to choose from',
          '✅ Conversation history',
          '✅ Cost tracking',
          '✅ Better formatting',
          '',
          'Click "AI Assistant" in the header for the full experience!',
          ''
        ]);
        break;

      default:
        setOutput(prev => [...prev, `❓ Unknown AI command: ${subCommand}`, 'Try: ai help', '']);
    }
  };

  const handleBuiltInCommand = async (cmd: string, args: string[]) => {
    let result = '';

    switch (cmd) {
      case 'help':
        result = `🚀 Enhanced Terminal Commands:

Built-in Commands:
  help           - Show this help message
  clear          - Clear terminal
  echo <text>    - Echo text
  date           - Show current date
  pwd            - Show current directory
  ls             - List files (demo)
  cd <dir>       - Change directory (simulated)

Claude Code Integration:
  claude help         - Claude Code help
  claude chat         - Start Claude chat session
  claude ask <q>      - Ask Claude a question
  claude code <desc>  - Generate code
  claude review <file> - Review code file
  claude explain <file> - Explain code file

AI Commands:
  ai models      - List available AI models
  ai providers   - List providers
  ai credits     - Show credit balance
  ai ask <q>     - Ask AI a question

Git Commands (demo):
  git status     - Show git status
  git log        - Show git log
  git branch     - List branches

Package Management:
  npm install    - Install packages
  npm run <cmd>  - Run npm scripts

💡 Pro tip: Use the AI Assistant panel for advanced AI interactions!`;
        break;

      case 'clear':
        setOutput([]);
        return;

      case 'echo':
        result = args.join(' ');
        break;

      case 'date':
        result = new Date().toString();
        break;

      case 'pwd':
        result = currentDirectory;
        break;

      case 'cd':
        const newDir = args[0] || '/workspace';
        setCurrentDirectory(newDir);
        result = `Changed directory to: ${newDir}`;
        break;

      case 'ls':
        result = `📁 Files in ${currentDirectory}:
src/
  components/
  services/
  types/
package.json
README.md
tsconfig.json
(This is a demo - actual file system not accessible)`;
        break;

      case 'git':
        result = await handleGitCommand(args);
        break;

      case 'npm':
        result = await handleNpmCommand(args);
        break;

      case 'node':
        if (args[0] === '--version' || args[0] === '-v') {
          result = 'v20.10.0 (simulated)';
        } else {
          result = 'Node.js REPL not available in browser environment.\nUse the AI Assistant for JavaScript help!';
        }
        break;

      case 'python':
        result = 'Python not available in browser environment.\nUse the AI Assistant for Python help and code generation!';
        break;

      case 'code':
        if (args[0]) {
          result = `📝 Opening ${args[0]} in editor... (simulated)
💡 Use the file explorer on the left to open actual files!`;
        } else {
          result = `📝 VS Code-like editor is already running!
💡 Use the file explorer to open files.`;
        }
        break;

      default:
        result = `Command not found: ${cmd}
Type 'help' for available commands.
💡 Try 'claude help' for AI-powered development commands!`;
    }

    setOutput(prev => [...prev, result, '']);
  };

  const handleGitCommand = async (args: string[]): Promise<string> => {
    const [subCommand] = args;

    switch (subCommand) {
      case 'status':
        return `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   src/components/Terminal.tsx
  modified:   package.json

no changes added to commit (use "git add ..." to stage)
(This is simulated output)`;

      case 'log':
        return `commit abc123def456... (HEAD -> main, origin/main)
Author: Developer <dev@example.com>
Date:   ${new Date().toDateString()}

    Add enhanced terminal with Claude Code integration

commit def789ghi012...
Author: Developer <dev@example.com>
Date:   ${new Date(Date.now() - 86400000).toDateString()}

    Initial commit with AI IDE features
(This is simulated output)`;

      case 'branch':
        return `* main
  feature/ai-integration
  feature/terminal-enhancement
(This is simulated output)`;

      default:
        return `git ${subCommand}: command simulated
For actual git operations, use the Git panel or external terminal.`;
    }
  };

  const handleNpmCommand = async (args: string[]): Promise<string> => {
    const [subCommand] = args;

    switch (subCommand) {
      case 'install':
        return `📦 Installing packages...
✅ Packages installed successfully! (simulated)
💡 For actual package management, use external terminal.`;

      case 'run':
        const script = args[1];
        return `🏃 Running script: ${script}
✅ Script completed successfully! (simulated)
💡 For actual npm commands, use external terminal.`;

      case 'start':
        return `🚀 Starting development server...
✅ Server started on http://localhost:3000 (simulated)
💡 For actual npm start, use external terminal.`;

      case '--version':
      case '-v':
        return 'v10.2.4 (simulated)';

      default:
        return `npm ${subCommand}: command simulated
For actual npm operations, use external terminal.`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isExecuting) {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion for common commands
      const commonCommands = ['help', 'clear', 'claude', 'ai', 'git', 'npm', 'ls', 'cd', 'pwd'];
      const matches = commonCommands.filter(cmd => cmd.startsWith(input));
      if (matches.length === 1) {
        setInput(matches[0] + ' ');
      }
    }
  };

  return (
    <div className="enhanced-terminal">
      <div className="terminal-header">
        <div className="terminal-title">
          🖥️ Enhanced Terminal with Claude Code
        </div>
        <div className="terminal-info">
          {currentDirectory} | Claude Code Ready
        </div>
      </div>

      <div
        className="terminal-output"
        ref={outputRef}
        onClick={() => inputRef.current?.focus()}
      >
        {output.map((line, index) => (
          <div key={index} className="output-line">
            {line}
          </div>
        ))}

        <div className="terminal-input-line">
          <span className="prompt">{currentDirectory}$ </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="terminal-input"
            disabled={isExecuting}
            autoFocus
            spellCheck={false}
          />
          {isExecuting && <span className="executing-indicator">⏳</span>}
        </div>
      </div>

      <div className="terminal-footer">
        <div className="quick-commands">
          <button onClick={() => setInput('claude help')}>Claude Help</button>
          <button onClick={() => setInput('ai models')}>AI Models</button>
          <button onClick={() => setInput('git status')}>Git Status</button>
          <button onClick={() => setInput('clear')}>Clear</button>
        </div>
      </div>
    </div>
  );
};