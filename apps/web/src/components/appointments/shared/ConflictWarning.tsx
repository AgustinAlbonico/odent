'use client';

import { Alert, AlertDescription, AlertTitle } from '@sistema-odontologico/ui';
import { AlertTriangle, Ban } from 'lucide-react';

export interface Conflict {
  type: 'hard' | 'soft';
  message: string;
  startAt: string;
  endAt: string;
}

export interface ConflictWarningProps {
  conflicts: Conflict[];
}

export function ConflictWarning({ conflicts }: ConflictWarningProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="space-y-2">
      {conflicts.map((conflict, i) =>
        conflict.type === 'hard' ? (
          <Alert key={i} variant="destructive">
            <Ban className="h-4 w-4" />
            <AlertTitle>Bloqueo de horario</AlertTitle>
            <AlertDescription>{conflict.message}</AlertDescription>
          </Alert>
        ) : (
          <Alert key={i} variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Advertencia</AlertTitle>
            <AlertDescription>{conflict.message}</AlertDescription>
          </Alert>
        ),
      )}
    </div>
  );
}
