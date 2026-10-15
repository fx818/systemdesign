import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { HOST_METRICS, LOGS, SUSPECTS } from '../data';
import IncidentDetective, { detectiveScore } from './IncidentDetective';

describe('IncidentDetective', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('has exactly one true root cause backed by evidence', () => {
    expect(SUSPECTS.filter((s) => s.correct)).toHaveLength(1);
    expect(LOGS.some((l) => l.clue && l.host === 'web-3')).toBe(true);
    expect(HOST_METRICS['web-3'].disk.at(-1)).toBe(100);
  });

  it('scores', () => {
    expect(detectiveScore(0, 1)).toBe(1);
    expect(detectiveScore(1, 1)).toBe(0.7);
    expect(detectiveScore(0, 0)).toBe(0.8);
    expect(detectiveScore(5, 0)).toBe(0.1);
  });

  it('search filters the central logs', () => {
    render(<IncidentDetective onComplete={() => {}} />);
    fireEvent.change(screen.getByLabelText('Search logs'), { target: { value: 'no space' } });
    expect(screen.getAllByText(/no space left on device/)).toHaveLength(2);
    expect(screen.queryByText(/checkpoint complete/)).toBeNull();
  });

  it('pins a clue, accuses correctly and reports 1', async () => {
    const done = vi.fn();
    render(<IncidentDetective onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: /host metrics/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'web-3' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Pin web-3 Disk used' }));
    fireEvent.click(screen.getByRole('button', { name: /accuse: web-3 ran out of disk space/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });

  it('a wrong accusation costs points', async () => {
    const done = vi.fn();
    render(<IncidentDetective onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: /accuse: the cache crashed/i }));
    fireEvent.click(screen.getByRole('button', { name: /accuse: web-3 ran out of disk space/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(0.5);
  });
});
