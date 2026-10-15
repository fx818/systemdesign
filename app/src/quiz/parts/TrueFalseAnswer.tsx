/** truefalse: two big tappable buttons; keys 1/2 work too. */
import { clsx } from 'clsx';
import type { QuizQuestion } from '@/types/content';
import { Check, X } from 'lucide-react';
import { useOptionKeys } from '../useOptionKeys';

export interface TrueFalseAnswerProps {
  question: Extract<QuizQuestion, { kind: 'truefalse' }>;
  value: { kind: 'truefalse'; value: boolean } | null;
  onChange: (v: { kind: 'truefalse'; value: boolean }) => void;
  locked: boolean;
}

export function TrueFalseAnswer({ question, value, onChange, locked }: TrueFalseAnswerProps) {
  const chosen = value?.kind === 'truefalse' ? value.value : null;
  useOptionKeys(
    2,
    (i) => onChange({ kind: 'truefalse', value: i === 0 }),
    !locked,
  );

  const button = (forValue: boolean) => {
    const selected = chosen === forValue;
    const isCorrect = locked && question.answer === forValue;
    const isWrongPick = locked && selected && question.answer !== forValue;
    return (
      <button
        key={String(forValue)}
        type="button"
        aria-pressed={selected}
        data-testid={forValue ? 'option-true' : 'option-false'}
        onClick={locked ? undefined : () => onChange({ kind: 'truefalse', value: forValue })}
        className={clsx(
          'flex min-h-16 flex-1 items-center justify-center gap-2 rounded-xl border-2 bg-slate-900/70 px-4 py-4 text-base font-bold transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
          !locked && !selected && 'border-slate-700 text-slate-200 hover:border-cyan-400/60 hover:bg-slate-800/60',
          !locked && selected && 'border-cyan-400 bg-cyan-400/15 text-cyan-100',
          isCorrect && 'border-emerald-400 bg-emerald-400/15 text-emerald-100',
          isWrongPick && 'border-rose-400 bg-rose-400/15 text-rose-100',
          locked && 'cursor-default',
        )}
      >
        {forValue ? <Check size={22} strokeWidth={3} /> : <X size={22} strokeWidth={3} />}
        {forValue ? 'True' : 'False'}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row" role="group" aria-label="True or false">
      {button(true)}
      {button(false)}
    </div>
  );
}
