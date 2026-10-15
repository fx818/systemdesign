import { clsx } from 'clsx';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import type { QuestionViewProps } from './quizBridge';

/**
 * Tiny local question renderer used only while `@/quiz` is unavailable.
 * Fully supports mcq / truefalse / multi / numeric; other kinds degrade to a
 * "read the explanation" card so a lesson checkpoint never dead-ends.
 */
export function QuestionViewFallback({ question, onAnswer }: QuestionViewProps) {
  const [picked, setPicked] = useState<number[]>([]);
  const [numeric, setNumeric] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);

  const kind = question.kind;
  const supported = kind === 'mcq' || kind === 'truefalse' || kind === 'multi' || kind === 'numeric';

  const options = useMemo(() => {
    if (kind === 'mcq' || kind === 'multi') return question.options;
    if (kind === 'truefalse') return ['True', 'False'];
    return null;
  }, [question, kind]);

  const evaluate = (): boolean => {
    if (kind === 'mcq') return picked[0] === question.answer;
    if (kind === 'truefalse') return (picked[0] === 0) === question.answer;
    if (kind === 'multi') {
      const want = [...question.answers].sort();
      const got = [...picked].sort();
      return want.length === got.length && want.every((v, i) => v === got[i]);
    }
    if (kind === 'numeric') {
      const v = Number(numeric);
      if (Number.isNaN(v)) return false;
      return Math.abs(v - question.answer) <= (question.tolerance ?? 0);
    }
    return false;
  };

  const submit = () => {
    const correct = evaluate();
    setWasCorrect(correct);
    setSubmitted(true);
  };

  const pick = (i: number) => {
    if (submitted) return;
    if (kind === 'multi') {
      setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
    } else {
      setPicked([i]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-semibold text-slate-100">{question.prompt}</p>

      {!supported && (
        <p className="rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-sm text-slate-400">
          Interactive question type <code>{kind}</code> needs the full quiz module. Read the takeaway and continue.
        </p>
      )}

      {options && (
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => {
            const isPicked = picked.includes(i);
            const reveal = submitted;
            const correct =
              kind === 'mcq'
                ? i === (question as { answer: number }).answer
                : kind === 'multi'
                  ? (question as { answers: number[] }).answers.includes(i)
                  : kind === 'truefalse'
                    ? (i === 0) === (question as { answer: boolean }).answer
                    : false;
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={submitted}
                className={clsx(
                  'rounded-xl border px-4 py-2.5 text-left text-sm transition-colors',
                  reveal && correct && 'border-emerald-400/70 bg-emerald-400/10 text-emerald-200',
                  reveal && isPicked && !correct && 'border-rose-400/70 bg-rose-400/10 text-rose-200',
                  !reveal && isPicked && 'border-cyan-400/70 bg-cyan-400/10 text-cyan-100',
                  !reveal && !isPicked && 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500',
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {kind === 'numeric' && !submitted && (
        <input
          value={numeric}
          onChange={(e) => setNumeric(e.target.value)}
          inputMode="numeric"
          placeholder={question.unit ? `Answer in ${question.unit}` : 'Your answer'}
          className="w-48 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-cyan-400 focus:outline-none"
        />
      )}

      {submitted && (
        <div
          className={clsx(
            'rounded-xl border p-3 text-sm',
            wasCorrect ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/40 bg-rose-400/10 text-rose-200',
          )}
        >
          <div className="mb-1 font-bold">{wasCorrect ? 'Correct!' : 'Not quite.'}</div>
          <div className="text-slate-300">{question.explanation}</div>
          {question.page && <div className="mt-1 text-xs text-slate-500">Book page {question.page}</div>}
        </div>
      )}

      <div className="mt-1 flex justify-end">
        {!submitted && supported && (
          <Button size="sm" onClick={submit} disabled={kind === 'numeric' ? numeric.trim() === '' : picked.length === 0}>
            Answer
          </Button>
        )}
        {(submitted || !supported) && (
          <Button size="sm" variant="emerald" onClick={() => onAnswer(!supported ? true : wasCorrect)}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
