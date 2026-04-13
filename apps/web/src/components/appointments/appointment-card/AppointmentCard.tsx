'use client';

import { cn } from '@sistema-odontologico/ui';
import type { AppointmentStatus } from '@/lib/appointments-api';

const statusColors: Record<AppointmentStatus, string> = {
  pending: 'border-l-warning',
  confirmed: 'border-l-success',
  waiting: 'border-l-primary',
  attended: 'border-l-muted-foreground',
  cancelled: 'border-l-muted',
  no_show: 'border-l-destructive',
};

export interface AppointmentCardProps {
  time: string;
  patientName: string;
  professionalName: string;
  status: AppointmentStatus;
  mutualName?: string | null;
  onClick?: () => void;
  className?: string;
}

export function AppointmentCard({
  time,
  patientName,
  professionalName,
  status,
  mutualName,
  onClick,
  className,
}: AppointmentCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-2 rounded-md border border-border border-l-4 bg-background',
        statusColors[status],
        'hover:shadow-sm transition-shadow duration-200 cursor-pointer',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{patientName}</p>
          <p className="text-xs text-muted-foreground truncate">{professionalName}</p>
        </div>
        <span className="text-xs font-mono text-muted-foreground shrink-0">{time}</span>
      </div>
      {mutualName && (
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{mutualName}</p>
      )}
    </button>
  );
}
