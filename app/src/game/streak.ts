/** Daily streak by LOCAL calendar date. Pure helpers — unit tested. */

export interface Streak {
  count: number;
  /** Local date key (yyyy-mm-dd) of the last activity, or null. */
  lastDate: string | null;
}

/** Local date key in the form yyyy-mm-dd (no UTC surprises). */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(now: Date = new Date()): string {
  return dateKey(now);
}

/** Local date key of the day before `key`. */
export function previousDayKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return dateKey(dt);
}

/** `days` days after the given local date key. */
export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return dateKey(dt);
}

/**
 * Record activity on `today`:
 * - same day       -> unchanged
 * - consecutive    -> count + 1
 * - gap (or first) -> restart at 1
 */
export function nextStreak(streak: Streak, today: string): Streak {
  if (streak.lastDate === today) return streak;
  if (streak.lastDate !== null && previousDayKey(today) === streak.lastDate) {
    return { count: streak.count + 1, lastDate: today };
  }
  return { count: 1, lastDate: today };
}

/** A streak "counts" today if the last activity was today or yesterday. */
export function streakAlive(streak: Streak, today: string): boolean {
  return streak.lastDate === today || streak.lastDate === previousDayKey(today);
}
