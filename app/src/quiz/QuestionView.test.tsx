import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QuizQuestion } from '@/types/content';
import { QuestionView } from './QuestionView';
import { shuffledIndices } from './seeded';

/** Give jsdom elements fake rects so @dnd-kit collision detection works. */
function fakeRect(el: HTMLElement, top: number, height = 56) {
  el.getBoundingClientRect = () =>
    ({ top, bottom: top + height, left: 0, right: 300, width: 300, height, x: 0, y: top }) as DOMRect;
}

const mcq: QuizQuestion = {
  id: 'q-mcq',
  kind: 'mcq',
  prompt: 'What does DNS give you for api.pixelpost.com?',
  explanation: 'DNS resolves the hostname to an IP address.',
  page: 12,
  options: ['A MAC address', 'An IP address', 'A port', 'A cookie'],
  answer: 1,
};

const order2: QuizQuestion = {
  id: 'q-order',
  kind: 'order',
  prompt: 'Order the request flow',
  explanation: 'DNS, then TCP, then HTTP, then response.',
  page: 9,
  items: ['DNS lookup', 'HTTP request'],
};

const spot: QuizQuestion = {
  id: 'q-spot',
  kind: 'spot',
  prompt: 'Tap the single point of failure',
  explanation: 'The single DB has no replica.',
  page: 20,
  diagram: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Client', x: 100, y: 360 },
      { id: 'db', kind: 'db', label: 'Database', x: 900, y: 360 },
    ],
    edges: [{ from: 'client', to: 'db' }],
  },
  answers: ['db'],
};

const key = (code: string, k: string) => fireEvent.keyDown(window, { code, key: k });

describe('QuestionView: mcq', () => {
  it('renders prompt, kind badge and options', () => {
    render(<QuestionView question={mcq} onAnswer={vi.fn()} />);
    expect(screen.getByTestId('question-prompt')).toHaveTextContent('What does DNS');
    expect(screen.getByText('Multiple choice')).toBeInTheDocument();
    expect(screen.getByTestId('option-3')).toHaveTextContent('A cookie');
    expect(screen.getByTestId('submit')).toBeDisabled();
  });

  it('correct answer: glow feedback, explanation, book page, then onAnswer(true)', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<QuestionView question={mcq} onAnswer={onAnswer} />);

    await user.click(screen.getByTestId('option-1'));
    expect(screen.getByTestId('submit')).toBeEnabled();

    await user.click(screen.getByTestId('submit'));
    const feedback = screen.getByTestId('feedback');
    expect(feedback).toHaveTextContent('Correct!');
    expect(feedback).toHaveTextContent('DNS resolves the hostname');
    expect(feedback).toHaveTextContent('Book p. 12');

    await user.click(screen.getByTestId('continue'));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('wrong answer: shake feedback shows the correct answer, then onAnswer(false)', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<QuestionView question={mcq} onAnswer={onAnswer} />);

    await user.click(screen.getByTestId('option-0'));
    await user.click(screen.getByTestId('submit'));
    const feedback = screen.getByTestId('feedback');
    expect(feedback).toHaveTextContent('Not quite');
    expect(feedback).toHaveTextContent('Correct answer: An IP address');

    await user.click(screen.getByTestId('continue'));
    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it('keyboard: 2 picks the second option, Enter submits, Enter continues', async () => {
    const onAnswer = vi.fn();
    render(<QuestionView question={mcq} onAnswer={onAnswer} />);

    fireEvent.keyDown(document.body, { key: '2' });
    expect(screen.getByTestId('option-1')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('submit')).toBeEnabled();

    key('Enter', 'Enter'); // submit
    expect(screen.getByTestId('feedback')).toBeInTheDocument();
    key('Enter', 'Enter'); // continue
    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('onSubmit fires the moment the answer is checked', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<QuestionView question={mcq} onAnswer={vi.fn()} onSubmit={onSubmit} />);
    await user.click(screen.getByTestId('option-1'));
    await user.click(screen.getByTestId('submit'));
    expect(onSubmit).toHaveBeenCalledWith(true);
  });
});

describe('QuestionView: order', () => {
  it('renders the items deterministically shuffled (never pre-solved)', () => {
    render(<QuestionView question={order2} onAnswer={vi.fn()} />);
    const expected = shuffledIndices(2, 'q-order');
    const row0 = screen.getByTestId('order-row-0');
    const row1 = screen.getByTestId('order-row-1');
    expect(row0).toHaveTextContent(order2.items[expected[0]]);
    expect(row1).toHaveTextContent(order2.items[expected[1]]);
    expect(expected).not.toEqual([0, 1]);
  });

  it('same question id always renders the same arrangement', () => {
    const { unmount } = render(<QuestionView question={order2} onAnswer={vi.fn()} />);
    const first = screen.getByTestId('order-row-0').textContent;
    unmount();
    render(<QuestionView question={order2} onAnswer={vi.fn()} />);
    expect(screen.getByTestId('order-row-0').textContent).toBe(first);
  });

  it('keyboard sorting (Space/Arrow/Space) reorders, then grades correctly', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<QuestionView question={order2} onAnswer={onAnswer} />);
    // sanity: the shuffled start is reversed for a 2-item list
    expect(screen.getByTestId('order-row-0')).toHaveTextContent(order2.items[1]);

    // Fake layout so dnd-kit's collision detection has something to chew on.
    const rows = () => screen.getAllByTestId(/order-row-/);
    rows().forEach((el, i) => fakeRect(el, i * 60));

    const first = screen.getByTestId('order-row-0');
    first.focus();
    expect(document.activeElement).toBe(first);

    // Real keyboard events bubble from the focused row to document. Await each
    // gesture so dnd-kit's keyboard sensor can attach after activation.
    await user.keyboard('[Space]'); // lift
    await user.keyboard('[ArrowDown]'); // move down
    await user.keyboard('[Space]'); // drop

    await waitFor(() => {
      expect(screen.getByTestId('order-row-0')).toHaveTextContent(order2.items[0]);
      expect(screen.getByTestId('order-row-1')).toHaveTextContent(order2.items[1]);
    });

    fireEvent.click(screen.getByTestId('submit'));
    expect(screen.getByTestId('feedback')).toHaveTextContent('Correct!');
    fireEvent.click(screen.getByTestId('continue'));
    expect(onAnswer).toHaveBeenCalledWith(true);
  });
});

describe('QuestionView: spot', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('click the right node, submit, continue', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<QuestionView question={spot} onAnswer={onAnswer} />);

    await user.click(screen.getByRole('button', { name: 'Database node' }));
    expect(screen.getByRole('button', { name: 'Database node' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('submit')).toBeEnabled();

    await user.click(screen.getByTestId('submit'));
    expect(screen.getByTestId('feedback')).toHaveTextContent('Correct!');
    await user.click(screen.getByTestId('continue'));
    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('clicking the wrong node grades false and reveals it in red', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<QuestionView question={spot} onAnswer={onAnswer} />);

    await user.click(screen.getByRole('button', { name: 'Client node' }));
    await user.click(screen.getByTestId('submit'));
    const feedback = screen.getByTestId('feedback');
    expect(feedback).toHaveTextContent('Not quite');
    expect(feedback).toHaveTextContent('Correct answer: Database');
    await user.click(screen.getByTestId('continue'));
    expect(onAnswer).toHaveBeenCalledWith(false);
  });
});
