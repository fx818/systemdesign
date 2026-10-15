import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** Shared chrome for Chapter 2 mini-games: step pill, progress bar and a neon card. */
export function GameFrame({ step, progress, accent = 'amber', extra, children }: {
  step: string; progress: number; accent?: 'amber' | 'cyan' | 'violet' | 'emerald'; extra?: ReactNode; children: ReactNode;
}) {
  const bar = { amber: 'bg-amber-400', cyan: 'bg-cyan-400', violet: 'bg-violet-400', emerald: 'bg-emerald-400' }[accent];
  const glow = { amber: 'rgba(251,191,36,0.12)', cyan: 'rgba(34,211,238,0.12)', violet: 'rgba(167,139,250,0.12)', emerald: 'rgba(52,211,153,0.12)' }[accent];
  return (
    <div className="mx-auto w-full max-w-3xl select-none text-slate-100">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-slate-300">{step}</div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
          <motion.div className={`h-full ${bar}`} animate={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }} />
        </div>
        {extra}
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6" style={{ boxShadow: `0 0 40px ${glow}` }}>{children}</div>
    </div>
  );
}

export function ResultCard({ title, score, note, onFinish }: { title: string; score: number; note: string; onFinish: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
      <h3 className="text-2xl font-black text-amber-300">{title}</h3>
      <p className="mt-1 text-6xl font-black text-white">{Math.round(score * 100)}%</p>
      <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">{note}</p>
      <button className="mt-4 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={onFinish} autoFocus>Finish</button>
    </motion.div>
  );
}

export function Feedback({ ok, partial, children }: { ok: boolean; partial?: boolean; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`mt-4 rounded-2xl border-2 p-4 text-sm ${ok ? 'border-emerald-400 bg-emerald-400/10' : partial ? 'border-amber-400 bg-amber-400/10' : 'border-rose-400 bg-rose-400/10'}`}>
      {children}
    </motion.div>
  );
}

/** Round to 2 decimals for stable scores. */
export const round2 = (v: number) => Math.round(v * 100) / 100;
