import { invoke } from '@tauri-apps/api/core';
import { readDir, readTextFile, writeTextFile, createDir, removeFile, removeDir, exists, copyFile, renameFile } from '@tauri-apps/plugin-fs';
import { listen } from '@tauri-apps/api/event';
import type { FileSystemItem } from '../../components/editor/FileExplorer';

export interface WorkspaceConfig {
  path: string;
  name: string;
  lastOpened: Date;
  recentFiles: string[];
  settings: {
    excludePatterns: string[];
    autoSave: boolean;
    watchFiles: boolean;
  };
}

export interface FileSearchOptions {
  query: string;
  extensions?: string[];
  caseSensitive?: boolean;
  includeContent?: boolean;
  maxResults?: number;
}

export interface FileWatchEvent {
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  path: string;
  oldPath?: string;
}

export class FileSystemService {
  private workspaces: Map<string, WorkspaceConfig> = new Map();
  private currentWorkspace: string | null = null;
  private watchers: Map<string, () => void> = new Map();
  private cache: Map<string, FileSystemItem[]> = new Map();

  constructor() {
    this.loadWorkspaces();
  }

  // Workspace Management
  async openWorkspace(path: string): Promise<WorkspaceConfig> {
    const workspaceExists = await exists(path);
    if (!workspaceExists) {
      throw new Error(`Workspace path does not exist: ${path}`);
    }

    const name = path.split('/').pop() || 'Unknown';
    const config: WorkspaceConfig = {
      path,
      name,
      lastOpened: new Date(),
      recentFiles: [],
      settings: {
        excludePatterns: [
          'node_modules',
          '.git',
          'dist',
          'build',
          '.next',
          '.nuxt',
          'target',
          'bin',
          'obj',
          '.DS_Store',
          'Thumbs.db'
        ],
        autoSave: true,
        watchFiles: true
      }
    };

    this.workspaces.set(path, config);
    this.currentWorkspace = path;
    this.saveWorkspaces();

    if (config.settings.watchFiles) {
      await this.startWatching(path);
    }

    return config;
  }

  async closeWorkspace(): Promise<void> {
    if (this.currentWorkspace) {
      this.stopWatching(this.currentWorkspace);
      this.cache.delete(this.currentWorkspace);
      this.currentWorkspace = null;
    }
  }

  getCurrentWorkspace(): WorkspaceConfig | null {
    return this.currentWorkspace ? this.workspaces.get(this.currentWorkspace) || null : null;
  }

  getRecentWorkspaces(): WorkspaceConfig[] {
    return Array.from(this.workspaces.values())
      .sort((a, b) => b.lastOpened.getTime() - a.lastOpened.getTime())
      .slice(0, 10);
  }

  // File Operations
  async readFile(path: string): Promise<string> {
    try {
      const content = await readTextFile(path);
      this.addToRecentFiles(path);
      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${path} - ${error}`);
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    try {
      await writeTextFile(path, content);
      this.addToRecentFiles(path);
      this.invalidateCache(path);
    } catch (error) {
      throw new Error(`Failed to write file: ${path} - ${error}`);
    }
  }

  async createFile(path: string, content: string = ''): Promise<void> {
    try {
      const fileExists = await exists(path);
      if (fileExists) {
        throw new Error(`File already exists: ${path}`);
      }

      await writeTextFile(path, content);
      this.invalidateCache(path);
    } catch (error) {
      throw new Error(`Failed to create file: ${path} - ${error}`);
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await removeFile(path);
      this.removeFromRecentFiles(path);
      this.invalidateCache(path);
    } catch (error) {
      throw new Error(`Failed to delete file: ${path} - ${error}`);
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    try {
      await renameFile(oldPath, newPath);
      this.removeFromRecentFiles(oldPath);
      this.addToRecentFiles(newPath);
      this.invalidateCache(oldPath);
      this.invalidateCache(newPath);
    } catch (error) {
      throw new Error(`Failed to rename file: ${oldPath} -> ${newPath} - ${error}`);
    }
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      await copyFile(sourcePath, destinationPath);
      this.invalidateCache(destinationPath);
    } catch (error) {
      throw new Error(`Failed to copy file: ${sourcePath} -> ${destinationPath} - ${error}`);
    }
  }

  // Directory Operations
  async createDirectory(path: string): Promise<void> {
    try {
      await createDir(path, { recursive: true });
      this.invalidateCache(path);
    } catch (error) {
      throw new Error(`Failed to create directory: ${path} - ${error}`);
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    try {
      await removeDir(path, { recursive: true });
      this.invalidateCache(path);
    } catch (error) {
      throw new Error(`Failed to delete directory: ${path} - ${error}`);
    }
  }

  async scanDirectory(path: string, recursive: boolean = true): Promise<FileSystemItem[]> {
    const cacheKey = `${path}:${recursive}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const items = await this.scanDirectoryRecursive(path, recursive);
      this.cache.set(cacheKey, items);
      return items;
    } catch (error) {
      throw new Error(`Failed to scan directory: ${path} - ${error}`);
    }
  }

