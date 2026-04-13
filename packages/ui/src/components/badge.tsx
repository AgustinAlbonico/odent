import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn, hoverTransition } from '../lib/utils';

const badgeVariants = cva(
  `inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${hoverTransition}`,
  {
    variants: {
      variant: {
        default: 'bg-primary-subtle text-primary',
        secondary: 'bg-muted text-muted-foreground',
        destructive: 'bg-destructive/10 text-destructive',
        warning: 'bg-warning/10 text-warning',
        success: 'bg-success/10 text-success',
        info: 'bg-info/10 text-info',
        outline: 'border border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type BadgeProps = ComponentPropsWithRef<'span'> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ref, ...props }: BadgeProps) {
  return <span ref={ref} className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { badgeVariants };
