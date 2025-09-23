import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to report this to an error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // reportErrorToService(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>⚠️ Something went wrong</h2>
            <p>An unexpected error occurred. Please try refreshing the page.</p>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre className="error-stack">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button
                onClick={() => window.location.reload()}
                className="error-button primary"
              >
                Reload Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="error-button secondary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specific error boundary for different sections
export const FileSystemErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <div className="error-fallback filesystem-error">
        <h3>File System Error</h3>
        <p>Unable to access the file system. Please check permissions and try again.</p>
        <button onClick={() => window.location.reload()}>
          Reload Application
        </button>
      </div>
    }
    onError={(error, errorInfo) => {
      console.error('File system error:', error);
      // Track file system specific errors
    }}
  >
    {children}
  </ErrorBoundary>
);

export const AIServiceErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <div className="error-fallback ai-service-error">
        <h3>AI Service Error</h3>
        <p>The AI service is currently unavailable. Please check your API keys and try again.</p>
        <button onClick={() => window.location.reload()}>
          Reload Application
        </button>
      </div>
    }
    onError={(error, errorInfo) => {
      console.error('AI service error:', error);
      // Track AI service specific errors
    }}
  >
    {children}
  </ErrorBoundary>
);

export const EditorErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <div className="error-fallback editor-error">
        <h3>Editor Error</h3>
        <p>The code editor encountered an error. Your work is saved automatically.</p>
        <button onClick={() => window.location.reload()}>
          Reload Editor
        </button>
      </div>
    }
    onError={(error, errorInfo) => {
      console.error('Editor error:', error);
      // Track editor specific errors
    }}
  >
    {children}
  </ErrorBoundary>
);