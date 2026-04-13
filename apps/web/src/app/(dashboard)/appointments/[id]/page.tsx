'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAbilities } from '@/hooks/use-abilities';
import { Module, Action } from '@sistema-odontologico/permissions';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Label,
  SkeletonText,
} from '@sistema-odontologico/ui';
import {
  getAppointment,
  cancelAppointment,
  changeAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
} from '@/lib/appointments-api';
import { StatusBadge, statusLabels } from '@/components/appointments/shared/StatusBadge';
import { ConflictWarning, type Conflict } from '@/components/appointments/shared/ConflictWarning';
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['confirmed', 'waiting', 'cancelled'],
  confirmed: ['attended', 'no_show', 'cancelled'],
  waiting: ['confirmed', 'attended', 'cancelled'],
  attended: [],
  cancelled: ['pending'],
  no_show: ['pending'],
};

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAbility } = useAbilities();
  const canView = hasAbility(Module.TURNS, Action.VIEW_DETAIL);
  const canEdit = hasAbility(Module.TURNS, Action.EDIT);
  const canCancel = hasAbility(Module.TURNS, Action.CANCEL);

  const id = params.id as string;
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  // Cancel form
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Status change
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchAppointment = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAppointment(id);
      setAppointment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el turno');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && canView) {
      fetchAppointment();
    }
  }, [isAuthenticated, canView, fetchAppointment]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      const updated = await cancelAppointment(id, cancelReason);
      setAppointment(updated);
      setShowCancelForm(false);
      setCancelReason('');
      setConflicts([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar el turno');
    } finally {
      setCancelling(false);
    }
  };

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    setChangingStatus(true);
    try {
      const updated = await changeAppointmentStatus(id, newStatus);
      setAppointment(updated);
      setConflicts([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    } finally {
      setChangingStatus(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <Card>
          <CardHeader>
            <SkeletonText lines={2} />
          </CardHeader>
          <CardContent>
            <SkeletonText lines={6} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !canView || !appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Calendar className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No se encontró el turno o no tenés permisos.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  const allowedTransitions = VALID_TRANSITIONS[appointment.status] ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Detalle del turno</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {appointment.professionalName} — {appointment.patientName}
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setError(null)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <ConflictWarning conflicts={conflicts} />

      {/* Main info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Fecha y hora
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-lg font-semibold">
              {format(new Date(appointment.startAt), "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {format(new Date(appointment.startAt), 'HH:mm')} — {format(new Date(appointment.endAt), 'HH:mm')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-lg font-semibold">{appointment.patientName}</p>
            {appointment.mutualName && (
              <div className="flex items-center gap-1 mt-1">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">{appointment.mutualName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              Profesional
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-lg font-semibold">{appointment.professionalName}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status and actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado y acciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm">Estado actual:</Label>
            <StatusBadge status={appointment.status} />
          </div>

          {/* Status transitions */}
          {allowedTransitions.length > 0 && canEdit && (
            <div>
              <Label className="text-sm">Cambiar estado a:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {allowedTransitions.map((status) => (
                  <Button
                    key={status}
                    variant={status === 'cancelled' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                    disabled={changingStatus}
                  >
                    {status === 'confirmed' && <CheckCircle className="h-4 w-4 mr-1" />}
                    {status === 'cancelled' && <XCircle className="h-4 w-4 mr-1" />}
                    {statusLabels[status]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Cancel form */}
          {canCancel && appointment.status !== 'cancelled' && (
            <div>
              {!showCancelForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelForm(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar turno
                </Button>
              ) : (
                <div className="space-y-3">
                  <Label className="text-sm">Motivo de cancelación *</Label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Indicá el motivo de la cancelación..."
                    className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCancel}
                      disabled={cancelling || !cancelReason.trim()}
                    >
                      {cancelling && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Confirmar cancelación
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowCancelForm(false); setCancelReason(''); }}
                    >
                      Volver
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información adicional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Origen</Label>
              <p className="text-sm mt-1">
                {appointment.source === 'desk' ? 'Escritorio' : appointment.source === 'whatsapp' ? 'WhatsApp' : 'Web'}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Creado</Label>
              <p className="text-sm mt-1">
                {format(new Date(appointment.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Última actualización</Label>
              <p className="text-sm mt-1">
                {format(new Date(appointment.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
              </p>
            </div>
          </div>

          {appointment.notes && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Observaciones
              </Label>
              <p className="text-sm mt-1 text-muted-foreground">{appointment.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
