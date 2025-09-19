'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isTauriApp } from '@/lib/platform-detection';

export function DesktopRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const isDesktop = isTauriApp();

    // Debug logging
    console.log('Desktop Redirect Debug:', {
      isDesktop,
      pathname,
      userAgent: navigator.userAgent,
      tauriInternals: !!(window as any).__TAURI_INTERNALS__,
      tauri: !!(window as any).__TAURI__,
      tauriIpc: !!(window as any).__TAURI_IPC__
    });

    if (isDesktop) {
      // If we're in desktop app and not on the desktop route, redirect
      if (pathname !== '/desktop' && !pathname.startsWith('/desktop/')) {
        console.log('Redirecting to /desktop from', pathname);
        router.replace('/desktop');
        return;
      }
    }
  }, [pathname, router]);

  return <>{children}</>;
}