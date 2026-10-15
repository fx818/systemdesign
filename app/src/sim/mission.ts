import type { SimConfig } from '@/types/content';
import type { SimResult, SimState } from './types';

export interface GoalMeter { id: string; label: string; value: number; target?: number; unit: string; minimum?: boolean; failed: boolean }
export function goalMeters(state: SimState, config: SimConfig, recent = false): GoalMeter[] {
  const g = config.goals;
  return [
    { id: 'uptime', label: recent ? 'Uptime · last 5s' : 'Uptime', value: (recent ? state.recentUptime : state.uptime) * 100, target: g.minUptime === undefined ? undefined : g.minUptime * 100, unit: '%', minimum: true },
    { id: 'latency', label: 'p95 latency', value: state.p95, target: g.maxP95Ms, unit: 'ms' },
    { id: 'cost', label: 'Cloud credits', value: state.cost, target: Math.min(config.budget, g.maxCost ?? Infinity), unit: 'cr' },
    { id: 'queue', label: 'Queued jobs', value: state.queueLength, target: g.maxQueue, unit: 'jobs' },
    { id: 'cache', label: 'Cache hit rate', value: state.cacheHitRate * 100, target: g.minCacheHit === undefined ? undefined : g.minCacheHit * 100, unit: '%', minimum: true },
  ].map(m => ({ ...m, failed: m.target !== undefined && (m.minimum ? m.value + 1e-8 < m.target : m.value - 1e-8 > m.target) }));
}
export function missionResult(state: SimState, config: SimConfig, lives: number, hints: number): SimResult {
  const meters = goalMeters(state, config);
  const goalsMet = lives > 0 && !state.dataLoss && meters.filter(m => m.id !== 'cost').every(m => !m.failed);
  const withinBudget = !meters.find(m => m.id === 'cost')!.failed;
  const efficient = state.cost <= config.budget * 0.85;
  const noLifeLost = lives === 3;
  const stars = !goalsMet ? 0 : withinBudget && efficient && noLifeLost && hints === 0 ? 3 : withinBudget && (efficient || noLifeLost) ? 2 : 1;
  return { passed: goalsMet, goalsMet, withinBudget, uptime: state.uptime, p95: state.p95, cost: state.cost, livesLeft: lives, stars, xp: goalsMet ? 100 + stars * 25 : 0 };
}
