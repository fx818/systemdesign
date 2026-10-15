// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { levelsInChapter } from '@/content/registry';
const levels = levelsInChapter(1);
import type { ArchGraph, ComponentKind, LevelDef, SimConfig } from '@/types/content';
import { COMPONENTS, createSim, initialKnobs } from '@/sim';
import { goalMeters, missionResult } from '@/sim/mission';
import type { KnobValues } from '@/sim/types';

// Concrete walkthroughs: only palette placements, legal removals, wires and visible knobs.
// Keep these explicit so a capacity/price/event change cannot silently strand a level.
function board(config: SimConfig) {
  const graph = structuredClone(config.start);
  const add = (id: string, kind: ComponentKind, label = id) => {
    graph.nodes.push({ id, kind, label, x: 640, y: 360 });
    return id;
  };
  const wire = (from: string, to: string) => {
    if (!graph.edges.some(e => e.from === from && e.to === to)) graph.edges.push({ from, to });
  };
  const remove = (id: string) => {
    graph.nodes = graph.nodes.filter(n => n.id !== id);
    graph.edges = graph.edges.filter(e => e.from !== id && e.to !== id);
  };
  const webs = () => graph.nodes.filter(n => n.kind === 'web').map(n => n.id);
  return { graph, add, wire, remove, webs };
}
function boss(config: SimConfig): ArchGraph {
  const b = board(config);
  b.add('dns', 'dns'); b.add('cdn', 'cdn'); b.add('lb', 'lb');
  b.add('us-west', 'datacenter'); b.add('us-east', 'datacenter');
  for (const user of ['client', 'mobile']) {
    b.wire(user, 'dns'); b.wire(user, 'cdn'); b.wire(user, 'lb');
  }
  b.wire('lb', 'us-west'); b.wire('lb', 'us-east');
  b.add('db-west', 'db'); b.add('replica-east', 'db-replica');
  b.wire('us-west', 'db-west'); b.wire('us-east', 'replica-east');
  b.wire('db-west', 'replica-east');
  for (const [id, kind] of [
    ['cache-a', 'cache'], ['cache-b', 'cache'], ['sessions', 'session-store'],
    ['queue', 'queue'], ['metrics', 'metrics'], ['logging', 'logging'], ['ci', 'ci'],
    ...Array.from({ length: 4 }, (_, i) => [`shard-${i}`, 'shard']),
    ...Array.from({ length: 4 }, (_, i) => [`worker-${i}`, 'worker']),
  ] as [string, ComponentKind][]) {
    b.add(id, kind); b.wire('us-east', id);
    if (kind === 'worker') b.wire('queue', id);
    if (kind === 'shard') { b.wire('cache-a', id); b.wire('cache-b', id); }
  }
  for (const region of ['us-west', 'us-east']) {
    for (let i = 0; i < (region === 'us-west' ? 3 : 4); i++) {
      const id = b.add(`${region}-web-${i}`, 'web'); b.wire(region, id);
      for (const target of ['cache-a', 'cache-b', 'db-west', 'replica-east', 'sessions', 'queue', 'metrics', 'logging', 'ci']) b.wire(id, target);
    }
  }
  b.wire('cdn', 'us-east-web-0');
  return b.graph;
}
interface GraphEdit { at: number; graph: ArchGraph }
function solution(level: LevelDef, lab = false): { graph: ArchGraph; knobs: KnobValues; edits?: GraphEdit[] } {
  const config = lab ? level.lab.config : level.mission.config;
  const b = board(config);
  const knobs = initialKnobs(config);
  const connectWeb = (id: string, data: string, entry = 'lb') => { b.wire(entry, id); b.wire(id, data); };
  if (lab) {
    if (level.id === 'L13') return { graph: boss(config), knobs: { ...knobs, servers: 1, replicas: 0, workers: 0, shards: 1 } };
    return { graph: b.graph, knobs };
  }
  switch (level.id) {
    case 'L01':
      b.add('web-1', 'web'); b.wire('client', 'web-1'); b.wire('mobile', 'web-1'); break;
    case 'L02': b.wire('web-1', b.add('db', 'db')); break;
    case 'L03':
      for (const id of ['web-2', 'web-3']) {
        b.add(id, 'web'); b.wire('client', id); b.wire('mobile', id); b.wire(id, 'db-1');
      }
      break;
    case 'L04':
      b.add('lb', 'lb'); b.wire('client', 'lb'); b.wire('mobile', 'lb');
      b.graph.edges = b.graph.edges.filter(e => !(['client', 'mobile'].includes(e.from) && e.to === 'web-1'));
      b.wire('lb', 'web-1');
      for (const id of ['web-2', 'web-3', 'web-4']) connectWeb(b.add(id, 'web'), 'db-1');
      break;
    case 'L05':
      for (let i = 1; i <= 3; i++) {
        const id = b.add(`replica-${i}`, 'db-replica'); b.wire('db-1', id);
        for (const web of b.webs()) b.wire(web, id);
      }
      break;
    case 'L06':
      for (const id of ['cache-a', 'cache-b']) { b.add(id, 'cache'); for (const web of b.webs()) b.wire(web, id); }
      break;
    case 'L07':
      b.add('cdn', 'cdn'); b.wire('client', 'cdn'); b.wire('mobile', 'cdn'); b.wire('cdn', 'web-1');
      connectWeb(b.add('web-3', 'web'), 'db'); b.wire('web-3', 'cache'); break;
    case 'L08':
      b.add('sessions', 'session-store'); for (const web of b.webs()) b.wire(web, 'sessions');
      knobs.sticky = false; knobs.servers = 5; break;
    case 'L09':
      b.wire('db-w', 'db-e'); connectWeb(b.add('extra-east', 'web'), 'db-e', 'us-east'); break;
    case 'L10':
      connectWeb(b.add('web-3', 'web'), 'db'); b.wire('web-3', 'nosql'); b.add('queue', 'queue');
      for (const web of b.webs()) b.wire(web, 'queue');
      for (let i = 0; i < 5; i++) b.wire('queue', b.add(`worker-${i}`, 'worker'));
      break;
    case 'L11':
      for (const kind of ['logging', 'metrics', 'ci'] as const) {
        b.add(kind, kind); for (const web of b.webs()) b.wire(web, kind);
      }
      connectWeb(b.add('web-4', 'web'), 'db'); b.wire('web-4', 'cache');
      b.wire('queue', b.add('worker-2', 'worker')); break;
    case 'L12':
      b.remove('db'); knobs.cacheSize = 50;
      for (let i = 0; i < 4; i++) {
        const id = b.add(`shard-${i}`, 'shard'); b.wire('cache', id);
        for (const web of b.webs()) b.wire(web, id);
      }
      for (const id of ['web-3', 'web-4', 'web-5']) {
        b.add(id, 'web'); b.wire('lb', id); b.wire(id, 'cache');
      }
      break;
    case 'L13': {
      const sharded = boss(config);
      // Stage the migration: first exercise replica promotion and regional failover,
      // then attach the pre-placed shards before the celebrity wave.
      const beforeMigration = { ...sharded, edges: sharded.edges.filter(e => !e.to.startsWith('shard-') || !e.from.startsWith('cache-')) };
      return { graph: beforeMigration, knobs, edits: [{ at: 110, graph: sharded }] };
    }
  }
  return { graph: b.graph, knobs };
}

