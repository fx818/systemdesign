import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { ASSETS, CDN_STEPS } from '../data';
import CdnFlowOrder, { DECK_ORDER, orderHint, orderScore } from './CdnFlowOrder';
import CdnOrNot, { BUDGET, cdnMeters, cdnOrNotScore } from './CdnOrNot';

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

describe('CdnFlowOrder', () => {
  it('deck is a real shuffle of the six steps', () => {
    expect([...DECK_ORDER].sort()).toEqual([0, 1, 2, 3, 4, 5]);
    expect(DECK_ORDER).not.toEqual([0, 1, 2, 3, 4, 5]);
  });
  it('scores and hints', () => {
    expect(orderScore(0)).toBe(1);
    expect(orderScore(2)).toBe(0.7);
    expect(orderScore(20)).toBe(0);
    expect(orderHint(0, 3)).toMatch(/User A/);
    expect(orderHint(1, 5)).toMatch(/origin/);
  });
  it('plays perfectly and reports 1', () => {
    const done = vi.fn();
    render(<CdnFlowOrder onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    fireEvent.click(screen.getByRole('button', { name: CDN_STEPS[2] }));
    expect(screen.getByRole('status')).toHaveTextContent(/User A/);
    for (const s of CDN_STEPS) fireEvent.click(screen.getByRole('button', { name: s }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip replay' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(0.85);
  });
});

describe('CdnOrNot', () => {
  it('correct plan fits the budget and gives full speed', () => {
    const perfect = ASSETS.map((a) => ({ id: a.id, pick: a.answer }));
    expect(cdnMeters(ASSETS, perfect).bill).toBeLessThanOrEqual(BUDGET);
    expect(cdnOrNotScore(ASSETS, perfect)).toBe(1);
    const allCdn = ASSETS.map((a) => ({ id: a.id, pick: 'cdn' as const }));
    expect(cdnMeters(ASSETS, allCdn).bill).toBeGreaterThan(BUDGET);
    expect(cdnOrNotScore(ASSETS, allCdn)).toBe(0.3);
  });
  it('plays through and reports a score', async () => {
    const done = vi.fn();
    render(<CdnOrNot onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    for (let i = 0; i < ASSETS.length; i++) {
      fireEvent.click(await screen.findByRole('button', { name: ASSETS[i].answer === 'cdn' ? /Put on CDN/ : /Keep on origin/ }));
      fireEvent.click(screen.getByRole('button', { name: i + 1 < ASSETS.length ? 'Next file' : 'See results' }));
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });
});
