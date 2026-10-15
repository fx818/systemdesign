import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { TTL_ITEMS, TTL_OPTIONS, type TtlItem } from '../data';

/** 1 for the best TTL, 0.5 for an acceptable one, 0 otherwise. */
export const ttlPoints = (item: TtlItem, pick: number) => (pick === item.best ? 1 : item.ok.includes(pick) ? 0.5 : 0);
export const ttlScore = (picks: number[]) =>
  Math.round((picks.reduce((s, p, i) => s + ttlPoints(TTL_ITEMS[i], p), 0) / TTL_ITEMS.length) * 100) / 100;

/** Meters shown while sliding: how hard the DB works, how stale users' data gets. */
export const dbLoadFor = (item: TtlItem, pick: number) => Math.min(1, item.reads * (1 - pick / (TTL_OPTIONS.length - 1)) * 1.1);
export const staleFor = (item: TtlItem, pick: number) => Math.min(1, item.churn * (pick / (TTL_OPTIONS.length - 1)) * 1.6);

function Bar({ label, value, tone }: { label: string; value: number; tone: 'rose' | 'violet' }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-bold text-slate-400"><span>{label}</span><span>{Math.round(value * 100)}%</span></div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
        <motion.div className={`h-full ${value > 0.6 ? (tone === 'rose' ? 'bg-rose-400' : 'bg-violet-400') : value > 0.3 ? 'bg-amber-400' : 'bg-emerald-400'}`} animate={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

export default function TtlGoldilocks({ onComplete }: MiniGameProps) {
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState(2);
  const [picks, setPicks] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const finished = useRef(false);
  const done = picks.length === TTL_ITEMS.length && !locked;
  const item = TTL_ITEMS[Math.min(idx, TTL_ITEMS.length - 1)];
  const pts = locked ? ttlPoints(item, pick) : 0;

  const lock = () => {
    setPicks((p) => [...p, pick]);
    setLocked(true);
  };
  const next = () => {
    setLocked(false);
    setPick(2);
    setIdx(idx + 1);
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(ttlScore(picks));
  };
  const db = dbLoadFor(item, pick);
  const stale = staleFor(item, pick);
  const mood = db > 0.6 ? '🥵 too short' : stale > 0.6 ? '🥶 too long' : '😋 just right?';

  return (
    <div className="mx-auto w-full max-w-2xl select-none text-slate-100">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-violet-300">Item {Math.min(idx + 1, TTL_ITEMS.length)}/{TTL_ITEMS.length}</div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
          <motion.div className="h-full bg-amber-400" animate={{ width: `${(picks.length / TTL_ITEMS.length) * 100}%` }} />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-[0_0_40px_rgba(251,191,36,0.12)]">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key={item.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="flex items-center gap-4">
                <div className="text-5xl">{item.emoji}</div>
                <div>
                  <h3 className="text-2xl font-black text-white">{item.name}</h3>
                  <p className="text-sm text-slate-400">{item.detail}</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  {TTL_OPTIONS.map((o, i) => <span key={o} className={i === pick ? 'text-amber-300' : ''}>{o}</span>)}
                </div>
                <input type="range" aria-label="TTL" min={0} max={TTL_OPTIONS.length - 1} step={1} value={pick} disabled={locked}
                  onChange={(e) => setPick(Number(e.target.value))} className="mt-2 w-full accent-amber-400" />
                <div className="mt-1 text-center text-3xl font-black text-amber-300">{TTL_OPTIONS[pick]}</div>
                <div className="text-center text-sm">{mood}</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Bar label="Database reloads" value={db} tone="rose" />
                <Bar label="Stale-data risk" value={stale} tone="violet" />
              </div>
              {!locked ? (
                <button className="mt-6 w-full rounded-2xl bg-amber-400 py-2 font-black text-slate-950 hover:bg-amber-300" onClick={lock}>Lock in TTL</button>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 rounded-2xl border-2 p-4 ${pts === 1 ? 'border-emerald-400 bg-emerald-400/10' : pts > 0 ? 'border-amber-400 bg-amber-400/10' : 'border-rose-400 bg-rose-400/10'}`}>
                  <div className="font-black">{pts === 1 ? 'Just right! +1' : pts > 0 ? `Okay (+½). Best: ${TTL_OPTIONS[item.best]}` : `Not great. Best: ${TTL_OPTIONS[item.best]}`}</div>
                  <p className="mt-1 text-sm text-slate-200">{item.why}</p>
                  <button className="mt-3 w-full rounded-2xl bg-white/90 py-2 font-bold text-slate-950" onClick={next} autoFocus>
                    {idx + 1 < TTL_ITEMS.length ? 'Next item' : 'See results'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <h3 className="text-2xl font-black text-amber-300">Goldilocks report</h3>
              <p className="mt-1 text-6xl font-black text-white">{Math.round(ttlScore(picks) * 100)}%</p>
              <p className="mt-3 text-xs text-slate-400">Too short: the database reloads constantly. Too long: stale data. Match the TTL to how often the data changes.</p>
              <button className="mt-4 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950" onClick={finish} autoFocus>Finish</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
