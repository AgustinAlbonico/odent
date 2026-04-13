'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@sistema-odontologico/ui';
import { Badge, Button } from '@sistema-odontologico/ui';
import { useAuth } from '@/hooks/use-auth';
import {
  getPersonalAccessHistory,
  type PersonalAccessEvent,
  type PaginatedResponse,
} from '@/lib/auth/api';
import { Shield, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function eventTypeBadgeVariant(eventType: string) {
  const normalized = eventType.toLowerCase();
  if (normalized.includes('login') || normalized.includes('auth')) return 'default' as const;
  if (normalized.includes('logout')) return 'secondary' as const;
  if (normalized.includes('fail') || normalized.includes('error')) return 'destructive' as const;
  return 'outline' as const;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function SecurityPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<PaginatedResponse<PersonalAccessEvent> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPersonalAccessHistory(page, pageSize);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  /* ---- Auth gate ---- */
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Acceso no autorizado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Debes iniciar sesi&oacute;n para ver tu historial de acceso.
        </p>
      </div>
    );
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Historial de Acceso</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revis&aacute; tus &uacute;ltimos inicios de sesi&oacute;n y eventos de seguridad.
        </p>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Eventos recientes</CardTitle>
          <CardDescription>
            {data ? `${data.total} eventos encontrados` : 'Cargando...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Fecha / Hora
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Evento
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Direcci&oacute;n IP
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Agente de usuario
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No se encontraron eventos.
                        </td>
                      </tr>
                    )}
                    {data?.data.map((event) => (
                      <tr
                        key={event.id}
                        className="border-b border-border transition-colors duration-150 ease-out hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-sm font-mono tabular-nums">
                          {formatDate(event.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={eventTypeBadgeVariant(event.eventType)}>
                            {event.eventType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono tabular-nums">
                          {event.ipAddress}
                        </td>
                        <td className="max-w-[240px] truncate px-4 py-3 text-sm text-muted-foreground">
                          {event.userAgent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  P&aacute;gina {page} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
