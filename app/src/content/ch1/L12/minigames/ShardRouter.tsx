import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { ROUTER_ROUNDS, movedWhenResharding, shardOf } from '../data';

/** Seconds to route each user id. */
export const ID_TIME = 6;
const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185'];
const TOTAL = ROUTER_ROUNDS.reduce((s, r) => s + r.ids.length, 0);

export function routerScore(correct: number, total = TOTAL): number {
  return total ? Math.round((correct / total) * 100) / 100 : 0;
}

type Phase = 'intro' | 'route' | 'reshard' | 'done';
interface Hit {
  id: number;
  ok: boolean;
  shard: number;
}

export default function ShardRouter({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState<Hit[]>([]);
  const [flash, setFlash] = useState<{ shard: number; ok: boolean; key: number } | null>(null);
  const [left, setLeft] = useState(ID_TIME);
  const finished = useRef(false);
  const { shards, ids } = ROUTER_ROUNDS[Math.min(round, ROUTER_ROUNDS.length - 1)];
  const id = ids[idx];
  const correct = hits.filter((h) => h.ok).length;
  const score = routerScore(correct);
  const roundHits = hits.slice(round === 0 ? 0 : ROUTER_ROUNDS[0].ids.length);

  const route = useCallback(
    (shard: number | null) => {
      if (phase !== 'route') return;
      const want = shardOf(id, shards);
      const ok = shard === want;
      setHits((h) => [...h, { id, ok, shard: want }]);
      setFlash({ shard: want, ok, key: Date.now() + Math.random() });
      if (idx + 1 < ids.length) {
        setIdx(idx + 1);
        setLeft(ID_TIME);
      } else if (round + 1 < ROUTER_ROUNDS.length) setPhase('reshard');
      else setPhase('done');
    },
    [phase, id, shards, idx, ids.length, round],
  );

  useEffect(() => {
    if (phase !== 'route') return;
    const t = window.setInterval(() => setLeft((l) => Math.max(0, l - 0.1)), 100);
    return () => window.clearInterval(t);
  }, [phase, idx, round]);
  useEffect(() => {
    if (phase === 'route' && left <= 0) route(null);
  }, [left, phase, route]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (phase === 'route' && e.key.length === 1 && n >= 0 && n < shards) route(n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, shards, route]);

  const start = () => {
    setRound(0);
    setIdx(0);
    setHits([]);
    setLeft(ID_TIME);
    setPhase('route');
  };
  const nextRound = () => {
    setRound(1);
    setIdx(0);
    setLeft(ID_TIME);
    setPhase('route');
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };
  const moved = movedWhenResharding(ROUTER_ROUNDS[0].ids, ROUTER_ROUNDS[0].shards, ROUTER_ROUNDS[1].shards);
  const lastHit = hits[hits.length - 1];

  return (
    <div className="mx-auto w-full max-w-4xl select-none text-slate-100">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 font-mono text-sm font-bold text-cyan-300">
          hash = user_id % <span className={round ? 'text-amber-300' : ''}>{shards}</span>
        </div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
          <motion.div className="h-full bg-cyan-400" animate={{ width: `${(hits.length / TOTAL) * 100}%` }} />
        </div>
        <div className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-black text-emerald-300">
          {correct}/{TOTAL}
        </div>
      </div>

      <div className="relative min-h-[230px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-md text-center">
              <h3 className="text-3xl font-black text-cyan-300">Shard Router</h3>
              <p className="mt-3 text-slate-300">
                User ids fly in. Compute <b className="font-mono text-cyan-300">user_id % N</b> in your head and send each one to the right shard before the timer runs out. Number keys work too.
              </p>
              <button className="mt-6 rounded-2xl bg-cyan-400 px-6 py-2 font-bold text-slate-950 hover:bg-cyan-300" onClick={start} autoFocus>
                Open the router
              </button>
            </motion.div>
          )}
          {phase === 'route' && (
            <motion.div key={`${round}-${idx}`} initial={{ opacity: 0, y: -80, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 80, scale: 0.6 }} className="mx-auto max-w-sm text-center">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Round {round + 1} · user {idx + 1}/{ids.length}
              </div>
              <div className="mt-2 font-mono text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">{id}</div>
              <div className="mt-1 font-mono text-slate-400">
                {id} % {shards} = ?
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full transition-[width] duration-100 ${left < 2 ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${(left / ID_TIME) * 100}%` }} />
              </div>
              {lastHit && (
                <div className={`mt-3 text-sm font-bold ${lastHit.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {lastHit.ok ? '✓' : '✗'} {lastHit.id} → shard {lastHit.shard}
                </div>
              )}
            </motion.div>
          )}
          {phase === 'reshard' && (
            <motion.div key="reshard" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, rotate: [0, -2, 2, 0] }} exit={{ opacity: 0 }} className="mx-auto max-w-lg text-center">
              <div className="text-sm font-bold uppercase tracking-widest text-rose-300">⚠ Shard exhaustion</div>
              <h3 className="mt-1 text-2xl font-black text-white">The shards are full. Ravi adds a fifth one.</h3>
              <p className="mt-2 text-slate-300">
                The function becomes <b className="font-mono text-amber-300">user_id % 5</b>. Of the {ROUTER_ROUNDS[0].ids.length} users you just routed,{' '}
                <b className="text-rose-300">{moved}</b> now belong on a different shard, and all their data has to move. Same users, new homes. That is resharding pain (consistent hashing in Chapter 5 softens it).
              </p>
              <button className="mt-5 rounded-2xl bg-amber-400 px-6 py-2 font-bold text-slate-950 hover:bg-amber-300" onClick={nextRound} autoFocus>
                Route again with % 5
              </button>
            </motion.div>
          )}
          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-md text-center">
              <h3 className="text-2xl font-black text-amber-300">Router shift over</h3>
              <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }} className="text-6xl font-black text-white">
                {Math.round(score * 100)}%
              </motion.p>
              <p className="mt-1 text-sm text-slate-400">
                {correct}/{TOTAL} routed · round 2: {roundHits.filter((h) => h.ok).length}/{ROUTER_ROUNDS[1].ids.length}
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button className="rounded-2xl border border-slate-600 px-5 py-2 font-bold text-slate-200 hover:bg-slate-800" onClick={start}>
                  Play again
                </button>
                <button className="rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>
                  Finish
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: `repeat(${shards}, minmax(0, 1fr))` }}>
        {Array.from({ length: shards }, (_, k) => {
          const lit = flash?.shard === k;
          const stored = hits.filter((h, i) => h.ok && h.shard === k && (round === 0 ? i < ROUTER_ROUNDS[0].ids.length : i >= ROUTER_ROUNDS[0].ids.length)).length;
          return (
            <motion.button
              key={`${round}-${k}`}
              aria-label={`Shard ${k}`}
              initial={k === 4 ? { scale: 0, rotate: -20 } : false}
              animate={lit ? { scale: [1, 1.08, 1], borderColor: flash.ok ? '#34d399' : '#fb7185' } : { scale: 1, rotate: 0 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => route(k)}
              disabled={phase !== 'route'}
              className="rounded-2xl border-2 bg-slate-900 p-4 text-center disabled:opacity-60"
              style={{ borderColor: `${COLORS[k]}88` }}
            >
              <div className="text-3xl">🗄️</div>
              <div className="font-black" style={{ color: COLORS[k] }}>
                Shard {k}
              </div>
              <div className="text-xs text-slate-500">[{k}]</div>
              <div className="mt-1 flex flex-wrap justify-center gap-1">
                {Array.from({ length: stored }, (_, i) => (
                  <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-2 w-2 rounded-full" style={{ background: COLORS[k] }} />
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
