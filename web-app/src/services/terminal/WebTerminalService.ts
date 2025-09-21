/**
 * Web Terminal Service
 * Provides terminal functionality for the web IDE
 * Supports both simulated and containerized execution environments
 */

export interface TerminalCommand {
  id: string;
  command: string;
  args: string[];
  cwd: string;
  timestamp: Date;
  status: 'running' | 'completed' | 'failed';
  exitCode?: number;
  output: string;
  error?: string;
}

export interface TerminalSession {
  id: string;
  projectId: string;
  userId: string;
  workingDirectory: string;
  environmentVars: Record<string, string>;
  history: TerminalCommand[];
  isActive: boolean;
  lastActivity: Date;
}

export interface TerminalEnvironment {
  type: 'simulated' | 'container' | 'serverless';
  containerId?: string;
  endpoint?: string;
  capabilities: string[];
}

/**
 * Simulated Terminal Environment
 * Provides realistic terminal responses without actual execution
 */
export class SimulatedTerminal {
  private fileSystem: Map<string, string> = new Map();
  private workingDirectory: string = '/project';
  private processes: Map<string, any> = new Map();

  constructor() {
    // Initialize basic file system
    this.fileSystem.set('/project', 'directory');
    this.fileSystem.set('/project/package.json', JSON.stringify({
      name: 'ottokode-project',
      version: '1.0.0',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        test: 'jest'
      },
      dependencies: {
        react: '^18.0.0',
        next: '^14.0.0',
        typescript: '^5.0.0'
      }
    }, null, 2));
    this.fileSystem.set('/project/src', 'directory');
    this.fileSystem.set('/project/src/app.tsx', 'import React from "react";\n\nexport default function App() {\n  return <div>Hello World</div>;\n}');
  }

  async executeCommand(command: string, args: string[]): Promise<{ output: string; exitCode: number; error?: string }> {
    const fullCommand = `${command} ${args.join(' ')}`.trim();

    switch (command) {
      case 'ls':
        return this.handleLs(args);
      case 'pwd':
        return { output: this.workingDirectory, exitCode: 0 };
      case 'cd':
        return this.handleCd(args);
      case 'cat':
        return this.handleCat(args);
      case 'mkdir':
        return this.handleMkdir(args);
      case 'touch':
        return this.handleTouch(args);
      case 'rm':
        return this.handleRm(args);
      case 'echo':
        return { output: args.join(' '), exitCode: 0 };
      case 'npm':
        return this.handleNpm(args);
      case 'node':
        return this.handleNode(args);
      case 'git':
        return this.handleGit(args);
      case 'code':
        return { output: 'Opening in Ottokode IDE...', exitCode: 0 };
      case 'clear':
        return { output: '\x1b[2J\x1b[H', exitCode: 0 };
      case 'whoami':
        return { output: 'ottokode-user', exitCode: 0 };
      case 'ps':
        return this.handlePs();
      case 'kill':
        return this.handleKill(args);
      default:
        return {
          output: '',
          exitCode: 127,
          error: `Command not found: ${command}`
        };
    }
  }

  private handleLs(args: string[]): { output: string; exitCode: number } {
    const path = args.length > 0 ? this.resolvePath(args[0]) : this.workingDirectory;
    const entries: string[] = [];

    for (const [filePath, content] of this.fileSystem.entries()) {
      if (filePath.startsWith(path + '/') && !filePath.substring(path.length + 1).includes('/')) {
        const name = filePath.substring(path.length + 1);
        if (content === 'directory') {
          entries.push(`\x1b[34m${name}/\x1b[0m`); // Blue for directories
        } else {
          entries.push(name);
        }
      }
    }

    return { output: entries.join('\n'), exitCode: 0 };
  }

  private handleCd(args: string[]): { output: string; exitCode: number; error?: string } {
    if (args.length === 0) {
      this.workingDirectory = '/home/ottokode';
      return { output: '', exitCode: 0 };
    }

    const newPath = this.resolvePath(args[0]);
    if (this.fileSystem.has(newPath) && this.fileSystem.get(newPath) === 'directory') {
      this.workingDirectory = newPath;
      return { output: '', exitCode: 0 };
    }

    return {
      output: '',
      exitCode: 1,
      error: `cd: no such file or directory: ${args[0]}`
    };
  }

  private handleCat(args: string[]): { output: string; exitCode: number; error?: string } {
    if (args.length === 0) {
      return { output: '', exitCode: 1, error: 'cat: missing file operand' };
    }

    const filePath = this.resolvePath(args[0]);
    const content = this.fileSystem.get(filePath);

    if (!content) {
      return { output: '', exitCode: 1, error: `cat: ${args[0]}: No such file or directory` };
    }

    if (content === 'directory') {
      return { output: '', exitCode: 1, error: `cat: ${args[0]}: Is a directory` };
    }

    return { output: content, exitCode: 0 };
  }

  private handleMkdir(args: string[]): { output: string; exitCode: number; error?: string } {
    if (args.length === 0) {
      return { output: '', exitCode: 1, error: 'mkdir: missing operand' };
    }

    const dirPath = this.resolvePath(args[0]);
    this.fileSystem.set(dirPath, 'directory');
    return { output: '', exitCode: 0 };
  }

  private handleTouch(args: string[]): { output: string; exitCode: number; error?: string } {
    if (args.length === 0) {
      return { output: '', exitCode: 1, error: 'touch: missing file operand' };
    }

    const filePath = this.resolvePath(args[0]);
    if (!this.fileSystem.has(filePath)) {
      this.fileSystem.set(filePath, '');
    }
    return { output: '', exitCode: 0 };
  }

  private handleRm(args: string[]): { output: string; exitCode: number; error?: string } {
    if (args.length === 0) {
      return { output: '', exitCode: 1, error: 'rm: missing operand' };
    }

    const filePath = this.resolvePath(args[args.length - 1]);
    if (this.fileSystem.has(filePath)) {
      this.fileSystem.delete(filePath);
      return { output: '', exitCode: 0 };
    }

    return { output: '', exitCode: 1, error: `rm: cannot remove '${args[args.length - 1]}': No such file or directory` };
  }

  private handleNpm(args: string[]): { output: string; exitCode: number; error?: string } {
    if (args.length === 0) {
      return { output: 'npm <command>', exitCode: 1 };
    }

    const subcommand = args[0];
    const processId = crypto.randomUUID();

    switch (subcommand) {
      case 'install':
      case 'i':
        this.processes.set(processId, { command: 'npm install', progress: 0 });
        return {
          output: `npm WARN deprecated package@1.0.0
npm WARN deprecated another-package@2.1.0

added 234 packages, and audited 235 packages in 15s

12 packages are looking for funding
  run \`npm fund\` for details

found 0 vulnerabilities`,
          exitCode: 0
        };

      case 'run':
        if (args[1] === 'dev') {
          this.processes.set(processId, { command: 'npm run dev', port: 3000 });
          return {
            output: `> ottokode-project@1.0.0 dev
> next dev

   ▲ Next.js 14.0.0
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.100:3000

 ✓ Ready in 2.3s
 ○ Compiling / ...
 ✓ Compiled / in 456ms`,
            exitCode: 0
          };
        } else if (args[1] === 'build') {
          return {
            output: `> ottokode-project@1.0.0 build
> next build

   ▲ Next.js 14.0.0

   Creating an optimized production build ...
 ✓ Compiled successfully
 ✓ Linting and checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages (3/3)
 ✓ Collecting build traces
 ✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.02 kB        87.5 kB
└ ○ /favicon.ico                         0 B                0 B
+ First Load JS shared by all            82.5 kB
  ├ chunks/69-c4851fb0e6e5e500.js        29.0 kB
  ├ chunks/fd9d1056-2821b0f0cabcd8bd.js  53.1 kB
  └ other shared chunks (total)           390 B

○  (Static)  automatically rendered as static HTML (uses no initial props)`,
            exitCode: 0
          };
        }
        break;

      case 'test':
        return {
          output: `> ottokode-project@1.0.0 test
> jest

 PASS  src/App.test.tsx
 PASS  src/utils.test.ts

Test Suites: 2 passed, 2 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        2.456 s
Ran all test suites.`,
          exitCode: 0
        };

      default:
        return { output: `Unknown npm command: ${subcommand}`, exitCode: 1 };
    }

    return { output: '', exitCode: 0 };
  }

  private handleNode(args: string[]): { output: string; exitCode: number; error?: string } {
    if (args.length === 0) {
      return {
        output: `Welcome to Node.js v20.10.0.
Type ".help" for more information.
> `,
        exitCode: 0
      };
    }

    const fileName = args[0];
    const filePath = this.resolvePath(fileName);
    const content = this.fileSystem.get(filePath);

    if (!content) {
      return { output: '', exitCode: 1, error: `Error: Cannot find module '${fileName}'` };
    }

    // Simple JavaScript execution simulation
    if (content.includes('console.log')) {
      const matches = content.match(/console\.log\(['"`]([^'"`]+)['"`]\)/g);
      if (matches) {
        const output = matches.map(match => {
          const textMatch = match.match(/console\.log\(['"`]([^'"`]+)['"`]\)/);
          return textMatch ? textMatch[1] : '';
        }).join('\n');
        return { output, exitCode: 0 };
      }
    }

    return { output: 'Script executed successfully', exitCode: 0 };
  }

  private handleGit(args: string[]): { output: string; exitCode: number } {
    if (args.length === 0) {
      return { output: 'usage: git [--version] [--help] [-C <path>] [-c <name>=<value>]', exitCode: 1 };
    }

    const subcommand = args[0];

    switch (subcommand) {
      case 'status':
        return {
          output: `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

\t\x1b[31mmodified:   src/app.tsx\x1b[0m

no changes added to commit (use "git add" and/or "git commit -a")`,
          exitCode: 0
        };

      case 'log':
        return {
          output: `commit a1b2c3d4e5f6789012345678901234567890abcd (HEAD -> main, origin/main)
Author: Ottokode User <user@ottokode.com>
Date:   ${new Date().toDateString()}

    Initial commit: Setup project structure

commit b2c3d4e5f6789012345678901234567890abcd123
Author: Ottokode User <user@ottokode.com>
Date:   ${new Date(Date.now() - 86400000).toDateString()}

    Add basic components and utilities`,
          exitCode: 0
        };

      case 'add':
        return { output: '', exitCode: 0 };

      case 'commit':
        if (args.includes('-m')) {
          const messageIndex = args.indexOf('-m') + 1;
          const message = args[messageIndex] || 'No commit message';
          return {
            output: `[main ${Math.random().toString(36).substr(2, 7)}] ${message}
 1 file changed, 5 insertions(+), 2 deletions(-)`,
            exitCode: 0
          };
        }
        return { output: 'Aborting commit due to empty commit message.', exitCode: 1 };

      case 'push':
        return {
          output: `Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 8 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 324 bytes | 324.00 KiB/s, done.
Total 3 (delta 2), reused 0 (delta 0), pack-reused 0
To https://github.com/user/ottokode-project.git
   a1b2c3d..${Math.random().toString(36).substr(2, 7)}  main -> main`,
          exitCode: 0
        };

      case 'pull':
        return {
          output: `Already up to date.`,
          exitCode: 0
        };

      default:
        return { output: `git: '${subcommand}' is not a git command. See 'git --help'.`, exitCode: 1 };
    }
  }

  private handlePs(): { output: string; exitCode: number } {
    const processes = Array.from(this.processes.entries()).map(([id, process], index) => {
      return `${(index + 1).toString().padStart(5)} ttys001    0:00.${String(Math.floor(Math.random() * 60)).padStart(2, '0')} ${process.command}`;
    });

    const output = `  PID TTY           TIME CMD
${processes.join('\n')}`;

    return { output, exitCode: 0 };
  }

  private handleKill(args: string[]): { output: string; exitCode: number; error?: string } {
    if (args.length === 0) {
      return { output: '', exitCode: 1, error: 'kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]' };
    }

    const pid = args[args.length - 1];
    const processEntries = Array.from(this.processes.entries());

    if (processEntries.length > parseInt(pid) - 1) {
      const [processId] = processEntries[parseInt(pid) - 1];
      this.processes.delete(processId);
      return { output: '', exitCode: 0 };
    }

    return { output: '', exitCode: 1, error: `kill: ${pid}: no such process` };
  }

  private resolvePath(path: string): string {
    if (path.startsWith('/')) {
      return path;
    }
    return `${this.workingDirectory}/${path}`.replace(/\/+/g, '/');
  }

  getWorkingDirectory(): string {
    return this.workingDirectory;
  }

  getFileSystem(): Map<string, string> {
    return new Map(this.fileSystem);
  }
}

