import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/game';
import { LessonPlayer } from '@/player';
import type { LevelDef } from '@/types/content';
import { Button } from '@/components/ui';
import { LevelGate } from './common';

/** `/level/:id/lesson` — the animated briefing. */
export function LessonScreen() {
  return (
    <LevelGate>
      {(level) => <Lesson level={level} />}
    </LevelGate>
  );
}

function Lesson({ level }: { level: LevelDef }) {
  const navigate = useNavigate();
  const completeStep = useGame((s) => s.completeStep);
  const addXp = useGame((s) => s.addXp);
  const awardedRef = useRef(false);

  const onComplete = useCallback(() => {
    if (awardedRef.current) return;
    awardedRef.current = true;
    completeStep(level.id, 'lesson');
    addXp(20);
  }, [completeStep, addXp, level.id]);

  return (
    <div className="mx-auto w-full max-w-5xl pb-10">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold tracking-[0.3em] text-cyan-300 uppercase">Briefing</div>
          <h1 className="mt-1 text-2xl font-black text-slate-50">{level.title}</h1>
        </div>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/level/${level.id}`)}>
          Back to mission
        </Button>
      </header>
      <LessonPlayer lesson={level.lesson} onComplete={onComplete} />
      <div className="mt-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => navigate(`/level/${level.id}/lab`)}>
          Continue to the lab
        </Button>
      </div>
    </div>
  );
}
