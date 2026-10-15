import type { ComponentKind, Knob } from '@/types/content';

/* ------------------------------- Knob values ------------------------------ */
export type KnobId = Knob['id'];
/** Current values of the lab/mission knobs. Missing ids fall back to defaults. */
export type KnobValues = Partial<Record<KnobId, number | boolean | string>>;

/* ------------------------------- Node state ------------------------------- */
export type Health = 'healthy' | 'degraded' | 'overloaded' | 'down';

export interface NodeState {
  id: string;
  kind: ComponentKind;
  label: string;
  /** effective capacity after knob multipliers (requests/sec). */
  capacity: number;
  /** requests/sec arriving at this node this tick. */
  rps: number;
  /** rps / capacity (can exceed 1). */
  util: number;
  /** requests/sec dropped because util > 1. */
  droppedRps: number;
  health: Health;
  /** dead -> time at which it was killed; replica promotion -> when it finishes. */
  downSince?: number;
  /** replica nodes only: set once promoted to master. */
  promoted?: boolean;
}

/* -------------------------------- Edge flow ------------------------------- */
export interface EdgeFlow {
  from: string;
  to: string;
  /** requests/sec currently crossing this edge (drives dot density). */
  rps: number;
  /** fraction 0..1 of requests on this edge that fail. */
  errorRate: number;
}

/* -------------------------------- Sim state ------------------------------- */
export interface SimState {
  /** seconds since simulation start. */
  t: number;
  /** current offered traffic (requests/sec). */
  rps: number;
  /** cumulative successful / total requests — the headline uptime metric. */
  uptime: number;
  /** uptime over the recent window (~5s), used for red-line checks. */
  recentUptime: number;
  /** estimated p95 latency of a user request this tick (ms). */
  p95: number;
  /** one-off placement cost of everything on the board (credits). */
  cost: number;
  /** cache hit rate this tick (0..1), 0 when no cache. */
  cacheHitRate: number;
  /** messages waiting in the queue. */
  queueLength: number;
  /** async jobs arriving per second. */
  jobsPerSec: number;
  nodes: Record<string, NodeState>;
  flows: EdgeFlow[];
  /** human-readable alerts for this tick ("web-1 overloaded 134%"). */
  alerts: string[];
  /** regions currently knocked out by region-down events. */
  regionsDown: string[];
  /** sticky-session users currently logged out (error spike), 0..1 of traffic. */
  sessionLossRate: number;
  /** true while the DB has unrecoverable data loss (master died, no replica). */
  dataLoss: boolean;
  /** cumulative totals since t=0. */
  totals: { ok: number; total: number };
}

/** What a finished mission reports back. */
export interface SimResult {
  passed: boolean;
  uptime: number;
  p95: number;
  cost: number;
  livesLeft: number;
  stars: number;
  /** Shell-compatible progress and reward fields. */
  goalsMet: boolean;
  withinBudget: boolean;
  xp: number;
}

/* --------------------------------- Helpers -------------------------------- */
export const knobNumber = (knobs: KnobValues | undefined, id: KnobId, fallback: number): number => {
  const v = knobs?.[id];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
};
export const knobBoolean = (knobs: KnobValues | undefined, id: KnobId, fallback: boolean): boolean => {
  const v = knobs?.[id];
  return typeof v === 'boolean' ? v : fallback;
};
export const knobString = (knobs: KnobValues | undefined, id: KnobId, fallback: string): string => {
  const v = knobs?.[id];
  return typeof v === 'string' ? v : fallback;
};
