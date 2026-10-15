import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { COP, PRIVATE_IPS } from '../data';

/* --------------------------------- engine --------------------------------- */
export interface Req { id: number; born: number }
export type DropReason = 'dead' | 'full' | 'timeout';
export interface CopState {
  t: number;
  loads: number[];
  pending: Req[];
  spawned: number;
  served: number;
  dropped: number;
  /** Last routing outcome, for UI feedback. */
  last?: { id: number; server: number | null; ok: boolean; reason?: DropReason };
}

export const initialCop = (): CopState => ({ t: 0, loads: Array(COP.servers).fill(0), pending: [], spawned: 0, served: 0, dropped: 0 });

export const isUp = (server: number, t: number) => !COP.outages.some(([s, a, b]) => s === server && t >= a && t < b);

export function stepCop(s: CopState, dt: number): CopState {
  const t = s.t + dt;
  const loads = s.loads.map((l, i) => (isUp(i, t) ? Math.max(0, l - COP.drainPerSec * dt) : 0));
  let pending = s.pending;
  let spawned = s.spawned;
  while (spawned < COP.total && t >= spawned * COP.spawnEvery) {
    pending = [...pending, { id: spawned, born: spawned * COP.spawnEvery }];
    spawned += 1;
  }
  const expired = pending.filter((r) => t - r.born > COP.patience);
  let last = s.last;
  if (expired.length) {
    pending = pending.filter((r) => t - r.born <= COP.patience);
    last = { id: expired[expired.length - 1].id, server: null, ok: false, reason: 'timeout' };
  }
  return { ...s, t, loads, pending, spawned, dropped: s.dropped + expired.length, last };
}

export function routeCop(s: CopState, server: number): CopState {
  const [req, ...rest] = s.pending;
  if (!req) return s;
  if (!isUp(server, s.t)) return { ...s, pending: rest, dropped: s.dropped + 1, last: { id: req.id, server, ok: false, reason: 'dead' } };
  if (s.loads[server] + 1 > COP.capacity) return { ...s, pending: rest, dropped: s.dropped + 1, last: { id: req.id, server, ok: false, reason: 'full' } };
  const loads = s.loads.map((l, i) => (i === server ? l + 1 : l));
  return { ...s, loads, pending: rest, served: s.served + 1, last: { id: req.id, server, ok: true } };
}

export const copDone = (s: CopState) => s.spawned >= COP.total && s.pending.length === 0;
export const copScore = (s: CopState) => Math.round((s.served / COP.total) * 100) / 100;
/** The load balancer's choice: least-loaded healthy server. */
export function bestServer(s: CopState): number | null {
  let best: number | null = null;
  s.loads.forEach((l, i) => {
    if (isUp(i, s.t) && (best === null || l < s.loads[best])) best = i;
  });
  return best;
}

/* ----------------------------------- UI ----------------------------------- */
const DT = 0.05;
const COLORS = ['border-cyan-400 text-cyan-300', 'border-violet-400 text-violet-300', 'border-emerald-400 text-emerald-300'];
const REASON: Record<DropReason, string> = { dead: 'server is down!', full: 'server overloaded!', timeout: 'too slow, timed out!' };

