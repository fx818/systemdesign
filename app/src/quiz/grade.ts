/**
 * Pure grading for every QuizQuestion kind. No React, no randomness, no time —
 * same (question, response) => same verdict. Covered by grade.test.ts.
 */
import type { QuizQuestion } from '@/types/content';
import type { QuizResponse } from './types';

const sameSet = <T,>(a: readonly T[], b: readonly T[]): boolean => {
  const left = new Set(a);
  const right = new Set(b);
  return left.size === right.size && [...right].every((v) => left.has(v));
};

/**
 * Grade a complete response. A response whose `kind` does not match the
 * question's kind (or is otherwise malformed) is simply wrong.
 */
export function grade(question: QuizQuestion, response: QuizResponse | null | undefined): boolean {
  if (!response) return false;
  switch (question.kind) {
    case 'mcq':
      return response.kind === 'mcq' && response.index === question.answer;

    case 'multi':
      return response.kind === 'multi' && sameSet(response.indices, question.answers);

    case 'order':
      return (
        response.kind === 'order' &&
        response.order.length === question.items.length &&
        // `items` is the correct order, so the arrangement must be 0,1,2,...
        response.order.every((itemIndex, position) => itemIndex === position)
      );

    case 'truefalse':
      return response.kind === 'truefalse' && response.value === question.answer;

    case 'bins':
      return (
        response.kind === 'bins' &&
        response.placements.length === question.items.length &&
        question.items.every((item, i) => response.placements[i] === item.bin)
      );

    case 'numeric': {
      if (response.kind !== 'numeric' || !Number.isFinite(response.value)) return false;
      return Math.abs(response.value - question.answer) <= (question.tolerance ?? 0);
    }

    case 'spot':
      return response.kind === 'spot' && sameSet(response.nodeIds, question.answers);

    case 'label':
      return (
        response.kind === 'label' &&
        question.labels.every((l) => response.assignments[l.nodeId] === l.text)
      );
  }
}

/** Is this response complete enough to submit? (Per-kind completeness rules.) */
export function isComplete(question: QuizQuestion, response: QuizResponse | null | undefined): boolean {
  if (!response || response.kind !== question.kind) return false;
  switch (question.kind) {
    case 'mcq':
      return response.kind === 'mcq' && response.index >= 0;
    case 'multi':
      return response.kind === 'multi' && response.indices.length > 0;
    case 'order':
      return response.kind === 'order' && response.order.length === question.items.length;
    case 'truefalse':
      return response.kind === 'truefalse';
    case 'bins':
      return response.kind === 'bins' &&
        response.placements.length === question.items.length &&
        response.placements.every((p) => p !== null);
    case 'numeric':
      return response.kind === 'numeric' && Number.isFinite(response.value);
    case 'spot':
      return response.kind === 'spot' && response.nodeIds.length > 0;
    case 'label':
      return response.kind === 'label' &&
        question.labels.every((l) => response.assignments[l.nodeId] != null);
  }
}

/** One line describing the correct answer — used in the runner's review list. */
export function describeCorrect(question: QuizQuestion): string {
  switch (question.kind) {
    case 'mcq':
      return question.options[question.answer] ?? '';
    case 'multi':
      return question.answers.map((i) => question.options[i]).filter(Boolean).join(' + ');
    case 'order':
      return question.items.map((s, i) => `${i + 1}. ${s}`).join('  →  ');
    case 'truefalse':
      return question.answer ? 'True' : 'False';
    case 'bins':
      return question.bins
        .map((bin, bi) => {
          const members = question.items.filter((it) => it.bin === bi).map((it) => it.text);
          return members.length ? `${bin}: ${members.join(', ')}` : null;
        })
        .filter(Boolean)
        .join('  •  ');
    case 'numeric':
      return `${question.answer}${question.unit ? ` ${question.unit}` : ''}`;
    case 'spot': {
      const labels = question.answers.map(
        (id) => question.diagram.nodes.find((n) => n.id === id)?.label ?? id,
      );
      return labels.join(', ');
    }
    case 'label': {
      return question.labels
        .map((l) => {
          const node = question.diagram.nodes.find((n) => n.id === l.nodeId);
          return `${l.text} → ${node?.label ?? l.nodeId}`;
        })
        .join(', ');
    }
  }
}
