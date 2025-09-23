import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineSupport } from './useOfflineSupport';
import { goOffline, goOnline } from '../test/setup';

describe('useOfflineSupport', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with online status', () => {
    const { result } = renderHook(() => useOfflineSupport());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.pendingOperations).toEqual([]);
    expect(result.current.isProcessingQueue).toBe(false);
  });

  it('should detect offline status', () => {
    const { result } = renderHook(() => useOfflineSupport());

    act(() => {
      goOffline();
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('should detect back online', () => {
    const { result } = renderHook(() => useOfflineSupport());

    act(() => {
      goOffline();
    });

    expect(result.current.isOnline).toBe(false);

    act(() => {
      goOnline();
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should queue operations when offline', () => {
    const { result } = renderHook(() => useOfflineSupport());

    act(() => {
      goOffline();
    });

    act(() => {
      result.current.queueOfflineOperation('file_save', {
        path: '/test.txt',
        content: 'test content',
      });
    });

    expect(result.current.pendingOperations).toHaveLength(1);
    expect(result.current.pendingOperations[0].type).toBe('file_save');
    expect(result.current.pendingOperations[0].data).toEqual({
      path: '/test.txt',
      content: 'test content',
    });
  });

  it('should persist operations to localStorage', () => {
    const { result } = renderHook(() => useOfflineSupport());

    act(() => {
      result.current.queueOfflineOperation('file_save', {
        path: '/test.txt',
        content: 'test content',
      });
    });

    const stored = localStorage.getItem('ottokode_offline_operations');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.operations).toHaveLength(1);
    expect(parsed.operations[0].type).toBe('file_save');
  });

  it('should load operations from localStorage on init', () => {
    // Pre-populate localStorage
    const operation = {
      id: 'test-op-1',
      type: 'file_save',
      data: { path: '/test.txt', content: 'test' },
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
    };

    localStorage.setItem('ottokode_offline_operations', JSON.stringify({
      operations: [operation],
      cachedData: {},
      lastSyncTime: new Date(),
    }));

    const { result } = renderHook(() => useOfflineSupport());

    expect(result.current.pendingOperations).toHaveLength(1);
    expect(result.current.pendingOperations[0].type).toBe('file_save');
  });

  it('should clear offline queue', () => {
    const { result } = renderHook(() => useOfflineSupport());

    act(() => {
      result.current.queueOfflineOperation('file_save', { path: '/test.txt' });
    });

    expect(result.current.pendingOperations).toHaveLength(1);

    act(() => {
      result.current.clearOfflineQueue();
    });

    expect(result.current.pendingOperations).toHaveLength(0);
    expect(localStorage.getItem('ottokode_offline_operations')).toBe(null);
  });

  it('should generate unique operation IDs', () => {
    const { result } = renderHook(() => useOfflineSupport());

    let id1: string;
    let id2: string;

    act(() => {
      id1 = result.current.queueOfflineOperation('file_save', { path: '/test1.txt' });
      id2 = result.current.queueOfflineOperation('file_save', { path: '/test2.txt' });
    });

    expect(id1).not.toBe(id2);
    expect(result.current.pendingOperations).toHaveLength(2);
  });
});