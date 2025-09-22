'use client';

import { useEffect } from 'react';

export function EnvDebug() {
  useEffect(() => {
    console.log('Environment Debug Info:', {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
      windowLocation: typeof window !== 'undefined' ? window.location.href : 'SSR'
    });
  }, []);

  return null;
}