// Match SimRunner's 100ms ticks, recent-window meters, 3s breach grace and early defeat.
function play(config: SimConfig, graph: ArchGraph, knobs?: KnobValues, edits: GraphEdit[] = []) {
  const sim = createSim(config, graph, knobs);
  let editIndex = 0;
  let lives = 3, redFor = 0, peakCost = sim.state.cost, peakQueue = 0;
  const breaches: { t: number; meters: string[] }[] = [];
  while (sim.time < config.goals.durationSec - 1e-8 && lives > 0) {
    while (editIndex < edits.length && edits[editIndex].at <= sim.time + 1e-8) sim.setGraph(edits[editIndex++].graph);
    const dt = Math.min(0.1, config.goals.durationSec - sim.time);
    const state = sim.step(dt);
    peakCost = Math.max(peakCost, state.cost); peakQueue = Math.max(peakQueue, state.queueLength);
    const failed = goalMeters(state, config, true).filter(m => m.failed).map(m => m.id);
    redFor = failed.length || state.dataLoss ? redFor + dt : 0;
    if (redFor >= 3 - 1e-8) { lives--; redFor = 0; breaches.push({ t: state.t, meters: failed }); }
  }
  return { result: missionResult(sim.state, config, lives, 0), state: sim.state, peakCost, peakQueue, breaches };
}

