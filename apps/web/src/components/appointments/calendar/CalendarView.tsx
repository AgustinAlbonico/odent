'use client';

import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { CalendarCheck2, CalendarClock, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type CalendarEvent as ApiCalendarEvent,
  type CalendarViewType,
  getCalendarData,
} from '@/lib/appointments-api';
import { CalendarLegend } from './CalendarLegend';
import { CalendarSummary } from './CalendarSummary';
import { CALENDAR_STATUS_META, getAdaptiveCalendarView } from './calendar-config';

export interface CalendarViewProps {
  view: CalendarViewType;
  currentDate: Date;
  professionalId?: string;
  includeCancelled: boolean;
  onEventClick: (appointmentId: string) => void;
}

const DEFAULT_COLORS = {
  bg: 'var(--color-muted)',
  border: 'var(--color-border)',
  text: 'var(--color-foreground)',
};

function toFcEvents(events: ApiCalendarEvent[]) {
  return events.map((ev) => {
    const meta = CALENDAR_STATUS_META[ev.extendedProps.status] ?? null;
    const colors = meta
      ? { bg: meta.eventBackground, border: meta.eventBorder, text: meta.eventText }
      : DEFAULT_COLORS;

    return {
      id: ev.id,
      title: `${ev.extendedProps.patientName} — ${ev.extendedProps.professionalName}`,
      start: ev.start,
      end: ev.end,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: ev.extendedProps,
    };
  });
}

export function CalendarView({
  view,
  currentDate,
  professionalId,
  includeCancelled,
  onEventClick,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [calendarEvents, setCalendarEvents] = useState<ApiCalendarEvent[]>([]);
  const [events, setEvents] = useState<ReturnType<typeof toFcEvents>>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsCompact(media.matches);

    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const fetchEvents = useCallback(
    async (startStr: string, endStr: string) => {
      setLoading(true);
      setLoadError(null);
      try {
        const filters: { professionalIds?: string[]; status?: string[] } = {};
        if (professionalId) filters.professionalIds = [professionalId];
        if (!includeCancelled) {
          filters.status = ['pending', 'confirmed', 'waiting', 'attended', 'no_show'];
        }

        const data = await getCalendarData(startStr, endStr, filters);
        setCalendarEvents(data);
        setEvents(toFcEvents(data));
      } catch (error) {
        setCalendarEvents([]);
        setEvents([]);
        setLoadError(
          error instanceof Error ? error.message : 'No pudimos cargar la agenda en este momento.',
        );
      } finally {
        setHasLoadedOnce(true);
        setLoading(false);
      }
    },
    [professionalId, includeCancelled],
  );

  const handleDatesSet = useCallback(
    (arg: { start: Date; end: Date }) => {
      fetchEvents(arg.start.toISOString(), arg.end.toISOString());
    },
    [fetchEvents],
  );

  // Sync view when prop changes
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const fcView = getAdaptiveCalendarView(view, isCompact);
    if (api.view.type !== fcView) {
      api.changeView(fcView);
    }
    if (view === 'timeGrid24h') {
      api.setOption('slotMinTime', '00:00:00');
      api.setOption('slotMaxTime', '24:00:00');
    } else {
      api.setOption('slotMinTime', '08:00:00');
      api.setOption('slotMaxTime', '20:00:00');
    }
  }, [view, isCompact]);

  // Sync date when prop changes
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.gotoDate(currentDate);
  }, [currentDate]);

  return (
    <div className="space-y-4">
      <CalendarSummary
        events={calendarEvents}
        title={
          isCompact
            ? 'Vista compacta para pantallas chicas.'
            : 'Estado general de los turnos que estás viendo ahora.'
        }
      />

      <CalendarLegend />

      <div className="relative overflow-hidden rounded-xl border border-border bg-background p-2 sm:p-3">
        {loading && (
          <div
            className="pointer-events-none absolute inset-x-3 top-3 z-20 flex justify-end"
            role="status"
            aria-label="Actualizando turnos del calendario"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Actualizando agenda…
            </div>
          </div>
        )}

        {hasLoadedOnce && !loading && loadError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/92 p-4 backdrop-blur-[1px]">
            <div className="max-w-md rounded-xl border border-warning/30 bg-card p-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning">
                <CalendarClock className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                No pudimos actualizar la agenda
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {loadError}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Probá cambiar de período o recargar la pantalla en unos segundos.
              </p>
            </div>
          </div>
        )}

        {hasLoadedOnce && !loading && !loadError && calendarEvents.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 p-4 backdrop-blur-[1px]">
            <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-subtle text-primary">
                <CalendarCheck2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                No hay turnos en este período
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Probá cambiar de día o semana. Si querés revisar historial reciente, activá también
                los cancelados.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                Vista pensada para que se entienda rápido, incluso si no cargó ningún turno.
              </div>
            </div>
          </div>
        )}

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView={getAdaptiveCalendarView(view, isCompact)}
          locale={esLocale}
          headerToolbar={false}
          editable={false}
          selectable
          events={events}
          datesSet={handleDatesSet}
          eventClick={(info) => {
            const aptId = info.event.extendedProps?.appointmentId;
            if (aptId) onEventClick(aptId);
          }}
          eventContent={(info) => {
            const status = info.event.extendedProps?.status as
              | keyof typeof CALENDAR_STATUS_META
              | undefined;
            const meta = status ? CALENDAR_STATUS_META[status] : null;

            return (
              <div className="flex min-w-0 flex-col gap-1 rounded-md px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {info.timeText || 'Turno'}
                  </span>
                  {meta && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${meta.badgeClassName}`}
                    >
                      {meta.label}
                    </span>
                  )}
                </div>
                <span className="truncate text-sm font-semibold text-foreground">
                  {info.event.extendedProps?.patientName || info.event.title}
                </span>
                {professionalId ? null : (
                  <span className="truncate text-xs text-muted-foreground">
                    {info.event.extendedProps?.professionalName}
                  </span>
                )}
              </div>
            );
          }}
          height="auto"
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'short' }}
          titleFormat={{ year: 'numeric', month: 'long' }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            list: 'Lista',
          }}
          noEventsText="No hay turnos en este período"
        />
      </div>
    </div>
  );
}
