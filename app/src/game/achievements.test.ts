import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { earnedAchievements, type PracticeEvent } from './achievements';
import { useGame } from './store';
import { addDays, todayKey } from './streak';
const state = () => useGame.getState();
beforeEach(() => { state().resetProgress(); });
afterEach(() => vi.useRealTimers());

describe('hidden achievements', () => {
  it.each<[PracticeEvent, string]>([
    [{ type: 'lab', killed: 5 }, 'chaos-monkey'],
    [{ type: 'mission', boss: true, passed: true, uptime: 1, cost: 800, budget: 1000 }, 'zero-downtime'],
    [{ type: 'mission', boss: false, passed: true, uptime: 0.98, cost: 600, budget: 1000 }, 'penny-pincher'],
    [{ type: 'quiz', maxCombo: 5 }, 'combo-king'], [{ type: 'activity', hour: 0 }, 'night-owl'],
    [{ type: 'puzzle', streak: 7 }, 'puzzle-streak-7'], [{ type: 'survival', seconds: 180 }, 'survivor'],
  ])('awards only eligible achievements', (event, id) => { expect(earnedAchievements(event, {})).toContain(id); });
  it('rejects near misses and failing missions', () => {
    for (const event of [
      { type: 'lab', killed: 4 }, { type: 'quiz', maxCombo: 4 }, { type: 'activity', hour: 12 }, { type: 'survival', seconds: 179.9 },
      { type: 'mission', boss: true, passed: false, uptime: 1, cost: 1, budget: 1000 },
      { type: 'mission', boss: true, passed: true, uptime: 0.999, cost: 601, budget: 1000 },
    ] satisfies PracticeEvent[]) expect(earnedAchievements(event, {})).toEqual([]);
  });
  it('automatically awards Flawless on the fifth three-star level', () => {
    for (let i = 1; i <= 4; i++) state().setStars(`L${i}`, 3);
    expect(state().achievements.flawless).toBeUndefined();
    state().setStars('C2L01', 3); expect(state().achievements.flawless).toBeDefined();
  });
  it('awards a timestamp once and persists it', () => {
    state().recordPracticeEvent({ type: 'quiz', maxCombo: 5 });
    const earned = state().achievements['combo-king'];
    state().recordPracticeEvent({ type: 'quiz', maxCombo: 8 });
    expect(state().achievements['combo-king']).toBe(earned);
    expect(JSON.parse(localStorage.getItem('sdq:game')!).state.achievements['combo-king']).toBe(earned);
  });
  it('puzzle rewards are once per day, with gap-aware streaks', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 1, 12));
    for (let i = 0; i < 7; i++) {
      vi.setSystemTime(new Date(2026, 9, 1 + i, 12));
      state().finishPuzzle(todayKey(), 4); state().finishPuzzle(todayKey(), 3);
    }
    expect(state().xp).toBe(700); expect(state().practice.puzzleStreak.count).toBe(7);
    expect(state().achievements['puzzle-streak-7']).toBeDefined();
    const today = todayKey(); state().finishPuzzle(addDays(today, 1), 2); expect(state().xp).toBe(700);
    vi.setSystemTime(new Date(2026, 9, 10, 12)); state().finishPuzzle(todayKey(), 5);
    expect(state().practice.puzzleStreak.count).toBe(1);
  });
  it('keeps survival bests and idempotent interview rewards', () => {
    state().finishSurvival(180); state().finishSurvival(100); state().finishSurvival(NaN);
    expect(state().practice.survivalBest).toBe(180);
    expect(state().achievements.survivor).toBeDefined();
    state().finishInterview('session', 88, 440); state().finishInterview('session', 100, 500);
    expect(state().practice.interviews).toBe(1); expect(state().practice.bestInterview).toBe(88); expect(state().xp).toBe(440);
  });
});
