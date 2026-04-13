'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  cn,
  hoverTransition,
  Label,
  Input,
  SkeletonTable,
} from '@sistema-odontologico/ui';
import {
  getExceptions,
  createException,
  deleteException,
  getSchedules,
  getProfessionals,
  getCalendarData,
  type Exception,
  type Schedule,
  type ProfessionalSelectItem,
} from '@/lib/appointments-api';
import { Plus, Trash2, Loader2, AlertCircle, CalendarOff, Clock, Check, X } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface TimeSlot {
  time: string; // "HH:MM"
  label: string; // "14:00 - 14:30"
  isOccupied: boolean;
  isException: boolean;
  isSelected: boolean;
}

export default function ExceptionsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { hasAbility } = useAbilities();
  const canView = hasAbility(Module.TURNS, Action.VIEW_LIST);
  const canCreate = hasAbility(Module.TURNS, Action.CREATE);

  const isProfessional = user?.role === 'profesional';

  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<ProfessionalSelectItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-select professional if logged in as professional
  useEffect(() => {
    if (authLoading) return;

    if (isProfessional && user?.id) {
      setSelectedProfessionalId(user.id);
    }
  }, [authLoading, isProfessional, user?.id]);

  // Load initial data
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    const profId = isProfessional && user?.id ? user.id : undefined;

    if (profId) {
      if (!cancelled) setProfessionals([]);

      Promise.all([getExceptions(profId), getSchedules(profId)])
        .then(([excs, scheds]) => {
          if (!cancelled) {
            setExceptions(excs);
            setSchedules(scheds);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setExceptions([]);
            setSchedules([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      Promise.all([getExceptions(), getProfessionals(), getSchedules()])
        .then(([excs, profs, scheds]) => {
          if (!cancelled) {
            setExceptions(excs);
            setProfessionals(profs);
            setSchedules(scheds);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setExceptions([]);
            setProfessionals([]);
            setSchedules([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [authLoading, isProfessional, user?.id]);

  // Generate slots when professional + date changes
  useEffect(() => {
    if (!selectedProfessionalId || !selectedDate) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSlots([]);

    const date = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = date.getDay();

    // Get schedules for this professional on this day of week
    const daySchedules = schedules.filter(
      (s) => s.professionalId === selectedProfessionalId && s.dayOfWeek === dayOfWeek && s.isActive,
    );

    if (daySchedules.length === 0) {
      setSlots([]);
      setLoadingSlots(false);
      return;
    }

    // Generate time slots from schedules
    const allSlots: TimeSlot[] = [];
    for (const sched of daySchedules) {
      const [startH = 0, startM = 0] = sched.startTime.split(':').map(Number);
      const [endH = 0, endM = 0] = sched.endTime.split(':').map(Number);
      let currentMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      const duration = sched.slotDurationMinutes || 30;

      while (currentMin + duration <= endMin) {
        const h = Math.floor(currentMin / 60);
        const m = currentMin % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const endSlotMin = currentMin + duration;
        const endH2 = Math.floor(endSlotMin / 60);
        const endM2 = endSlotMin % 60;
        const endStr = `${String(endH2).padStart(2, '0')}:${String(endM2).padStart(2, '0')}`;

        allSlots.push({
          time: timeStr,
          label: `${timeStr} - ${endStr}`,
          isOccupied: false,
          isException: false,
          isSelected: false,
        });
        currentMin += duration;
      }
    }

    // Mark slots that have existing appointments
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const nextDay = addDays(dateObj, 1);
    getCalendarData(dateObj.toISOString(), nextDay.toISOString(), {
      professionalIds: [selectedProfessionalId],
    })
      .then((appts) => {
        for (const slot of allSlots) {
          const [slotH = 0, slotM = 0] = slot.time.split(':').map(Number);
          const slotMin = slotH * 60 + slotM;
          for (const appt of appts) {
            const apptStart = new Date(appt.start);
            const apptEnd = new Date(appt.end);
            const apptStartMin = apptStart.getHours() * 60 + apptStart.getMinutes();
            const apptEndMin = apptEnd.getHours() * 60 + apptEnd.getMinutes();
            // Check overlap
            if (slotMin < apptEndMin && slotMin + 30 > apptStartMin) {
              slot.isOccupied = true;
              break;
            }
          }
        }

        // Mark slots that are already exceptions
        const dayExceptions = exceptions.filter(
          (e) =>
            e.professionalId === selectedProfessionalId &&
            isSameDay(new Date(e.startDate), dateObj),
        );
        for (const slot of allSlots) {
          for (const exc of dayExceptions) {
            if (exc.type === 'full_day') {
              slot.isException = true;
              break;
            }
            if (exc.startTime && exc.endTime) {
              const [excSH = 0, excSM = 0] = exc.startTime.split(':').map(Number);
              const [excEH = 0, excEM = 0] = exc.endTime.split(':').map(Number);
              const excSMin = excSH * 60 + excSM;
              const excEMin = excEH * 60 + excEM;
              const [slotH = 0, slotM = 0] = slot.time.split(':').map(Number);
              const slotMin = slotH * 60 + slotM;
              if (slotMin >= excSMin && slotMin < excEMin) {
                slot.isException = true;
                break;
              }
            }
          }
        }

        setSlots([...allSlots]);
      })
      .catch(() => {
        setSlots(allSlots);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [selectedProfessionalId, selectedDate, schedules, exceptions]);

  const toggleSlot = (time: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.time === time ? { ...s, isSelected: !s.isSelected } : s)),
    );
  };

  const selectAllFree = () => {
    setSlots((prev) =>
      prev.map((s) => (!s.isOccupied && !s.isException ? { ...s, isSelected: true } : s)),
    );
  };

  const clearSelection = () => {
    setSlots((prev) => prev.map((s) => ({ ...s, isSelected: false })));
  };

  const selectedCount = slots.filter((s) => s.isSelected).length;

  const handleSubmit = async () => {
    if (!selectedProfessionalId || !selectedDate || !reason) {
      setFormError('Completá todos los campos obligatorios');
      return;
    }
    if (selectedCount === 0) {
      setFormError('Seleccioná al menos un horario para bloquear');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const selectedSlots = slots.filter((s) => s.isSelected);

      // Check if all slots of a schedule range are selected → create full_day exception
      // Otherwise create time_range exceptions per slot
      const promises = selectedSlots.map((slot) => {
        const [h = 0, m = 0] = slot.time.split(':').map(Number);
        const endMin = h * 60 + m + 30;
        const endH = Math.floor(endMin / 60);
        const endM = endMin % 60;
        return createException({
          professionalId: selectedProfessionalId,
          startDate: selectedDate,
          endDate: selectedDate,
          startTime: slot.time,
          endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
          reason,
          type: 'time_range',
        });
      });

      const results = await Promise.all(promises);
      setExceptions((prev) => [...prev, ...results]);
      setShowForm(false);
      setSelectedDate('');
      setReason('');
      setSlots([]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear excepción');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteException(id);
      setExceptions((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // silent
    }
  };

  // Quick date options: today + next 14 days
  const quickDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const d = addDays(new Date(), i);
      dates.push({
        value: format(d, 'yyyy-MM-dd'),
        label: `${DAY_NAMES_SHORT[d.getDay()]} ${format(d, 'dd/MM')}`,
        isToday: i === 0,
      });
    }
    return dates;
  }, []);

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
        <CalendarOff className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No tenés permisos para gestionar excepciones.</p>
      </div>
    );
  }

  const professionalName = professionals.find((p) => p.id === selectedProfessionalId)?.name ?? '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Excepciones de agenda</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Bloqueá horarios específicos de forma visual
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva excepción
          </Button>
        )}
      </div>

      {/* Create form — visual grid */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bloquear horarios</CardTitle>
            <CardDescription>
              Elegí el profesional, la fecha y hacé clic en los horarios que querés bloquear
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {formError}
              </div>
            )}

            {/* Professional selector */}
            {!isProfessional && (
              <div>
                <Label className="text-sm">Profesional</Label>
                <select
                  value={selectedProfessionalId}
                  onChange={(e) => setSelectedProfessionalId(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Seleccionar profesional...</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date selector — quick dates */}
            {selectedProfessionalId && (
              <>
                <div>
                  <Label className="text-sm">Fecha</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickDates.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setSelectedDate(d.value)}
                        className={cn(
                          'rounded-lg px-3 py-1.5 text-sm font-medium',
                          hoverTransition,
                          selectedDate === d.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                      >
                        {d.label}
                        {d.isToday && (
                          <span className="ml-1 text-[10px] uppercase opacity-70">Hoy</span>
                        )}
                      </button>
                    ))}
                    <div className="flex items-center">
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="h-9 w-[160px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Time slots grid */}
                {selectedDate && (
                  <>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          Cargando horarios...
                        </span>
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <Clock className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No hay horarios configurados para este día
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm">
                            Horarios del {DAY_NAMES[new Date(selectedDate + 'T00:00:00').getDay()]}{' '}
                            {format(new Date(selectedDate + 'T00:00:00'), 'dd/MM/yyyy', {
                              locale: es,
                            })}
                          </Label>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={selectAllFree}>
                              Seleccionar libres
                            </Button>
                            <Button variant="ghost" size="sm" onClick={clearSelection}>
                              Limpiar selección
                            </Button>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-muted border border-border" />{' '}
                            Libre
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/40" />{' '}
                            Seleccionado
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-destructive/10 border border-destructive/30" />{' '}
                            Ocupado
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-warning/10 border border-warning/30" />{' '}
                            Ya bloqueado
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {slots.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={slot.isOccupied || slot.isException}
                              onClick={() => toggleSlot(slot.time)}
                              className={cn(
                                'relative flex flex-col items-center justify-center rounded-lg border p-3 text-sm font-mono transition-[background-color,border-color,box-shadow,color] duration-150 ease-out',
                                slot.isOccupied
                                  ? 'cursor-not-allowed border-destructive/30 bg-destructive/10 text-destructive/60 opacity-60'
                                  : slot.isException
                                    ? 'cursor-not-allowed border-warning/30 bg-warning/10 text-warning/60 opacity-60'
                                    : slot.isSelected
                                      ? 'border-primary/50 bg-primary/20 font-bold text-primary shadow-sm ring-1 ring-primary/30'
                                      : 'cursor-pointer border-border bg-muted/30 hover:border-primary/30 hover:bg-muted',
                              )}
                            >
                              <span>{slot.time}</span>
                              {slot.isSelected && (
                                <Check className="h-3 w-3 absolute top-1 right-1 text-primary" />
                              )}
                              {slot.isOccupied && (
                                <span className="text-[10px] mt-0.5">Ocupado</span>
                              )}
                              {slot.isException && (
                                <span className="text-[10px] mt-0.5">Bloqueado</span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Reason + submit */}
                        {selectedCount > 0 && (
                          <div className="mt-4 space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                            <div>
                              <Label className="text-sm">Motivo *</Label>
                              <Input
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Ej: Licencia, capacitación, turno personal..."
                                className="mt-1"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {selectedCount} horario{selectedCount > 1 ? 's' : ''} seleccionado
                                {selectedCount > 1 ? 's' : ''}
                              </span>
                              <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setShowForm(false)}>
                                  Cancelar
                                </Button>
                                <Button onClick={handleSubmit} disabled={submitting || !reason}>
                                  {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                                  Bloquear
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Exceptions list */}
      {loading ? (
        <SkeletonTable rows={4} columns={5} showHeader />
      ) : exceptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No hay excepciones registradas</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Profesional
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Fecha
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Horario
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Motivo
                  </th>
                  {canCreate && (
                    <th className="text-right text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {exceptions.map((exc) => (
                  <tr
                    key={exc.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors duration-150 ease-out"
                  >
                    <td className="px-4 py-3 text-sm">{exc.professionalName}</td>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(exc.startDate), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {exc.type === 'full_day' ? (
                        <span className="text-muted-foreground">Todo el día</span>
                      ) : (
                        <span className="font-mono text-xs">
                          {exc.startTime ?? '—'} → {exc.endTime ?? '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{exc.reason}</td>
                    {canCreate && (
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(exc.id)}
                          title="Eliminar excepción"
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
      )}
    </div>
  );
}
