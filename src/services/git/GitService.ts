// Advanced Git Integration Service - Complete Git operations for AI IDE
import { EventEmitter } from '../../utils/EventEmitter';
import { Command } from '@tauri-apps/plugin-shell';

export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  message: string;
  date: Date;
  shortHash: string;
  refs?: string[];
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
  upstream?: string;
  ahead?: number;
  behind?: number;
  lastCommit?: GitCommit;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  untracked: string[];
  conflicts: string[];
  clean: boolean;
}

export interface GitFileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'untracked' | 'ignored';
  oldPath?: string;
  staged: boolean;
  insertions?: number;
  deletions?: number;
}

export interface GitRemote {
  name: string;
  url: string;
  type: 'fetch' | 'push';
}

export interface GitStash {
  index: number;
  message: string;
  branch: string;
  date: Date;
}

export interface GitTag {
  name: string;
  commit: string;
  date: Date;
  message?: string;
  author?: string;
}

export interface GitDiff {
  file: string;
  oldFile?: string;
  chunks: GitDiffChunk[];
  binary: boolean;
  newFile: boolean;
  deletedFile: boolean;
  renamedFile: boolean;
}

export interface GitDiffChunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: GitDiffLine[];
  header: string;
}

export interface GitDiffLine {
  content: string;
  type: 'context' | 'addition' | 'deletion';
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface GitMergeResult {
  success: boolean;
  conflicts?: string[];
  message?: string;
}

export interface GitRebaseResult {
  success: boolean;
  conflicts?: string[];
  currentCommit?: string;
  message?: string;
}

export class GitService extends EventEmitter {
  private workingDirectory: string | null = null;
  private isRepository: boolean = false;

  constructor() {
    super();
  }

  // Repository initialization and detection
  async setWorkingDirectory(path: string): Promise<boolean> {
    this.workingDirectory = path;
    this.isRepository = await this.isGitRepository();
    this.emit('workingDirectoryChanged', { path, isRepository: this.isRepository });
    return this.isRepository;
  }

  async isGitRepository(): Promise<boolean> {
    if (!this.workingDirectory) return false;

    try {
      const result = await this.executeGitCommand(['rev-parse', '--git-dir']);
      return result.success;
    } catch (error) {
      return false;
    }
  }

