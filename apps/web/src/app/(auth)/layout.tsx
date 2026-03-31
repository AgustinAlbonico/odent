import type { ReactNode } from 'react';

/**
 * Auth layout — centered card on muted background.
 * No sidebar, no navigation. Used for login, password recovery, etc.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        {/* Logo / App name */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Sistema Odontológico</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gestión integral para consultorios odontológicos
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
