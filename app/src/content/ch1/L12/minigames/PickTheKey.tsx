import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { KEY_SCENARIOS } from '../data';

/** 1 point for the best key on the first try, 0.5 on the second, 0 after that. */
export function keyScore(triesPerScenario: number[]): number {
  if (!KEY_SCENARIOS.length) return 0;
  const pts = triesPerScenario.reduce((s, n) => s + (n === 1 ? 1 : n === 2 ? 0.5 : 0), 0);
  return Math.round((pts / KEY_SCENARIOS.length) * 100) / 100;
}

function Histogram({ dist }: { dist: number[] }) {
  const hi = Math.max(...dist);
  return (
    <div className="flex h-40 items-end gap-3 rounded-2xl bg-slate-900/60 p-3">
      {dist.map((d, i) => {
        const hot = d === hi && hi > 0.4;
        return (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className={`text-xs font-bold ${hot ? 'text-rose-300' : 'text-slate-300'}`}>{Math.round(d * 100)}%</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(2, (d / Math.max(hi, 0.01)) * 100)}px` }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className={`w-full rounded-t-lg ${hot ? 'bg-rose-400 shadow-[0_0_20px_rgba(251,113,133,0.7)]' : 'bg-emerald-400'}`}
            />
            <span className="text-[10px] text-slate-500">shard {i}</span>
            {hot && <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}>🔥</motion.span>}
          </div>
        );
      })}
    </div>
  );
}

export default function PickTheKey({ onComplete }: MiniGameProps) {
  const [idx, setIdx] = useState(0);
  const [tries, setTries] = useState<number[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [done, setDone] = useState(false);
  const finished = useRef(false);
  const sc = KEY_SCENARIOS[idx];
  const last = sc.options.find((o) => o.id === picked[picked.length - 1]);
  const score = keyScore(tries);

  const pick = (id: string) => {
    if (solved || picked.includes(id)) return;
    const next = [...picked, id];
    setPicked(next);
    if (id === sc.best) {
      setSolved(true);
      setTries((t) => [...t, next.length]);
    }
  };
  const advance = () => {
    if (idx + 1 < KEY_SCENARIOS.length) {
      setIdx(idx + 1);
      setPicked([]);
      setSolved(false);
    } else setDone(true);
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };

  if (done)
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center text-slate-100">
        <h3 className="text-2xl font-black text-amber-300">Key master report</h3>
        <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }} className="text-6xl font-black text-white">
          {Math.round(score * 100)}%
        </motion.p>
        <p className="mt-2 text-sm text-slate-400">A good sharding key spreads data evenly and lets each query go straight to one shard.</p>
        <button className="mt-4 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>
          Finish
        </button>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-4xl select-none text-slate-100">
      <div className="mb-3 flex items-center gap-2">
        {KEY_SCENARIOS.map((s, i) => (
          <div key={s.id} className={`h-2 flex-1 rounded-full ${i < idx || (i === idx && solved) ? 'bg-emerald-400' : i === idx ? 'bg-cyan-400/50' : 'bg-slate-800'}`} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={sc.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-violet-300">
            Scenario {idx + 1}/{KEY_SCENARIOS.length}
          </div>
          <h3 className="text-2xl font-black text-white">{sc.title}</h3>
          <p className="mt-1 text-slate-300">{sc.story}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="grid grid-cols-2 gap-2">
              {sc.options.map((o) => {
                const tried = picked.includes(o.id);
                const good = tried && o.id === sc.best;
                return (
                  <motion.button
                    key={o.id}
                    aria-label={`Shard by ${o.key}`}
                    whileHover={!tried && !solved ? { y: -3 } : {}}
                    whileTap={{ scale: 0.95 }}
                    animate={tried && !good ? { x: [0, -6, 6, 0] } : {}}
                    onClick={() => pick(o.id)}
                    disabled={tried || solved}
                    className={`rounded-2xl border-2 p-3 text-left font-mono text-sm font-bold ${
                      good ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : tried ? 'border-rose-400/60 bg-rose-400/10 text-rose-200' : 'border-slate-700 bg-slate-900 hover:border-cyan-400'
                    }`}
                  >
                    🔑 {o.key}
                  </motion.button>
                );
              })}
            </div>
            <div>
              {last ? <Histogram key={last.id} dist={last.dist} /> : <div className="flex h-40 items-center justify-center rounded-2xl bg-slate-900/60 text-sm text-slate-500">Pick a key to see how data spreads</div>}
              {last && (
                <motion.p key={`v-${last.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-2 text-sm ${last.id === sc.best ? 'text-emerald-200' : 'text-rose-200'}`}>
                  {last.verdict}
                </motion.p>
              )}
            </div>
          </div>
          {solved && (
            <div className="mt-4 text-right">
              <button className="rounded-2xl bg-cyan-400 px-6 py-2 font-bold text-slate-950 hover:bg-cyan-300" onClick={advance} autoFocus>
                {idx + 1 < KEY_SCENARIOS.length ? 'Next scenario' : 'See results'}
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
