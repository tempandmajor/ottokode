// AI IDE Browser Companion - Popup Script
// Handles popup interactions and communication with background script

class PopupManager {
  constructor() {
    this.connectionStatus = null;
    this.currentTab = null;

    this.init();
  }

  async init() {
    // Get current tab
    await this.getCurrentTab();

    // Initialize UI elements
    this.initializeElements();

    // Set up event listeners
    this.setupEventListeners();

    // Load initial data
    await this.loadInitialData();

    // Check connection status
    this.checkConnectionStatus();

    console.log('AI IDE Popup initialized');
  }

  async getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tabs[0];
  }

  initializeElements() {
    this.elements = {
      connectionStatus: document.getElementById('connectionStatus'),
      analyzePageBtn: document.getElementById('analyzePageBtn'),
      captureSelectionBtn: document.getElementById('captureSelectionBtn'),
      openDesktopBtn: document.getElementById('openDesktopBtn'),
      syncProjectsBtn: document.getElementById('syncProjectsBtn'),
      capturesList: document.getElementById('capturesList'),
      projectsList: document.getElementById('projectsList'),
      settingsBtn: document.getElementById('settingsBtn')
    };
  }

  setupEventListeners() {
    // Quick action buttons
    this.elements.analyzePageBtn.addEventListener('click', () => {
      this.handleAnalyzePage();
    });

    this.elements.captureSelectionBtn.addEventListener('click', () => {
      this.handleCaptureSelection();
    });

    this.elements.openDesktopBtn.addEventListener('click', () => {
      this.handleOpenDesktop();
    });

    this.elements.syncProjectsBtn.addEventListener('click', () => {
      this.handleSyncProjects();
    });

    this.elements.settingsBtn.addEventListener('click', () => {
      this.handleOpenSettings();
    });
  }

  async loadInitialData() {
    // Load captured snippets
    await this.loadCapturedSnippets();

    // Load synced projects
    await this.loadSyncedProjects();

    // Update button states based on current page
    this.updateButtonStates();
  }

  async loadCapturedSnippets() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CAPTURED_SNIPPETS'
      });

      if (response.success) {
        this.displayCapturedSnippets(response.snippets);
      } else {
        console.error('Failed to load snippets:', response.error);
      }
    } catch (error) {
      console.error('Error loading snippets:', error);
    }
  }

  async loadSyncedProjects() {
    try {
      const result = await chrome.storage.sync.get('ai-ide-projects');
      const projects = result['ai-ide-projects'] || [];
      this.displaySyncedProjects(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }

  displayCapturedSnippets(snippets) {
    const container = this.elements.capturesList;

    if (snippets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📝</span>
          <p>No code captures yet</p>
          <small>Select code on any page and capture it</small>
        </div>
      `;
      return;
    }

    container.innerHTML = snippets
      .slice(0, 5) // Show only recent 5
      .map(snippet => this.createSnippetElement(snippet))
      .join('');

    // Add click listeners
    container.querySelectorAll('.capture-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.handleSnippetClick(snippets[index]);
      });
    });
  }

  displaySyncedProjects(projects) {
    const container = this.elements.projectsList;

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📁</span>
          <p>No projects synced</p>
          <small>Connect to desktop app to see projects</small>
        </div>
      `;
      return;
    }

    container.innerHTML = projects
      .slice(0, 3) // Show only recent 3
      .map(project => this.createProjectElement(project))
      .join('');

    // Add click listeners
    container.querySelectorAll('.project-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.handleProjectClick(projects[index]);
      });
    });
  }

  createSnippetElement(snippet) {
    const timeAgo = this.formatTimeAgo(snippet.timestamp);
    const language = snippet.element?.language || 'code';

    return `
      <div class="capture-item" data-id="${snippet.id}">
        <div class="capture-title">${this.truncateText(snippet.title, 30)}</div>
        <div class="capture-url">${this.truncateText(snippet.url, 40)}</div>
        <div class="capture-timestamp">${timeAgo}</div>
        <div class="capture-language">${language}</div>
      </div>
    `;
  }

  createProjectElement(project) {
    return `
      <div class="project-item" data-name="${project.name}">
        <div class="project-name">${project.name}</div>
        <div class="project-path">${this.truncateText(project.path, 35)}</div>
      </div>
    `;
  }

  async handleAnalyzePage() {
    this.setButtonLoading(this.elements.analyzePageBtn, true);

    try {
      // Execute script to get page content
      const results = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        function: this.getPageCodeBlocks
      });

      const codeBlocks = results[0]?.result || [];

      if (codeBlocks.length === 0) {
        this.showMessage('No code blocks found on this page', 'info');
        return;
      }

      // Send analysis request
      chrome.runtime.sendMessage({
        type: 'FORWARD_TO_DESKTOP',
        data: {
          type: 'ANALYZE_PAGE_REQUEST',
          data: {
            url: this.currentTab.url,
            title: this.currentTab.title,
            codeBlocks: codeBlocks,
            timestamp: Date.now()
          }
        }
      });

      this.showMessage('Analyzing page code with AI...', 'info');

    } catch (error) {
      console.error('Error analyzing page:', error);
      this.showMessage('Failed to analyze page', 'error');
    } finally {
      this.setButtonLoading(this.elements.analyzePageBtn, false);
    }
  }

  async handleCaptureSelection() {
    this.setButtonLoading(this.elements.captureSelectionBtn, true);

    try {
      // Execute script to get selected text
      const results = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        function: () => window.getSelection().toString()
      });

      const selectedText = results[0]?.result;

      if (!selectedText || selectedText.length < 5) {
        this.showMessage('Please select some code first', 'info');
        return;
      }

      // Send capture request
      chrome.runtime.sendMessage({
        type: 'FORWARD_TO_DESKTOP',
        data: {
          type: 'CODE_SNIPPET_CAPTURED',
          data: {
            code: selectedText,
            url: this.currentTab.url,
            title: this.currentTab.title,
            timestamp: Date.now(),
            id: this.generateId()
          }
        }
      });

      this.showMessage('Code selection captured!', 'success');

      // Reload snippets
      setTimeout(() => this.loadCapturedSnippets(), 500);

    } catch (error) {
      console.error('Error capturing selection:', error);
      this.showMessage('Failed to capture selection', 'error');
    } finally {
      this.setButtonLoading(this.elements.captureSelectionBtn, false);
    }
  }

  async handleOpenDesktop() {
    // Send message to background script to open desktop app
    chrome.runtime.sendMessage({
      type: 'FORWARD_TO_DESKTOP',
      data: {
        type: 'OPEN_DESKTOP_REQUEST',
        data: {
          url: this.currentTab.url,
          title: this.currentTab.title,
          timestamp: Date.now()
        }
      }
    });

    this.showMessage('Opening desktop AI IDE...', 'info');
  }

  async handleSyncProjects() {
    this.setButtonLoading(this.elements.syncProjectsBtn, true);

    try {
      // Request sync from background script
      const response = await chrome.runtime.sendMessage({
        type: 'SYNC_WITH_DESKTOP'
      });

      if (response.success) {
        this.showMessage('Syncing with desktop...', 'info');

        // Reload projects after a delay
        setTimeout(() => this.loadSyncedProjects(), 1000);
      } else {
        this.showMessage('Failed to connect to desktop', 'error');
      }

    } catch (error) {
      console.error('Error syncing projects:', error);
      this.showMessage('Sync failed', 'error');
    } finally {
      this.setButtonLoading(this.elements.syncProjectsBtn, false);
    }
  }

  handleOpenSettings() {
    chrome.runtime.openOptionsPage();
  }

  handleSnippetClick(snippet) {
    // Copy snippet code to clipboard
    navigator.clipboard.writeText(snippet.code).then(() => {
      this.showMessage('Code copied to clipboard!', 'success');
    }).catch(() => {
      this.showMessage('Failed to copy code', 'error');
    });
  }

  handleProjectClick(project) {
    // Send message to open project in desktop
    chrome.runtime.sendMessage({
      type: 'FORWARD_TO_DESKTOP',
      data: {
        type: 'OPEN_PROJECT_REQUEST',
        data: {
          projectName: project.name,
          projectPath: project.path,
          timestamp: Date.now()
        }
      }
    });

    this.showMessage('Opening project in desktop...', 'info');
  }

  checkConnectionStatus() {
    // Check if desktop app is connected
    chrome.runtime.sendMessage({
      type: 'CHECK_CONNECTION'
    }, (response) => {
      this.updateConnectionStatus(response?.connected || false);
    });
  }

  updateConnectionStatus(connected) {
    const statusElement = this.elements.connectionStatus;
    const dot = statusElement.querySelector('.status-dot');
    const text = statusElement.querySelector('.status-text');

    if (connected) {
      dot.className = 'status-dot connected';
      text.textContent = 'Connected';
    } else {
      dot.className = 'status-dot disconnected';
      text.textContent = 'Disconnected';
    }

    this.connectionStatus = connected;
  }

  updateButtonStates() {
    const isCodeSite = this.isCodeRelatedSite(this.currentTab.url);

    // Enable/disable buttons based on current page
    if (!isCodeSite) {
      this.elements.analyzePageBtn.disabled = true;
      this.elements.analyzePageBtn.title = 'Not available on this site';
    }
  }

  isCodeRelatedSite(url) {
    const codeHosts = [
      'github.com',
      'gitlab.com',
      'bitbucket.org',
      'stackoverflow.com',
      'developer.mozilla.org',
      'docs.github.com',
      'codepen.io',
      'jsfiddle.net',
      'codesandbox.io'
    ];

    return codeHosts.some(host => url.includes(host));
  }

  setButtonLoading(button, loading) {
    if (loading) {
      button.disabled = true;
      button.classList.add('loading');
    } else {
      button.disabled = false;
      button.classList.remove('loading');
    }
  }

  showMessage(text, type = 'info') {
    // Remove existing message
    const existing = document.querySelector('.message');
    if (existing) {
      existing.remove();
    }

    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;

    // Insert at top of popup
    const container = document.querySelector('.popup-container');
    container.insertBefore(message, container.firstChild);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 3000);
  }

  // Helper function for executing in page context
  getPageCodeBlocks() {
    const selectors = [
      'pre code',
      'pre',
      '.highlight',
      '.language-*',
      '[class*="language-"]',
      '.blob-code'
    ];

    const blocks = [];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent || '';
        if (text.length > 20) { // Only significant code blocks
          blocks.push({
            text: text.substring(0, 1000), // Limit size
            language: this.detectLanguage(el),
            lineCount: text.split('\n').length
          });
        }
      });
    });

    return blocks;
  }

  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});