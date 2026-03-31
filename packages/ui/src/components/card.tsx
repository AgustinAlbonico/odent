import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/utils';

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export type CardProps = ComponentPropsWithRef<'div'>;

export function Card({ className, ref, ...props }: CardProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* CardHeader                                                          */
/* ------------------------------------------------------------------ */

export type CardHeaderProps = ComponentPropsWithRef<'div'>;

export function CardHeader({ className, ref, ...props }: CardHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* CardTitle                                                           */
/* ------------------------------------------------------------------ */

export type CardTitleProps = ComponentPropsWithRef<'h3'>;

export function CardTitle({ className, ref, ...props }: CardTitleProps) {
  return (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* CardDescription                                                     */
/* ------------------------------------------------------------------ */

export type CardDescriptionProps = ComponentPropsWithRef<'p'>;

export function CardDescription({ className, ref, ...props }: CardDescriptionProps) {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* CardContent                                                         */
/* ------------------------------------------------------------------ */

export type CardContentProps = ComponentPropsWithRef<'div'>;

export function CardContent({ className, ref, ...props }: CardContentProps) {
  return (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  );
}

/* ------------------------------------------------------------------ */
/* CardFooter                                                          */
/* ------------------------------------------------------------------ */

export type CardFooterProps = ComponentPropsWithRef<'div'>;

export function CardFooter({ className, ref, ...props }: CardFooterProps) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  );
}
