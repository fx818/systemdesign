import { useEffect, useRef, useState } from 'react';
import { ArchCanvas, type SimState } from '@/sim';
import type { ArchGraph } from '@/types/content';
import { todayKey, useGame } from '@/game';
import { allComponents, designCost, starterGraph } from '@/practice/config';
import { seedFrom } from '@/practice/puzzle';
import { createSurvival, SURVIVAL_BUDGET } from '@/practice/survival';
import { PracticePage, action, panel } from './shared';

export function SurvivalScreen() {
  const [graph, setGraph] = useState(starterGraph);
  const [phase, setPhase] = useState<'build' | 'live' | 'ended'>('build');
  const [state, setState] = useState<SimState | null>(null);
  const [message, setMessage] = useState('');
  const [wave, setWave] = useState(1);
  const [danger, setDanger] = useState(0);
  const [paused, setPaused] = useState(false);
  const [runSeed] = useState(() => seedFrom(`survival:${todayKey()}`));
  const engine = useRef<ReturnType<typeof createSurvival> | null>(null);
  const best = useGame(s => s.practice.survivalBest);
  useEffect(() => () => { if (engine.current) useGame.getState().finishSurvival(engine.current.state.t); }, []);
  useEffect(() => {
    if (phase !== 'live' || paused || !engine.current) return;
    let frame = 0; let previous = 0; let accumulator = 0;
    const run = engine.current;
    const tick = (now: number) => {
      if (previous) accumulator += Math.min(0.25, (now - previous) / 1000);
      previous = now;
      while (accumulator >= 0.1 && !run.ended) { run.step(0.1); accumulator -= 0.1; }
      setState(run.state); setWave(run.wave); setMessage(run.message); setDanger(run.redFor);
      if (run.ended) { useGame.getState().finishSurvival(run.state.t); setPhase('ended'); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, paused]);
  function change(next: ArchGraph) { if (designCost(next) > SURVIVAL_BUDGET) return; setGraph(next); engine.current?.setGraph(next); }
  return <PracticePage title="Survival" intro="Build within 4,500 credits. Traffic doubles every 30 seconds and a seeded failure hits each wave. Five consecutive seconds below 95% uptime or above 500ms p95 ends the run.">
    <div className={`${panel} flex flex-wrap justify-between gap-3 text-sm text-cyan-200`}><span>{Math.floor(state?.t ?? 0)}s survived · Wave {wave}</span><span>Personal best: {Math.floor(best)}s</span><span>{designCost(graph)} / {SURVIVAL_BUDGET} credits</span></div>
    <div className="flex flex-wrap gap-2">{phase === 'build' ? <button className={action} disabled={!graph.nodes.some(n => n.kind === 'web') || designCost(graph) > SURVIVAL_BUDGET} onClick={() => { engine.current = createSurvival(graph, runSeed); setPaused(false); setPhase('live'); }}>Start survival</button> : phase === 'live' ? <>
      <button className={action} onClick={() => setPaused(value => !value)}>{paused ? 'Resume survival' : 'Pause survival'}</button>
      <button className={action} onClick={() => { useGame.getState().finishSurvival(engine.current?.state.t ?? 0); setPhase('ended'); }}>End run & save</button>
    </> : <button className={action} onClick={() => { engine.current = null; setState(null); setWave(1); setDanger(0); setPhase('build'); }}>Try again</button>}</div>
    {state && <div role="status" className={panel}><p className={danger > 0 ? 'text-rose-300' : 'text-emerald-300'}>{message}</p><p className="mt-2 text-sm text-slate-300">{state.rps.toLocaleString()} req/s · {(state.recentUptime * 100).toFixed(1)}% recent uptime · {Math.round(state.p95)}ms p95 · danger {danger.toFixed(1)} / 5s</p></div>}
    {phase === 'ended' && <h2 className="text-xl font-bold text-amber-200">Run saved · {Math.floor(state?.t ?? 0)} seconds</h2>}
    <ArchCanvas graph={graph} state={state ?? undefined} editable={phase !== 'ended'} onChange={change} palette={allComponents.filter(k => !['client', 'mobile'].includes(k))} locked={['client']} budget={SURVIVAL_BUDGET} />
  </PracticePage>;
}
