import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { ROUTER_ROUNDS, movedWhenResharding, shardOf } from '../data';
import ShardRouter, { routerScore } from './ShardRouter';

describe('ShardRouter', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('hash + resharding maths', () => {
    expect(shardOf(1003, 4)).toBe(3);
    expect(shardOf(17, 4)).toBe(1);
    expect(movedWhenResharding(ROUTER_ROUNDS[0].ids, 4, 5)).toBeGreaterThan(ROUTER_ROUNDS[0].ids.length / 2);
    expect(routerScore(8, 16)).toBe(0.5);
  });

  it('routes every id correctly across both rounds and reports 1', { timeout: 30000 }, async () => {
    const done = vi.fn();
    render(<ShardRouter onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: /open the router/i }));
    for (const [r, round] of ROUTER_ROUNDS.entries()) {
      if (r > 0) fireEvent.click(await screen.findByRole('button', { name: /route again/i }));
      for (const id of round.ids) {
        await screen.findByText(`${id} % ${round.shards} = ?`);
        fireEvent.keyDown(window, { key: String(shardOf(id, round.shards)) });
      }
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });
});
