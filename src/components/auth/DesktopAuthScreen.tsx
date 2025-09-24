import React, { useState, useEffect } from 'react';
import { desktopAuthHandler } from '../../services/auth/DesktopAuthHandler';
import { AuthUser } from '../../services/auth/AuthService';

interface DesktopAuthScreenProps {
  onClose?: () => void;
}

export const DesktopAuthScreen: React.FC<DesktopAuthScreenProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = desktopAuthHandler.on('authStateChanged', (state) => {
      setUser(state.user);
      setLoading(state.loading);
    });

    const unsubscribeSuccess = desktopAuthHandler.on('authSuccess', () => {
      setError(null);
      setLoading(false);
      if (onClose) onClose();
    });

    const unsubscribeError = desktopAuthHandler.on('authError', (err: Error) => {
      setError(err.message);
      setLoading(false);
    });

    // Get initial state
    const initialState = desktopAuthHandler.getAuthState();
    setUser(initialState.user);
    setLoading(initialState.loading);

    return () => {
      unsubscribe();
      unsubscribeSuccess();
      unsubscribeError();
    };
  }, [onClose]);

  const handleSignInViaBrowser = async () => {
    try {
      setLoading(true);
      setError(null);
      await desktopAuthHandler.signInViaBrowser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoading(false);
    }
  };

  const handleSignInWithToken = async () => {
    if (!token.trim()) {
      setError('Please enter an authentication token');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await desktopAuthHandler.signInWithToken(token.trim());

      if (!result.success) {
        setError(result.error || 'Token authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await desktopAuthHandler.signOut();
    setLoading(false);
  };

  const handleOpenDashboard = async () => {
    try {
      await desktopAuthHandler.openWebDashboard();
    } catch (err) {
      setError('Failed to open web dashboard');
    }
  };

  // If user is authenticated, show user info
  if (user) {
    return (
      <div className="desktop-auth-container">
        <div className="desktop-auth-screen authenticated">
          <div className="auth-header">
            <div className="ottokode-logo">
              <span className="logo-icon">⚡</span>
              <span className="logo-text">Ottokode</span>
            </div>
            <h2>Welcome back!</h2>
          </div>

          <div className="user-info">
            <div className="user-avatar" style={{ backgroundColor: user.color }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" />
              ) : (
                <span>{user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}</span>
              )}
            </div>
            <div className="user-details">
              <div className="user-name">{user.name || 'Anonymous'}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>

          <div className="auth-actions">
            <button onClick={handleOpenDashboard} className="btn btn-primary">
              Open Web Dashboard
            </button>
            <button onClick={handleSignOut} className="btn btn-secondary" disabled={loading}>
              {loading ? 'Signing out...' : 'Sign Out'}
            </button>
            {onClose && (
              <button onClick={onClose} className="btn btn-outline">
                Continue to IDE
              </button>
            )}
          </div>
        </div>

        <style jsx>{`
          .desktop-auth-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          .desktop-auth-screen {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            padding: 40px;
            width: 100%;
            max-width: 400px;
            text-align: center;
          }

          .auth-header {
            margin-bottom: 32px;
          }

          .ottokode-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
          }

          .logo-icon {
            font-size: 32px;
            margin-right: 8px;
          }

          .logo-text {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
          }

          .auth-header h2 {
            margin: 0;
            color: #111827;
            font-size: 24px;
            font-weight: 600;
          }

          .user-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 32px;
          }

          .user-avatar {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            color: white;
            font-weight: bold;
            font-size: 24px;
            overflow: hidden;
          }

          .user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .user-name {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 4px;
          }

          .user-email {
            font-size: 14px;
            color: #6B7280;
          }

          .auth-actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
        `}</style>
      </div>
    );
  }

  // Authentication screen for non-authenticated users
  return (
    <div className="desktop-auth-container">
      <div className="desktop-auth-screen">
        <div className="auth-header">
          <div className="ottokode-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">Ottokode</span>
          </div>
          <h2>Sign in to continue</h2>
          <p className="auth-subtitle">
            Use your web browser to sign in securely to your Ottokode account
          </p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="auth-actions">
          {!showTokenInput ? (
            <>
              <button
                onClick={handleSignInViaBrowser}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-content">
                    <span className="spinner"></span>
                    Opening browser...
                  </span>
                ) : (
                  <>
                    <span className="btn-icon">🌐</span>
                    Sign in with Browser
                  </>
                )}
              </button>

              <div className="divider">
                <span>or</span>
              </div>

              <button
                onClick={() => setShowTokenInput(true)}
                className="btn btn-outline"
                disabled={loading}
              >
                <span className="btn-icon">🔑</span>
                Sign in with Token
              </button>

              <div className="help-text">
                <p>
                  New to Ottokode? <button onClick={handleSignInViaBrowser} className="link-btn">Create an account</button>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="token-input-section">
                <label htmlFor="token">Authentication Token</label>
                <input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your authentication token"
                  className="token-input"
                />
                <div className="token-help">
                  <p>Get your token from the <button onClick={handleSignInViaBrowser} className="link-btn">web dashboard</button></p>
                </div>
              </div>

              <button
                onClick={handleSignInWithToken}
                className="btn btn-primary"
                disabled={loading || !token.trim()}
              >
                {loading ? (
                  <span className="loading-content">
                    <span className="spinner"></span>
                    Authenticating...
                  </span>
                ) : (
                  'Authenticate'
                )}
              </button>

              <button
                onClick={() => setShowTokenInput(false)}
                className="btn btn-outline"
                disabled={loading}
              >
                Back
              </button>
            </>
          )}
        </div>

        {onClose && (
          <div className="guest-access">
            <button onClick={onClose} className="link-btn">
              Continue as guest (limited features)
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .desktop-auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
        }

        .desktop-auth-screen {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 40px;
          width: 100%;
          max-width: 400px;
          text-align: center;
        }

        .auth-header {
          margin-bottom: 32px;
        }

        .ottokode-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .logo-icon {
          font-size: 32px;
          margin-right: 8px;
        }

        .logo-text {
          font-size: 24px;
          font-weight: bold;
          color: #4F46E5;
        }

        .auth-header h2 {
          margin: 0 0 8px 0;
          color: #111827;
          font-size: 24px;
          font-weight: 600;
        }

        .auth-subtitle {
          margin: 0;
          color: #6B7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .error-message {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .auth-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          gap: 8px;
          min-height: 44px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #4F46E5;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #4338CA;
        }

        .btn-secondary {
          background: #6B7280;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #4B5563;
        }

        .btn-outline {
          background: transparent;
          color: #4F46E5;
          border: 1px solid #D1D5DB;
        }

        .btn-outline:hover:not(:disabled) {
          background: #F9FAFB;
        }

        .btn-icon {
          font-size: 16px;
        }

        .loading-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 16px 0;
          color: #9CA3AF;
          font-size: 12px;
        }

        .divider:before,
        .divider:after {
          content: '';
          flex: 1;
          height: 1px;
          background: #E5E7EB;
        }

        .divider span {
          padding: 0 16px;
        }

        .token-input-section {
          text-align: left;
          margin-bottom: 16px;
        }

        .token-input-section label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .token-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .token-input:focus {
          outline: none;
          border-color: #4F46E5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .token-help {
          margin-top: 6px;
        }

        .token-help p {
          margin: 0;
          font-size: 12px;
          color: #6B7280;
        }

        .help-text {
          margin-top: 20px;
        }

        .help-text p {
          margin: 0;
          font-size: 14px;
          color: #6B7280;
        }

        .guest-access {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #E5E7EB;
        }

        .link-btn {
          background: none;
          border: none;
          color: #4F46E5;
          cursor: pointer;
          text-decoration: underline;
          font-size: inherit;
          padding: 0;
        }

        .link-btn:hover {
          color: #4338CA;
        }
      `}</style>
    </div>
  );
};

export default DesktopAuthScreen;