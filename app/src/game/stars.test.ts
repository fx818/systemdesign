import { describe, expect, it } from 'vitest';
import { computeStars } from './stars';

describe('computeStars', () => {
  it('gives 0 stars when mission goals are not met', () => {
    expect(computeStars({ goalsMet: false, withinBudget: true, quizScore: 1, hintsUsed: 0 })).toBe(0);
  });

  it('gives 1 star when goals are met but over budget', () => {
    expect(computeStars({ goalsMet: true, withinBudget: false, quizScore: 1, hintsUsed: 0 })).toBe(1);
  });

  it('gives 1 star when goals are met but the interview was failed', () => {
    expect(computeStars({ goalsMet: true, withinBudget: true, quizScore: 0.2, hintsUsed: 0 })).toBe(1);
  });

  it('gives 2 stars when goals met + within budget + interview passed', () => {
    expect(computeStars({ goalsMet: true, withinBudget: true, quizScore: 0.5, hintsUsed: 3 })).toBe(2);
  });

  it('gives 3 stars only with no hints used', () => {
    expect(computeStars({ goalsMet: true, withinBudget: true, quizScore: 1, hintsUsed: 0 })).toBe(3);
    expect(computeStars({ goalsMet: true, withinBudget: true, quizScore: 1, hintsUsed: 1 })).toBe(2);
  });
});
