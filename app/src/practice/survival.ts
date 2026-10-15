import { createSim, type SimState } from '@/sim';
import type { ArchGraph, SimConfig } from '@/types/content';
import { allComponents } from './config';
import { seeded } from './puzzle';

export const SURVIVAL_BUDGET = 4500;
export function survivalConfig(graph: ArchGraph): SimConfig {
  return { start: graph, palette: allComponents, locked: ['client'], budget: SURVIVAL_BUDGET,
    events: [{ at: 0, type: 'traffic', rps: 100 }], goals: { durationSec: Number.MAX_SAFE_INTEGER, minUptime: 0.95, maxP95Ms: 500, maxCost: SURVIVAL_BUDGET } };
}
export function createSurvival(graph: ArchGraph, seed: number) {
  const sim = createSim(survivalConfig(graph), graph);
  const random = seeded(seed);
  let wave = 0; let redFor = 0; let ended = false; let revive: { id: string; at: number } | null = null;
  let message = 'Wave 1 · 100 requests/s. Leave room for a failure.';
  const bad = (state: SimState) => state.recentUptime < 0.95 || state.p95 > 500 || state.cost > SURVIVAL_BUDGET || state.dataLoss;
  return {
    get state() { return sim.state; },
    get wave() { return wave + 1; },
    get ended() { return ended; },
    get redFor() { return redFor; },
    get message() { return message; },
    setGraph(next: ArchGraph) { sim.setGraph(next); },
    step(dt = 0.1) {
      if (ended) return sim.state;
      const state = sim.step(Math.min(0.1, Math.max(0, dt)));
      if (revive && sim.time >= revive.at) { sim.apply({ at: sim.time, type: 'revive', target: revive.id }); revive = null; }
      if (sim.time + 1e-8 >= (wave + 1) * 30) {
        wave++;
        const rps = Math.min(Number.MAX_SAFE_INTEGER, 100 * 2 ** Math.min(wave, 46));
        sim.apply({ at: sim.time, type: 'traffic', rps });
        const candidates = Object.values(state.nodes).filter(n => !['client', 'mobile', 'dns', 'logging', 'metrics', 'ci'].includes(n.kind) && n.health !== 'down').sort((a, b) => a.id.localeCompare(b.id));
        const target = candidates[Math.floor(random() * candidates.length)];
        if (target) { sim.apply({ at: sim.time, type: 'kill', target: target.id }); revive = { id: target.id, at: sim.time + 10 }; }
        message = `Wave ${wave + 1} · ${rps.toLocaleString()} requests/s${target ? ` · ${target.label} offline for 10s` : ''}`;
      }
      redFor = bad(sim.state) ? redFor + Math.min(0.1, Math.max(0, dt)) : 0;
      if (redFor >= 5 - 1e-8) ended = true;
      return sim.state;
    },
  };
}
