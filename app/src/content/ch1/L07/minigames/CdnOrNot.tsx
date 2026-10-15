import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cloud, Server } from 'lucide-react';
import type { MiniGameProps } from '@/types/content';
import { ASSETS, type Asset, type AssetVerdict } from '../data';

export interface Pick { id: string; pick: AssetVerdict }

/** CDN bill and speed-up for a set of picks. */
export function cdnMeters(assets: Asset[], picks: Pick[]) {
  let bill = 0;
  let speed = 0;
  for (const p of picks) {
    const a = assets.find((x) => x.id === p.id);
    if (a && p.pick === 'cdn') {
      bill += a.cost;
      speed += a.benefit;
    }
  }
  return { bill, speed };
}
export const MAX_SPEED = ASSETS.reduce((s, a) => s + a.benefit, 0);
export const BUDGET = 30;

/** 0..1: share of correct verdicts, minus 20% if the final bill busts the budget. */
export function cdnOrNotScore(assets: Asset[], picks: Pick[]): number {
  if (!assets.length) return 0;
  const correct = picks.filter((p) => assets.find((a) => a.id === p.id)?.answer === p.pick).length;
  const over = cdnMeters(assets, picks).bill > BUDGET ? 0.2 : 0;
  return Math.max(0, Math.round((correct / assets.length - over) * 100) / 100);
}

function Bar({ label, value, max, color, warn }: { label: string; value: number; max: number; color: string; warn?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className={warn ? 'font-bold text-rose-300' : ''}>{value}{label.includes('bill') ? ` / ${max} cr` : ''}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
        <motion.div className={`h-full rounded-full ${warn ? 'bg-rose-400' : color}`} animate={{ width: `${Math.min(100, (value / max) * 100)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 14 }} />
      </div>
    </div>
  );
}

export default function CdnOrNot({ onComplete }: MiniGameProps) {
  const [i, setI] = useState(-1);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; why: string } | null>(null);
  const doneRef = useRef(false);
  const asset = ASSETS[i];
  const { bill, speed } = cdnMeters(ASSETS, picks);
  const score = cdnOrNotScore(ASSETS, picks);
  const done = i >= ASSETS.length;

  const choose = (pick: AssetVerdict) => {
    if (!asset || feedback) return;
    setPicks((p) => [...p, { id: asset.id, pick }]);
    setFeedback({ ok: pick === asset.answer, why: asset.why });
  };
  const next = () => {
    setFeedback(null);
    setI((n) => n + 1);
  };
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete(score);
  };

  return (
    <div className="mx-auto w-full max-w-3xl select-none text-slate-100">
      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2">
        <Bar label="Monthly CDN bill" value={bill} max={BUDGET} color="bg-amber-400" warn={bill > BUDGET} />
        <Bar label="Global speed-up" value={speed} max={MAX_SPEED} color="bg-emerald-400" />
      </div>

      {i < 0 && (
        <div className="rounded-2xl border border-sky-400/40 bg-slate-900 p-6 text-center">
          <h3 className="text-2xl font-black text-sky-300">CDN or Not?</h3>
          <p className="mt-2 text-slate-300">
            Six PixelPost files. For each one, decide: serve it from the <b>CDN</b>, or keep it on the <b>origin</b>.
            The CDN charges for data in and out, and your budget is {BUDGET} credits a month.
          </p>
          <button className="mt-4 rounded-2xl bg-sky-400 px-6 py-2 font-bold text-slate-950 hover:bg-sky-300" onClick={() => setI(0)} autoFocus>
            Start
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {asset && (
          <motion.div key={asset.id} initial={{ opacity: 0, y: 40, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, x: -80 }}
            className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">File {i + 1} of {ASSETS.length}</div>
            <h3 className="mt-1 text-2xl font-black">{asset.name}</h3>
            <p className="font-mono text-sm text-slate-400">{asset.detail}</p>
            {!feedback ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => choose('cdn')}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-4 py-3 font-bold text-slate-950">
                  <Cloud size={18} /> Put on CDN
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => choose('origin')}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-400 px-4 py-3 font-bold text-cyan-200">
                  <Server size={18} /> Keep on origin
                </motion.button>
              </div>
            ) : (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-5">
                <p className={`text-lg font-black ${feedback.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{feedback.ok ? 'Good call!' : 'Not quite.'}</p>
                <p className="mt-1 text-slate-300">{feedback.why}</p>
                <button className="mt-4 rounded-2xl bg-slate-100 px-5 py-2 font-bold text-slate-950" onClick={next} autoFocus>
                  {i + 1 < ASSETS.length ? 'Next file' : 'See results'}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {done && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl border border-emerald-400/40 bg-slate-900 p-6 text-center">
          <h3 className="text-2xl font-black text-emerald-300">CDN plan ready</h3>
          <p className="mt-1 text-5xl font-black">{Math.round(score * 100)}%</p>
          <p className="mt-2 text-slate-300">Static and popular goes on the edge. Rarely used or dynamic stays on the origin.</p>
          <button className="mt-4 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950" onClick={finish} autoFocus>
            Finish
          </button>
        </motion.div>
      )}
    </div>
  );
}
