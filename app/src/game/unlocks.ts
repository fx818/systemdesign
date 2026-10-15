/** Level unlock rules. Pure helpers — unit tested.
 *
 * - L01 is always open.
 * - Any other level opens once the previous level has >= 1 star.
 * - The boss level (L13) opens once every non-boss level is done (>= 1 star).
 */

export interface LevelLike {
  id: string;
  number: number;
  boss?: boolean;
}

export interface ProgressLike {
  stars: number; // 0..3
}

export type ProgressMap = Record<string, ProgressLike | undefined>;

export function starsOf(progress: ProgressMap, levelId: string): number {
  return progress[levelId]?.stars ?? 0;
}

export function isDone(progress: ProgressMap, level: LevelLike): boolean {
  return starsOf(progress, level.id) >= 1;
}

export function isLevelUnlocked(level: LevelLike, all: readonly LevelLike[], progress: ProgressMap): boolean {
  if (level.boss) {
    return Array.from({ length: level.number - 1 }, (_, i) => i + 1).every((number) => {
      const required = all.find((candidate) => candidate.number === number && !candidate.boss);
      return required !== undefined && isDone(progress, required);
    });
  }
  if (level.number <= 1) return true;
  const prev = all.find((l) => !l.boss && l.number === level.number - 1);
  if (!prev) return false;
  return isDone(progress, prev);
}

/** Ids of all unlocked levels, registry order preserved. */
export function unlockedIds(all: readonly LevelLike[], progress: ProgressMap): string[] {
  return all.filter((l) => isLevelUnlocked(l, all, progress)).map((l) => l.id);
}

/** The next level to play after `levelId` (by number, skipping nothing). */
export function nextLevel<T extends LevelLike>(all: readonly T[], levelId: string): T | null {
  const sorted = [...all].sort((a, b) => a.number - b.number);
  const idx = sorted.findIndex((l) => l.id === levelId);
  if (idx < 0 || idx >= sorted.length - 1) return null;
  return sorted[idx + 1];
}

/** Count of levels with at least 1 star. */
export function completedCount(all: readonly LevelLike[], progress: ProgressMap): number {
  return all.filter((l) => isDone(progress, l)).length;
}
