// Web-specific file system service
// Provides browser-compatible file operations using File System Access API

export interface WebFile {
  id: string;
  name: string;
  content: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  lastModified?: Date;
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
}

export class WebFileSystemService {
  private files: Map<string, WebFile> = new Map();
  private directoryHandle: FileSystemDirectoryHandle | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // Check if File System Access API is supported
  isSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  // Open a directory using File System Access API
  async openDirectory(): Promise<WebFile[]> {
    if (!this.isSupported()) {
      throw new Error('File System Access API not supported in this browser');
    }

    try {
      this.directoryHandle = await (window as any).showDirectoryPicker();
      const files = await this.scanDirectory(this.directoryHandle);
      this.saveToStorage();
      return files;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Directory selection was cancelled');
      }
      throw error;
    }
  }

  // Read file content
  async readFile(fileId: string): Promise<string> {
    const webFile = this.files.get(fileId);
    if (!webFile) {
      throw new Error(`File not found: ${fileId}`);
    }

    if (webFile.handle && 'getFile' in webFile.handle) {
      const file = await (webFile.handle as FileSystemFileHandle).getFile();
      const content = await file.text();
      webFile.content = content;
      return content;
    }

    return webFile.content || '';
  }

  // Write file content
  async writeFile(fileId: string, content: string): Promise<void> {
    const webFile = this.files.get(fileId);
    if (!webFile) {
      throw new Error(`File not found: ${fileId}`);
    }

    if (webFile.handle && 'createWritable' in webFile.handle) {
      const writable = await (webFile.handle as FileSystemFileHandle).createWritable();
      await writable.write(content);
      await writable.close();
    }

    webFile.content = content;
    webFile.lastModified = new Date();
    this.saveToStorage();
  }

  // Create new file
  async createFile(name: string, content: string = '', parentId?: string): Promise<WebFile> {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const path = parentId ? `${this.files.get(parentId)?.path || ''}/${name}` : name;

    const webFile: WebFile = {
      id: fileId,
      name,
      content,
      type: 'file',
      path,
      size: content.length,
      lastModified: new Date()
    };

    // If we have a directory handle and File System Access API support
    if (this.directoryHandle && this.isSupported()) {
      try {
        const fileHandle = await this.directoryHandle.getFileHandle(name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        webFile.handle = fileHandle;
      } catch (error) {
        console.warn('Could not create file via File System Access API:', error);
      }
    }

    this.files.set(fileId, webFile);
    this.saveToStorage();
    return webFile;
  }

  // Delete file
  async deleteFile(fileId: string): Promise<void> {
    const webFile = this.files.get(fileId);
    if (!webFile) {
      throw new Error(`File not found: ${fileId}`);
    }

    // If using File System Access API
    if (webFile.handle && this.directoryHandle) {
      try {
        await this.directoryHandle.removeEntry(webFile.name);
      } catch (error) {
        console.warn('Could not delete file via File System Access API:', error);
      }
    }

    this.files.delete(fileId);
    this.saveToStorage();
  }

  // Get all files
  getFiles(): WebFile[] {
    return Array.from(this.files.values());
  }

  // Search files
  searchFiles(query: string): WebFile[] {
    const normalizedQuery = query.toLowerCase();
    return this.getFiles().filter(file =>
      file.name.toLowerCase().includes(normalizedQuery) ||
      file.content.toLowerCase().includes(normalizedQuery)
    );
  }

  // Import files from input element
  async importFiles(files: FileList): Promise<WebFile[]> {
    const importedFiles: WebFile[] = [];

    for (const file of Array.from(files)) {
      const content = await file.text();
      const webFile: WebFile = {
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        content,
        type: 'file',
        path: file.name,
        size: file.size,
        lastModified: new Date(file.lastModified)
      };

      this.files.set(webFile.id, webFile);
      importedFiles.push(webFile);
    }

    this.saveToStorage();
    return importedFiles;
  }

  // Export file for download
  downloadFile(fileId: string): void {
    const webFile = this.files.get(fileId);
    if (!webFile) {
      throw new Error(`File not found: ${fileId}`);
    }

    const blob = new Blob([webFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = webFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export all files as ZIP (requires additional library)
  async exportAsZip(): Promise<void> {
    // This would require a library like JSZip
    console.warn('ZIP export not implemented. Consider adding JSZip library.');
  }

  // Private methods
  private async scanDirectory(
    dirHandle: FileSystemDirectoryHandle,
    path: string = ''
  ): Promise<WebFile[]> {
    const files: WebFile[] = [];

    for await (const [name, handle] of dirHandle.entries()) {
      const fullPath = path ? `${path}/${name}` : name;
      const fileId = `${handle.kind}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (handle.kind === 'file') {
        const file = await (handle as FileSystemFileHandle).getFile();
        const webFile: WebFile = {
          id: fileId,
          name,
          content: '', // Load on demand
          type: 'file',
          path: fullPath,
          size: file.size,
          lastModified: new Date(file.lastModified),
          handle
        };
        files.push(webFile);
        this.files.set(fileId, webFile);
      } else if (handle.kind === 'directory') {
        const webFile: WebFile = {
          id: fileId,
          name,
          content: '',
          type: 'folder',
          path: fullPath,
          handle
        };
        files.push(webFile);
        this.files.set(fileId, webFile);

        // Recursively scan subdirectory (with depth limit)
        if (path.split('/').length < 3) {
          const subFiles = await this.scanDirectory(handle as FileSystemDirectoryHandle, fullPath);
          files.push(...subFiles);
        }
      }
    }

    return files;
  }

  private saveToStorage(): void {
    try {
      const serializable = Array.from(this.files.entries()).map(([id, file]) => [
        id,
        {
          ...file,
          handle: undefined // Can't serialize FileSystemHandle
        }
      ]);
      localStorage.setItem('branchcode_web_files', JSON.stringify(serializable));
    } catch (error) {
      console.warn('Could not save files to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('branchcode_web_files');
      if (stored) {
        const files = JSON.parse(stored);
        this.files = new Map(files);
      }
    } catch (error) {
      console.warn('Could not load files from localStorage:', error);
    }
  }

  // Cleanup
  destroy(): void {
    this.files.clear();
    this.directoryHandle = null;
  }
}

// Singleton instance
export const webFileSystemService = new WebFileSystemService();