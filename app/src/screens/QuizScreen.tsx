import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/game';
import { QuestionViewFallback, useQuizModule, type QuizResult } from '@/player';
import type { QuizQuestion } from '@/types/content';
import { Button, Card, ProgressBar } from '@/components/ui';
import { Avatar } from './characters';
import { LevelGate } from './common';

/** Minimal local QuizRunner used only while `@/quiz` has not landed. */
function QuizRunnerFallback({
  questions,
  onFinish,
}: {
  questions: QuizQuestion[];
  onFinish: (r: QuizResult) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const q = questions[idx];

  if (!q) return null;
  return (
    <Card accent="cyan">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          Question {idx + 1} / {questions.length}
        </span>
        <span className="font-mono">{q.kind}</span>
      </div>
      <ProgressBar value={idx / questions.length} color="cyan" className="mb-4" />
      <QuestionViewFallback
        question={q}
        onAnswer={(ok) => {
          const nextCorrect = correct + (ok ? 1 : 0);
          if (idx + 1 >= questions.length) {
            onFinish({ correct: nextCorrect, total: questions.length, xp: nextCorrect * 10 });
          } else {
            setCorrect(nextCorrect);
            setIdx(idx + 1);
          }
        }}
      />
    </Card>
  );
}

/** `/level/:id/quiz` — Ravi's interview round. */
export function QuizScreen() {
  return (
    <LevelGate>
      {(level) => <Quiz levelId={level.id} questions={level.quiz} />}
    </LevelGate>
  );
}

function Quiz({ levelId, questions }: { levelId: string; questions: QuizQuestion[] }) {
  const navigate = useNavigate();
  const quiz = useQuizModule();
  const completeStep = useGame((s) => s.completeStep);
  const recordQuizResult = useGame((s) => s.recordQuizResult);
  const addXp = useGame((s) => s.addXp);
  const [result, setResult] = useState<QuizResult | null>(null);

  const finish = (r: QuizResult) => {
    recordQuizResult(levelId, r.total > 0 ? r.correct / r.total : 0);
    addXp(r.xp);
    completeStep(levelId, 'quiz');
    setResult(r);
  };

  return (
    <div className="mx-auto w-full max-w-2xl pb-10">
      <header className="mb-5 flex items-center gap-4">
        <Avatar who="ravi" mood="proud" size={52} />
        <div>
          <div className="text-xs font-bold tracking-[0.3em] text-cyan-300 uppercase">Interview round</div>
          <h1 className="text-2xl font-black text-slate-50">Ravi is watching. Think before you answer.</h1>
        </div>
      </header>

      {result ? (
        <Card accent="emerald" className="flex flex-col items-center gap-4 text-center">
          <div className="text-5xl font-black text-emerald-300 tabular-nums">
            {result.correct}/{result.total}
          </div>
          <p className="text-sm text-slate-400">
            {result.correct === result.total
              ? 'Flawless. Ravi is impressed.'
              : result.correct >= result.total / 2
                ? 'Solid. Ravi nods approvingly.'
                : 'Ravi suggests rewatching the briefing.'}
          </p>
          <div className="rounded-xl bg-amber-400/10 px-4 py-2 font-bold text-amber-300">+{result.xp} XP</div>
          <Button variant="emerald" onClick={() => navigate(`/level/${levelId}/debrief`)}>
            Continue to debrief
          </Button>
        </Card>
      ) : quiz === undefined ? (
        <Card className="flex items-center justify-center py-16 text-slate-500">Loading interview&hellip;</Card>
      ) : quiz ? (
        <quiz.QuizRunner questions={questions} onFinish={finish} />
      ) : (
        <QuizRunnerFallback questions={questions} onFinish={finish} />
      )}
    </div>
  );
}
