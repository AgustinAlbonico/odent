'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAbilities } from '@/hooks/use-abilities';
import { Module, Action } from '@sistema-odontologico/permissions';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Label,
  Input,
  SkeletonTable,
} from '@sistema-odontologico/ui';
import {
  getSchedules,
  createSchedule,
  deleteSchedule,
  getProfessionals,
  type Schedule,
  type ProfessionalSelectItem,
} from '@/lib/appointments-api';
import { Plus, Trash2, Loader2, Clock } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function SchedulesPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { hasAbility } = useAbilities();
  const canView = hasAbility(Module.TURNS, Action.VIEW_LIST);
  const canCreate = hasAbility(Module.TURNS, Action.CREATE);

  const isProfessional = user?.role === 'profesional';

  /* ------ Data state ------ */
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalSelectItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* ------ CRUD form state ------ */
  const [showForm, setShowForm] = useState(false);
  const [formProfessionalId, setFormProfessionalId] = useState('');
  const [formDayOfWeek, setFormDayOfWeek] = useState(1);
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('18:00');
  const [formSlotDuration, setFormSlotDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState<{
    id: string;
    dayName: string;
    timeRange: string;
  } | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState(false);

  /* ------ Auto-select professional when user is profesional ------ */
  useEffect(() => {
    if (authLoading) return;

    if (isProfessional && user?.id) {
      setFormProfessionalId(user.id);
    }
  }, [authLoading, isProfessional, user?.id]);

  /* ------ Load initial data ------ */
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    const profId = isProfessional && user?.id ? user.id : undefined;

    if (profId) {
      if (!cancelled) setProfessionals([]);

      // Professional user: load only their schedules
      getSchedules(profId)
        .then((scheds) => {
          if (!cancelled) setSchedules(scheds);
        })
        .catch(() => {
          if (!cancelled) setSchedules([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      getProfessionals()
        .then((profs) => {
          if (!cancelled) setProfessionals(profs);
        })
        .catch(() => {
          if (!cancelled) setProfessionals([]);
        });

      // Admin/assistant: load all schedules
      getSchedules()
        .then((scheds) => {
          if (!cancelled) setSchedules(scheds);
        })
        .catch(() => {
          if (!cancelled) setSchedules([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [authLoading, isProfessional, user?.id]);

  /* ------ Handlers ------ */

  const handleCreateSchedule = async () => {
    if (!formProfessionalId) {
      setFormError('Seleccioná un profesional');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const newSchedule = await createSchedule({
        professionalId: formProfessionalId,
        dayOfWeek: formDayOfWeek,
        startTime: formStartTime,
        endTime: formEndTime,
        slotDurationMinutes: formSlotDuration,
      });
      setSchedules((prev) => [...prev, newSchedule]);
      setShowForm(false);
      setFormProfessionalId(isProfessional && user?.id ? user.id : '');
      setFormDayOfWeek(1);
      setFormStartTime('08:00');
      setFormEndTime('18:00');
      setFormSlotDuration(30);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear horario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = (id: string, dayName: string, timeRange: string) => {
    setDeleteScheduleTarget({ id, dayName, timeRange });
  };

  const confirmDeleteSchedule = async () => {
    if (!deleteScheduleTarget) return;
    setDeletingSchedule(true);
    try {
      await deleteSchedule(deleteScheduleTarget.id);
      setSchedules((prev) => prev.filter((s) => s.id !== deleteScheduleTarget.id));
      setDeleteScheduleTarget(null);
    } catch {
      // silent
    } finally {
      setDeletingSchedule(false);
    }
  };

  /* ------ Grouped schedules ------ */
  const grouped = useMemo(() => {
    return schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
      if (!acc[s.professionalId]) acc[s.professionalId] = [];
      acc[s.professionalId]!.push(s);
      return acc;
    }, {});
  }, [schedules]);

  /* ------ Auth/loading guards ------ */

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Clock className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No tenés permisos para gestionar horarios.</p>
      </div>
    );
  }

  /* ------ Render ------ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Horarios de atención</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Configurá los horarios de atención de los profesionales
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo horario
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Create form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agregar horario</CardTitle>
              <CardDescription>
                Definí un nuevo bloque de atención para un profesional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {!isProfessional && (
                  <div>
                    <Label className="text-sm">Profesional *</Label>
                    <select
                      value={formProfessionalId}
                      onChange={(e) => setFormProfessionalId(e.target.value)}
                      className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Seleccionar...</option>
                      {professionals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <Label className="text-sm">Día</Label>
                  <select
                    value={formDayOfWeek}
                    onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                    className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {DAYS_FULL.map((day, i) => (
                      <option key={day} value={i}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Hora inicio</Label>
                  <Input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Hora fin</Label>
                  <Input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Duración del turno (min)</Label>
                  <select
                    value={formSlotDuration}
                    onChange={(e) => setFormSlotDuration(Number(e.target.value))}
                    className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSchedule} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedules table */}
        {loading ? (
          <SkeletonTable rows={4} columns={5} showHeader />
        ) : Object.keys(grouped).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <Clock className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No hay horarios configurados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([profId, profSchedules]) => {
              const profName = profSchedules[0]?.professionalName ?? 'Profesional';
              return (
                <Card key={profId}>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base">{profName}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                            Día
                          </th>
                          <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                            Inicio
                          </th>
                          <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                            Fin
                          </th>
                          <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                            Duración
                          </th>
                          <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                            Estado
                          </th>
                          {canCreate && (
                            <th className="text-right text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                              Acciones
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {profSchedules
                          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                          .map((schedule) => (
                            <tr
                              key={schedule.id}
                              className="border-b border-border hover:bg-muted/50 transition-colors duration-150 ease-out"
                            >
                              <td className="px-4 py-3 text-sm font-medium">
                                {DAYS_FULL[schedule.dayOfWeek]}
                              </td>
                              <td className="px-4 py-3 text-sm font-mono tabular-nums">
                                {schedule.startTime}
                              </td>
                              <td className="px-4 py-3 text-sm font-mono tabular-nums">
                                {schedule.endTime}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {schedule.slotDurationMinutes} min
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${
                                    schedule.isActive
                                      ? 'bg-success/10 text-success'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {schedule.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              {canCreate && (
                                <td className="px-4 py-3 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteSchedule(
                                        schedule.id,
                                        DAYS_FULL[schedule.dayOfWeek] ?? '',
                                        `${schedule.startTime} - ${schedule.endTime}`,
                                      )
                                    }
                                    title="Eliminar horario"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </td>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Schedule Confirmation Modal */}
      {deleteScheduleTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deletingSchedule && setDeleteScheduleTarget(null)}
            aria-label="Cerrar diálogo"
          />
          {/* Dialog */}
          <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground">Eliminar horario</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  ¿Estás seguro de que querés eliminar el horario configurado para{' '}
                  <span className="font-semibold text-foreground">
                    {deleteScheduleTarget.dayName}
                  </span>{' '}
                  de{' '}
                  <span className="font-semibold text-foreground">
                    {deleteScheduleTarget.timeRange}
                  </span>
                  ?
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteScheduleTarget(null)}
                disabled={deletingSchedule}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDeleteSchedule}
                disabled={deletingSchedule}
              >
                {deletingSchedule && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
