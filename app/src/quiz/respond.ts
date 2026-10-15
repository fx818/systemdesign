/**
 * Default (pre-interaction) responses per question kind. Order/bins/label need
 * a complete draft from the start so `isComplete` and grading always work on a
 * fully-shaped response; the others stay null until the player acts.
 */
import type { QuizQuestion } from '@/types/content';
import type { QuizResponse } from './types';
import { shuffledIndices } from './seeded';

export function initialResponse(question: QuizQuestion): QuizResponse | null {
  switch (question.kind) {
    case 'order':
      // Shuffled deterministically by question id — never starts solved.
      return { kind: 'order', order: shuffledIndices(question.items.length, question.id) };
    case 'bins':
      return { kind: 'bins', placements: question.items.map(() => null) };
    case 'label':
      return {
        kind: 'label',
        assignments: Object.fromEntries(question.labels.map((l) => [l.nodeId, null])),
      };
    case 'numeric':
      return { kind: 'numeric', value: Number.NaN };
    default:
      return null;
  }
}
