/**
 * Ravi's interview lines, picked deterministically (hash of the question id)
 * — no Math.random, so a given question always greets you the same way.
 */
import { hashString } from './seeded';

const OPENERS = [
  'Next question...',
  'Next question. Think it through.',
  'Next question — take your time.',
  "Next question. I'm watching.",
  'Next question. Say your reasoning out loud.',
  'Next question. Imagine the diagram in your head.',
] as const;

const CORRECT = [
  'Sharp. That is exactly right.',
  'Correct — you have read the book.',
  "That's the answer I was looking for.",
  'Nailed it. On to the next one.',
  'Correct. The scaling checklist is sinking in.',
] as const;

const WRONG = [
  'Not quite — read the explanation, then move on.',
  "That's not it. Look at why before continuing.",
  'Close, but no. The explanation matters more than the point.',
  "Wrong answer, and that's fine — this is how architects learn.",
] as const;

type Phase = 'asking' | 'correct' | 'wrong';

/** Deterministic Ravi line for a question in a given phase. */
export function raviLine(questionId: string, phase: Phase): string {
  const pool: readonly string[] =
    phase === 'correct' ? CORRECT : phase === 'wrong' ? WRONG : OPENERS;
  return pool[hashString(`${questionId}:${phase}`) % pool.length];
}
