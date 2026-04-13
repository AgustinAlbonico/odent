'use client';

import { useState } from 'react';
import { type ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/context';
import { Sidebar } from '@/components/navigation/sidebar';
import { Header } from '@/components/navigation/header';

/**
 * Dashboard layout — wraps all authenticated pages.
 * Provides AuthContext, sidebar navigation, and header.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />
          <main className="flex-1 overflow-y-auto bg-muted p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
