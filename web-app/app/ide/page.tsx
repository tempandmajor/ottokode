'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isFeatureEnabled, showMigrationWarning } from '@/lib/feature-flags';
import { useAuth } from '@/components/auth/auth-provider';

// Force dynamic rendering to avoid SSR issues with Supabase client
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function IDEPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check if web IDE is enabled - redirect if disabled
  useEffect(() => {
    if (!isFeatureEnabled('WEB_IDE')) {
      showMigrationWarning('Web IDE', 'Desktop app');
      router.push('/download?reason=web-ide-disabled');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to desktop download...</p>
        </div>
      </div>
    );
  }

  // This component will redirect before rendering
  return null;
}