import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { QUERIES, ROUTER_TIME, type QueryCard, type Target } from '../data';

interface Routed { id: string; pick: Target | null; correct: boolean }

/** 0..1: share of queries routed to the right database. */
export const routerScore = (cards: QueryCard[], routed: Routed[]) =>
  cards.length ? Math.round((routed.filter((r) => r.correct).length / cards.length) * 100) / 100 : 0;

/** Master heat: rises with reads wrongly sent to it (overload). */
export const masterHeat = (routed: Routed[]) =>
  Math.min(1, 0.25 + routed.filter((r) => r.pick === 'primary' && !r.correct).length * 0.2);

const SWIPE = 100;

function SqlCard({ card, onPick }: { card: QueryCard; onPick: (t: Target) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const leftGlow = useTransform(x, [-SWIPE, 0], [1, 0]);
  const rightGlow = useTransform(x, [0, SWIPE], [0, 1]);
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE) onPick('primary');
    else if (info.offset.x > SWIPE) onPick('replica');
  };
  return (
    <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.9} onDragEnd={onDragEnd} style={{ x, rotate }}
      initial={{ y: -120, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
      className="relative w-full max-w-md cursor-grab touch-none rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] active:cursor-grabbing">
      <motion.div style={{ opacity: leftGlow }} className="pointer-events-none absolute inset-0 rounded-2xl border-4 border-amber-400" />
      <motion.div style={{ opacity: rightGlow }} className="pointer-events-none absolute inset-0 rounded-2xl border-4 border-cyan-400" />
      <div className="text-xs font-bold uppercase tracking-widest text-violet-300">{card.what}</div>
      <code className="mt-2 block whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-3 font-mono text-sm text-emerald-300">{card.sql}</code>
      <div className="mt-3 flex justify-between text-xs font-bold text-slate-500">
        <span>← primary</span>
        <span>drag me</span>
        <span>replica →</span>
      </div>
    </motion.div>
  );
}

