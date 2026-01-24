'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { useRouter, usePathname } from 'next/navigation';

export function AuthRedirectHandler() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const publicPages = ['/login', '/forgot-password', '/reset-password', '/'];

  useEffect(() => {
    if (isLoading || !pathname) return;

    // Not logged in → protect pages (except public pages)
    if (!user && !publicPages.includes(pathname)) {
      router.replace('/login');
      return;
    }

    // Note: Logged-in users CAN access /login page if they want
    // This allows them to see login page or test functionality
  }, [user, isLoading, pathname, router]);

  return null;
}
