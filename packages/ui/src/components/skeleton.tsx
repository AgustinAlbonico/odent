import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/utils';

/* ------------------------------------------------------------------ */
/* Skeleton — shimmer loading block                                    */
/* ------------------------------------------------------------------ */

export interface SkeletonProps extends ComponentPropsWithRef<'div'> {
  /** Width of the skeleton block. Default: "100%" */
  width?: string | number;
  /** Height of the skeleton block. Default: "1rem" */
  height?: string | number;
  /** Shape variant */
  shape?: 'rect' | 'circle';
}

/**
 * Base skeleton block with shimmer animation.
 * Use as a building block for structured loading placeholders.
 *
 * @example
 * <Skeleton height="1.5rem" width="60%" />
 * <Skeleton shape="circle" width={40} height={40} />
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  shape = 'rect',
  className,
  ref,
  ...props
}: SkeletonProps) {
  const resolvedWidth = typeof width === 'number' ? `${width}px` : width;
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        'shrink-0 bg-muted',
        shape === 'circle' ? 'rounded-full' : 'rounded-md',
        className
      )}
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
        backgroundImage:
          'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.4) 50%, transparent 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
      }}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* SkeletonText — multi-line text placeholder                          */
/* ------------------------------------------------------------------ */

export interface SkeletonTextProps {
  /** Number of lines. Default: 3 */
  lines?: number;
  /** Gap between lines. Default: "0.5rem" */
  gap?: string;
  /** Width of the last line (simulates ragged text). Default: "70%" */
  lastLineWidth?: string;
  /** Height of each line. Default: "0.875rem" (14px, text-sm) */
  lineHeight?: string;
}

/**
 * Multi-line text skeleton block.
 * Last line is shorter to simulate natural paragraph shape.
 *
 * @example
 * <SkeletonText lines={4} />
 */
export function SkeletonText({
  lines = 3,
  gap = '0.5rem',
  lastLineWidth = '70%',
  lineHeight = '0.875rem',
}: SkeletonTextProps) {
  return (
    <div
      className="flex flex-col"
      style={{ gap }}
      aria-hidden="true"
    >
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1 && lines > 1;
        return (
          <Skeleton
            key={`skeleton-line-${isLast ? 'last' : i}`}
            height={lineHeight}
            width={isLast ? lastLineWidth : '100%'}
          />
        );
      })}
    </div>
  );
}
