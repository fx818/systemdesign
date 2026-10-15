import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { EVICT_ROUNDS, TTL_ITEMS } from '../data';
import Evict, { ROUND_STEPS, TOTAL_QUESTIONS } from './Evict';
import { pickVictim, playStream } from './evict';
import TtlGoldilocks, { dbLoadFor, staleFor, ttlScore } from './TtlGoldilocks';

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

describe('eviction engine', () => {
  it('LRU evicts the least recently used key', () => {
    const steps = playStream(['a', 'b', 'c', 'a', 'd'], 'LRU', 3);
    expect(steps[4].victim).toBe('b');
  });
  it('LFU evicts the least frequently used key', () => {
    const steps = playStream(['a', 'a', 'b', 'b', 'c', 'd'], 'LFU', 3);
    expect(steps[5].victim).toBe('c');
  });
  it('FIFO evicts the oldest entry even if popular', () => {
    const steps = playStream(['a', 'b', 'c', 'a', 'a', 'd'], 'FIFO', 3);
    expect(steps[5].victim).toBe('a');
  });
  it('LFU breaks ties by recency', () => {
    expect(pickVictim([{ key: 'x', enteredAt: 0, lastUsed: 5, uses: 1 }, { key: 'y', enteredAt: 1, lastUsed: 2, uses: 1 }], 'LFU')).toBe('y');
  });
  it('every round asks at least two eviction questions', () => {
    for (const steps of ROUND_STEPS) expect(steps.filter((s) => s.victim).length).toBeGreaterThanOrEqual(2);
    expect(EVICT_ROUNDS.map((r) => r.policy)).toEqual(['LRU', 'LFU', 'FIFO']);
  });
});

describe('Evict! UI', () => {
  it('plays all rounds perfectly and reports 1', { timeout: 30000 }, async () => {
    const done = vi.fn();
    render(<Evict onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: /start with lru/i }));
    for (let r = 0; r < ROUND_STEPS.length; r++) {
      for (const step of ROUND_STEPS[r]) {
        fireEvent.click(screen.getByRole('button', { name: /next request/i }));
        if (step.victim) {
          fireEvent.click(screen.getByRole('button', { name: `Evict ${step.victim}` }));
          fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        }
      }
      fireEvent.click(screen.getByRole('button', { name: /next request/i }));
      if (r + 1 < ROUND_STEPS.length) fireEvent.click(screen.getByRole('button', { name: /^next:/i }));
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
    expect(TOTAL_QUESTIONS).toBeGreaterThanOrEqual(6);
  });
});

describe('TTL Goldilocks', () => {
  it('meters move the right way', () => {
    const likes = TTL_ITEMS.find((i) => i.id === 'likes')!;
    expect(dbLoadFor(likes, 0)).toBeGreaterThan(dbLoadFor(likes, 4));
    expect(staleFor(likes, 4)).toBeGreaterThan(staleFor(likes, 0));
    expect(ttlScore(TTL_ITEMS.map((i) => i.best))).toBe(1);
  });

  it('plays a perfect round', async () => {
    const done = vi.fn();
    render(<TtlGoldilocks onComplete={done} />);
    for (const item of TTL_ITEMS) {
      await screen.findByText(item.name);
      fireEvent.change(await screen.findByLabelText('TTL'), { target: { value: String(item.best) } });
      fireEvent.click(await screen.findByRole('button', { name: /lock in ttl/i }));
      fireEvent.click(await screen.findByRole('button', { name: /next item|see results/i }));
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });
});
