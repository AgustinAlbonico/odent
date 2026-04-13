'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
} from '@sistema-odontologico/ui';
import { Filter, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProfessionals, type ProfessionalSelectItem } from '@/lib/appointments-api';

export interface CalendarFiltersProps {
  professionalId: string | undefined;
  includeCancelled: boolean;
  showProfessionalFilter: boolean;
  onProfessionalChange: (id: string | undefined) => void;
  onIncludeCancelledChange: (value: boolean) => void;
}

export function CalendarFilters({
  professionalId,
  includeCancelled,
  showProfessionalFilter,
  onProfessionalChange,
  onIncludeCancelledChange,
}: CalendarFiltersProps) {
  const [professionals, setProfessionals] = useState<ProfessionalSelectItem[]>([]);
  const [loading, setLoading] = useState(showProfessionalFilter);

  useEffect(() => {
    if (!showProfessionalFilter) {
      setProfessionals([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    getProfessionals()
      .then((data) => {
        if (!cancelled) setProfessionals(data);
      })
      .catch(() => {
        if (!cancelled) setProfessionals([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showProfessionalFilter]);

  const hasActiveFilters = professionalId || includeCancelled;

  return (
    <Card className="rounded-xl">
      <CardHeader className="border-b border-border px-4 py-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4" />
          Ajustes de agenda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 py-4 sm:px-6">
        {!showProfessionalFilter && (
          <div className="flex flex-col gap-3 rounded-lg border border-primary/15 bg-primary-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-background p-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Estás viendo tu agenda</p>
                <p className="text-sm text-muted-foreground">
                  Ya filtramos tus turnos para que no tengas que elegir profesional.
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-background text-primary">
              Modo profesional
            </Badge>
          </div>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-4 md:grid-cols-2">
            {/* Professional select */}
            {showProfessionalFilter && (
              <div className="min-w-0">
                <Label htmlFor="calendar-professional" className="text-sm font-medium">
                  Profesional
                </Label>
                <select
                  id="calendar-professional"
                  value={professionalId ?? ''}
                  onChange={(e) => onProfessionalChange(e.target.value || undefined)}
                  className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={loading}
                >
                  <option value="">Todos los profesionales</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Include cancelled toggle */}
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="include-cancelled"
                  checked={includeCancelled}
                  onChange={(e) => onIncludeCancelledChange(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <Label htmlFor="include-cancelled" className="cursor-pointer text-sm font-medium">
                    Mostrar también los cancelados
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Activá esta opción si necesitás revisar cambios o ausencias.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="default"
              onClick={() => {
                onProfessionalChange(undefined);
                onIncludeCancelledChange(false);
              }}
              className="w-full lg:w-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar ajustes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
