/**
 * Local types for the quiz engine. The question shapes come from the shared
 * contract (`@/types/content`); these describe the player's responses and the
 * runner's results.
 */
import type { QuizQuestion } from '@/types/content';

/** What the player produced, one variant per question kind. */
export type QuizResponse =
  /** mcq: index of the chosen option */
  | { kind: 'mcq'; index: number }
  /** multi: indices of all chosen options */
  | { kind: 'multi'; indices: number[] }
  /** order: the player's arrangement as indices into the original (correct) items */
  | { kind: 'order'; order: number[] }
  /** truefalse */
  | { kind: 'truefalse'; value: boolean }
  /** bins: placements[itemIndex] = binIndex, null = still in the pool */
  | { kind: 'bins'; placements: (number | null)[] }
  /** numeric: parsed number */
  | { kind: 'numeric'; value: number }
  /** spot: ids of the clicked diagram nodes */
  | { kind: 'spot'; nodeIds: string[] }
  /** label: nodeId -> placed label text (null = not placed yet) */
  | { kind: 'label'; assignments: Record<string, string | null> };

export const DEFAULT_QUESTION_XP = 10;

/** XP multiplier for a streak of consecutive correct answers. */
export function comboMultiplier(streak: number): number {
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

export interface PerQuestionResult {
  id: string;
  kind: QuizQuestion['kind'];
  prompt: string;
  correct: boolean;
  /** XP actually awarded for this question (base x combo multiplier). */
  xp: number;
  explanation: string;
  /** One line describing the correct answer (used in the review list). */
  correctLine?: string;
  page?: number;
}

export interface QuizResult {
  correct: number;
  total: number;
  /** Total XP earned across all questions. */
  xp: number;
  perQuestion: PerQuestionResult[];
  /** Hearts left at the end (out of 3). */
  heartsLeft: number;
  /** Longest correct streak in the run. */
  maxCombo: number;
  /** Accuracy 0..1. */
  accuracy: number;
}
