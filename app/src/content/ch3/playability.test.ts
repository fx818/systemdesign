// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { ArchGraph, ComponentKind, LevelDef, SimConfig } from '@/types/content';
import { createSim, initialKnobs } from '@/sim';
import { goalMeters, missionResult } from '@/sim/mission';
import type { KnobValues } from '@/sim/types';

const mods = import.meta.glob<{ default: LevelDef }>('./C3L*/index.ts', { eager: true });
const levels = Object.values(mods).map((m) => m.default).sort((a, b) => a.number - b.number);
const byId = (id: string) => levels.find((l) => l.id === id)!;

/** Legal edits only: palette placements, wires, removals of unlocked nodes, visible knobs. */
function board(config: SimConfig) {
  const graph = structuredClone(config.start);
  const add = (id: string, kind: ComponentKind) => {
    graph.nodes.push({ id, kind, label: id, x: 640, y: 360 });
    return id;
  };
  const wire = (from: string, to: string) => {
    if (!graph.edges.some((e) => e.from === from && e.to === to)) graph.edges.push({ from, to });
  };
  const webs = () => graph.nodes.filter((n) => n.kind === 'web').map((n) => n.id);
  return { graph, add, wire, webs };
}

/** The step-2 news feed blueprint: LB, web tier, cache in front of the post DB, fan-out queue + workers. */
function newsFeed(b: ReturnType<typeof board>, webs: number, workers: number) {
  b.add('lb', 'lb'); b.wire('client', 'lb'); b.wire('mobile', 'lb');
  b.add('cache', 'cache'); b.add('db', 'db'); b.wire('cache', 'db');
  b.add('queue', 'queue');
  for (let i = 1; i <= webs; i++) {
    const id = b.add(`web-${i}`, 'web');
    b.wire('lb', id); b.wire(id, 'cache'); b.wire(id, 'queue');
  }
  for (let i = 1; i <= workers; i++) b.wire('queue', b.add(`worker-${i}`, 'worker'));
}

/** C3L03: the two deep-dive fixes, a feed cache (retrieval) and extra fan-out workers (publishing). */
function deepDive(b: ReturnType<typeof board>, cache: boolean, extraWorkers: number) {
  if (cache) {
    b.add('cache', 'cache'); b.wire('cache', 'db');
    for (const w of b.webs()) b.wire(w, 'cache');
  }
  for (let i = 0; i < extraWorkers; i++) b.wire('queue', b.add(`worker-x${i}`, 'worker'));
}

/** C3L04: more web servers for the crash + next scale curve, a replica for failover, monitoring for operations. */
function wrapUp(b: ReturnType<typeof board>, extraWebs: number, replica: boolean) {
  for (let i = 0; i < extraWebs; i++) {
    const id = b.add(`web-x${i}`, 'web'); b.wire('lb', id); b.wire(id, 'cache');
  }
  if (replica) { b.add('replica', 'db-replica'); b.wire('db', 'replica'); }
  b.add('metrics', 'metrics'); b.add('logging', 'logging');
  for (const w of b.webs()) { b.wire(w, 'metrics'); b.wire(w, 'logging'); }
}

interface Plan { graph: ArchGraph; knobs: KnobValues }

/** The hinted, intended solution for each mission. */
function solution(level: LevelDef): Plan {
  const config = level.mission.config;
  const b = board(config);
  const knobs = initialKnobs(config);
  switch (level.id) {
    case 'C3L01':
      b.add('web-1', 'web'); b.add('db', 'db');
      b.wire('client', 'web-1'); b.wire('mobile', 'web-1'); b.wire('web-1', 'db');
      break;
    case 'C3L02':
      newsFeed(b, 4, 4);
      break;
    case 'C3L03':
      deepDive(b, true, 2);
      break;
    case 'C3L04':
      wrapUp(b, 3, true);
      break;
  }
  return { graph: b.graph, knobs };
}

