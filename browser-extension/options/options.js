// AI IDE Browser Companion - Options Page Script
// Handles settings management and configuration

class SettingsManager {
  constructor() {
    this.defaultSettings = {
      // Connection settings
      autoConnect: true,
      desktopUrl: 'ws://localhost:3001',

      // AI Provider settings
      defaultProvider: 'openai',
      enableCodeAnalysis: true,
      autoDetectLanguage: true,

      // Capture settings
      maxSnippets: 50,
      autoSyncCaptures: true,
      showCaptureNotifications: true,

      // Interface settings
      theme: 'auto',
      showHoverActions: true,
      enableKeyboardShortcuts: true,

      // Advanced settings
      debugMode: false,
      excludedSites: '',
      customSelectors: ''
    };

    this.currentSettings = { ...this.defaultSettings };
    this.init();
  }

  async init() {
    // Load current settings
    await this.loadSettings();

    // Initialize UI elements
    this.initializeElements();

    // Set up event listeners
    this.setupEventListeners();

    // Populate form with current settings
    this.populateForm();

    // Check connection status
    this.checkConnectionStatus();

    // Calculate storage usage
    this.calculateStorageUsage();

    console.log('Settings page initialized');
  }

  initializeElements() {
    this.elements = {
      // Connection settings
      autoConnect: document.getElementById('autoConnect'),
      desktopUrl: document.getElementById('desktopUrl'),
      connectionIndicator: document.getElementById('connectionIndicator'),

      // AI Provider settings
      defaultProvider: document.getElementById('defaultProvider'),
      enableCodeAnalysis: document.getElementById('enableCodeAnalysis'),
      autoDetectLanguage: document.getElementById('autoDetectLanguage'),

      // Capture settings
      maxSnippets: document.getElementById('maxSnippets'),
      autoSyncCaptures: document.getElementById('autoSyncCaptures'),
      showCaptureNotifications: document.getElementById('showCaptureNotifications'),

      // Interface settings
      theme: document.getElementById('theme'),
      showHoverActions: document.getElementById('showHoverActions'),
      enableKeyboardShortcuts: document.getElementById('enableKeyboardShortcuts'),

      // Advanced settings
      debugMode: document.getElementById('debugMode'),
      excludedSites: document.getElementById('excludedSites'),
      customSelectors: document.getElementById('customSelectors'),

      // Data management
      storageInfo: document.getElementById('storageInfo'),
      clearSnippets: document.getElementById('clearSnippets'),
      exportSettings: document.getElementById('exportSettings'),
      importSettings: document.getElementById('importSettings'),
      importSettingsBtn: document.getElementById('importSettingsBtn'),

      // Footer actions
      resetSettings: document.getElementById('resetSettings'),
      saveSettings: document.getElementById('saveSettings'),

      // Toast
      toast: document.getElementById('toast')
    };
  }

  setupEventListeners() {
    // Auto-save on changes
    Object.keys(this.elements).forEach(key => {
      const element = this.elements[key];
      if (element && (element.type === 'checkbox' || element.type === 'text' || element.type === 'number' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA')) {
        element.addEventListener('change', () => {
          this.handleSettingChange(key, element);
        });
      }
    });

    // Special handlers for buttons
    this.elements.clearSnippets.addEventListener('click', () => {
      this.handleClearSnippets();
    });

    this.elements.exportSettings.addEventListener('click', () => {
      this.handleExportSettings();
    });

    this.elements.importSettingsBtn.addEventListener('click', () => {
      this.elements.importSettings.click();
    });

    this.elements.importSettings.addEventListener('change', (e) => {
      this.handleImportSettings(e);
    });

    this.elements.resetSettings.addEventListener('click', () => {
      this.handleResetSettings();
    });

    this.elements.saveSettings.addEventListener('click', () => {
      this.handleSaveSettings();
    });

    // Connection test
    this.elements.desktopUrl.addEventListener('blur', () => {
      this.testConnection();
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get('ai-ide-settings');
      const stored = result['ai-ide-settings'] || {};
      this.currentSettings = { ...this.defaultSettings, ...stored };
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showToast('Failed to load settings', 'error');
    }
  }

  async saveSettingsToStorage() {
    try {
      await chrome.storage.sync.set({
        'ai-ide-settings': this.currentSettings
      });
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showToast('Failed to save settings', 'error');
      return false;
    }
  }

  populateForm() {
    Object.keys(this.currentSettings).forEach(key => {
      const element = this.elements[key];
      if (!element) return;

      const value = this.currentSettings[key];

      if (element.type === 'checkbox') {
        element.checked = value;
      } else if (element.type === 'number') {
        element.value = value;
      } else if (element.tagName === 'SELECT') {
        element.value = value;
      } else if (element.tagName === 'TEXTAREA') {
        element.value = Array.isArray(value) ? value.join('\n') : value;
      } else {
        element.value = value;
      }
    });
  }

  handleSettingChange(key, element) {
    let value;

    if (element.type === 'checkbox') {
      value = element.checked;
    } else if (element.type === 'number') {
      value = parseInt(element.value) || this.defaultSettings[key];
    } else if (element.tagName === 'TEXTAREA') {
      value = element.value.split('\n').filter(line => line.trim());
    } else {
      value = element.value;
    }

    this.currentSettings[key] = value;

    // Auto-save settings
    this.saveSettingsToStorage();

    // Special handling for certain settings
    if (key === 'theme') {
      this.applyTheme(value);
    } else if (key === 'desktopUrl') {
      this.testConnection();
    }
  }

  async checkConnectionStatus() {
    const indicator = this.elements.connectionIndicator;
    const dot = indicator.querySelector('.status-dot');
    const text = indicator.querySelector('.status-text');

    try {
      // Send message to background script to check connection
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_CONNECTION'
      });

      if (response && response.connected) {
        dot.className = 'status-dot connected';
        text.textContent = 'Connected to Desktop';
      } else {
        dot.className = 'status-dot disconnected';
        text.textContent = 'Disconnected';
      }
    } catch (error) {
      dot.className = 'status-dot disconnected';
      text.textContent = 'Connection Error';
    }
  }

