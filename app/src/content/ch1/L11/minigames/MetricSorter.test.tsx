import { act, fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { METRIC_ITEMS, METRIC_TYPES } from '../data';
import MetricSorter, { CARD_TIME, sorterScore } from './MetricSorter';

describe('MetricSorter', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('covers every metric type', () => {
    for (const m of METRIC_TYPES) expect(METRIC_ITEMS.some((i) => i.type === m.id)).toBe(true);
    expect(sorterScore([true, false], 4)).toBe(0.25);
  });

  it('perfect run reports 1', { timeout: 30000 }, async () => {
    const done = vi.fn();
    render(<MetricSorter onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: /start the stream/i }));
    for (const item of METRIC_ITEMS) {
      await screen.findByText(item.text);
      fireEvent.keyDown(window, { key: String(METRIC_TYPES.findIndex((m) => m.id === item.type) + 1) });
      fireEvent.click(await screen.findByRole('button', { name: /next metric|see results/i }));
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });

  it('a card times out as a miss', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(<MetricSorter onComplete={() => {}} />);
      fireEvent.click(screen.getByRole('button', { name: /start the stream/i }));
      await screen.findByText(METRIC_ITEMS[0].text);
      act(() => {
        vi.advanceTimersByTime(CARD_TIME * 1000 + 300);
      });
      expect(await screen.findByText("Time's up!")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});
