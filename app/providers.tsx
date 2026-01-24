'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { AuthRedirectHandler } from '@/components/AuthRedirectHandler';

export function Providers({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <AuthRedirectHandler />
      {children}
    </>
  );
}