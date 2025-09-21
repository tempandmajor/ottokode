/**
 * Desktop platform adapter
 * Implements platform operations for Tauri desktop environment
 */

import type { PlatformAdapter, SystemInfo } from './index';

export class DesktopAdapter implements PlatformAdapter {
  readonly isDesktop = true;
  readonly isWeb = false;
  readonly platform = 'desktop' as const;

  async readFile(path: string): Promise<string> {
    try {
      const { readTextFile } = await import('@tauri-apps/plugin-fs');
      return await readTextFile(path);
    } catch (error) {
      throw new Error(`Failed to read file ${path}: ${error}`);
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    try {
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      await writeTextFile(path, content);
    } catch (error) {
      throw new Error(`Failed to write file ${path}: ${error}`);
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const { remove } = await import('@tauri-apps/plugin-fs');
      await remove(path);
    } catch (error) {
      throw new Error(`Failed to delete file ${path}: ${error}`);
    }
  }

  async listFiles(path: string): Promise<string[]> {
    try {
      const { readDir } = await import('@tauri-apps/plugin-fs');
      const entries = await readDir(path);
      return entries.map(entry => entry.name);
    } catch (error) {
      throw new Error(`Failed to list files in ${path}: ${error}`);
    }
  }

  async openUrl(url: string): Promise<void> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('plugin:opener|open', { path: url });
    } catch (error) {
      console.error('Failed to open URL:', error);
      // Fallback to window.open if available
      if (typeof window !== 'undefined') {
        window.open(url, '_blank');
      }
    }
  }

  async showNotification(title: string, message: string): Promise<void> {
    try {
      // Use Tauri's core invoke for notifications
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('plugin:notification|show', {
        title,
        body: message,
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
      // Fallback to browser notification
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body: message });
        }
      }
    }
  }

  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');

      const [platformName, osVersion, architecture, systemLocale] = await Promise.all([
        invoke('plugin:os|platform'),
        invoke('plugin:os|version'),
        invoke('plugin:os|arch'),
        invoke('plugin:os|locale').catch(() => 'en-US'),
      ]);

      return {
        platform: platformName as string,
        version: osVersion as string,
        arch: architecture as string,
        locale: systemLocale as string || 'en-US',
      };
    } catch (error) {
      console.error('Failed to get system info:', error);
      return {
        platform: 'desktop',
        version: 'unknown',
        arch: 'unknown',
        locale: 'en-US',
      };
    }
  }
}