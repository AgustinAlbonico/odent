'use client';

import { Badge } from '@sistema-odontologico/ui';
import type { AppointmentStatus } from '@/lib/appointments-api';

const statusClasses: Record<AppointmentStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-success/10 text-success',
  waiting: 'bg-primary-subtle text-primary',
  attended: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted/50 text-muted-foreground/60',
  no_show: 'bg-destructive/10 text-destructive/70',
};

const statusLabels: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  waiting: 'En espera',
  attended: 'Atendido',
  cancelled: 'Cancelado',
  no_show: 'Ausente',
};

export interface StatusBadgeProps
  extends Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> {
  status: AppointmentStatus;
  showLabel?: boolean;
}

export function StatusBadge({
  status,
  showLabel = true,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={statusClasses[status]}
      {...props}
    >
      {showLabel ? statusLabels[status] : ''}
    </Badge>
  );
}

export { statusLabels };