  async initRepository(): Promise<boolean> {
    if (!this.workingDirectory) {
      throw new Error('No working directory set');
    }

    try {
      const result = await this.executeGitCommand(['init']);
      if (result.success) {
        this.isRepository = true;
        this.emit('repositoryInitialized', this.workingDirectory);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to initialize repository:', error);
      return false;
    }
  }

  // Status and basic operations
  async getStatus(): Promise<GitStatus> {
    const result = await this.executeGitCommand([
      'status', '--porcelain=v1', '--branch', '--ahead-behind'
    ]);

    if (!result.success) {
      throw new Error('Failed to get git status');
    }

    return this.parseStatus(result.stdout);
  }

  async addFiles(files: string[]): Promise<boolean> {
    try {
      const result = await this.executeGitCommand(['add', ...files]);
      if (result.success) {
        this.emit('filesStaged', files);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to add files:', error);
      return false;
    }
  }

  async addAllFiles(): Promise<boolean> {
    return this.addFiles(['-A']);
  }

  async unstageFiles(files: string[]): Promise<boolean> {
    try {
      const result = await this.executeGitCommand(['reset', 'HEAD', ...files]);
      if (result.success) {
        this.emit('filesUnstaged', files);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to unstage files:', error);
      return false;
    }
  }

  async discardChanges(files: string[]): Promise<boolean> {
    try {
      const result = await this.executeGitCommand(['checkout', '--', ...files]);
      if (result.success) {
        this.emit('changesDiscarded', files);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to discard changes:', error);
      return false;
    }
  }

  async commit(message: string, options?: {
    amend?: boolean;
    signOff?: boolean;
    author?: string;
  }): Promise<boolean> {
    const args = ['commit', '-m', message];

    if (options?.amend) args.push('--amend');
    if (options?.signOff) args.push('--signoff');
    if (options?.author) args.push('--author', options.author);

    try {
      const result = await this.executeGitCommand(args);
      if (result.success) {
        this.emit('committed', { message, options });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to commit:', error);
      return false;
    }
  }

  // Branch operations
  async getBranches(includeRemote: boolean = false): Promise<GitBranch[]> {
    const args = ['branch', '--format=%(refname:short)|%(upstream:short)|%(ahead-behind)|%(objectname:short)|%(subject)'];
    if (includeRemote) args.push('-a');

    const result = await this.executeGitCommand(args);
    if (!result.success) {
      throw new Error('Failed to get branches');
    }

    return this.parseBranches(result.stdout);
  }

  async getCurrentBranch(): Promise<string> {
    const result = await this.executeGitCommand(['branch', '--show-current']);
    if (!result.success) {
      throw new Error('Failed to get current branch');
    }
    return result.stdout.trim();
  }

  async createBranch(name: string, startPoint?: string): Promise<boolean> {
    const args = ['checkout', '-b', name];
    if (startPoint) args.push(startPoint);

    try {
      const result = await this.executeGitCommand(args);
      if (result.success) {
        this.emit('branchCreated', { name, startPoint });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to create branch:', error);
      return false;
    }
  }

  async switchBranch(name: string): Promise<boolean> {
    try {
      const result = await this.executeGitCommand(['checkout', name]);
      if (result.success) {
        this.emit('branchSwitched', name);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to switch branch:', error);
      return false;
    }
  }

  async deleteBranch(name: string, force: boolean = false): Promise<boolean> {
    const args = ['branch', force ? '-D' : '-d', name];

    try {
      const result = await this.executeGitCommand(args);
      if (result.success) {
        this.emit('branchDeleted', { name, force });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to delete branch:', error);
      return false;
    }
  }

  async renameBranch(oldName: string, newName: string): Promise<boolean> {
    try {
      const result = await this.executeGitCommand(['branch', '-m', oldName, newName]);
      if (result.success) {
        this.emit('branchRenamed', { oldName, newName });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to rename branch:', error);
      return false;
    }
  }

  // Remote operations
  async getRemotes(): Promise<GitRemote[]> {
    const result = await this.executeGitCommand(['remote', '-v']);
    if (!result.success) {
      throw new Error('Failed to get remotes');
    }

    return this.parseRemotes(result.stdout);
  }

  async addRemote(name: string, url: string): Promise<boolean> {
    try {
      const result = await this.executeGitCommand(['remote', 'add', name, url]);
      if (result.success) {
        this.emit('remoteAdded', { name, url });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to add remote:', error);
      return false;
    }
  }

  async removeRemote(name: string): Promise<boolean> {
    try {
      const result = await this.executeGitCommand(['remote', 'remove', name]);
      if (result.success) {
        this.emit('remoteRemoved', name);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to remove remote:', error);
      return false;
    }
  }

  async fetch(remote?: string, branch?: string): Promise<boolean> {
    const args = ['fetch'];
    if (remote) args.push(remote);
    if (branch) args.push(branch);

    try {
      const result = await this.executeGitCommand(args);
      if (result.success) {
        this.emit('fetched', { remote, branch });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to fetch:', error);
      return false;
    }
  }

  async pull(remote?: string, branch?: string): Promise<boolean> {
    const args = ['pull'];
    if (remote) args.push(remote);
    if (branch) args.push(branch);

    try {
      const result = await this.executeGitCommand(args);
      if (result.success) {
        this.emit('pulled', { remote, branch });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to pull:', error);
      return false;
    }
  }

  async push(remote?: string, branch?: string, force: boolean = false): Promise<boolean> {
    const args = ['push'];
    if (force) args.push('--force');
    if (remote) args.push(remote);
    if (branch) args.push(branch);

    try {
      const result = await this.executeGitCommand(args);
      if (result.success) {
        this.emit('pushed', { remote, branch, force });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to push:', error);
      return false;
    }
  }

  // Merge and rebase operations
  async merge(branch: string, options?: {
    noFF?: boolean;
    squash?: boolean;
    strategy?: string;
  }): Promise<GitMergeResult> {
    const args = ['merge'];

    if (options?.noFF) args.push('--no-ff');
    if (options?.squash) args.push('--squash');
    if (options?.strategy) args.push('--strategy', options.strategy);

    args.push(branch);

    try {
      const result = await this.executeGitCommand(args);

      if (result.success) {
        this.emit('merged', { branch, options });
        return { success: true };
      } else {
        // Check for conflicts
        const conflicts = await this.getConflictedFiles();
        return { success: false, conflicts };
      }
    } catch (error) {
      console.error('Failed to merge:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async rebase(branch: string, interactive: boolean = false): Promise<GitRebaseResult> {
    const args = ['rebase'];
    if (interactive) args.push('-i');
    args.push(branch);

    try {
      const result = await this.executeGitCommand(args);

      if (result.success) {
        this.emit('rebased', { branch, interactive });
        return { success: true };
      } else {
        const conflicts = await this.getConflictedFiles();
        return { success: false, conflicts };
      }
    } catch (error) {
      console.error('Failed to rebase:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async abortMerge(): Promise<boolean> {
    try {
      const result = await this.executeGitCommand(['merge', '--abort']);
      if (result.success) {
        this.emit('mergeAborted');
      }
      return result.success;
    } catch (error) {
      console.error('Failed to abort merge:', error);
      return false;
    }
  }

  async abortRebase(): Promise<boolean> {
    try {
      const result = await this.executeGitCommand(['rebase', '--abort']);
      if (result.success) {
        this.emit('rebaseAborted');
      }
      return result.success;
    } catch (error) {
      console.error('Failed to abort rebase:', error);
      return false;
    }
  }

  // History and log operations
  async getCommitHistory(options?: {
    maxCount?: number;
    branch?: string;
    since?: Date;
    until?: Date;
    author?: string;
    grep?: string;
  }): Promise<GitCommit[]> {
    const args = ['log', '--format=%H|%an|%ae|%s|%ai|%D'];

    if (options?.maxCount) args.push(`--max-count=${options.maxCount}`);
    if (options?.since) args.push(`--since=${options.since.toISOString()}`);
    if (options?.until) args.push(`--until=${options.until.toISOString()}`);
    if (options?.author) args.push(`--author=${options.author}`);
    if (options?.grep) args.push(`--grep=${options.grep}`);
    if (options?.branch) args.push(options.branch);

    const result = await this.executeGitCommand(args);
    if (!result.success) {
      throw new Error('Failed to get commit history');
    }

    return this.parseCommitHistory(result.stdout);
  }

  async getDiff(options?: {
    staged?: boolean;
    file?: string;
    commit1?: string;
    commit2?: string;
  }): Promise<GitDiff[]> {
    const args = ['diff'];

    if (options?.staged) args.push('--staged');
    if (options?.commit1) {
      args.push(options.commit1);
      if (options?.commit2) {
        args.push(options.commit2);
      }
    }
    if (options?.file) args.push('--', options.file);

    const result = await this.executeGitCommand(args);
    if (!result.success) {
      throw new Error('Failed to get diff');
    }

    return this.parseDiff(result.stdout);
  }

  // Stash operations
  async getStashes(): Promise<GitStash[]> {
    const result = await this.executeGitCommand(['stash', 'list', '--format=%gd|%s|%gD|%ai']);
    if (!result.success) {
      throw new Error('Failed to get stashes');
    }

    return this.parseStashes(result.stdout);
  }

  async stash(message?: string, includeUntracked: boolean = false): Promise<boolean> {
    const args = ['stash', 'push'];
    if (includeUntracked) args.push('-u');
    if (message) args.push('-m', message);

    try {
      const result = await this.executeGitCommand(args);
      if (result.success) {
        this.emit('stashed', { message, includeUntracked });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to stash:', error);
      return false;
    }
  }

  async applyStash(index?: number): Promise<boolean> {
    const args = ['stash', 'apply'];
    if (index !== undefined) args.push(`stash@{${index}}`);

    try {
      const result = await this.executeGitCommand(args);
      if (result.success) {
        this.emit('stashApplied', index);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to apply stash:', error);
      return false;
    }
  }

  async popStash(index?: number): Promise<boolean> {
    const args = ['stash', 'pop'];
    if (index !== undefined) args.push(`stash@{${index}}`);

    try {
      const result = await this.executeGitCommand(args);
      if (result.success) {
        this.emit('stashPopped', index);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to pop stash:', error);
      return false;
    }
  }

  async dropStash(index: number): Promise<boolean> {
    try {
      const result = await this.executeGitCommand(['stash', 'drop', `stash@{${index}}`]);
      if (result.success) {
        this.emit('stashDropped', index);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to drop stash:', error);
      return false;
    }
  }

  // Tag operations
  async getTags(): Promise<GitTag[]> {
    const result = await this.executeGitCommand(['tag', '-l', '--format=%(refname:short)|%(objectname)|%(creatordate)|%(subject)|%(authorname)']);
    if (!result.success) {
      throw new Error('Failed to get tags');
    }

    return this.parseTags(result.stdout);
  }

  async createTag(name: string, message?: string, commit?: string): Promise<boolean> {
    const args = ['tag'];
    if (message) args.push('-a', name, '-m', message);
    else args.push(name);
    if (commit) args.push(commit);

    try {
      const result = await this.executeGitCommand(args);
      if (result.success) {
        this.emit('tagCreated', { name, message, commit });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to create tag:', error);
      return false;
    }
  }

  async deleteTag(name: string): Promise<boolean> {
    try {
      const result = await this.executeGitCommand(['tag', '-d', name]);
      if (result.success) {
        this.emit('tagDeleted', name);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to delete tag:', error);
      return false;
    }
  }

  // Conflict resolution
  async getConflictedFiles(): Promise<string[]> {
    const result = await this.executeGitCommand(['diff', '--name-only', '--diff-filter=U']);
    if (!result.success) return [];

    return result.stdout.trim().split('\n').filter(line => line.trim());
  }

  async resolveConflict(file: string): Promise<boolean> {
    return this.addFiles([file]);
  }

  // Utility methods
  private async executeGitCommand(args: string[]): Promise<{ success: boolean; stdout: string; stderr: string }> {
    if (!this.workingDirectory) {
      throw new Error('No working directory set');
    }

    try {
      const command = Command.create('git', args, {
        cwd: this.workingDirectory
      });

      const output = await command.execute();

      return {
        success: output.code === 0,
        stdout: output.stdout || '',
        stderr: output.stderr || ''
      };
    } catch (error) {
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }


  // Parsing methods
  private parseStatus(output: string): GitStatus {
    const lines = output.trim().split('\n');
    const branchLine = lines[0];

    // Parse branch info
    const branchMatch = branchLine.match(/## ([^.]+)(?:\.\.\.([^[\s]+))?\s*(?:\[ahead (\d+)(?:, behind (\d+))?\])?/);
    const branch = branchMatch?.[1] || 'main';
    const ahead = parseInt(branchMatch?.[3] || '0');
    const behind = parseInt(branchMatch?.[4] || '0');

    const staged: GitFileChange[] = [];
    const unstaged: GitFileChange[] = [];
    const untracked: string[] = [];
    const conflicts: string[] = [];

    // Parse file changes
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.length < 3) continue;

      const stagedStatus = line[0];
      const unstagedStatus = line[1];
      const filePath = line.substring(3);

      if (stagedStatus === 'U' || unstagedStatus === 'U') {
        conflicts.push(filePath);
      } else if (stagedStatus !== ' ' && stagedStatus !== '?') {
        staged.push({
          path: filePath,
          status: this.mapGitStatus(stagedStatus),
          staged: true
        });
      }

      if (unstagedStatus !== ' ') {
        if (unstagedStatus === '?') {
          untracked.push(filePath);
        } else {
          unstaged.push({
            path: filePath,
            status: this.mapGitStatus(unstagedStatus),
            staged: false
          });
        }
      }
    }

    return {
      branch,
      ahead,
      behind,
      staged,
      unstaged,
      untracked,
      conflicts,
      clean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0
    };
  }

  private mapGitStatus(status: string): GitFileChange['status'] {
    switch (status) {
      case 'A': return 'added';
      case 'M': return 'modified';
      case 'D': return 'deleted';
      case 'R': return 'renamed';
      case 'C': return 'copied';
      case '?': return 'untracked';
      default: return 'modified';
    }
  }

  private parseBranches(output: string): GitBranch[] {
    return output.trim().split('\n').map(line => {
      const [name, upstream, aheadBehind, hash, subject] = line.split('|');
      const [ahead, behind] = aheadBehind ? aheadBehind.split('\t').map(Number) : [0, 0];

      return {
        name: name.replace('* ', ''),
        current: name.startsWith('* '),
        upstream,
        ahead,
        behind,
        lastCommit: {
          hash,
          shortHash: hash,
          message: subject,
          author: '',
          email: '',
          date: new Date()
        }
      };
    });
  }

  private parseRemotes(output: string): GitRemote[] {
    const remotes: GitRemote[] = [];
    const lines = output.trim().split('\n');

    for (const line of lines) {
      const [name, url, type] = line.split('\t');
      const typeMatch = type.match(/\((\w+)\)/);
      remotes.push({
        name,
        url,
        type: typeMatch?.[1] as 'fetch' | 'push' || 'fetch'
      });
    }

    return remotes;
  }

  private parseCommitHistory(output: string): GitCommit[] {
    return output.trim().split('\n').map(line => {
      const [hash, author, email, message, date, refs] = line.split('|');
      return {
        hash,
        shortHash: hash.substring(0, 7),
        author,
        email,
        message,
        date: new Date(date),
        refs: refs ? refs.split(', ') : undefined
      };
    });
  }

  private parseDiff(output: string): GitDiff[] {
    // Simplified diff parsing - would need more sophisticated parsing for real use
    const diffs: GitDiff[] = [];
    const lines = output.split('\n');

    let currentDiff: GitDiff | null = null;
    let currentChunk: GitDiffChunk | null = null;

    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        if (currentDiff) diffs.push(currentDiff);
        const match = line.match(/diff --git a\/(.+) b\/(.+)/);
        currentDiff = {
          file: match?.[2] || '',
          oldFile: match?.[1],
          chunks: [],
          binary: false,
          newFile: false,
          deletedFile: false,
          renamedFile: false
        };
      } else if (line.startsWith('@@') && currentDiff) {
        if (currentChunk) currentDiff.chunks.push(currentChunk);
        const match = line.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@(.*)/);
        currentChunk = {
          oldStart: parseInt(match?.[1] || '0'),
          oldLines: parseInt(match?.[2] || '0'),
          newStart: parseInt(match?.[3] || '0'),
          newLines: parseInt(match?.[4] || '0'),
          header: match?.[5] || '',
          lines: []
        };
      } else if (currentChunk && (line.startsWith(' ') || line.startsWith('+') || line.startsWith('-'))) {
        const type = line.startsWith('+') ? 'addition' : line.startsWith('-') ? 'deletion' : 'context';
        currentChunk.lines.push({
          content: line.substring(1),
          type,
          oldLineNumber: type !== 'addition' ? currentChunk.oldStart + currentChunk.lines.length : undefined,
          newLineNumber: type !== 'deletion' ? currentChunk.newStart + currentChunk.lines.length : undefined
        });
      }
    }

    if (currentChunk && currentDiff) {
      currentDiff.chunks.push(currentChunk);
    }
    if (currentDiff) {
      diffs.push(currentDiff);
    }

    return diffs;
  }

  private parseStashes(output: string): GitStash[] {
    return output.trim().split('\n').map(line => {
      const [index, message, branch, date] = line.split('|');
      return {
        index: parseInt(index.match(/\d+/)?.[0] || '0'),
        message,
        branch,
        date: new Date(date)
      };
    });
  }

  private parseTags(output: string): GitTag[] {
    return output.trim().split('\n').map(line => {
      const [name, commit, date, message, author] = line.split('|');
      return {
        name,
        commit,
        date: new Date(date),
        message,
        author
      };
    });
  }

  // Public getters
  getWorkingDirectory(): string | null {
    return this.workingDirectory;
  }

  getIsRepository(): boolean {
    return this.isRepository;
  }
}

// Singleton instance
export const gitService = new GitService();