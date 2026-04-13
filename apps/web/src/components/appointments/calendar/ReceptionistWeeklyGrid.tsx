'use client';

import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppointmentStatus, CalendarEvent as ApiCalendarEvent } from '@/lib/appointments-api';
import { getCalendarData } from '@/lib/appointments-api';
import { CALENDAR_STATUS_META } from './calendar-config';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface ReceptionistWeeklyGridProps {
  weekDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventClick: (appointmentId: string) => void;
  /** Optional filter — if provided, only show this professional's appointments */
  professionalId?: string;
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

const SLOT_DURATION = 30;

function getVisibleTimeRange(events: ApiCalendarEvent[]) {
  if (events.length === 0) {
    return { startMinutes: 8 * 60, endMinutes: 18 * 60 };
  }

  const startCandidates: number[] = [];
  const endCandidates: number[] = [];

  for (const event of events) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    startCandidates.push(start.getHours() * 60 + start.getMinutes());
    endCandidates.push(end.getHours() * 60 + end.getMinutes());
  }

  const rawStart = Math.max(0, Math.min(...startCandidates));
  const rawEnd = Math.min(24 * 60, Math.max(...endCandidates));

  const startMinutes = Math.max(0, rawStart - (rawStart % SLOT_DURATION));
  const endMinutes = Math.min(
    24 * 60,
    rawEnd % SLOT_DURATION === 0 ? rawEnd : rawEnd + (SLOT_DURATION - (rawEnd % SLOT_DURATION)),
  );

  return {
    startMinutes,
    endMinutes: endMinutes > startMinutes ? endMinutes : startMinutes + SLOT_DURATION,
  };
}

/** Find all events that overlap with a given 30-minute slot on a given date */
function getEventsForSlot(
  events: ApiCalendarEvent[],
  dateStr: string,
  slotStartMinutes: number,
): ApiCalendarEvent[] {
  const slotEndMinutes = slotStartMinutes + SLOT_DURATION;

  return events.filter((ev) => {
    const evStart = new Date(ev.start);
    const evEnd = new Date(ev.end);
    const evDateStr = format(evStart, 'yyyy-MM-dd');

    if (evDateStr !== dateStr) return false;

    const evStartMin = evStart.getHours() * 60 + evStart.getMinutes();
    const evEndMin = evEnd.getHours() * 60 + evEnd.getMinutes();

    // Overlap check: slot [slotStartMinutes, slotEndMinutes) overlaps event [evStartMin, evEndMin)
    return slotStartMinutes < evEndMin && slotEndMinutes > evStartMin;
  });
}

