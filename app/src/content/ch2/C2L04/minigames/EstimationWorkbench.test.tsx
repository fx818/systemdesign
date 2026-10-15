import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import EstimationWorkbench from './EstimationWorkbench';
import { STEPS, grade, isRound, parseEntry, stepPoints, workbenchScore } from './workbench';

beforeAll(() => { MotionGlobalConfig.skipAnimations = true; });
afterAll(() => { MotionGlobalConfig.skipAnimations = false; });

const NAPKIN = [5_000_000, 100, 3000, 6000, 6, 8, 15];

describe('Estimation Workbench', () => {
  it('grades napkin answers', () => {
    expect(parseEntry('3,000')).toBe(3000);
    expect(Number.isNaN(parseEntry('abc'))).toBe(true);
    expect(isRound(100)).toBe(true);
    expect(isRound(116)).toBe(false);
    expect(isRound(15)).toBe(true);
    const qps = STEPS.find((s) => s.id === 'postQps')!;
    expect(grade(qps, 100)).toBe('exact');
    expect(grade(qps, 200)).toBe('close');
    expect(grade(qps, 1000)).toBe('off');
    const servers = STEPS.find((s) => s.id === 'servers')!;
    expect(grade(servers, 5)).toBe('close');
    expect(grade(servers, 6)).toBe('exact');
    const final = STEPS.find((s) => s.final)!;
    expect(grade(final, 25)).toBe('exact');
    expect(stepPoints(final, 25)).toBeGreaterThanOrEqual(1);
    expect(workbenchScore(NAPKIN)).toBe(1);
    expect(workbenchScore(STEPS.map(() => 1e12))).toBe(0);
  });

  it('a well-rounded napkin earns full marks', () => {
    const done = vi.fn();
    render(<EstimationWorkbench onComplete={done} />);
    STEPS.forEach((s, k) => {
      fireEvent.change(screen.getByLabelText(s.label), { target: { value: NAPKIN[k].toLocaleString('en-US') } });
      fireEvent.click(screen.getByRole('button', { name: 'Check' }));
      fireEvent.click(screen.getByRole('button', { name: /next step|finish napkin/i }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });

  it('bad estimates lower the score', () => {
    const done = vi.fn();
    render(<EstimationWorkbench onComplete={done} />);
    STEPS.forEach((s) => {
      fireEvent.change(screen.getByLabelText(s.label), { target: { value: '1' } });
      fireEvent.click(screen.getByRole('button', { name: 'Check' }));
      fireEvent.click(screen.getByRole('button', { name: /next step|finish napkin/i }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(done.mock.calls[0][0]).toBeLessThan(0.2);
  });
});
