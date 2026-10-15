import { describe, expect, it } from 'vitest';
import { RANKS, rankForXp, rankProgress } from './ranks';

describe('ranks', () => {
  it('has the six design ranks with ascending thresholds', () => {
    expect(RANKS.map((r) => r.name)).toEqual(['Intern', 'Junior', 'Engineer', 'Senior', 'Staff', 'Principal']);
    expect(RANKS.map((r) => r.minXp)).toEqual([0, 300, 900, 1800, 3000, 4500]);
  });

  it.each([
    [0, 'Intern'],
    [299, 'Intern'],
    [300, 'Junior'],
    [899, 'Junior'],
    [900, 'Engineer'],
    [1800, 'Senior'],
    [3000, 'Staff'],
    [4500, 'Principal'],
    [99999, 'Principal'],
  ])('rankForXp(%i) = %s', (xp, name) => {
    expect(rankForXp(xp).name).toBe(name);
  });

  it('reports progress towards the next rank', () => {
    const p = rankProgress(600); // halfway Intern->Junior is 150; 600 is halfway Junior(300)->Engineer(900)
    expect(p.rank.name).toBe('Junior');
    expect(p.next?.name).toBe('Engineer');
    expect(p.ratio).toBeCloseTo(0.5);
  });

  it('maxes out at the top rank', () => {
    const p = rankProgress(5000);
    expect(p.rank.name).toBe('Principal');
    expect(p.next).toBeNull();
    expect(p.ratio).toBe(1);
  });
});
