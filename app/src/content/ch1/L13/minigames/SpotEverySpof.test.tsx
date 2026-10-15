import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { SPOF_DC, SPOF_IDS, SPOF_NODES } from '../data';
import SpotEverySpof, { spofScore } from './SpotEverySpof';

describe('SpotEverySpof', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('scores', () => {
    expect(SPOF_IDS).toEqual(['lb', 'cache', 'db', 'dc']);
    expect(spofScore(SPOF_IDS)).toBe(1);
    expect(spofScore([...SPOF_IDS, 'web1'])).toBe(0.75);
    expect(spofScore(['web1'])).toBe(0);
  });

  it('marking every SPOF (including the data center) reports 1', () => {
    const done = vi.fn();
    render(<SpotEverySpof onComplete={done} />);
    for (const n of SPOF_NODES.filter((x) => x.spof)) fireEvent.click(screen.getByRole('button', { name: `Mark ${n.label}` }));
    fireEvent.click(screen.getByRole('button', { name: `Mark ${SPOF_DC.label}` }));
    fireEvent.click(screen.getByRole('button', { name: /check my answer/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });
});