  async testConnection() {
    const url = this.elements.desktopUrl.value;

    if (!url) return;

    try {
      // Test WebSocket connection
      const ws = new WebSocket(url);

      ws.onopen = () => {
        this.showToast('Connection test successful', 'success');
        ws.close();
      };

      ws.onerror = () => {
        this.showToast('Connection test failed', 'error');
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          this.showToast('Connection test timed out', 'warning');
        }
      }, 5000);

    } catch (error) {
      this.showToast('Invalid connection URL', 'error');
    }
  }

  async calculateStorageUsage() {
    try {
      const local = await chrome.storage.local.get();
      const sync = await chrome.storage.sync.get();

      const localSize = JSON.stringify(local).length;
      const syncSize = JSON.stringify(sync).length;
      const totalSize = localSize + syncSize;

      // Chrome storage limits
      const localLimit = 5 * 1024 * 1024; // 5MB
      const syncLimit = 100 * 1024; // 100KB

      const storageInfo = this.elements.storageInfo;
      const percentage = Math.round((totalSize / localLimit) * 100);

      storageInfo.innerHTML = `
        <span class="storage-text">${this.formatBytes(totalSize)} used</span>
        <div class="storage-bar">
          <div class="storage-fill" style="width: ${Math.min(percentage, 100)}%"></div>
        </div>
      `;

      if (percentage > 80) {
        this.showToast('Storage usage is high', 'warning');
      }

    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
    }
  }

  async handleClearSnippets() {
    if (!confirm('Are you sure you want to clear all captured snippets? This action cannot be undone.')) {
      return;
    }

    try {
      await chrome.storage.local.remove('captured-snippets');
      this.showToast('All snippets cleared', 'success');
      this.calculateStorageUsage();
    } catch (error) {
      this.showToast('Failed to clear snippets', 'error');
    }
  }

  handleExportSettings() {
    const exportData = {
      version: '1.0.0',
      timestamp: Date.now(),
      settings: this.currentSettings
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-ide-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    this.showToast('Settings exported', 'success');
  }

  async handleImportSettings(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.settings) {
        throw new Error('Invalid settings file format');
      }

      // Validate settings
      const validSettings = {};
      Object.keys(this.defaultSettings).forEach(key => {
        if (importData.settings.hasOwnProperty(key)) {
          validSettings[key] = importData.settings[key];
        } else {
          validSettings[key] = this.defaultSettings[key];
        }
      });

      this.currentSettings = validSettings;
      await this.saveSettingsToStorage();
      this.populateForm();

      this.showToast('Settings imported successfully', 'success');

    } catch (error) {
      this.showToast('Failed to import settings: Invalid file', 'error');
    }

    // Clear the file input
    event.target.value = '';
  }

  async handleResetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }

    this.currentSettings = { ...this.defaultSettings };
    await this.saveSettingsToStorage();
    this.populateForm();

    this.showToast('Settings reset to defaults', 'success');
  }

  async handleSaveSettings() {
    const success = await this.saveSettingsToStorage();
    if (success) {
      this.showToast('Settings saved successfully', 'success');
    }
  }

  applyTheme(theme) {
    const body = document.body;

    switch (theme) {
      case 'light':
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        break;
      case 'dark':
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        break;
      case 'auto':
      default:
        body.classList.remove('light-theme', 'dark-theme');
        break;
    }
  }

  showToast(message, type = 'info') {
    const toast = this.elements.toast;
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SettingsManager();
});