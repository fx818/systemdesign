import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Activity, CircleHelp, Heart, Pause, Play, Radio, RotateCcw, ShieldCheck, Star, Zap } from 'lucide-react';
import type { ArchGraph, Knob, SimConfig, SimEvent } from '@/types/content';
import { Character } from '@/scenekit';
import { ArchCanvas } from './ArchCanvas';
import { COMPONENTS } from './components';
import { createSim, initialKnobs, type Sim } from './engine';
import { goalMeters, missionResult, type GoalMeter } from './mission';
import type { KnobValues, SimResult } from './types';

export interface SimRunnerProps {
  config: SimConfig;
  mode: 'lab' | 'mission';
  onFinish: (result: SimResult) => void;
  tasks?: string[];
  hints?: string[];
  hintsUsed?: number;
  /** The shell owns XP and persistence. This callback charges for a hint. */
  onHint?: () => void;
  onLifeLost?: () => void;
  onRetry?: () => void;
}
const action = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-100 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40';
const primary = `${action} border-cyan-400/40 bg-cyan-400/15 text-cyan-200 hover:bg-cyan-400/25`;
const number = (value: number, digits = 0) => value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });

function Meter({ meter }: { meter: GoalMeter }) {
  const percent = meter.unit === '%' ? meter.value : meter.value / Math.max(1, meter.target ?? meter.value * 1.5) * 80;
  const target = meter.target === undefined ? undefined : meter.unit === '%' ? meter.target : 80;
  return <div className={`rounded-2xl border p-3 transition-colors ${meter.failed ? 'border-rose-400/40 bg-rose-950/30' : 'border-slate-800 bg-slate-900/70'}`}>
    <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{meter.label}</div>
    <div className={`mt-1 font-mono text-xl font-bold ${meter.failed ? 'text-rose-300' : 'text-slate-100'}`}>{number(meter.value, meter.unit === '%' ? 1 : 0)}<span className="ml-1 text-[10px] text-slate-500">{meter.unit}</span></div>
    <div className="relative mt-3 h-1.5 rounded-full bg-slate-800" role="meter" aria-label={meter.label} aria-valuenow={meter.value} aria-valuemin={0} aria-valuemax={Math.max(100, meter.value, meter.target ?? 0)}>
      <div className={`h-full rounded-full transition-[width] duration-200 ${meter.failed ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      {target !== undefined && <span className="absolute -top-1 h-3.5 w-px bg-amber-200" style={{ left: `${Math.min(99, target)}%` }} />}
    </div>
    <div className={`mt-2 text-[10px] ${meter.failed ? 'text-rose-300' : 'text-slate-500'}`}>{meter.target === undefined ? 'Observe & experiment' : `Goal ${meter.minimum ? '≥' : '≤'} ${number(meter.target, meter.unit === '%' ? 1 : 0)} ${meter.unit}`}</div>
  </div>;
}
function KnobControl({ knob, value, onChange }: { knob: Knob; value: number | boolean | string; onChange: (value: number | boolean | string) => void }) {
  const inputId = `sim-knob-${knob.id}`;
  return <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
    <div className="mb-2 flex items-center justify-between gap-2"><label htmlFor={inputId} className="text-xs font-semibold text-slate-300">{knob.label}</label><span className="font-mono text-xs text-cyan-300">{typeof value === 'number' ? number(value) : typeof value === 'boolean' ? value ? 'ON' : 'OFF' : value}</span></div>
    {knob.type === 'slider' && <input id={inputId} type="range" className="w-full cursor-pointer accent-cyan-300" min={knob.min ?? 0} max={knob.max ?? 100} step={knob.step ?? 1} value={Number(value)} onChange={e => onChange(Number(e.target.value))} />}
    {knob.type === 'toggle' && <input id={inputId} type="checkbox" role="switch" className="h-5 w-5 cursor-pointer accent-cyan-300" checked={Boolean(value)} onChange={e => onChange(e.target.checked)} />}
    {knob.type === 'select' && <select id={inputId} className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-slate-100" value={String(value)} onChange={e => onChange(e.target.value)}>{knob.options?.map(option => <option key={option}>{option}</option>)}</select>}
  </div>;
}
function eventText(event: SimEvent): string {
  if (event.type === 'message') return event.text;
  if ('label' in event && event.label) return event.label;
  switch (event.type) {
    case 'traffic': return `Traffic is now ${number(event.rps)} requests/s`;
    case 'kill': return `${event.target} went offline`;
    case 'revive': return `${event.target} recovered`;
    case 'region-down': return `${event.region} is offline · GeoDNS failover`;
    case 'jobs': return `${event.perSec} photo jobs arriving every second`;
    case 'hotkey': return `Celebrity post · ${Math.round(event.share * 100)}% of reads hit one key`;
  }
}

/** Config changes remount the run so no previous level's timeline leaks through. */
export function SimRunner(props: SimRunnerProps) {
  return <Run key={`${props.mode}:${JSON.stringify(props.config)}`} {...props} />;
}
function Run({ config, mode, onFinish, tasks = [], hints = [], hintsUsed = 0, onHint, onLifeLost, onRetry }: SimRunnerProps) {
  const lab = mode === 'lab';
  const [graph, setGraph] = useState<ArchGraph>(() => ({ nodes: config.start.nodes.map(n => ({ ...n })), edges: config.start.edges.map(e => ({ ...e })) }));
  const [knobs, setKnobs] = useState<KnobValues>(() => initialKnobs(config));
  const [initialSim] = useState(() => createSim(config, graph, knobs));
  const engine = useRef<Sim>(initialSim);
  const [state, setState] = useState(initialSim.state);
  const [phase, setPhase] = useState<'build' | 'live' | 'result'>(lab ? 'live' : 'build');
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState(0);
  const [lives, setLives] = useState(3);
  const [result, setResult] = useState<SimResult | null>(null);
  const [banner, setBanner] = useState<{ text: string; at: number; who?: 'maya' | 'ravi' | 'pager' | 'player' | 'narrator' } | null>(null);
  const [history, setHistory] = useState<{ t: number; queue: number; uptime: number }[]>([]);
  const [localHints, setLocalHints] = useState(0);
  const [hint, setHint] = useState('');
  const [checkedTasks, setCheckedTasks] = useState<string[]>([]);
  const [showChaos, setShowChaos] = useState(false);
  const runtime = useRef({ lives: 3, redFor: 0, tick: 0, finished: false, claimed: false, outage: false });
  const callbacks = useRef({ onFinish, onLifeLost, hintsUsed, localHints });
  const reduceMotion = useReducedMotion();
  useEffect(() => { callbacks.current = { onFinish, onLifeLost, hintsUsed, localHints }; }, [onFinish, onLifeLost, hintsUsed, localHints]);

  useEffect(() => {
    if (phase !== 'live' || paused) return;
    let frame = 0;
    let previous: number | undefined;
    let accumulator = 0;
    const loop = (now: number) => {
      const elapsed = previous === undefined ? 0 : Math.min(0.1, (now - previous) / 1000) * speed;
      previous = now;
      accumulator += elapsed;
      const sim = engine.current!;
      while (accumulator >= 0.1 && !runtime.current.finished) {
        const dt = lab ? 0.1 : Math.min(0.1, Math.max(0, config.goals.durationSec - sim.time));
        const next = sim.step(dt);
        accumulator -= 0.1;
        const fired = sim.drainEvents();
        const latest = fired.findLast(e => e.type === 'message') ?? fired.at(-1);
        if (latest) setBanner({ text: eventText(latest), at: next.t, who: latest.type === 'message' ? latest.who : latest.type === 'kill' || latest.type === 'region-down' ? 'pager' : undefined });
        const outage = next.rps > 0 && next.recentUptime < 0.9;
        if (runtime.current.outage && !outage) setBanner({ text: 'Recovered! Traffic is flowing again.', at: next.t, who: 'ravi' });
        runtime.current.outage = outage;
        if (!lab) {
          const red = goalMeters(next, config, true).some(m => m.failed) || next.dataLoss;
          runtime.current.redFor = red ? runtime.current.redFor + dt : 0;
          if (runtime.current.redFor >= 3 - 1e-8) {
            runtime.current.redFor = 0;
            runtime.current.lives = Math.max(0, runtime.current.lives - 1);
            setLives(runtime.current.lives);
            callbacks.current.onLifeLost?.();
            setBanner({ text: 'SLO breached for 3 seconds. One life lost — recover the system!', at: next.t, who: 'pager' });
          }
        }
        runtime.current.tick++;
        if (runtime.current.tick % 10 === 0) setHistory(old => [...old.slice(-59), { t: next.t, queue: next.queueLength, uptime: next.recentUptime }]);
        setState(next);
        if (!lab && (sim.time >= config.goals.durationSec - 1e-8 || runtime.current.lives === 0)) {
          const completed = missionResult(next, config, runtime.current.lives, Math.max(callbacks.current.hintsUsed, callbacks.current.localHints));
          runtime.current.finished = true;
          setResult(completed); setPhase('result');
          break;
        }
      }
      setTime(sim.time + accumulator);
      if (!runtime.current.finished) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [phase, paused, speed, lab, config]);

  function changeGraph(next: ArchGraph) {
    engine.current!.setGraph(next); setGraph(next); setState(engine.current!.state);
  }
  function changeKnob(id: Knob['id'], value: number | boolean | string) {
    const next = { ...knobs, [id]: value };
    // Build controls enforce the same total cost as the component palette.
    if (phase === 'build') {
      const preview = createSim(config, graph, next).state;
      if (preview.cost > config.budget && preview.cost > state.cost) { setBanner({ text: 'That pool size exceeds the cloud-credit budget.', at: state.t, who: 'ravi' }); return; }
    }
    engine.current!.setKnobs(next); setKnobs(next); setState(engine.current!.state);
  }
  function chaos(event: SimEvent) {
    engine.current!.apply(event); setState(engine.current!.state);
    setBanner({ text: eventText(event), at: engine.current!.time, who: 'pager' });
  }
  function retry() {
    engine.current = createSim(config, graph, knobs);
    runtime.current = { lives: 3, redFor: 0, tick: 0, finished: false, claimed: false, outage: false };
    setState(engine.current.state); setPhase(lab ? 'live' : 'build'); setResult(null); setLives(3); setTime(0); setHistory([]); setBanner(null); setPaused(false);
    onRetry?.();
  }
  function revealHint() {
    const used = Math.max(hintsUsed, localHints);
    setHint(hints[Math.min(used, hints.length - 1)] ?? 'Follow a request from the user to its data. Remove single points of failure, then leave enough capacity for a spike.');
    setLocalHints(used + 1); onHint?.();
  }
  const meters = goalMeters(state, config, phase === 'live' && !lab);
  const duration = config.goals.durationSec;
  const visibleBanner = banner && (phase === 'build' || time - banner.at < 8);
  const maxQueue = Math.max(100, config.goals.maxQueue ?? 0, ...history.map(h => h.queue));
  const queuePoints = history.map((h, i) => `${i / Math.max(1, history.length - 1) * 600},${92 - h.queue / maxQueue * 80}`).join(' ');
  return <div className="space-y-4" data-testid="sim-runner">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${phase === 'build' ? 'bg-violet-400/10 text-violet-300' : 'bg-cyan-400/10 text-cyan-300'}`}>{phase === 'build' ? <ShieldCheck size={20} /> : <Radio size={20} />}</span><div><div className="text-xs font-black tracking-widest text-slate-100 uppercase">{lab ? 'Chaos laboratory' : phase === 'build' ? 'Build your defense' : phase === 'result' ? 'Mission report' : 'Launch is live'}</div><p className="mt-1 text-xs text-slate-500">{phase === 'build' ? 'Wire your system, check the budget, then send real traffic.' : lab ? 'Break things. Watch the trade-offs. Bring them back.' : `${number(Math.min(time, duration), 1)} / ${duration}s · ${number(state.rps)} requests/s`}</p></div></div>
      <div className="flex flex-wrap items-center gap-2">
        {!lab && <div aria-label={`${lives} lives left`} className="mr-2 flex gap-1">{[0, 1, 2].map(i => <Heart key={i} size={18} className={i < lives ? 'fill-rose-400 text-rose-400' : 'text-slate-700'} />)}</div>}
        {phase === 'build' && <><button type="button" className={action} onClick={revealHint}><CircleHelp size={15} />Ravi's hint {onHint ? '(−10 XP)' : ''}</button><button type="button" className={primary} disabled={state.cost > config.budget || state.cost > (config.goals.maxCost ?? Infinity) || !graph.nodes.some(n => n.kind === 'web')} onClick={() => { engine.current = createSim(config, graph, knobs); setState(engine.current.state); setBanner(null); setPhase('live'); }}><Play size={16} />Go live</button></>}
        {phase === 'live' && <><button type="button" className={action} aria-label={paused ? 'Resume simulation' : 'Pause simulation'} onClick={() => setPaused(p => !p)}>{paused ? <Play size={15} /> : <Pause size={15} />}{paused ? 'Resume' : 'Pause'}</button><div className="flex overflow-hidden rounded-xl border border-slate-700" aria-label="Simulation speed">{[1, 2, 4].map(n => <button type="button" key={n} aria-pressed={speed === n} onClick={() => setSpeed(n)} className={`px-3 py-2.5 text-xs font-bold ${speed === n ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-900 text-slate-500'}`}>{n}×</button>)}</div></>}
        {lab && <button type="button" className={action} onClick={retry} aria-label="Reset lab"><RotateCcw size={15} />Reset</button>}
      </div>
    </div>
    {hint && <div role="status" className="rounded-2xl border border-violet-400/30 bg-violet-400/10 p-4 text-sm text-violet-200"><strong>Ravi:</strong> {hint}</div>}
    {!lab && phase !== 'build' && <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-300 transition-[width]" style={{ width: `${Math.min(100, state.t / Math.max(1, duration) * 100)}%` }} /></div>}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{meters.map(meter => <Meter key={meter.id} meter={meter} />)}</div>
    <AnimatePresence mode="wait"><motion.div key={visibleBanner ? banner.text : 'quiet'} initial={{ opacity: 0, y: reduceMotion ? 0 : -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-2 ${visibleBanner ? 'border-violet-400/30 bg-violet-400/10' : 'border-slate-800 bg-slate-900/30'}`}>
      {visibleBanner && banner.who ? <svg viewBox="0 0 90 90" className="h-14 w-14 shrink-0" aria-hidden="true"><Character who={banner.who} x={45} y={50} size={60} nameTag={false} time={time} /></svg> : <Activity size={18} className="shrink-0 text-cyan-300" />}
      <p role="status" className={`text-xs leading-relaxed ${visibleBanner ? 'text-violet-100' : 'text-slate-500'}`}>{visibleBanner ? banner.text : phase === 'build' ? 'Ravi: Every box has a cost. Every wire needs a purpose. Plan for what happens when one box disappears.' : `${number(state.uptime * 100, 2)}% cumulative uptime · ${state.alerts.length ? state.alerts[0] : 'All systems nominal. Stay curious.'}`}</p>
    </motion.div></AnimatePresence>
    {result && <motion.div initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.97 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-2xl border p-6 text-center ${result.passed ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-rose-400/40 bg-rose-400/10'}`} role="status">
      <div className="mb-3 flex justify-center gap-2">{[1, 2, 3].map(star => <Star key={star} size={32} className={result.stars >= star ? 'fill-amber-300 text-amber-300' : 'text-slate-700'} />)}</div>
      <h2 className="text-xl font-black text-slate-100">{result.passed ? 'PixelPost survived the launch!' : 'The Pager won this round'}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{result.passed ? `${number(result.uptime * 100, 2)}% uptime · ${number(result.p95)}ms p95 · ${result.cost} credits · +${result.xp} XP` : `Review the red meters, rewire the system, and try again. ${state.dataLoss ? 'A failed data tier had no synchronized copy.' : lives === 0 ? 'Three sustained goal breaches used all your lives.' : 'The final goals were not met.'}`}</p>
      <p className="mt-2 text-xs text-slate-500">3 stars: goals met, spend ≤85% of budget, all lives kept, no hints.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" className={action} onClick={retry}><RotateCcw size={15} />Retry mission</button>{<button type="button" className={primary} onClick={() => { if (runtime.current.claimed) return; runtime.current.claimed = true; callbacks.current.onFinish(result); }}><ShieldCheck size={16} />{result.passed ? 'Claim reward & continue' : 'Save result & return'}</button>}</div>
    </motion.div>}
    <ArchCanvas graph={graph} state={state} time={reduceMotion ? state.t : time} editable={phase !== 'result'} onChange={changeGraph} palette={config.palette} locked={config.locked ?? config.start.nodes.map(n => n.id)} budget={lab ? undefined : Math.min(config.budget, config.goals.maxCost ?? Infinity)} />
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4"><h3 className="text-xs font-black tracking-widest text-cyan-300 uppercase">Control room</h3><fieldset disabled={phase === 'result'} className="grid gap-2 sm:grid-cols-2 disabled:opacity-50">{(config.knobs ?? []).map(knob => <KnobControl key={knob.id} knob={knob} value={knobs[knob.id] ?? knob.initial} onChange={value => changeKnob(knob.id, value)} />)}</fieldset>{!config.knobs?.length && <p className="text-xs text-slate-500">Control capacity by placing components and connecting them on the board.</p>}
        {lab && <><button type="button" className={`${action} w-full text-amber-300`} onClick={() => setShowChaos(v => !v)}><Zap size={15} />{showChaos ? 'Close chaos controls' : 'Inject a failure'}</button>{showChaos && <div className="space-y-2"><button type="button" className={`${action} w-full`} onClick={() => { const rps = Math.max(100, state.rps * 2); if (knobs.rps !== undefined) changeKnob('rps', rps); else chaos({ at: time, type: 'traffic', rps }); }}>Traffic spike ×2</button><div className="grid grid-cols-2 gap-2">{graph.nodes.filter(n => n.kind !== 'client' && n.kind !== 'mobile').map(n => {
          const isDown = state.nodes[n.id]?.health === 'down';
          return <button type="button" key={n.id} className={`${action} justify-start px-3 py-2 text-[11px] ${isDown ? 'text-emerald-300' : 'text-rose-300'}`} onClick={() => chaos(isDown ? { at: time, type: 'revive', target: n.id } : n.kind === 'datacenter' ? { at: time, type: 'region-down', region: n.id } : { at: time, type: 'kill', target: n.id })}>{isDown ? '↻ Revive' : '× Kill'} {n.label ?? COMPONENTS[n.kind].name}</button>;
        })}</div></div>}</>}
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4"><h3 className="text-xs font-black tracking-widest text-violet-300 uppercase">Telemetry</h3><div className="flex justify-between text-xs text-slate-400"><span>Queue depth · last 60s</span><span className="font-mono">{number(state.queueLength)} jobs</span></div><svg viewBox="0 0 600 110" className="w-full rounded-xl bg-slate-950/60" role="img" aria-label="Queue length history"><path d="M 0 92 H 600" stroke="#334155" /><polyline points={queuePoints} fill="none" stroke="#a78bfa" strokeWidth="3" />{config.goals.maxQueue !== undefined && <line x1="0" x2="600" y1={92 - config.goals.maxQueue / maxQueue * 80} y2={92 - config.goals.maxQueue / maxQueue * 80} stroke="#fb7185" strokeDasharray="8 6" />}</svg>
        <div className="max-h-36 space-y-1 overflow-y-auto font-mono text-[11px] text-slate-400" aria-label="System alerts">{state.alerts.length ? state.alerts.map(alert => <p key={alert} className={/DOWN|LOSS|overloaded/.test(alert) ? 'text-rose-300' : 'text-amber-200'}>{alert}</p>) : <p className="text-emerald-300">✓ No incidents detected</p>}</div>
        {lab && tasks.length > 0 && <div className="space-y-2 border-t border-slate-800 pt-3"><h3 className="text-xs font-bold text-emerald-300">Field notes · mark what you explored</h3>{tasks.map(task => <label key={task} className="flex items-start gap-2 text-xs leading-relaxed text-slate-400"><input type="checkbox" className="mt-0.5 accent-emerald-300" checked={checkedTasks.includes(task)} onChange={e => setCheckedTasks(old => e.target.checked ? [...old, task] : old.filter(t => t !== task))} />{task}</label>)}</div>}
      </div>
    </div>
    {lab && <div className="flex justify-end"><button type="button" className={primary} onClick={() => { if (runtime.current.claimed) return; runtime.current.claimed = true; onFinish({ ...missionResult(state, config, 3, 0), passed: true, goalsMet: true, stars: 0, xp: 30 }); }}><ShieldCheck size={16} />Finish exploring</button></div>}
  </div>;
}
