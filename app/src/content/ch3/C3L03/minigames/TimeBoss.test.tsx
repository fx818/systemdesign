import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import TimeBoss, { PROMPTS, allocationScore, diveScore, stepFit } from './TimeBoss';

describe('Time Boss', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('grades the allocation against the book ranges', () => {
    expect(stepFit(5, 3, 10)).toBe(1);
    expect(stepFit(12, 3, 10)).toBeCloseTo(0.6);
    expect(allocationScore([5, 12, 23, 5])).toBe(1);
    expect(allocationScore([20, 10, 10, 5])).toBeLessThan(1);
    expect(allocationScore([5, 12, 23, 4])).toBe(0); // must use the full 45
  });

  it('grades deep-dive picks', () => {
    const feed = PROMPTS[2];
    expect(diveScore(feed, [0, 1])).toBe(1);
    expect(diveScore(feed, [2])).toBe(0);
    expect(diveScore(feed, [0, 3])).toBe(0.25);
    // every prompt's good topics fit a deep dive of 16+ minutes
    for (const p of PROMPTS) expect(p.topics.filter((t) => t.good).reduce((s, t) => s + t.minutes, 0)).toBeLessThanOrEqual(16);
  });

  it('a perfect game reports 1', () => {
    const done = vi.fn();
    render(<TimeBoss onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: /start the clock/i }));
    [5, 12, 23, 5].forEach((m, i) => fireEvent.change(screen.getByLabelText(`Step ${i + 1} minutes`), { target: { value: String(m) } }));
    fireEvent.click(screen.getByRole('button', { name: /lock in my plan/i }));
    for (const p of PROMPTS) {
      for (const tp of p.topics.filter((x) => x.good)) fireEvent.click(screen.getByRole('button', { name: new RegExp(tp.text.replace(/[()/→]/g, '.')) }));
      fireEvent.click(screen.getByRole('button', { name: 'Dive!' }));
      fireEvent.click(screen.getByRole('button', { name: /next prompt|see results/i }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });
});
