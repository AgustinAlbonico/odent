'use client';

import { Star } from 'lucide-react';

export interface HolidayIndicatorProps {
  date: string;
  name: string;
}

export function HolidayIndicator({ date, name }: HolidayIndicatorProps) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-warning"
      title={name}
    >
      <Star className="h-3 w-3" />
    </span>
  );
}
