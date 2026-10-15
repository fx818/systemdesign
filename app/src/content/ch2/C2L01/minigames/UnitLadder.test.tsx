import { act, fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import UnitLadder from './UnitLadder';
import { CONVERT_QS, LADDER_ORDER, LADDER_TILES, SECONDS_PER_Q, unitLadderScore } from './unitLadder';

beforeAll(() => { MotionGlobalConfig.skipAnimations = true; });
afterAll(() => { MotionGlobalConfig.skipAnimations = false; });

describe('Unit Ladder', () => {
  it('data is consistent', () => {
    expect([...LADDER_TILES].sort()).toEqual([...LADDER_ORDER].sort());
    for (const q of CONVERT_QS) expect(new Set(q.options).size).toBe(q.options.length);
    expect(unitLadderScore(0, CONVERT_QS.length)).toBe(1);
    expect(unitLadderScore(4, 0)).toBe(0);
  });

  it('plays a perfect game and reports 1', async () => {
    const done = vi.fn();
    render(<UnitLadder onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: /start climbing/i }));
    for (const u of LADDER_ORDER) fireEvent.click(screen.getByRole('button', { name: `Unit ${u}` }));
    fireEvent.click(screen.getByRole('button', { name: /conversions/i }));
    for (const q of CONVERT_QS) {
      fireEvent.click(screen.getByRole('button', { name: q.options[q.answer] }));
      fireEvent.click(screen.getByRole('button', { name: /next|see results/i }));
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });

  it('a wrong tap and a timeout cost points', () => {
    vi.useFakeTimers();
    try {
      const done = vi.fn();
      render(<UnitLadder onComplete={done} />);
      fireEvent.click(screen.getByRole('button', { name: /start climbing/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Unit PB' }));
      for (const u of LADDER_ORDER) fireEvent.click(screen.getByRole('button', { name: `Unit ${u}` }));
      fireEvent.click(screen.getByRole('button', { name: /conversions/i }));
      for (let s = 0; s <= SECONDS_PER_Q; s++) act(() => { vi.advanceTimersByTime(1000); });
      expect(screen.getByText("Time's up!")).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      for (const q of CONVERT_QS.slice(1)) {
        fireEvent.click(screen.getByRole('button', { name: q.options[q.answer] }));
        fireEvent.click(screen.getByRole('button', { name: /next|see results/i }));
      }
      fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
      expect(done).toHaveBeenCalledWith(unitLadderScore(1, CONVERT_QS.length - 1));
    } finally {
      vi.useRealTimers();
    }
  });
});
