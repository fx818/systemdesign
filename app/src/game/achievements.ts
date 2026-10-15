import type { ProgressMap } from './unlocks';
export const ACHIEVEMENTS = [
  { id: 'chaos-monkey', name: 'Chaos Monkey', description: 'Kill at least five distinct nodes in one lab.' },
  { id: 'zero-downtime', name: 'Zero Downtime', description: 'Finish a boss mission at 100% uptime.' },
  { id: 'penny-pincher', name: 'Penny Pincher', description: 'Pass a mission using at most 60% of its budget.' },
  { id: 'combo-king', name: 'Combo King', description: 'Reach the ×2 multiplier with five consecutive quiz answers.' },
  { id: 'night-owl', name: 'Night Owl', description: 'Play between midnight and 5 a.m. local time.' },
  { id: 'flawless', name: 'Flawless', description: 'Earn three stars on five levels.' },
  { id: 'puzzle-streak-7', name: 'Puzzle streak 7', description: 'Solve the daily puzzle seven days in a row.' },
  { id: 'survivor', name: 'Survivor', description: 'Survive for at least 180 seconds.' },
] as const;
export type AchievementId = typeof ACHIEVEMENTS[number]['id'];
export type PracticeEvent =
  | { type: 'activity'; hour: number }
  | { type: 'lab'; killed: number }
  | { type: 'mission'; boss: boolean; passed: boolean; uptime: number; cost: number; budget: number }
  | { type: 'quiz'; maxCombo: number }
  | { type: 'puzzle'; streak: number }
  | { type: 'survival'; seconds: number }
  | { type: 'stars' };
export function earnedAchievements(event: PracticeEvent, progress: ProgressMap): AchievementId[] {
  const earned: AchievementId[] = [];
  if (Object.values(progress).filter(p => p?.stars === 3).length >= 5) earned.push('flawless');
  switch (event.type) {
    case 'activity': if (event.hour >= 0 && event.hour < 5) earned.push('night-owl'); break;
    case 'lab': if (event.killed >= 5) earned.push('chaos-monkey'); break;
    case 'mission':
      if (event.passed && event.boss && event.uptime === 1) earned.push('zero-downtime');
      if (event.passed && Number.isFinite(event.budget) && event.budget > 0 && event.cost >= 0 && event.cost <= event.budget * 0.6) earned.push('penny-pincher');
      break;
    case 'quiz': if (event.maxCombo >= 5) earned.push('combo-king'); break;
    case 'puzzle': if (event.streak >= 7) earned.push('puzzle-streak-7'); break;
    case 'survival': if (Number.isFinite(event.seconds) && event.seconds >= 180) earned.push('survivor'); break;
  }
  return earned;
}
