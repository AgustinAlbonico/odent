'use client';

import { Action, Module } from '@sistema-odontologico/permissions';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  focusRing,
  hoverTransition,
  Input,
  interactiveTransition,
  Label,
} from '@sistema-odontologico/ui';
import { addDays, format, isValid, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Camera,
  Clock3,
  Loader2,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
  X,
  ZoomIn,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WeeklyGrid } from '@/components/appointments/calendar/WeeklyGrid';
import { WeekNav } from '@/components/appointments/calendar/WeekNav';
import { PhotoCropModal } from '@/components/photo-crop-modal';
import { useAbilities } from '@/hooks/use-abilities';
import { useAuth } from '@/hooks/use-auth';
import {
  type AppointmentListItem,
  type Exception,
  getAppointments,
  getExceptions,
  getSchedules,
  type Schedule,
} from '@/lib/appointments-api';
import {
  addProfessionalMutual,
  deleteProfessionalPhoto,
  getMutuals,
  getProfessional,
  getProfessionalMutuals,
  type MutualCatalogItem,
  type ProfessionalDetail,
  type ProfessionalMutual,
  removeProfessionalMutual,
  uploadProfessionalPhoto,
} from '@/lib/auth/api';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

function formatDateTime(value: string | null): string {
  if (!value) return 'Sin registro';
  const parsed = parseISO(value);
  if (!isValid(parsed)) return 'Sin registro';
  return format(parsed, "d 'de' MMM yyyy, HH:mm", { locale: es });
}

function formatDate(value: string): string {
  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;
  return format(parsed, "d 'de' MMM yyyy", { locale: es });
}

function getStateBadgeVariant(state: string): 'success' | 'secondary' {
  return state === 'active' ? 'success' : 'secondary';
}

function getStateLabel(state: string): string {
  return state === 'active' ? 'Activo' : 'Inactivo';
}

function getAppointmentStatusMeta(status: string): {
  label: string;
  variant: 'warning' | 'success' | 'secondary' | 'destructive' | 'info';
} {
  switch (status) {
    case 'pending':
      return { label: 'Pendiente', variant: 'warning' };
    case 'confirmed':
      return { label: 'Confirmado', variant: 'success' };
    case 'waiting':
      return { label: 'En espera', variant: 'info' };
    case 'attended':
      return { label: 'Atendido', variant: 'success' };
    case 'no_show':
      return { label: 'Ausente', variant: 'destructive' };
    default:
      return { label: 'Cancelado', variant: 'secondary' };
  }
}