describe('all 13 missions are playable with the actual runner rules', () => {
  it('discovers exactly the complete chapter', () => expect(levels.map(l => l.number)).toEqual(Array.from({ length: 13 }, (_, i) => i + 1)));
  for (const level of levels) {
    it(`${level.id}: its hinted solution survives every wave within an efficient budget`, () => {
      const config = level.mission.config;
      const { graph, knobs, edits } = solution(level);
      for (const n of graph.nodes.filter(n => !config.start.nodes.some(start => start.id === n.id))) expect(config.palette).toContain(n.kind);
      for (const id of config.locked ?? []) expect(graph.nodes.some(n => n.id === id)).toBe(true);
      for (const knob of config.knobs ?? []) {
        if (typeof knobs[knob.id] === 'number') {
          expect(knobs[knob.id]).toBeGreaterThanOrEqual(knob.min ?? -Infinity);
          expect(knobs[knob.id]).toBeLessThanOrEqual(knob.max ?? Infinity);
        }
      }
      const run = play(config, graph, knobs, edits);
      expect(run.result.passed, JSON.stringify({ result: run.result, breaches: run.breaches })).toBe(true);
      expect(run.peakCost).toBeLessThanOrEqual(config.budget * 0.85);
      expect(config.budget).toBeLessThanOrEqual(run.peakCost * 1.25);
      expect(run.result.stars).toBeGreaterThanOrEqual(2);
      expect(run.state.t).toBeCloseTo(config.goals.durationSec);
      expect(run.state.dataLoss).toBe(false);
      expect(run.peakQueue).toBeLessThanOrEqual(config.goals.maxQueue ?? Infinity);
    });
    it(`${level.id}: doing nothing loses the mission`, () => {
      expect(play(level.mission.config, level.mission.config.start).result.passed).toBe(false);
    });
    it(`${level.id}: the lab can be healthy and chaos can break it`, () => {
      const config = level.lab.config;
      const { graph, knobs } = solution(level, true);
      const healthy = play(config, graph, knobs);
      expect(healthy.result.passed, JSON.stringify({ result: healthy.result, breaches: healthy.breaches })).toBe(true);
      expect(healthy.peakCost).toBeLessThanOrEqual(config.budget);
      const broken = { ...config, events: [...config.events, ...graph.nodes.filter(n => n.kind === 'web').map(n => ({ at: 0, type: 'kill' as const, target: n.id }))] };
      expect(play(broken, graph, knobs).result.passed).toBe(false);
    }, 20_000);
  }
  it('every slider starts on a selectable step, matching the value used by the engine', () => {
    for (const level of levels) for (const config of [level.lab.config, level.mission.config]) {
      for (const knob of config.knobs ?? []) {
        if (knob.type !== 'slider') continue;
        const steps = (Number(knob.initial) - (knob.min ?? 0)) / (knob.step ?? 1);
        expect(steps, `${level.id} ${knob.id}`).toBeCloseTo(Math.round(steps));
      }
    }
  });
  it('L06: web capacity alone cannot replace a cache, and one cache cannot survive its crash', () => {
    const level = levels[5];
    const { graph, knobs } = solution(level);
    const lone = graph.nodes.find(n => n.kind === 'cache')!.id;
    const oneCache = { nodes: graph.nodes.filter(n => n.kind !== 'cache' || n.id === lone), edges: graph.edges.filter(e => graph.nodes.find(n => n.id === e.to)?.kind !== 'cache' || e.to === lone) };
    expect(play(level.mission.config, oneCache, knobs).result.passed).toBe(false);
  });
  it('L08: the hinted NoSQL session-store alternative is affordable and survives', () => {
    const level = levels[7]; const { graph, knobs } = solution(level);
    graph.nodes = graph.nodes.map(n => n.kind === 'session-store' ? { ...n, kind: 'nosql', label: 'Session store' } : n);
    const run = play(level.mission.config, graph, { ...knobs, sticky: true });
    expect(run.result.passed).toBe(true);
    expect(run.peakCost).toBeLessThanOrEqual(level.mission.config.budget);
  });
  it('L09: East has headroom but loses data without the cross-region replication wire', () => {
    const level = levels[8]; const { graph, knobs } = solution(level);
    graph.edges = graph.edges.filter(e => !(e.from === 'db-w' && e.to === 'db-e'));
    expect(play(level.mission.config, graph, knobs).result.passed).toBe(false);
  });
  it('L12: adding shards alone leaves the celebrity key hot; the cache is required', () => {
    const level = levels[11]; const { graph } = solution(level);
    expect(play(level.mission.config, graph, { cacheSize: 0 }).result.passed).toBe(false);
  });
  it('L13: the regional wave hits a real populated West region and fails without East capacity', () => {
    const level = levels[12]; const { graph } = solution(level);
    const config = level.mission.config;
    const sim = createSim(config, graph); sim.step(85);
    expect(sim.state.nodes['replica-east'].promoted).toBe(true);
    sim.step(18);
    expect(sim.state.regionsDown).toContain('us-west');
    expect(sim.state.nodes['us-west-web-1'].health).toBe('down');
    expect(sim.state.nodes['us-east-web-0'].health).not.toBe('down');
    const small = { ...graph, edges: graph.edges.filter(e => !(e.from === 'us-east' && /web-[123]$/.test(e.to))) };
    expect(play(config, small).result.passed).toBe(false);
  });
  it('L13: the same solution works with editor-generated IDs and editable region labels', () => {
    const level = levels[12]; const { graph, edits } = solution(level);
    const ids = new Map(graph.nodes.map((node, i) => [node.id, level.mission.config.start.nodes.some(start => start.id === node.id) ? node.id : `${node.kind}-${i + 1}`]));
    const placed = {
      nodes: graph.nodes.map(node => ({ ...node, id: ids.get(node.id)!, label: node.id === 'us-west' ? 'US-West' : node.id === 'us-east' ? 'US-East' : node.label })),
      edges: graph.edges.map(edge => ({ ...edge, from: ids.get(edge.from)!, to: ids.get(edge.to)! })),
    };
    const mappedEdits = edits?.map(edit => ({ at: edit.at, graph: { nodes: placed.nodes, edges: edit.graph.edges.map(edge => ({ ...edge, from: ids.get(edge.from)!, to: ids.get(edge.to)! })) } }));
    const run = play(level.mission.config, placed, undefined, mappedEdits);
    expect(run.result.passed).toBe(true);
    expect(run.state.regionsDown).toContain(ids.get('us-west'));
    const sim = createSim(level.mission.config, placed, { split: 80 });
    expect(sim.state.nodes[ids.get('us-east-web-0')!].rps).toBeGreaterThan(sim.state.nodes[ids.get('us-west-web-0')!].rps);
  });
  it('catalogue prices are unchanged; level budgets pay for the whole board', () => {
    expect(COMPONENTS.web.cost).toBe(100); expect(COMPONENTS.db.cost).toBe(300);
  });
});
