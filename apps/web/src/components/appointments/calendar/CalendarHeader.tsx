'use client';

import { Button, Card, CardContent, cn, hoverTransition } from '@sistema-odontologico/ui';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'timeGrid24h';

export interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarViewType;
  isProfessional: boolean;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onViewChange: (view: CalendarViewType) => void;
}

const VIEW_OPTIONS: { value: CalendarViewType; label: string }[] = [
  { value: 'dayGridMonth', label: 'Mes' },
  { value: 'timeGridWeek', label: 'Semana' },
  { value: 'timeGridDay', label: 'Día' },
  { value: 'timeGrid24h', label: 'Día completo' },
];

function formatPeriod(date: Date, view: CalendarViewType): string {
  switch (view) {
    case 'dayGridMonth':
      return format(date, 'MMMM yyyy', { locale: es });
    case 'timeGridWeek': {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${format(startOfWeek, "d 'de' MMMM", { locale: es })} — ${format(endOfWeek, "d 'de' MMMM yyyy", { locale: es })}`;
    }
    case 'timeGridDay':
    case 'timeGrid24h':
      return format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
    default:
      return format(date, 'MMMM yyyy', { locale: es });
  }
}

export function CalendarHeader({
  currentDate,
  view,
  isProfessional,
  onToday,
  onPrev,
  onNext,
  onViewChange,
}: CalendarHeaderProps) {
  return (
    <Card className="rounded-xl">
      <CardContent className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-subtle px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              {isProfessional ? 'Tu agenda profesional' : 'Agenda del consultorio'}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Calendario de turnos</h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Revisá el período actual, movete rápido entre fechas y elegí la vista más clara para
                trabajar.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="default" onClick={onToday}>
                <CalendarIcon className="h-4 w-4" />
                Ir a hoy
              </Button>
              <div className="inline-flex items-center rounded-lg border border-border bg-background">
                <Button
                  variant="ghost"
                  size="default"
                  onClick={onPrev}
                  className="rounded-r-none border-r border-border px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Período anterior</span>
                </Button>
                <Button
                  variant="ghost"
                  size="default"
                  onClick={onNext}
                  className="rounded-l-none px-3"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Período siguiente</span>
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Período visible
              </p>
              <p className="mt-1 text-lg font-semibold capitalize text-foreground">
                {formatPeriod(currentDate, view)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Elegí cómo querés ver la agenda</p>
            <p className="text-sm text-muted-foreground">
              Semana y día suelen ser las vistas más prácticas para el trabajo diario.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:inline-flex sm:flex-wrap sm:items-center sm:rounded-lg sm:bg-muted sm:p-1">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onViewChange(opt.value)}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium cursor-pointer',
                  hoverTransition,
                  view === opt.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-background text-muted-foreground hover:text-foreground sm:bg-transparent',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
