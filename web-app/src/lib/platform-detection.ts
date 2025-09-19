'use client';

/**
 * Detects if the application is running in a Tauri desktop environment
 */
export function isTauriApp(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for Tauri v2 global
  return !!(window as any).__TAURI_INTERNALS__ ||
         !!(window as any).__TAURI__ ||
         !!(window as any).__TAURI_IPC__ ||
         // Also check for user agent containing 'Tauri'
         (typeof navigator !== 'undefined' && navigator.userAgent.includes('Tauri'));
}

/**
 * Detects if the application is running in a web browser
 */
export function isWebApp(): boolean {
  return !isTauriApp();
}

/**
 * Gets the platform information
 */
export function getPlatformInfo() {
  return {
    isDesktop: isTauriApp(),
    isWeb: isWebApp(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    platform: typeof window !== 'undefined' ? window.navigator.platform : ''
  };
}

/**
 * Initializes platform-specific settings
 */
export async function initializePlatform() {
  if (isTauriApp()) {
    try {
      // Import Tauri APIs dynamically to avoid errors in web builds
      const { getCurrentWindow } = await import('@tauri-apps/api/window');

      // Set up desktop-specific configurations
      console.log('Initializing Ottokode Desktop App');

      // You can add more desktop-specific initialization here
      return {
        type: 'desktop',
        window: getCurrentWindow()
      };
    } catch (error) {
      console.warn('Failed to initialize Tauri APIs:', error);
      return { type: 'desktop', error };
    }
  } else {
    console.log('Initializing Ottokode Web App');
    return { type: 'web' };
  }
}