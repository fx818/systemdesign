import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LessonDef, QuizQuestion } from '@/types/content';
import { LessonPlayer } from './LessonPlayer';

const question: QuizQuestion = {
  id: 'checkpoint', kind: 'mcq', prompt: 'Checkpoint question', options: ['Yes', 'No'],
  answer: 0, explanation: 'Keep going.', page: 5,
};
const lesson: LessonDef = {
  duration: 3, chapters: [{ at: 0, title: 'Start' }], captions: [], hotspots: [], checkpoints: [],
  Scene: ({ time }) => <svg data-testid="scene" data-time={time} />,
};

let callbacks: Map<number, FrameRequestCallback>;
let nextFrame: number;
function frame(time: number) {
  act(() => {
    const pending = [...callbacks.values()];
    callbacks.clear();
    pending.forEach((callback) => callback(time));
  });
}

function open(def: LessonDef, path = '/', onComplete = vi.fn()) {
  render(<MemoryRouter initialEntries={[path]}><LessonPlayer lesson={def} onComplete={onComplete} /></MemoryRouter>);
  return onComplete;
}

beforeEach(() => {
  callbacks = new Map();
  nextFrame = 0;
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callbacks.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id));
});
afterEach(() => vi.unstubAllGlobals());

describe('LessonPlayer transport and checkpoints', () => {
  it('deep-links to a time and external frame control pauses playback and clamps invalid times', () => {
    open(lesson, '/?t=1.5');
    expect(screen.getByTestId('scene')).toHaveAttribute('data-time', '1.5');
    act(() => window.__setLessonTime?.(2));
    frame(0);
    frame(1000);
    expect(screen.getByTestId('scene')).toHaveAttribute('data-time', '2');
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    act(() => window.__setLessonTime?.(Number.NaN));
    expect(screen.getByTestId('scene')).toHaveAttribute('data-time', '0');
  });

  it('sorts checkpoint times consistently when starting after an earlier checkpoint', () => {
    open({ ...lesson, checkpoints: [{ at: 2, question }, { at: 1, question: { ...question, id: 'earlier', prompt: 'Earlier checkpoint' } }] }, '/?t=1.5');
    frame(0);
    frame(1000);
    expect(screen.getByTestId('question-prompt')).toHaveTextContent('Checkpoint question');
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('slider', { name: 'Seek' }), { target: { value: '0' } });
    expect(screen.getByTestId('scene')).toHaveAttribute('data-time', '0');
  });

  it('asks a checkpoint at time zero and waits for the final checkpoint before completing', () => {
    const onComplete = open({ ...lesson, checkpoints: [{ at: 0, question }, { at: 3, question: { ...question, id: 'final' } }] });
    frame(0);
    expect(screen.getByTestId('question-prompt')).toBeInTheDocument();
    const continueCheckpoint = () => {
      fireEvent.click(screen.getByTestId('option-0'));
      fireEvent.click(screen.getByTestId('submit'));
      expect(screen.getByTestId('feedback')).toHaveTextContent('Keep going.');
      fireEvent.click(screen.getByTestId('continue'));
    };
    continueCheckpoint();
    frame(1000);
    frame(4000);
    expect(screen.getByTestId('question-prompt')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    continueCheckpoint();
    frame(5000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
