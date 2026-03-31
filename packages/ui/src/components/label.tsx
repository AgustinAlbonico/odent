import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/utils';

export type LabelProps = ComponentPropsWithRef<'label'>;

export function Label({ className, ref, ...props }: LabelProps) {
  return (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
}
