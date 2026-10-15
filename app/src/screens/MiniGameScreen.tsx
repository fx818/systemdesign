import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '@/game';
import type { LevelDef, MiniGameDef } from '@/types/content';
import { Button, Card, ProgressBar } from '@/components/ui';
import { LevelGate } from './common';

/** `/level/:id/minigame/:mg` — plays a bespoke mini-game from the level data. */
export function MiniGameScreen() {
  return (
    <LevelGate>
      {(level) => <MiniGame level={level} />}
    </LevelGate>
  );
}

function MiniGame({ level }: { level: LevelDef }) {
  const { mg } = useParams<{ mg: string }>();
  const navigate = useNavigate();
  const completeStep = useGame((s) => s.completeStep);
  const addXp = useGame((s) => s.addXp);
  const [score, setScore] = useState<number | null>(null);

  const def: MiniGameDef | undefined = level.miniGames.find((m) => m.id === mg) ?? level.miniGames[0];

  if (!def) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <Card>
          <p className="text-slate-400">This level ships no mini-game.</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => navigate(`/level/${level.id}`)}>
            Back
          </Button>
        </Card>
      </div>
    );
  }

  const finish = (s: number) => {
    const clamped = Math.max(0, Math.min(1, s));
    completeStep(level.id, 'minigame');
    addXp(Math.round(clamped * 50));
    setScore(clamped);
  };

  return (
    <div className="mx-auto w-full max-w-4xl pb-10">
      <header className="mb-4">
        <div className="text-xs font-bold tracking-[0.3em] text-violet-300 uppercase">Mini-game</div>
        <h1 className="mt-1 text-2xl font-black text-slate-50">{def.title}</h1>
        <p className="mt-1 text-sm text-slate-400">{def.intro}</p>
      </header>

      {score === null ? (
        <def.Component onComplete={finish} />
      ) : (
        <Card accent="violet" className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <div className="text-5xl font-black text-violet-300 tabular-nums">{Math.round(score * 100)}%</div>
          <ProgressBar value={score} color="violet" className="w-full" />
          <p className="text-sm text-slate-400">
            {score >= 0.8 ? 'Crushed it.' : score >= 0.5 ? 'Good run — the mission will be easier now.' : 'Rough one. The briefing has your back.'}
          </p>
          <Button variant="violet" onClick={() => navigate(`/level/${level.id}`)}>
            Back to mission
          </Button>
        </Card>
      )}
    </div>
  );
}
