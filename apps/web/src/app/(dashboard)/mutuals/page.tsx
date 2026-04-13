'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Label,
  SkeletonTable,
} from '@sistema-odontologico/ui';
import { useAuth } from '@/hooks/use-auth';
import { useAbilities } from '@/hooks/use-abilities';
import {
  getMutuals,
  createMutual,
  updateMutual,
  deleteMutual,
  type MutualCatalogItem,
  type MutualsFilters,
} from '@/lib/auth/api';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Plus,
  Edit,
  ToggleLeft,
  X,
  Building2,
} from 'lucide-react';
import { Action, Module } from '@sistema-odontologico/permissions';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 20;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDateShort(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getStatusBadgeVariant(isActive: boolean): 'success' | 'secondary' {
  return isActive ? 'success' : 'secondary';
}

function getStatusLabel(isActive: boolean): string {
  return isActive ? 'Activo' : 'Inactivo';
}

/* ------------------------------------------------------------------ */
/* Form validation                                                     */
/* ------------------------------------------------------------------ */

interface MutualFormErrors {
  name?: string;
  code?: string;
  phone?: string;
}

function validateMutualForm(data: {
  name: string;
  code: string;
  phone?: string;
}): MutualFormErrors {
  const errors: MutualFormErrors = {};
  if (!data.name.trim()) errors.name = 'El nombre es obligatorio';
  if (!data.code.trim()) errors.code = 'El código es obligatorio';
  return errors;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function MutualsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAbility } = useAbilities();

  const canViewList = hasAbility(Module.MUTUALS, Action.VIEW_LIST);
  const canAdminCatalog = hasAbility(Module.MUTUALS, Action.ADMIN_CATALOG);

  // List state
  const [mutuals, setMutuals] = useState<MutualCatalogItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    phone: '',
  });
  const [createErrors, setCreateErrors] = useState<MutualFormErrors>({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit form
  const [editMutual, setEditMutual] = useState<MutualCatalogItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    phone: '',
  });
  const [editErrors, setEditErrors] = useState<MutualFormErrors>({});
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Confirm dialog
  const [confirmDeactivate, setConfirmDeactivate] = useState<{
    mutualId: string;
    mutualName: string;
  } | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  /* ---- Data fetching ---- */

  const buildFilters = useCallback((): MutualsFilters => {
    const filters: MutualsFilters = { page, limit: PAGE_SIZE };
    if (searchFilter) filters.search = searchFilter;
    if (includeInactive) filters.includeInactive = true;
    return filters;
  }, [page, searchFilter, includeInactive]);

  const fetchMutuals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMutuals(buildFilters());
      setMutuals(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar mutuales');
    } finally {
      setLoading(false);
    }
  }, [buildFilters]);

  useEffect(() => {
    if (isAuthenticated && canViewList) {
      fetchMutuals();
    }
  }, [isAuthenticated, canViewList, fetchMutuals]);

  /* ---- Handlers ---- */

  const handleSearch = () => {
    setPage(1);
    fetchMutuals();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleResetFilters = () => {
    setSearchFilter('');
    setIncludeInactive(false);
    setPage(1);
  };

  const handleOpenCreateForm = () => {
    setCreateForm({ name: '', code: '', phone: '' });
    setCreateErrors({});
    setCreateError(null);
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
    setCreateForm({ name: '', code: '', phone: '' });
    setCreateErrors({});
    setCreateError(null);
  };

  const handleCreateMutual = async () => {
    const errors = validateMutualForm(createForm);
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await createMutual({
        name: createForm.name,
        code: createForm.code,
        phone: createForm.phone || undefined,
      });
      handleCloseCreateForm();
      fetchMutuals();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error al crear mutual');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditForm = (mutual: MutualCatalogItem) => {
    setEditMutual(mutual);
    setEditForm({
      name: mutual.name,
      code: mutual.code,
      phone: mutual.phone ?? '',
    });
    setEditErrors({});
    setEditError(null);
  };

  const handleCloseEditForm = () => {
    setEditMutual(null);
    setEditForm({ name: '', code: '', phone: '' });
    setEditErrors({});
    setEditError(null);
  };

  const handleUpdateMutual = async () => {
    if (!editMutual) return;
    const errors = validateMutualForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setEditing(true);
    setEditError(null);
    try {
      await updateMutual(editMutual.id, {
        name: editForm.name,
        code: editForm.code,
        phone: editForm.phone || undefined,
      });
      handleCloseEditForm();
      fetchMutuals();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error al actualizar mutual');
    } finally {
      setEditing(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    setDeactivating(true);
    try {
      await deleteMutual(confirmDeactivate.mutualId);
      setConfirmDeactivate(null);
      fetchMutuals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desactivar mutual');
    } finally {
      setDeactivating(false);
    }
  };

  /* ---- Permission gate ---- */

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !canViewList) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No tenés permisos para ver el catálogo de mutuales.</p>
      </div>
    );
  }

  /* ---- Render ---- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mutuales</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Catálogo de obras sociales y prepagas
          </p>
        </div>
        {canAdminCatalog && (
          <Button onClick={handleOpenCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva mutual
          </Button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="text-sm">
                Buscar
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nombre o código..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 min-w-[180px]">
              <input
                id="includeInactive"
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Label htmlFor="includeInactive" className="text-sm cursor-pointer">
                Incluir inactivas
              </Label>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button variant="ghost" onClick={handleResetFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={8} columns={5} showHeader />
          ) : mutuals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Building2 className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No se encontraron mutuales</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Nombre
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Código
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Teléfono
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Estado
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Creado
                    </th>
                    <th className="text-right text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mutuals.map((mutual) => (
                    <tr
                      key={mutual.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors duration-150 ease-out"
                    >
                      <td className="px-4 py-3 text-sm font-medium">{mutual.name}</td>
                      <td className="px-4 py-3 text-sm font-mono tabular-nums">{mutual.code}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {mutual.phone ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(mutual.isActive)}>
                          {getStatusLabel(mutual.isActive)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDateShort(mutual.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canAdminCatalog && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditForm(mutual)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canAdminCatalog && mutual.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setConfirmDeactivate({
                                  mutualId: mutual.id,
                                  mutualName: mutual.name,
                                })
                              }
                              title="Desactivar"
                            >
                              <ToggleLeft className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {!loading && mutuals.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {mutuals.length} de {total} mutuales
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => p - 1);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((p) => p + 1);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Create Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-semibold">Nueva mutual</h2>
              <Button variant="ghost" size="sm" onClick={handleCloseCreateForm}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {createError && <p className="text-sm text-destructive">{createError}</p>}
              <div className="space-y-2">
                <Label className="text-sm">Nombre *</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Ej: OSDE"
                />
                {createErrors.name && (
                  <p className="text-xs text-destructive mt-1">{createErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Código *</Label>
                <Input
                  value={createForm.code}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })
                  }
                  placeholder="Ej: OSDE"
                />
                {createErrors.code && (
                  <p className="text-xs text-destructive mt-1">{createErrors.code}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Teléfono</Label>
                <Input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="Ej: 0800-123-4567"
                />
              </div>
            </div>
            <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={handleCloseCreateForm}>
                Cancelar
              </Button>
              <Button onClick={handleCreateMutual} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear mutual
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editMutual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-semibold">Editar mutual</h2>
              <Button variant="ghost" size="sm" onClick={handleCloseEditForm}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {editError && <p className="text-sm text-destructive">{editError}</p>}
              <div className="space-y-2">
                <Label className="text-sm">Nombre *</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                {editErrors.name && (
                  <p className="text-xs text-destructive mt-1">{editErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Código *</Label>
                <Input
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                />
                {editErrors.code && (
                  <p className="text-xs text-destructive mt-1">{editErrors.code}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Teléfono</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={handleCloseEditForm}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateMutual} disabled={editing}>
                {editing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deactivate Dialog */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-sm p-6 m-4">
            <h3 className="text-lg font-semibold mb-2">Confirmar desactivación</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ¿Estás seguro de que querés desactivar la mutual{' '}
              <strong>{confirmDeactivate.mutualName}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDeactivate(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeactivate} disabled={deactivating}>
                {deactivating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Desactivar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
