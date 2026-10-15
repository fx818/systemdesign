import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { METRIC_ITEMS, METRIC_TYPES, type MetricType } from '../data';

/** Seconds per card before it counts as missed. */
export const CARD_TIME = 8;

export function sorterScore(results: boolean[], total: number): number {
  return total ? Math.round((results.filter(Boolean).length / total) * 100) / 100 : 0;
}

type Phase = 'intro' | 'sort' | 'feedback' | 'done';

export default function MetricSorter({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<MetricType | null>(null);
  const [left, setLeft] = useState(CARD_TIME);
  const [combo, setCombo] = useState(0);
  const finished = useRef(false);
  const item = METRIC_ITEMS[idx];
  const score = sorterScore(results, METRIC_ITEMS.length);

  const answer = useCallback(
    (t: MetricType | null) => {
      if (phase !== 'sort') return;
      const ok = t === item.type;
      setPicked(t);
      setResults((r) => [...r, ok]);
      setCombo((c) => (ok ? c + 1 : 0));
      setPhase('feedback');
    },
    [phase, item],
  );

  const next = useCallback(() => {
    if (idx + 1 < METRIC_ITEMS.length) {
      setIdx(idx + 1);
      setLeft(CARD_TIME);
      setPhase('sort');
    } else setPhase('done');
  }, [idx]);

  // countdown while sorting
  useEffect(() => {
    if (phase !== 'sort') return;
    const id = window.setInterval(() => setLeft((l) => Math.max(0, l - 0.1)), 100);
    return () => window.clearInterval(id);
  }, [phase, idx]);
  useEffect(() => {
    if (phase === 'sort' && left <= 0) answer(null);
  }, [left, phase, answer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (phase === 'sort' && n >= 1 && n <= 3) answer(METRIC_TYPES[n - 1].id);
      else if (phase === 'feedback' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, answer, next]);

  const start = () => {
    setIdx(0);
    setResults([]);
    setCombo(0);
    setLeft(CARD_TIME);
    setPhase('sort');
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };
  const ok = results[results.length - 1];
  const counts = METRIC_TYPES.map((m) => results.filter((r, i) => r && METRIC_ITEMS[i].type === m.id).length);

  return (
    <div className="mx-auto w-full max-w-4xl select-none text-slate-100">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-violet-300">
          Metric {Math.min(idx + 1, METRIC_ITEMS.length)}/{METRIC_ITEMS.length}
        </div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
          <motion.div className="h-full bg-violet-400" animate={{ width: `${(results.length / METRIC_ITEMS.length) * 100}%` }} />
        </div>
        <motion.div key={combo} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className={`rounded-2xl px-3 py-2 text-sm font-black ${combo >= 3 ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-amber-300'}`}>
          🔥 x{combo}
        </motion.div>
      </div>

      <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-[0_0_40px_rgba(167,139,250,0.12)]">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-md text-center">
              <h3 className="text-3xl font-black text-violet-300">Metric Sorter</h3>
              <p className="mt-3 text-slate-300">
                Metrics stream onto the dashboard. Drop each into the right panel before the timer runs out: <b className="text-cyan-300">host</b>,{' '}
                <b className="text-violet-300">aggregated</b> or <b className="text-amber-300">business</b>. Keys 1, 2, 3 work too.
              </p>
              <button className="mt-6 rounded-2xl bg-violet-400 px-6 py-2 font-bold text-slate-950 hover:bg-violet-300" onClick={start} autoFocus>
                Start the stream
              </button>
            </motion.div>
          )}
          {phase === 'sort' && (
            <motion.div key={item.id} initial={{ opacity: 0, y: -60, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, y: 60 }} className="mx-auto max-w-md text-center">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Incoming metric</div>
              <div className="mt-2 rounded-2xl border border-slate-700 bg-slate-900 px-6 py-6 text-2xl font-black text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)]">{item.text}</div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full transition-[width] duration-100 ${left < 3 ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${(left / CARD_TIME) * 100}%` }} />
              </div>
            </motion.div>
          )}
          {phase === 'feedback' && (
            <motion.div
              key={`fb-${item.id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, x: ok ? 0 : [0, -10, 10, -6, 6, 0] }}
              exit={{ opacity: 0 }}
              className={`mx-auto max-w-md rounded-2xl border-2 p-5 text-center ${ok ? 'border-emerald-400 bg-emerald-400/10' : 'border-rose-400 bg-rose-400/10'}`}
            >
              <div className={`text-2xl font-black ${ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                {ok ? (combo >= 3 ? `Combo x${combo}!` : 'Correct!') : picked ? 'Not quite' : "Time's up!"}
              </div>
              <div className="mt-1 font-bold text-white">
                {item.text} → {METRIC_TYPES.find((m) => m.id === item.type)?.title}
              </div>
              <p className="mt-2 text-sm text-slate-200">{item.why}</p>
              <button className="mt-4 w-full rounded-2xl bg-white/90 py-2 font-bold text-slate-950 hover:bg-white" onClick={next} autoFocus>
                {idx + 1 < METRIC_ITEMS.length ? 'Next metric' : 'See results'}
              </button>
            </motion.div>
          )}
          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-md text-center">
              <h3 className="text-2xl font-black text-amber-300">Dashboard sorted</h3>
              <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }} className="text-6xl font-black text-white">
                {Math.round(score * 100)}%
              </motion.p>
              <p className="mt-2 text-xs text-slate-400">Host = one machine. Aggregated = a whole tier. Business = DAU, retention, revenue.</p>
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

      <div className="mt-3 grid grid-cols-3 gap-3">
        {METRIC_TYPES.map((m, i) => (
          <motion.button
            key={m.id}
            whileHover={phase === 'sort' ? { y: -4 } : {}}
            whileTap={phase === 'sort' ? { scale: 0.95 } : {}}
            onClick={() => answer(m.id)}
            disabled={phase !== 'sort'}
            className="rounded-2xl border-2 border-dashed p-4 text-center transition disabled:opacity-60"
            style={{ borderColor: `${m.color}88`, background: `${m.color}10` }}
          >
            <div className="text-xs font-bold text-slate-500">[{i + 1}]</div>
            <div className="text-lg font-black" style={{ color: m.color }}>
              {m.title}
            </div>
            <div className="text-xs text-slate-400">{m.blurb}</div>
            <div className="mt-2 inline-block rounded-full px-2 text-sm font-bold" style={{ background: `${m.color}33`, color: m.color }}>
              {counts[i]}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
