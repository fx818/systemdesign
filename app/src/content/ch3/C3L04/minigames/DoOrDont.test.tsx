import { act, fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import DoOrDont, { CARD_SEC, DECK, ORDER, doOrDontScore } from './DoOrDont';

describe('Do or Don\'t', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
    vi.useRealTimers();
  });

  it('has a balanced deck in a fixed order', () => {
    expect(ORDER).toHaveLength(DECK.length);
    expect(DECK.filter((c) => c.isDo).length).toBeGreaterThanOrEqual(6);
    expect(DECK.filter((c) => !c.isDo).length).toBeGreaterThanOrEqual(6);
    expect(new Set(DECK.map((c) => c.text)).size).toBe(DECK.length);
    expect(doOrDontScore(9, 18)).toBe(0.5);
  });

  it('sorting every card correctly with the arrow keys scores 1', { timeout: 30000 }, async () => {
    const done = vi.fn();
    render(<DoOrDont onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: 'Deal' }));
    for (const card of ORDER) {
      await screen.findByText(card.text);
      fireEvent.keyDown(window, { key: card.isDo ? 'ArrowLeft' : 'ArrowRight' });
      fireEvent.click(await screen.findByRole('button', { name: /next card|see results/i }));
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });

  it('running out of time counts as a miss', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<DoOrDont onComplete={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Deal' }));
    act(() => { vi.advanceTimersByTime(CARD_SEC * 1000 + 10); });
    vi.useRealTimers();
    expect(await screen.findByText(/too slow/i)).toBeTruthy();
  });
});
