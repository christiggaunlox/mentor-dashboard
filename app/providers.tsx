'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { AuthRedirectHandler } from '@/components/AuthRedirectHandler';

export function Providers({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once on mount
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initialize();
    }
  }, [initialize]);

  return (
    <>
      <AuthRedirectHandler />
      {children}
    </>
  );
}