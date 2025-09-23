import '@testing-library/jest-dom';

// Mock Tauri APIs for testing
const mockTauri = {
  invoke: jest.fn(),
  listen: jest.fn(),
  emit: jest.fn(),
};

const mockTauriPlugins = {
  fs: {
    readDir: jest.fn(),
    readTextFile: jest.fn(),
    writeTextFile: jest.fn(),
    exists: jest.fn(),
    createDir: jest.fn(),
    removeFile: jest.fn(),
    removeDir: jest.fn(),
    copyFile: jest.fn(),
    renameFile: jest.fn(),
  },
  dialog: {
    open: jest.fn(),
    save: jest.fn(),
    message: jest.fn(),
    confirm: jest.fn(),
  },
};

// Global mocks
jest.mock('@tauri-apps/api/core', () => mockTauri);
jest.mock('@tauri-apps/plugin-fs', () => mockTauriPlugins.fs);
// Skip mocking @tauri-apps/plugin-dialog as it's not installed
jest.mock('@tauri-apps/api/event', () => ({
  listen: mockTauri.listen,
  emit: mockTauri.emit,
}));

// Mock Monaco Editor
jest.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  editor: {
    create: jest.fn(() => ({
      dispose: jest.fn(),
      getValue: jest.fn(() => ''),
      setValue: jest.fn(),
      updateOptions: jest.fn(),
      onDidChangeModelContent: jest.fn(),
    })),
    createModel: jest.fn(),
    defineTheme: jest.fn(),
    setTheme: jest.fn(),
  },
  languages: {
    registerCompletionItemProvider: jest.fn(),
    CompletionItemKind: {},
    CompletionItemInsertTextRule: {},
  },
  Range: jest.fn(),
  Position: jest.fn(),
}));

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock online/offline events
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Reset localStorage mock
  (localStorageMock.getItem as jest.Mock).mockReturnValue(null);

  // Reset navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });
});

// Global test utilities
export const mockFile = {
  id: 'test-file',
  name: 'test.ts',
  path: '/test/test.ts',
  content: 'console.log("test");',
  language: 'typescript',
};

export const mockAuthUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  color: '#007bff',
};

export const mockAuthState = {
  user: mockAuthUser,
  session: null,
  loading: false,
  isAuthenticated: true,
};

// Test helper to simulate going offline
export const goOffline = () => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: false,
  });
  window.dispatchEvent(new Event('offline'));
};

// Test helper to simulate going online
export const goOnline = () => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });
  window.dispatchEvent(new Event('online'));
};