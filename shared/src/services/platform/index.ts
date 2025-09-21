/**
 * Platform abstraction layer
 * Provides unified interface for web and desktop operations
 */

export interface PlatformAdapter {
  readonly isDesktop: boolean;
  readonly isWeb: boolean;
  readonly platform: 'web' | 'desktop';

  // File system operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  listFiles(path: string): Promise<string[]>;

  // System operations
  openUrl(url: string): Promise<void>;
  showNotification(title: string, message: string): Promise<void>;
  getSystemInfo(): Promise<SystemInfo>;
}

export interface SystemInfo {
  platform: string;
  version: string;
  arch: string;
  locale: string;
}

export class PlatformManager {
  private static instance: PlatformManager;
  private adapter: PlatformAdapter | null = null;

  static getInstance(): PlatformManager {
    if (!this.instance) {
      this.instance = new PlatformManager();
    }
    return this.instance;
  }

  async getAdapter(): Promise<PlatformAdapter> {
    if (!this.adapter) {
      this.adapter = await this.createAdapter();
    }
    return this.adapter;
  }

  private async createAdapter(): Promise<PlatformAdapter> {
    // Check if we're in Tauri (desktop) environment
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      const { DesktopAdapter } = await import('./desktop-adapter');
      return new DesktopAdapter();
    } else {
      const { WebAdapter } = await import('./web-adapter');
      return new WebAdapter();
    }
  }
}

// Export singleton instance
export const platform = PlatformManager.getInstance();