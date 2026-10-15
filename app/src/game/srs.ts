/** Leitner spaced repetition (boxes 1-5) for key-takeaway cards.
 *  Pure helpers — unit tested. Dates are local date keys (yyyy-mm-dd). */
import { addDays } from './streak';

export interface CardState {
  id: string; // `${levelId}#${index}`
  front: string;
  back: string;
  box: number; // 1..5
  /** Local date key when the card becomes due. */
  due: string;
}

export const MIN_BOX = 1;
export const MAX_BOX = 5;

/** Days until a card in each box becomes due again after a review. */
export const BOX_INTERVAL_DAYS: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 4,
  5: 7,
};

export function newCard(id: string, front: string, back: string, today: string): CardState {
  return { id, front, back, box: MIN_BOX, due: today };
}

/** Review a card: correct promotes one box, wrong demotes back to box 1. */
export function reviewCardState(card: CardState, correct: boolean, today: string): CardState {
  const box = correct ? Math.min(MAX_BOX, card.box + 1) : MIN_BOX;
  return { ...card, box, due: addDays(today, BOX_INTERVAL_DAYS[box] ?? 0) };
}

export function isDue(card: CardState, today: string): boolean {
  return card.due <= today;
}

/** All cards due on `today`, hardest-first (lowest box, then oldest due). */
export function dueCards(cards: Record<string, CardState>, today: string): CardState[] {
  return Object.values(cards)
    .filter((c) => isDue(c, today))
    .sort((a, b) => a.box - b.box || a.due.localeCompare(b.due) || a.id.localeCompare(b.id));
}

export const FLASHBACK_SIZE = 5;

/** The daily "Flashback": up to `n` due cards. */
export function pickFlashback(cards: Record<string, CardState>, today: string, n = FLASHBACK_SIZE): CardState[] {
  return dueCards(cards, today).slice(0, n);
}
