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
  getUsers,
  getUser,
  createUser,
  updateUser,
  changeUserState,
  forceUserPasswordChange,
  getUserPermissions,
  type UserListItem,
  type UserDetail,
  type UserPermissionsResponse,
  type UsersFilters,
} from '@/lib/auth/api';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Plus,
  Eye,
  Edit,
  KeyRound,
  ToggleLeft,
  X,
  Users as UsersIcon,
} from 'lucide-react';
import { Action, Module } from '@sistema-odontologico/permissions';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const ROLES = [
  { value: '', label: 'Todos' },
  { value: 'admin', label: 'Admin' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'asistente', label: 'Asistente' },
  { value: 'profesional_supervisor', label: 'Supervisor' },
] as const;

const STATES = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'locked', label: 'Bloqueado' },
  { value: 'pending_password_change', label: 'Pendiente cambio' },
] as const;

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'asistente', label: 'Asistente' },
  { value: 'profesional_supervisor', label: 'Supervisor' },
] as const;

const STATE_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
] as const;

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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'info' | 'warning' {
  const map: Record<string, 'default' | 'secondary' | 'info' | 'warning'> = {
    admin: 'default',
    profesional: 'info',
    asistente: 'secondary',
    profesional_supervisor: 'warning',
  };
  return map[role] ?? 'secondary';
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    admin: 'Admin',
    profesional: 'Profesional',
    asistente: 'Asistente',
    profesional_supervisor: 'Supervisor',
  };
  return map[role] ?? role;
}

function getStateBadgeVariant(state: string): 'success' | 'secondary' | 'destructive' | 'warning' {
  const map: Record<string, 'success' | 'secondary' | 'destructive' | 'warning'> = {
    active: 'success',
    inactive: 'secondary',
    locked: 'destructive',
    pending_password_change: 'warning',
  };
  return map[state] ?? 'secondary';
}

function getStateLabel(state: string): string {
  const map: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    locked: 'Bloqueado',
    pending_password_change: 'Pendiente cambio',
  };
  return map[state] ?? state;
}

/* ------------------------------------------------------------------ */
/* Form validation                                                     */
/* ------------------------------------------------------------------ */

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateCreateForm(data: {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}): FormErrors {
  const errors: FormErrors = {};
  if (!data.email.trim()) errors.email = 'El email es obligatorio';
  else if (!validateEmail(data.email)) errors.email = 'Formato de email inválido';
  if (!data.firstName.trim()) errors.firstName = 'El nombre es obligatorio';
  if (!data.lastName.trim()) errors.lastName = 'El apellido es obligatorio';
  if (!data.role) errors.role = 'El rol es obligatorio';
  return errors;
}

