/** multi: pick all that apply; keys 1..n toggle options too. */
import type { QuizQuestion } from '@/types/content';
import { useOptionKeys } from '../useOptionKeys';
import { OptionButton, type Reveal } from './common';

export interface MultiAnswerProps {
  question: Extract<QuizQuestion, { kind: 'multi' }>;
  value: { kind: 'multi'; indices: number[] } | null;
  onChange: (v: { kind: 'multi'; indices: number[] }) => void;
  locked: boolean;
}

export function MultiAnswer({ question, value, onChange, locked }: MultiAnswerProps) {
  const picked = value?.kind === 'multi' ? value.indices : [];
  const answers = question.answers;

  const toggle = (i: number) => {
    if (locked) return;
    const next = picked.includes(i) ? picked.filter((p) => p !== i) : [...picked, i];
    onChange({ kind: 'multi', indices: next });
  };
  useOptionKeys(question.options.length, toggle, !locked);

  const reveal = (i: number): Reveal => {
    if (!locked) return 'none';
    const isAnswer = answers.includes(i);
    const isPicked = picked.includes(i);
    if (isAnswer && isPicked) return 'correct';
    if (isAnswer) return 'missed';
    if (isPicked) return 'wrong';
    return 'none';
  };

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="group" aria-label="Pick all that apply">
      {question.options.map((text, i) => (
        <OptionButton
          key={i}
          index={i}
          text={text}
          selected={picked.includes(i)}
          reveal={reveal(i)}
          multi
          disabled={locked}
          onClick={locked ? undefined : () => toggle(i)}
        />
      ))}
    </div>
  );
}