/** Deduplicate events that appear in multiple consecutive slots — return unique events for first slot only */
function getUniqueEventsForSlot(
  events: ApiCalendarEvent[],
  dateStr: string,
  slotStartMinutes: number,
  allSlotMinutes: number[],
): ApiCalendarEvent[] {
  const overlapping = getEventsForSlot(events, dateStr, slotStartMinutes);

  // Only show the event in the slot where it starts
  return overlapping.filter((ev) => {
    const evStart = new Date(ev.start);
    const evStartMin = evStart.getHours() * 60 + evStart.getMinutes();
    return evStartMin === slotStartMinutes;
  });
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function ReceptionistWeeklyGrid({
  weekDate,
  selectedDate,
  onDateSelect,
  onEventClick,
  professionalId,
}: ReceptionistWeeklyGridProps) {
  const [events, setEvents] = useState<ApiCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState<ApiCalendarEvent | null>(null);

  const days = useMemo(() => getWeekDays(weekDate), [weekDate]);

  const visibleTimeRange = useMemo(() => getVisibleTimeRange(events), [events]);

  const timeSlots = useMemo(() => {
    const slots: number[] = [];
    for (
      let m = visibleTimeRange.startMinutes;
      m < visibleTimeRange.endMinutes;
      m += SLOT_DURATION
    ) {
      slots.push(m);
    }
    return slots;
  }, [visibleTimeRange]);

  // Load data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const weekStart = startOfWeek(weekDate, { locale: es, weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekDate, { locale: es, weekStartsOn: 1 });

    const filters: { professionalIds?: string[]; status: string[] } = {
      status: ['pending', 'confirmed', 'waiting', 'attended', 'cancelled', 'no_show'],
    };

    if (professionalId) {
      filters.professionalIds = [professionalId];
    }

    getCalendarData(
      weekStart.toISOString(),
      new Date(weekEnd.getTime() + 86400000).toISOString(),
      filters,
    )
      .then((evts) => {
        if (!cancelled) {
          setEvents(evts);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [weekDate, professionalId]);

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

  // Handle appointment click — open detail modal
  const handleAppointmentClick = useCallback((event: ApiCalendarEvent) => {
    setShowDetailModal(event);
  }, []);

  // Total appointments across the whole week
  const weekTotal = useMemo(() => events.length, [events]);

  if (loading && events.length === 0) {
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
              {daySummary.total} {daySummary.total === 1 ? 'turno' : 'turnos'} en el día
              {' · '}
              {weekTotal} en la semana
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(daySummary.byStatus).map(([status, count]) => {
              const meta = CALENDAR_STATUS_META[status as AppointmentStatus];
              if (!meta) return null;
              return (
                <span
                  key={status}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${meta.badgeClassName}`}
                >
                  {count} {meta.label}
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

        <div className="overflow-x-auto">
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
                  {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isTodayCell = isToday(day);
                    const cellEvents = getUniqueEventsForSlot(events, dateStr, minutes, timeSlots);

                    // Count overlapping events for this slot (for visual density indication)
                    const allOverlapping = getEventsForSlot(events, dateStr, minutes);

                    if (cellEvents.length === 0) {
                      // Check if there are continuing events (started in a previous slot)
                      const continuingEvents = allOverlapping.filter((ev) => {
                        const evStart = new Date(ev.start);
                        const evStartMin = evStart.getHours() * 60 + evStart.getMinutes();
                        return evStartMin < minutes;
                      });

                      if (continuingEvents.length > 0) {
                        // This slot is covered by a continuing event — show muted background
                        return (
                          <div
                            key={`${dateStr}-${minutes}`}
                            className={`border-l border-border/30 p-1 min-h-[48px] ${
                              isTodayCell ? 'bg-muted/20' : 'bg-muted/30'
                            }`}
                          />
                        );
                      }

                      return (
                        <div
                          key={`${dateStr}-${minutes}`}
                          className={`border-l border-border/30 p-1 min-h-[48px] ${
                            isTodayCell ? 'bg-muted/20' : 'bg-muted/30'
                          }`}
                        />
                      );
                    }

                    return (
                      <div
                        key={`${dateStr}-${minutes}`}
                        className={`border-l border-border/30 p-1 min-h-[48px] ${
                          isTodayCell ? 'bg-muted/20' : ''
                        }`}
                      >
                        <div className="space-y-0.5">
                          {cellEvents.map((ev) => {
                            const status = ev.extendedProps.status as AppointmentStatus;
                            const meta = status ? CALENDAR_STATUS_META[status] : null;

                            return (
                              <button
                                key={ev.id}
                                type="button"
                                onClick={() => handleAppointmentClick(ev)}
                                className={`w-full rounded-md px-1.5 py-0.5 text-left text-xs transition-colors duration-150 ease-out cursor-pointer hover:brightness-95 ${
                                  meta?.eventBackground ?? 'bg-primary-subtle'
                                }`}
                                style={
                                  meta?.eventBackground?.includes('color-mix')
                                    ? { background: meta.eventBackground }
                                    : undefined
                                }
                                title={`${ev.extendedProps.patientName} — ${ev.extendedProps.professionalName}`}
                              >
                                <div className="truncate font-medium text-foreground">
                                  {ev.extendedProps.patientName}
                                </div>
                                <div
                                  className="truncate text-muted-foreground"
                                  style={{ fontSize: '10px' }}
                                >
                                  {ev.extendedProps.professionalName}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!loading && events.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No hay turnos para esta semana.</p>
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
                onClick={() => setShowDetailModal(null)}
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
              {showDetailModal.extendedProps.notes && (
                <p>
                  <span className="font-medium text-foreground">Notas:</span>{' '}
                  <span className="text-muted-foreground">
                    {showDetailModal.extendedProps.notes}
                  </span>
                </p>
              )}
            </div>

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
                  onClick={() => setShowDetailModal(null)}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm cursor-pointer hover:bg-muted transition-colors duration-150 ease-out"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {Object.entries(CALENDAR_STATUS_META).map(([status, meta]) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded border border-border"
              style={
                meta.eventBackground.includes('color-mix')
                  ? { background: meta.eventBackground }
                  : undefined
              }
            />
            {meta.label}
          </span>
        ))}
      </div>
    </div>
  );
}
