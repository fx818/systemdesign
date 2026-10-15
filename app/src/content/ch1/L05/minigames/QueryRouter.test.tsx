import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { QUERIES } from '../data';
import QueryRouter, { masterHeat, routerScore } from './QueryRouter';

describe('QueryRouter', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('routes writes to the primary and reads to replicas', () => {
    for (const q of QUERIES) {
      const isWrite = /^\s*(INSERT|UPDATE|DELETE)\b/i.test(q.sql);
      expect(q.answer).toBe(isWrite ? 'primary' : 'replica');
    }
    expect(QUERIES.length).toBeGreaterThanOrEqual(10);
  });

  it('scores and heats correctly', () => {
    const all = QUERIES.map((q) => ({ id: q.id, pick: q.answer, correct: true }));
    expect(routerScore(QUERIES, all)).toBe(1);
    expect(routerScore(QUERIES, [])).toBe(0);
    expect(masterHeat([{ id: 'a', pick: 'primary', correct: false }, { id: 'b', pick: 'primary', correct: false }])).toBeCloseTo(0.65);
  });

  it('plays a perfect round with the keyboard', { timeout: 30000 }, async () => {
    const done = vi.fn();
    render(<QueryRouter onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: /open the floodgates/i }));
    for (const q of QUERIES) {
      await screen.findByText(q.sql);
      fireEvent.keyDown(window, { key: q.answer === 'primary' ? 'ArrowLeft' : 'ArrowRight' });
      fireEvent.click(await screen.findByRole('button', { name: /next query|see results/i }));
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });
});
