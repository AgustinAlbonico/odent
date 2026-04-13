/** @vitest-environment jsdom */

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarView } from './CalendarView';

const mocks = vi.hoisted(() => ({
  getCalendarData: vi.fn(),
  onEventClick: vi.fn(),
}));

vi.mock('@/lib/appointments-api', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/appointments-api')>('@/lib/appointments-api');

  return {
    ...actual,
    getCalendarData: mocks.getCalendarData,
  };
});

vi.mock('@fullcalendar/react', () => ({
  default: React.forwardRef(function MockFullCalendar(props: Record<string, unknown>, ref) {
    React.useImperativeHandle(ref, () => ({
      getApi: () => ({
        view: { type: props.initialView },
        changeView: vi.fn(),
        setOption: vi.fn(),
        gotoDate: vi.fn(),
      }),
    }));

    React.useEffect(() => {
      const datesSet = props.datesSet as ((arg: { start: Date; end: Date }) => void) | undefined;
      datesSet?.({
        start: new Date('2026-04-01T00:00:00.000Z'),
        end: new Date('2026-04-08T00:00:00.000Z'),
      });
    }, [props.datesSet]);

    return React.createElement('div', { 'data-testid': 'mock-calendar' });
  }),
}));

let container: HTMLDivElement | null = null;
let root: Root | null = null;

describe('CalendarView', () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    mocks.getCalendarData.mockReset();
    mocks.onEventClick.mockReset();
    mocks.getCalendarData.mockResolvedValue([]);
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

  it('fetches calendar events on the first render', async () => {
    await act(async () => {
      root?.render(
        <CalendarView
          view="timeGridWeek"
          currentDate={new Date('2026-04-01T00:00:00.000Z')}
          professionalId="professional-1"
          includeCancelled={false}
          onEventClick={mocks.onEventClick}
        />,
      );
      await Promise.resolve();
    });

    expect(mocks.getCalendarData).toHaveBeenCalledTimes(1);
  });
});
