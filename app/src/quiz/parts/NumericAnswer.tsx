/** numeric: free numeric input with optional unit, graded against tolerance. */
import { clsx } from 'clsx';
import type { QuizQuestion } from '@/types/content';
import { useState } from 'react';

export interface NumericAnswerProps {
  question: Extract<QuizQuestion, { kind: 'numeric' }>;
  value: { kind: 'numeric'; value: number } | null;
  onChange: (v: { kind: 'numeric'; value: number }) => void;
  locked: boolean;
}

export function NumericAnswer({ question, value, onChange, locked }: NumericAnswerProps) {
  const [text, setText] = useState('');
  const hasNumber = value?.kind === 'numeric' && Number.isFinite(value.value);

  const handleChange = (raw: string) => {
    setText(raw);
    const n = Number(raw.trim().replace(/,/g, ''));
    onChange({ kind: 'numeric', value: n }); // NaN = incomplete; graded false
  };

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div
        className={clsx(
          'flex items-center gap-3 rounded-xl border-2 bg-slate-900/70 px-4 py-3',
          locked ? 'border-slate-700' : 'border-slate-700 focus-within:border-cyan-400',
        )}
      >
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          disabled={locked}
          value={locked && hasNumber ? String(value.value) : text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Your answer…"
          aria-label={`Numeric answer${question.unit ? ` in ${question.unit}` : ''}`}
          data-testid="numeric-input"
          className="w-44 bg-transparent text-center text-2xl font-black text-slate-100 tabular-nums placeholder:text-base placeholder:font-semibold placeholder:text-slate-600 focus:outline-none disabled:text-slate-500"
        />
        {question.unit && (
          <span className="text-sm font-bold text-cyan-300/80">{question.unit}</span>
        )}
      </div>
      {locked && (
        <p className="text-xs text-slate-500">
          Accepted answer: {question.answer}
          {question.unit ? ` ${question.unit}` : ''}
          {question.tolerance ? ` (± ${question.tolerance})` : ''}
        </p>
      )}
    </div>
  );
}
