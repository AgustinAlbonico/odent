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
  Input,
  Label,
} from '@sistema-odontologico/ui';
import { useAuth } from '@/hooks/use-auth';
import { useAbilities } from '@/hooks/use-abilities';
import {
  getAuditLog,
  exportAuditLog,
  type AuditLogEntry,
  type AuditFilters,
  type PaginatedResponse,
} from '@/lib/auth/api';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { Action, Module } from '@sistema-odontologico/permissions';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const EVENT_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'auth.login', label: 'Login' },
  { value: 'auth.logout', label: 'Logout' },
  { value: 'auth.login.failed', label: 'Login fallido' },
  { value: 'session.close', label: 'Sesi\u00f3n cerrada' },
  { value: 'user.create', label: 'Usuario creado' },
  { value: 'user.update', label: 'Usuario actualizado' },
  { value: 'user.delete', label: 'Usuario eliminado' },
  { value: 'role.assign', label: 'Rol asignado' },
  { value: 'role.revoke', label: 'Rol revocado' },
  { value: 'policy.update', label: 'Pol\u00edtica actualizada' },
  { value: 'permission.review', label: 'Revisi\u00f3n de permisos' },
] as const;

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
    second: '2-digit',
  });
}

function formatMetadata(meta: Record<string, unknown>): string {
  const entries = Object.entries(meta);
  if (entries.length === 0) return '—';
  return entries
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(', ');
}

function eventTypeBadgeVariant(event: string) {
  if (event.includes('failed') || event.includes('delete'))
    return 'destructive' as const;
  if (event.includes('create') || event.includes('login'))
    return 'success' as const;
  if (event.includes('update') || event.includes('assign'))
    return 'info' as const;
  if (event.includes('revoke') || event.includes('close'))
    return 'warning' as const;
  return 'default' as const;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function AuditPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAbility } = useAbilities();

  const canViewAudit = hasAbility(Module.AUDIT_ACCESS, Action.VIEW_AUDIT);

  const [data, setData] = useState<PaginatedResponse<AuditLogEntry> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [eventType, setEventType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actorId, setActorId] = useState('');

  const pageSize = 20;

  const buildFilters = useCallback((): AuditFilters => {
    const filters: AuditFilters = { page, pageSize };
    if (eventType) filters.eventType = eventType;
    if (dateFrom) filters.from = new Date(dateFrom).toISOString();
    if (dateTo) filters.to = new Date(dateTo).toISOString();
    if (actorId) filters.actorId = actorId;
    return filters;
  }, [page, eventType, dateFrom, dateTo, actorId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAuditLog(buildFilters());
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar auditor\u00eda');
    } finally {
      setLoading(false);
    }
  }, [buildFilters]);

  useEffect(() => {
    if (isAuthenticated && canViewAudit) {
      fetchData();
    }
  }, [isAuthenticated, canViewAudit, fetchData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAuditLog(buildFilters());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    // fetchData will re-run because page changes to 1
  };

  const handleClearFilters = () => {
    setEventType('');
    setDateFrom('');
    setDateTo('');
    setActorId('');
    setPage(1);
  };

  /* ---- Auth / Permission gate ---- */
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !canViewAudit) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Acceso restringido</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No ten&eacute;s permisos para ver el registro de auditor&iacute;a.
        </p>
      </div>
    );
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Registro de Auditor&iacute;a</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Historial completo de eventos del sistema.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar CSV
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Event Type */}
            <div className="space-y-2">
              <Label htmlFor="event-type">Tipo de evento</Label>
              <select
                id="event-type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="date-from">Desde</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="date-to">Hasta</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Actor ID */}
            <div className="space-y-2">
              <Label htmlFor="actor-id">ID del actor</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="actor-id"
                  placeholder="Buscar por ID..."
                  value={actorId}
                  onChange={(e) => setActorId(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button size="sm" onClick={handleApplyFilters}>
              <Search className="h-4 w-4" />
              Aplicar filtros
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Eventos</CardTitle>
          <CardDescription>
            {data ? `${data.total} registros encontrados` : 'Cargando...'}
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
                        Fecha / Hora
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Evento
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Actor
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        IP
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Metadatos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No se encontraron registros con los filtros aplicados.
                        </td>
                      </tr>
                    )}
                    {data?.data.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-border transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-sm font-mono tabular-nums">
                          {formatDate(entry.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={eventTypeBadgeVariant(entry.event)}>
                            {entry.event}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">{entry.actorEmail}</div>
                          <div className="text-xs text-muted-foreground">
                            {entry.actorId}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono tabular-nums">
                          {entry.ipAddress}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-sm text-muted-foreground">
                          {formatMetadata(entry.metadata)}
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
