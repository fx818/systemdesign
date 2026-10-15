// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { levelsInChapter } from '@/content/registry';
import type { ArchGraph, ComponentKind, LevelDef, SimConfig } from '@/types/content';
import { createSim, initialKnobs } from '@/sim';
import { goalMeters, missionResult } from '@/sim/mission';
import type { KnobValues } from '@/sim/types';

/** Editing helpers limited to what a player can do: place palette items and wire them. */
function board(config: SimConfig) {
  const graph = structuredClone(config.start);
  const add = (id: string, kind: ComponentKind) => { graph.nodes.push({ id, kind, label: id, x: 640, y: 360 }); return id; };
  const wire = (from: string, to: string) => { if (!graph.edges.some((e) => e.from === from && e.to === to)) graph.edges.push({ from, to }); };
  const has = (id: string) => graph.nodes.some((n) => n.id === id);
  const webs = () => graph.nodes.filter((n) => n.kind === 'web').map((n) => n.id);
  /** Add web servers until the pool has `total`, wired like the existing ones. */
  const growWebs = (total: number) => {
    for (let i = webs().length + 1; i <= total; i++) {
      const id = add(`web-${i}`, 'web');
      wire('lb', id);
      for (const target of ['cache', 'db']) if (has(target)) wire(id, target);
    }
  };
  const addCache = () => { add('cache', 'cache'); for (const w of webs()) wire(w, 'cache'); };
  return { graph, add, wire, webs, growWebs, addCache };
}

/** The "good estimate" plan for each mission. */
export function plan(level: LevelDef, servers?: number): { graph: ArchGraph; knobs: KnobValues } {
  const config = level.mission.config;
  const b = board(config);
  const knobs = initialKnobs(config);
  switch (level.id) {
    case 'C2L01': b.growWebs(servers ?? 5); break;
    case 'C2L02': b.addCache(); break;
    case 'C2L03': b.growWebs(servers ?? 4); break;
    case 'C2L04': b.addCache(); b.growWebs(servers ?? 6); break;
  }
  return { graph: b.graph, knobs };
}

/** Mirrors SimRunner: 100 ms ticks, recent-window meters, 3 s red-line grace, 3 lives. */
export function play(config: SimConfig, graph: ArchGraph, knobs?: KnobValues) {
  const sim = createSim(config, graph, knobs);
  let lives = 3, redFor = 0, peakCost = sim.state.cost;
  while (sim.time < config.goals.durationSec - 1e-8 && lives > 0) {
    const dt = Math.min(0.1, config.goals.durationSec - sim.time);
    const state = sim.step(dt);
    peakCost = Math.max(peakCost, state.cost);
    const failed = goalMeters(state, config, true).filter((m) => m.failed);
    redFor = failed.length || state.dataLoss ? redFor + dt : 0;
    if (redFor >= 3 - 1e-8) { lives--; redFor = 0; }
  }
  return { result: missionResult(sim.state, config, lives, 0), state: sim.state, peakCost };
}

const levels = levelsInChapter(2);

describe('chapter 2 missions are estimation puzzles', () => {
  it('discovers the chapter', () => expect(levels.map((l) => l.id)).toEqual(['C2L01', 'C2L02', 'C2L03', 'C2L04'].slice(0, levels.length)));

  for (const level of levels) {
    it(`${level.id}: the estimated plan wins with 2+ stars inside the budget`, () => {
      const config = level.mission.config;
      const { graph, knobs } = plan(level);
      for (const n of graph.nodes.filter((n) => !config.start.nodes.some((s) => s.id === n.id))) expect(config.palette).toContain(n.kind);
      const run = play(config, graph, knobs);
      expect(run.result.passed, JSON.stringify(run.result)).toBe(true);
      expect(run.result.stars).toBeGreaterThanOrEqual(2);
      expect(run.peakCost).toBeLessThanOrEqual(config.budget * 0.85);
      expect(config.budget).toBeLessThanOrEqual(run.peakCost * 1.25);
    });

    it(`${level.id}: doing nothing loses`, () => {
      expect(play(level.mission.config, level.mission.config.start).result.passed).toBe(false);
    });

    it(`${level.id}: the lab is healthy at rest and chaos breaks it`, () => {
      const config = level.lab.config;
      const knobs = initialKnobs(config);
      const healthy = play(config, config.start, knobs);
      expect(healthy.result.passed, JSON.stringify(healthy.result)).toBe(true);
      expect(healthy.peakCost).toBeLessThanOrEqual(config.budget);
      const broken = { ...config, events: [...config.events, ...config.start.nodes.filter((n) => n.kind === 'web').map((n) => ({ at: 0, type: 'kill' as const, target: n.id }))] };
      expect(play(broken, config.start, knobs).result.passed).toBe(false);
    }, 20_000);
  }

  const byId = (id: string) => levels.find((l) => l.id === id);

  it('C2L01: rounding 4,096 down to four servers drops requests', () => {
    const level = byId('C2L01');
    if (!level) return;
    expect(play(level.mission.config, plan(level, 4).graph).result.passed).toBe(false);
  });

  it('C2L02: replicas spread disk reads but cannot reach memory latency', () => {
    const level = byId('C2L02');
    if (!level) return;
    const b = board(level.mission.config);
    for (const id of ['replica-1', 'replica-2']) { b.add(id, 'db-replica'); b.wire('db', id); for (const w of b.webs()) b.wire(w, id); }
    expect(play(level.mission.config, b.graph).result.passed).toBe(false);
  });

  it('C2L03: exactly N servers (no spare) breaks the 99.9% SLA', () => {
    const level = byId('C2L03');
    if (!level) return;
    expect(play(level.mission.config, plan(level, 3).graph).result.passed).toBe(false);
  });

  it('C2L04: 5 servers, or no cache, both fail; replicas instead of a cache bust the budget', () => {
    const level = byId('C2L04');
    if (!level) return;
    const config = level.mission.config;
    expect(play(config, plan(level, 5).graph).result.passed).toBe(false);
    const noCache = board(config); noCache.growWebs(6);
    expect(play(config, noCache.graph).result.passed).toBe(false);
    const replicas = board(config); replicas.growWebs(6);
    for (const id of ['r1', 'r2', 'r3']) { replicas.add(id, 'db-replica'); replicas.wire('db', id); for (const w of replicas.webs()) replicas.wire(w, id); }
    const run = play(config, replicas.graph);
    expect(run.result.withinBudget).toBe(false);
    expect(run.result.passed).toBe(false);
  });
});
