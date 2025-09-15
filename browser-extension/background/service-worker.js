// AI IDE Browser Companion - Background Service Worker
// Handles desktop sync, context menus, and background operations

class SyncManager {
  constructor() {
    this.desktopPort = null;
    this.desktopUrl = 'ws://localhost:3001'; // WebSocket server in Tauri app
    this.reconnectInterval = 5000;
    this.maxReconnectAttempts = 10;
    this.reconnectAttempts = 0;
  }

  async connectToDesktop() {
    try {
      this.desktopPort = new WebSocket(this.desktopUrl);

      this.desktopPort.onopen = () => {
        console.log('Connected to AI IDE desktop app');
        this.reconnectAttempts = 0;
        this.sendMessage({ type: 'HANDSHAKE', source: 'browser-extension' });
      };

      this.desktopPort.onmessage = (event) => {
        this.handleDesktopMessage(JSON.parse(event.data));
      };

      this.desktopPort.onclose = () => {
        console.log('Disconnected from desktop app');
        this.scheduleReconnect();
      };

      this.desktopPort.onerror = (error) => {
        console.error('Desktop connection error:', error);
      };

    } catch (error) {
      console.error('Failed to connect to desktop:', error);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connectToDesktop(), this.reconnectInterval);
    }
  }

  sendMessage(message) {
    if (this.desktopPort && this.desktopPort.readyState === WebSocket.OPEN) {
      this.desktopPort.send(JSON.stringify(message));
    }
  }

  handleDesktopMessage(message) {
    switch (message.type) {
      case 'PROJECT_SYNC':
        this.syncProjects(message.data);
        break;
      case 'SETTINGS_SYNC':
        this.syncSettings(message.data);
        break;
      case 'CODE_ANALYSIS_RESULT':
        this.forwardToContentScript(message);
        break;
    }
  }

  async syncProjects(projects) {
    await chrome.storage.sync.set({ 'ai-ide-projects': projects });
  }

  async syncSettings(settings) {
    await chrome.storage.sync.set({ 'ai-ide-settings': settings });
  }

  forwardToContentScript(message) {
    // Forward message to active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }
}

// Global sync manager instance
const syncManager = new SyncManager();

// Extension lifecycle events
chrome.runtime.onStartup.addListener(() => {
  syncManager.connectToDesktop();
});

chrome.runtime.onInstalled.addListener(() => {
  // Create context menus
  createContextMenus();

  // Try to connect to desktop app
  syncManager.connectToDesktop();

  // Initialize storage
  initializeStorage();
});

function createContextMenus() {
  // Context menu for code analysis
  chrome.contextMenus.create({
    id: 'analyze-code',
    title: 'Analyze Code with AI',
    contexts: ['selection'],
    documentUrlPatterns: [
      'https://github.com/*',
      'https://stackoverflow.com/*',
      'https://developer.mozilla.org/*',
      'https://docs.github.com/*'
    ]
  });

  // Context menu for code capture
  chrome.contextMenus.create({
    id: 'capture-code',
    title: 'Capture to AI IDE',
    contexts: ['selection']
  });

  // Context menu for sending to desktop
  chrome.contextMenus.create({
    id: 'send-to-desktop',
    title: 'Send to Desktop AI IDE',
    contexts: ['page', 'selection']
  });
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'analyze-code':
      handleCodeAnalysis(info, tab);
      break;
    case 'capture-code':
      handleCodeCapture(info, tab);
      break;
    case 'send-to-desktop':
      handleSendToDesktop(info, tab);
      break;
  }
});

async function handleCodeAnalysis(info, tab) {
  const selectedText = info.selectionText;

  if (!selectedText) return;

  // Send to desktop for analysis
  syncManager.sendMessage({
    type: 'ANALYZE_CODE_REQUEST',
    data: {
      code: selectedText,
      url: tab.url,
      title: tab.title,
      timestamp: Date.now()
    }
  });

  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon48.png',
    title: 'AI IDE',
    message: 'Analyzing code with AI...'
  });
}

async function handleCodeCapture(info, tab) {
  const selectedText = info.selectionText;

  if (!selectedText) return;

  // Store captured code snippet
  const snippet = {
    code: selectedText,
    url: tab.url,
    title: tab.title,
    timestamp: Date.now(),
    id: generateId()
  };

  // Save to local storage
  const result = await chrome.storage.local.get('captured-snippets');
  const snippets = result['captured-snippets'] || [];
  snippets.unshift(snippet);

  // Keep only last 50 snippets
  if (snippets.length > 50) {
    snippets.splice(50);
  }

  await chrome.storage.local.set({ 'captured-snippets': snippets });

  // Send to desktop if connected
  syncManager.sendMessage({
    type: 'CODE_SNIPPET_CAPTURED',
    data: snippet
  });

  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon48.png',
    title: 'AI IDE',
    message: 'Code snippet captured!'
  });
}

async function handleSendToDesktop(info, tab) {
  const data = {
    type: 'SEND_TO_DESKTOP',
    url: tab.url,
    title: tab.title,
    selectedText: info.selectionText,
    timestamp: Date.now()
  };

  syncManager.sendMessage(data);

  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon48.png',
    title: 'AI IDE',
    message: 'Sent to desktop AI IDE'
  });
}

// Message handling from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_CAPTURED_SNIPPETS':
      handleGetCapturedSnippets(sendResponse);
      return true; // Keep message channel open for async response

    case 'SYNC_WITH_DESKTOP':
      syncManager.connectToDesktop();
      sendResponse({ success: true });
      break;

    case 'FORWARD_TO_DESKTOP':
      syncManager.sendMessage(message.data);
      sendResponse({ success: true });
      break;
  }
});

async function handleGetCapturedSnippets(sendResponse) {
  try {
    const result = await chrome.storage.local.get('captured-snippets');
    sendResponse({
      success: true,
      snippets: result['captured-snippets'] || []
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

async function initializeStorage() {
  // Initialize default settings
  const defaultSettings = {
    'ai-ide-settings': {
      autoConnect: true,
      showNotifications: true,
      defaultProvider: 'openai',
      theme: 'dark'
    }
  };

  // Only set if not already exists
  const existing = await chrome.storage.sync.get(Object.keys(defaultSettings));
  for (const [key, value] of Object.entries(defaultSettings)) {
    if (!existing[key]) {
      await chrome.storage.sync.set({ [key]: value });
    }
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
  // Handle long-lived connections
});