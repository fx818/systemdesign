/** Level unlock rules. Pure helpers — unit tested.
 *
 * - Chapter 1 starts open; later chapters need the previous chapter’s final level.
 * - Other levels require the previous level within the same chapter.
 * - A boss requires all earlier non-boss positions in its own chapter.
 */

export interface LevelLike {
  id: string;
  number: number;
  chapter?: number;
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
  const chapter = level.chapter ?? 1;
  const peers = all.filter((candidate) => (candidate.chapter ?? 1) === chapter);
  if (level.number <= 1) {
    if (chapter === 1) return true;
    const previous = all.filter((candidate) => (candidate.chapter ?? 1) === chapter - 1);
    const last = previous.find((candidate) => candidate.boss)
      ?? [...previous].sort((a, b) => b.number - a.number)[0];
    return last !== undefined && isDone(progress, last);
  }
  if (level.boss) {
    return Array.from({ length: level.number - 1 }, (_, i) => i + 1).every((number) => {
      const required = peers.find((candidate) => candidate.number === number && !candidate.boss);
      return required !== undefined && isDone(progress, required);
    });
  }
  const prev = peers.find((candidate) => !candidate.boss && candidate.number === level.number - 1);
  return prev !== undefined && isDone(progress, prev);
}

/** Ids of all unlocked levels, registry order preserved. */
export function unlockedIds(all: readonly LevelLike[], progress: ProgressMap): string[] {
  return all.filter((l) => isLevelUnlocked(l, all, progress)).map((l) => l.id);
}

/** The next level to play after `levelId` (by number, skipping nothing). */
export function nextLevel<T extends LevelLike>(all: readonly T[], levelId: string): T | null {
  const sorted = [...all].sort((a, b) => (a.chapter ?? 1) - (b.chapter ?? 1) || a.number - b.number);
  const idx = sorted.findIndex((l) => l.id === levelId);
  if (idx < 0 || idx >= sorted.length - 1) return null;
  return sorted[idx + 1];
}

/** Count of levels with at least 1 star. */
export function completedCount(all: readonly LevelLike[], progress: ProgressMap): number {
  return all.filter((l) => isDone(progress, l)).length;
}