function validateEditForm(data: {
  firstName: string;
  lastName: string;
  role: string;
}): FormErrors {
  const errors: FormErrors = {};
  if (!data.firstName.trim()) errors.firstName = 'El nombre es obligatorio';
  if (!data.lastName.trim()) errors.lastName = 'El apellido es obligatorio';
  if (!data.role) errors.role = 'El rol es obligatorio';
  return errors;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function UsersPage() {
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const { hasAbility } = useAbilities();

  const canAdminUsers = hasAbility(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_USERS);

  // List state
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Detail panel
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissionsResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'permissions'>('info');

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    state: 'active',
  });
  const [createErrors, setCreateErrors] = useState<FormErrors>({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit form
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: '',
    state: '',
  });
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<{
    type: 'changeState' | 'forcePassword';
    userId: string;
    userName: string;
    newState?: string;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  /* ---- Data fetching ---- */

  const buildFilters = useCallback((): UsersFilters => {
    const filters: UsersFilters = { page, limit: PAGE_SIZE };
    if (roleFilter) filters.role = roleFilter;
    if (stateFilter) filters.state = stateFilter;
    if (searchFilter) filters.search = searchFilter;
    return filters;
  }, [page, roleFilter, stateFilter, searchFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUsers(buildFilters());
      setUsers(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [buildFilters]);

  useEffect(() => {
    if (isAuthenticated && canAdminUsers) {
      fetchUsers();
    }
  }, [isAuthenticated, canAdminUsers, fetchUsers]);

  const fetchUserDetail = useCallback(async (userId: string) => {
    setDetailLoading(true);
    try {
      const [detail, perms] = await Promise.all([
        getUser(userId),
        getUserPermissions(userId),
      ]);
      setUserDetail(detail);
      setUserPermissions(perms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar detalle del usuario');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserDetail(selectedUserId);
    }
  }, [selectedUserId, fetchUserDetail]);

  /* ---- Handlers ---- */

  const handleApplyFilters = () => {
    setPage(1);
  };

  const handleClearFilters = () => {
    setRoleFilter('');
    setStateFilter('');
    setSearchFilter('');
    setPage(1);
  };

  const handleViewDetail = (userId: string) => {
    setSelectedUserId(userId);
    setDetailTab('info');
  };

  const handleCloseDetail = () => {
    setSelectedUserId(null);
    setUserDetail(null);
    setUserPermissions(null);
    setDetailTab('info');
  };

  const handleOpenCreate = () => {
    setCreateForm({ email: '', firstName: '', lastName: '', role: '', state: 'active' });
    setCreateErrors({});
    setCreateError(null);
    setShowCreateForm(true);
  };

  const handleCreate = async () => {
    const errors = validateCreateForm(createForm);
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createUser(createForm);
      setShowCreateForm(false);
      await fetchUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = () => {
    if (!userDetail) return;
    setEditForm({
      firstName: userDetail.firstName,
      lastName: userDetail.lastName,
      role: userDetail.role,
      state: userDetail.state,
    });
    setEditErrors({});
    setEditError(null);
    setShowEditForm(true);
  };

  const handleEdit = async () => {
    if (!selectedUserId) return;
    const errors = validateEditForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    setEditing(true);
    setEditError(null);
    try {
      await updateUser(selectedUserId, editForm);
      setShowEditForm(false);
      await fetchUserDetail(selectedUserId);
      await fetchUsers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setEditing(false);
    }
  };

  const handleConfirmChangeState = (userId: string, userName: string, newState: string) => {
    setConfirmAction({ type: 'changeState', userId, userName, newState });
  };

  const handleConfirmForcePassword = (userId: string, userName: string) => {
    setConfirmAction({ type: 'forcePassword', userId, userName });
  };

  const handleConfirmExecute = async () => {
    if (!confirmAction) return;
    setConfirming(true);
    try {
      if (confirmAction.type === 'changeState' && confirmAction.newState) {
        await changeUserState(confirmAction.userId, confirmAction.newState);
      } else if (confirmAction.type === 'forcePassword') {
        await forceUserPasswordChange(confirmAction.userId);
      }
      setConfirmAction(null);
      if (selectedUserId) {
        await fetchUserDetail(selectedUserId);
      }
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ejecutar la acción');
    } finally {
      setConfirming(false);
    }
  };

  const getNextState = (currentState: string): string => {
    if (currentState === 'active') return 'inactive';
    return 'active';
  };

  /* ---- Auth / Permission gate ---- */
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !canAdminUsers) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Acceso restringido</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No ten&eacute;s permisos para administrar usuarios.
        </p>
      </div>
    );
  }

  /* ---- Render ---- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Usuarios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administr&aacute; los usuarios del sistema.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus size={16} />
          Nuevo usuario
        </Button>
      </div>

      {/* Global error banner */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ============ DETAIL VIEW ============ */}
      {selectedUserId ? (
        <UserDetailPanel
          userDetail={userDetail}
          userPermissions={userPermissions}
          loading={detailLoading}
          tab={detailTab}
          onTabChange={setDetailTab}
          onClose={handleCloseDetail}
          onEdit={handleOpenEdit}
          onChangeState={(userId, userName, newState) =>
            handleConfirmChangeState(userId, userName, newState)
          }
          onForcePassword={(userId, userName) =>
            handleConfirmForcePassword(userId, userName)
          }
          isSelf={currentUser?.id === selectedUserId}
        />
      ) : (
        <>
          {/* ============ LIST VIEW ============ */}

          {/* Filters Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Filtros</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nombre o email..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Role filter */}
                <div className="space-y-2">
                  <Label htmlFor="role-filter">Rol</Label>
                  <select
                    id="role-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* State filter */}
                <div className="space-y-2">
                  <Label htmlFor="state-filter">Estado</Label>
                  <select
                    id="state-filter"
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {STATES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
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
              <CardTitle className="text-xl">Lista de usuarios</CardTitle>
              <CardDescription>
                {loading ? 'Cargando...' : `${total} usuarios encontrados`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonTable rows={8} columns={6} />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Rol
                          </th>
                          <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            &Uacute;ltimo login
                          </th>
                          <th className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <UsersIcon className="h-8 w-8 text-muted-foreground/50" />
                                <span>No se encontraron usuarios.</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-border transition-colors hover:bg-muted/50"
                          >
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium">
                                {user.firstName} {user.lastName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {user.email}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant={getRoleBadgeVariant(user.role)}>
                                {getRoleLabel(user.role)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant={getStateBadgeVariant(user.state)}>
                                {getStateLabel(user.state)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {formatDateShort(user.lastLoginAt)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetail(user.id)}
                                  title="Ver detalle"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleConfirmChangeState(
                                      user.id,
                                      `${user.firstName} ${user.lastName}`,
                                      getNextState(user.state),
                                    )
                                  }
                                  title="Cambiar estado"
                                >
                                  <ToggleLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleConfirmForcePassword(
                                      user.id,
                                      `${user.firstName} ${user.lastName}`,
                                    )
                                  }
                                  title="Forzar cambio de contrase&ntilde;a"
                                >
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
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
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ============ CREATE USER FORM ============ */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Nuevo usuario</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Complet&aacute; los datos para crear un nuevo usuario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {createError && (
                <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {createError}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                    error={!!createErrors.email}
                  />
                  {createErrors.email && (
                    <p className="text-xs text-destructive">{createErrors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-firstName">Nombre</Label>
                    <Input
                      id="create-firstName"
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                      error={!!createErrors.firstName}
                    />
                    {createErrors.firstName && (
                      <p className="text-xs text-destructive">{createErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-lastName">Apellido</Label>
                    <Input
                      id="create-lastName"
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                      error={!!createErrors.lastName}
                    />
                    {createErrors.lastName && (
                      <p className="text-xs text-destructive">{createErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-role">Rol</Label>
                  <select
                    id="create-role"
                    value={createForm.role}
                    onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Seleccionar rol</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  {createErrors.role && (
                    <p className="text-xs text-destructive">{createErrors.role}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-state">Estado</Label>
                  <select
                    id="create-state"
                    value={createForm.state}
                    onChange={(e) => setCreateForm((f) => ({ ...f, state: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {STATE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 border-t border-border pt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Crear usuario
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* ============ EDIT USER FORM ============ */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Editar usuario</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowEditForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Modific&aacute; los datos del usuario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editError && (
                <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {editError}
                </div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">Nombre</Label>
                    <Input
                      id="edit-firstName"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                      error={!!editErrors.firstName}
                    />
                    {editErrors.firstName && (
                      <p className="text-xs text-destructive">{editErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Apellido</Label>
                    <Input
                      id="edit-lastName"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                      error={!!editErrors.lastName}
                    />
                    {editErrors.lastName && (
                      <p className="text-xs text-destructive">{editErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role">Rol</Label>
                  <select
                    id="edit-role"
                    value={editForm.role}
                    onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  {editErrors.role && (
                    <p className="text-xs text-destructive">{editErrors.role}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-state">Estado</Label>
                  <select
                    id="edit-state"
                    value={editForm.state}
                    onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="locked">Bloqueado</option>
                    <option value="pending_password_change">Pendiente cambio</option>
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 border-t border-border pt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditForm(false)}
                disabled={editing}
              >
                Cancelar
              </Button>
              <Button onClick={handleEdit} disabled={editing}>
                {editing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
                Guardar cambios
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* ============ CONFIRM DIALOG ============ */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl">Confirmar acci&oacute;n</CardTitle>
              <CardDescription>
                {confirmAction.type === 'changeState' ? (
                  <>
                    &iquest;Est&aacute;s seguro de que quer&eacute;s{' '}
                    <strong>
                      {confirmAction.newState === 'active' ? 'activar' : 'desactivar'}
                    </strong>{' '}
                    al usuario <strong>{confirmAction.userName}</strong>?
                  </>
                ) : (
                  <>
                    &iquest;Est&aacute;s seguro de que quer&eacute;s forzar el cambio de
                    contrase&ntilde;a de <strong>{confirmAction.userName}</strong>?
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {confirmAction.type === 'changeState'
                  ? 'El usuario deber&aacute; iniciar sesi&oacute;n nuevamente si se desactiva.'
                  : 'El usuario deber&aacute; cambiar su contrase&ntilde;a en el pr&oacute;ximo inicio de sesi&oacute;n.'}
              </p>
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setConfirmAction(null)}
                  disabled={confirming}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmExecute}
                  disabled={confirming}
                >
                  {confirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ejecutando...
                    </>
                  ) : confirmAction.type === 'changeState' ? (
                    <>
                      <ToggleLeft className="h-4 w-4" />
                      Confirmar
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Forzar cambio
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* User Detail Panel                                                   */
/* ------------------------------------------------------------------ */

function UserDetailPanel({
  userDetail,
  userPermissions,
  loading,
  tab,
  onTabChange,
  onClose,
  onEdit,
  onChangeState,
  onForcePassword,
  isSelf,
}: {
  userDetail: UserDetail | null;
  userPermissions: UserPermissionsResponse | null;
  loading: boolean;
  tab: 'info' | 'permissions';
  onTabChange: (tab: 'info' | 'permissions') => void;
  onClose: () => void;
  onEdit: () => void;
  onChangeState: (userId: string, userName: string, newState: string) => void;
  onForcePassword: (userId: string, userName: string) => void;
  isSelf: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userDetail) return null;

  const fullName = `${userDetail.firstName} ${userDetail.lastName}`;

  return (
    <>
      {/* Back + actions bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClose}>
          <ChevronLeft className="h-4 w-4" />
          Volver a la lista
        </Button>
        <div className="flex items-center gap-2">
          {!isSelf && (
            <>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onChangeState(
                    userDetail.id,
                    fullName,
                    getNextState(userDetail.state),
                  )
                }
              >
                <ToggleLeft className="h-4 w-4" />
                {userDetail.state === 'active' ? 'Desactivar' : 'Activar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onForcePassword(userDetail.id, fullName)}
              >
                <KeyRound className="h-4 w-4" />
                Forzar cambio clave
              </Button>
            </>
          )}
        </div>
      </div>

      {/* User info card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{fullName}</CardTitle>
              <CardDescription>{userDetail.email}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadgeVariant(userDetail.role)}>
                {getRoleLabel(userDetail.role)}
              </Badge>
              <Badge variant={getStateBadgeVariant(userDetail.state)}>
                {getStateLabel(userDetail.state)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="mb-6 flex gap-4 border-b border-border">
            <button
              type="button"
              className={`pb-2 text-sm font-medium transition-colors ${
                tab === 'info'
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => onTabChange('info')}
            >
              Informaci&oacute;n
            </button>
            <button
              type="button"
              className={`pb-2 text-sm font-medium transition-colors ${
                tab === 'permissions'
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => onTabChange('permissions')}
            >
              Permisos
            </button>
          </div>

          {tab === 'info' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="ID" value={userDetail.id} mono />
              <DetailField label="Email" value={userDetail.email} />
              <DetailField label="Nombre" value={userDetail.firstName} />
              <DetailField label="Apellido" value={userDetail.lastName} />
              <DetailField label="Rol" value={getRoleLabel(userDetail.role)} />
              <DetailField label="Estado" value={getStateLabel(userDetail.state)} />
              <DetailField
                label="Debe cambiar contrase&ntilde;a"
                value={userDetail.mustChangePassword ? 'Sí' : 'No'}
              />
              <DetailField
                label="Intentos fallidos"
                value={String(userDetail.failedLoginAttempts)}
              />
              <DetailField
                label="Bloqueado hasta"
                value={userDetail.lockedUntil ? formatDateTime(userDetail.lockedUntil) : '—'}
              />
              <DetailField
                label="Versi&oacute;n de token"
                value={String(userDetail.tokenVersion)}
              />
              <DetailField
                label="&Uacute;ltimo login"
                value={userDetail.lastLoginAt ? formatDateTime(userDetail.lastLoginAt) : '—'}
              />
              <DetailField label="Creado" value={formatDateTime(userDetail.createdAt)} />
              <DetailField label="Actualizado" value={formatDateTime(userDetail.updatedAt)} />
            </div>
          ) : (
            <PermissionsView userPermissions={userPermissions} />
          )}
        </CardContent>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Detail Field                                                        */
/* ------------------------------------------------------------------ */

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Permissions View                                                    */
/* ------------------------------------------------------------------ */

function PermissionsView({
  userPermissions,
}: {
  userPermissions: UserPermissionsResponse | null;
}) {
  if (!userPermissions) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group custom permissions by module
  const customByModule = groupByModule(userPermissions.custom);
  const inheritedByModule = groupByModule(
    userPermissions.inherited.permissions.map((p) => ({
      id: '',
      ...p,
    })),
  );

  return (
    <div className="space-y-6">
      {/* Custom permissions */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-foreground">
          Permisos personalizados
        </h4>
        {userPermissions.custom.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tiene permisos personalizados. Hereda los del rol.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(customByModule).map(([module, perms]) => (
              <div key={module}>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {module}
                </p>
                <div className="flex flex-wrap gap-2">
                  {perms.map((p, i) => (
                    <Badge key={p.id || i} variant="info">
                      {p.action} <span className="mx-1 opacity-50">&middot;</span> {p.scope}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inherited permissions */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-foreground">
          Permisos heredados del rol{' '}
          <Badge variant="secondary">{userPermissions.inherited.role}</Badge>
        </h4>
        {userPermissions.inherited.permissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay permisos heredados definidos.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(inheritedByModule).map(([module, perms]) => (
              <div key={module}>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {module}
                </p>
                <div className="flex flex-wrap gap-2">
                  {perms.map((p) => (
                    <Badge key={`inherited-${module}-${p.action}-${p.scope}`} variant="outline">
                      {p.action} <span className="mx-1 opacity-50">&middot;</span> {p.scope}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Utility                                                             */
/* ------------------------------------------------------------------ */

function groupByModule<T extends { module: string }>(items: T[]): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = item.module;
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}

function getNextState(currentState: string): string {
  if (currentState === 'active') return 'inactive';
  return 'active';
}
