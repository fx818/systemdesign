import { describe, expect, it } from 'vitest';
import { addDays, dateKey, nextStreak, previousDayKey, streakAlive } from './streak';

describe('streak', () => {
  it('formats local date keys', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('walks back/forward across month boundaries', () => {
    expect(previousDayKey('2026-03-01')).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('starts a streak at 1', () => {
    expect(nextStreak({ count: 0, lastDate: null }, '2026-01-10')).toEqual({ count: 1, lastDate: '2026-01-10' });
  });

  it('is idempotent within the same day', () => {
    const s = { count: 4, lastDate: '2026-01-10' };
    expect(nextStreak(s, '2026-01-10')).toEqual(s);
  });

  it('increments on consecutive days', () => {
    const s = nextStreak({ count: 4, lastDate: '2026-01-10' }, '2026-01-11');
    expect(s).toEqual({ count: 5, lastDate: '2026-01-11' });
  });

  it('resets after a gap', () => {
    const s = nextStreak({ count: 9, lastDate: '2026-01-08' }, '2026-01-10');
    expect(s).toEqual({ count: 1, lastDate: '2026-01-10' });
  });

  it('stays alive today and yesterday only', () => {
    expect(streakAlive({ count: 2, lastDate: '2026-01-10' }, '2026-01-10')).toBe(true);
    expect(streakAlive({ count: 2, lastDate: '2026-01-09' }, '2026-01-10')).toBe(true);
    expect(streakAlive({ count: 2, lastDate: '2026-01-08' }, '2026-01-10')).toBe(false);
  });
});
