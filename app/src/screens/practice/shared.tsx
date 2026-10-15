import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { practiceModes } from '@/practice/navigation';

export const action = 'rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-cyan-200 hover:border-cyan-300 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed';
export const panel = 'rounded-2xl border border-slate-800 bg-slate-900/60 p-5';
export function PracticePage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return <div className="space-y-5 pb-10"><header><Link to="/" className="text-xs text-cyan-300">← HQ</Link><p className="mt-4 text-xs font-bold uppercase tracking-widest text-violet-300">Practice / PixelPost</p><h1 className="mt-1 text-3xl font-black text-slate-50">{title}</h1><p className="mt-2 max-w-3xl text-sm text-slate-400">{intro}</p></header><nav aria-label="Practice modes" className="flex flex-wrap gap-2">{practiceModes.map(mode => <Link key={mode.path} className={action} to={mode.path}>{mode.title}</Link>)}</nav>{children}</div>;
}