export default function TrafficCop({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [s, setS] = useState<CopState>(initialCop);
  const finished = useRef(false);

  useEffect(() => {
    if (phase !== 'play') return;
    const id = window.setInterval(() => setS((cur) => stepCop(cur, DT)), DT * 1000);
    return () => window.clearInterval(id);
  }, [phase]);
  useEffect(() => {
    if (phase === 'play' && copDone(s)) setPhase('done');
  }, [s, phase]);

  const route = useCallback((i: number) => phase === 'play' && setS((cur) => routeCop(cur, i)), [phase]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= COP.servers) route(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [route]);

  const restart = () => {
    setS(initialCop());
    setPhase('play');
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(copScore(s));
  };
  const hint = bestServer(s);

  return (
    <div className="mx-auto w-full max-w-3xl select-none text-slate-100">
      <div className="mb-3 flex items-center gap-3 text-sm font-bold">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-emerald-300">✓ {s.served} served</div>
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-rose-300">✗ {s.dropped} dropped</div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full bg-cyan-400 transition-[width]" style={{ width: `${(s.spawned / COP.total) * 100}%` }} />
        </div>
        <div className="rounded-2xl bg-slate-900 px-3 py-2 text-violet-300">{s.spawned}/{COP.total}</div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-[0_0_40px_rgba(167,139,250,0.15)]">
        {/* the load balancer chute */}
        <div className="relative mx-auto h-48 w-40 rounded-2xl border-2 border-dashed border-violet-400/40 bg-violet-400/5">
          <div className="absolute inset-x-0 -top-0.5 text-center text-[10px] font-black tracking-widest text-violet-300">LOAD BALANCER · 88.88.88.1</div>
          <AnimatePresence>
            {s.pending.map((r, k) => {
              const f = Math.min(1, (s.t - r.born) / COP.patience);
              return (
                <motion.div key={r.id} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}
                  className={`absolute left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full text-xs font-black text-slate-950 ${k === 0 ? 'z-10 bg-amber-300 ring-4 ring-amber-300/40' : 'bg-sky-400'} ${f > 0.75 ? 'animate-pulse bg-rose-400' : ''}`}
                  style={{ top: `${8 + f * 140}px` }}>
                  {k === 0 ? 'GO' : 'req'}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* feedback */}
        <div className="h-8 text-center">
          <AnimatePresence mode="wait">
            {s.last && (
              <motion.div key={`${s.last.id}-${s.last.ok}`} initial={{ y: -10, opacity: 0, scale: 1.3 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className={`mt-1 text-sm font-black ${s.last.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                {s.last.ok ? `+1 → server ${(s.last.server ?? 0) + 1}` : `DROPPED: ${REASON[s.last.reason ?? 'timeout']}`}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* servers */}
        <div className="mt-2 grid grid-cols-3 gap-3">
          {Array.from({ length: COP.servers }, (_, i) => {
            const up = isUp(i, s.t);
            const load = s.loads[i] / COP.capacity;
            const glow = phase === 'play' && hint === i && s.pending.length > 0;
            return (
              <motion.button key={i} onClick={() => route(i)} disabled={phase !== 'play'} aria-label={`Route to server ${i + 1}`}
                whileTap={{ scale: 0.94 }}
                animate={up ? { rotate: 0, opacity: 1 } : { rotate: [0, -3, 3, 0], opacity: 0.5 }}
                className={`relative rounded-2xl border-2 bg-slate-900 p-3 text-left ${up ? COLORS[i] : 'border-slate-700 text-slate-500'} ${glow ? 'shadow-[0_0_24px_rgba(251,191,36,0.45)]' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black">{up ? '🖥️' : '💀'} Server {i + 1}</span>
                  <kbd className="rounded bg-slate-800 px-1.5 text-xs text-slate-300">{i + 1}</kbd>
                </div>
                <div className="text-[11px] text-slate-500">private {PRIVATE_IPS[i]}</div>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: COP.capacity }, (_, k) => (
                    <div key={k} className={`h-3 flex-1 rounded ${!up ? 'bg-slate-800' : k < Math.ceil(s.loads[i] - 0.01) ? (load > 0.74 ? 'bg-rose-400' : load > 0.49 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-slate-800'}`} />
                  ))}
                </div>
                <div className="mt-1 text-xs font-bold">{up ? `${Math.round(load * 100)}% busy` : 'OFFLINE'}</div>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {phase !== 'play' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-slate-950/90 p-6 text-center">
              {phase === 'intro' ? (
                <div className="max-w-md">
                  <h3 className="text-3xl font-black text-violet-300">Traffic Cop</h3>
                  <p className="mt-3 text-slate-300">
                    You are the load balancer. Requests drop into the chute; send the <b className="text-amber-300">GO</b> request to a server by clicking it or pressing
                    <b> 1</b>, <b>2</b> or <b>3</b>. Full servers and dead servers drop requests, and slow cops time out. Servers <i>will</i> die.
                  </p>
                  <button className="mt-6 rounded-2xl bg-violet-400 px-6 py-2 font-bold text-slate-950 hover:bg-violet-300" onClick={() => setPhase('play')} autoFocus>
                    Start directing traffic
                  </button>
                </div>
              ) : (
                <div className="max-w-md">
                  <h3 className="text-2xl font-black text-amber-300">Shift over</h3>
                  <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }} className="mt-1 text-6xl font-black text-white">
                    {Math.round(copScore(s) * 100)}%
                  </motion.p>
                  <p className="mt-1 text-sm text-slate-400">{s.served} served · {s.dropped} dropped</p>
                  <p className="mt-3 text-xs text-slate-400">A real load balancer does this for every request: spread the load evenly and skip servers that are offline.</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <button className="rounded-2xl border border-slate-600 px-5 py-2 font-bold text-slate-200 hover:bg-slate-800" onClick={restart}>Play again</button>
                    <button className="rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>Finish</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
