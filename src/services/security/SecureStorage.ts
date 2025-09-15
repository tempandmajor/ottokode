// Secure Storage Service - Encrypted local storage for sensitive data
import CryptoJS from 'crypto-js';

export interface SecureNote {
  id: string;
  title: string;
  content: string;
  type: 'api_key' | 'password' | 'config' | 'note' | 'url';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isEncrypted: boolean;
}

export class SecureStorage {
  private masterPassword: string | null = null;
  private isUnlocked: boolean = false;
  private storageKey = 'ai_ide_secure_storage';
  private saltKey = 'ai_ide_storage_salt';

  constructor() {
    // Initialize salt if it doesn't exist
    if (!localStorage.getItem(this.saltKey)) {
      const salt = CryptoJS.lib.WordArray.random(256/8).toString();
      localStorage.setItem(this.saltKey, salt);
    }
  }

  // Master password management
  public async unlock(password: string): Promise<boolean> {
    try {
      // Derive key from password and salt
      const salt = localStorage.getItem(this.saltKey) || '';
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 10000
      }).toString();

      // Test decryption with a known value
      const testData = localStorage.getItem(this.storageKey + '_test');
      if (testData) {
        try {
          const decrypted = CryptoJS.AES.decrypt(testData, key).toString(CryptoJS.enc.Utf8);
          if (decrypted !== 'test_value') {
            return false;
          }
        } catch (error) {
          return false;
        }
      } else {
        // First time setup - create test value
        const encrypted = CryptoJS.AES.encrypt('test_value', key).toString();
        localStorage.setItem(this.storageKey + '_test', encrypted);
      }

      this.masterPassword = key;
      this.isUnlocked = true;
      return true;
    } catch (error) {
      console.error('Failed to unlock storage:', error);
      return false;
    }
  }

  public lock(): void {
    this.masterPassword = null;
    this.isUnlocked = false;
  }

  public isStorageUnlocked(): boolean {
    return this.isUnlocked && this.masterPassword !== null;
  }

  // Note management
  public async saveNote(note: SecureNote): Promise<void> {
    if (!this.isStorageUnlocked()) {
      throw new Error('Storage is locked');
    }

    try {
      const notes = await this.getAllNotes();
      const existingIndex = notes.findIndex(n => n.id === note.id);

      if (existingIndex >= 0) {
        notes[existingIndex] = { ...note, updatedAt: new Date() };
      } else {
        notes.push(note);
      }

      await this.saveEncryptedData(notes);
    } catch (error) {
      console.error('Failed to save note:', error);
      throw error;
    }
  }

  public async getAllNotes(): Promise<SecureNote[]> {
    if (!this.isStorageUnlocked()) {
      return [];
    }

    try {
      const encryptedData = localStorage.getItem(this.storageKey);
      if (!encryptedData) {
        return [];
      }

      const decryptedData = CryptoJS.AES.decrypt(encryptedData, this.masterPassword!).toString(CryptoJS.enc.Utf8);
      if (!decryptedData) {
        return [];
      }

      const notes = JSON.parse(decryptedData);
      // Convert date strings back to Date objects
      return notes.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to load notes:', error);
      return [];
    }
  }

  public async getNote(id: string): Promise<SecureNote | null> {
    const notes = await this.getAllNotes();
    return notes.find(note => note.id === id) || null;
  }

  public async deleteNote(id: string): Promise<void> {
    if (!this.isStorageUnlocked()) {
      throw new Error('Storage is locked');
    }

    try {
      const notes = await this.getAllNotes();
      const filteredNotes = notes.filter(note => note.id !== id);
      await this.saveEncryptedData(filteredNotes);
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }

  public async getNotesByType(type: SecureNote['type']): Promise<SecureNote[]> {
    const notes = await this.getAllNotes();
    return notes.filter(note => note.type === type);
  }

  public async searchNotes(query: string): Promise<SecureNote[]> {
    const notes = await this.getAllNotes();
    const lowercaseQuery = query.toLowerCase();

    return notes.filter(note =>
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.content.toLowerCase().includes(lowercaseQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Quick access methods for common operations
  public async saveApiKey(name: string, key: string, tags: string[] = []): Promise<string> {
    const note: SecureNote = {
      id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `API Key: ${name}`,
      content: key,
      type: 'api_key',
      tags: ['api', ...tags],
      createdAt: new Date(),
      updatedAt: new Date(),
      isEncrypted: true
    };

    await this.saveNote(note);
    return note.id;
  }

  public async savePassword(service: string, username: string, password: string, tags: string[] = []): Promise<string> {
    const note: SecureNote = {
      id: `pwd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${service} - ${username}`,
      content: `Username: ${username}\nPassword: ${password}`,
      type: 'password',
      tags: ['password', service.toLowerCase(), ...tags],
      createdAt: new Date(),
      updatedAt: new Date(),
      isEncrypted: true
    };

    await this.saveNote(note);
    return note.id;
  }

  public async saveConfig(name: string, config: string, tags: string[] = []): Promise<string> {
    const note: SecureNote = {
      id: `cfg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `Config: ${name}`,
      content: config,
      type: 'config',
      tags: ['config', ...tags],
      createdAt: new Date(),
      updatedAt: new Date(),
      isEncrypted: true
    };

    await this.saveNote(note);
    return note.id;
  }

  // Backup and restore
  public async exportBackup(): Promise<string> {
    if (!this.isStorageUnlocked()) {
      throw new Error('Storage is locked');
    }

    const notes = await this.getAllNotes();
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      notes: notes
    };

    return JSON.stringify(backup, null, 2);
  }

  public async importBackup(backupData: string): Promise<void> {
    if (!this.isStorageUnlocked()) {
      throw new Error('Storage is locked');
    }

    try {
      const backup = JSON.parse(backupData);
      if (!backup.notes || !Array.isArray(backup.notes)) {
        throw new Error('Invalid backup format');
      }

      // Validate notes structure
      const validNotes = backup.notes.filter((note: any) =>
        note.id && note.title && note.content && note.type
      );

      await this.saveEncryptedData(validNotes);
    } catch (error) {
      console.error('Failed to import backup:', error);
      throw error;
    }
  }

  // Storage management
  public async clearAllData(): Promise<void> {
    if (!this.isStorageUnlocked()) {
      throw new Error('Storage is locked');
    }

    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.storageKey + '_test');
  }

  public getStorageStats(): { noteCount: number; storageSize: number; isEncrypted: boolean } {
    const encryptedData = localStorage.getItem(this.storageKey);
    return {
      noteCount: 0, // Would need to decrypt to get actual count
      storageSize: encryptedData ? encryptedData.length : 0,
      isEncrypted: true
    };
  }

  // Private helper methods
  private async saveEncryptedData(notes: SecureNote[]): Promise<void> {
    if (!this.masterPassword) {
      throw new Error('No master password set');
    }

    try {
      const jsonData = JSON.stringify(notes);
      const encrypted = CryptoJS.AES.encrypt(jsonData, this.masterPassword).toString();
      localStorage.setItem(this.storageKey, encrypted);
    } catch (error) {
      console.error('Failed to encrypt and save data:', error);
      throw error;
    }
  }

  // Password strength validation
  public validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    if (password.length >= 12) score += 1;

    return {
      isValid: score >= 4,
      score: Math.min(score, 5),
      feedback
    };
  }
}

// Singleton instance
export const secureStorage = new SecureStorage();