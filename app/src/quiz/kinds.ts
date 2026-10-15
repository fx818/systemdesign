/**
 * Visual metadata for architecture component kinds (MiniDiagram) and quiz
 * question kinds (badges). Pure data, no React.
 */
import type { ComponentKind, QuizQuestion } from '@/types/content';

export interface KindMeta {
  icon: string; // lucide icon name
  /** neon accent classes: [border+text when idle, border+bg+glow when active] */
  accent: string;
  active: string;
}

const GROUPS: Record<string, Omit<KindMeta, 'active'>> = {
  edge: { icon: 'user', accent: 'border-violet-400/50 text-violet-300' },
  network: { icon: 'globe', accent: 'border-cyan-400/50 text-cyan-300' },
  compute: { icon: 'server', accent: 'border-slate-500 text-slate-200' },
  data: { icon: 'database', accent: 'border-amber-400/50 text-amber-300' },
  fast: { icon: 'zap', accent: 'border-emerald-400/50 text-emerald-300' },
  flow: { icon: 'git-branch', accent: 'border-rose-400/50 text-rose-300' },
};

const KIND_META: Record<ComponentKind, KindMeta> = {
  client: { ...GROUPS.edge, icon: 'user', active: 'border-violet-300 bg-violet-400/25 text-violet-100' },
  mobile: { ...GROUPS.edge, icon: 'smartphone', active: 'border-violet-300 bg-violet-400/25 text-violet-100' },
  dns: { ...GROUPS.network, icon: 'globe', active: 'border-cyan-300 bg-cyan-400/25 text-cyan-100' },
  lb: { ...GROUPS.network, icon: 'scale', active: 'border-cyan-300 bg-cyan-400/25 text-cyan-100' },
  web: { ...GROUPS.compute, icon: 'server', active: 'border-slate-300 bg-slate-400/25 text-slate-50' },
  db: { ...GROUPS.data, icon: 'database', active: 'border-amber-300 bg-amber-400/25 text-amber-100' },
  'db-replica': { ...GROUPS.data, icon: 'copy', active: 'border-amber-300 bg-amber-400/25 text-amber-100' },
  cache: { ...GROUPS.fast, icon: 'zap', active: 'border-emerald-300 bg-emerald-400/25 text-emerald-100' },
  cdn: { ...GROUPS.fast, icon: 'radio', active: 'border-emerald-300 bg-emerald-400/25 text-emerald-100' },
  'session-store': { ...GROUPS.fast, icon: 'key-round', active: 'border-emerald-300 bg-emerald-400/25 text-emerald-100' },
  nosql: { ...GROUPS.data, icon: 'layers', active: 'border-amber-300 bg-amber-400/25 text-amber-100' },
  queue: { ...GROUPS.flow, icon: 'inbox', active: 'border-rose-300 bg-rose-400/25 text-rose-100' },
  worker: { ...GROUPS.compute, icon: 'cog', active: 'border-slate-300 bg-slate-400/25 text-slate-50' },
  datacenter: { ...GROUPS.compute, icon: 'building-2', active: 'border-slate-300 bg-slate-400/25 text-slate-50' },
  shard: { ...GROUPS.data, icon: 'scissors', active: 'border-amber-300 bg-amber-400/25 text-amber-100' },
  logging: { ...GROUPS.flow, icon: 'file-text', active: 'border-rose-300 bg-rose-400/25 text-rose-100' },
  metrics: { ...GROUPS.flow, icon: 'activity', active: 'border-rose-300 bg-rose-400/25 text-rose-100' },
  ci: { ...GROUPS.flow, icon: 'git-branch', active: 'border-rose-300 bg-rose-400/25 text-rose-100' },
  storage: { ...GROUPS.data, icon: 'hard-drive', active: 'border-amber-300 bg-amber-400/25 text-amber-100' },
};

export function kindMeta(kind: ComponentKind): KindMeta {
  return KIND_META[kind] ?? { ...GROUPS.compute, active: 'border-slate-300 bg-slate-400/25 text-slate-50' };
}

/** Badge styling for each question kind (shown in the question header). */
export const QUESTION_KIND_BADGE: Record<QuizQuestion['kind'], string> = {
  mcq: 'text-cyan-300 border-cyan-400/40',
  multi: 'text-violet-300 border-violet-400/40',
  order: 'text-emerald-300 border-emerald-400/40',
  truefalse: 'text-amber-300 border-amber-400/40',
  bins: 'text-rose-300 border-rose-400/40',
  numeric: 'text-cyan-300 border-cyan-400/40',
  spot: 'text-violet-300 border-violet-400/40',
  label: 'text-emerald-300 border-emerald-400/40',
};

/** Short human label per question kind (a11y + review list). */
export const QUESTION_KIND_LABEL: Record<QuizQuestion['kind'], string> = {
  mcq: 'Multiple choice',
  multi: 'Pick all that apply',
  order: 'Put in order',
  truefalse: 'True or false',
  bins: 'Sort into bins',
  numeric: 'Calculate',
  spot: 'Spot it on the diagram',
  label: 'Label the diagram',
};
