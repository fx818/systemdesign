import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { SCENARIOS } from '../data';
import UpgradeOrAdd, { CARD_TIME, upgradeOrAddScore } from './UpgradeOrAdd';

describe('UpgradeOrAdd', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('has 8 balanced scenarios with explanations', () => {
    expect(SCENARIOS).toHaveLength(8);
    expect(SCENARIOS.filter((s) => s.answer === 'up').length).toBeGreaterThanOrEqual(3);
    expect(SCENARIOS.filter((s) => s.answer === 'out').length).toBeGreaterThanOrEqual(3);
    for (const s of SCENARIOS) expect(s.why.length).toBeGreaterThan(20);
  });

  it('scores perfect fast play as 1 and nothing as 0', () => {
    const perfect = SCENARIOS.map((s) => ({ id: s.id, pick: s.answer, correct: true, timeLeft: CARD_TIME }));
    expect(upgradeOrAddScore(SCENARIOS, perfect)).toBe(1);
    expect(upgradeOrAddScore(SCENARIOS, [])).toBe(0);
    const slow = SCENARIOS.map((s) => ({ id: s.id, pick: s.answer, correct: true, timeLeft: 0 }));
    expect(upgradeOrAddScore(SCENARIOS, slow)).toBe(0.8);
  });

  it('plays through every card with the keyboard and reports score 1', { timeout: 30000 }, async () => {
    const done = vi.fn();
    render(<UpgradeOrAdd onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: /start the clock/i }));
    for (const s of SCENARIOS) {
      await screen.findByText(s.title);
      fireEvent.keyDown(window, { key: s.answer === 'up' ? 'ArrowLeft' : 'ArrowRight' });
      fireEvent.click(await screen.findByRole('button', { name: /next situation|see results/i }));
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledTimes(1);
    expect(done.mock.calls[0][0]).toBeGreaterThan(0.95);
  });
});
