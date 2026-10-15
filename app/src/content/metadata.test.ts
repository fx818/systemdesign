// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { levels } from './registry.eager';
import { levelMetas, getLevelMeta, levelsInChapter } from './registry';
import { toLevelMeta } from './metadata';

describe('generated level catalog', () => {
  it('discovers the same levels in the same order as the complete registry', () => {
    expect(levelMetas.map(level => level.id)).toEqual(levels.map(level => level.id));
  });
  it.each(levels)('$id metadata matches the full definition', level => {
    expect(getLevelMeta(level.id)).toEqual(toLevelMeta(level));
  });
  it('keeps chapter lists independent and unknown ids absent', () => {
    for (const chapter of [1, 2, 3]) {
      expect(levelsInChapter(chapter).map(level => level.id))
        .toEqual(levels.filter(level => (level.chapter ?? 1) === chapter).map(level => level.id));
    }
    expect(levelsInChapter(99)).toEqual([]);
    expect(getLevelMeta('missing')).toBeUndefined();
  });
});
