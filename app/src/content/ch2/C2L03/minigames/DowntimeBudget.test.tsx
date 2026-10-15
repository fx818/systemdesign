import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import DowntimeBudget from './DowntimeBudget';
import { MATCH_ROUNDS, SCENARIOS, answerFor, breached, budgetMin, downtimeScore } from './downtime';

beforeAll(() => { MotionGlobalConfig.skipAnimations = true; });
afterAll(() => { MotionGlobalConfig.skipAnimations = false; });

describe('Downtime Budget', () => {
  it('uses the book numbers', () => {
    expect(answerFor(MATCH_ROUNDS[0], 99)).toBe('14.4 min');
    expect(answerFor(MATCH_ROUNDS[1], 99.99)).toBe('52.6 min');
    for (const r of MATCH_ROUNDS) expect([...r.durations].sort()).toEqual(r.nines.map((n) => answerFor(r, n)).sort());
    expect(budgetMin(SCENARIOS[0])).toBeCloseTo(4.38, 2);
    expect(SCENARIOS.map(breached)).toEqual([true, false, true, false]);
  });

  it('a perfect run reports 1', () => {
    const done = vi.fn();
    render(<DowntimeBudget onComplete={done} />);
    for (const r of MATCH_ROUNDS) {
      for (const n of r.nines) {
        fireEvent.click(screen.getByRole('button', { name: `Availability ${n}%` }));
        fireEvent.click(screen.getByRole('button', { name: `Downtime ${answerFor(r, n)}` }));
      }
      fireEvent.click(screen.getByRole('button', { name: /next round|scenarios/i }));
    }
    for (const s of SCENARIOS) {
      fireEvent.click(screen.getByRole('button', { name: breached(s) ? 'Breached' : 'Within SLA' }));
      fireEvent.click(screen.getByRole('button', { name: /next scenario|see results/i }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });

  it('a wrong match and a wrong verdict cost points', () => {
    const done = vi.fn();
    render(<DowntimeBudget onComplete={done} />);
    MATCH_ROUNDS.forEach((r, ri) => {
      r.nines.forEach((n, i) => {
        fireEvent.click(screen.getByRole('button', { name: `Availability ${n}%` }));
        if (ri === 0 && i === 0) fireEvent.click(screen.getByRole('button', { name: `Downtime ${answerFor(r, r.nines[1])}` }));
        fireEvent.click(screen.getByRole('button', { name: `Downtime ${answerFor(r, n)}` }));
      });
      fireEvent.click(screen.getByRole('button', { name: /next round|scenarios/i }));
    });
    SCENARIOS.forEach((s, i) => {
      fireEvent.click(screen.getByRole('button', { name: (i === 0) !== breached(s) ? 'Breached' : 'Within SLA' }));
      fireEvent.click(screen.getByRole('button', { name: /next scenario|see results/i }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(downtimeScore(9, 3));
  });
});
