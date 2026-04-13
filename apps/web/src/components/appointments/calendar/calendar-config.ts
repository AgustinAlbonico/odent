import type { AppointmentStatus, CalendarEvent, CalendarViewType } from '@/lib/appointments-api';

export interface CalendarRoleUser {
  id: string;
  role: string;
}

export interface CalendarRoleConfig {
  effectiveProfessionalId?: string;
  isProfessional: boolean;
  showProfessionalFilter: boolean;
}

export interface CalendarStatusMeta {
  label: string;
  description: string;
  badgeClassName: string;
  eventBackground: string;
  eventBorder: string;
  eventText: string;
}

export const CALENDAR_STATUS_META: Record<AppointmentStatus, CalendarStatusMeta> = {
  pending: {
    label: 'Pendiente',
    description: 'Todavía espera confirmación.',
    badgeClassName: 'border border-warning/20 bg-warning/10 text-warning',
    eventBackground: 'color-mix(in oklab, var(--color-warning) 14%, var(--color-background) 86%)',
    eventBorder: 'var(--color-warning)',
    eventText: 'var(--color-foreground)',
  },
  confirmed: {
    label: 'Confirmado',
    description: 'Turno confirmado con el paciente.',
    badgeClassName: 'border border-success/20 bg-success/10 text-success',
    eventBackground: 'color-mix(in oklab, var(--color-success) 14%, var(--color-background) 86%)',
    eventBorder: 'var(--color-success)',
    eventText: 'var(--color-foreground)',
  },
  waiting: {
    label: 'En espera',
    description: 'Paciente presente, aguardando atención.',
    badgeClassName: 'border border-primary/20 bg-primary-subtle text-primary',
    eventBackground: 'color-mix(in oklab, var(--color-primary) 12%, var(--color-background) 88%)',
    eventBorder: 'var(--color-primary)',
    eventText: 'var(--color-foreground)',
  },
  attended: {
    label: 'Atendido',
    description: 'La consulta ya fue realizada.',
    badgeClassName: 'border border-border bg-muted text-muted-foreground',
    eventBackground: 'var(--color-muted)',
    eventBorder: 'var(--color-border)',
    eventText: 'var(--color-foreground)',
  },
  cancelled: {
    label: 'Cancelado',
    description: 'Se canceló y ya no ocupa agenda.',
    badgeClassName: 'border border-border bg-muted/70 text-muted-foreground',
    eventBackground:
      'color-mix(in oklab, var(--color-muted-foreground) 10%, var(--color-background) 90%)',
    eventBorder: 'var(--color-muted-foreground)',
    eventText: 'var(--color-muted-foreground)',
  },
  no_show: {
    label: 'Ausente',
    description: 'El paciente no se presentó.',
    badgeClassName: 'border border-destructive/20 bg-destructive/10 text-destructive',
    eventBackground:
      'color-mix(in oklab, var(--color-destructive) 12%, var(--color-background) 88%)',
    eventBorder: 'var(--color-destructive)',
    eventText: 'var(--color-foreground)',
  },
};

export const CALENDAR_STATUS_ORDER: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'waiting',
  'attended',
  'cancelled',
  'no_show',
];

export function getCalendarRoleConfig(
  user: CalendarRoleUser | null | undefined,
  requestedProfessionalId?: string,
): CalendarRoleConfig {
  const isProfessional = user?.role === 'profesional';

  if (isProfessional && user?.id) {
    return {
      effectiveProfessionalId: user.id,
      isProfessional: true,
      showProfessionalFilter: false,
    };
  }

  return {
    effectiveProfessionalId: requestedProfessionalId,
    isProfessional: false,
    showProfessionalFilter: true,
  };
}

export function getAdaptiveCalendarView(view: CalendarViewType, isCompact: boolean) {
  if (!isCompact) {
    return view === 'timeGrid24h' ? 'timeGridDay' : view;
  }

  if (view === 'dayGridMonth' || view === 'timeGridWeek') {
    return 'listWeek';
  }

  return 'timeGridDay';
}

export function buildCalendarSummary(events: CalendarEvent[]) {
  return CALENDAR_STATUS_ORDER.map((status) => ({
    status,
    count: events.filter((event) => event.extendedProps.status === status).length,
    meta: CALENDAR_STATUS_META[status],
  }));
}
