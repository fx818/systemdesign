import { describe, expect, it } from 'vitest';
import { hashString, mulberry32, seededShuffle, shuffledIndices } from './seeded';

describe('seeded helpers', () => {
  it('hashString is deterministic and stable', () => {
    expect(hashString('order1')).toBe(hashString('order1'));
    expect(hashString('order1')).not.toBe(hashString('order2'));
    expect(hashString('')).toBe(0x811c9dc5);
  });

  it('mulberry32 returns floats in [0,1) and repeats identically', () => {
    const a = mulberry32(1234);
    const b = mulberry32(1234);
    for (let i = 0; i < 20; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('shuffledIndices is deterministic per seed', () => {
    expect(shuffledIndices(6, 'q1')).toEqual(shuffledIndices(6, 'q1'));
  });

  it('shuffledIndices is a permutation of 0..n-1', () => {
    const out = shuffledIndices(9, 'perm');
    expect([...out].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('shuffledIndices never returns the identity for n > 1', () => {
    for (let n = 2; n <= 12; n++) {
      for (const seed of ['a', 'b', 'q7', 'zzz', '']) {
        const out = shuffledIndices(n, seed);
        expect(out.some((v, i) => v !== i)).toBe(true);
      }
    }
  });

  it('shuffledIndices handles n <= 1', () => {
    expect(shuffledIndices(0, 'x')).toEqual([]);
    expect(shuffledIndices(1, 'x')).toEqual([0]);
  });

  it('different seeds usually give different shuffles', () => {
    const s1 = shuffledIndices(8, 'seed-one');
    const s2 = shuffledIndices(8, 'seed-two');
    expect(s1).not.toEqual(s2);
  });

  it('seededShuffle maps through the permutation', () => {
    const items = ['a', 'b', 'c', 'd'];
    const out = seededShuffle(items, 'sid');
    expect(out).toEqual(shuffledIndices(4, 'sid').map((i) => items[i]));
    expect([...out].sort()).toEqual(items); // nothing lost
  });
});
