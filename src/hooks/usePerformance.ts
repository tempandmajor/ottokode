import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Debounce hook for performance optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for performance optimization
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// Memoized callback with dependency array optimization
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
): T {
  return useCallback(callback, dependencies);
}

// Performance measurement hook
export function usePerformanceMonitor(name: string) {
  const startTime = useRef<number>();

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      return duration;
    }
    return 0;
  }, [name]);

  return { start, end };
}

// Virtual scrolling optimization
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    startIndex,
    endIndex,
  };
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}

// Memory usage monitoring hook
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory);
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

// Optimized setState for large objects
export function useOptimizedState<T extends object>(initialState: T) {
  const [state, setState] = useState(initialState);

  const updateState = useCallback((updates: Partial<T>) => {
    setState(prevState => {
      // Only update if there are actual changes
      const hasChanges = Object.keys(updates).some(
        key => (updates as any)[key] !== (prevState as any)[key]
      );

      if (!hasChanges) {
        return prevState;
      }

      return { ...prevState, ...updates };
    });
  }, []);

  return [state, updateState] as const;
}

// File change detection with debouncing
export function useFileChangeDetection(
  content: string,
  onContentChange: (content: string) => void,
  debounceMs: number = 500
) {
  const debouncedContent = useDebounce(content, debounceMs);

  useEffect(() => {
    if (debouncedContent !== content) {
      onContentChange(debouncedContent);
    }
  }, [debouncedContent, onContentChange]);
}

// Efficient search with memoization
export function useSearch<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  filterFn?: (item: T, searchTerm: string) => boolean
) {
  return useMemo(() => {
    if (!searchTerm.trim()) {
      return items;
    }

    const lowercaseSearch = searchTerm.toLowerCase();

    return items.filter(item => {
      if (filterFn) {
        return filterFn(item, lowercaseSearch);
      }

      return searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowercaseSearch);
        }
        return false;
      });
    });
  }, [items, searchTerm, searchFields, filterFn]);
}

// Batch operations for better performance
export function useBatchedUpdates<T>() {
  const [updates, setUpdates] = useState<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const addUpdate = useCallback((update: T) => {
    setUpdates(prev => [...prev, update]);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setUpdates([]);
    }, 100); // Batch updates for 100ms
  }, []);

  const flushUpdates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    const currentUpdates = updates;
    setUpdates([]);
    return currentUpdates;
  }, [updates]);

  return { updates, addUpdate, flushUpdates };
}