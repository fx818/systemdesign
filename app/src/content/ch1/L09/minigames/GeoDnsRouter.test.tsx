import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { DCS, GEO_ROUNDS, nearestDc } from '../data';
import GeoDnsRouter, { TOTAL_USERS, geoScore, routeReason } from './GeoDnsRouter';

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

describe('GeoDnsRouter logic', () => {
  it('routes to the nearest healthy data center', () => {
    expect(nearestDc({ x: 135, y: 215 })).toBe('us-west');
    expect(nearestDc({ x: 135, y: 215 }, ['us-west'])).toBe('us-east');
    expect(nearestDc({ x: 640, y: 195 })).toBe('eu');
  });
  it('round 1 uses every data center; round 2 never routes to the dead one', () => {
    const r1 = new Set(GEO_ROUNDS[0].users.map((u) => nearestDc(u.pos)));
    expect(r1.size).toBe(DCS.length);
    for (const u of GEO_ROUNDS[1].users) expect(nearestDc(u.pos, GEO_ROUNDS[1].down)).not.toBe('us-west');
  });
  it('explains mistakes and scores', () => {
    expect(routeReason('us-west', 'us-east', ['us-west'])).toMatch(/offline/);
    expect(routeReason('eu', 'us-east', [])).toMatch(/closer/);
    expect(geoScore(Array(TOTAL_USERS).fill(true))).toBe(1);
  });
});

describe('<GeoDnsRouter/>', () => {
  it('plays a perfect game', () => {
    const done = vi.fn();
    render(<GeoDnsRouter onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    for (const r of GEO_ROUNDS) {
      fireEvent.click(screen.getByRole('button', { name: 'Go!' }));
      for (const u of r.users) {
        const want = DCS.find((d) => d.id === nearestDc(u.pos, r.down))!;
        fireEvent.click(screen.getByRole('button', { name: want.name }));
      }
    }
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });
});
