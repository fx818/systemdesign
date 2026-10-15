import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import LatencyRace from './LatencyRace';
import { RACE_OPS, SLOTS, raceScore, slotPoints, targetSlot } from './latencyRace';

beforeAll(() => { MotionGlobalConfig.skipAnimations = true; });
afterAll(() => { MotionGlobalConfig.skipAnimations = false; });

describe('Latency Race', () => {
  it('targets the right decade', () => {
    const slot = (id: string) => SLOTS[targetSlot(RACE_OPS.find((o) => o.id === id)!.ns)];
    expect(slot('l1')).toBe('1 ns');
    expect(slot('mem')).toBe('100 ns');
    expect(slot('zippy')).toBe('10 µs');
    expect(slot('seek')).toBe('10 ms');
    expect(slot('xregion')).toBe('100 ms');
    const seek = RACE_OPS.find((o) => o.id === 'seek')!;
    expect(slotPoints(seek, targetSlot(seek.ns) + 1)).toBe(0.5);
    expect(raceScore({})).toBe(0);
  });

  it('a perfect race reports 1', () => {
    const done = vi.fn();
    render(<LatencyRace onComplete={done} />);
    for (const op of RACE_OPS) {
      fireEvent.click(screen.getByRole('button', { name: `Select ${op.name}` }));
      fireEvent.click(screen.getByRole('button', { name: `Place at ${SLOTS[targetSlot(op.ns)]}` }));
    }
    fireEvent.click(screen.getByRole('button', { name: /check the photo finish/i }));
    fireEvent.click(screen.getByRole('button', { name: /see results/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });

  it('putting everything at 1 ns scores low, and chips can be taken back', () => {
    const done = vi.fn();
    render(<LatencyRace onComplete={done} />);
    for (const op of RACE_OPS) {
      fireEvent.click(screen.getByRole('button', { name: `Select ${op.name}` }));
      fireEvent.click(screen.getByRole('button', { name: 'Place at 1 ns' }));
    }
    fireEvent.click(screen.getByRole('button', { name: `Remove ${RACE_OPS[0].name}` }));
    expect(screen.getByRole('button', { name: /check the photo finish/i })).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('button', { name: `Select ${RACE_OPS[0].name}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Place at 1 ns' }));
    fireEvent.click(screen.getByRole('button', { name: /check the photo finish/i }));
    fireEvent.click(screen.getByRole('button', { name: /see results/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(done.mock.calls[0][0]).toBeLessThan(0.2);
  });
});
