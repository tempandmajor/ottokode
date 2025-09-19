'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AGREEMENT_STORAGE_KEY, AGREEMENT_VERSION_KEY, USER_AGREEMENT_CONTENT } from '@/lib/user-agreement-content';

interface UserAgreementState {
  hasAcceptedAgreement: boolean;
  acceptedVersion: string | null;
  acceptedAt: string | null;
  showAgreementModal: boolean;
  isDesktopApp: boolean;
}

interface UserAgreementActions {
  acceptAgreement: () => void;
  checkAgreementStatus: () => boolean;
  showAgreement: (isDesktop?: boolean) => void;
  hideAgreement: () => void;
  resetAgreementStatus: () => void;
  setIsDesktopApp: (isDesktop: boolean) => void;
}

type UserAgreementStore = UserAgreementState & UserAgreementActions;

export const useUserAgreementStore = create<UserAgreementStore>()(
  (persist(
    (set: any, get: any) => ({
      // State
      hasAcceptedAgreement: false,
      acceptedVersion: null,
      acceptedAt: null,
      showAgreementModal: false,
      isDesktopApp: false,

      // Actions
      acceptAgreement: () => {
        const now = new Date().toISOString();
        set({
          hasAcceptedAgreement: true,
          acceptedVersion: USER_AGREEMENT_CONTENT.version,
          acceptedAt: now,
          showAgreementModal: false,
        });
      },

      checkAgreementStatus: () => {
        const state = get();
        // Check if user has accepted the current version
        const hasValidAcceptance =
          state.hasAcceptedAgreement &&
          state.acceptedVersion === USER_AGREEMENT_CONTENT.version;

        return hasValidAcceptance;
      },

      showAgreement: (isDesktop = false) => {
        set({
          showAgreementModal: true,
          isDesktopApp: isDesktop,
        });
      },

      hideAgreement: () => {
        set({
          showAgreementModal: false,
        });
      },

      resetAgreementStatus: () => {
        set({
          hasAcceptedAgreement: false,
          acceptedVersion: null,
          acceptedAt: null,
          showAgreementModal: false,
        });
      },

      setIsDesktopApp: (isDesktop: boolean) => {
        set({
          isDesktopApp: isDesktop,
        });
      },
    }),
    {
      name: AGREEMENT_STORAGE_KEY,
      partialize: (state: UserAgreementStore) => ({
        hasAcceptedAgreement: state.hasAcceptedAgreement,
        acceptedVersion: state.acceptedVersion,
        acceptedAt: state.acceptedAt,
      }) as Partial<UserAgreementStore>,
    }
  ) as any)
);

// Utility functions for non-React contexts (like Tauri)
export const getUserAgreementStatus = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(AGREEMENT_STORAGE_KEY);
    if (!stored) return false;

    const data = JSON.parse(stored);
    return data.state?.hasAcceptedAgreement === true &&
           data.state?.acceptedVersion === USER_AGREEMENT_CONTENT.version;
  } catch {
    return false;
  }
};

export const setUserAgreementAccepted = (): void => {
  if (typeof window === 'undefined') return;

  try {
    const now = new Date().toISOString();
    const data = {
      state: {
        hasAcceptedAgreement: true,
        acceptedVersion: USER_AGREEMENT_CONTENT.version,
        acceptedAt: now,
      },
      version: 0,
    };
    localStorage.setItem(AGREEMENT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save user agreement status:', error);
  }
};