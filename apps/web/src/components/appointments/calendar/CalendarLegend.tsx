'use client';

import { Badge } from '@sistema-odontologico/ui';
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Clock3,
  type LucideIcon,
  Stethoscope,
  UserRoundX,
} from 'lucide-react';
import type { AppointmentStatus } from '@/lib/appointments-api';
import { CALENDAR_STATUS_META, CALENDAR_STATUS_ORDER } from './calendar-config';

const STATUS_ICONS: Record<AppointmentStatus, LucideIcon> = {
  pending: Clock3,
  confirmed: CheckCircle2,
  waiting: AlertTriangle,
  attended: Stethoscope,
  cancelled: CircleSlash,
  no_show: UserRoundX,
};

export function CalendarLegend() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">Referencias rápidas</p>
        <p className="text-sm text-muted-foreground">
          Colores y textos pensados para ver el estado de cada turno de un vistazo.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CALENDAR_STATUS_ORDER.map((status) => {
          const meta = CALENDAR_STATUS_META[status];
          const Icon = STATUS_ICONS[status];

          return (
            <div
              key={status}
              className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3"
            >
              <Badge variant="secondary" className={meta.badgeClassName}>
                <Icon className="h-4 w-4" />
              </Badge>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{meta.label}</p>
                <p className="text-sm text-muted-foreground">{meta.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
