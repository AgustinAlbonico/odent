/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarFilters } from './CalendarFilters';

const mocks = vi.hoisted(() => ({
  getProfessionals: vi.fn(),
}));

vi.mock('@/lib/appointments-api', () => ({
  getProfessionals: mocks.getProfessionals,
}));

let container: HTMLDivElement | null = null;
let root: Root | null = null;

describe('CalendarFilters', () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    mocks.getProfessionals.mockReset();
    mocks.getProfessionals.mockResolvedValue([{ id: '1', name: 'Dra. Pérez', specialty: null }]);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    root = null;
    container = null;
  });

  async function renderFilters(showProfessionalFilter: boolean) {
    await act(async () => {
      root?.render(
        <CalendarFilters
          professionalId={undefined}
          includeCancelled={false}
          showProfessionalFilter={showProfessionalFilter}
          onProfessionalChange={() => undefined}
          onIncludeCancelledChange={() => undefined}
        />,
      );
    });
  }

  it('does not request professionals when the professional selector is hidden', async () => {
    await renderFilters(false);

    expect(mocks.getProfessionals).not.toHaveBeenCalled();
  });

  it('loads professionals when the selector is visible', async () => {
    await renderFilters(true);

    expect(mocks.getProfessionals).toHaveBeenCalledTimes(1);
  });
});
