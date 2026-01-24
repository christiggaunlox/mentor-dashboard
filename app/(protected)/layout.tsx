'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/components/Providers/AuthProvider';
import { SidebarLayout } from '@/components/SidebarLayout';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AuthProvider>
        <SidebarLayout>
          {children}
        </SidebarLayout>
      </AuthProvider>
    </ProtectedRoute>
  );
}
