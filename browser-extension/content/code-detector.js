// AI IDE Browser Companion - Code Detection Content Script
// Detects code blocks on web pages and provides AI assistance overlay

class CodeDetector {
  constructor() {
    this.codeBlocks = new Set();
    this.observer = null;
    this.aiOverlay = null;
    this.settings = null;

    this.init();
  }

  async init() {
    // Load settings
    await this.loadSettings();

    // Start detecting code blocks
    this.detectCodeBlocks();

    // Set up mutation observer for dynamically loaded content
    this.setupMutationObserver();

    // Create AI overlay
    this.createAIOverlay();

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });

    console.log('AI IDE Code Detector initialized');
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get('ai-ide-settings');
      this.settings = result['ai-ide-settings'] || {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = {};
    }
  }

  detectCodeBlocks() {
    // Common code block selectors
    const codeSelectors = [
      'pre code',           // Standard code blocks
      'pre',                // Plain pre blocks
      '.highlight',         // GitHub syntax highlighting
      '.codehilite',        // Python docs
      '.language-*',        // Prism.js
      '[class*="language-"]', // Various language classes
      '.source-code',       // Generic source code
      '.code-block',        // Generic code blocks
      'code',               // Inline code (for larger blocks)
      '.blob-code',         // GitHub file view
      '.ace_editor',        // ACE editor
      '.CodeMirror',        // CodeMirror editor
      '.monaco-editor'      // Monaco editor
    ];

    codeSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => this.processCodeBlock(element));
    });

    // Special handling for specific sites
    this.handleSpecialSites();
  }

  processCodeBlock(element) {
    // Skip if already processed
    if (element.dataset.aiIdeProcessed) return;

    // Skip very small code blocks (likely inline)
    const text = element.textContent || '';
    if (text.length < 10) return;

    // Mark as processed
    element.dataset.aiIdeProcessed = 'true';
    this.codeBlocks.add(element);

    // Add hover functionality
    this.addCodeBlockInteraction(element);
  }

  addCodeBlockInteraction(element) {
    let hoverTimeout;

    element.addEventListener('mouseenter', () => {
      hoverTimeout = setTimeout(() => {
        this.showCodeActions(element);
      }, 500); // Show actions after 500ms hover
    });

    element.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimeout);
      this.hideCodeActions();
    });

    // Add selection handler
    element.addEventListener('mouseup', () => {
      const selection = window.getSelection();
      if (selection.toString().length > 0) {
        this.showSelectionActions(element, selection);
      }
    });
  }

  showCodeActions(element) {
    // Remove existing actions
    this.hideCodeActions();

    // Create actions container
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'ai-ide-code-actions';
    actionsContainer.innerHTML = `
      <div class="ai-ide-actions-tooltip">
        <button class="ai-ide-action-btn" data-action="analyze">
          🤖 Analyze
        </button>
        <button class="ai-ide-action-btn" data-action="capture">
          📋 Capture
        </button>
        <button class="ai-ide-action-btn" data-action="send">
          🚀 Send to IDE
        </button>
      </div>
    `;

    // Position the actions
    const rect = element.getBoundingClientRect();
    actionsContainer.style.position = 'fixed';
    actionsContainer.style.top = `${rect.top - 40}px`;
    actionsContainer.style.left = `${rect.left}px`;
    actionsContainer.style.zIndex = '10000';

    // Add event listeners
    actionsContainer.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleCodeAction(action, element);
      }
    });

    document.body.appendChild(actionsContainer);
  }

  hideCodeActions() {
    const existing = document.querySelector('.ai-ide-code-actions');
    if (existing) {
      existing.remove();
    }
  }

  showSelectionActions(element, selection) {
    const selectedText = selection.toString();
    if (selectedText.length < 5) return;

    // Create floating action for selection
    const actionBtn = document.createElement('div');
    actionBtn.className = 'ai-ide-selection-action';
    actionBtn.innerHTML = '🤖 Analyze Selection';

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    actionBtn.style.position = 'fixed';
    actionBtn.style.top = `${rect.bottom + 5}px`;
    actionBtn.style.left = `${rect.left}px`;
    actionBtn.style.zIndex = '10001';

    actionBtn.addEventListener('click', () => {
      this.analyzeCodeSelection(selectedText, element);
      actionBtn.remove();
    });

    document.body.appendChild(actionBtn);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (actionBtn.parentNode) {
        actionBtn.remove();
      }
    }, 3000);
  }

  async handleCodeAction(action, element) {
    const code = element.textContent || '';

    switch (action) {
      case 'analyze':
        await this.analyzeCode(code, element);
        break;
      case 'capture':
        await this.captureCode(code, element);
        break;
      case 'send':
        await this.sendToDesktop(code, element);
        break;
    }

    this.hideCodeActions();
  }

  async analyzeCode(code, element) {
    // Send analysis request to background script
    chrome.runtime.sendMessage({
      type: 'FORWARD_TO_DESKTOP',
      data: {
        type: 'ANALYZE_CODE_REQUEST',
        data: {
          code: code,
          url: window.location.href,
          title: document.title,
          element: this.getElementInfo(element),
          timestamp: Date.now()
        }
      }
    });

    this.showNotification('Analyzing code with AI...', 'info');
  }

  async captureCode(code, element) {
    // Send capture request to background script
    chrome.runtime.sendMessage({
      type: 'FORWARD_TO_DESKTOP',
      data: {
        type: 'CODE_SNIPPET_CAPTURED',
        data: {
          code: code,
          url: window.location.href,
          title: document.title,
          element: this.getElementInfo(element),
          timestamp: Date.now(),
          id: this.generateId()
        }
      }
    });

    this.showNotification('Code captured!', 'success');
  }

  async sendToDesktop(code, element) {
    chrome.runtime.sendMessage({
      type: 'FORWARD_TO_DESKTOP',
      data: {
        type: 'SEND_TO_DESKTOP',
        data: {
          code: code,
          url: window.location.href,
          title: document.title,
          element: this.getElementInfo(element),
          timestamp: Date.now()
        }
      }
    });

    this.showNotification('Sent to AI IDE!', 'success');
  }

  async analyzeCodeSelection(selectedText, element) {
    await this.analyzeCode(selectedText, element);
  }

  getElementInfo(element) {
    return {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      language: this.detectLanguage(element),
      lineCount: (element.textContent || '').split('\n').length
    };
  }

  detectLanguage(element) {
    // Try to detect programming language from class names
    const classNames = element.className || '';
    const languagePatterns = [
      /language-(\w+)/i,
      /lang-(\w+)/i,
      /highlight-(\w+)/i,
      /(\w+)-code/i
    ];

    for (const pattern of languagePatterns) {
      const match = classNames.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    // Try to detect from parent elements
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const parentClasses = parent.className || '';
      for (const pattern of languagePatterns) {
        const match = parentClasses.match(pattern);
        if (match) {
          return match[1].toLowerCase();
        }
      }
      parent = parent.parentElement;
    }

    return 'unknown';
  }

  handleSpecialSites() {
    const hostname = window.location.hostname;

    switch (hostname) {
      case 'github.com':
        this.handleGitHub();
        break;
      case 'stackoverflow.com':
        this.handleStackOverflow();
        break;
      case 'developer.mozilla.org':
        this.handleMDN();
        break;
    }
  }

  handleGitHub() {
    // Special handling for GitHub file views
    const fileContent = document.querySelector('.blob-wrapper');
    if (fileContent) {
      this.processCodeBlock(fileContent);
    }

    // Handle GitHub Gists
    const gistFiles = document.querySelectorAll('.gist-file');
    gistFiles.forEach(file => {
      const codeElement = file.querySelector('.file-data');
      if (codeElement) {
        this.processCodeBlock(codeElement);
      }
    });
  }

  handleStackOverflow() {
    // Stack Overflow code blocks
    const codeBlocks = document.querySelectorAll('.post-text pre code, .answer pre code');
    codeBlocks.forEach(block => this.processCodeBlock(block));
  }

  handleMDN() {
    // MDN code examples
    const codeExamples = document.querySelectorAll('.code-example pre');
    codeExamples.forEach(example => this.processCodeBlock(example));
  }

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      let hasNewContent = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          hasNewContent = true;
        }
      });

      if (hasNewContent) {
        // Debounce the detection to avoid excessive processing
        clearTimeout(this.detectionTimeout);
        this.detectionTimeout = setTimeout(() => {
          this.detectCodeBlocks();
        }, 500);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  createAIOverlay() {
    // This will be implemented in a separate file for the AI assistant overlay
    // For now, just inject the CSS
    this.injectCSS();
  }

  injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .ai-ide-code-actions {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
      }

      .ai-ide-actions-tooltip {
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px;
        border-radius: 6px;
        display: flex;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
      }

      .ai-ide-action-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s ease;
      }

      .ai-ide-action-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }

      .ai-ide-selection-action {
        background: #007acc;
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .ai-ide-selection-action:hover {
        background: #005a9e;
      }

      .ai-ide-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #333;
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10002;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 300px;
        animation: slideIn 0.3s ease;
      }

      .ai-ide-notification.success {
        background: #d4edda;
        color: #155724;
        border-left: 4px solid #28a745;
      }

      .ai-ide-notification.info {
        background: #d1ecf1;
        color: #0c5460;
        border-left: 4px solid #17a2b8;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.ai-ide-notification');
    if (existing) {
      existing.remove();
    }

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `ai-ide-notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 3000);
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'CODE_ANALYSIS_RESULT':
        this.showAnalysisResult(message.data);
        break;
    }
  }

  showAnalysisResult(analysisData) {
    // Show AI analysis result in a modal or overlay
    this.showNotification('Code analysis complete! Check the desktop app for results.', 'success');
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Initialize the code detector when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CodeDetector();
  });
} else {
  new CodeDetector();
}