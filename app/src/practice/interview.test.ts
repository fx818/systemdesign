import { describe, expect, it } from 'vitest';
import { expectedEstimates, gradeEstimates, interviewGrade, interviewPrompts } from './interview';
import { interviewUnlocked } from './access';

describe('interview rubric', () => {
  it('has eight distinct complete prompts', () => { expect(interviewPrompts).toHaveLength(8); expect(new Set(interviewPrompts.map(p => p.id)).size).toBe(8); expect(interviewPrompts.every(p => p.followups.length === 3)).toBe(true); });
  it('grades DAU, average/peak QPS and decimal storage at 20% tolerance', () => {
    const prompt = interviewPrompts[0]; const expected = expectedEstimates(prompt);
    expect(expected[0]).toBe(2000000); expect(expected[1]).toBeCloseTo(694.444);
    expect(expected[2]).toBeCloseTo(3472.222); expect(expected[3]).toBe(2920000);
    expect(gradeEstimates(prompt, expected.map(n => n * 1.19)).score).toBe(100);
    expect(gradeEstimates(prompt, expected.map(n => n * 1.21)).score).toBe(0);
    expect(gradeEstimates(prompt, [NaN, Infinity, -1, 0]).score).toBe(0);
  });
  it('requires SLO success for a hiring grade', () => { expect(interviewGrade([100, 100, 100, 100], false).grade).toBe('No Hire'); expect(interviewGrade([100, 100, 100, 100], true).grade).toBe('Strong Hire'); expect(interviewGrade([70, 70, 70, 70], true).grade).toBe('Hire'); expect(interviewGrade([55, 55, 55, 55], true).grade).toBe('Lean Hire'); expect(interviewGrade([100, 100, 100, 100], true, false).grade).toBe('Lean Hire'); });
  it('unlocks on either qualifying final level only', () => { expect(interviewUnlocked({})).toBe(false); expect(interviewUnlocked({ L12: { stars: 3 } })).toBe(false); expect(interviewUnlocked({ L13: { stars: 1 } })).toBe(true); expect(interviewUnlocked({ C3L04: { stars: 1 } })).toBe(true); });
});
