import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { GAME_SECONDS, IDEAL_COST, RED_LINE, WORKER_RATE, arrivals, shiftScore, stepShift, type ShiftState } from '../data';
import WorkerShift, { commentary } from './WorkerShift';

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

const run = (policy: (s: ShiftState) => number): ShiftState => {
  let s: ShiftState = { queue: 0, slaSec: 0, cost: 0, t: 0 };
  while (s.t < GAME_SECONDS - 1e-9) s = stepShift(s, policy(s), 0.1);
  return s;
};

describe('Worker shift model', () => {
  it('too few workers blows the SLA', () => {
    const s = run(() => 1);
    expect(s.queue).toBeGreaterThan(RED_LINE);
    expect(shiftScore(s)).toBeLessThan(0.6);
  });
  it('too many workers holds the SLA but wastes credits', () => {
    const s = run(() => 12);
    expect(s.slaSec).toBeCloseTo(GAME_SECONDS, 0);
    expect(s.cost).toBeGreaterThan(IDEAL_COST * 1.5);
    expect(shiftScore(s)).toBeLessThan(0.9);
  });
  it('matching workers to demand scores best', () => {
    const smart = run((s) => Math.max(1, Math.ceil(arrivals(s.t) / WORKER_RATE) + (s.queue > 10 ? 1 : 0)));
    expect(shiftScore(smart)).toBeGreaterThan(shiftScore(run(() => 12)));
    expect(shiftScore(smart)).toBeGreaterThan(shiftScore(run(() => 1)));
    expect(shiftScore(smart)).toBeGreaterThanOrEqual(0.9);
  });
  it('commentary reacts to the queue', () => {
    expect(commentary({ queue: RED_LINE + 1, slaSec: 0, cost: 0, t: 0 }, 2)).toMatch(/Add workers/);
    expect(commentary({ queue: 0, slaSec: 0, cost: 0, t: 32 }, 10)).toMatch(/Fewer workers/);
  });
});

describe('<WorkerShift/>', () => {
  it('starts and lets the player add and remove workers', () => {
    render(<WorkerShift onComplete={() => {}} />);
    expect(screen.getByRole('button', { name: 'Add worker' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Start shift' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add worker' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add worker' }));
    expect(screen.getByLabelText('4 workers')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove worker' }));
    expect(screen.getByLabelText('3 workers')).toBeInTheDocument();
  });
});
