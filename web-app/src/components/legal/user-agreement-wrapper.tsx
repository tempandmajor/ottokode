'use client';

import { useEffect, useState } from 'react';
import { UserAgreementModal } from './user-agreement-modal';
import { useUserAgreementStore } from '@/stores/user-agreement-store';
import { showNotification } from '@/lib/notifications';

interface UserAgreementWrapperProps {
  children: React.ReactNode;
  isDesktop?: boolean;
  onAgreementDeclined?: () => void;
}

export function UserAgreementWrapper({
  children,
  isDesktop = false,
  onAgreementDeclined
}: UserAgreementWrapperProps) {
  const {
    hasAcceptedAgreement,
    showAgreementModal,
    checkAgreementStatus,
    acceptAgreement,
    showAgreement,
    hideAgreement,
    setIsDesktopApp
  } = useUserAgreementStore();

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsDesktopApp(isDesktop);

    // Check if we need to show the agreement
    const needsAgreement = !checkAgreementStatus();

    if (isDesktop && needsAgreement) {
      // For desktop apps, show the agreement immediately if not accepted
      showAgreement(true);
    }

    setIsInitialized(true);
  }, [isDesktop, checkAgreementStatus, showAgreement, setIsDesktopApp]);

  const handleAcceptAgreement = () => {
    acceptAgreement();
    hideAgreement();
  };

  const handleDeclineAgreement = () => {
    hideAgreement();
    if (onAgreementDeclined) {
      onAgreementDeclined();
    } else if (isDesktop && typeof window !== 'undefined') {
      // For desktop apps, close the application if agreement is declined
      try {
        // Try to use Tauri's window API to close the app
        import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
          const appWindow = getCurrentWindow();
          appWindow.close();
        }).catch(() => {
          // Fallback: show notification instead of alert
          showNotification('Please restart the application if you change your mind about accepting the user agreement.', 'warning');
        });
      } catch (error) {
        // Fallback for non-Tauri environments
        showNotification('Please restart the application if you change your mind about accepting the user agreement.', 'warning');
      }
    }
  };

  // Don't render children until we've checked the agreement status
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing Ottokode...</p>
        </div>
      </div>
    );
  }

  // For desktop apps, don't show the main content until agreement is accepted
  if (isDesktop && !hasAcceptedAgreement) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-2xl font-bold mb-2">Welcome to Ottokode</h1>
            <p className="text-muted-foreground mb-4">
              Before you start coding, please review and accept our user agreement.
            </p>
          </div>
        </div>
        <UserAgreementModal
          open={showAgreementModal}
          onAccept={handleAcceptAgreement}
          onDecline={handleDeclineAgreement}
          isDesktop={isDesktop}
          canDecline={!isDesktop}
        />
      </>
    );
  }

  return (
    <>
      {children}
      <UserAgreementModal
        open={showAgreementModal}
        onAccept={handleAcceptAgreement}
        onDecline={handleDeclineAgreement}
        isDesktop={isDesktop}
        canDecline={!isDesktop}
      />
    </>
  );
}