/**
 * Web Terminal Service
 */
export class WebTerminalService {
  private sessions: Map<string, TerminalSession> = new Map();
  private simulatedTerminal: SimulatedTerminal = new SimulatedTerminal();

  /**
   * Create a new terminal session
   */
  async createSession(projectId: string, userId: string): Promise<TerminalSession> {
    const session: TerminalSession = {
      id: crypto.randomUUID(),
      projectId,
      userId,
      workingDirectory: '/project',
      environmentVars: {
        HOME: '/home/ottokode',
        USER: 'ottokode',
        PATH: '/usr/local/bin:/usr/bin:/bin',
        NODE_ENV: 'development'
      },
      history: [],
      isActive: true,
      lastActivity: new Date()
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Execute a command in a terminal session
   */
  async executeCommand(sessionId: string, command: string): Promise<TerminalCommand> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Terminal session not found');
    }

    const [cmd, ...args] = command.trim().split(/\s+/);

    const terminalCommand: TerminalCommand = {
      id: crypto.randomUUID(),
      command: cmd,
      args,
      cwd: session.workingDirectory,
      timestamp: new Date(),
      status: 'running',
      output: ''
    };

    // Add to session history
    session.history.push(terminalCommand);
    session.lastActivity = new Date();

    try {
      // Execute using simulated terminal
      const result = await this.simulatedTerminal.executeCommand(cmd, args);

      terminalCommand.output = result.output;
      terminalCommand.exitCode = result.exitCode;
      terminalCommand.error = result.error;
      terminalCommand.status = result.exitCode === 0 ? 'completed' : 'failed';

      // Update working directory if cd command was successful
      if (cmd === 'cd' && result.exitCode === 0) {
        session.workingDirectory = this.simulatedTerminal.getWorkingDirectory();
      }

    } catch (error) {
      terminalCommand.status = 'failed';
      terminalCommand.error = error instanceof Error ? error.message : 'Unknown error';
      terminalCommand.exitCode = 1;
    }

    return terminalCommand;
  }

  /**
   * Get terminal session
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all sessions for a user
   */
  getUserSessions(userId: string): TerminalSession[] {
    return Array.from(this.sessions.values()).filter(session => session.userId === userId);
  }

  /**
   * Close a terminal session
   */
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Get command history for a session
   */
  getCommandHistory(sessionId: string): TerminalCommand[] {
    const session = this.sessions.get(sessionId);
    return session?.history || [];
  }

  /**
   * Clear command history for a session
   */
  clearHistory(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.history = [];
    }
  }
}

// Global instance
export const webTerminalService = new WebTerminalService();