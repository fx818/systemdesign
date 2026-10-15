/** Shared literals for Level 10 (message queue): scene, quiz and mini-game. */

/** The photo customization jobs from the book's example (p. 26). */
export const FILTERS = ['crop', 'sharpen', 'blur'] as const;

/* ------------------------- Worker Shift Manager model ------------------------- */
/** Jobs per second each worker processes. */
export const WORKER_RATE = 4;
/** Credits per worker per second. */
export const WORKER_COST = 1;
/** Queue length above which uploads count as "slow" (SLA breach). */
export const RED_LINE = 60;
export const MAX_QUEUE = 120;
export const GAME_SECONDS = 60;
export const MIN_WORKERS = 1;
export const MAX_WORKERS = 12;

/** Upload jobs per second at second `s` of the shift: calm, two bursts, a lull and a final rush. */
export function arrivals(s: number): number {
  if (s < 10) return 8;
  if (s < 20) return 30; // filter launch burst
  if (s < 30) return 12;
  if (s < 38) return 4; // lunch lull: queue empty, workers idle
  if (s < 50) return 40; // evening rush
  return 10;
}

export interface ShiftState { queue: number; slaSec: number; cost: number; t: number }

/** Advance the shift by `dt` seconds with `workers` running. Pure. */
export function stepShift(s: ShiftState, workers: number, dt: number): ShiftState {
  const inflow = arrivals(s.t) * dt;
  const outflow = workers * WORKER_RATE * dt;
  const queue = Math.min(MAX_QUEUE, Math.max(0, s.queue + inflow - outflow));
  return { queue, t: s.t + dt, cost: s.cost + workers * WORKER_COST * dt, slaSec: s.slaSec + (queue <= RED_LINE ? dt : 0) };
}

/** Cheapest cost that could hold the SLA all shift: exact demand, served just in time. */
export const IDEAL_COST = Array.from({ length: GAME_SECONDS }, (_, s) => Math.max(MIN_WORKERS, Math.ceil(arrivals(s) / WORKER_RATE))).reduce((a, b) => a + b, 0) * WORKER_COST;

/** 0..1 score: 70% SLA (time under the red line), 30% cost efficiency. */
export function shiftScore(s: ShiftState): number {
  const sla = Math.min(1, s.slaSec / GAME_SECONDS);
  const eff = s.cost <= 0 ? 0 : Math.min(1, IDEAL_COST / s.cost);
  return Math.round((0.7 * sla + 0.3 * eff * sla) * 100) / 100;
}
