'use client';

import { Action, Module } from '@sistema-odontologico/permissions';
import { CalendarOff, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCalendarRoleConfig } from '@/components/appointments/calendar/calendar-config';
import { ReceptionistWeeklyGrid } from '@/components/appointments/calendar/ReceptionistWeeklyGrid';
import { WeeklyGrid } from '@/components/appointments/calendar/WeeklyGrid';
import { WeekNav } from '@/components/appointments/calendar/WeekNav';
import { useAbilities } from '@/hooks/use-abilities';
import { useAuth } from '@/hooks/use-auth';
import { getProfessionals, type ProfessionalSelectItem } from '@/lib/appointments-api';

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { hasAbility } = useAbilities();
  const canView = hasAbility(Module.TURNS, Action.VIEW_LIST);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | undefined>(
    searchParams.get('professionalId') ?? undefined,
  );
  const [professionals, setProfessionals] = useState<ProfessionalSelectItem[]>([]);
  const [professionalsLoading, setProfessionalsLoading] = useState(false);

  const roleConfig = useMemo(
    () => getCalendarRoleConfig(user, selectedProfessionalId),
    [user, selectedProfessionalId],
  );
  const showOperationalGrid =
    !roleConfig.isProfessional && Boolean(roleConfig.effectiveProfessionalId);

  useEffect(() => {
    if (roleConfig.isProfessional || !isAuthenticated) return;

    let cancelled = false;
    setProfessionalsLoading(true);

    getProfessionals()
      .then((data) => {
        if (!cancelled) {
          setProfessionals(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfessionals([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProfessionalsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [roleConfig.isProfessional, isAuthenticated]);

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams();
    if (!roleConfig.isProfessional && selectedProfessionalId) {
      params.set('professionalId', selectedProfessionalId);
    }
    const qs = params.toString();
    router.replace(`/appointments/calendar${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [selectedProfessionalId, router, roleConfig.isProfessional]);

  const handleEventClick = useCallback(
    (appointmentId: string) => {
      router.push(`/appointments/${appointmentId}`);
    },
    [router],
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <CalendarOff className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No tenés permisos para ver el calendario.</p>
      </div>
    );
  }

  if (roleConfig.isProfessional && roleConfig.effectiveProfessionalId) {
    return (
      <div className="space-y-4 pb-6">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <WeekNav
            currentDate={currentDate}
            onDateJump={setCurrentDate}
            onDateSelect={setCurrentDate}
          />
        </div>

        <WeeklyGrid
          professionalId={roleConfig.effectiveProfessionalId}
          weekDate={currentDate}
          selectedDate={currentDate}
          onDateSelect={setCurrentDate}
          onEventClick={handleEventClick}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <WeekNav
          currentDate={currentDate}
          onDateJump={setCurrentDate}
          onDateSelect={setCurrentDate}
        />

        {roleConfig.showProfessionalFilter && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <label
                  htmlFor="calendar-professional-filter"
                  className="text-sm font-medium text-foreground"
                >
                  Profesional para operar agenda
                </label>
                <p className="text-xs text-muted-foreground">
                  Sin selección ves el resumen semanal. Al elegir un profesional se habilita la
                  reserva desde la grilla.
                </p>
              </div>

              <div className="w-full lg:max-w-sm">
                <select
                  id="calendar-professional-filter"
                  value={selectedProfessionalId ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedProfessionalId(value || undefined);
                  }}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={professionalsLoading}
                >
                  <option value="">Resumen semanal multi-profesional</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {showOperationalGrid && roleConfig.effectiveProfessionalId ? (
        <WeeklyGrid
          professionalId={roleConfig.effectiveProfessionalId}
          weekDate={currentDate}
          selectedDate={currentDate}
          onDateSelect={setCurrentDate}
          onEventClick={handleEventClick}
        />
      ) : (
        <ReceptionistWeeklyGrid
          weekDate={currentDate}
          selectedDate={currentDate}
          onDateSelect={setCurrentDate}
          onEventClick={handleEventClick}
          professionalId={roleConfig.effectiveProfessionalId}
        />
      )}
    </div>
  );
}
