import { LabAchievements } from '@/screens/practice/LabAchievements';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/game';
import type { LevelDef } from '@/types/content';
import { Button } from '@/components/ui';
import { LevelGate } from './common';
import { SimRunnerBridge, type SimRunResult } from './simBridge';

/** `/level/:id/lab` — sandbox: play with the concept and break things. */
export function LabScreen() {
  return (
    <LevelGate>
      {(level) => <Lab level={level} />}
    </LevelGate>
  );
}

function Lab({ level }: { level: LevelDef }) {
  const navigate = useNavigate();
  const completeStep = useGame((s) => s.completeStep);
  const addXp = useGame((s) => s.addXp);
  const [done, setDone] = useState(false);

  const finish = (_result: SimRunResult) => {
    if (done) return;
    setDone(true);
    completeStep(level.id, 'lab');
    addXp(30);
  };

  return (
    <div className="mx-auto w-full max-w-6xl pb-10">
      <header className="mb-4">
        <div className="text-xs font-bold tracking-[0.3em] text-emerald-300 uppercase">Lab</div>
        <h1 className="mt-1 text-2xl font-black text-slate-50">{level.title}: sandbox</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">{level.lab.intro}</p>
      </header>

      <LabAchievements><SimRunnerBridge config={level.lab.config} mode="lab" tasks={level.lab.tasks} onFinish={finish} /></LabAchievements>

      <div className="mt-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            finish({});
            navigate(`/level/${level.id}`);
          }}
        >
          {done ? 'Back to mission' : 'Mark explored & back'}
        </Button>
      </div>
    </div>
  );
}
