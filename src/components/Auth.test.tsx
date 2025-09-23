import { render, screen } from '@testing-library/react';
import { Auth } from './Auth';

// Mock the authService
jest.mock('../services/auth/AuthService', () => ({
  authService: {
    getAuthState: jest.fn(() => ({
      user: null,
      session: null,
      loading: false,
      isAuthenticated: false,
    })),
    on: jest.fn(),
    off: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    resetPassword: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
  },
}));

describe('Auth Component', () => {
  it('should render sign in form when user is not authenticated', () => {
    render(<Auth />);

    expect(screen.getByText('Sign In to AI IDE')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should have OAuth button for Google', () => {
    render(<Auth />);

    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('should have links to switch between modes', () => {
    render(<Auth />);

    expect(screen.getByText('Need an account? Sign up')).toBeInTheDocument();
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });
});