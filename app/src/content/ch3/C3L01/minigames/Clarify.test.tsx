import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import Clarify, { ROUNDS, clarifyScore, turnOptions } from './Clarify';

describe('Clarify!', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('always offers exactly one useful question while requirements remain', () => {
    ROUNDS.forEach((round, ri) => {
      for (let turn = 0; turn < round.turns; turn++) {
        const opts = turnOptions(round, [], turn, ri);
        expect(opts.filter((o) => o.kind === 'good')).toHaveLength(1);
        expect(opts).toHaveLength(3);
        expect(turnOptions(round, [], turn, ri)).toEqual(opts);
      }
      expect(round.turns).toBeGreaterThan(round.reqs.length);
    });
  });

  it('scores found requirements minus red flags', () => {
    expect(clarifyScore(6, 6, 0)).toBe(1);
    expect(clarifyScore(3, 6, 0)).toBe(0.5);
    expect(clarifyScore(6, 6, 2)).toBe(0.7);
    expect(clarifyScore(0, 6, 3)).toBe(0);
  });

  it('plays both rounds perfectly and reports 1', async () => {
    const done = vi.fn();
    render(<Clarify onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: /enter the interview room/i }));
    for (const round of ROUNDS) {
      const questions = new Set(round.reqs.map((r) => r.q));
      for (let i = 0; i < round.reqs.length; i++) {
        const buttons = await screen.findAllByRole('button');
        const good = buttons.find((b) => questions.has(b.textContent ?? ''));
        expect(good).toBeDefined();
        fireEvent.click(good!);
        const write = screen.queryByRole('button', { name: /write the assumption/i });
        if (write) fireEvent.click(write);
      }
      fireEvent.click(await screen.findByRole('button', { name: /next prompt|see results/i }));
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });
});