/** Same rules as SimRunner: 100 ms ticks, recent-window meters, 3 s breach grace, 3 lives. */
function play(config: SimConfig, graph: ArchGraph, knobs?: KnobValues) {
  const sim = createSim(config, graph, knobs);
  let lives = 3, redFor = 0, peakCost = sim.state.cost, peakQueue = 0;
  const breaches: { t: number; meters: string[] }[] = [];
  while (sim.time < config.goals.durationSec - 1e-8 && lives > 0) {
    const dt = Math.min(0.1, config.goals.durationSec - sim.time);
    const state = sim.step(dt);
    peakCost = Math.max(peakCost, state.cost);
    peakQueue = Math.max(peakQueue, state.queueLength);
    const failed = goalMeters(state, config, true).filter((m) => m.failed).map((m) => m.id);
    redFor = failed.length || state.dataLoss ? redFor + dt : 0;
    if (redFor >= 3 - 1e-8) { lives--; redFor = 0; breaches.push({ t: state.t, meters: failed }); }
  }
  return { result: missionResult(sim.state, config, lives, 0), state: sim.state, peakCost, peakQueue, breaches, lives };
}

describe('chapter 3 missions are winnable with the real runner rules', () => {
  for (const level of levels) {
    it(`${level.id}: the intended plan passes within an efficient budget`, () => {
      const config = level.mission.config;
      const { graph, knobs } = solution(level);
      for (const n of graph.nodes.filter((n) => !config.start.nodes.some((s) => s.id === n.id))) expect(config.palette).toContain(n.kind);
      for (const id of config.locked ?? []) expect(graph.nodes.some((n) => n.id === id)).toBe(true);
      const run = play(config, graph, knobs);
      expect(run.result.passed, JSON.stringify({ result: run.result, breaches: run.breaches })).toBe(true);
      expect(run.peakCost).toBeLessThanOrEqual(config.budget * 0.85);
      expect(config.budget).toBeLessThanOrEqual(run.peakCost * 1.25);
      expect(run.result.stars).toBeGreaterThanOrEqual(2);
      expect(run.state.dataLoss).toBe(false);
      expect(run.peakQueue).toBeLessThanOrEqual(config.goals.maxQueue ?? Infinity);
    });
    it(`${level.id}: doing nothing loses`, () => {
      expect(play(level.mission.config, level.mission.config.start).result.passed).toBe(false);
    });
    it(`${level.id}: the lab starts healthy and chaos breaks it`, () => {
      const config = level.lab.config;
      const healthy = play(config, config.start, initialKnobs(config));
      expect(healthy.result.passed, JSON.stringify(healthy.breaches)).toBe(true);
      const broken = { ...config, events: [...config.events, ...config.start.nodes.filter((n) => n.kind === 'web').map((n) => ({ at: 0, type: 'kill' as const, target: n.id }))] };
      expect(play(broken, config.start, initialKnobs(config)).result.passed).toBe(false);
    });
  }

  it('every slider starts on a selectable step', () => {
    for (const level of levels) for (const config of [level.lab.config, level.mission.config]) {
      for (const knob of config.knobs ?? []) {
        if (knob.type !== 'slider') continue;
        const steps = (Number(knob.initial) - (knob.min ?? 0)) / (knob.step ?? 1);
        expect(steps, `${level.id} ${knob.id}`).toBeCloseTo(Math.round(steps));
      }
    }
  });

  describe('C3L02: the blueprint must fit the scale', () => {
    const level = byId('C3L02');
    const config = level.mission.config;
    it('no spare web server: the crash at 45 s breaks it', () => {
      const b = board(config); newsFeed(b, 3, 4);
      expect(play(config, b.graph).result.passed).toBe(false);
    });
    it('no cache: the post DB melts under feed reads', () => {
      const { graph } = solution(level);
      graph.edges = graph.edges.filter((e) => e.to !== 'cache').concat(graph.nodes.filter((n) => n.kind === 'web').map((n) => ({ from: n.id, to: 'db' })));
      expect(play(config, graph).result.passed).toBe(false);
    });
    it('no queue: synchronous fan-out blows the latency goal', () => {
      const { graph } = solution(level);
      graph.edges = graph.edges.filter((e) => e.to !== 'queue');
      expect(play(config, graph).result.passed).toBe(false);
    });
    it('the lab blueprint fails the 2x peak until the web tier grows', () => {
      const lab = level.lab.config;
      expect(play(lab, lab.start, { ...initialKnobs(lab), rps: 2400 }).result.passed).toBe(false);
      expect(play(lab, lab.start, { ...initialKnobs(lab), rps: 2400, servers: 4 }).result.passed).toBe(true);
    });
  });

  describe('C3L03: fix exactly the bottlenecks the interviewer points at', () => {
    const config = byId('C3L03').mission.config;
    it('only the retrieval fix: the fan-out storm overflows the queue', () => {
      const b = board(config); deepDive(b, true, 0);
      const run = play(config, b.graph);
      expect(run.result.passed).toBe(false);
    });
    it('only the publishing fix: the post DB still melts', () => {
      const b = board(config); deepDive(b, false, 2);
      expect(play(config, b.graph).result.passed).toBe(false);
    });
    it('the wrong component: more web servers do not help', () => {
      const b = board(config);
      for (const id of ['web-4', 'web-5']) { b.add(id, 'web'); b.wire('lb', id); b.wire(id, 'db'); b.wire(id, 'queue'); }
      expect(play(config, b.graph).result.passed).toBe(false);
    });
    it('the lab breaks when either deep-dive knob is wrong', () => {
      const lab = byId('C3L03').lab.config;
      expect(play(lab, lab.start, { ...initialKnobs(lab), cacheSize: 0 }).result.passed).toBe(false);
      expect(play(lab, lab.start, { ...initialKnobs(lab), workers: 1 }).result.passed).toBe(false);
    });
  });

  describe('C3L04: survive the wrap-up questions', () => {
    const config = byId('C3L04').mission.config;
    it('without a replica the primary failure loses data', () => {
      const b = board(config); wrapUp(b, 3, false);
      const run = play(config, b.graph);
      expect(run.result.passed).toBe(false);
    });
    it('without more web servers the next scale curve breaks it', () => {
      const b = board(config); wrapUp(b, 0, true);
      expect(play(config, b.graph).result.passed).toBe(false);
    });
    it('the intended plan keeps at least two lives through the DB failover', () => {
      const { graph, knobs } = solution(byId('C3L04'));
      expect(play(config, graph, knobs).lives).toBeGreaterThanOrEqual(2);
    });
  });

  describe('C3L01: build exactly the clarified scope', () => {
    const level = byId('C3L01');
    const config = level.mission.config;
    it('forgetting the mobile requirement fails', () => {
      const { graph, knobs } = solution(level);
      graph.edges = graph.edges.filter((e) => !(e.from === 'mobile' && e.to === 'web-1'));
      expect(play(config, graph, knobs).result.passed).toBe(false);
    });
    it('skipping the separate database fails at peak', () => {
      const b = board(config);
      b.add('web-1', 'web'); b.wire('client', 'web-1'); b.wire('mobile', 'web-1');
      expect(play(config, b.graph).result.passed).toBe(false);
    });
    it('over-engineering (adding a load balancer) does not fit the budget', () => {
      const { graph } = solution(level);
      const cost = createSim(config, { ...graph, nodes: [...graph.nodes, { id: 'lb', kind: 'lb', x: 0, y: 0 }] }).state.cost;
      expect(cost).toBeGreaterThan(config.budget);
    });
    it('the lab design breaks at 10x the traffic, even with more web servers', () => {
      const lab = level.lab.config;
      expect(play(lab, lab.start, { ...initialKnobs(lab), rps: 3000, servers: 4 }).result.passed).toBe(false);
    });
  });
});
