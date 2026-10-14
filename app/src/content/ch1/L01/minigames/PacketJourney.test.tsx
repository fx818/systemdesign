import { fireEvent, render, screen } from '@testing-library/react';
import PacketJourney, { ROUNDS, roundScore, wrongHopReason } from './PacketJourney';

describe('PacketJourney logic', () => {
  it('every round follows the 4-step request flow', () => {
    for (const r of ROUNDS) {
      expect(r.hops.map((h) => h.to)).toEqual(['dns', r.start, 'server', r.start]);
    }
  });
  it('scores rounds', () => {
    expect(roundScore(false, 0, 10, 10)).toBe(0);
    expect(roundScore(true, 0, 10, 10)).toBe(1);
    expect(roundScore(true, 0, 0, 10)).toBe(0.7);
    expect(roundScore(true, 10, 10, 10)).toBe(0.3);
  });
  it('explains wrong hops', () => {
    const r = ROUNDS[0];
    expect(wrongHopReason(r, 0, 'server')).toMatch(/DNS/);
    expect(wrongHopReason(r, 2, 'db')).toMatch(/database/i);
    expect(wrongHopReason(r, 3, 'mobile')).toMatch(/whoever asked/);
  });
});

describe('<PacketJourney/>', () => {
  it('starts and gives feedback on a wrong hop', () => {
    const done = vi.fn();
    render(<PacketJourney onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    fireEvent.click(screen.getByRole('button', { name: 'Database' }));
    expect(screen.getByText(/never talk to the database/i)).toBeInTheDocument();
    expect(done).not.toHaveBeenCalled();
  });
});
