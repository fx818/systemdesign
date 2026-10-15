import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/game';
import type { LevelDef } from '@/types/content';
import { Button, Card, Modal } from '@/components/ui';
import { LevelGate } from './common';
import { Dialogue } from './Dialogue';
import { SimRunnerBridge, type SimRunResult } from './simBridge';

const HINT_COST_XP = 10;

/** `/level/:id/mission` — fix the live system while traffic runs. */
export function MissionScreen() {
  return (
    <LevelGate>
      {(level) => <Mission level={level} />}
    </LevelGate>
  );
}

function Mission({ level }: { level: LevelDef }) {
  const navigate = useNavigate();
  const completeStep = useGame((s) => s.completeStep);
  const recordMissionResult = useGame((s) => s.recordMissionResult);
  const addXp = useGame((s) => s.addXp);
  const resetLives = useGame((s) => s.resetLives);
  const loseLife = useGame((s) => s.loseLife);
  const setCredits = useGame((s) => s.setCredits);
  const useHint = useGame((s) => s.useHint);
  const lives = useGame((s) => s.lives);
  const hintsUsed = useGame((s) => s.hintsUsed[level.id] ?? 0);

  const [briefed, setBriefed] = useState(level.mission.brief.length === 0);
  const [result, setResult] = useState<SimRunResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const finishedRef = useRef(false);
  useEffect(() => {
    resetLives();
    setCredits(level.mission.config.budget);
  }, [resetLives, setCredits, level.mission.config.budget]);

  const finish = useCallback(
    (r: SimRunResult) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      recordMissionResult(level.id, {
        goalsMet: r.goalsMet ?? false,
        withinBudget: r.withinBudget ?? false,
      });
      if (r.goalsMet) completeStep(level.id, 'mission');
      addXp(r.xp ?? (r.goalsMet ? 100 : 0));
      if (typeof r.cost === 'number') setCredits(level.mission.config.budget - r.cost);
      setResult(r);
    },
    [recordMissionResult, completeStep, addXp, level.id, level.mission.config.budget, setCredits],
  );

  const startMission = () => {
    resetLives();
    setBriefed(true);
  };

  const takeHint = () => {
    useHint(level.id);
    addXp(-HINT_COST_XP);
  };

  return (
    <div className="mx-auto w-full max-w-6xl pb-10">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold tracking-[0.3em] text-rose-400 uppercase">Mission</div>
          <h1 className="mt-1 text-2xl font-black text-slate-50">{level.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm text-slate-300">
            Lives: <span className="font-bold text-rose-300">{'♥'.repeat(lives) || '0'}</span>
          </span>
          <Button size="sm" variant="outline" onClick={() => setShowHints(true)} disabled={level.mission.hints.length === 0}>
            Ravi's hints ({level.mission.hints.length})
          </Button>
        </div>
      </header>

      {!briefed ? (
        <Card>
          <Dialogue lines={level.mission.brief} onDone={startMission} />
        </Card>
      ) : (
        <SimRunnerBridge
          config={level.mission.config}
          mode="mission"
          onFinish={finish}
          hints={level.mission.hints}
          onHint={takeHint}
          hintsUsed={hintsUsed}
          onLifeLost={loseLife}
          onRetry={() => {
            resetLives();
            setCredits(level.mission.config.budget);
            finishedRef.current = false;
            setResult(null);
          }}
        />
      )}

      {/* mission result */}
      <Modal open={result !== null} onClose={() => navigate(`/level/${level.id}`)}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-4xl">{result?.goalsMet === false ? '💥' : '🎉'}</div>
          <h2 className="text-xl font-black text-slate-50">
            {result?.goalsMet === false ? 'The system buckled' : 'System stable!'}
          </h2>
          <p className="text-sm text-slate-400">
            {result?.goalsMet === false
              ? 'The goals were not met — but every outage teaches something. Try again, then head to the interview.'
              : 'Goals met. Head to the interview round while Ravi is still smiling.'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/level/${level.id}`)}>
              Mission hub
            </Button>
            <Button variant="emerald" onClick={() => navigate(`/level/${level.id}/quiz`)}>
              Interview round
            </Button>
          </div>
        </div>
      </Modal>

      {/* hints drawer */}
      <Modal open={showHints} onClose={() => setShowHints(false)} widthClass="max-w-lg">
        <h2 className="mb-1 text-lg font-bold text-cyan-300">Ravi's hints</h2>
        <p className="mb-4 text-xs text-slate-500">
          Each hint costs {HINT_COST_XP} XP and forfeits the third star. Used so far: {hintsUsed}.
        </p>
        <ol className="flex flex-col gap-2">
          {level.mission.hints.map((hint, i) => {
            const unlockedHint = i < hintsUsed;
            const next = i === hintsUsed;
            return (
              <li key={i} className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-sm">
                {unlockedHint ? (
                  <span className="text-slate-200">{hint}</span>
                ) : next ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      takeHint();
                    }}
                  >
                    Unlock hint {i + 1} (-{HINT_COST_XP} XP)
                  </Button>
                ) : (
                  <span className="text-slate-600">Hint {i + 1} — unlock the previous one first</span>
                )}
              </li>
            );
          })}
        </ol>
      </Modal>
    </div>
  );
}
