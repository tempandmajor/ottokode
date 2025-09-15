// Re-export ottokode utilities to ensure consistent styling
export * from '../../web-app/src/lib/utils';

// Additional utilities for cross-platform compatibility
export const isDesktop = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
export const isWeb = typeof window !== 'undefined' && window.__TAURI__ === undefined;

// Platform-specific styling helpers
export const platformClass = (desktopClass: string, webClass: string = '') => {
  if (typeof window === 'undefined') return '';
  return isDesktop ? desktopClass : webClass;
};