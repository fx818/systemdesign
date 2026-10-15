import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { BUILD_FLOW, PUBLISH_FLOW, PUBLISH_SLOTS } from '../data';
import Blueprint, { blueprintScore, shuffled } from './Blueprint';

describe('Blueprint', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('shuffles deterministically and keeps every item', () => {
    const xs = [1, 2, 3, 4, 5, 6];
    expect(shuffled(xs, 3)).toEqual(shuffled(xs, 3));
    expect([...shuffled(xs, 3)].sort()).toEqual(xs);
  });

  it('scores mistakes per part', () => {
    expect(blueprintScore(0, 0)).toBe(1);
    expect(blueprintScore(2, 0)).toBe(0.9);
    expect(blueprintScore(20, 20)).toBe(0);
  });

  it('a decoy costs a mistake', () => {
    render(<Blueprint onComplete={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /grab a marker/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Blockchain ledger' }));
    fireEvent.click(screen.getByRole('button', { name: `Slot: ${PUBLISH_SLOTS[0].hint}` }));
    expect(screen.getByText(/over-engineering/i)).toBeTruthy();
    expect(screen.getByText('Mistakes: 1')).toBeTruthy();
  });

  it('a perfect game reports 1', async () => {
    const done = vi.fn();
    render(<Blueprint onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: /grab a marker/i }));
    for (const s of PUBLISH_SLOTS) {
      fireEvent.click(screen.getByRole('button', { name: s.answer }));
      fireEvent.click(screen.getByRole('button', { name: `Slot: ${s.hint}` }));
    }
    for (const step of [...PUBLISH_FLOW, ...BUILD_FLOW]) fireEvent.click(await screen.findByRole('button', { name: step.text }));
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });
});
