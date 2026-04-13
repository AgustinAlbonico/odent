'use client';

import { cn, hoverTransition } from '@sistema-odontologico/ui';
import { useEffect, useRef, useState } from 'react';
import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

export interface WeekNavProps {
  currentDate: Date;
  onDateJump: (date: Date) => void;
  onDateSelect?: (date: Date) => void;
}

export function WeekNav({ currentDate, onDateJump, onDateSelect }: WeekNavProps) {
  const weekStart = startOfWeek(currentDate, { locale: es, weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { locale: es, weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState<Date>(currentDate);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // Sync local picker month when external currentDate changes
  useEffect(() => {
    setPickerMonth(currentDate);
  }, [currentDate]);

  useEffect(() => {
    if (!pickerOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current) return;
      if (pickerRef.current.contains(event.target as Node)) return;
      setPickerOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [pickerOpen]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Semana visible
          </p>
          <p className="text-base font-semibold text-foreground sm:text-lg">
            Semana del {format(weekStart, 'dd/MM')} al {format(weekEnd, 'dd/MM')}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Elegir fecha</p>
          <div ref={pickerRef} className="relative inline-block">
            <button
              type="button"
              onClick={() => setPickerOpen((prev) => !prev)}
              className={cn(
                'inline-flex h-10 min-w-52 items-center justify-between gap-3 rounded-md border border-border bg-background px-3 text-sm text-foreground cursor-pointer hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                hoverTransition,
              )}
              aria-haspopup="dialog"
              aria-expanded={pickerOpen}
              aria-label="Elegir fecha"
            >
              <span>{format(currentDate, 'dd/MM/yyyy')}</span>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </button>

            {pickerOpen && (
              <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 rounded-xl border border-border bg-card p-3 shadow-xl">
                <DayPicker
                  mode="single"
                  selected={currentDate}
                  month={pickerMonth}
                  onMonthChange={setPickerMonth}
                  onSelect={(date) => {
                    if (!date) return;
                    onDateJump(date);
                    setPickerOpen(false);
                  }}
                  locale={es}
                  showOutsideDays
                  weekStartsOn={1}
                  captionLayout="dropdown"
                  startMonth={new Date(2020, 0)}
                  endMonth={new Date(2035, 11)}
                  className="text-sm"
                  classNames={{
                    months: 'flex flex-col',
                    month: 'space-y-3',
                    caption: 'flex items-center justify-between gap-2 px-1',
                    caption_label: 'text-sm font-semibold text-foreground',
                    nav: 'flex items-center gap-1',
                    button_previous: cn(
                      'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground cursor-pointer hover:bg-muted',
                      hoverTransition,
                    ),
                    button_next: cn(
                      'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground cursor-pointer hover:bg-muted',
                      hoverTransition,
                    ),
                    month_grid: 'w-full border-collapse',
                    weekdays: 'grid grid-cols-7',
                    weekday: 'text-center text-xs font-medium uppercase text-muted-foreground',
                    week: 'mt-1 grid grid-cols-7',
                    day: 'flex items-center justify-center',
                    day_button: cn(
                      'flex h-9 w-9 items-center justify-center rounded-md text-sm text-foreground cursor-pointer hover:bg-muted',
                      hoverTransition,
                    ),
                    today: 'font-semibold text-primary',
                    selected: 'bg-primary text-primary-foreground hover:bg-primary',
                    outside: 'text-muted-foreground/50',
                    dropdowns: 'flex items-center gap-1.5',
                    dropdown: cn(
                      'h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground cursor-pointer hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E")] bg-[length:12px] bg-[position:right_6px_center] bg-no-repeat pr-6',
                      hoverTransition,
                    ),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 self-start lg:self-auto">
        {days.map((day) => {
          const selected = onDateSelect && isSameDay(day, currentDate);
          const today = isToday(day);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDateSelect?.(day)}
              className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg text-xs transition-colors duration-150 ease-out cursor-pointer ${
                selected
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : today
                    ? 'bg-primary-subtle text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <span className="leading-none">{format(day, 'EEE', { locale: es }).slice(0, 2)}</span>
              <span className="text-sm leading-tight">{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
