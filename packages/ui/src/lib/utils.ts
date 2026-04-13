import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with clsx conditionals. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Standard focus ring — focus-visible only, no ring on mouse click. */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/** Standard hover transition for color/background/border changes. */
export const hoverTransition = 'transition-colors duration-150 ease-out';

/** Standard hover transition for opacity/shadow/transform affordances. */
export const interactiveTransition =
  'transition-[opacity,box-shadow,transform] duration-150 ease-out';

/** Disabled state utility. */
export const disabledStyles = 'disabled:pointer-events-none disabled:opacity-50';
