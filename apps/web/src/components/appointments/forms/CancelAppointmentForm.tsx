'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Label,
} from '@sistema-odontologico/ui';
import { cancelAppointment, type Appointment } from '@/lib/appointments-api';
import { Loader2, XCircle } from 'lucide-react';

export interface CancelAppointmentFormProps {
  appointment: Appointment;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CancelAppointmentForm({ appointment, onSuccess, onCancel }: CancelAppointmentFormProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await cancelAppointment(appointment.id, reason);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar el turno');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base flex items-center gap-2 text-destructive">
          <XCircle className="h-4 w-4" />
          Cancelar turno
        </CardTitle>
        <CardDescription>
          Turno de {appointment.patientName} con {appointment.professionalName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div>
          <Label className="text-sm">Motivo de cancelación *</Label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Indicá el motivo..."
            className="mt-1 w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>Volver</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={submitting || !reason.trim()}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Confirmar cancelación
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
