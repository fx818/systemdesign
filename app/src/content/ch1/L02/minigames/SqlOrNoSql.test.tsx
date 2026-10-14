import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { FEATURES } from '../data';
import SqlOrNoSql, { sqlNoSqlScore } from './SqlOrNoSql';

describe('SqlOrNoSql', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('has a balanced deck with justifications', () => {
    expect(FEATURES.length).toBeGreaterThanOrEqual(8);
    expect(FEATURES.some((f) => f.answer === 'sql')).toBe(true);
    expect(FEATURES.some((f) => f.answer === 'nosql')).toBe(true);
    for (const f of FEATURES) {
      expect(f.why.length).toBeGreaterThan(20);
      expect(Boolean(f.family)).toBe(f.answer === 'nosql');
    }
  });

  it('scores perfect play as 1', () => {
    const answers = FEATURES.map((f) => ({ id: f.id, pick: f.answer, correct: true, familyCorrect: f.answer === 'nosql' }));
    expect(sqlNoSqlScore(FEATURES, answers)).toBe(1);
    expect(sqlNoSqlScore(FEATURES, [])).toBe(0);
  });

  it('plays through every card perfectly and reports score 1', { timeout: 30000 }, async () => {
    const done = vi.fn();
    render(<SqlOrNoSql onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: /deal the cards/i }));
    for (const f of FEATURES) {
      await screen.findByText(f.feature);
      fireEvent.keyDown(window, { key: f.answer === 'sql' ? 'ArrowLeft' : 'ArrowRight' });
      if (f.family) fireEvent.click(await screen.findByRole('button', { name: f.family }));
      fireEvent.click(await screen.findByRole('button', { name: /next card|see results/i }));
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });
});
