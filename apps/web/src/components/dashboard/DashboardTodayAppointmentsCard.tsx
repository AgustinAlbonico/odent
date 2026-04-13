'use client';

import { Action, Module } from '@sistema-odontologico/permissions';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SkeletonTable,
} from '@sistema-odontologico/ui';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarCheck2, Clock3, Eye, Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '@/components/appointments/shared/StatusBadge';
import { useAbilities } from '@/hooks/use-abilities';
import {
  type AppointmentListItem,
  cancelAppointment,
  changeAppointmentStatus,
  getAppointments,
} from '@/lib/appointments-api';
import type { AuthUser } from '@/lib/auth/api';

interface DashboardTodayAppointmentsCardProps {
  user: AuthUser;
}

function formatTimeRange(startAt: string, endAt: string) {
  return `${format(parseISO(startAt), 'HH:mm')} - ${format(parseISO(endAt), 'HH:mm')}`;
}

function formatPatientMeta(appointment: AppointmentListItem) {
  if (appointment.patientDni) {
    return `DNI: ${appointment.patientDni}`;
  }

  if (appointment.mutualName) {
    return appointment.mutualName;
  }

  return 'Sin datos adicionales';
}

export function DashboardTodayAppointmentsCard({ user }: DashboardTodayAppointmentsCardProps) {
  const router = useRouter();
  const { hasAbility } = useAbilities();

  const canViewTurns = hasAbility(Module.TURNS, Action.VIEW_LIST);
  const canEditTurns = hasAbility(Module.TURNS, Action.EDIT);
  const canCancelTurns = hasAbility(Module.TURNS, Action.CANCEL);
  const isProfessional = user.role === 'profesional';

  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentListItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const today = useMemo(() => new Date(), []);
  const todayQuery = useMemo(() => format(today, 'yyyy-MM-dd'), [today]);

  const fetchAppointments = useCallback(async () => {
    if (!canViewTurns) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getAppointments({
        dateFrom: todayQuery,
        dateTo: todayQuery,
        professionalId: isProfessional ? user.id : undefined,
        limit: 100,
      });

      const sorted = [...result.data].sort((left, right) =>
        left.startAt.localeCompare(right.startAt),
      );

      setAppointments(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los turnos de hoy.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [canViewTurns, isProfessional, todayQuery, user.id]);

  useEffect(() => {
    if (canViewTurns) {
      fetchAppointments();
    }
  }, [canViewTurns, fetchAppointments]);

  const handleConfirm = async (appointmentId: string) => {
    setUpdatingId(appointmentId);
    setError(null);

    try {
      await changeAppointmentStatus(appointmentId, 'confirmed');
      await fetchAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo confirmar el turno.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) return;

    setCancelling(true);
    setError(null);

    try {
      await cancelAppointment(cancelTarget.id, cancelReason.trim());
      setCancelTarget(null);
      setCancelReason('');
      await fetchAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar el turno.');
    } finally {
      setCancelling(false);
    }
  };

  if (!canViewTurns) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl">Turnos de hoy</CardTitle>
            <CardDescription>
              {isProfessional
                ? 'Tus turnos del día con acciones rápidas para confirmar, cancelar o abrir el detalle.'
                : 'Turnos del día de la institución con acceso rápido a confirmación, cancelación y detalle.'}
            </CardDescription>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            <CalendarCheck2 className="h-4 w-4 text-primary" />
            <span>
              {appointments.length} {appointments.length === 1 ? 'turno' : 'turnos'} cargados hoy
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div role="status" aria-busy="true" aria-label="Cargando turnos de hoy">
              <SkeletonTable rows={5} columns={isProfessional ? 4 : 5} showHeader />
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <Clock3 className="h-8 w-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">No hay turnos para hoy</p>
                <p className="text-sm text-muted-foreground">
                  {isProfessional
                    ? 'Cuando tengas turnos asignados para hoy, los vas a ver acá.'
                    : 'Todavía no hay turnos registrados para hoy en la institución.'}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={fetchAppointments}>
                Reintentar
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[720px]">
                <thead className="bg-muted/30">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Hora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Paciente
                    </th>
                    {!isProfessional && (
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Profesional
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => {
                    const canQuickConfirm =
                      canEditTurns &&
                      (appointment.status === 'pending' || appointment.status === 'waiting');
                    const canQuickCancel = canCancelTurns && appointment.status !== 'cancelled';
                    const isUpdating = updatingId === appointment.id;

                    return (
                      <tr
                        key={appointment.id}
                        className="border-b border-border/70 align-top last:border-b-0"
                      >
                        <td className="px-4 py-3 text-sm text-foreground">
                          <div className="font-medium">
                            {formatTimeRange(appointment.startAt, appointment.endAt)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(appointment.startAt), "EEEE d 'de' MMMM", {
                              locale: es,
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          <div className="font-medium">{appointment.patientName}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatPatientMeta(appointment)}
                          </div>
                        </td>
                        {!isProfessional && (
                          <td className="px-4 py-3 text-sm text-foreground">
                            <div className="font-medium">{appointment.professionalName}</div>
                            <div className="text-xs text-muted-foreground">
                              {appointment.mutualName ?? 'Sin mutual asignada'}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <StatusBadge status={appointment.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            {canQuickConfirm && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleConfirm(appointment.id)}
                                disabled={isUpdating || cancelling}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CalendarCheck2 className="h-4 w-4" />
                                )}
                                Confirmar
                              </Button>
                            )}

                            {canQuickCancel && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCancelTarget(appointment);
                                  setCancelReason('');
                                }}
                                disabled={isUpdating || cancelling}
                              >
                                <XCircle className="h-4 w-4" />
                                Cancelar
                              </Button>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/appointments/${appointment.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                              Ver detalle
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">Cancelar turno</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Vas a cancelar el turno de{' '}
              <span className="font-medium text-foreground">{cancelTarget.patientName}</span> de las{' '}
              {format(parseISO(cancelTarget.startAt), 'HH:mm')}.
            </p>

            <div className="mt-4 space-y-2">
              <label
                htmlFor="dashboard-cancel-reason"
                className="text-sm font-medium text-foreground"
              >
                Motivo de cancelación *
              </label>
              <textarea
                id="dashboard-cancel-reason"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                className="min-h-[96px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Indicá el motivo de la cancelación..."
                disabled={cancelling}
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCancelTarget(null);
                  setCancelReason('');
                }}
                disabled={cancelling}
              >
                Volver
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelling || !cancelReason.trim()}
              >
                {cancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Confirmar cancelación
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
