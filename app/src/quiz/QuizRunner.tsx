/**
 * QuizRunner — the "interview round" frame around QuestionView:
 * Ravi the interviewer (avatar + speech bubble), progress dots, hearts (3),
 * combo flame (3 in a row = ×1.5 XP, 5 = ×2), per-question XP (default 10),
 * and an end screen with score, accuracy, max combo and a review of wrong
 * answers. Out of hearts you can still finish, but 3 stars are off the table.
 */
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Heart, Trophy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button, Card } from '@/components/ui';
import type { QuizQuestion } from '@/types/content';
import { describeCorrect } from './grade';
import { QuestionView } from './QuestionView';
import { raviLine } from './speech';
import { QUESTION_KIND_LABEL } from './kinds';
import {
  DEFAULT_QUESTION_XP,
  comboMultiplier,
  type PerQuestionResult,
  type QuizResult,
} from './types';

export interface QuizRunnerProps {
  questions: QuizQuestion[];
  onFinish: (result: QuizResult) => void;
}

function RaviBubble({ line }: { line: string }) {
  return (
    <div className="flex items-start gap-3" data-testid="ravi-bubble">
      <div
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-cyan-400/70 bg-cyan-400/20 text-lg font-black text-cyan-300"
      >
        R
      </div>
      <div className="relative flex-1 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3">
        <span
          aria-hidden="true"
          className="absolute top-4 -left-1.5 h-3 w-3 rotate-45 border-t border-l border-cyan-400/30 bg-[#0c2a33]"
        />
        <p className="text-sm font-semibold text-cyan-100">
          Ravi: <span className="font-normal text-slate-200">{line}</span>
        </p>
      </div>
    </div>
  );
}

