'use client';

import { cn } from '@sistema-odontologico/ui';
import type { AppointmentStatus } from '@/lib/appointments-api';

const statusColors: Record<AppointmentStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-success/10 text-success',
  waiting: 'bg-primary-subtle text-primary',
  attended: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted/50 text-muted-foreground/60',
  no_show: 'bg-destructive/10 text-destructive/70',
};

const statusLabels: Record<AppointmentStatus, string> = {
  pending: 'P',
  confirmed: 'C',
  waiting: 'E',
  attended: 'A',
  cancelled: 'X',
  no_show: 'N',
};

export interface AppointmentCardMiniProps {
  patientName: string;
  status: AppointmentStatus;
  time: string;
  className?: string;
}

export function AppointmentCardMini({
  patientName,
  status,
  time,
  className,
}: AppointmentCardMiniProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1 rounded text-xs',
        statusColors[status],
        className,
      )}
      title={`${patientName} — ${time}`}
    >
      <span className="font-mono">{time}</span>
      <span className="truncate font-medium">{patientName}</span>
      <span className="ml-auto text-[10px] font-bold">{statusLabels[status]}</span>
    </div>
  );
}
