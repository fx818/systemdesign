/**
 * QuestionView — renders ANY QuizQuestion kind from the shared contract
 * (mcq, multi, order, truefalse, bins, numeric, spot, label), collects the
 * answer, grades it, animates feedback (glow / shake + explanation + book
 * page) and finishes with Continue. Keyboard: 1..9 pick options, Enter submits
 * and continues. `onAnswer(correct)` fires on Continue (so feedback is always
 * seen); `onSubmit(correct)` fires the moment the answer is checked (optional —
 * used by QuizRunner for hearts/combo).
 */
import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import type { QuizQuestion } from '@/types/content';
import { Button } from '@/components/ui';
import { BinsAnswer } from './parts/BinsAnswer';
import { LabelAnswer } from './parts/LabelAnswer';
import { McqAnswer } from './parts/McqAnswer';
import { MultiAnswer } from './parts/MultiAnswer';
import { NumericAnswer } from './parts/NumericAnswer';
import { OrderAnswer } from './parts/OrderAnswer';
import { SpotAnswer } from './parts/SpotAnswer';
import { TrueFalseAnswer } from './parts/TrueFalseAnswer';
import { describeCorrect, grade, isComplete } from './grade';
import { initialResponse } from './respond';
import { QUESTION_KIND_BADGE, QUESTION_KIND_LABEL } from './kinds';
import { Feedback } from './Feedback';
import type { QuizResponse } from './types';

export interface QuestionViewProps {
  question: QuizQuestion;
  /** fires when the player finishes the question (Continue) */
  onAnswer: (correct: boolean) => void;
  /** optional: fires as soon as the answer is checked, before feedback */
  onSubmit?: (correct: boolean) => void;
  /** XP earned for this question — shown in the feedback panel */
  xpEarned?: number;
}

export function QuestionView({ question, onAnswer, onSubmit, xpEarned }: QuestionViewProps) {
  const [response, setResponse] = useState<QuizResponse | null>(() => initialResponse(question));
  const [phase, setPhase] = useState<'answering' | 'feedback'>('answering');
  const [correct, setCorrect] = useState(false);
  const submittedRef = useRef(false);
  const continuedRef = useRef(false);

  // Reset if the caller swaps the question in place (runner keys by id anyway).
  useEffect(() => {
    setResponse(initialResponse(question));
    setPhase('answering');
    setCorrect(false);
    submittedRef.current = false;
    continuedRef.current = false;
  }, [question]);

  const submit = () => {
    if (submittedRef.current || !isComplete(question, response)) return;
    submittedRef.current = true;
    const ok = grade(question, response);
    setCorrect(ok);
    setPhase('feedback');
    onSubmit?.(ok);
  };

  const advance = () => {
    if (continuedRef.current) return;
    continuedRef.current = true;
    onAnswer(correct);
  };

  // Enter = submit (when complete) or continue (in feedback). Ref guards make
  // this safe alongside native button clicks.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      // Let a focused button handle its own Enter (refs already dedupe).
      if (target?.tagName === 'BUTTON') return;
      e.preventDefault();
      if (!submittedRef.current) {
        if (!isComplete(question, response)) return;
        submittedRef.current = true;
        const ok = grade(question, response);
        setCorrect(ok);
        setPhase('feedback');
        onSubmit?.(ok);
      } else if (!continuedRef.current) {
        continuedRef.current = true;
        onAnswer(correct);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [question, response, correct, onSubmit, onAnswer]);

  const complete = isComplete(question, response);
  const locked = phase === 'feedback';
  const answered = locked; // parts lock once checked

  const body = () => {
    switch (question.kind) {
      case 'mcq':
        return (
          <McqAnswer
            question={question}
            value={response?.kind === 'mcq' ? response : null}
            onChange={setResponse}
            locked={answered}
          />
        );
      case 'multi':
        return (
          <MultiAnswer
            question={question}
            value={response?.kind === 'multi' ? response : null}
            onChange={setResponse}
            locked={answered}
          />
        );
      case 'order':
        return (
          <OrderAnswer
            question={question}
            value={response?.kind === 'order' ? response : null}
            onChange={setResponse}
            locked={answered}
          />
        );
      case 'truefalse':
        return (
          <TrueFalseAnswer
            question={question}
            value={response?.kind === 'truefalse' ? response : null}
            onChange={setResponse}
            locked={answered}
          />
        );
      case 'bins':
        return (
          <BinsAnswer
            question={question}
            value={response?.kind === 'bins' ? response : null}
            onChange={setResponse}
            locked={answered}
          />
        );
      case 'numeric':
        return (
          <NumericAnswer
            question={question}
            value={response?.kind === 'numeric' ? response : null}
            onChange={setResponse}
            locked={answered}
          />
        );
      case 'spot':
        return (
          <SpotAnswer
            question={question}
            value={response?.kind === 'spot' ? response : null}
            onChange={setResponse}
            locked={answered}
          />
        );
      case 'label':
        return (
          <LabelAnswer
            question={question}
            value={response?.kind === 'label' ? response : null}
            onChange={setResponse}
            locked={answered}
          />
        );
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={clsx(
            'rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase',
            QUESTION_KIND_BADGE[question.kind],
          )}
        >
          {QUESTION_KIND_LABEL[question.kind]}
        </span>
        <span className="ml-auto text-[11px] font-bold text-amber-300/70 tabular-nums">
          {question.xp ?? 10} XP
        </span>
      </div>

      <h3 className="mb-4 text-base leading-snug font-bold text-slate-100 sm:text-lg" data-testid="question-prompt">
        {question.prompt}
      </h3>

      {body()}

      {!locked && (
        <div className="mt-4 flex justify-end">
          <Button onClick={submit} disabled={!complete} data-testid="submit">
            Check answer
          </Button>
        </div>
      )}

      {locked && (
        <Feedback
          correct={correct}
          explanation={question.explanation}
          page={question.page}
          correctLine={correct ? undefined : describeCorrect(question)}
          xpEarned={xpEarned}
          onContinue={advance}
        />
      )}
    </div>
  );
}
