'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/components/Providers/AuthProvider';
import { SidebarLayout } from '@/components/SidebarLayout';
import { ToastContainer } from "react-toastify";

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
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </ProtectedRoute>
  );
}
