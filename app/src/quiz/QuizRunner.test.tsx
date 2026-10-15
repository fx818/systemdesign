import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { QuizQuestion } from '@/types/content';
import { QuizRunner } from './QuizRunner';

const questions = (count: number): QuizQuestion[] => Array.from({ length: count }, (_, i) => ({
  id: `interview-${i}`, kind: 'mcq', prompt: `Question ${i + 1}`,
  options: ['Correct choice', 'Wrong choice'], answer: 0,
  explanation: `Explanation ${i + 1}`, page: i + 5,
}));

async function answer(index: number, correct = true) {
  await waitFor(() => expect(screen.getByTestId('question-prompt')).toHaveTextContent(`Question ${index + 1}`));
  const user = userEvent.setup();
  await user.click(screen.getByTestId(`option-${correct ? 0 : 1}`));
  await user.click(screen.getByTestId('submit'));
  await user.click(screen.getByTestId('continue'));
}

describe('QuizRunner', () => {
  it('applies the third/fifth-answer combo bonuses and returns the complete result once', async () => {
    const onFinish = vi.fn();
    render(<QuizRunner questions={questions(5)} onFinish={onFinish} />);
    for (let i = 0; i < 5; i++) await answer(i);
    expect(await screen.findByTestId('end-score')).toHaveTextContent('5/5');
    fireEvent.click(screen.getByTestId('finish'));
    fireEvent.click(screen.getByTestId('finish'));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({
      correct: 5, total: 5, xp: 70, heartsLeft: 3, maxCombo: 5, accuracy: 1,
    }));
    expect(onFinish.mock.calls[0][0].perQuestion.map((result: { xp: number }) => result.xp)).toEqual([10, 10, 15, 15, 20]);
  });

  it('continues at zero hearts and reviews every missed answer with its explanation and page', async () => {
    const onFinish = vi.fn();
    render(<QuizRunner questions={questions(4)} onFinish={onFinish} />);
    for (let i = 0; i < 3; i++) await answer(i, false);
    await waitFor(() => expect(screen.getByTestId('hearts')).toHaveAttribute('aria-label', '0 of 3 hearts left'));
    await answer(3);
    const review = await screen.findByTestId('wrong-review');
    expect(review).toHaveTextContent('Explanation 1');
    expect(review).toHaveTextContent('Explanation 3');
    expect(review).toHaveTextContent('Book p. 7');
    expect(screen.getByText(/Hearts ran out/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('finish'));
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ correct: 1, total: 4, xp: 10, heartsLeft: 0, maxCombo: 1 }));
  });

  it('finishes an empty interview without waiting for interaction', () => {
    const onFinish = vi.fn();
    render(<QuizRunner questions={[]} onFinish={onFinish} />);
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ correct: 0, total: 0, xp: 0, perQuestion: [] }));
  });
});
