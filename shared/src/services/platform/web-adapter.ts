/**
 * Web platform adapter
 * Implements platform operations for browser environment
 */

import type { PlatformAdapter, SystemInfo } from './index';

export class WebAdapter implements PlatformAdapter {
  readonly isDesktop = false;
  readonly isWeb = true;
  readonly platform = 'web' as const;

  async readFile(path: string): Promise<string> {
    // For web, we'll use localStorage or IndexedDB as a mock file system
    // In a real implementation, this might connect to a backend API
    const content = localStorage.getItem(`file:${path}`);
    if (content === null) {
      throw new Error(`File not found: ${path}`);
    }
    return content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    localStorage.setItem(`file:${path}`, content);
  }

  async deleteFile(path: string): Promise<void> {
    localStorage.removeItem(`file:${path}`);
  }

  async listFiles(path: string): Promise<string[]> {
    const files: string[] = [];
    const prefix = `file:${path}`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        files.push(key.replace('file:', ''));
      }
    }

    return files;
  }

  async openUrl(url: string): Promise<void> {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async showNotification(title: string, message: string): Promise<void> {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body: message });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body: message });
        }
      }
    }

    // Fallback: console log or show in-app notification
    console.log(`Notification: ${title} - ${message}`);
  }

  async getSystemInfo(): Promise<SystemInfo> {
    return {
      platform: 'web',
      version: navigator.userAgent,
      arch: navigator.platform || 'unknown',
      locale: navigator.language || 'en-US',
    };
  }
}