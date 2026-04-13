'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Input,
} from '@sistema-odontologico/ui';
import {
  updateAppointment,
  getAvailability,
  getProfessionals,
  getPatientsForSelect,
  getMutualsForSelect,
  type Appointment,
  type ProfessionalSelectItem,
  type PatientSelectItem,
  type MutualSelectItem,
} from '@/lib/appointments-api';
import { ConflictWarning, type Conflict } from '@/components/appointments/shared/ConflictWarning';
import { Loader2, X } from 'lucide-react';

export interface EditAppointmentFormProps {
  appointment: Appointment;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditAppointmentForm({ appointment, onSuccess, onCancel }: EditAppointmentFormProps) {
  const [professionals, setProfessionals] = useState<ProfessionalSelectItem[]>([]);
  const [patients, setPatients] = useState<PatientSelectItem[]>([]);
  const [mutuals, setMutuals] = useState<MutualSelectItem[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const startDt = new Date(appointment.startAt);
  const endDt = new Date(appointment.endAt);
  const durationMin = Math.round((endDt.getTime() - startDt.getTime()) / 60000);

  const [form, setForm] = useState({
    professionalId: appointment.professionalId,
    patientId: appointment.patientId,
    mutualId: appointment.mutualId ?? '',
    date: startDt.toISOString().split('T')[0] ?? '',
    time: startDt.toTimeString().slice(0, 5),
    duration: String(durationMin || 30),
    notes: appointment.notes ?? '',
  });

  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setLoadingCatalogs(true);
    Promise.all([getProfessionals(), getPatientsForSelect(), getMutualsForSelect()])
      .then(([profs, pats, muts]) => {
        if (!cancelled) {
          setProfessionals(profs);
          setPatients(pats);
          setMutuals(muts);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfessionals([]);
          setPatients([]);
          setMutuals([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalogs(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!form.professionalId || !form.date || !form.time) {
      setConflicts([]);
      return;
    }
    let cancelled = false;
    setCheckingAvailability(true);
    getAvailability(form.professionalId, form.date, form.date)
      .then((res) => {
        if (!cancelled) setConflicts(res.conflicts);
      })
      .catch(() => {
        if (!cancelled) setConflicts([]);
      })
      .finally(() => {
        if (!cancelled) setCheckingAvailability(false);
      });
    return () => { cancelled = true; };
  }, [form.professionalId, form.date, form.time]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.professionalId) errs.professionalId = 'Seleccioná un profesional';
    if (!form.patientId) errs.patientId = 'Seleccioná un paciente';
    if (!form.date) errs.date = 'Seleccioná una fecha';
    if (!form.time) errs.time = 'Seleccioná una hora';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const hasHardBlocks = conflicts.some((c) => c.type === 'hard');

  const handleSubmit = async () => {
    if (!validate()) return;
    if (hasHardBlocks) {
      setError('Hay conflictos de horario que impiden actualizar el turno');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const startAt = `${form.date}T${form.time}:00`;
      const durationMin = parseInt(form.duration, 10);
      const endDate = new Date(new Date(startAt).getTime() + durationMin * 60000);
      const endAt = endDate.toISOString().slice(0, 16);

      await updateAppointment(appointment.id, {
        professionalId: form.professionalId,
        patientId: form.patientId,
        mutualId: form.mutualId || undefined,
        startAt,
        endAt,
        notes: form.notes || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el turno');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-base">Editar turno</CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <ConflictWarning conflicts={conflicts} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Paciente *</Label>
            <select
              value={form.patientId}
              onChange={(e) => { setForm({ ...form, patientId: e.target.value }); setErrors((p) => ({ ...p, patientId: '' })); }}
              className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={loadingCatalogs}
            >
              <option value="">Seleccionar paciente...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.dni ? ` (${p.dni})` : ''}</option>
              ))}
            </select>
            {errors.patientId && <p className="text-xs text-destructive mt-1">{errors.patientId}</p>}
          </div>

          <div>
            <Label className="text-sm">Profesional *</Label>
            <select
              value={form.professionalId}
              onChange={(e) => { setForm({ ...form, professionalId: e.target.value }); setErrors((p) => ({ ...p, professionalId: '' })); }}
              className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={loadingCatalogs}
            >
              <option value="">Seleccionar profesional...</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.professionalId && <p className="text-xs text-destructive mt-1">{errors.professionalId}</p>}
          </div>

          <div>
            <Label className="text-sm">Fecha *</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => { setForm({ ...form, date: e.target.value }); setErrors((p) => ({ ...p, date: '' })); }}
              className="mt-1"
            />
            {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
          </div>

          <div>
            <Label className="text-sm">Hora *</Label>
            <Input
              type="time"
              value={form.time}
              onChange={(e) => { setForm({ ...form, time: e.target.value }); setErrors((p) => ({ ...p, time: '' })); }}
              className="mt-1"
            />
            {errors.time && <p className="text-xs text-destructive mt-1">{errors.time}</p>}
            {checkingAvailability && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Verificando disponibilidad...
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm">Duración</Label>
            <select
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="15">15 minutos</option>
              <option value="20">20 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">60 minutos</option>
            </select>
          </div>

          <div>
            <Label className="text-sm">Obra social (opcional)</Label>
            <select
              value={form.mutualId}
              onChange={(e) => setForm({ ...form, mutualId: e.target.value })}
              className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={loadingCatalogs}
            >
              <option value="">Sin obra social</option>
              {mutuals.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <Label className="text-sm">Observaciones</Label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas adicionales..."
              className="mt-1 w-full min-h-[60px] rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting || hasHardBlocks}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
