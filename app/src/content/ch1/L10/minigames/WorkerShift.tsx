import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cog, Minus, Plus } from 'lucide-react';
import type { MiniGameProps } from '@/types/content';
import {
  GAME_SECONDS, MAX_QUEUE, MAX_WORKERS, MIN_WORKERS, RED_LINE, WORKER_COST, WORKER_RATE, arrivals, shiftScore, stepShift, type ShiftState,
} from '../data';

const START: ShiftState = { queue: 0, slaSec: 0, cost: 0, t: 0 };

/** Ravi's running commentary, keyed by shift second. */
export function commentary(s: ShiftState, workers: number): string {
  const demand = arrivals(s.t);
  if (s.queue > RED_LINE) return 'Over the red line! Uploads are waiting too long. Add workers!';
  if (s.queue > RED_LINE * 0.6) return 'The queue is growing. More consumers will drain it.';
  if (s.queue < 1 && workers * WORKER_RATE > demand * 2) return 'The queue is empty and workers are idle. Fewer workers, lower bill.';
  return 'Steady. Match the workers to the jobs coming in.';
}

type Phase = 'intro' | 'play' | 'done';

export default function WorkerShift({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [workers, setWorkers] = useState(2);
  const [state, setState] = useState<ShiftState>(START);
  const [history, setHistory] = useState<number[]>([]);
  const workersRef = useRef(workers);
  const stateRef = useRef(state);
  const doneRef = useRef(false);
  useEffect(() => {
    workersRef.current = workers;
  }, [workers]);

  useEffect(() => {
    if (phase !== 'play') return;
    let id = 0;
    let last = performance.now() / 1000;
    let lastSample = -1;
    const tick = () => {
      const now = performance.now() / 1000;
      const dt = Math.min(0.1, Math.max(0, now - last));
      last = now;
      const next = stepShift(stateRef.current, workersRef.current, dt);
      stateRef.current = next;
      setState(next);
      if (Math.floor(next.t * 2) !== lastSample) {
        lastSample = Math.floor(next.t * 2);
        setHistory((h) => [...h, next.queue]);
      }
      if (next.t >= GAME_SECONDS) setPhase('done');
      else id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [phase]);

  const change = (d: number) => setWorkers((w) => Math.max(MIN_WORKERS, Math.min(MAX_WORKERS, w + d)));
  useEffect(() => {
    if (phase !== 'play') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=' || e.key === 'ArrowUp') change(1);
      if (e.key === '-' || e.key === 'ArrowDown') change(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const score = shiftScore(state);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete(score);
  };
  const start = () => {
    stateRef.current = START;
    setState(START);
    setHistory([]);
    setWorkers(2);
    setPhase('play');
  };

  const over = state.queue > RED_LINE;
  const qPct = (state.queue / MAX_QUEUE) * 100;
  const redPct = (RED_LINE / MAX_QUEUE) * 100;
  const demand = arrivals(state.t);
  const capacity = workers * WORKER_RATE;
  const blobs = Math.min(30, Math.round(state.queue / 4));

  return (
    <div className="mx-auto w-full max-w-4xl select-none text-slate-100">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['Shift clock', `${Math.max(0, GAME_SECONDS - state.t).toFixed(0)} s`, 'text-cyan-300'],
          ['Jobs in / s', `${demand}`, 'text-amber-300'],
          ['Worker capacity', `${capacity} / s`, capacity >= demand ? 'text-emerald-300' : 'text-rose-300'],
          ['Credits spent', `${state.cost.toFixed(0)}`, 'text-violet-300'],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-2xl bg-slate-900 px-3 py-2">
            <div className="text-xs text-slate-500">{k}</div>
            <div className={`font-mono text-xl font-black tabular-nums ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4">
        {/* queue tube */}
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>Photo jobs queue</span>
          <span className={over ? 'font-bold text-rose-300' : ''}>{Math.round(state.queue)} waiting</span>
        </div>
        <motion.div className="relative h-16 overflow-hidden rounded-2xl border-2 bg-slate-900" animate={{ borderColor: over ? '#fb7185' : '#fbbf24' }}>
          <motion.div className={`absolute inset-y-0 left-0 ${over ? 'bg-rose-400/30' : 'bg-amber-400/25'}`} animate={{ width: `${qPct}%` }} transition={{ duration: 0.1 }} />
          <div className="absolute inset-0 flex flex-wrap content-center gap-1 px-2">
            <AnimatePresence>
              {Array.from({ length: blobs }, (_, i) => (
                <motion.span key={i} initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, x: 40 }}
                  className="h-5 w-5 rounded-md bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
              ))}
            </AnimatePresence>
          </div>
          <div className="absolute inset-y-0 border-l-2 border-dashed border-rose-400" style={{ left: `${redPct}%` }}>
            <span className="absolute -top-0.5 left-1 text-[10px] font-bold text-rose-300">RED LINE</span>
          </div>
        </motion.div>

        {/* sparkline */}
        <svg viewBox={`0 0 ${GAME_SECONDS * 2} ${MAX_QUEUE}`} className="mt-2 h-14 w-full" preserveAspectRatio="none" aria-label="Queue length over time">
          <line x1={0} x2={GAME_SECONDS * 2} y1={MAX_QUEUE - RED_LINE} y2={MAX_QUEUE - RED_LINE} stroke="#fb7185" strokeDasharray="3 3" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <polyline fill="none" stroke="#fbbf24" strokeWidth={2} vectorEffect="non-scaling-stroke" points={history.map((q, i) => `${i},${MAX_QUEUE - q}`).join(' ')} />
        </svg>

        {/* workers */}
        <div className="mt-3 flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => change(-1)} disabled={phase !== 'play'} aria-label="Remove worker"
            className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-600 text-slate-200 disabled:opacity-40">
            <Minus />
          </motion.button>
          <div className="flex flex-1 flex-wrap gap-2" aria-label={`${workers} workers`}>
            <AnimatePresence>
              {Array.from({ length: workers }, (_, i) => (
                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}
                  className={`grid h-12 w-12 place-items-center rounded-2xl border ${state.queue > 0.5 ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-700'}`}>
                  <motion.span animate={state.queue > 0.5 && phase === 'play' ? { rotate: 360 } : { rotate: 0 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                    <Cog className={state.queue > 0.5 ? 'text-cyan-300' : 'text-slate-500'} />
                  </motion.span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => change(1)} disabled={phase !== 'play'} aria-label="Add worker"
            className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400 text-slate-950 disabled:opacity-40">
            <Plus />
          </motion.button>
        </div>
        <p className="mt-3 text-center text-sm text-slate-300" role="status">
          {phase === 'play' ? commentary(state, workers) : `Each worker handles ${WORKER_RATE} jobs/s and costs ${WORKER_COST} credit/s.`}
        </p>

        {phase !== 'play' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/80 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="w-full max-w-md rounded-2xl border border-cyan-400/40 bg-slate-900 p-6 text-center">
              {phase === 'intro' ? (
                <>
                  <h3 className="text-2xl font-black text-cyan-300">Worker Shift Manager</h3>
                  <p className="mt-2 text-slate-300">
                    Filter jobs pour into the queue for {GAME_SECONDS} seconds, in bursts. Add workers (+ / ↑) to keep the queue under the red line,
                    and remove them (− / ↓) when it is empty: every worker costs credits each second.
                  </p>
                  <button className="mt-4 rounded-2xl bg-cyan-400 px-6 py-2 font-bold text-slate-950" onClick={start} autoFocus>Start shift</button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-black text-emerald-300">Shift over</h3>
                  <p className="mt-1 text-5xl font-black">{Math.round(score * 100)}%</p>
                  <p className="mt-2 text-slate-300">
                    Under the red line {Math.round((state.slaSec / GAME_SECONDS) * 100)}% of the time, for {state.cost.toFixed(0)} credits.
                    Big queue → more workers; empty queue → fewer.
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <button className="rounded-2xl border border-slate-600 px-5 py-2 font-bold" onClick={start}>Play again</button>
                    <button className="rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950" onClick={finish} autoFocus>Finish</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
