'use client';

import { CalendarDays } from 'lucide-react';
import type { CalendarEvent } from '@/lib/appointments-api';
import { buildCalendarSummary } from './calendar-config';

export interface CalendarSummaryProps {
  events: CalendarEvent[];
  title: string;
}

export function CalendarSummary({ events, title }: CalendarSummaryProps) {
  const summary = buildCalendarSummary(events);
  const total = events.length;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Resumen del período</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg bg-primary-subtle px-3 py-2 text-sm font-medium text-primary">
          <CalendarDays className="h-4 w-4" />
          {total} {total === 1 ? 'turno visible' : 'turnos visibles'}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summary.map(({ status, count, meta }) => (
          <div key={status} className="rounded-lg border border-border bg-background px-3 py-3">
            <p className="text-sm text-muted-foreground">{meta.label}</p>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <p className="text-2xl font-semibold text-foreground">{count}</p>
              <span
                className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${meta.badgeClassName}`}
              >
                {count === 1 ? 'turno' : 'turnos'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
