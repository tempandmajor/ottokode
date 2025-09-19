'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { DesktopAuth } from './desktop-auth';
import { DesktopWelcome } from './desktop-welcome';
import { UserAgreementWrapper } from '@/components/legal/user-agreement-wrapper';
import { isTauriApp } from '@/lib/platform-detection';

export function DesktopApp() {
  const { user, loading } = useAuth();
  const [isDesktop, setIsDesktop] = useState(false);
  const [currentView, setCurrentView] = useState<'loading' | 'auth' | 'welcome'>('loading');

  useEffect(() => {
    const checkPlatform = () => {
      const desktop = isTauriApp();
      setIsDesktop(desktop);

      // Determine which view to show based on auth state (routing handled elsewhere)
      if (loading) {
        setCurrentView('loading');
      } else if (!user) {
        setCurrentView('auth');
      } else {
        setCurrentView('welcome');
      }
    };

    checkPlatform();
  }, [user, loading]);

  useEffect(() => {
    // Update view when auth state changes
    if (!loading) {
      setCurrentView(user ? 'welcome' : 'auth');
    }
  }, [user, loading]);

  // Loading state
  if (currentView === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent mb-2">
            Ottokode
          </h2>
          <p className="text-muted-foreground">Initializing your AI-powered IDE...</p>
        </div>
      </div>
    );
  }

  // Auth state - show desktop-specific login/signup
  if (currentView === 'auth') {
    return (
      <div className="min-h-screen bg-background">
        <UserAgreementWrapper isDesktop={isDesktop}>
          <DesktopAuth />
        </UserAgreementWrapper>
      </div>
    );
  }

  // Authenticated state - show project management interface
  return (
    <div className="min-h-screen bg-background">
      <UserAgreementWrapper isDesktop={isDesktop}>
        <DesktopWelcome />
      </UserAgreementWrapper>
    </div>
  );
}

// Default export for easy importing
export default DesktopApp;