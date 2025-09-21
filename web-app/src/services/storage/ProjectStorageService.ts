/**
 * Project Storage Service
 * Handles file persistence for both web and desktop versions
 * Provides unified interface for file operations with cloud sync
 */

import { createClient } from '@/lib/supabase';
import { FileNode } from '@/components/ide/file-explorer';

export interface Project {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  is_public: boolean;
  last_accessed: string;
  created_at: string;
  updated_at: string;
  file_tree: FileNode[];
  settings?: ProjectSettings;
}

export interface ProjectSettings {
  language: string;
  framework?: string;
  theme: 'light' | 'dark' | 'auto';
  ai_provider: 'openai' | 'anthropic' | 'auto';
  ai_model: string;
  auto_save: boolean;
  auto_save_interval: number; // in seconds
}

export interface ProjectFile {
  id: string;
  project_id: string;
  path: string;
  name: string;
  content: string;
  file_type: 'file' | 'folder';
  parent_path?: string;
  size: number;
  last_modified: string;
  created_at: string;
  updated_at: string;
}

export interface StorageAdapter {
  saveProject(project: Project): Promise<void>;
  loadProject(projectId: string): Promise<Project | null>;
  listProjects(userId: string): Promise<Project[]>;
  deleteProject(projectId: string): Promise<void>;
  saveFile(file: ProjectFile): Promise<void>;
  loadFile(projectId: string, path: string): Promise<ProjectFile | null>;
  deleteFile(projectId: string, path: string): Promise<void>;
  exportProject(projectId: string): Promise<Blob>;
  importProject(projectData: Blob, userId: string): Promise<Project>;
}

/**
 * Cloud Storage Adapter (Supabase)
 */
export class CloudStorageAdapter implements StorageAdapter {
  private supabase = createClient();

  async saveProject(project: Project): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .upsert({
        id: project.id,
        name: project.name,
        description: project.description,
        user_id: project.user_id,
        is_public: project.is_public,
        last_accessed: project.last_accessed,
        file_tree: project.file_tree,
        settings: project.settings,
        updated_at: new Date().toISOString()
      });

