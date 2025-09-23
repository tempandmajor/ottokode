import { authService, AuthService } from './AuthService';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const authState = authService.getAuthState();
    expect(authState.loading).toBe(true);
    expect(authState.user).toBe(null);
    expect(authState.isAuthenticated).toBe(false);
  });

  it('should return current user', () => {
    const user = authService.getCurrentUser();
    expect(user).toBe(null);
  });

  it('should check authentication status', () => {
    const isAuth = authService.isAuthenticated();
    expect(isAuth).toBe(false);
  });

  it('should have sign in method', () => {
    expect(typeof authService.signIn).toBe('function');
  });

  it('should have sign up method', () => {
    expect(typeof authService.signUp).toBe('function');
  });

  it('should have OAuth sign in method', () => {
    expect(typeof authService.signInWithOAuth).toBe('function');
  });

  it('should have sign out method', () => {
    expect(typeof authService.signOut).toBe('function');
  });

  it('should have update profile method', () => {
    expect(typeof authService.updateProfile).toBe('function');
  });
});