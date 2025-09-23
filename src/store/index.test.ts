import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';
import { renderHook, act } from '@testing-library/react';

describe('App Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().resetAllState();
  });

  describe('UI State Management', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.showSetupChecklist).toBe(true);
      expect(result.current.showTerminal).toBe(false);
      expect(result.current.showAIChat).toBe(false);
      expect(result.current.activeFile).toBe(null);
      expect(result.current.openFiles).toEqual([]);
    });

    it('should toggle panel visibility', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.togglePanel('showTerminal');
      });

      expect(result.current.showTerminal).toBe(true);

      act(() => {
        result.current.togglePanel('showTerminal');
      });

      expect(result.current.showTerminal).toBe(false);
    });

    it('should set panel visibility', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setPanel('showAIChat', true);
      });

      expect(result.current.showAIChat).toBe(true);

      act(() => {
        result.current.setPanel('showAIChat', false);
      });

      expect(result.current.showAIChat).toBe(false);
    });
  });

  describe('File Management', () => {
    const mockFile = {
      id: 'test-file-1',
      name: 'test.ts',
      path: '/test/test.ts',
      content: 'console.log("test");',
      language: 'typescript',
    };

    it('should open a file', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.openFile(mockFile);
      });

      expect(result.current.openFiles).toHaveLength(1);
      expect(result.current.openFiles[0]).toEqual(mockFile);
      expect(result.current.activeFile).toEqual(mockFile);
    });

    it('should not duplicate files when opening the same file twice', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.openFile(mockFile);
        result.current.openFile(mockFile);
      });

      expect(result.current.openFiles).toHaveLength(1);
    });

    it('should close a file', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.openFile(mockFile);
        result.current.closeFile(mockFile.id);
      });

      expect(result.current.openFiles).toHaveLength(0);
      expect(result.current.activeFile).toBe(null);
    });

    it('should update file content', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.openFile(mockFile);
        result.current.updateFileContent(mockFile.id, 'new content');
      });

      expect(result.current.activeFile?.content).toBe('new content');
      expect(result.current.openFiles[0].content).toBe('new content');
    });

    it('should mark file as dirty', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.openFile(mockFile);
        result.current.markFileDirty(mockFile.id, true);
      });

      expect(result.current.activeFile?.isDirty).toBe(true);
      expect(result.current.openFiles[0].isDirty).toBe(true);
    });
  });

  describe('Settings Management', () => {
    it('should toggle AI completion', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.aiCompletionEnabled).toBe(true);

      act(() => {
        result.current.setAiCompletionEnabled(false);
      });

      expect(result.current.aiCompletionEnabled).toBe(false);
    });

    it('should change theme', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('Workspace Management', () => {
    it('should set current workspace', () => {
      const { result } = renderHook(() => useAppStore());
      const workspace = '/home/user/project';

      act(() => {
        result.current.setCurrentWorkspace(workspace);
      });

      expect(result.current.currentWorkspace).toBe(workspace);
      expect(result.current.recentWorkspaces).toContain(workspace);
    });

    it('should limit recent workspaces to 10', () => {
      const { result } = renderHook(() => useAppStore());

      // Add 12 workspaces
      act(() => {
        for (let i = 0; i < 12; i++) {
          result.current.setCurrentWorkspace(`/workspace-${i}`);
        }
      });

      expect(result.current.recentWorkspaces).toHaveLength(10);
      expect(result.current.recentWorkspaces[0]).toBe('/workspace-11');
    });
  });

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Loading State', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setLoading(true, 'Loading files...');
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.loadingMessage).toBe('Loading files...');

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Network Status', () => {
    it('should update online status', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.isOnline).toBe(true);

      act(() => {
        result.current.setOnlineStatus(false);
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('should update last sync time', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.lastSyncTime).toBe(null);

      act(() => {
        result.current.updateLastSyncTime();
      });

      expect(result.current.lastSyncTime).toBeInstanceOf(Date);
    });
  });
});