function Hearts({ left }: { left: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${left} of 3 hearts left`} data-testid="hearts">
      {[0, 1, 2].map((i) => (
        <motion.div key={`${i}-${left}`} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Heart
            size={18}
            className={i < left ? 'fill-rose-400 text-rose-400' : 'text-slate-700'}
            aria-hidden="true"
          />
        </motion.div>
      ))}
    </div>
  );
}

function ComboFlame({ streak }: { streak: number }) {
  const mult = comboMultiplier(streak);
  if (streak < 2) return null;
  const hot = streak >= 3;
  return (
    <motion.div
      key={streak}
      initial={{ scale: 0.6 }}
      animate={{ scale: 1 }}
      className={clsx(
        'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-black',
        streak >= 5
          ? 'border-amber-300 bg-amber-400/20 text-amber-200'
          : hot
            ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
            : 'border-slate-700 bg-slate-900/60 text-slate-400',
      )}
      data-testid="combo"
    >
      <Flame size={13} className={hot ? 'fill-amber-400/40' : undefined} aria-hidden="true" />
      <span className="tabular-nums">
        {streak} in a row{hot ? ` ×${mult}` : ''}
      </span>
    </motion.div>
  );
}

export function QuizRunner({ questions, onFinish }: QuizRunnerProps) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<PerQuestionResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const [ended, setEnded] = useState(false);
  const pendingRef = useRef<{ correct: boolean; xp: number } | null>(null);
  const emptyHandledRef = useRef(false);
  const finishedRef = useRef(false);

  // Degenerate but handled: an empty interview finishes immediately.
  useEffect(() => {
    if (questions.length === 0 && !emptyHandledRef.current) {
      emptyHandledRef.current = true;
      onFinish({ correct: 0, total: 0, xp: 0, perQuestion: [], heartsLeft: 3, maxCombo: 0, accuracy: 0 });
    }
  }, [questions.length, onFinish]);

  const q = questions[idx];

  const handleSubmit = (correct: boolean) => {
    const nextStreak = correct ? streak + 1 : 0;
    const mult = comboMultiplier(nextStreak);
    const xp = correct ? Math.round((q.xp ?? DEFAULT_QUESTION_XP) * mult) : 0;
    setStreak(nextStreak);
    setMaxCombo((m) => Math.max(m, nextStreak));
    if (!correct) setHearts((h) => Math.max(0, h - 1));
    pendingRef.current = { correct, xp };
    setLastResult(correct);
  };

  const handleAnswer = (correct: boolean) => {
    const pending = pendingRef.current ?? { correct, xp: 0 };
    pendingRef.current = null;
    const entry: PerQuestionResult = {
      id: q.id,
      kind: q.kind,
      prompt: q.prompt,
      correct,
      xp: pending.xp,
      explanation: q.explanation,
      correctLine: describeCorrect(q),
      page: q.page,
    };
    setResults((r) => [...r, entry]);
    if (idx + 1 >= questions.length) {
      setEnded(true);
    } else {
      setIdx(idx + 1);
      setLastResult(null);
    }
  };

  if (questions.length === 0) return null;

  if (ended) {
    const correctCount = results.filter((r) => r.correct).length;
    const xp = results.reduce((sum, r) => sum + r.xp, 0);
    const accuracy = questions.length ? correctCount / questions.length : 0;
    const wrong = results.filter((r) => !r.correct);

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish({
        correct: correctCount,
        total: questions.length,
        xp,
        perQuestion: results,
        heartsLeft: hearts,
        maxCombo,
        accuracy,
      });
    };

    return (
      <Card accent="emerald" className="flex flex-col gap-4" data-testid="quiz-end">
        <div className="flex flex-col items-center gap-1 text-center">
          <Trophy size={34} className="text-amber-300" aria-hidden="true" />
          <div className="text-4xl font-black text-emerald-300 tabular-nums" data-testid="end-score">
            {correctCount}/{questions.length}
          </div>
          <p className="text-sm text-slate-400">
            {correctCount === questions.length
              ? 'Flawless. Ravi is impressed.'
              : correctCount >= questions.length / 2
                ? 'Solid. Ravi nods approvingly.'
                : 'Ravi suggests rewatching the briefing.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center" data-testid="end-stats">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2">
            <div className="text-lg font-black text-cyan-300 tabular-nums">{Math.round(accuracy * 100)}%</div>
            <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Accuracy</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2">
            <div className="text-lg font-black text-amber-300 tabular-nums">+{xp}</div>
            <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">XP earned</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2">
            <div className="flex items-center justify-center gap-1 text-lg font-black text-rose-300 tabular-nums">
              <Flame size={16} aria-hidden="true" /> {maxCombo}
            </div>
            <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Max combo</div>
          </div>
        </div>

        {hearts === 0 && (
          <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-center text-xs font-bold text-amber-300">
            Hearts ran out — 3 stars are off the table this round.
          </p>
        )}

        {wrong.length > 0 && (
          <div className="flex flex-col gap-2.5" data-testid="wrong-review">
            <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase">
              Review — questions you missed
            </h3>
            {wrong.map((r) => (
              <div key={r.id} className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full border border-rose-400/40 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-rose-300 uppercase">
                    {QUESTION_KIND_LABEL[r.kind]}
                  </span>
                  {r.page != null && (
                    <span className="ml-auto text-[10px] font-bold text-slate-500">Book p. {r.page}</span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-200">{r.prompt}</p>
                {r.correctLine && (
                  <p className="mt-1 text-xs font-semibold text-emerald-300">Correct: {r.correctLine}</p>
                )}
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{r.explanation}</p>
              </div>
            ))}
          </div>
        )}

        <Button variant="emerald" size="lg" onClick={finish} data-testid="finish" className="mx-auto">
          Finish interview
        </Button>
      </Card>
    );
  }

  const earnedXp = results.reduce((sum, r) => sum + r.xp, 0);

  return (
    <Card accent="cyan" className="flex flex-col gap-4" data-testid="quiz-runner">
      <RaviBubble
        line={raviLine(q.id, lastResult == null ? 'asking' : lastResult ? 'correct' : 'wrong')}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5" data-testid="progress-dots" aria-label="Question progress">
          {questions.map((question, i) => {
            const r = results[i];
            return (
              <span
                key={question.id}
                title={`Question ${i + 1}`}
                className={clsx(
                  'h-2.5 rounded-full transition-all',
                  i === idx
                    ? 'w-6 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]'
                    : 'w-2.5',
                  i < idx && (r?.correct ? 'bg-emerald-400' : 'bg-rose-400'),
                  i > idx && 'bg-slate-700',
                )}
              />
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-bold text-amber-300 tabular-nums">+{earnedXp} XP</span>
          <ComboFlame streak={streak} />
          <Hearts left={hearts} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          <QuestionView
            question={q}
            onSubmit={handleSubmit}
            onAnswer={handleAnswer}
            xpEarned={pendingRef.current?.xp}
          />
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}
