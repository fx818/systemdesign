import { latencyOf, type LatencyOp } from '../../common/numbers';

/** Track slots: 10^0 ns .. 10^9 ns. */
export const SLOTS = ['1 ns', '10 ns', '100 ns', '1 µs', '10 µs', '100 µs', '1 ms', '10 ms', '100 ms', '1 s'] as const;
/** Operations to place, in a fixed scrambled order. */
export const RACE_OPS: LatencyOp[] = ['seek', 'mem', 'xregion', 'zippy', 'l1', 'dc', 'disk1mb', 'mem1mb'].map(latencyOf);

/** The slot whose decade is closest to the real latency (log10 rounded). */
export const targetSlot = (ns: number) => Math.max(0, Math.min(SLOTS.length - 1, Math.round(Math.log10(ns))));
/** Exact decade: 1 point; one slot off: half a point. */
export const slotPoints = (op: LatencyOp, slot: number) => {
  const d = Math.abs(slot - targetSlot(op.ns));
  return d === 0 ? 1 : d === 1 ? 0.5 : 0;
};
export const raceScore = (placement: Record<string, number>) =>
  Math.round((RACE_OPS.reduce((s, op) => s + (placement[op.id] === undefined ? 0 : slotPoints(op, placement[op.id])), 0) / RACE_OPS.length) * 100) / 100;