export default function QueryRouter({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'feedback' | 'done'>('intro');
  const [idx, setIdx] = useState(0);
  const [routed, setRouted] = useState<Routed[]>([]);
  const [left, setLeft] = useState(ROUTER_TIME);
  const finished = useRef(false);
  const card = QUERIES[idx];
  const last = routed[routed.length - 1];
  const heat = masterHeat(routed);
  const corruption = routed.filter((r) => r.pick === 'replica' && !r.correct).length;

  const pick = useCallback(
    (p: Target | null) => {
      if (phase !== 'play') return;
      setRouted((r) => [...r, { id: card.id, pick: p, correct: p === card.answer }]);
      setPhase('feedback');
    },
    [phase, card],
  );
  const next = useCallback(() => {
    if (idx + 1 < QUERIES.length) {
      setIdx(idx + 1);
      setLeft(ROUTER_TIME);
      setPhase('play');
    } else setPhase('done');
  }, [idx]);

  useEffect(() => {
    if (phase !== 'play') return;
    const id = window.setInterval(() => setLeft((l) => Math.max(0, Math.round((l - 0.1) * 10) / 10)), 100);
    return () => window.clearInterval(id);
  }, [phase, idx]);
  useEffect(() => {
    if (phase === 'play' && left <= 0) pick(null);
  }, [left, phase, pick]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === 'play' && e.key === 'ArrowLeft') pick('primary');
      else if (phase === 'play' && e.key === 'ArrowRight') pick('replica');
      else if (phase === 'feedback' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, pick, next]);

  const restart = () => {
    setIdx(0);
    setRouted([]);
    setLeft(ROUTER_TIME);
    setPhase('play');
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(routerScore(QUERIES, routed));
  };
  const wrongFx = phase === 'feedback' && last && !last.correct;

  return (
    <div className="mx-auto w-full max-w-4xl select-none text-slate-100">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-violet-300">Query {Math.min(idx + 1, QUERIES.length)}/{QUERIES.length}</div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full transition-[width] duration-100 ${left / ROUTER_TIME > 0.4 ? 'bg-cyan-400' : 'bg-rose-400'}`}
            style={{ width: `${phase === 'play' ? (left / ROUTER_TIME) * 100 : 0}%` }} />
        </div>
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-emerald-300">✓ {routed.filter((r) => r.correct).length}</div>
      </div>

      <div className="relative grid min-h-[420px] grid-cols-[1fr_minmax(0,2fr)_1fr] items-stretch gap-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4">
        {/* primary */}
        <motion.button onClick={() => pick('primary')} disabled={phase !== 'play'}
          animate={wrongFx && last.pick === 'primary' ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-400/60 bg-amber-400/5 p-3 text-center hover:bg-amber-400/15 disabled:opacity-80">
          <span className="text-4xl">👑</span>
          <span className="mt-1 text-lg font-black text-amber-300">Primary</span>
          <span className="text-xs text-slate-400">master · writes</span>
          <div className="mt-3 w-full">
            <div className="text-[10px] font-bold uppercase text-slate-500">CPU</div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <motion.div className={`h-full ${heat > 0.7 ? 'bg-rose-400' : heat > 0.45 ? 'bg-amber-400' : 'bg-emerald-400'}`} animate={{ width: `${heat * 100}%` }} />
            </div>
            {heat > 0.7 && <div className="mt-1 text-[11px] font-black text-rose-300">🔥 overloaded with reads!</div>}
          </div>
        </motion.button>

        {/* center */}
        <div className="relative flex items-center justify-center">
          <AnimatePresence mode="wait">
            {phase === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-sm text-center">
                <h3 className="text-3xl font-black text-cyan-300">Query Router</h3>
                <p className="mt-3 text-slate-300">
                  You are PixelPost's data layer. Drag each SQL statement <b className="text-amber-300">left to the primary</b> (writes) or{' '}
                  <b className="text-cyan-300">right to a replica</b> (reads). Arrow keys work too. {ROUTER_TIME} seconds per query.
                </p>
                <button className="mt-6 rounded-2xl bg-cyan-400 px-6 py-2 font-bold text-slate-950 hover:bg-cyan-300" onClick={() => setPhase('play')} autoFocus>
                  Open the floodgates
                </button>
              </motion.div>
            )}
            {phase === 'play' && <SqlCard key={card.id} card={card} onPick={pick} />}
            {phase === 'feedback' && last && (
              <motion.div key={`fb-${card.id}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className={`w-full max-w-md rounded-2xl border-2 p-5 ${last.correct ? 'border-emerald-400 bg-emerald-400/10' : 'border-rose-400 bg-rose-400/10'}`}>
                <div className={`text-2xl font-black ${last.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {last.correct ? 'Routed!' : last.pick === null ? 'Timed out!' : last.pick === 'replica' ? '💥 Replica rejected the write!' : '🔥 Master overloaded'}
                </div>
                <div className="mt-1 font-bold text-white">{card.what} → {card.answer === 'primary' ? 'primary' : 'replica'}</div>
                <p className="mt-2 text-sm text-slate-200">{card.why}</p>
                <button className="mt-4 w-full rounded-2xl bg-white/90 py-2 font-bold text-slate-950 hover:bg-white" onClick={next} autoFocus>
                  {idx + 1 < QUERIES.length ? 'Next query' : 'See results'}
                </button>
              </motion.div>
            )}
            {phase === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm text-center">
                <h3 className="text-2xl font-black text-amber-300">Replicator report</h3>
                <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }} className="mt-1 text-6xl font-black text-white">
                  {Math.round(routerScore(QUERIES, routed) * 100)}%
                </motion.p>
                <p className="mt-1 text-sm text-slate-400">{corruption} rejected writes · master heat {Math.round(heat * 100)}%</p>
                <p className="mt-3 text-xs text-slate-400">Rule: INSERT, UPDATE, DELETE → master. SELECT (even with JOINs) → replica.</p>
                <div className="mt-4 flex justify-center gap-3">
                  <button className="rounded-2xl border border-slate-600 px-5 py-2 font-bold text-slate-200 hover:bg-slate-800" onClick={restart}>Play again</button>
                  <button className="rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>Finish</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* replicas */}
        <motion.button onClick={() => pick('replica')} disabled={phase !== 'play'}
          animate={wrongFx && last.pick === 'replica' ? { x: [0, 8, -8, 5, -5, 0] } : { x: 0 }}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-3 text-center hover:bg-cyan-400/15 disabled:opacity-80 ${corruption ? 'border-rose-400/60 bg-rose-400/5' : 'border-cyan-400/60 bg-cyan-400/5'}`}>
          <span className="text-4xl">📚</span>
          <span className="mt-1 text-lg font-black text-cyan-300">Replicas</span>
          <span className="text-xs text-slate-400">copies · reads only</span>
          {corruption > 0 && <div className="mt-3 text-[11px] font-black text-rose-300">⚠ {corruption} write{corruption > 1 ? 's' : ''} lost</div>}
        </motion.button>
      </div>
    </div>
  );
}
