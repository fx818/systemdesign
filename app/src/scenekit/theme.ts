import type { ComponentKind } from '@/types/content';

/** Neon palette (AGENTS.md visual style). */
export const C = {
  bg: '#020617', // slate-950
  panel: '#0f172a', // slate-900
  panel2: '#1e293b', // slate-800
  line: '#334155', // slate-700
  dim: '#64748b', // slate-500
  text: '#e2e8f0', // slate-200
  white: '#f8fafc',
  cyan: '#22d3ee',
  violet: '#a78bfa',
  emerald: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  sky: '#38bdf8',
  orange: '#fb923c',
} as const;

export type NeonColor = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'orange';

/** Default accent per component kind. */
export const KIND_COLOR: Record<ComponentKind, string> = {
  client: C.sky,
  mobile: C.sky,
  dns: C.violet,
  lb: C.cyan,
  web: C.cyan,
  db: C.emerald,
  'db-replica': C.emerald,
  cache: C.amber,
  cdn: C.sky,
  'session-store': C.violet,
  nosql: C.orange,
  queue: C.amber,
  worker: C.cyan,
  datacenter: C.violet,
  shard: C.emerald,
  logging: C.dim,
  metrics: C.rose,
  ci: C.emerald,
  storage: C.orange,
};

/** Default human label per component kind. */
export const KIND_LABEL: Record<ComponentKind, string> = {
  client: 'Web browser',
  mobile: 'Mobile app',
  dns: 'DNS',
  lb: 'Load balancer',
  web: 'Web server',
  db: 'Database',
  'db-replica': 'Replica',
  cache: 'Cache',
  cdn: 'CDN',
  'session-store': 'Session store',
  nosql: 'NoSQL',
  queue: 'Message queue',
  worker: 'Worker',
  datacenter: 'Data center',
  shard: 'Shard',
  logging: 'Logs',
  metrics: 'Metrics',
  ci: 'CI / CD',
  storage: 'Object storage',
};

export const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
