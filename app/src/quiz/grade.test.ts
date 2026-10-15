import { describe, expect, it } from 'vitest';
import type { QuizQuestion } from '@/types/content';
import { describeCorrect, grade, isComplete } from './grade';
import type { QuizResponse } from './types';

const graph = {
  nodes: [
    { id: 'client', kind: 'client' as const, x: 100, y: 360 },
    { id: 'web', kind: 'web' as const, x: 500, y: 360 },
    { id: 'db', kind: 'db' as const, x: 900, y: 360 },
  ],
  edges: [{ from: 'client', to: 'web' }],
};

const questions: Record<QuizQuestion['kind'], QuizQuestion> = {
  mcq: { id: 'mcq1', kind: 'mcq', prompt: 'Pick', explanation: 'e', page: 12, options: ['A', 'B', 'C'], answer: 1 },
  multi: { id: 'multi1', kind: 'multi', prompt: 'Pick all', explanation: 'e', options: ['A', 'B', 'C'], answers: [0, 2] },
  order: { id: 'order1', kind: 'order', prompt: 'Order', explanation: 'e', items: ['first', 'second', 'third'] },
  truefalse: { id: 'tf1', kind: 'truefalse', prompt: 'T or F', explanation: 'e', answer: true },
  bins: {
    id: 'bins1',
    kind: 'bins',
    prompt: 'Sort',
    explanation: 'e',
    bins: ['SQL', 'NoSQL'],
    items: [
      { text: 'Users table', bin: 0 },
      { text: 'Click stream', bin: 1 },
    ],
  },
  numeric: { id: 'num1', kind: 'numeric', prompt: 'Shard?', explanation: 'e', answer: 3, unit: 'shard', tolerance: 0.01 },
  spot: {
    id: 'spot1',
    kind: 'spot',
    prompt: 'SPOF?',
    explanation: 'e',
    diagram: graph,
    answers: ['db'],
  },
  label: {
    id: 'label1',
    kind: 'label',
    prompt: 'Label it',
    explanation: 'e',
    diagram: graph,
    labels: [
      { nodeId: 'client', text: 'Browser' },
      { nodeId: 'web', text: 'API server' },
    ],
  },
};

const correctResponses: Record<QuizQuestion['kind'], QuizResponse> = {
  mcq: { kind: 'mcq', index: 1 },
  multi: { kind: 'multi', indices: [2, 0] }, // order-insensitive
  order: { kind: 'order', order: [0, 1, 2] },
  truefalse: { kind: 'truefalse', value: true },
  bins: { kind: 'bins', placements: [0, 1] },
  numeric: { kind: 'numeric', value: 3.005 }, // within tolerance
  spot: { kind: 'spot', nodeIds: ['db'] },
  label: { kind: 'label', assignments: { client: 'Browser', web: 'API server' } },
};

const wrongResponses: Record<QuizQuestion['kind'], QuizResponse> = {
  mcq: { kind: 'mcq', index: 0 },
  multi: { kind: 'multi', indices: [0] }, // subset — not enough
  order: { kind: 'order', order: [1, 0, 2] },
  truefalse: { kind: 'truefalse', value: false },
  bins: { kind: 'bins', placements: [1, 1] },
  numeric: { kind: 'numeric', value: 2 },
  spot: { kind: 'spot', nodeIds: ['web'] },
  label: { kind: 'label', assignments: { client: 'API server', web: 'API server' } },
};

describe.each(Object.keys(questions) as QuizQuestion['kind'][])('grade: %s', (kind) => {
  it('grades a correct response true', () => {
    expect(grade(questions[kind], correctResponses[kind])).toBe(true);
  });
  it('grades a wrong response false', () => {
    expect(grade(questions[kind], wrongResponses[kind])).toBe(false);
  });
  it('grades a kind-mismatched response false', () => {
    const other: QuizResponse = { kind: 'truefalse', value: true };
    expect(grade(questions[kind], other)).toBe(false);
  });
  it('grades null/undefined false', () => {
    expect(grade(questions[kind], null)).toBe(false);
    expect(grade(questions[kind], undefined)).toBe(false);
  });
});

