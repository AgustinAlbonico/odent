import { Skeleton } from './skeleton';

/* ------------------------------------------------------------------ */
/* SkeletonTable                                                       */
/* ------------------------------------------------------------------ */

export interface SkeletonTableProps {
  /** Number of data rows. Default: 5 */
  rows?: number;
  /** Number of columns. Default: 4 */
  columns?: number;
  /** Show header row. Default: true */
  showHeader?: boolean;
}

/**
 * Table skeleton matching the Table component layout.
 * Header row uses shorter, bolder blocks. Data rows are taller.
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
}: SkeletonTableProps) {
  const colWidths = getColumnWidths(columns);

  return (
    <div className="w-full space-y-0" aria-hidden="true">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-4 border-b border-border pb-3 mb-3">
          {colWidths.map((w) => (
            <Skeleton
              key={w}
              height="0.75rem"
              width={w}
              className="flex-1"
            />
          ))}
        </div>
      )}
      {/* Data rows */}
      {range(rows).map((rowId) => (
        <div
          key={rowId}
          className="flex items-center gap-4 border-b border-border/50 py-3"
        >
          {colWidths.map((w) => (
            <Skeleton
              key={`${rowId}-${w}`}
              height="0.875rem"
              width={w}
              className="flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Generates natural column width ratios. */
function getColumnWidths(columns: number): string[] {
  if (columns <= 0) return [];
  const widths: string[] = [];
  for (let i = 0; i < columns; i++) {
    // First column wider (name/id), last column narrower (actions)
    if (i === 0) widths.push('100%');
    else if (i === columns - 1) widths.push('60%');
    else widths.push('80%');
  }
  return widths;
}

/** Generates an array of stable IDs. */
function range(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `r${i}`);
}

/* ------------------------------------------------------------------ */
/* SkeletonCard                                                        */
/* ------------------------------------------------------------------ */

export function SkeletonCard() {
  return (
    <div className="space-y-4 p-6" aria-hidden="true">
      {/* Title */}
      <Skeleton height="1.25rem" width="60%" />
      {/* Description */}
      <Skeleton height="0.875rem" width="90%" />
      <Skeleton height="0.875rem" width="45%" />
      {/* Content spacer */}
      <div className="pt-2">
        <Skeleton height="2.5rem" width="40%" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SkeletonForm                                                        */
/* ------------------------------------------------------------------ */

export interface SkeletonFormProps {
  /** Number of form fields. Default: 3 */
  fields?: number;
  /** Show submit button. Default: true */
  showSubmit?: boolean;
}

/**
 * Form skeleton with label + input pairs.
 * Replicates the standard form layout (Label above, Input below).
 */
export function SkeletonForm({
  fields = 3,
  showSubmit = true,
}: SkeletonFormProps) {
  const fieldIds = range(fields);

  return (
    <div className="space-y-4" aria-hidden="true">
      {fieldIds.map((id) => (
        <div key={id} className="space-y-2">
          {/* Label */}
          <Skeleton height="0.875rem" width={id === 'r0' ? '3rem' : '5rem'} />
          {/* Input */}
          <Skeleton height="2.5rem" width="100%" />
        </div>
      ))}
      {/* Submit button */}
      {showSubmit && (
        <div className="pt-2">
          <Skeleton height="2.5rem" width="100%" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SkeletonMetric                                                      */
/* ------------------------------------------------------------------ */

export function SkeletonMetric() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {/* Label */}
      <Skeleton height="0.75rem" width="4.5rem" />
      {/* Value */}
      <Skeleton height="1.75rem" width="6rem" />
      {/* Comparison line */}
      <div className="flex gap-2">
        <Skeleton height="0.75rem" width="2rem" />
        <Skeleton height="0.75rem" width="5rem" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SkeletonSidebar                                                     */
/* ------------------------------------------------------------------ */

export interface SkeletonSidebarProps {
  /** Number of nav items. Default: 6 */
  items?: number;
  /** Collapsed state (icon only). Default: false */
  collapsed?: boolean;
}

/**
 * Sidebar skeleton for dashboard loading.
 * Shows logo area + nav items + user area.
 */
export function SkeletonSidebar({
  items = 6,
  collapsed = false,
}: SkeletonSidebarProps) {
  const navIds = range(items);

  return (
    <div className="flex h-full flex-col gap-2 p-4" aria-hidden="true">
      {/* Logo / app name */}
      <div className={collapsed ? 'flex justify-center pb-4' : 'pb-6'}>
        {collapsed ? (
          <Skeleton shape="circle" width={32} height={32} />
        ) : (
          <Skeleton height="1.25rem" width="70%" />
        )}
      </div>

      {/* Nav items */}
      <div className="flex flex-1 flex-col gap-1">
        {navIds.map((id) => (
          <div
            key={id}
            className={
              collapsed
                ? 'flex justify-center py-2'
                : 'flex items-center gap-3 py-2'
            }
          >
            {collapsed ? (
              <Skeleton shape="circle" width={24} height={24} />
            ) : (
              <>
                <Skeleton shape="circle" width={20} height={20} />
                <Skeleton height="0.875rem" width={id === 'r0' ? '60%' : '75%'} />
              </>
            )}
          </div>
        ))}
      </div>

      {/* User area */}
      <div className={collapsed ? 'flex justify-center pt-4' : 'flex items-center gap-3 pt-4'}>
        <Skeleton shape="circle" width={collapsed ? 28 : 32} height={collapsed ? 28 : 32} />
        {!collapsed && <Skeleton height="0.875rem" width="50%" />}
      </div>
    </div>
  );
}
