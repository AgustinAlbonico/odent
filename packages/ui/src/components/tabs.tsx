import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentPropsWithRef } from 'react';
import { cn, focusRing, hoverTransition } from '../lib/utils';

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

export const Tabs = TabsPrimitive.Root;

export type TabsListProps = ComponentPropsWithRef<typeof TabsPrimitive.List>;

export function TabsList({ className, ref, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}
      {...props}
    />
  );
}

export type TabsTriggerProps = ComponentPropsWithRef<typeof TabsPrimitive.Trigger>;

export function TabsTrigger({ className, ref, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'tabs-trigger',
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium',
        hoverTransition,
        'cursor-pointer',
        'text-muted-foreground hover:text-foreground',
        focusRing,
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export type TabsContentProps = ComponentPropsWithRef<typeof TabsPrimitive.Content>;

export function TabsContent({ className, ref, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn('mt-4 focus-visible:outline-none', className)}
      {...props}
    />
  );
}
