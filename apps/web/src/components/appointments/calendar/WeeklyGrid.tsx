'use client';

import { Action, Module } from '@sistema-odontologico/permissions';
import { cn, hoverTransition } from '@sistema-odontologico/ui';
import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarCheck2, CheckCircle2, Loader2, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAbilities } from '@/hooks/use-abilities';
import type {
  CalendarEvent as ApiCalendarEvent,
  AppointmentStatus,
  Exception,
  PatientSelectItem,
  Schedule,
} from '@/lib/appointments-api';
import {
  cancelAppointment,
  createAppointment,
  createException,
  getCalendarData,
  getExceptions,
  getPatientsForSelect,
  getSchedules,
} from '@/lib/appointments-api';
import { createPatient } from '@/lib/auth/api';
import { CALENDAR_STATUS_META } from './calendar-config';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface GridSlot {
  /** ISO date string for the day */
  date: string;
  /** "HH:mm" */
  time: string;
  /** Minutes from midnight */
  minutes: number;
  /** Slot state */
  state: 'free' | 'reserved' | 'cancelled' | 'blocked' | 'outside';
  /** Associated calendar event if reserved/cancelled */
  event?: ApiCalendarEvent;
  exception?: Exception;
  /** Whether this slot is currently selected by the user */
  selected: boolean;
  /** Whether this slot is within the professional's working hours */
  inWorkingHours: boolean;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function parseTime(t: string): number {
  const parts = t.split(':');
  const h = parts[0] ? Number(parts[0]) : 0;
  const m = parts[1] ? Number(parts[1]) : 0;
  return h * 60 + m;
}

function fmtTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getWeekDays(date: Date) {
  const start = startOfWeek(date, { locale: es, weekStartsOn: 1 });
  const end = endOfWeek(date, { locale: es, weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

function getMinSlotDuration(schedules: Schedule[]): number {
  if (schedules.length === 0) return 30;
  return Math.min(...schedules.map((s) => s.slotDurationMinutes));
}

function getVisibleTimeRange(
  schedules: Schedule[],
  events: ApiCalendarEvent[],
  exceptions: Exception[],
  slotDuration: number,
) {
  const startCandidates: number[] = [];
  const endCandidates: number[] = [];

  for (const schedule of schedules) {
    if (!schedule.isActive) continue;
    startCandidates.push(parseTime(schedule.startTime));
    endCandidates.push(parseTime(schedule.endTime));
  }

  for (const event of events) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    startCandidates.push(start.getHours() * 60 + start.getMinutes());
    endCandidates.push(end.getHours() * 60 + end.getMinutes());
  }

  for (const exception of exceptions) {
    if (exception.startTime) startCandidates.push(parseTime(exception.startTime));
    if (exception.endTime) endCandidates.push(parseTime(exception.endTime));
  }

  if (startCandidates.length === 0 || endCandidates.length === 0) {
    return { startMinutes: 8 * 60, endMinutes: 18 * 60 };
  }

  const rawStart = Math.max(0, Math.min(...startCandidates));
  const rawEnd = Math.min(24 * 60, Math.max(...endCandidates));

  const startMinutes = Math.max(0, rawStart - (rawStart % slotDuration));
  const endMinutes = Math.min(
    24 * 60,
    rawEnd % slotDuration === 0 ? rawEnd : rawEnd + (slotDuration - (rawEnd % slotDuration)),
  );

  return {
    startMinutes,
    endMinutes: endMinutes > startMinutes ? endMinutes : startMinutes + slotDuration,
  };
}

function getWorkingMinutes(schedules: Schedule[], dayOfWeek: number): Set<number> {
  const result = new Set<number>();
  for (const s of schedules) {
    if (s.dayOfWeek === dayOfWeek && s.isActive) {
      const start = parseTime(s.startTime);
      const end = parseTime(s.endTime);
      for (let m = start; m < end; m += s.slotDurationMinutes) {
        result.add(m);
      }
    }
  }
  return result;
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.getDay();
}

function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export interface WeeklyGridProps {
  professionalId: string;
  weekDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventClick: (appointmentId: string) => void;
}

export function WeeklyGrid({
  professionalId,
  weekDate,
  selectedDate,
  onDateSelect,
  onEventClick,
}: WeeklyGridProps) {
  const { hasAbility } = useAbilities();
  const canCreate = hasAbility(Module.TURNS, Action.CREATE);
  const canCancel = hasAbility(Module.TURNS, Action.CANCEL);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [events, setEvents] = useState<ApiCalendarEvent[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [patients, setPatients] = useState<PatientSelectItem[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<ApiCalendarEvent | null>(null);
  const [showBlockedDetail, setShowBlockedDetail] = useState<Exception | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reservePatient, setReservePatient] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState<PatientSelectItem | null>(
    null,
  );
  const [showQuickPatientForm, setShowQuickPatientForm] = useState(false);
  const [quickPatientForm, setQuickPatientForm] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    email: '',
  });
  const [reserveNotes, setReserveNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const patientSelectorRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => getWeekDays(weekDate), [weekDate]);
  const slotDuration = useMemo(() => getMinSlotDuration(schedules), [schedules]);
  const visibleTimeRange = useMemo(
    () => getVisibleTimeRange(schedules, events, exceptions, slotDuration),
    [schedules, events, exceptions, slotDuration],
  );

  // Build visible time slots from earliest configured hour to latest end hour
  const timeSlots = useMemo(() => {
    const slots: number[] = [];
    for (
      let m = visibleTimeRange.startMinutes;
      m < visibleTimeRange.endMinutes;
      m += slotDuration
    ) {
      slots.push(m);
    }
    return slots;
  }, [slotDuration, visibleTimeRange]);

  // Load data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const weekStart = startOfWeek(weekDate, { locale: es, weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekDate, { locale: es, weekStartsOn: 1 });

    Promise.all([
      getSchedules(professionalId),
      getExceptions(professionalId, format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')),
      getCalendarData(
        weekStart.toISOString(),
        new Date(weekEnd.getTime() + 86400000).toISOString(),
        {
          professionalIds: [professionalId],
          status: ['pending', 'confirmed', 'waiting', 'attended', 'cancelled', 'no_show'],
        },
      ),
    ])
      .then(([scheds, excs, evts]) => {
        if (!cancelled) {
          setSchedules(scheds);
          setExceptions(excs);
          setEvents(evts);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSchedules([]);
          setExceptions([]);
          setEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [professionalId, weekDate]);

  // Build grid data
  const grid = useMemo(() => {
    const result: GridSlot[][] = []; // per day

    for (const day of days) {
      const dayOfWeek = getDayOfWeek(format(day, 'yyyy-MM-dd'));
      const workingMins = getWorkingMinutes(schedules, dayOfWeek);
      const dateStr = format(day, 'yyyy-MM-dd');

      const daySlots: GridSlot[] = [];

      for (const minutes of timeSlots) {
        const time = fmtTime(minutes);
        const inWorkingHours = workingMins.has(minutes);

        // Check if there's an event covering this slot
        const slotStart = new Date(`${dateStr}T${time}:00`);
        let state: GridSlot['state'] = inWorkingHours ? 'free' : 'outside';
        let event: ApiCalendarEvent | undefined;
        let exception: Exception | undefined;

        for (const ev of events) {
          const evStart = new Date(ev.start);
          const evEnd = new Date(ev.end);
          const evStatus = ev.extendedProps.status as AppointmentStatus;

          if (slotStart >= evStart && slotStart < evEnd) {
            event = ev;
            if (evStatus === 'cancelled') {
              state = 'cancelled';
            } else {
              state = 'reserved';
            }
            break;
          }
        }

        if (!event && inWorkingHours) {
          for (const exc of exceptions) {
            const excStartDate = toDateOnly(exc.startDate);
            const excEndDate = toDateOnly(exc.endDate);
            if (excStartDate > dateStr || excEndDate < dateStr) continue;

            if (exc.type === 'full_day' || (!exc.startTime && !exc.endTime)) {
              state = 'blocked';
              exception = exc;
              break;
            }

            const excStart = parseTime(exc.startTime ?? '00:00');
            const excEnd = parseTime(exc.endTime ?? '24:00');

            if (minutes >= excStart && minutes < excEnd) {
              state = 'blocked';
              exception = exc;
              break;
            }
          }
        }

        const slotKey = `${dateStr}|${time}`;
        daySlots.push({
          date: dateStr,
          time,
          minutes,
          state,
          event,
          exception,
          selected: selectedSlots.has(slotKey),
          inWorkingHours,
        });
      }

      result.push(daySlots);
    }

    return result;
  }, [days, schedules, events, exceptions, timeSlots, selectedSlots]);

  useEffect(() => {
    if (!showReserveModal) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setPatientsLoading(true);

      getPatientsForSelect(patientSearch.trim() || undefined)
        .then((data) => {
          if (cancelled) return;

          setPatients((previous) => {
            if (!reservePatient || data.some((patient) => patient.id === reservePatient)) {
              return data;
            }

            const selectedPatient = previous.find((patient) => patient.id === reservePatient);
            return selectedPatient ? [selectedPatient, ...data] : data;
          });
        })
        .catch(() => {
          if (!cancelled) {
            setPatients([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setPatientsLoading(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [showReserveModal, patientSearch, reservePatient]);

  useEffect(() => {
    if (!showReserveModal) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!patientSelectorRef.current?.contains(event.target as Node)) {
        setPatientSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [showReserveModal]);

  // Day summary
  const daySummary = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayEvents = events.filter((ev) => {
      const evDate = format(new Date(ev.start), 'yyyy-MM-dd');
      return evDate === dateStr;
    });

    const total = dayEvents.length;
    const byStatus: Record<string, number> = {};
    for (const ev of dayEvents) {
      const s = ev.extendedProps.status;
      byStatus[s] = (byStatus[s] || 0) + 1;
    }

    return { total, byStatus, dateStr };
  }, [selectedDate, events]);

  // Selection logic
  const handleSlotClick = useCallback(
    (slot: GridSlot) => {
      if (slot.state === 'outside') return;

      if (slot.state === 'blocked') {
        if (slot.exception) {
          setShowBlockedDetail(slot.exception);
        }
        return;
      }

      if (slot.state === 'reserved' || slot.state === 'cancelled') {
        if (slot.event) {
          setShowDetailModal(slot.event);
        }
        return;
      }

      if (!canCreate) {
        return;
      }

      // Free slot: toggle selection with contiguity check
      const slotKey = `${slot.date}|${slot.time}`;
      const prev = new Set(selectedSlots);

      if (prev.has(slotKey)) {
        prev.delete(slotKey);
        setSelectedSlots(prev);
        return;
      }

      // Check contiguity: must be same day and adjacent to existing selection
      if (prev.size > 0) {
        const allSameDay = Array.from(prev).every((k) => k.startsWith(slot.date));
        if (!allSameDay) {
          // Start new selection
          setSelectedSlots(new Set([slotKey]));
          return;
        }

        // Check adjacency
        const existingMinutes = Array.from(prev).map((k) => {
          const parts = k.split('|');
          return parseTime(parts[1] ?? '00:00');
        });
        const minMin = Math.min(...existingMinutes);
        const maxMin = Math.max(...existingMinutes);

        if (slot.minutes !== minMin - slotDuration && slot.minutes !== maxMin + slotDuration) {
          // Not contiguous, start new selection
          setSelectedSlots(new Set([slotKey]));
          return;
        }
      }

      prev.add(slotKey);
      setSelectedSlots(prev);
    },
    [canCreate, selectedSlots, slotDuration],
  );

  // Selected slots info
  const selectedInfo = useMemo(() => {
    if (selectedSlots.size === 0) return null;

    const sorted = Array.from(selectedSlots).sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || !last) return null;

    const [date = '', time = '00:00'] = first.split('|');
    const [, lastTime = '00:00'] = last.split('|');
    const endMins = parseTime(lastTime) + slotDuration;

    return {
      date: date ?? '',
      startTime: time,
      endTime: fmtTime(endMins),
      count: sorted.length,
    };
  }, [selectedSlots, slotDuration]);

  const resetReserveModal = useCallback(() => {
    setShowReserveModal(false);
    setReservePatient('');
    setPatientSearch('');
    setPatientSearchOpen(false);
    setSelectedPatientDetails(null);
    setShowQuickPatientForm(false);
    setQuickPatientForm({ firstName: '', lastName: '', dni: '', phone: '', email: '' });
    setReserveNotes('');
    setReserveError(null);
  }, []);

  // Actions
  const handleReserve = async () => {
    if (!selectedInfo || !reservePatient.trim() || !canCreate) return;
    setSubmitting(true);
    setReserveError(null);
    try {
      const startAt = new Date(`${selectedInfo.date}T${selectedInfo.startTime}:00`);
      const endAt = new Date(`${selectedInfo.date}T${selectedInfo.endTime}:00`);

      await createAppointment({
        professionalId,
        patientId: reservePatient,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        notes: reserveNotes.trim() || undefined,
      });

      setSelectedSlots(new Set());
      resetReserveModal();
      // Reload
      setLoading(true);
      const weekStart = startOfWeek(weekDate, { locale: es, weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekDate, { locale: es, weekStartsOn: 1 });
      const [scheds, excs, evts] = await Promise.all([
        getSchedules(professionalId),
        getExceptions(
          professionalId,
          format(weekStart, 'yyyy-MM-dd'),
          format(weekEnd, 'yyyy-MM-dd'),
        ),
        getCalendarData(
          weekStart.toISOString(),
          new Date(weekEnd.getTime() + 86400000).toISOString(),
          {
            professionalIds: [professionalId],
            status: ['pending', 'confirmed', 'waiting', 'attended', 'cancelled', 'no_show'],
          },
        ),
      ]);
      setSchedules(scheds);
      setExceptions(excs);
      setEvents(evts);
    } catch (error) {
      setReserveError(error instanceof Error ? error.message : 'No se pudo reservar el turno.');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const handleQuickPatientCreate = async () => {
    const firstName = quickPatientForm.firstName.trim();
    const lastName = quickPatientForm.lastName.trim();

    if (!firstName || !lastName) {
      setReserveError('Para el alta rápida necesitás al menos nombre y apellido.');
      return;
    }

    setCreatingPatient(true);
    setReserveError(null);

    try {
      const createdPatient = await createPatient({
        firstName,
        lastName,
        dni: quickPatientForm.dni.trim() || undefined,
        phone: quickPatientForm.phone.trim() || undefined,
        email: quickPatientForm.email.trim() || undefined,
      });

      const nextPatient = {
        id: createdPatient.id,
        firstName: createdPatient.firstName,
        lastName: createdPatient.lastName,
        name: `${createdPatient.firstName} ${createdPatient.lastName}`.trim(),
        dni: createdPatient.dni,
      };

      setPatients((previous) => [
        nextPatient,
        ...previous.filter((patient) => patient.id !== nextPatient.id),
      ]);
      setReservePatient(nextPatient.id);
      setSelectedPatientDetails(nextPatient);
      setPatientSearch('');
      setPatientSearchOpen(false);
      setShowQuickPatientForm(false);
      setQuickPatientForm({ firstName: '', lastName: '', dni: '', phone: '', email: '' });
    } catch (error) {
      setReserveError(
        error instanceof Error ? error.message : 'No se pudo crear el paciente rápidamente.',
      );
    } finally {
      setCreatingPatient(false);
    }
  };

  const handleCancelSlots = async () => {
    if (!selectedInfo || !cancelReason.trim()) return;
    setSubmitting(true);
    try {
      await createException({
        professionalId,
        startDate: selectedInfo.date,
        endDate: selectedInfo.date,
        startTime: selectedInfo.startTime ?? undefined,
        endTime: selectedInfo.endTime ?? undefined,
        reason: cancelReason.trim(),
        type: 'time_range',
      });

      setSelectedSlots(new Set());
      setShowCancelModal(false);
      setCancelReason('');
      // Reload
      setLoading(true);
      const weekStart = startOfWeek(weekDate, { locale: es, weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekDate, { locale: es, weekStartsOn: 1 });
      const [scheds, excs, evts] = await Promise.all([
        getSchedules(professionalId),
        getExceptions(
          professionalId,
          format(weekStart, 'yyyy-MM-dd'),
          format(weekEnd, 'yyyy-MM-dd'),
        ),
        getCalendarData(
          weekStart.toISOString(),
          new Date(weekEnd.getTime() + 86400000).toISOString(),
          {
            professionalIds: [professionalId],
            status: ['pending', 'confirmed', 'waiting', 'attended', 'cancelled', 'no_show'],
          },
        ),
      ]);
      setSchedules(scheds);
      setExceptions(excs);
      setEvents(evts);
    } catch {
      // Error handled by apiFetch toast
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!showDetailModal || !cancelReason.trim()) return;
    setSubmitting(true);
    try {
      await cancelAppointment(showDetailModal.id, cancelReason.trim());
      setShowDetailModal(null);
      setCancelReason('');
      // Reload
      setLoading(true);
      const weekStart = startOfWeek(weekDate, { locale: es, weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekDate, { locale: es, weekStartsOn: 1 });
      const [scheds, excs, evts] = await Promise.all([
        getSchedules(professionalId),
        getExceptions(
          professionalId,
          format(weekStart, 'yyyy-MM-dd'),
          format(weekEnd, 'yyyy-MM-dd'),
        ),
        getCalendarData(
          weekStart.toISOString(),
          new Date(weekEnd.getTime() + 86400000).toISOString(),
          {
            professionalIds: [professionalId],
            status: ['pending', 'confirmed', 'waiting', 'attended', 'cancelled', 'no_show'],
          },
        ),
      ]);
      setSchedules(scheds);
      setExceptions(excs);
      setEvents(evts);
    } catch {
      // Error handled by apiFetch toast
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  if (loading && schedules.length === 0 && events.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Cargando agenda semanal…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Day summary */}
      <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              {isToday(selectedDate) && (
                <span className="ml-2 rounded-full bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary">
                  Hoy
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {daySummary.total} {daySummary.total === 1 ? 'turno' : 'turnos'}
            </p>
          </div>
          <div className="flex gap-2">
            {Object.entries(daySummary.byStatus).map(([status, count]) => {
              const meta = CALENDAR_STATUS_META[status as AppointmentStatus];
              if (!meta) return null;
              return (
                <span
                  key={status}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${meta.badgeClassName}`}
                >
                  {count}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        {loading && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="ml-2 text-xs text-muted-foreground">Actualizando…</span>
          </div>
        )}

        <div ref={scrollRef} className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="sticky left-0 z-10 grid grid-cols-[56px_repeat(7,1fr)] border-b border-border bg-muted/50">
              <div className="p-2 text-xs font-medium text-muted-foreground text-center">Hora</div>
              {days.map((day) => {
                const isTodayDay = isToday(day);
                const isSelected = isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => onDateSelect(day)}
                    className={`p-2.5 text-center transition-colors duration-150 ease-out cursor-pointer ${
                      isTodayDay ? 'bg-primary/8' : ''
                    }`}
                  >
                    <div
                      className={`text-[11px] uppercase tracking-wide ${
                        isSelected
                          ? 'text-primary font-semibold'
                          : isTodayDay
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground font-medium'
                      }`}
                    >
                      {format(day, 'EEE', { locale: es })}
                    </div>
                    <div
                      className={`text-sm mt-0.5 ${
                        isSelected
                          ? 'text-primary font-semibold'
                          : isTodayDay
                            ? 'text-primary font-semibold'
                            : 'text-foreground font-semibold'
                      }`}
                    >
                      {format(day, 'dd/MM')}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Time rows */}
            {timeSlots.map((minutes, slotIdx) => {
              const time = fmtTime(minutes);
              const isHourStart = minutes % 60 === 0;

              return (
                <div
                  key={minutes}
                  className={`grid grid-cols-[56px_repeat(7,1fr)] ${
                    slotIdx < timeSlots.length - 1 ? 'border-b border-border/40' : ''
                  } ${isHourStart ? 'bg-background' : 'bg-background/50'}`}
                >
                  {/* Time label */}
                  <div
                    className={`p-1 text-xs font-mono text-muted-foreground text-right pr-2 ${
                      isHourStart ? 'font-semibold' : ''
                    }`}
                  >
                    {time}
                  </div>

                  {/* Day cells */}
                  {grid.map((daySlots) => {
                    const slot = daySlots.find((s) => s.minutes === minutes);
                    const dayKey = daySlots[0]?.date ?? `day-${minutes}`;
                    const slotDate = daySlots[0]?.date;
                    const isTodayCell = slotDate
                      ? isToday(new Date(`${slotDate}T12:00:00`))
                      : false;

                    if (!slot)
                      return (
                        <div
                          key={`${dayKey}-${minutes}`}
                          className={`border-l border-border/30 p-1 min-h-[48px] ${
                            isTodayCell ? 'bg-muted/20' : 'bg-muted/30'
                          }`}
                        />
                      );

                    let cellClass = '';

                    if (slot.state === 'outside') {
                      cellClass = isTodayCell ? 'bg-muted/30' : 'bg-muted/40';
                    } else if (slot.state === 'free') {
                      if (!canCreate) {
                        cellClass = 'bg-muted/40';
                      } else {
                        cellClass = slot.selected
                          ? 'bg-primary-subtle ring-1 ring-inset ring-primary/30 cursor-pointer'
                          : 'bg-white/80 hover:bg-primary-subtle/30 cursor-pointer';
                      }
                    } else if (slot.state === 'reserved') {
                      const status = slot.event?.extendedProps.status as AppointmentStatus;
                      const meta = status ? CALENDAR_STATUS_META[status] : null;
                      cellClass = `${meta?.eventBackground || 'bg-primary-subtle'} cursor-pointer`;
                    } else if (slot.state === 'blocked') {
                      cellClass = 'bg-warning/10 hover:bg-warning/20 cursor-pointer';
                    } else if (slot.state === 'cancelled') {
                      cellClass = 'bg-destructive/10 cursor-pointer';
                    }

                    return (
                      <button
                        key={`${dayKey}-${slot.time}`}
                        type="button"
                        className={`relative border-l border-border/30 p-1 min-h-[48px] text-xs transition-colors duration-150 ease-out ${cellClass}`}
                        onClick={() => handleSlotClick(slot)}
                        disabled={slot.state === 'outside' || (slot.state === 'free' && !canCreate)}
                      >
                        {slot.state === 'reserved' && slot.event && (
                          <div className="truncate font-medium">
                            {slot.event.extendedProps.patientName}
                          </div>
                        )}
                        {slot.state === 'cancelled' && (
                          <div className="truncate text-destructive/70">Cancelado</div>
                        )}
                        {slot.state === 'blocked' && (
                          <div className="truncate text-warning/70">Bloqueado</div>
                        )}
                        {slot.selected && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action bar for selected slots */}
      {selectedInfo && canCreate && (
        <div className="sticky bottom-4 z-30 rounded-xl border border-primary/30 bg-card p-4 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-subtle p-2 text-primary">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {selectedInfo.count}{' '}
                  {selectedInfo.count === 1 ? 'horario seleccionado' : 'horarios seleccionados'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(`${selectedInfo.date}T12:00:00`), "EEEE d 'de' MMMM", {
                    locale: es,
                  })}
                  {' — '}
                  {selectedInfo.startTime} a {selectedInfo.endTime}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReserveModal(true)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors duration-150 ease-out"
              >
                Reservar turnos
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive cursor-pointer hover:bg-destructive/20 transition-colors duration-150 ease-out"
              >
                Cancelar horarios
              </button>
              <button
                type="button"
                onClick={() => setSelectedSlots(new Set())}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground cursor-pointer hover:bg-muted transition-colors duration-150 ease-out"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reserve modal */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Reservar turnos</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedInfo?.count} {selectedInfo?.count === 1 ? 'horario' : 'horarios'} —{' '}
              {selectedInfo?.startTime} a {selectedInfo?.endTime}
            </p>

            <div className="mt-4 space-y-3">
              {reserveError && <p className="text-sm text-destructive">{reserveError}</p>}

              <div>
                <label
                  htmlFor="weekly-grid-patient-search"
                  className="text-sm font-medium text-foreground"
                >
                  Paciente *
                </label>
                <div ref={patientSelectorRef} className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="weekly-grid-patient-search"
                    type="text"
                    role="combobox"
                    aria-autocomplete="list"
                    value={patientSearch}
                    onFocus={() => setPatientSearchOpen(true)}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setPatientSearchOpen(true);
                      setReserveError(null);

                      if (selectedPatientDetails) {
                        setReservePatient('');
                        setSelectedPatientDetails(null);
                      }
                    }}
                    className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Buscar por apellido, nombre o DNI"
                    aria-expanded={patientSearchOpen}
                    aria-controls="weekly-grid-patient-results"
                    disabled={patientsLoading || submitting || creatingPatient}
                  />
                  {patientSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setPatientSearch('');
                        setPatientSearchOpen(true);
                      }}
                      className={cn(
                        'absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground',
                        hoverTransition,
                      )}
                      aria-label="Limpiar búsqueda de paciente"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {patientSearchOpen && (
                    <div
                      id="weekly-grid-patient-results"
                      className="absolute top-full left-0 z-10 mt-2 w-full rounded-lg border border-border bg-background shadow-md"
                      role="listbox"
                      aria-label="Resultados de pacientes"
                    >
                      {patientsLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="ml-2 text-sm text-muted-foreground">
                            Buscando pacientes…
                          </span>
                        </div>
                      ) : patients.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          No encontramos pacientes con esa búsqueda.
                        </div>
                      ) : (
                        <ul className="max-h-64 overflow-y-auto py-1">
                          {patients.map((patient) => (
                            <li key={patient.id}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={reservePatient === patient.id}
                                onClick={() => {
                                  setReservePatient(patient.id);
                                  setSelectedPatientDetails(patient);
                                  setPatientSearch('');
                                  setPatientSearchOpen(false);
                                  setReserveError(null);
                                }}
                                className={cn(
                                  'w-full px-4 py-2.5 text-left hover:bg-muted/50',
                                  hoverTransition,
                                )}
                              >
                                <p className="text-sm font-medium text-foreground">
                                  {patient.name}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {patient.dni ? `DNI: ${patient.dni}` : 'Sin DNI cargado'}
                                </p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {selectedPatientDetails && (
                  <div className="mt-2 flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {selectedPatientDetails.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedPatientDetails.dni
                          ? `DNI: ${selectedPatientDetails.dni}`
                          : 'Sin DNI cargado'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReservePatient('');
                        setSelectedPatientDetails(null);
                        setPatientSearchOpen(true);
                      }}
                      className={cn(
                        'shrink-0 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted',
                        hoverTransition,
                      )}
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Alta rápida de paciente</p>
                    <p className="text-xs text-muted-foreground">
                      Usá este formulario si la persona todavía no está registrada.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickPatientForm((current) => !current);
                      setPatientSearchOpen(false);
                      setReserveError(null);
                    }}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-150 ease-out hover:bg-muted"
                    disabled={submitting || creatingPatient}
                  >
                    {showQuickPatientForm ? 'Ocultar' : 'Crear paciente'}
                  </button>
                </div>

                {showQuickPatientForm && (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="quick-patient-first-name"
                          className="text-sm font-medium text-foreground"
                        >
                          Nombre *
                        </label>
                        <input
                          id="quick-patient-first-name"
                          type="text"
                          value={quickPatientForm.firstName}
                          onChange={(e) =>
                            setQuickPatientForm((current) => ({
                              ...current,
                              firstName: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled={creatingPatient || submitting}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="quick-patient-last-name"
                          className="text-sm font-medium text-foreground"
                        >
                          Apellido *
                        </label>
                        <input
                          id="quick-patient-last-name"
                          type="text"
                          value={quickPatientForm.lastName}
                          onChange={(e) =>
                            setQuickPatientForm((current) => ({
                              ...current,
                              lastName: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled={creatingPatient || submitting}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="quick-patient-dni"
                          className="text-sm font-medium text-foreground"
                        >
                          DNI
                        </label>
                        <input
                          id="quick-patient-dni"
                          type="text"
                          value={quickPatientForm.dni}
                          onChange={(e) =>
                            setQuickPatientForm((current) => ({
                              ...current,
                              dni: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled={creatingPatient || submitting}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="quick-patient-phone"
                          className="text-sm font-medium text-foreground"
                        >
                          Teléfono
                        </label>
                        <input
                          id="quick-patient-phone"
                          type="text"
                          value={quickPatientForm.phone}
                          onChange={(e) =>
                            setQuickPatientForm((current) => ({
                              ...current,
                              phone: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled={creatingPatient || submitting}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="quick-patient-email"
                        className="text-sm font-medium text-foreground"
                      >
                        Email
                      </label>
                      <input
                        id="quick-patient-email"
                        type="email"
                        value={quickPatientForm.email}
                        onChange={(e) =>
                          setQuickPatientForm((current) => ({
                            ...current,
                            email: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={creatingPatient || submitting}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleQuickPatientCreate}
                        disabled={creatingPatient || submitting}
                        className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors duration-150 ease-out hover:bg-muted disabled:opacity-50"
                      >
                        {creatingPatient ? 'Creando paciente…' : 'Guardar paciente y seleccionarlo'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="weekly-grid-notes" className="text-sm font-medium text-foreground">
                  Notas (opcional)
                </label>
                <textarea
                  id="weekly-grid-notes"
                  value={reserveNotes}
                  onChange={(e) => setReserveNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={2}
                  placeholder="Observaciones…"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetReserveModal}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm cursor-pointer hover:bg-muted transition-colors duration-150 ease-out"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReserve}
                disabled={submitting || creatingPatient || !reservePatient.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors duration-150 ease-out disabled:opacity-50"
              >
                {submitting ? 'Reservando…' : 'Confirmar reserva'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel slots modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Cancelar horarios</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Se creará una excepción para el rango seleccionado.
            </p>

            <div className="mt-4">
              <label
                htmlFor="weekly-grid-block-reason"
                className="text-sm font-medium text-foreground"
              >
                Motivo *
              </label>
              <textarea
                id="weekly-grid-block-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={3}
                placeholder="Motivo del bloqueo…"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm cursor-pointer hover:bg-muted transition-colors duration-150 ease-out"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCancelSlots}
                disabled={submitting || !cancelReason.trim()}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground cursor-pointer hover:bg-destructive/90 transition-colors duration-150 ease-out disabled:opacity-50"
              >
                {submitting ? 'Bloqueando…' : 'Confirmar bloqueo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-foreground">Detalle del turno</h3>
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(null);
                  setCancelReason('');
                }}
                className="rounded-md p-1 cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150 ease-out"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="font-medium text-foreground">Paciente:</span>{' '}
                <span className="text-muted-foreground">
                  {showDetailModal.extendedProps.patientName}
                </span>
              </p>
              <p>
                <span className="font-medium text-foreground">Profesional:</span>{' '}
                <span className="text-muted-foreground">
                  {showDetailModal.extendedProps.professionalName}
                </span>
              </p>
              <p>
                <span className="font-medium text-foreground">Horario:</span>{' '}
                <span className="text-muted-foreground">
                  {format(new Date(showDetailModal.start), 'HH:mm')} —{' '}
                  {format(new Date(showDetailModal.end), 'HH:mm')}
                </span>
              </p>
              <p>
                <span className="font-medium text-foreground">Estado:</span> {(() => {
                  const status = showDetailModal.extendedProps.status as AppointmentStatus;
                  const meta = CALENDAR_STATUS_META[status];
                  if (!meta) return null;
                  return (
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${meta.badgeClassName}`}
                    >
                      {meta.label}
                    </span>
                  );
                })()}
              </p>
              {showDetailModal.extendedProps.mutualName && (
                <p>
                  <span className="font-medium text-foreground">Mutual:</span>{' '}
                  <span className="text-muted-foreground">
                    {showDetailModal.extendedProps.mutualName}
                  </span>
                </p>
              )}
            </div>

            {canCancel && showDetailModal.extendedProps.status !== 'cancelled' && (
              <div className="mt-4">
                <label
                  htmlFor="weekly-grid-cancel-appointment-reason"
                  className="text-sm font-medium text-foreground"
                >
                  Cancelar turno (motivo *)
                </label>
                <textarea
                  id="weekly-grid-cancel-appointment-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={2}
                  placeholder="Motivo de la cancelación…"
                />
                <button
                  type="button"
                  onClick={handleCancelAppointment}
                  disabled={submitting || !cancelReason.trim()}
                  className="mt-2 w-full rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground cursor-pointer hover:bg-destructive/90 transition-colors duration-150 ease-out disabled:opacity-50"
                >
                  {submitting ? 'Cancelando…' : 'Cancelar turno'}
                </button>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEventClick(showDetailModal.id)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors duration-150 ease-out"
                >
                  Ver ficha completa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(null);
                    setCancelReason('');
                  }}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm cursor-pointer hover:bg-muted transition-colors duration-150 ease-out"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blocked detail modal */}
      {showBlockedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-foreground">Horario bloqueado</h3>
              <button
                type="button"
                onClick={() => setShowBlockedDetail(null)}
                className="rounded-md p-1 cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150 ease-out"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="font-medium text-foreground">Fecha:</span>{' '}
                <span className="text-muted-foreground">
                  {format(new Date(showBlockedDetail.startDate), "EEEE d 'de' MMMM 'de' yyyy", {
                    locale: es,
                  })}
                </span>
              </p>
              <p>
                <span className="font-medium text-foreground">Rango:</span>{' '}
                <span className="text-muted-foreground">
                  {showBlockedDetail.startTime ?? 'Todo el día'}
                  {showBlockedDetail.endTime ? ` — ${showBlockedDetail.endTime}` : ''}
                </span>
              </p>
              <p>
                <span className="font-medium text-foreground">Motivo:</span>{' '}
                <span className="text-muted-foreground">{showBlockedDetail.reason}</span>
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowBlockedDetail(null)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm cursor-pointer hover:bg-muted transition-colors duration-150 ease-out"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-muted/40 border border-border" />
          Fuera de atención
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-white border border-border" />
          Libre
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-primary-subtle ring-1 ring-primary/30" />
          Seleccionado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-primary-subtle" />
          Reservado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-destructive/10" />
          Cancelado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-warning/15" />
          Bloqueado
        </span>
      </div>
    </div>
  );
}
