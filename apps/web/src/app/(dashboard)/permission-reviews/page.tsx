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
} from '@sistema-odontologico/ui';
import { useAuth } from '@/hooks/use-auth';
import { useAbilities } from '@/hooks/use-abilities';
import {
  getPermissionReviews,
  generatePermissionReviews,
  confirmPermissionReview,
  revokePermissionReview,
  type PermissionReview,
  type PaginatedResponse,
} from '@/lib/auth/api';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Action, Module } from '@sistema-odontologico/permissions';

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

function statusBadgeVariant(
  status: PermissionReview['status'],
): 'default' | 'success' | 'destructive' | 'warning' | 'secondary' {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'success';
    case 'revoked':
      return 'destructive';
    case 'expired':
      return 'secondary';
    default:
      return 'default';
  }
}

function statusLabel(status: PermissionReview['status']): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmado';
    case 'revoked':
      return 'Revocado';
    case 'expired':
      return 'Expirado';
    default:
      return status;
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function PermissionReviewsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { canOperate } = useAbilities();

  const canAdminRoles = canOperate(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_ROLES_PERMISSIONS);

  const [data, setData] = useState<PaginatedResponse<PermissionReview> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPermissionReviews(page, pageSize);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar revisiones');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isAuthenticated && canAdminRoles) {
      fetchData();
    }
  }, [isAuthenticated, canAdminRoles, fetchData]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generatePermissionReviews();
      // Refresh data to show new reviews
      await fetchData();
      // Brief success message
      setError(null);
      setData((prev) => prev); // trigger re-render
      // Could show a toast here in the future
      void result;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al generar revisiones',
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirm = async (reviewId: string) => {
    setActionLoading(reviewId);
    setError(null);
    try {
      await confirmPermissionReview(reviewId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (reviewId: string) => {
    setActionLoading(reviewId);
    setError(null);
    try {
      await revokePermissionReview(reviewId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al revocar');
    } finally {
      setActionLoading(null);
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

  if (!isAuthenticated || !canAdminRoles) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Acceso restringido</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No ten&eacute;s permisos para gestionar revisiones de permisos.
        </p>
      </div>
    );
  }

  const totalPages = data?.totalPages ?? 1;
  const pendingCount = data?.data.filter((r) => r.status === 'pending').length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Revisiones de Permisos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revis&aacute; peri&oacute;dicamente los permisos asignados a los usuarios.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Generar ciclo
        </Button>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold text-foreground">
                {data.data.filter((r) => r.status === 'pending').length}
              </p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold text-success">
                {data.data.filter((r) => r.status === 'confirmed').length}
              </p>
              <p className="text-sm text-muted-foreground">Confirmados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold text-destructive">
                {data.data.filter((r) => r.status === 'revoked').length}
              </p>
              <p className="text-sm text-muted-foreground">Revocados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold text-muted-foreground">
                {data.data.filter((r) => r.status === 'expired').length}
              </p>
              <p className="text-sm text-muted-foreground">Expirados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Revisiones</CardTitle>
          <CardDescription>
            {data
              ? `${data.total} registros — ${pendingCount} pendientes de revisi\u00f3n`
              : 'Cargando...'}
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
                        M&oacute;dulo
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Acci&oacute;n
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Alcance
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Per&iacute;odo
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No hay revisiones de permisos.
                        </td>
                      </tr>
                    )}
                    {data?.data.map((review) => {
                      const isActionLoading = actionLoading === review.id;
                      const isPending = review.status === 'pending';

                      return (
                        <tr
                          key={review.id}
                          className="border-b border-border transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium">{review.userName}</div>
                            <div className="text-xs text-muted-foreground">
                              {review.userEmail}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono">
                            {review.module}
                          </td>
                          <td className="px-4 py-3 text-sm">{review.action}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {review.scope}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono tabular-nums">
                            {formatDate(review.period)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={statusBadgeVariant(review.status)}>
                              {statusLabel(review.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {isPending && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isActionLoading}
                                  onClick={() => handleConfirm(review.id)}
                                  className="text-success hover:bg-success/10 hover:text-success"
                                >
                                  {isActionLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                  Confirmar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isActionLoading}
                                  onClick={() => handleRevoke(review.id)}
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Revocar
                                </Button>
                              </div>
                            )}
                            {!isPending && (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
