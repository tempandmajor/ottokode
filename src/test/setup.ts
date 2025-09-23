import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Mock Tauri APIs for testing
const mockTauri = {
  invoke: vi.fn(),
  listen: vi.fn(),
  emit: vi.fn(),
};

const mockTauriPlugins = {
  fs: {
    readDir: vi.fn(),
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
    exists: vi.fn(),
    createDir: vi.fn(),
    removeFile: vi.fn(),
    removeDir: vi.fn(),
    copyFile: vi.fn(),
    renameFile: vi.fn(),
  },
  dialog: {
    open: vi.fn(),
    save: vi.fn(),
    message: vi.fn(),
    confirm: vi.fn(),
  },
};

// Global mocks
vi.mock('@tauri-apps/api/core', () => mockTauri);
vi.mock('@tauri-apps/plugin-fs', () => mockTauriPlugins.fs);
vi.mock('@tauri-apps/plugin-dialog', () => mockTauriPlugins.dialog);
vi.mock('@tauri-apps/api/event', () => ({
  listen: mockTauri.listen,
  emit: mockTauri.emit,
}));

// Mock Monaco Editor
vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  editor: {
    create: vi.fn(() => ({
      dispose: vi.fn(),
      getValue: vi.fn(() => ''),
      setValue: vi.fn(),
      updateOptions: vi.fn(),
      onDidChangeModelContent: vi.fn(),
    })),
    createModel: vi.fn(),
    defineTheme: vi.fn(),
    setTheme: vi.fn(),
  },
  languages: {
    registerCompletionItemProvider: vi.fn(),
    CompletionItemKind: {},
    CompletionItemInsertTextRule: {},
  },
  Range: vi.fn(),
  Position: vi.fn(),
}));

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock online/offline events
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();

  // Reset localStorage mock
  (window.localStorage.getItem as any).mockReturnValue(null);

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