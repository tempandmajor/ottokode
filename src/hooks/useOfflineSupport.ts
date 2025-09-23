import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store';

// Types for offline operations
export interface OfflineOperation {
  id: string;
  type: 'file_save' | 'ai_request' | 'git_operation' | 'settings_update';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

interface OfflineStorage {
  operations: OfflineOperation[];
  cachedData: Record<string, any>;
  lastSyncTime: Date | null;
}

// Offline support hook
export function useOfflineSupport() {
  const { isOnline, setOnlineStatus, updateLastSyncTime } = useAppStore(state => ({
    isOnline: state.isOnline,
    setOnlineStatus: state.setOnlineStatus,
    updateLastSyncTime: state.updateLastSyncTime,
  }));

  const [pendingOperations, setPendingOperations] = useState<OfflineOperation[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      console.log('📶 Back online - processing pending operations');
      // processOfflineQueue will be called after going online is detected
    };

    const handleOffline = () => {
      setOnlineStatus(false);
      console.log('📵 Gone offline - queueing operations');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setOnlineStatus(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load pending operations from storage
  useEffect(() => {
    loadOfflineOperations();
  }, []);

  // Process queue when going online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0 && !isProcessingQueue) {
      processOfflineQueue();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save operations to localStorage
  const saveOfflineOperations = useCallback((operations: OfflineOperation[]) => {
    try {
      const offlineData: OfflineStorage = {
        operations,
        cachedData: {},
        lastSyncTime: new Date(),
      };
      localStorage.setItem('ottokode_offline_operations', JSON.stringify(offlineData));
    } catch (error) {
      console.error('Failed to save offline operations:', error);
    }
  }, []);

  // Load operations from localStorage
  const loadOfflineOperations = useCallback(() => {
    try {
      const stored = localStorage.getItem('ottokode_offline_operations');
      if (stored) {
        const offlineData: OfflineStorage = JSON.parse(stored);
        setPendingOperations(offlineData.operations || []);
      }
    } catch (error) {
      console.error('Failed to load offline operations:', error);
    }
  }, []);

  // Add operation to offline queue
  const queueOfflineOperation = useCallback((
    type: OfflineOperation['type'],
    data: any,
    maxRetries: number = 3
  ) => {
    const operation: OfflineOperation = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries,
    };

    setPendingOperations(prev => {
      const updated = [...prev, operation];
      saveOfflineOperations(updated);
      return updated;
    });

    console.log(`📝 Queued offline operation: ${type}`);
    return operation.id;
  }, [saveOfflineOperations]);

  // Process offline queue when back online
  const processOfflineQueue = useCallback(async () => {
    if (!isOnline || isProcessingQueue || pendingOperations.length === 0) {
      return;
    }

    setIsProcessingQueue(true);

    try {
      const operationsToProcess = [...pendingOperations];
      const remainingOperations: OfflineOperation[] = [];

      for (const operation of operationsToProcess) {
        try {
          await processOperation(operation);
          console.log(`✅ Processed offline operation: ${operation.type}`);
        } catch (error) {
          console.error(`❌ Failed to process operation ${operation.type}:`, error);

          // Retry logic
          if (operation.retryCount < operation.maxRetries) {
            remainingOperations.push({
              ...operation,
              retryCount: operation.retryCount + 1,
            });
          } else {
            console.error(`💀 Max retries exceeded for operation: ${operation.type}`);
            // Optionally notify user about failed operation
          }
        }
      }

      setPendingOperations(remainingOperations);
      saveOfflineOperations(remainingOperations);

      if (remainingOperations.length === 0) {
        updateLastSyncTime();
        console.log('🎉 All offline operations processed successfully');
      }
    } finally {
      setIsProcessingQueue(false);
    }
  }, [isOnline, isProcessingQueue, pendingOperations, saveOfflineOperations, updateLastSyncTime]);

  // Process individual operation
  const processOperation = async (operation: OfflineOperation): Promise<void> => {
    switch (operation.type) {
      case 'file_save':
        return processFileSave(operation.data);
      case 'ai_request':
        return processAIRequest(operation.data);
      case 'git_operation':
        return processGitOperation(operation.data);
      case 'settings_update':
        return processSettingsUpdate(operation.data);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  };

  // Operation processors
  const processFileSave = async (data: any): Promise<void> => {
    const { FileSystemService } = await import('../services/filesystem/FileSystemService');
    const fs = new FileSystemService();
    await fs.writeFile(data.path, data.content);
  };

  const processAIRequest = async (data: any): Promise<void> => {
    // Re-queue AI requests for when online
    // This could involve calling the AI service again
    console.log('Re-processing AI request:', data);
  };

  const processGitOperation = async (data: any): Promise<void> => {
    // Re-process git operations
    console.log('Re-processing git operation:', data);
  };

  const processSettingsUpdate = async (data: any): Promise<void> => {
    // Re-sync settings
    console.log('Re-processing settings update:', data);
  };

  // Clear all pending operations
  const clearOfflineQueue = useCallback(() => {
    setPendingOperations([]);
    localStorage.removeItem('ottokode_offline_operations');
  }, []);

  // Manual sync trigger
  const forcSync = useCallback(() => {
    if (isOnline) {
      processOfflineQueue();
    }
  }, [isOnline, processOfflineQueue]);

  return {
    isOnline,
    pendingOperations,
    isProcessingQueue,
    queueOfflineOperation,
    processOfflineQueue,
    clearOfflineQueue,
    forcSync,
  };
}

// Cache management hook
export function useOfflineCache<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline } = useAppStore(state => ({ isOnline: state.isOnline }));

  // Load from cache
  useEffect(() => {
    const cached = localStorage.getItem(`cache_${key}`);
    if (cached) {
      try {
        setData(JSON.parse(cached));
      } catch (error) {
        console.error('Failed to parse cached data:', error);
      }
    }
  }, [key]);

  // Fetch data
  const fetchData = useCallback(async (force = false) => {
    if (!isOnline && data && !force) {
      return data; // Return cached data when offline
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);

      // Cache the result
      localStorage.setItem(`cache_${key}`, JSON.stringify(result));

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Fetch failed');
      setError(error);

      // Return cached data if available
      if (data) {
        console.warn('Using cached data due to fetch error:', error);
        return data;
      }

      throw error;
    } finally {
      setLoading(false);
    }
  }, [isOnline, data, fetcher, key]);

  return {
    data,
    loading,
    error,
    fetchData,
    isStale: !isOnline && !!data,
  };
}

// Service worker registration for PWA support
export function useServiceWorker() {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          setSwRegistration(registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('Service worker registration failed:', error);
        });
    }
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [swRegistration]);

  return {
    swRegistration,
    updateAvailable,
    updateServiceWorker,
  };
}