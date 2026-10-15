import { describe, expect, it } from 'vitest';
import type { SimConfig } from '@/types/content';
import { createSim } from './engine';
import { goalMeters, missionResult } from './mission';
const cfg: SimConfig = { start: { nodes: [{ id: 'client', kind: 'client', x: 0, y: 0 }, { id: 'web', kind: 'web', x: 100, y: 0 }], edges: [{ from: 'client', to: 'web' }] }, budget: 150, palette: [], events: [{ at: 0, type: 'traffic', rps: 100 }], goals: { durationSec: 1, minUptime: 0.99, maxP95Ms: 200, maxQueue: 10 } };
const state = () => createSim(cfg, cfg.start).step(1);
describe('mission scoring and goal lines', () => {
  it('requires a pass for stars, both efficiency and all lives for three, and accounts for hints', () => {
    expect(missionResult(state(), cfg, 3, 0).stars).toBe(3);
    expect(missionResult(state(), cfg, 3, 1).stars).toBe(2);
    expect(missionResult(state(), cfg, 2, 0).stars).toBe(2);
    expect(missionResult({ ...state(), cost: 145 }, cfg, 2, 0).stars).toBe(1);
    expect(missionResult({ ...state(), cost: 145 }, cfg, 3, 0).stars).toBe(2);
    expect(missionResult({ ...state(), cost: 160 }, cfg, 3, 0)).toMatchObject({ passed: true, withinBudget: false, stars: 1 });
    expect(missionResult(state(), cfg, 0, 0)).toMatchObject({ passed: false, stars: 0, xp: 0 });
    expect(missionResult({ ...state(), dataLoss: true }, cfg, 3, 0).passed).toBe(false);
  });
  it('uses recent uptime for life loss and cumulative uptime for the final goal', () => {
    const s = { ...state(), uptime: 0.95, recentUptime: 1 };
    expect(goalMeters(s, cfg).find(m => m.id === 'uptime')?.failed).toBe(true);
    expect(goalMeters(s, cfg, true).find(m => m.id === 'uptime')?.failed).toBe(false);
    expect(missionResult(s, cfg, 3, 0).passed).toBe(false);
  });
  it('handles zero bounds and exact targets without treating them as absent', () => {
    const config = { ...cfg, goals: { durationSec: 1, maxQueue: 0, minCacheHit: 0 } };
    expect(goalMeters({ ...state(), queueLength: 1 }, config).find(m => m.id === 'queue')?.failed).toBe(true);
    expect(goalMeters(state(), config).find(m => m.id === 'cache')?.failed).toBe(false);
  });
});
