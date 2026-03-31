import type { ComponentPropsWithRef } from 'react';
import { cn, focusRing } from '../lib/utils';

export type InputProps = ComponentPropsWithRef<'input'> & {
  error?: boolean;
};

export function Input({ className, error, ref, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
        'transition-colors duration-150',
        'placeholder:text-muted-foreground',
        focusRing,
        error
          ? 'border-destructive'
          : 'border-border',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      aria-invalid={error || undefined}
      {...props}
    />
  );
}
