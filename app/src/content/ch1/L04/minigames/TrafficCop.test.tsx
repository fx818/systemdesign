import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { COP } from '../data';
import TrafficCop, { bestServer, copDone, copScore, initialCop, isUp, routeCop, stepCop, type CopState } from './TrafficCop';

/** Run a whole round with a routing policy that acts once per tick. */
function simulate(policy: (s: CopState) => number | null) {
  let s = initialCop();
  for (let i = 0; i < 4000 && !copDone(s); i++) {
    s = stepCop(s, 0.05);
    if (s.pending.length) {
      const pick = policy(s);
      if (pick !== null) s = routeCop(s, pick);
    }
  }
  return s;
}

describe('TrafficCop engine', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });

  it('servers go down on schedule', () => {
    const [srv, a, b] = COP.outages[0];
    expect(isUp(srv, a - 0.1)).toBe(true);
    expect(isUp(srv, a + 0.1)).toBe(false);
    expect(isUp(srv, b + 0.1)).toBe(true);
  });

  it('a least-loaded load balancer serves everything', () => {
    const s = simulate(bestServer);
    expect(s.spawned).toBe(COP.total);
    expect(copScore(s)).toBe(1);
  });

  it('sending everything to one server drops lots of requests', () => {
    const s = simulate(() => 0);
    expect(copScore(s)).toBeLessThan(0.6);
  });

  it('routing to a dead server drops the request', () => {
    let s = initialCop();
    while (isUp(COP.outages[0][0], s.t) || !s.pending.length) s = stepCop(s, 0.05);
    const r = routeCop(s, COP.outages[0][0]);
    expect(r.dropped).toBe(s.dropped + 1);
    expect(r.last?.reason).toBe('dead');
  });

  it('idle players time out every request', () => {
    const s = simulate(() => null);
    expect(s.served).toBe(0);
    expect(s.dropped).toBe(COP.total);
  });

  it('renders and starts', () => {
    render(<TrafficCop onComplete={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /start directing traffic/i }));
    expect(screen.getAllByRole('button', { name: /route to server/i })).toHaveLength(COP.servers);
  });
});
