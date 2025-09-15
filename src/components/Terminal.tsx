import React, { useState, useRef, useEffect } from 'react';
import './Terminal.css';

export const Terminal: React.FC = () => {
  const [output, setOutput] = useState<string[]>([
    'Welcome to AI Code IDE Terminal',
    'Type commands below (demo mode - limited functionality)',
    ''
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when output changes
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const executeCommand = async (command: string) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Add command to output
    setOutput(prev => [...prev, `$ ${trimmedCommand}`]);

    // Add to history
    setHistory(prev => [...prev, trimmedCommand]);
    setHistoryIndex(-1);

    try {
      // Handle built-in commands
      let result = '';
      const [cmd, ...args] = trimmedCommand.split(' ');

      switch (cmd) {
        case 'help':
          result = `Available commands (demo mode):
  help      - Show this help message
  clear     - Clear terminal
  echo      - Echo arguments
  date      - Show current date
  pwd       - Show current directory
  ls        - List files (demo)
  git       - Git commands (demo)
  npm       - NPM commands (demo)
  node      - Node.js version
  python    - Python version (demo)`;
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
          result = '/Users/demo/projects/ai-ide';
          break;

        case 'ls':
          result = `src/
src-tauri/
node_modules/
package.json
package-lock.json
README.md
tsconfig.json
vite.config.ts`;
          break;

        case 'git':
          if (args[0] === 'status') {
            result = `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/App.tsx
        modified:   src/components/Terminal.tsx

no changes added to commit (use "git add ." or "git commit -a")`;
          } else if (args[0] === 'log') {
            result = `commit 1a2b3c4d5e6f (HEAD -> main, origin/main)
Author: Developer <dev@example.com>
Date:   ${new Date().toDateString()}

    Add terminal integration

commit 7f8e9d0c1b2a
Author: Developer <dev@example.com>
Date:   ${new Date(Date.now() - 86400000).toDateString()}

    Initial IDE setup`;
          } else {
            result = `git version 2.39.0
usage: git [--version] [--help] [-C <path>] [-c <name>=<value>]
           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]
           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]
           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]
           [--super-prefix=<path>] [--config-env=<name>=<envvar>]
           <command> [<args>]`;
          }
          break;

        case 'npm':
          if (args[0] === 'version' || args[0] === '--version') {
            result = `{
  npm: '10.8.2',
  node: '20.19.1',
  acorn: '8.14.0',
  ada: '2.9.0',
  ares: '1.31.0',
  base64: '0.5.2'
}`;
          } else if (args[0] === 'run') {
            result = `> tauri-app@0.1.0 ${args[1]}
> ${args.slice(1).join(' ')}

Command executed (demo mode)`;
          } else {
            result = `npm@10.8.2 /usr/local/lib/node_modules/npm

Usage: npm <command>

where <command> is one of:
    access, adduser, audit, bugs, cache, ci, completion,
    config, dedupe, deprecate, diff, dist-tag, docs, doctor,
    edit, exec, explain, explore, find-dupes, fund, get,
    help, hook, init, install, install-ci-test, install-test,
    link, ll, login, logout, ls, outdated, owner, pack, ping,
    pkg, prefix, profile, prune, publish, rebuild, repo,
    restart, root, run-script, search, set, set-script,
    shrinkwrap, star, stars, start, stop, team, test, token,
    uninstall, unpublish, unstar, update, version, view, whoami`;
          }
          break;

        case 'node':
          if (args[0] === '--version' || args.length === 0) {
            result = 'v20.19.1';
          } else {
            result = 'Node.js JavaScript runtime (demo mode)';
          }
          break;

        case 'python':
        case 'python3':
          if (args[0] === '--version') {
            result = 'Python 3.11.5';
          } else {
            result = 'Python 3.11.5 (demo mode)';
          }
          break;

        default:
          // Try to execute via Tauri (in a real implementation)
          result = `Command not found: ${cmd}
Type 'help' for available commands.`;
          break;
      }

      // Add result to output
      if (result) {
        setOutput(prev => [...prev, result, '']);
      }
    } catch (error) {
      setOutput(prev => [...prev, `Error: ${error}`, '']);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      executeCommand(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
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
      // Basic tab completion (demo)
      const commands = ['help', 'clear', 'echo', 'date', 'pwd', 'ls', 'git', 'npm', 'node', 'python'];
      const matches = commands.filter(cmd => cmd.startsWith(input));
      if (matches.length === 1) {
        setInput(matches[0] + ' ');
      }
    }
  };

  return (
    <div className="terminal">
      <div className="terminal-header">
        <span className="terminal-title">Terminal</span>
        <div className="terminal-controls">
          <button onClick={() => setOutput([])}>Clear</button>
        </div>
      </div>
      
      <div className="terminal-content" ref={outputRef}>
        {output.map((line, index) => (
          <div key={index} className="terminal-line">
            {line}
          </div>
        ))}
        
        <form onSubmit={handleSubmit} className="terminal-input-form">
          <span className="terminal-prompt">$ </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="terminal-input"
            placeholder="Enter command..."
            autoFocus
          />
        </form>
      </div>
    </div>
  );
};