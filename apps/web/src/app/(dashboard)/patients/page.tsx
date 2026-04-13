'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge,
  cn,
  hoverTransition,
  Input,
  Label,
  SkeletonTable,
} from '@sistema-odontologico/ui';
import { useAuth } from '@/hooks/use-auth';
import { useAbilities } from '@/hooks/use-abilities';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  changePatientState,
  getPatientMutuals,
  addPatientMutual,
  updatePatientMutual,
  removePatientMutual,
  getMutuals,
  type PatientListItem,
  type PatientDetail,
  type PatientMutual,
  type MutualCatalogItem,
  type PatientsFilters,
} from '@/lib/auth/api';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Plus,
  Eye,
  Edit,
  ToggleLeft,
  X,
  Users as UsersIcon,
  Building2,
  Trash2,
  FileText,
  Activity,
  DollarSign,
  Calendar,
  Pill,
  Wallet,
  Check,
  Pencil,
} from 'lucide-react';
import { Action, Module } from '@sistema-odontologico/permissions';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const STATES = [
  { value: '', label: 'Todos' },
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

function calculateAge(birthDate: string | null): string {
  if (!birthDate) return '—';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? `${age} años` : '—';
}

function getStateBadgeVariant(state: string): 'success' | 'secondary' {
  return state === 'active' ? 'success' : 'secondary';
}

function getStateLabel(state: string): string {
  return state === 'active' ? 'Activo' : 'Inactivo';
}

/* ------------------------------------------------------------------ */
/* Form validation                                                     */
/* ------------------------------------------------------------------ */

interface PatientFormErrors {
  firstName?: string;
  lastName?: string;
  dni?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  notes?: string;
}

function validatePatientForm(data: {
  firstName: string;
  lastName: string;
  dni?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  notes?: string;
}): PatientFormErrors {
  const errors: PatientFormErrors = {};
  if (!data.firstName.trim()) errors.firstName = 'El nombre es obligatorio';
  if (!data.lastName.trim()) errors.lastName = 'El apellido es obligatorio';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Formato de email inválido';
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* Mutual form validation                                              */
/* ------------------------------------------------------------------ */

interface MutualFormErrors {
  mutualId?: string;
  planName?: string;
  affiliateNumber?: string;
  coveragePercent?: string;
}

function validateMutualForm(data: {
  mutualId: string;
  planName: string;
  affiliateNumber: string;
  coveragePercent: number;
}): MutualFormErrors {
  const errors: MutualFormErrors = {};
  if (!data.mutualId) errors.mutualId = 'Seleccioná una obra social';
  if (!data.affiliateNumber.trim()) errors.affiliateNumber = 'Número de afiliado requerido';
  if (data.coveragePercent < 0 || data.coveragePercent > 100) {
    errors.coveragePercent = 'Debe ser entre 0 y 100';
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function PatientsPage() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const { hasAbility } = useAbilities();

  const canViewList = hasAbility(Module.PATIENTS, Action.VIEW_LIST);
  const canViewDetail = hasAbility(Module.PATIENTS, Action.VIEW_DETAIL);
  const canCreate = hasAbility(Module.PATIENTS, Action.CREATE);
  const canEdit = hasAbility(Module.PATIENTS, Action.EDIT);
  const canChangeState = hasAbility(Module.PATIENTS, Action.CHANGE_STATUS);

  // List state
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [stateFilter, setStateFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Detail panel
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetail, setPatientDetail] = useState<PatientDetail | null>(null);
  const [patientMutuals, setPatientMutuals] = useState<PatientMutual[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
    notes: '',
  });
  const [createErrors, setCreateErrors] = useState<PatientFormErrors>({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit form
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
    notes: '',
  });
  const [editErrors, setEditErrors] = useState<PatientFormErrors>({});
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Mutual form
  const [showMutualForm, setShowMutualForm] = useState(false);
  const [mutualForm, setMutualForm] = useState({
    mutualId: '',
    planName: '',
    affiliateNumber: '',
    coveragePercent: 0,
  });
  const [mutualErrors, setMutualErrors] = useState<MutualFormErrors>({});
  const [addingMutual, setAddingMutual] = useState(false);

  // Mutual catalog for combobox
  const [mutualCatalog, setMutualCatalog] = useState<MutualCatalogItem[]>([]);
  const [mutualSearch, setMutualSearch] = useState('');
  const [mutualCatalogLoading, setMutualCatalogLoading] = useState(false);
  const [showMutualDropdown, setShowMutualDropdown] = useState(false);

  // Edit mutual
  const [editingMutualId, setEditingMutualId] = useState<string | null>(null);
  const [editMutualForm, setEditMutualForm] = useState({
    planName: '',
    affiliateNumber: '',
    coveragePercent: 0,
  });
  const [editMutualErrors, setEditMutualErrors] = useState<MutualFormErrors>({});
  const [savingMutualEdit, setSavingMutualEdit] = useState(false);

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<{
    type: 'changeState';
    patientId: string;
    patientName: string;
    newState: 'active' | 'inactive';
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  /* ---- Data fetching ---- */

  const buildFilters = useCallback((): PatientsFilters => {
    const filters: PatientsFilters = { page, limit: PAGE_SIZE };
    if (stateFilter) filters.state = stateFilter as 'active' | 'inactive';
    if (searchFilter) filters.search = searchFilter;
    return filters;
  }, [page, stateFilter, searchFilter]);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPatients(buildFilters());
      setPatients(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  }, [buildFilters]);

  useEffect(() => {
    if (isAuthenticated && canViewList) {
      fetchPatients();
    }
  }, [isAuthenticated, canViewList, fetchPatients]);

  // Auto-open detail panel when patient ID is in URL (from global search)
  useEffect(() => {
    const patientId = searchParams.get('id');
    if (patientId && !selectedPatientId) {
      setSelectedPatientId(patientId);
    }
  }, [searchParams, selectedPatientId]);

  const fetchPatientDetail = useCallback(async (patientId: string) => {
    setDetailLoading(true);
    try {
      const [detail, mutuals] = await Promise.all([
        getPatient(patientId),
        getPatientMutuals(patientId),
      ]);
      setPatientDetail(detail);
      setPatientMutuals(mutuals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar detalle del paciente');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientDetail(selectedPatientId);
    }
  }, [selectedPatientId, fetchPatientDetail]);

  /* ---- Handlers ---- */

  const handleSearch = () => {
    setPage(1);
    fetchPatients();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleResetFilters = () => {
    setSearchFilter('');
    setStateFilter('');
    setPage(1);
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
  };

  const handleCloseDetail = () => {
    setSelectedPatientId(null);
    setPatientDetail(null);
    setPatientMutuals([]);
    setShowEditForm(false);
  };

  const handleOpenCreateForm = () => {
    setShowCreateForm(true);
    setCreateForm({
      firstName: '',
      lastName: '',
      dni: '',
      email: '',
      phone: '',
      birthDate: '',
      address: '',
      notes: '',
    });
    setCreateErrors({});
    setCreateError(null);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
    setCreateForm({
      firstName: '',
      lastName: '',
      dni: '',
      email: '',
      phone: '',
      birthDate: '',
      address: '',
      notes: '',
    });
    setCreateErrors({});
    setCreateError(null);
  };

  const handleCreatePatient = async () => {
    const errors = validatePatientForm(createForm);
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await createPatient({
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        dni: createForm.dni || undefined,
        email: createForm.email || undefined,
        phone: createForm.phone || undefined,
        birthDate: createForm.birthDate || undefined,
        address: createForm.address || undefined,
        notes: createForm.notes || undefined,
      });
      handleCloseCreateForm();
      fetchPatients();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error al crear paciente');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditForm = () => {
    if (!patientDetail) return;
    setEditForm({
      firstName: patientDetail.firstName,
      lastName: patientDetail.lastName,
      dni: patientDetail.dni ?? '',
      email: patientDetail.email ?? '',
      phone: patientDetail.phone ?? '',
      birthDate: patientDetail.birthDate
        ? (new Date(patientDetail.birthDate as string).toISOString().split('T')[0] ?? '')
        : '',
      address: patientDetail.address ?? '',
      notes: patientDetail.notes ?? '',
    });
    setEditErrors({});
    setEditError(null);
    setShowEditForm(true);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setEditError(null);
  };

  const handleUpdatePatient = async () => {
    if (!selectedPatientId) return;
    const errors = validatePatientForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setEditing(true);
    setEditError(null);
    try {
      await updatePatient(selectedPatientId, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        dni: editForm.dni || undefined,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        birthDate: editForm.birthDate || undefined,
        address: editForm.address || undefined,
        notes: editForm.notes || undefined,
      });
      setShowEditForm(false);
      fetchPatientDetail(selectedPatientId);
      fetchPatients();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error al actualizar paciente');
    } finally {
      setEditing(false);
    }
  };

  const handleChangeState = (
    patientId: string,
    patientName: string,
    newState: 'active' | 'inactive',
  ) => {
    setConfirmAction({ type: 'changeState', patientId, patientName, newState });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirming(true);
    try {
      if (confirmAction.type === 'changeState') {
        await changePatientState(confirmAction.patientId, confirmAction.newState);
        fetchPatients();
        if (selectedPatientId === confirmAction.patientId) {
          fetchPatientDetail(confirmAction.patientId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    } finally {
      setConfirming(false);
      setConfirmAction(null);
    }
  };

  const handleAddMutual = async () => {
    if (!selectedPatientId) return;
    const errors = validateMutualForm(mutualForm);
    if (Object.keys(errors).length > 0) {
      setMutualErrors(errors);
      return;
    }

    setAddingMutual(true);
    try {
      await addPatientMutual(selectedPatientId, {
        mutualId: mutualForm.mutualId,
        planName: mutualForm.planName || undefined,
        affiliateNumber: mutualForm.affiliateNumber,
        coveragePercent: mutualForm.coveragePercent || undefined,
        isActive: true,
      });
      setShowMutualForm(false);
      setMutualForm({ mutualId: '', planName: '', affiliateNumber: '', coveragePercent: 0 });
      setMutualSearch('');
      setMutualErrors({});
      fetchPatientDetail(selectedPatientId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar obra social');
    } finally {
      setAddingMutual(false);
    }
  };

  const handleRemoveMutual = async (mutualLinkId: string) => {
    if (!selectedPatientId) return;
    try {
      await removePatientMutual(selectedPatientId, mutualLinkId);
      fetchPatientDetail(selectedPatientId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar obra social');
    }
  };

  const handleStartEditMutual = (mutual: PatientMutual) => {
    setEditingMutualId(mutual.id);
    setEditMutualForm({
      planName: mutual.planName ?? '',
      affiliateNumber: mutual.affiliateNumber,
      coveragePercent: mutual.coveragePercent ?? 0,
    });
    setEditMutualErrors({});
  };

  const handleSaveEditMutual = async () => {
    if (!selectedPatientId || !editingMutualId) return;
    if (!editMutualForm.affiliateNumber.trim()) {
      setEditMutualErrors({ affiliateNumber: 'Número de afiliado requerido' });
      return;
    }
    if (editMutualForm.coveragePercent < 0 || editMutualForm.coveragePercent > 100) {
      setEditMutualErrors({ coveragePercent: 'Debe ser entre 0 y 100' });
      return;
    }

    setSavingMutualEdit(true);
    try {
      await updatePatientMutual(selectedPatientId, editingMutualId, {
        planName: editMutualForm.planName || undefined,
        affiliateNumber: editMutualForm.affiliateNumber,
        coveragePercent: editMutualForm.coveragePercent,
      });
      setEditingMutualId(null);
      fetchPatientDetail(selectedPatientId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar obra social');
    } finally {
      setSavingMutualEdit(false);
    }
  };

  // Fetch mutual catalog when form opens
  useEffect(() => {
    if (showMutualForm) {
      setMutualCatalogLoading(true);
      getMutuals({ limit: 100 })
        .then((result) => setMutualCatalog(result.data))
        .catch(() => setMutualCatalog([]))
        .finally(() => setMutualCatalogLoading(false));
    }
  }, [showMutualForm]);

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
        <UsersIcon className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No tenés permisos para ver pacientes.</p>
      </div>
    );
  }

  /* ---- Render ---- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión de pacientes del consultorio</p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo paciente
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
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="text-sm">
                Buscar
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="DNI, nombre o apellido..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="state" className="text-sm">
                Estado
              </Label>
              <select
                id="state"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {STATES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
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
            <SkeletonTable rows={5} columns={6} showHeader />
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <UsersIcon className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No se encontraron pacientes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      DNI
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Apellido
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Nombre
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Email
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Edad
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Estado
                    </th>
                    <th className="text-right text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors duration-150 ease-out"
                    >
                      <td className="px-4 py-3 text-sm font-mono tabular-nums">
                        {patient.dni ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">{patient.lastName}</td>
                      <td className="px-4 py-3 text-sm">{patient.firstName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {patient.email ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">{calculateAge(patient.birthDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={getStateBadgeVariant(patient.state)}>
                          {getStateLabel(patient.state)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canViewDetail && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectPatient(patient.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {canChangeState && patient.state === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleChangeState(
                                  patient.id,
                                  `${patient.firstName} ${patient.lastName}`,
                                  'inactive',
                                )
                              }
                            >
                              <ToggleLeft className="h-4 w-4" />
                            </Button>
                          )}
                          {canChangeState && patient.state === 'inactive' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleChangeState(
                                  patient.id,
                                  `${patient.firstName} ${patient.lastName}`,
                                  'active',
                                )
                              }
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
        {!loading && patients.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {patients.length} de {total} pacientes
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

      {/* Detail Panel */}
      {selectedPatientId && patientDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-xl font-semibold">
                  {patientDetail.firstName} {patientDetail.lastName}
                </h2>
                {patientDetail.dni && (
                  <p className="text-sm text-muted-foreground font-mono">
                    DNI: {patientDetail.dni}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseDetail}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Email</Label>
                  <p className="text-sm mt-1">{patientDetail.email ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Teléfono</Label>
                  <p className="text-sm mt-1">{patientDetail.phone ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">
                    Fecha de nacimiento
                  </Label>
                  <p className="text-sm mt-1">{formatDateShort(patientDetail.birthDate)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Edad</Label>
                  <p className="text-sm mt-1">{calculateAge(patientDetail.birthDate)}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground uppercase">Dirección</Label>
                  <p className="text-sm mt-1">{patientDetail.address ?? '—'}</p>
                </div>
                {patientDetail.notes && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground uppercase">Notas</Label>
                    <p className="text-sm mt-1">{patientDetail.notes}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Estado</Label>
                  <div className="mt-1">
                    <Badge variant={getStateBadgeVariant(patientDetail.state)}>
                      {getStateLabel(patientDetail.state)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Creado</Label>
                  <p className="text-sm mt-1">{formatDateTime(patientDetail.createdAt)}</p>
                </div>
              </div>

              {/* Quick links to related modules */}
              <div>
                <h3 className="text-base font-semibold mb-3">Módulos relacionados</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-3 text-center hover:bg-muted/60 transition-colors duration-150 ease-out"
                    title="Historia Clínica"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium">Historia Clínica</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-3 text-center hover:bg-muted/60 transition-colors duration-150 ease-out"
                    title="Odontograma"
                  >
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium">Odontograma</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-3 text-center hover:bg-muted/60 transition-colors duration-150 ease-out"
                    title="Cuenta Corriente"
                  >
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium">Cuenta Corriente</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-3 text-center hover:bg-muted/60 transition-colors duration-150 ease-out"
                    title="Turnos"
                  >
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium">Turnos</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-3 text-center hover:bg-muted/60 transition-colors duration-150 ease-out"
                    title="Depósitos"
                  >
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium">Depósitos</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-3 text-center hover:bg-muted/60 transition-colors duration-150 ease-out"
                    title="Recetas"
                  >
                    <Pill className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium">Recetas</span>
                  </button>
                </div>
              </div>

              {/* Mutuals section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Obras Sociales
                  </h3>
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => setShowMutualForm(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  )}
                </div>

                {showMutualForm && (
                  <Card className="mb-4">
                    <CardContent className="pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Mutual catalog selector (combobox) */}
                        <div className="col-span-2">
                          <Label className="text-sm">Obra Social *</Label>
                          <div className="relative mt-1">
                            <Input
                              value={mutualSearch}
                              onChange={(e) => {
                                setMutualSearch(e.target.value);
                                setShowMutualDropdown(true);
                                setMutualForm({ ...mutualForm, mutualId: '' });
                              }}
                              onFocus={() => setShowMutualDropdown(true)}
                              placeholder={
                                mutualForm.mutualId && mutualCatalog.length > 0
                                  ? (mutualCatalog.find((m) => m.id === mutualForm.mutualId)
                                      ?.name ?? 'Buscar obra social...')
                                  : 'Buscar obra social...'
                              }
                              disabled={mutualCatalogLoading}
                            />
                            {mutualCatalogLoading && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {/* Show selected mutual */}
                            {mutualForm.mutualId && !showMutualDropdown && (
                              <button
                                type="button"
                                className={cn(
                                  'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer',
                                  hoverTransition,
                                )}
                                onClick={() => {
                                  setMutualForm({ ...mutualForm, mutualId: '' });
                                  setMutualSearch('');
                                }}
                              >
                                <X
                                  className={cn(
                                    'h-4 w-4 text-muted-foreground hover:text-foreground',
                                    hoverTransition,
                                  )}
                                />
                              </button>
                            )}
                            {/* Dropdown */}
                            {showMutualDropdown && mutualCatalog.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-md max-h-[200px] overflow-y-auto">
                                {mutualCatalog
                                  .filter(
                                    (m) =>
                                      !mutualSearch ||
                                      m.name.toLowerCase().includes(mutualSearch.toLowerCase()) ||
                                      m.code.toLowerCase().includes(mutualSearch.toLowerCase()),
                                  )
                                  .map((m) => (
                                    <button
                                      key={m.id}
                                      type="button"
                                      className={`flex w-full items-center justify-between px-3 py-2 text-sm ${hoverTransition} hover:bg-muted/60 ${
                                        mutualForm.mutualId === m.id ? 'bg-primary-subtle' : ''
                                      }`}
                                      onClick={() => {
                                        setMutualForm({ ...mutualForm, mutualId: m.id });
                                        setMutualSearch(m.name);
                                        setShowMutualDropdown(false);
                                        setMutualErrors((prev) => ({
                                          ...prev,
                                          mutualId: undefined,
                                        }));
                                      }}
                                    >
                                      <span>{m.name}</span>
                                      <span className="text-xs text-muted-foreground font-mono">
                                        {m.code}
                                      </span>
                                    </button>
                                  ))}
                                {mutualCatalog.filter(
                                  (m) =>
                                    !mutualSearch ||
                                    m.name.toLowerCase().includes(mutualSearch.toLowerCase()) ||
                                    m.code.toLowerCase().includes(mutualSearch.toLowerCase()),
                                ).length === 0 && (
                                  <p className="px-3 py-2 text-sm text-muted-foreground">
                                    Sin resultados
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          {mutualErrors.mutualId && (
                            <p className="text-xs text-destructive mt-1">{mutualErrors.mutualId}</p>
                          )}
                          {mutualForm.mutualId && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Seleccionada:{' '}
                              <span className="font-medium text-foreground">
                                {mutualCatalog.find((m) => m.id === mutualForm.mutualId)?.name}
                              </span>{' '}
                              ({mutualCatalog.find((m) => m.id === mutualForm.mutualId)?.code})
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm">Plan</Label>
                          <Input
                            value={mutualForm.planName}
                            onChange={(e) =>
                              setMutualForm({ ...mutualForm, planName: e.target.value })
                            }
                            placeholder="Ej: 210"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">N° Afiliado *</Label>
                          <Input
                            value={mutualForm.affiliateNumber}
                            onChange={(e) =>
                              setMutualForm({ ...mutualForm, affiliateNumber: e.target.value })
                            }
                            placeholder="Ej: 12345"
                          />
                          {mutualErrors.affiliateNumber && (
                            <p className="text-xs text-destructive mt-1">
                              {mutualErrors.affiliateNumber}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm">Cobertura (%)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={mutualForm.coveragePercent}
                            onChange={(e) =>
                              setMutualForm({
                                ...mutualForm,
                                coveragePercent: Number(e.target.value),
                              })
                            }
                          />
                          {mutualErrors.coveragePercent && (
                            <p className="text-xs text-destructive mt-1">
                              {mutualErrors.coveragePercent}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowMutualForm(false);
                            setMutualErrors({});
                            setMutualSearch('');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAddMutual}
                          disabled={addingMutual || !mutualForm.mutualId}
                        >
                          {addingMutual && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                          Agregar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {patientMutuals.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Sin obras sociales registradas
                  </p>
                ) : (
                  <div className="space-y-2">
                    {patientMutuals.map((mutual) => (
                      <div
                        key={mutual.id}
                        className="p-3 rounded-lg border border-border bg-muted/30"
                      >
                        {editingMutualId === mutual.id ? (
                          /* Edit mode */
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">
                                {mutual.mutualName ?? 'Obra Social'}
                                {mutual.mutualCode && (
                                  <span className="text-xs font-mono text-muted-foreground ml-2">
                                    {mutual.mutualCode}
                                  </span>
                                )}
                              </p>
                              <Badge variant={mutual.isActive ? 'success' : 'secondary'}>
                                {mutual.isActive ? 'Activa' : 'Inactiva'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">Plan</Label>
                                <Input
                                  value={editMutualForm.planName}
                                  onChange={(e) =>
                                    setEditMutualForm({
                                      ...editMutualForm,
                                      planName: e.target.value,
                                    })
                                  }
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">N° Afiliado</Label>
                                <Input
                                  value={editMutualForm.affiliateNumber}
                                  onChange={(e) =>
                                    setEditMutualForm({
                                      ...editMutualForm,
                                      affiliateNumber: e.target.value,
                                    })
                                  }
                                  className="h-8 text-sm"
                                />
                                {editMutualErrors.affiliateNumber && (
                                  <p className="text-xs text-destructive mt-0.5">
                                    {editMutualErrors.affiliateNumber}
                                  </p>
                                )}
                              </div>
                              <div>
                                <Label className="text-xs">Cobertura (%)</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={editMutualForm.coveragePercent}
                                  onChange={(e) =>
                                    setEditMutualForm({
                                      ...editMutualForm,
                                      coveragePercent: Number(e.target.value),
                                    })
                                  }
                                  className="h-8 text-sm"
                                />
                                {editMutualErrors.coveragePercent && (
                                  <p className="text-xs text-destructive mt-0.5">
                                    {editMutualErrors.coveragePercent}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingMutualId(null)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveEditMutual}
                                disabled={savingMutualEdit}
                              >
                                {savingMutualEdit && (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                )}
                                <Check className="h-4 w-4 mr-1" />
                                Guardar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Display mode */
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {mutual.mutualName ?? 'Obra Social'}
                                </p>
                                {mutual.mutualCode && (
                                  <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                                    {mutual.mutualCode}
                                  </span>
                                )}
                                <Badge variant={mutual.isActive ? 'success' : 'secondary'}>
                                  {mutual.isActive ? 'Activa' : 'Inactiva'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {mutual.planName && <span>Plan: {mutual.planName} · </span>}
                                Afiliado: {mutual.affiliateNumber}
                                {mutual.coveragePercent != null &&
                                  ` · Cobertura: ${mutual.coveragePercent}%`}
                              </p>
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartEditMutual(mutual)}
                                  title="Editar datos de afiliación"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveMutual(mutual.id)}
                                  title="Eliminar obra social"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Edit button */}
              {canEdit && !showEditForm && (
                <div className="flex justify-end">
                  <Button onClick={handleOpenEditForm}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar paciente
                  </Button>
                </div>
              )}

              {/* Edit form */}
              {showEditForm && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Editar paciente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {editError && <p className="text-sm text-destructive">{editError}</p>}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Nombre *</Label>
                        <Input
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        />
                        {editErrors.firstName && (
                          <p className="text-xs text-destructive mt-1">{editErrors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm">Apellido *</Label>
                        <Input
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        />
                        {editErrors.lastName && (
                          <p className="text-xs text-destructive mt-1">{editErrors.lastName}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm">DNI</Label>
                        <Input
                          value={editForm.dni}
                          onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Email</Label>
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                        {editErrors.email && (
                          <p className="text-xs text-destructive mt-1">{editErrors.email}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm">Teléfono</Label>
                        <Input
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Fecha de nacimiento</Label>
                        <Input
                          type="date"
                          value={editForm.birthDate}
                          onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm">Dirección</Label>
                        <Input
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm">Notas</Label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t border-border">
                    <Button variant="ghost" onClick={handleCloseEditForm}>
                      Cancelar
                    </Button>
                    <Button onClick={handleUpdatePatient} disabled={editing}>
                      {editing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Guardar cambios
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-semibold">Nuevo paciente</h2>
              <Button variant="ghost" size="sm" onClick={handleCloseCreateForm}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {createError && <p className="text-sm text-destructive">{createError}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Nombre *</Label>
                  <Input
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    placeholder="Juan"
                  />
                  {createErrors.firstName && (
                    <p className="text-xs text-destructive mt-1">{createErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm">Apellido *</Label>
                  <Input
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    placeholder="Pérez"
                  />
                  {createErrors.lastName && (
                    <p className="text-xs text-destructive mt-1">{createErrors.lastName}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm">DNI</Label>
                  <Input
                    value={createForm.dni}
                    onChange={(e) => setCreateForm({ ...createForm, dni: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <Label className="text-sm">Email</Label>
                  <Input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="juan@email.com"
                  />
                  {createErrors.email && (
                    <p className="text-xs text-destructive mt-1">{createErrors.email}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm">Teléfono</Label>
                  <Input
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+54 11 1234-5678"
                  />
                </div>
                <div>
                  <Label className="text-sm">Fecha de nacimiento</Label>
                  <Input
                    type="date"
                    value={createForm.birthDate}
                    onChange={(e) => setCreateForm({ ...createForm, birthDate: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm">Dirección</Label>
                  <Input
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    placeholder="Calle 123, Ciudad"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm">Notas</Label>
                  <textarea
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    placeholder="Alergias, condiciones especiales, etc."
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={handleCloseCreateForm}>
                Cancelar
              </Button>
              <Button onClick={handleCreatePatient} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear paciente
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-sm p-6 m-4">
            <h3 className="text-lg font-semibold mb-2">Confirmar cambio de estado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ¿Estás seguro de que querés cambiar el estado de{' '}
              <strong>{confirmAction.patientName}</strong> a{' '}
              <strong>{confirmAction.newState === 'active' ? 'Activo' : 'Inactivo'}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmAction(null)}>
                Cancelar
              </Button>
              <Button
                variant={confirmAction.newState === 'inactive' ? 'destructive' : 'default'}
                onClick={handleConfirmAction}
                disabled={confirming}
              >
                {confirming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
