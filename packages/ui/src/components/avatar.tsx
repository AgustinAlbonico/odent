import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/utils';

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

const avatarVariants = cva('relative flex shrink-0 overflow-hidden rounded-full', {
  variants: {
    size: {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-16 w-16 text-base',
      xl: 'h-24 w-24 text-xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface AvatarProps
  extends ComponentPropsWithRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  /** Image source URL. Falls back to initials when absent or on error. */
  src?: string | null;
  /** Alt text for the image. */
  alt?: string;
  /** Initials displayed when the image is unavailable (e.g. "JD"). */
  fallback?: string;
}

export function Avatar({ className, size, src, alt = '', fallback, ref, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root ref={ref} className={cn(avatarVariants({ size, className }))} {...props}>
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground"
        delayMs={src ? 600 : 0}
      >
        {fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export { avatarVariants };
