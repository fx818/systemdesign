import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { ROUNDS, crashedUntil, requestSucceeds } from '../data';
import WhosLoggedIn, { TOTAL_STEPS, explain, loggedInScore } from './WhosLoggedIn';

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

describe('WhosLoggedIn logic', () => {
  it('stateful: only the home server authenticates, and a crash loses the session', () => {
    expect(requestSucceeds('stateful', { user: 'A', server: 1 }, [])).toBe(true);
    expect(requestSucceeds('stateful', { user: 'A', server: 2 }, [])).toBe(false);
    expect(requestSucceeds('stateful', { user: 'B', server: 3 }, [2])).toBe(false);
    expect(explain('stateful', { user: 'B', server: 3 }, [2])).toMatch(/crashed/);
  });
  it('stateless: every request succeeds', () => {
    const r = ROUNDS[1];
    r.steps.forEach((s, i) => expect(requestSucceeds('stateless', s, crashedUntil(r, i))).toBe(true));
  });
  it('round 1 mixes outcomes and never routes to a dead server', () => {
    const r = ROUNDS[0];
    const outcomes = r.steps.map((s, i) => requestSucceeds('stateful', s, crashedUntil(r, i)));
    expect(outcomes).toContain(true);
    expect(outcomes).toContain(false);
    for (const rr of ROUNDS) rr.steps.forEach((s, i) => expect(crashedUntil(rr, i)).not.toContain(s.server));
  });
  it('scores', () => {
    expect(loggedInScore([true, false], 4)).toBe(0.25);
    expect(loggedInScore([], 0)).toBe(0);
  });
});

describe('<WhosLoggedIn/>', () => {
  it('plays a perfect game and reports 1', () => {
    const done = vi.fn();
    render(<WhosLoggedIn onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    for (const r of ROUNDS) {
      fireEvent.click(screen.getByRole('button', { name: 'Go!' }));
      r.steps.forEach((s, i) => {
        const ok = requestSucceeds(r.id, s, crashedUntil(r, i));
        fireEvent.click(screen.getByRole('button', { name: ok ? /Logged in/ : /Logged out/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      });
    }
    expect(TOTAL_STEPS).toBe(14);
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });
});
