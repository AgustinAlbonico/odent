'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@sistema-odontologico/ui';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-10 text-center">
        {/* Icon */}
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
          <FileQuestion size={48} className="text-primary" />
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-6xl font-bold tracking-tight text-primary">404</h1>
          <h2 className="text-lg font-semibold text-foreground">
            Página no encontrada
          </h2>
          <p className="max-w-xs mx-auto text-sm leading-relaxed text-muted-foreground">
            La página que buscás no existe o fue movida. Volvé al inicio para continuar trabajando.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={16} className="shrink-0" />
            <span>Volver</span>
          </Button>
          <Button asChild>
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              <Home size={16} className="shrink-0" />
              <span>Ir al inicio</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
