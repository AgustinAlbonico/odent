import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn, focusRing, hoverTransition, disabledStyles } from '../lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap rounded-lg text-sm font-semibold',
    'cursor-pointer',
    hoverTransition,
    focusRing,
    disabledStyles,
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover active:opacity-80',
        secondary: 'bg-muted text-foreground hover:bg-muted/80 active:opacity-80',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:opacity-80',
        outline:
          'border border-border bg-background text-foreground hover:bg-muted active:opacity-80',
        ghost: 'text-foreground hover:bg-muted active:opacity-80',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonProps = ComponentPropsWithRef<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild = false, ref, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
}

export { buttonVariants };
