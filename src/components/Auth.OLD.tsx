import React, { useState, useEffect } from 'react';
import { authService, AuthState } from '../services/auth/AuthService';
import './Auth.css';

interface AuthProps {
  onClose?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onClose }) => {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthChange = (newState: AuthState) => {
      setAuthState(newState);
      if (newState.user && onClose) {
        onClose();
      }
    };

    authService.on('authStateChanged', handleAuthChange);

    return () => {
      authService.off('authStateChanged', handleAuthChange);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signin') {
        const { error } = await authService.signIn(email, password);
        if (error) {
          setError(error.message);
        }
      } else if (mode === 'signup') {
        const { error } = await authService.signUp(email, password, name);
        if (error) {
          setError(error.message);
        } else {
          setMessage('Check your email for a confirmation link!');
        }
      } else if (mode === 'reset') {
        const { error } = await authService.resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setMessage('Password reset email sent!');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'discord') => {
    setLoading(true);
    setError(null);

    const { error } = await authService.signInWithOAuth(provider);
    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await authService.signOut();
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  if (authState.loading) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (authState.user) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h2>Welcome back!</h2>
          <div className="user-info">
            <div className="user-avatar" style={{ backgroundColor: authState.user.color }}>
              {authState.user.avatar_url ? (
                <img src={authState.user.avatar_url} alt="Avatar" />
              ) : (
                authState.user.name?.[0]?.toUpperCase() || authState.user.email[0].toUpperCase()
              )}
            </div>
            <div className="user-details">
              <div className="user-name">{authState.user.name || 'Anonymous'}</div>
              <div className="user-email">{authState.user.email}</div>
            </div>
          </div>
          <button onClick={handleSignOut} disabled={loading} className="auth-button secondary">
            {loading ? 'Signing out...' : 'Sign Out'}
          </button>
          {onClose && (
            <button onClick={onClose} className="auth-button">
              Continue to IDE
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>
          {mode === 'signin' && 'Sign In to AI IDE'}
          {mode === 'signup' && 'Create Your Account'}
          {mode === 'reset' && 'Reset Password'}
        </h2>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required={mode === 'signup'}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          {mode !== 'reset' && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Loading...' :
              mode === 'signin' ? 'Sign In' :
              mode === 'signup' ? 'Sign Up' :
              'Send Reset Email'
            }
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        {mode !== 'reset' && (
          <>
            <div className="divider">or</div>

            <div className="oauth-buttons">
              <button
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading}
                className="oauth-button google"
              >
                Continue with Google
              </button>
            </div>
          </>
        )}

        <div className="auth-links">
          {mode === 'signin' && (
            <>
              <button onClick={() => setMode('signup')} className="link-button">
                Need an account? Sign up
              </button>
              <button onClick={() => setMode('reset')} className="link-button">
                Forgot password?
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button onClick={() => setMode('signin')} className="link-button">
              Already have an account? Sign in
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => setMode('signin')} className="link-button">
              Back to sign in
            </button>
          )}
        </div>

        {onClose && (
          <div className="auth-links">
            <button onClick={onClose} className="link-button">
              Continue as guest
            </button>
          </div>
        )}
      </div>
    </div>
  );
};