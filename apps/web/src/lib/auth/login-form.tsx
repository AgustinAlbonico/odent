'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Skeleton,
  SkeletonForm,
} from '@sistema-odontologico/ui';
import { ApiClientError } from './api';
import { normalizeRedirectPath, resolvePostLoginDestination } from './login-routing';
import { getLoginNotice } from './reason';
import { useAuth } from '@/hooks/use-auth';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl = normalizeRedirectPath(searchParams.get('redirect'));

  const loginNotice = getLoginNotice(searchParams.get('reason'));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      const requiresPasswordChange = result.requiresPasswordChange === true;
      const landingPath = requiresPasswordChange ? null : (result.landingPath ?? null);
      const destination = resolvePostLoginDestination({
        requiresPasswordChange,
        redirectUrl,
        landingPath,
      });

      router.push(destination);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        switch (err.status) {
          case 401:
            setError('Credenciales invalidas. Verifica tu email y contrasena.');
            break;
          case 423:
            setError('Tu cuenta esta bloqueada. Contacta al administrador.');
            break;
          default:
            setError(err.message || 'Ocurrio un error. Intenta de nuevo.');
        }
      } else {
        setError('Error de conexion. Intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const busy = isSubmitting || Boolean(authLoading);

  return (
    <Card className="border-border/50 shadow-none lg:border lg:shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl tracking-tight">Iniciar sesion</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingresa tus credenciales para acceder al sistema.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 pt-2">
          {/* Notice banner */}
          {loginNotice && (
            <div
              className="auth-stagger-item rounded-lg border p-3 text-sm"
              style={{
                animation: 'auth-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
                animationDelay: '0.1s',
                borderColor:
                  loginNotice.tone === 'success'
                    ? 'var(--color-success)'
                    : 'var(--color-warning)',
                backgroundColor:
                  loginNotice.tone === 'success'
                    ? 'color-mix(in srgb, var(--color-success) 8%, transparent)'
                    : 'color-mix(in srgb, var(--color-warning) 8%, transparent)',
                color:
                  loginNotice.tone === 'success'
                    ? 'var(--color-success)'
                    : 'var(--color-warning)',
              }}
            >
              {loginNotice.message}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div
              className="rounded-lg border border-destructive bg-destructive/8 p-3 text-sm text-destructive"
              style={{
                animation: 'auth-fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
              }}
            >
              {error}
            </div>
          )}

          {/* Email field */}
          <div
            className="space-y-2"
            style={{
              animation: 'auth-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
              animationDelay: '0.15s',
            }}
          >
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={busy}
              className="h-11"
            />
          </div>

          {/* Password field */}
          <div
            className="space-y-2"
            style={{
              animation: 'auth-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
              animationDelay: '0.25s',
            }}
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contrasena</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary/70 transition-colors hover:text-primary"
              >
                Olvidaste tu contrasena?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="........"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={busy}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter
          className="pt-2"
          style={{
            animation: 'auth-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: '0.35s',
          }}
        >
          <Button type="submit" className="h-11 w-full" size="lg" disabled={busy}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function LoginFormFallback() {
  return (
    <Card className="border-border/50 shadow-none lg:border lg:shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton height="1.75rem" width="9rem" />
        <div className="mt-2">
          <Skeleton height="1rem" width="14rem" />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <SkeletonForm fields={2} />
      </CardContent>
      <CardFooter className="pt-2">
        <Skeleton height="2.75rem" width="100%" />
      </CardFooter>
    </Card>
  );
}