  private async scanDirectoryRecursive(path: string, recursive: boolean, level: number = 0): Promise<FileSystemItem[]> {
    const items: FileSystemItem[] = [];
    const entries = await readDir(path);
    const config = this.getCurrentWorkspace();

    for (const entry of entries) {
      const itemPath = `${path}/${entry.name}`;

      // Skip excluded patterns
      if (config && this.shouldExclude(entry.name, config.settings.excludePatterns)) {
        continue;
      }

      const item: FileSystemItem = {
        id: itemPath,
        name: entry.name,
        type: entry.isDirectory ? 'folder' : 'file',
        path: itemPath,
        size: entry.isFile ? await this.getFileSize(itemPath) : undefined,
        lastModified: new Date()
      };

      if (entry.isDirectory && recursive && level < 10) { // Prevent infinite recursion
        item.children = await this.scanDirectoryRecursive(itemPath, recursive, level + 1);
      }

      items.push(item);
    }

    return items.sort((a, b) => {
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  private shouldExclude(name: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(name);
      }
      return name === pattern || name.startsWith(pattern);
    });
  }

  private async getFileSize(path: string): Promise<number> {
    try {
      const metadata = await invoke<{ size: number }>('plugin:fs|metadata', { path });
      return metadata.size;
    } catch {
      return 0;
    }
  }

  // File Search
  async searchFiles(options: FileSearchOptions): Promise<FileSystemItem[]> {
    if (!this.currentWorkspace) {
      throw new Error('No workspace is currently open');
    }

    const results: FileSystemItem[] = [];
    const maxResults = options.maxResults || 100;

    await this.searchInDirectory(
      this.currentWorkspace,
      options,
      results,
      maxResults
    );

    return results;
  }

  private async searchInDirectory(
    path: string,
    options: FileSearchOptions,
    results: FileSystemItem[],
    maxResults: number
  ): Promise<void> {
    if (results.length >= maxResults) return;

    try {
      const entries = await readDir(path);
      const config = this.getCurrentWorkspace();

      for (const entry of entries) {
        if (results.length >= maxResults) break;

        const itemPath = `${path}/${entry.name}`;

        if (config && this.shouldExclude(entry.name, config.settings.excludePatterns)) {
          continue;
        }

        const matchesName = options.caseSensitive
          ? entry.name.includes(options.query)
          : entry.name.toLowerCase().includes(options.query.toLowerCase());

        let matchesContent = false;
        if (options.includeContent && entry.isFile && this.matchesExtension(entry.name, options.extensions)) {
          try {
            const content = await readTextFile(itemPath);
            matchesContent = options.caseSensitive
              ? content.includes(options.query)
              : content.toLowerCase().includes(options.query.toLowerCase());
          } catch {
            // Ignore files that can't be read
          }
        }

        if (matchesName || matchesContent) {
          results.push({
            id: itemPath,
            name: entry.name,
            type: entry.isDirectory ? 'folder' : 'file',
            path: itemPath,
            size: entry.isFile ? await this.getFileSize(itemPath) : undefined,
            lastModified: new Date()
          });
        }

        if (entry.isDirectory) {
          await this.searchInDirectory(itemPath, options, results, maxResults);
        }
      }
    } catch (error) {
      console.warn(`Failed to search in directory ${path}:`, error);
    }
  }

