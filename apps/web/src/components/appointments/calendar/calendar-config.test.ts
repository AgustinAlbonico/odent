import { describe, expect, it } from 'vitest';
import {
  type CalendarRoleUser,
  getAdaptiveCalendarView,
  getCalendarRoleConfig,
} from './calendar-config';

describe('calendar-config', () => {
  it('forces professionals into their own agenda and hides the selector', () => {
    const user: CalendarRoleUser = {
      id: 'professional-user-id',
      role: 'profesional',
    };

    expect(getCalendarRoleConfig(user, 'another-professional')).toEqual({
      effectiveProfessionalId: 'professional-user-id',
      isProfessional: true,
      showProfessionalFilter: false,
    });
  });

  it('keeps requested professional filters for admin and assistant users', () => {
    const admin: CalendarRoleUser = {
      id: 'admin-user-id',
      role: 'admin',
    };

    expect(getCalendarRoleConfig(admin, 'selected-professional')).toEqual({
      effectiveProfessionalId: 'selected-professional',
      isProfessional: false,
      showProfessionalFilter: true,
    });
  });

  it('switches dense views to a list on compact screens', () => {
    expect(getAdaptiveCalendarView('dayGridMonth', true)).toBe('listWeek');
    expect(getAdaptiveCalendarView('timeGridWeek', true)).toBe('listWeek');
    expect(getAdaptiveCalendarView('timeGridDay', true)).toBe('timeGridDay');
    expect(getAdaptiveCalendarView('timeGrid24h', true)).toBe('timeGridDay');
  });
});
