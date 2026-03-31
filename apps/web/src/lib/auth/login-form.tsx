'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
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
            setError('Credenciales inválidas. Verificá tu email y contraseña.');
            break;
          case 423:
            setError('Tu cuenta está bloqueada. Contactá al administrador.');
            break;
          default:
            setError(err.message || 'Ocurrió un error. Intentá de nuevo.');
        }
      } else {
        setError('Error de conexión. Intentá de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const busy = isSubmitting || Boolean(authLoading);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>Ingresá tus credenciales para acceder al sistema.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {loginNotice && (
            <div
              className={
                loginNotice.tone === 'success'
                  ? 'rounded-md border border-success bg-success/10 p-3 text-sm text-success'
                  : 'rounded-md border border-warning bg-warning/10 p-3 text-sm text-warning'
              }
            >
              {loginNotice.message}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
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
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={busy}
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button type="submit" className="w-full" disabled={busy}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function LoginFormFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>Cargando formulario de acceso…</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      </CardContent>
    </Card>
  );
}
