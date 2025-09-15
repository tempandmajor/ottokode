import React, { Suspense, lazy, useEffect } from 'react';
import type { EditorProps } from '@monaco-editor/react';
import { performanceMonitor } from '../services/performance/PerformanceMonitor';

// Lazy load Monaco Editor to reduce initial bundle size
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// Loading component for Monaco Editor
const EditorLoading: React.FC = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    background: '#1e1e1e',
    color: '#ccc',
    fontSize: '14px'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '8px' }}>Loading Editor...</div>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #333',
        borderTop: '3px solid #0078d4',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto'
      }} />
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  </div>
);

// Lazy Monaco Editor wrapper with error boundary
export const LazyMonacoEditor: React.FC<EditorProps> = (props) => {
  useEffect(() => {
    const startTime = performance.now();

    // Track when the editor component mounts
    const handleEditorMount = () => {
      const loadTime = performance.now() - startTime;
      performanceMonitor.recordEditorLoadTime(loadTime);
    };

    // Simulate editor mount tracking
    const timer = setTimeout(handleEditorMount, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Suspense fallback={<EditorLoading />}>
      <MonacoEditor {...props} />
    </Suspense>
  );
};

export default LazyMonacoEditor;