'use client';

import { useState } from 'react';
import {
  Button,
  Label,
} from '@sistema-odontologico/ui';
import { changeAppointmentStatus, type Appointment, type AppointmentStatus } from '@/lib/appointments-api';
import { StatusBadge, statusLabels } from '@/components/appointments/shared/StatusBadge';
import { Loader2 } from 'lucide-react';

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['confirmed', 'waiting', 'cancelled'],
  confirmed: ['attended', 'no_show', 'cancelled'],
  waiting: ['confirmed', 'attended', 'cancelled'],
  attended: [],
  cancelled: ['pending'],
  no_show: ['pending'],
};

export interface ChangeStatusFormProps {
  appointment: Appointment;
  onSuccess: () => void;
}

export function ChangeStatusForm({ appointment, onSuccess }: ChangeStatusFormProps) {
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = VALID_TRANSITIONS[appointment.status] ?? [];

  const handleChange = async (newStatus: AppointmentStatus) => {
    setChanging(true);
    setError(null);
    try {
      await changeAppointmentStatus(appointment.id, newStatus);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Label className="text-sm">Estado actual:</Label>
        <StatusBadge status={appointment.status} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {allowed.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allowed.map((status) => (
            <Button
              key={status}
              variant={status === 'cancelled' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => handleChange(status)}
              disabled={changing}
            >
              {changing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {statusLabels[status]}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No hay transiciones disponibles desde este estado.</p>
      )}
    </div>
  );
}
