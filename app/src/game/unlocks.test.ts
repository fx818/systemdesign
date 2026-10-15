import { describe, expect, it } from 'vitest';
import { completedCount, isLevelUnlocked, nextLevel, unlockedIds } from './unlocks';
import type { LevelLike } from './unlocks';

const levels: LevelLike[] = [
  { id: 'L01', number: 1 },
  { id: 'L02', number: 2 },
  { id: 'L03', number: 3 },
  { id: 'L13', number: 13, boss: true },
];

describe('unlocks', () => {
  it('L01 is always open, everything else starts locked', () => {
    expect(isLevelUnlocked(levels[0], levels, {})).toBe(true);
    expect(isLevelUnlocked(levels[1], levels, {})).toBe(false);
    expect(isLevelUnlocked(levels[3], levels, {})).toBe(false);
  });

  it('the next level opens once the previous one has >= 1 star', () => {
    const progress = { L01: { stars: 1 } };
    expect(isLevelUnlocked(levels[1], levels, progress)).toBe(true);
    expect(isLevelUnlocked(levels[2], levels, progress)).toBe(false);
  });

  it('boss requires every non-boss level done', () => {
    const partial = { L01: { stars: 3 }, L02: { stars: 1 }, L03: { stars: 0 } };
    expect(isLevelUnlocked(levels[3], levels, partial)).toBe(false);
    const full = { L01: { stars: 1 }, L02: { stars: 1 }, L03: { stars: 1 } };
    expect(isLevelUnlocked(levels[3], levels, full)).toBe(true);
  });

  it('stays locked when the previous level is missing from the registry', () => {
    const lonely: LevelLike[] = [{ id: 'L02', number: 2 }];
    expect(isLevelUnlocked(lonely[0], lonely, {})).toBe(false);
  });

  it('unlockedIds preserves registry order', () => {
    const progress = { L01: { stars: 1 } };
    expect(unlockedIds(levels, progress)).toEqual(['L01', 'L02']);
  });

  it('completedCount counts levels with >= 1 star', () => {
    expect(completedCount(levels, { L01: { stars: 2 }, L02: { stars: 0 } })).toBe(1);
  });

  it('nextLevel walks by level number', () => {
    expect(nextLevel(levels, 'L01')?.id).toBe('L02');
    expect(nextLevel(levels, 'L13')).toBeNull();
    expect(nextLevel(levels, 'NOPE')).toBeNull();
  });
});
