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
    const all = Array.from({ length: 13 }, (_, i) => ({ id: `L${String(i + 1).padStart(2, '0')}`, number: i + 1, boss: i === 12 }));
    const full = Object.fromEntries(all.slice(0, 12).map((level) => [level.id, { stars: 1 }]));
    expect(isLevelUnlocked(all[12], all, full)).toBe(true);
    expect(isLevelUnlocked(levels[3], levels, full)).toBe(false); // missing content is still locked
    expect(isLevelUnlocked(all[12], [all[12]], {})).toBe(false);
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

describe('chapter unlocks', () => {
  const all: LevelLike[] = [
    { id: 'L01', number: 1 }, { id: 'L02', number: 2, boss: true },
    { id: 'C2L01', number: 1, chapter: 2 }, { id: 'C2L02', number: 2, chapter: 2 },
    { id: 'C2L03', number: 3, chapter: 2, boss: true }, { id: 'C3L01', number: 1, chapter: 3 },
  ];
  it('gates the first level on the previous chapter final level', () => {
    expect(isLevelUnlocked(all[2], all, {})).toBe(false);
    expect(isLevelUnlocked(all[2], all, { L01: { stars: 3 } })).toBe(false);
    expect(isLevelUnlocked(all[2], all, { L02: { stars: 1 } })).toBe(true);
    expect(isLevelUnlocked(all[5], all, { C2L02: { stars: 3 } })).toBe(false);
    expect(isLevelUnlocked(all[5], all, { C2L03: { stars: 1 } })).toBe(true);
    expect(isLevelUnlocked({ id: 'C4L01', number: 1, chapter: 4 }, all, {})).toBe(false);
  });
  it('uses the last level when the previous chapter has no boss', () => {
    expect(isLevelUnlocked(all[5], all.filter(l => l.id !== 'C2L03'), { C2L02: { stars: 1 } })).toBe(true);
  });
  it('keeps prerequisites and boss rules inside their chapter', () => {
    expect(isLevelUnlocked(all[3], all, { L01: { stars: 3 } })).toBe(false);
    expect(isLevelUnlocked(all[3], all, { C2L01: { stars: 1 } })).toBe(true);
    expect(isLevelUnlocked(all[4], all, { L01: { stars: 3 }, L02: { stars: 3 }, C2L01: { stars: 1 } })).toBe(false);
    expect(isLevelUnlocked(all[4], all, { C2L01: { stars: 1 }, C2L02: { stars: 1 } })).toBe(true);
  });
  it('moves from the end of one chapter to the start of the next', () => {
    expect(nextLevel(all, 'L02')?.id).toBe('C2L01');
    expect(nextLevel(all, 'C2L03')?.id).toBe('C3L01');
  });
});