    if (error) throw new Error(`Failed to save project: ${error.message}`);
  }

  async loadProject(projectId: string): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) return null;
    return data as Project;
  }

  async listProjects(userId: string): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed', { ascending: false });

    if (error) throw new Error(`Failed to list projects: ${error.message}`);
    return data as Project[];
  }

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw new Error(`Failed to delete project: ${error.message}`);
  }

  async saveFile(file: ProjectFile): Promise<void> {
    const { error } = await this.supabase
      .from('project_files')
      .upsert({
        id: file.id,
        project_id: file.project_id,
        path: file.path,
        name: file.name,
        content: file.content,
        file_type: file.file_type,
        parent_path: file.parent_path,
        size: file.size,
        last_modified: file.last_modified,
        updated_at: new Date().toISOString()
      });

    if (error) throw new Error(`Failed to save file: ${error.message}`);
  }

  async loadFile(projectId: string, path: string): Promise<ProjectFile | null> {
    const { data, error } = await this.supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .eq('path', path)
      .single();

    if (error) return null;
    return data as ProjectFile;
  }

  async deleteFile(projectId: string, path: string): Promise<void> {
    const { error } = await this.supabase
      .from('project_files')
      .delete()
      .eq('project_id', projectId)
      .eq('path', path);

    if (error) throw new Error(`Failed to delete file: ${error.message}`);
  }

  async exportProject(projectId: string): Promise<Blob> {
    const project = await this.loadProject(projectId);
    if (!project) throw new Error('Project not found');

    const { data: files } = await this.supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId);

    const projectData = {
      project,
      files: files || []
    };

    return new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json'
    });
  }

  async importProject(projectData: Blob, userId: string): Promise<Project> {
    const text = await projectData.text();
    const { project, files } = JSON.parse(text);

    // Generate new IDs
    const newProjectId = crypto.randomUUID();
    const newProject: Project = {
      ...project,
      id: newProjectId,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await this.saveProject(newProject);

    // Import files
    for (const file of files) {
      const newFile: ProjectFile = {
        ...file,
        id: crypto.randomUUID(),
        project_id: newProjectId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await this.saveFile(newFile);
    }

    return newProject;
  }
}

/**
 * Local Storage Adapter (Browser)
 */
export class LocalStorageAdapter implements StorageAdapter {
  private getStorageKey(type: string, id?: string): string {
    return `ottokode_${type}${id ? `_${id}` : ''}`;
  }

  async saveProject(project: Project): Promise<void> {
    localStorage.setItem(
      this.getStorageKey('project', project.id),
      JSON.stringify(project)
    );

    // Update project list
    const projects = await this.listProjects(project.user_id);
    const existingIndex = projects.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }

    localStorage.setItem(
      this.getStorageKey('projects', project.user_id),
      JSON.stringify(projects.map(p => p.id))
    );
  }

  async loadProject(projectId: string): Promise<Project | null> {
    const stored = localStorage.getItem(this.getStorageKey('project', projectId));
    return stored ? JSON.parse(stored) : null;
  }

  async listProjects(userId: string): Promise<Project[]> {
    const projectIds = localStorage.getItem(this.getStorageKey('projects', userId));
    if (!projectIds) return [];

    const ids: string[] = JSON.parse(projectIds);
    const projects: Project[] = [];

    for (const id of ids) {
      const project = await this.loadProject(id);
      if (project) projects.push(project);
    }

    return projects.sort((a, b) =>
      new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime()
    );
  }

  async deleteProject(projectId: string): Promise<void> {
    localStorage.removeItem(this.getStorageKey('project', projectId));

    // Remove from project list
    const project = await this.loadProject(projectId);
    if (project) {
      const projects = await this.listProjects(project.user_id);
      const filtered = projects.filter(p => p.id !== projectId);
      localStorage.setItem(
        this.getStorageKey('projects', project.user_id),
        JSON.stringify(filtered.map(p => p.id))
      );
    }
  }

  async saveFile(file: ProjectFile): Promise<void> {
    localStorage.setItem(
      this.getStorageKey('file', `${file.project_id}_${file.path}`),
      JSON.stringify(file)
    );
  }

  async loadFile(projectId: string, path: string): Promise<ProjectFile | null> {
    const stored = localStorage.getItem(
      this.getStorageKey('file', `${projectId}_${path}`)
    );
    return stored ? JSON.parse(stored) : null;
  }

  async deleteFile(projectId: string, path: string): Promise<void> {
    localStorage.removeItem(
      this.getStorageKey('file', `${projectId}_${path}`)
    );
  }

  async exportProject(projectId: string): Promise<Blob> {
    const project = await this.loadProject(projectId);
    if (!project) throw new Error('Project not found');

    // Get all files for the project
    const files: ProjectFile[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.getStorageKey('file', projectId))) {
        const file = JSON.parse(localStorage.getItem(key)!);
        files.push(file);
      }
    }

    const projectData = { project, files };
    return new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json'
    });
  }

  async importProject(projectData: Blob, userId: string): Promise<Project> {
    const text = await projectData.text();
    const { project, files } = JSON.parse(text);

    const newProjectId = crypto.randomUUID();
    const newProject: Project = {
      ...project,
      id: newProjectId,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await this.saveProject(newProject);

    for (const file of files) {
      const newFile: ProjectFile = {
        ...file,
        id: crypto.randomUUID(),
        project_id: newProjectId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await this.saveFile(newFile);
    }

    return newProject;
  }
}

/**
 * Main Project Storage Service
 */
export class ProjectStorageService {
  private cloudAdapter: CloudStorageAdapter;
  private localAdapter: LocalStorageAdapter;
  private isOnline: boolean = true;

  constructor() {
    this.cloudAdapter = new CloudStorageAdapter();
    this.localAdapter = new LocalStorageAdapter();

    // Only setup browser APIs on client side
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;

      // Listen for online/offline events
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncPendingChanges();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  /**
   * Get the appropriate adapter based on connection status
   */
  private getAdapter(): StorageAdapter {
    return this.isOnline ? this.cloudAdapter : this.localAdapter;
  }

  /**
   * Save project with auto-sync
   */
  async saveProject(project: Project): Promise<void> {
    // Always save locally first
    await this.localAdapter.saveProject(project);

    // Try to sync to cloud if online
    if (this.isOnline) {
      try {
        await this.cloudAdapter.saveProject(project);
      } catch (error) {
        console.warn('Failed to sync project to cloud:', error);
        this.markForSync('project', project.id);
      }
    } else {
      this.markForSync('project', project.id);
    }
  }

  /**
   * Load project with fallback
   */
  async loadProject(projectId: string): Promise<Project | null> {
    try {
      if (this.isOnline) {
        const cloudProject = await this.cloudAdapter.loadProject(projectId);
        if (cloudProject) {
          // Cache locally
          await this.localAdapter.saveProject(cloudProject);
          return cloudProject;
        }
      }
    } catch (error) {
      console.warn('Failed to load project from cloud:', error);
    }

    // Fallback to local
    return await this.localAdapter.loadProject(projectId);
  }

  /**
   * List projects with hybrid approach
   */
  async listProjects(userId: string): Promise<Project[]> {
    let projects: Project[] = [];

    try {
      if (this.isOnline) {
        projects = await this.cloudAdapter.listProjects(userId);
        // Cache all projects locally
        for (const project of projects) {
          await this.localAdapter.saveProject(project);
        }
      }
    } catch (error) {
      console.warn('Failed to load projects from cloud:', error);
    }

    if (projects.length === 0) {
      projects = await this.localAdapter.listProjects(userId);
    }

    return projects;
  }

  /**
   * Auto-save functionality
   */
  async autoSave(project: Project): Promise<void> {
    if (!project.settings?.auto_save) return;

    const interval = (project.settings.auto_save_interval || 30) * 1000;

    // Debounced auto-save
    clearTimeout((this as any).autoSaveTimer);
    (this as any).autoSaveTimer = setTimeout(async () => {
      try {
        await this.saveProject({
          ...project,
          updated_at: new Date().toISOString(),
          last_accessed: new Date().toISOString()
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, interval);
  }

  /**
   * Export project as downloadable file
   */
  async exportProject(projectId: string): Promise<void> {
    const adapter = this.getAdapter();
    const blob = await adapter.exportProject(projectId);

    const project = await this.loadProject(projectId);
    const filename = `${project?.name || 'project'}_${new Date().toISOString().split('T')[0]}.ottokode`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import project from file
   */
  async importProject(file: File, userId: string): Promise<Project> {
    const adapter = this.getAdapter();
    return await adapter.importProject(file, userId);
  }

  /**
   * Sync pending changes when coming back online
   */
  private async syncPendingChanges(): Promise<void> {
    if (typeof window === 'undefined') return;

    const pendingSync = JSON.parse(localStorage.getItem('ottokode_pending_sync') || '[]');

    for (const item of pendingSync) {
      try {
        if (item.type === 'project') {
          const project = await this.localAdapter.loadProject(item.id);
          if (project) {
            await this.cloudAdapter.saveProject(project);
          }
        }
      } catch (error) {
        console.error('Failed to sync item:', item, error);
      }
    }

    localStorage.removeItem('ottokode_pending_sync');
  }

  /**
   * Mark item for sync when offline
   */
  private markForSync(type: string, id: string): void {
    if (typeof window === 'undefined') return;

    const pendingSync = JSON.parse(localStorage.getItem('ottokode_pending_sync') || '[]');
    pendingSync.push({ type, id });
    localStorage.setItem('ottokode_pending_sync', JSON.stringify(pendingSync));
  }

  /**
   * Create a new project
   */
  async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'last_accessed'>): Promise<Project> {
    const project: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      file_tree: projectData.file_tree || []
    };

    await this.saveProject(project);
    return project;
  }

  /**
   * Get all files for a project
   */
  async getProjectFiles(projectId: string): Promise<FileNode[]> {
    const project = await this.loadProject(projectId);
    return project?.file_tree || [];
  }

  /**
   * Save a file (adapts FileNode to ProjectFile)
   */
  async saveFile(projectId: string, file: FileNode): Promise<void> {
    // Update the project's file tree
    const project = await this.loadProject(projectId);
    if (project) {
      const updatedFiles = this.updateFileInTree(project.file_tree, file);
      project.file_tree = updatedFiles;
      project.updated_at = new Date().toISOString();
      await this.saveProject(project);
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(projectId: string, fileId: string): Promise<void> {
    const project = await this.loadProject(projectId);
    if (project) {
      const updatedFiles = this.removeFileFromTree(project.file_tree, fileId);
      project.file_tree = updatedFiles;
      project.updated_at = new Date().toISOString();
      await this.saveProject(project);
    }
  }

  private updateFileInTree(files: FileNode[], updatedFile: FileNode): FileNode[] {
    return files.map(file => {
      if (file.id === updatedFile.id) {
        return updatedFile;
      }
      if (file.children) {
        return {
          ...file,
          children: this.updateFileInTree(file.children, updatedFile)
        };
      }
      return file;
    });
  }

  private removeFileFromTree(files: FileNode[], fileId: string): FileNode[] {
    return files.filter(file => {
      if (file.id === fileId) {
        return false;
      }
      if (file.children) {
        file.children = this.removeFileFromTree(file.children, fileId);
      }
      return true;
    });
  }
}

// Global instance
export const projectStorageService = new ProjectStorageService();