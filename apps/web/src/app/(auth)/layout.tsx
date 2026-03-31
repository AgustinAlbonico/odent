'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/context';

/**
 * Auth layout — split-screen design.
 * Left panel: brand identity with teal gradient.
 * Right panel: form content centered in generous whitespace.
 * Collapses to single column on smaller screens.
 * Wraps with AuthProvider so children can call useAuth().
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ---- Left panel: brand ---- */}
        <div
          className="relative hidden overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-6 lg:p-12"
          style={{
            background:
              'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
            backgroundSize: '200% 200%',
            animation:
              'auth-gradient-shift 12s ease-in-out infinite, auth-brand-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          {/* Subtle noise overlay for texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat',
              backgroundSize: '128px 128px',
            }}
            aria-hidden="true"
          />

          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/[0.06]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/[0.04]" aria-hidden="true" />

          {/* Tooth icon */}
          <div
            className="relative"
            style={{
              animation: 'auth-float 6s ease-in-out infinite',
              animationDelay: '0.8s',
            }}
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg"
              aria-hidden="true"
            >
              <path
                d="M28 8C20 8 14 14 12 20C10 26 10 32 12 38C14 44 18 52 20 58C22 64 24 72 28 72C32 72 33 64 34 58C35 52 37 46 40 46C43 46 45 52 46 58C47 64 48 72 52 72C56 72 58 64 60 58C62 52 66 44 68 38C70 32 70 26 68 20C66 14 60 8 52 8C48 8 44 10 40 10C36 10 32 8 28 8Z"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="rgba(255,255,255,0.08)"
              />
            </svg>
          </div>

          {/* Brand text */}
          <div
            className="relative text-center"
            style={{
              animation: 'auth-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
              animationDelay: '0.3s',
            }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Sistema Odontologico
            </h1>
            <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-white/70">
              Gestion integral para consultorios odontologicos
            </p>
          </div>
        </div>

        {/* ---- Right panel: form ---- */}
        <div className="flex flex-col items-center justify-center bg-background px-6 py-12 lg:px-16 lg:py-8">
          {/* Mobile-only brand header */}
          <div className="mb-10 text-center lg:hidden">
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              Sistema Odontologico
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Gestion integral para consultorios odontologicos
            </p>
          </div>

          <div
            className="w-full max-w-[420px]"
            style={{
              animation: 'auth-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
              animationDelay: '0.15s',
            }}
          >
            {children}
          </div>

          {/* Footer */}
          <p className="mt-12 text-xs text-muted-foreground/60">
            Acceso exclusivo para personal autorizado
          </p>
        </div>
      </div>
    </AuthProvider>
  );
}