describe('grade: extra edge cases', () => {
  it('multi requires exact set (no extras)', () => {
    const q = questions.multi;
    expect(grade(q, { kind: 'multi', indices: [0, 1, 2] })).toBe(false);
    expect(grade(q, { kind: 'multi', indices: [0, 2, 2] })).toBe(true); // dupes collapse
  });

  it('multi with duplicates is not correct', () => {
    const q = questions.multi;
    expect(grade(q, { kind: 'multi', indices: [0, 0] })).toBe(false);
  });

  it('order requires identity mapping', () => {
    const q = questions.order;
    expect(grade(q, { kind: 'order', order: [2, 1, 0] })).toBe(false);
    expect(grade(q, { kind: 'order', order: [0, 1] })).toBe(false); // wrong length
  });

  it('numeric respects tolerance (inclusive) and defaults to 0', () => {
    const q = questions.numeric;
    expect(grade(q, { kind: 'numeric', value: 3.01 })).toBe(true); // boundary
    expect(grade(q, { kind: 'numeric', value: 2.98 })).toBe(false);
    const exact: QuizQuestion = { id: 'num2', kind: 'numeric', prompt: 'p', explanation: 'e', answer: 42 };
    expect(grade(exact, { kind: 'numeric', value: 42 })).toBe(true);
    expect(grade(exact, { kind: 'numeric', value: 42.001 })).toBe(false);
  });

  it('numeric NaN is false', () => {
    expect(grade(questions.numeric, { kind: 'numeric', value: Number.NaN })).toBe(false);
  });

  it('spot requires every answer node (set equality)', () => {
    const q: QuizQuestion = {
      id: 'spot2',
      kind: 'spot',
      prompt: 'Pick both',
      explanation: 'e',
      diagram: graph,
      answers: ['db', 'web'],
    };
    expect(grade(q, { kind: 'spot', nodeIds: ['db'] })).toBe(false);
    expect(grade(q, { kind: 'spot', nodeIds: ['web', 'db', 'web'] })).toBe(true);
    expect(grade(q, { kind: 'spot', nodeIds: ['db', 'web', 'client'] })).toBe(false);
  });

  it('label ignores extra node assignments but requires exact texts', () => {
    const q = questions.label;
    const extra = { ...correctResponses.label, assignments: { client: 'Browser', web: 'API server', db: 'Browser' } } as QuizResponse;
    // db has no correct label, so a stray assignment is simply ignored
    expect(grade(q, extra)).toBe(true);
    const wrongText = { kind: 'label', assignments: { client: 'Browser', web: 'Wrong' } } as QuizResponse;
    expect(grade(q, wrongText)).toBe(false);
  });
});

describe('isComplete', () => {
  it('is false before any interaction', () => {
    for (const kind of Object.keys(questions) as QuizQuestion['kind'][]) {
      expect(isComplete(questions[kind], null)).toBe(false);
      expect(isComplete(questions[kind], { kind: 'truefalse', value: true })).toBe(false);
    }
  });
  it('is true for the correct-shaped responses', () => {
    for (const kind of Object.keys(questions) as QuizQuestion['kind'][]) {
      expect(isComplete(questions[kind], correctResponses[kind])).toBe(true);
    }
  });
  it('bins is incomplete while an item is in the pool', () => {
    expect(isComplete(questions.bins, { kind: 'bins', placements: [0, null] })).toBe(false);
  });
  it('numeric is incomplete while NaN', () => {
    expect(isComplete(questions.numeric, { kind: 'numeric', value: Number.NaN })).toBe(false);
  });
  it('spot is incomplete with no nodes', () => {
    expect(isComplete(questions.spot, { kind: 'spot', nodeIds: [] })).toBe(false);
  });
});

describe('describeCorrect', () => {
  it('describes every kind without throwing', () => {
    for (const kind of Object.keys(questions) as QuizQuestion['kind'][]) {
      expect(typeof describeCorrect(questions[kind])).toBe('string');
      expect(describeCorrect(questions[kind]).length).toBeGreaterThan(0);
    }
  });
  it('formats a few kinds nicely', () => {
    expect(describeCorrect(questions.mcq)).toBe('B');
    expect(describeCorrect(questions.truefalse)).toBe('True');
    expect(describeCorrect(questions.numeric)).toBe('3 shard');
    expect(describeCorrect(questions.order)).toBe('1. first  →  2. second  →  3. third');
  });
});
