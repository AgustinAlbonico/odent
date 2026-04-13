'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  hoverTransition,
} from '@sistema-odontologico/ui';
import { useAuth } from '@/hooks/use-auth';
import { useAbilities } from '@/hooks/use-abilities';
import {
  getActiveSessions,
  closeSession,
  type ActiveSession,
  type PaginatedResponse,
} from '@/lib/auth/api';
import { Shield, ChevronLeft, ChevronRight, Loader2, XCircle } from 'lucide-react';
import { Action, Module } from '@sistema-odontologico/permissions';

/* ------------------------------------------------------------------ */
/* Confirmation Modal                                                  */
/* ------------------------------------------------------------------ */

function ConfirmCloseModal({
  session,
  onConfirm,
  onCancel,
  isClosing,
}: {
  session: ActiveSession;
  onConfirm: () => void;
  onCancel: () => void;
  isClosing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="mx-4 w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Cerrar sesi&oacute;n</CardTitle>
          <CardDescription>
            &iquest;Est&aacute;s seguro de que quer&eacute;s cerrar la sesi&oacute;n de{' '}
            <strong>{session.userName}</strong> ({session.userEmail})?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            El usuario deber&aacute; iniciar sesi&oacute;n nuevamente.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onCancel} disabled={isClosing}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isClosing}>
              {isClosing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cerrando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Cerrar sesi&oacute;n
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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

function parseUserAgent(ua: string): string {
  // Simple UA parsing — extract browser and OS
  if (ua.includes('Chrome') && !ua.includes('Edg'))
    return `Chrome${ua.match(/Chrome\/(\d+)/)?.[1] ? ` ${ua.match(/Chrome\/(\d+)/)?.[1]}` : ''}`;
  if (ua.includes('Firefox'))
    return `Firefox${ua.match(/Firefox\/(\d+)/)?.[1] ? ` ${ua.match(/Firefox\/(\d+)/)?.[1]}` : ''}`;
  if (ua.includes('Safari') && !ua.includes('Chrome'))
    return `Safari${ua.match(/Version\/(\d+)/)?.[1] ? ` ${ua.match(/Version\/(\d+)/)?.[1]}` : ''}`;
  if (ua.includes('Edg'))
    return `Edge${ua.match(/Edg\/(\d+)/)?.[1] ? ` ${ua.match(/Edg\/(\d+)/)?.[1]}` : ''}`;
  return ua.length > 40 ? `${ua.slice(0, 40)}...` : ua;
}

/* ------------------------------------------------------------------ */
/* Page Component                                                      */
/* ------------------------------------------------------------------ */

export default function SessionsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { canOperate } = useAbilities();

  const canAdminUsers = canOperate(Module.SYSTEM_CONFIG, Action.ADMIN_USERS);
  const canCloseSessions = canOperate(Module.SYSTEM_CONFIG, Action.CLOSE_SESSION_ADMIN);
  const hasAccess = canAdminUsers || canCloseSessions;

  const [data, setData] = useState<PaginatedResponse<ActiveSession> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionToClose, setSessionToClose] = useState<ActiveSession | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getActiveSessions(page, pageSize);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar sesiones');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isAuthenticated && hasAccess) {
      fetchData();
    }
  }, [isAuthenticated, hasAccess, fetchData]);

  const handleCloseSession = async () => {
    if (!sessionToClose) return;
    setIsClosing(true);
    try {
      await closeSession(sessionToClose.id);
      setSessionToClose(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar sesi&oacute;n');
    } finally {
      setIsClosing(false);
    }
  };

  /* ---- Auth / Permission gate ---- */
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Acceso restringido</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No ten&eacute;s permisos para ver esta p&aacute;gina.
        </p>
      </div>
    );
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Sesiones Activas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administra las sesiones activas de todos los usuarios.
        </p>
      </div>

      {/* Confirmation Modal */}
      {sessionToClose && (
        <ConfirmCloseModal
          session={sessionToClose}
          onConfirm={handleCloseSession}
          onCancel={() => setSessionToClose(null)}
          isClosing={isClosing}
        />
      )}

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sesiones activas</CardTitle>
          <CardDescription>
            {data ? `${data.total} sesiones activas` : 'Cargando...'}
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
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        IP
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Dispositivo
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        &Uacute;ltima actividad
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Creada
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Estado
                      </th>
                      {canCloseSessions && (
                        <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          Acci&oacute;n
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data.length === 0 && (
                      <tr>
                        <td
                          colSpan={canCloseSessions ? 7 : 6}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No hay sesiones activas.
                        </td>
                      </tr>
                    )}
                    {data?.data.map((session) => (
                      <tr
                        key={session.id}
                        className="border-b border-border transition-colors duration-150 ease-out hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">{session.userName}</div>
                          <div className="text-xs text-muted-foreground">{session.userEmail}</div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono tabular-nums">
                          {session.ipAddress}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {parseUserAgent(session.userAgent)}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono tabular-nums">
                          {formatDate(session.lastActivity)}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono tabular-nums">
                          {formatDate(session.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant="success">Activa</Badge>
                        </td>
                        {canCloseSessions && (
                          <td className="px-4 py-3 text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSessionToClose(session)}
                              className={`text-destructive hover:bg-destructive/10 hover:text-destructive ${hoverTransition}`}
                            >
                              <XCircle className="h-4 w-4" />
                              Cerrar
                            </Button>
                          </td>
                        )}
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
