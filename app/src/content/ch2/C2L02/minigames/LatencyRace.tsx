import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { formatNs, humanScaled } from '../../common/numbers';
import { GameFrame, ResultCard } from '../../common/ui';
import { RACE_OPS, SLOTS, raceScore, slotPoints, targetSlot } from './latencyRace';

const KIND_STYLE = {
  cpu: 'border-cyan-400 text-cyan-200',
  memory: 'border-emerald-400 text-emerald-200',
  network: 'border-violet-400 text-violet-200',
  disk: 'border-rose-400 text-rose-200',
} as const;

export default function LatencyRace({ onComplete }: MiniGameProps) {
  const [placement, setPlacement] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);
  const finished = useRef(false);
  const pool = RACE_OPS.filter((op) => placement[op.id] === undefined);
  const placedCount = RACE_OPS.length - pool.length;
  const score = raceScore(placement);

  const place = (slot: number) => {
    if (!selected || checked) return;
    setPlacement((p) => ({ ...p, [selected]: slot }));
    setSelected(null);
  };
  const unplace = (id: string) => {
    if (checked) return;
    setPlacement((p) => { const n = { ...p }; delete n[id]; return n; });
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };

  if (done) {
    return (
      <GameFrame step="Results" progress={1} accent="violet">
        <ResultCard title="Race report" score={score} onFinish={finish}
          note="Memory sits in nanoseconds, compression in microseconds, disks and oceans in milliseconds. Each slot is 10× slower than the last." />
      </GameFrame>
    );
  }

  return (
    <GameFrame step={checked ? 'Photo finish' : `Placed ${placedCount}/${RACE_OPS.length}`} progress={checked ? 1 : placedCount / RACE_OPS.length} accent="violet">
      <p className="text-sm text-slate-400">
        {checked ? 'Here is the real race, fastest on the left.' : 'Pick an operation, then drop it on the track where its latency belongs. Each slot is 10× slower than the one before.'}
      </p>
      {!checked && (
        <div className="mt-4 flex min-h-14 flex-wrap gap-2">
          {pool.map((op) => (
            <button key={op.id} aria-label={`Select ${op.name}`} onClick={() => setSelected(op.id)}
              className={`rounded-2xl border-2 bg-slate-900 px-3 py-2 text-sm font-bold ${KIND_STYLE[op.kind]} ${selected === op.id ? 'ring-4 ring-amber-400/60' : ''}`}>
              {op.short}
            </button>
          ))}
          {!pool.length && <span className="text-sm text-emerald-300">All placed. Check the photo finish!</span>}
        </div>
      )}
      <div className="mt-5 overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-10 gap-1">
          {SLOTS.map((s, i) => (
            <div key={s} className="flex flex-col items-stretch gap-1">
              <button aria-label={`Place at ${s}`} onClick={() => place(i)} disabled={!selected || checked}
                className={`rounded-xl border py-2 text-xs font-black ${selected && !checked ? 'border-amber-400 bg-amber-400/10 text-amber-200 hover:bg-amber-400/25' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>
                {s}
              </button>
              {RACE_OPS.filter((op) => (checked ? targetSlot(op.ns) : placement[op.id]) === i).map((op) => {
                const pts = slotPoints(op, placement[op.id] ?? -9);
                return (
                  <motion.button key={op.id} layout onClick={() => unplace(op.id)} aria-label={`Remove ${op.name}`}
                    className={`rounded-lg border bg-slate-950 px-1 py-1 text-[10px] font-bold leading-tight ${checked ? (pts === 1 ? 'border-emerald-400 text-emerald-200' : pts > 0 ? 'border-amber-400 text-amber-200' : 'border-rose-400 text-rose-200') : KIND_STYLE[op.kind]}`}>
                    {op.short}
                    {checked && <span className="block font-mono text-[10px] text-slate-400">{formatNs(op.ns)}</span>}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {checked && (
        <div className="mt-5 space-y-1">
          {[...RACE_OPS].sort((a, b) => a.ns - b.ns).map((op) => (
            <div key={op.id} className="flex items-center gap-2 text-xs">
              <span className="w-36 truncate text-slate-300">{op.short}</span>
              <div className="h-2 flex-1 rounded-full bg-slate-800">
                <motion.div className="h-2 rounded-full bg-violet-400" initial={{ width: 0 }} animate={{ width: `${((Math.log10(op.ns) + 1) / 10) * 100}%` }} />
              </div>
              <span className="w-28 text-right text-slate-400">if 1 ns = 1 s: {humanScaled(op.ns)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5">
        {!checked ? (
          <button className="w-full rounded-2xl bg-violet-400 py-2 font-black text-slate-950 disabled:opacity-40" disabled={pool.length > 0} onClick={() => setChecked(true)}>Check the photo finish</button>
        ) : (
          <button className="w-full rounded-2xl bg-white/90 py-2 font-bold text-slate-950" onClick={() => setDone(true)} autoFocus>See results ({Math.round(score * 100)}%)</button>
        )}
      </div>
    </GameFrame>
  );
}
