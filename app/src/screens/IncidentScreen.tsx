import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/game';
import { LevelGate } from './common';
import { Dialogue } from './Dialogue';

/** `/level/:id/incident` — the pager goes off. */
export function IncidentScreen() {
  return (
    <LevelGate>
      {(level) => <Incident levelId={level.id} lines={level.incident} title={level.title} />}
    </LevelGate>
  );
}

function Incident({ levelId, lines, title }: { levelId: string; lines: Parameters<typeof Dialogue>[0]['lines']; title: string }) {
  const navigate = useNavigate();
  const completeStep = useGame((s) => s.completeStep);
  const addXp = useGame((s) => s.addXp);

  const finish = useCallback(() => {
    completeStep(levelId, 'incident');
    addXp(10);
    navigate(`/level/${levelId}/lesson`);
  }, [completeStep, addXp, navigate, levelId]);

  return (
    <div className="mx-auto w-full max-w-2xl pb-10">
      <header className="mb-4">
        <div className="text-xs font-bold tracking-[0.3em] text-rose-400 uppercase">Incoming incident</div>
        <h1 className="mt-1 text-2xl font-black text-slate-50">{title}</h1>
      </header>
      <Dialogue lines={lines} onDone={finish} />
    </div>
  );
}
