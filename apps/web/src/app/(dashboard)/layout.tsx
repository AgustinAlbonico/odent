'use client';

import { type ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/context';
import { Sidebar } from '@/components/navigation/sidebar';
import { Header } from '@/components/navigation/header';

/**
 * Dashboard layout — wraps all authenticated pages.
 * Provides AuthContext, sidebar navigation, and header.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
