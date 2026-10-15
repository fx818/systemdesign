/** mcq: pick exactly one option; keys 1..n work too. */
import type { QuizQuestion } from '@/types/content';
import { useOptionKeys } from '../useOptionKeys';
import { OptionButton, type Reveal } from './common';

export interface McqAnswerProps {
  question: Extract<QuizQuestion, { kind: 'mcq' }>;
  value: { kind: 'mcq'; index: number } | null;
  onChange: (v: { kind: 'mcq'; index: number }) => void;
  locked: boolean;
}

export function McqAnswer({ question, value, onChange, locked }: McqAnswerProps) {
  const chosen = value?.kind === 'mcq' ? value.index : -1;
  useOptionKeys(question.options.length, (i) => onChange({ kind: 'mcq', index: i }), !locked);

  const reveal = (i: number): Reveal => {
    if (!locked) return 'none';
    if (i === question.answer) return 'correct';
    if (i === chosen) return 'wrong';
    return 'none';
  };

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="group" aria-label="Answer options">
      {question.options.map((text, i) => (
        <OptionButton
          key={i}
          index={i}
          text={text}
          selected={chosen === i}
          reveal={reveal(i)}
          disabled={locked}
          onClick={locked ? undefined : () => onChange({ kind: 'mcq', index: i })}
        />
      ))}
    </div>
  );
}
