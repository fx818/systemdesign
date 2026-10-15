import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { KEY_SCENARIOS } from '../data';
import PickTheKey, { keyScore } from './PickTheKey';

describe('PickTheKey', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('the best key is always the most even one', () => {
    for (const s of KEY_SCENARIOS) {
      const spread = (d: number[]) => Math.max(...d) - Math.min(...d);
      const best = s.options.find((o) => o.id === s.best);
      expect(best).toBeDefined();
      for (const o of s.options) expect(spread(best?.dist ?? [])).toBeLessThanOrEqual(spread(o.dist));
    }
    expect(keyScore([1, 2, 3])).toBe(0.5);
  });

  it('one wrong pick then all best keys', async () => {
    const done = vi.fn();
    render(<PickTheKey onComplete={done} />);
    for (const [i, s] of KEY_SCENARIOS.entries()) {
      await screen.findByText(s.title);
      if (i === 0) {
        const wrong = s.options.find((o) => o.id !== s.best);
        fireEvent.click(screen.getByRole('button', { name: `Shard by ${wrong?.key}` }));
      }
      const best = s.options.find((o) => o.id === s.best);
      fireEvent.click(screen.getByRole('button', { name: `Shard by ${best?.key}` }));
      fireEvent.click(await screen.findByRole('button', { name: /next scenario|see results/i }));
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(keyScore([2, 1, 1]));
  });
});
