import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 bg-destructive/5 text-destructive [&>svg]:text-destructive',
        warning:
          'border-warning/50 bg-warning/5 text-warning [&>svg]:text-warning',
        success:
          'border-success/50 bg-success/5 text-success [&>svg]:text-success',
        info:
          'border-info/50 bg-info/5 text-info [&>svg]:text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type AlertProps = ComponentPropsWithRef<'div'> &
  VariantProps<typeof alertVariants>;

export function Alert({ className, variant, ref, ...props }: AlertProps) {
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export type AlertTitleProps = ComponentPropsWithRef<'h5'>;

export function AlertTitle({ className, ref, ...props }: AlertTitleProps) {
  return (
    <h5
      ref={ref}
      className={cn('mb-1 font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

export type AlertDescriptionProps = ComponentPropsWithRef<'div'>;

export function AlertDescription({
  className,
  ref,
  ...props
}: AlertDescriptionProps) {
  return (
    <div
      ref={ref}
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}

export { alertVariants };