  private matchesExtension(filename: string, extensions?: string[]): boolean {
    if (!extensions || extensions.length === 0) return true;

    const ext = filename.split('.').pop()?.toLowerCase();
    return extensions.some(e => e.toLowerCase() === ext);
  }

  // File Watching
  private async startWatching(path: string): Promise<void> {
    try {
      const unlisten = await listen<FileWatchEvent>('file-changed', (event) => {
        if (event.payload.path.startsWith(path)) {
          this.invalidateCache(event.payload.path);
          this.handleFileChange(event.payload);
        }
      });

      this.watchers.set(path, unlisten);

      // Start watching via Tauri
      await invoke('plugin:fs|watch', { path });
    } catch (error) {
      console.warn(`Failed to start watching ${path}:`, error);
    }
  }

  private stopWatching(path: string): void {
    const unlisten = this.watchers.get(path);
    if (unlisten) {
      unlisten();
      this.watchers.delete(path);
    }
  }

  private handleFileChange(event: FileWatchEvent): void {
    // Emit file change events for UI updates
    window.dispatchEvent(new CustomEvent('branchcode:file-changed', {
      detail: event
    }));
  }

  // Recent Files Management
  private addToRecentFiles(path: string): void {
    const workspace = this.getCurrentWorkspace();
    if (!workspace) return;

    workspace.recentFiles = workspace.recentFiles.filter(f => f !== path);
    workspace.recentFiles.unshift(path);
    workspace.recentFiles = workspace.recentFiles.slice(0, 20);
    workspace.lastOpened = new Date();

    this.saveWorkspaces();
  }

  private removeFromRecentFiles(path: string): void {
    const workspace = this.getCurrentWorkspace();
    if (!workspace) return;

    workspace.recentFiles = workspace.recentFiles.filter(f => f !== path);
    this.saveWorkspaces();
  }

  getRecentFiles(): string[] {
    const workspace = this.getCurrentWorkspace();
    return workspace?.recentFiles || [];
  }

  // Cache Management
  private invalidateCache(path: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key =>
      key.startsWith(path) || path.startsWith(key.split(':')[0])
    );

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Persistence
  private loadWorkspaces(): void {
    try {
      const stored = localStorage.getItem('branchcode_workspaces');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([path, config]: [string, any]) => {
          this.workspaces.set(path, {
            ...config,
            lastOpened: new Date(config.lastOpened)
          });
        });
      }
    } catch (error) {
      console.warn('Failed to load workspaces:', error);
    }
  }

  private saveWorkspaces(): void {
    try {
      const data = Object.fromEntries(this.workspaces.entries());
      localStorage.setItem('branchcode_workspaces', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save workspaces:', error);
    }
  }

  // Utility Methods
  async exists(path: string): Promise<boolean> {
    return await exists(path);
  }

  getWorkspaceRelativePath(absolutePath: string): string {
    const workspace = this.getCurrentWorkspace();
    if (!workspace) return absolutePath;

    return absolutePath.startsWith(workspace.path)
      ? absolutePath.slice(workspace.path.length + 1)
      : absolutePath;
  }

  getAbsolutePath(relativePath: string): string {
    const workspace = this.getCurrentWorkspace();
    if (!workspace) return relativePath;

    return `${workspace.path}/${relativePath}`;
  }

  // File Type Detection
  getFileLanguage(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'txt': 'plaintext'
    };

    return languageMap[extension || ''] || 'plaintext';
  }

  isTextFile(path: string): boolean {
    const extension = path.split('.').pop()?.toLowerCase();
    const textExtensions = [
      'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php',
      'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'clj', 'hs', 'ml',
      'html', 'css', 'scss', 'less', 'vue', 'svelte', 'json', 'xml',
      'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'env', 'md', 'txt',
      'log', 'sql', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat'
    ];

    return textExtensions.includes(extension || '');
  }

  // Cleanup
  destroy(): void {
    this.watchers.forEach((unlisten) => unlisten());
    this.watchers.clear();
    this.cache.clear();
  }
}

// Singleton instance
export const fileSystemService = new FileSystemService();