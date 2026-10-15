import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { QuizQuestion } from '@/types/content';
import { QuestionView } from './QuestionView';

const base = { id: 'answer', prompt: 'Solve it', explanation: 'Here is why.', page: 9 };

describe('QuestionView remaining answer kinds', () => {
  it('requires an explicit false selection before submitting a true/false answer', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<QuestionView question={{ ...base, kind: 'truefalse', answer: false }} onAnswer={onAnswer} />);
    expect(screen.getByTestId('submit')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'False' }));
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('feedback')).toHaveTextContent('Correct!');
    await user.click(screen.getByTestId('continue'));
    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('requires the full multi-select set', async () => {
    const user = userEvent.setup();
    render(<QuestionView question={{ ...base, kind: 'multi', options: ['A', 'B', 'C'], answers: [0, 2] }} onAnswer={vi.fn()} />);
    await user.keyboard('13{Enter}');
    expect(screen.getByTestId('feedback')).toHaveTextContent('Correct!');
  });

  it('accepts a numeric value within tolerance and shows its unit', async () => {
    const user = userEvent.setup();
    render(<QuestionView question={{ ...base, kind: 'numeric', answer: 10, tolerance: 0.5, unit: 'ms' }} onAnswer={vi.fn()} />);
    expect(screen.getByText('ms')).toBeInTheDocument();
    expect(screen.getByTestId('submit')).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: 'Numeric answer in ms' }), '10.4{Enter}');
    expect(screen.getByTestId('feedback')).toHaveTextContent('Correct!');
  });

  it('sorts bins using keyboard-accessible placement targets', async () => {
    const user = userEvent.setup();
    const question: QuizQuestion = { ...base, kind: 'bins', bins: ['SQL', 'NoSQL'], items: [{ text: 'Transactions', bin: 0 }, { text: 'Click stream', bin: 1 }] };
    render(<QuestionView question={question} onAnswer={vi.fn()} />);
    await user.click(screen.getByTestId('chip-0'));
    screen.getByRole('button', { name: 'Place selected item in SQL' }).focus();
    await user.keyboard('{Enter}');
    await user.click(screen.getByTestId('chip-1'));
    screen.getByRole('button', { name: 'Place selected item in NoSQL' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('submit')).toBeEnabled();
    await user.click(screen.getByTestId('submit'));
    expect(screen.getByTestId('feedback')).toHaveTextContent('Correct!');
  });

  it('places diagram labels and grades them through the same feedback flow', async () => {
    const user = userEvent.setup();
    const question: QuizQuestion = {
      ...base, kind: 'label', labels: [{ nodeId: 'web', text: 'API server' }, { nodeId: 'db', text: 'Database' }],
      diagram: { nodes: [{ id: 'web', kind: 'web', label: 'A', x: 200, y: 360 }, { id: 'db', kind: 'db', label: 'B', x: 900, y: 360 }], edges: [] },
    };
    render(<QuestionView question={question} onAnswer={vi.fn()} />);
    await user.click(screen.getByTestId('label-chip-API server'));
    await user.click(screen.getByRole('button', { name: 'A node' }));
    await user.click(screen.getByTestId('label-chip-Database'));
    await user.click(screen.getByRole('button', { name: 'B node' }));
    await user.click(screen.getByTestId('submit'));
    expect(screen.getByTestId('feedback')).toHaveTextContent('Correct!');
  });
});
