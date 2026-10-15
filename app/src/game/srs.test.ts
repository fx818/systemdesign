import { describe, expect, it } from 'vitest';
import { dueCards, newCard, pickFlashback, reviewCardState } from './srs';
import type { CardState } from './srs';

const TODAY = '2026-02-01';

describe('srs (Leitner boxes)', () => {
  it('new cards start in box 1, due today', () => {
    expect(newCard('L01#0', 'f', 'b', TODAY)).toEqual({ id: 'L01#0', front: 'f', back: 'b', box: 1, due: TODAY });
  });

  it('correct answers promote one box and push the due date out', () => {
    const c = newCard('L01#0', 'f', 'b', TODAY);
    const b2 = reviewCardState(c, true, TODAY);
    expect(b2.box).toBe(2);
    expect(b2.due).toBe('2026-02-02'); // +1 day
    const b3 = reviewCardState(b2, true, b2.due);
    expect(b3.box).toBe(3);
    expect(b3.due).toBe('2026-02-04'); // +2 days
  });

  it('wrong answers demote to box 1, due today', () => {
    const c: CardState = { id: 'x', front: 'f', back: 'b', box: 5, due: TODAY };
    const demoted = reviewCardState(c, false, TODAY);
    expect(demoted.box).toBe(1);
    expect(demoted.due).toBe(TODAY);
  });

  it('never promotes past box 5', () => {
    const c: CardState = { id: 'x', front: 'f', back: 'b', box: 5, due: TODAY };
    expect(reviewCardState(c, true, TODAY).box).toBe(5);
    expect(reviewCardState(c, true, TODAY).due).toBe('2026-02-08'); // +7 days
  });

  it('dueCards returns only due cards, hardest first', () => {
    const cards: Record<string, CardState> = {
      a: { id: 'a', front: '', back: '', box: 3, due: '2026-02-01' },
      b: { id: 'b', front: '', back: '', box: 1, due: '2026-01-30' },
      c: { id: 'c', front: '', back: '', box: 1, due: '2026-02-05' },
    };
    const due = dueCards(cards, TODAY);
    expect(due.map((c) => c.id)).toEqual(['b', 'a']);
  });

  it('pickFlashback caps at 5 cards', () => {
    const cards: Record<string, CardState> = {};
    for (let i = 0; i < 8; i++) cards[`k${i}`] = { id: `k${i}`, front: '', back: '', box: 1, due: TODAY };
    expect(pickFlashback(cards, TODAY)).toHaveLength(5);
  });
});