export default function ProfessionalDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const professionalId = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAbility } = useAbilities();

  const canView = hasAbility(Module.PROFESSIONALS, Action.VIEW_DETAIL);
  const canEdit = hasAbility(Module.PROFESSIONALS, Action.EDIT);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [professional, setProfessional] = useState<ProfessionalDetail | null>(null);
  const [professionalMutuals, setProfessionalMutuals] = useState<ProfessionalMutual[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddMutual, setShowAddMutual] = useState(false);
  const [mutualCatalog, setMutualCatalog] = useState<MutualCatalogItem[]>([]);
  const [mutualSearch, setMutualSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMutualId, setSelectedMutualId] = useState('');
  const [addingMutual, setAddingMutual] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [removingMutualId, setRemovingMutualId] = useState<string | null>(null);

  // Photo upload state
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoDeleting, setPhotoDeleting] = useState(false);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const professionalFullName = professional
    ? `${professional.firstName} ${professional.lastName}`
    : 'Profesional';
  const professionalInitials = professional
    ? `${professional.firstName.charAt(0)}${professional.lastName.charAt(0)}`
    : '';
  const hasProfessionalPhoto = Boolean(professional?.photoUrl);

  const fetchProfessionalDetail = useCallback(async () => {
    if (!professionalId) return;

    setLoading(true);
    setError(null);

    const today = startOfDay(new Date());
    const dateFrom = format(today, 'yyyy-MM-dd');
    const dateTo = format(addDays(today, 30), 'yyyy-MM-dd');

    try {
      const [userResult, mutualsResult, schedulesResult, exceptionsResult, appointmentsResult] =
        await Promise.allSettled([
          getProfessional(professionalId),
          getProfessionalMutuals(professionalId),
          getSchedules(professionalId),
          getExceptions(professionalId, dateFrom, dateTo),
          getAppointments({
            professionalId,
            page: 1,
            limit: 6,
            dateFrom,
          }),
        ]);

      if (userResult.status !== 'fulfilled') {
        throw userResult.reason;
      }

      if (userResult.value.role !== 'profesional') {
        throw new Error('El usuario seleccionado no corresponde a un profesional.');
      }

      setProfessional(userResult.value);
      setProfessionalMutuals(mutualsResult.status === 'fulfilled' ? mutualsResult.value : []);
      setSchedules(
        schedulesResult.status === 'fulfilled'
          ? [...schedulesResult.value]
              .filter((schedule) => schedule.isActive)
              .sort((left, right) => {
                if (left.dayOfWeek !== right.dayOfWeek) {
                  return left.dayOfWeek - right.dayOfWeek;
                }

                return left.startTime.localeCompare(right.startTime);
              })
          : [],
      );
      setExceptions(
        exceptionsResult.status === 'fulfilled'
          ? [...exceptionsResult.value].sort((left, right) => {
              const leftKey = `${left.startDate}-${left.startTime ?? '00:00'}`;
              const rightKey = `${right.startDate}-${right.startTime ?? '00:00'}`;
              return leftKey.localeCompare(rightKey);
            })
          : [],
      );
      setUpcomingAppointments(
        appointmentsResult.status === 'fulfilled' ? appointmentsResult.value.data : [],
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la ficha del profesional.');
      setProfessional(null);
      setProfessionalMutuals([]);
      setSchedules([]);
      setExceptions([]);
      setUpcomingAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    if (isAuthenticated && canView) {
      fetchProfessionalDetail();
    }
  }, [canView, fetchProfessionalDetail, isAuthenticated]);

  useEffect(() => {
    if (!showAddMutual) return;

    setCatalogLoading(true);
    getMutuals({ limit: 100 })
      .then((result) => setMutualCatalog(result.data))
      .catch(() => setMutualCatalog([]))
      .finally(() => setCatalogLoading(false));
  }, [showAddMutual]);

  const alreadySelectedIds = useMemo(
    () => new Set(professionalMutuals.map((mutual) => mutual.mutualId)),
    [professionalMutuals],
  );

  const filteredCatalog = useMemo(
    () =>
      mutualCatalog
        .filter((mutual) => !alreadySelectedIds.has(mutual.id))
        .filter((mutual) => {
          if (!mutualSearch.trim()) return true;

          const search = mutualSearch.trim().toLowerCase();
          return (
            mutual.name.toLowerCase().includes(search) || mutual.code.toLowerCase().includes(search)
          );
        }),
    [alreadySelectedIds, mutualCatalog, mutualSearch],
  );

  const handleAddMutual = async () => {
    if (!professionalId || !selectedMutualId) return;

    setAddingMutual(true);
    try {
      await addProfessionalMutual(professionalId, { mutualId: selectedMutualId });
      setShowAddMutual(false);
      setSelectedMutualId('');
      setMutualSearch('');
      await fetchProfessionalDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar la mutual.');
    } finally {
      setAddingMutual(false);
    }
  };

  const handleRemoveMutual = async (mutualId: string) => {
    if (!professionalId) return;

    setRemovingMutualId(mutualId);
    try {
      await removeProfessionalMutual(professionalId, mutualId);
      await fetchProfessionalDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar la mutual.');
    } finally {
      setRemovingMutualId(null);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropOpen(true);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handlePhotoUpload = async (croppedBlob: Blob) => {
    if (!professionalId) return;
    setPhotoUploading(true);
    try {
      await uploadProfessionalPhoto(professionalId, croppedBlob);
      setCropOpen(false);
      setCropFile(null);
      await fetchProfessionalDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!professionalId || !professional?.photoUrl) return;
    setPhotoDeleting(true);
    try {
      await deleteProfessionalPhoto(professionalId);
      await fetchProfessionalDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la foto.');
    } finally {
      setPhotoDeleting(false);
    }
  };

  useEffect(() => {
    if (!isPhotoLightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPhotoLightboxOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPhotoLightboxOpen]);

  useEffect(() => {
    if (!hasProfessionalPhoto && isPhotoLightboxOpen) {
      setIsPhotoLightboxOpen(false);
    }
  }, [hasProfessionalPhoto, isPhotoLightboxOpen]);

  if (authLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !canView) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Stethoscope className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          No tenés permisos para ver la ficha del profesional.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push('/professionals')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a profesionales
          </Button>
          <h1 className="mt-2 text-2xl font-semibold">Ficha del profesional</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Datos operativos, mutuales habilitadas y agenda semanal del profesional.
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading || !professional ? (
        <div
          className="space-y-4"
          aria-busy="true"
          aria-label="Cargando ficha del profesional"
          role="status"
        >
          <Card>
            <CardContent className="h-40 animate-pulse rounded-xl bg-muted" />
          </Card>
          <Card>
            <CardContent className="h-80 animate-pulse rounded-xl bg-muted" />
          </Card>
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="relative inline-block">
                    {hasProfessionalPhoto ? (
                      <button
                        type="button"
                        onClick={() => setIsPhotoLightboxOpen(true)}
                        aria-label={`Ampliar foto de ${professionalFullName}`}
                        aria-haspopup="dialog"
                        className={cn(
                          'group relative rounded-full cursor-pointer hover:opacity-95 hover:shadow-sm',
                          interactiveTransition,
                          focusRing,
                        )}
                      >
                        <Avatar
                          src={professional.photoUrl}
                          alt={professionalFullName}
                          fallback={professionalInitials}
                          size="xl"
                          className={cn(
                            'h-32 w-32 border border-border text-3xl group-hover:opacity-85',
                            interactiveTransition,
                          )}
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            'pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/20 opacity-0 group-hover:opacity-100',
                            interactiveTransition,
                          )}
                        >
                          <ZoomIn className="h-7 w-7 text-white drop-shadow-sm" />
                        </span>
                      </button>
                    ) : (
                      <Avatar
                        src={professional.photoUrl}
                        alt={professionalFullName}
                        fallback={professionalInitials}
                        size="xl"
                        className="h-32 w-32 border border-border text-3xl"
                      />
                    )}
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            photoInputRef.current?.click();
                          }}
                          className={cn(
                            'absolute -bottom-1 -right-1 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
                            hoverTransition,
                            focusRing,
                          )}
                          aria-label="Cambiar foto"
                          disabled={photoUploading}
                        >
                          {photoUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </button>
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoSelect}
                        />
                      </>
                    )}
                    {canEdit && professional.photoUrl && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handlePhotoDelete();
                        }}
                        className={cn(
                          'absolute -bottom-1 -left-1 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
                          hoverTransition,
                          focusRing,
                        )}
                        aria-label="Eliminar foto"
                        disabled={photoDeleting}
                      >
                        {photoDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      {professional.firstName} {professional.lastName}
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {professional.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="info">Profesional</Badge>
                    <Badge variant={getStateBadgeVariant(professional.state)}>
                      {getStateLabel(professional.state)}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:min-w-[360px]">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Ultimo acceso
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {formatDateTime(professional.lastLoginAt)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Alta en sistema
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {formatDateTime(professional.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Mutuales habilitadas</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {professionalMutuals.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Horarios activos</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{schedules.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Excepciones proximas</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{exceptions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Proximos turnos</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {upcomingAppointments.length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agenda operativa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <WeekNav
                    currentDate={currentDate}
                    onDateJump={setCurrentDate}
                    onDateSelect={setCurrentDate}
                  />
                  <WeeklyGrid
                    professionalId={professionalId}
                    weekDate={currentDate}
                    selectedDate={currentDate}
                    onDateSelect={setCurrentDate}
                    onEventClick={(appointmentId) => router.push(`/appointments/${appointmentId}`)}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Mutuales habilitadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canEdit && !showAddMutual && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddMutual(true);
                        setSelectedMutualId('');
                        setMutualSearch('');
                      }}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar mutual
                    </Button>
                  )}

                  {showAddMutual && (
                    <Card>
                      <CardContent className="pt-4 space-y-3">
                        <div>
                          <Label className="text-sm">Buscar obra social</Label>
                          <div className="relative mt-1">
                            <Input
                              value={mutualSearch}
                              onChange={(event) => {
                                setMutualSearch(event.target.value);
                                setShowDropdown(true);
                                setSelectedMutualId('');
                              }}
                              onFocus={() => setShowDropdown(true)}
                              placeholder="Buscar por nombre o codigo..."
                              disabled={catalogLoading}
                            />
                            {catalogLoading && (
                              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                            )}
                            {showDropdown && filteredCatalog.length > 0 && (
                              <div className="absolute z-10 mt-1 max-h-[200px] w-full overflow-y-auto rounded-lg border border-border bg-background shadow-md">
                                {filteredCatalog.map((mutual) => (
                                  <button
                                    key={mutual.id}
                                    type="button"
                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${hoverTransition} hover:bg-muted/60 ${
                                      selectedMutualId === mutual.id ? 'bg-primary-subtle' : ''
                                    }`}
                                    onClick={() => {
                                      setSelectedMutualId(mutual.id);
                                      setMutualSearch(mutual.name);
                                      setShowDropdown(false);
                                    }}
                                  >
                                    <span>{mutual.name}</span>
                                    <span className="text-xs font-mono text-muted-foreground">
                                      {mutual.code}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                            {showDropdown &&
                              filteredCatalog.length === 0 &&
                              mutualCatalog.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-background p-3 shadow-md">
                                  <p className="text-sm text-muted-foreground">
                                    {mutualSearch
                                      ? 'Sin resultados para esa busqueda.'
                                      : 'Todas las mutuales ya fueron agregadas.'}
                                  </p>
                                </div>
                              )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowAddMutual(false);
                              setSelectedMutualId('');
                              setMutualSearch('');
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddMutual}
                            disabled={addingMutual || !selectedMutualId}
                          >
                            {addingMutual && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                            Agregar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {professionalMutuals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin mutuales habilitadas.</p>
                  ) : (
                    <div className="space-y-2">
                      {professionalMutuals.map((mutual) => (
                        <div
                          key={mutual.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {mutual.mutualName ?? 'Mutual'}
                            </p>
                            {mutual.mutualCode && (
                              <p className="text-xs font-mono text-muted-foreground">
                                {mutual.mutualCode}
                              </p>
                            )}
                          </div>
                          {canEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMutual(mutual.mutualId)}
                              disabled={removingMutualId === mutual.mutualId}
                            >
                              {removingMutualId === mutual.mutualId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock3 className="h-5 w-5" />
                    Horarios de atencion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {schedules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin horarios configurados.</p>
                  ) : (
                    <div className="space-y-2">
                      {schedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="rounded-lg border border-border bg-muted/30 px-3 py-2"
                        >
                          <p className="text-sm font-medium text-foreground">
                            {DAY_LABELS[schedule.dayOfWeek] ?? `Dia ${schedule.dayOfWeek}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {schedule.startTime} a {schedule.endTime} ·{' '}
                            {schedule.slotDurationMinutes} min
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Excepciones proximas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {exceptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin excepciones proximas.</p>
                  ) : (
                    <div className="space-y-2">
                      {exceptions.slice(0, 5).map((exception) => (
                        <div
                          key={exception.id}
                          className="rounded-lg border border-border bg-muted/30 px-3 py-2"
                        >
                          <p className="text-sm font-medium text-foreground">{exception.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(exception.startDate)}
                            {exception.startDate !== exception.endDate
                              ? ` al ${formatDate(exception.endDate)}`
                              : ''}
                            {exception.startTime ? ` · ${exception.startTime}` : ' · Todo el dia'}
                            {exception.endTime ? ` a ${exception.endTime}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5" />
                    Proximos turnos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay turnos proximos.</p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingAppointments.map((appointment) => {
                        const status = getAppointmentStatusMeta(appointment.status);

                        return (
                          <button
                            key={appointment.id}
                            type="button"
                            onClick={() => router.push(`/appointments/${appointment.id}`)}
                            className={cn(
                              'w-full rounded-lg border border-border bg-muted/30 px-3 py-3 text-left hover:bg-muted/50',
                              hoverTransition,
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {appointment.patientName}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatDateTime(appointment.startAt)}
                                </p>
                                {appointment.patientDni && (
                                  <p className="text-xs font-mono text-muted-foreground">
                                    DNI: {appointment.patientDni}
                                  </p>
                                )}
                              </div>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <PhotoCropModal
        imageFile={cropFile!}
        open={cropOpen}
        onConfirm={handlePhotoUpload}
        onCancel={() => {
          setCropOpen(false);
          setCropFile(null);
        }}
      />

      {isPhotoLightboxOpen && professional?.photoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Vista ampliada de ${professionalFullName}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsPhotoLightboxOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-4xl rounded-lg border border-border bg-card p-3 shadow-lg sm:p-4">
            <button
              type="button"
              onClick={() => setIsPhotoLightboxOpen(false)}
              aria-label="Cerrar vista ampliada de la foto"
              className={cn(
                'absolute right-3 top-3 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                hoverTransition,
                focusRing,
              )}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex max-h-[80vh] items-center justify-center overflow-hidden rounded-lg bg-muted/30 p-2 sm:p-4">
              <img
                src={professional.photoUrl}
                alt={professionalFullName}
                className="max-h-[72vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
