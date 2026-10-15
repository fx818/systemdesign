import { describe, expect, it } from 'vitest';
import type { ArchGraph, ArchNode, ComponentKind, SimConfig, SimEvent } from '@/types/content';
import { createSim, simulate } from './engine';

const node = (id: string, kind: ComponentKind, label?: string): ArchNode => ({ id, kind, label, x: 100, y: 100 });
function graph(extra: ArchNode[] = [], links: [string, string][] = []): ArchGraph {
  return { nodes: [node('client', 'client'), node('web-1', 'web'), node('db', 'db'), ...extra], edges: [['client', 'web-1'], ['web-1', 'db'], ...links].map(([from, to]) => ({ from, to })) };
}
function config(start: ArchGraph, events: SimEvent[] = []): SimConfig {
  return { start, budget: 10000, palette: [], goals: { durationSec: 60 }, events: [{ at: 0, type: 'traffic', rps: 200 }, ...events] };
}
function balanced(extra: ArchNode[] = [], links: [string, string][] = []): ArchGraph {
  return { nodes: [node('client', 'client'), node('lb', 'lb'), node('web-1', 'web'), node('web-2', 'web'), node('db', 'db'), ...extra], edges: [['client', 'lb'], ['lb', 'web-1'], ['lb', 'web-2'], ['web-1', 'db'], ['web-2', 'db'], ...links].map(([from, to]) => ({ from, to })) };
}

describe('architecture simulation', () => {
  it('a single web server is a SPOF; disconnected components cannot serve traffic', () => {
    const g = graph();
    const s = simulate(config(g, [{ at: 1, type: 'kill', target: 'web-1' }]), g, 10);
    expect(s.uptime).toBeCloseTo(0.1);
    expect(s.nodes['web-1'].health).toBe('down');
    expect(s.p95).toBe(2500);
    expect(simulate(config(g), { ...g, edges: [] }, 1).uptime).toBe(0);
  });
  it('a healthy LB reroutes to another server, but a dead LB blocks the path', () => {
    const g = balanced();
    const sim = createSim(config(g), g);
    sim.apply({ at: 0, type: 'kill', target: 'web-1' });
    expect(sim.step(5).uptime).toBe(1);
    expect(sim.state.nodes['web-2'].rps).toBe(200);
    sim.apply({ at: 0, type: 'kill', target: 'lb' });
    expect(sim.step(6).recentUptime).toBe(0);
  });
  it('a kind kill takes out one node, preserving redundancy during boss waves', () => {
    const g = balanced(); const sim = createSim(config(g), g);
    sim.apply({ at: 0, type: 'kill', target: 'web' });
    expect(Object.values(sim.state.nodes).filter(n => n.health === 'down')).toHaveLength(1);
    expect(sim.step(1).uptime).toBe(1);
  });
  it('replication-only links expose replicas and promote one exactly after 3s', () => {
    const g = graph([node('replica', 'db-replica')], [['db', 'replica']]);
    const sim = createSim(config(g), g);
    expect(sim.state.nodes.replica.rps).toBeGreaterThan(0);
    sim.apply({ at: 0, type: 'kill', target: 'db' });
    expect(sim.step(2.9).nodes.replica.promoted).toBeUndefined();
    expect(sim.step(0.1).nodes.replica.promoted).toBe(true);
    expect(sim.step(6).recentUptime).toBe(1);
    sim.apply({ at: 0, type: 'kill', target: 'replica' });
    expect(sim.step(6).recentUptime).toBe(0);
  });
  it('combines reads and writes against the same primary capacity', () => {
    const g = graph(); const s = simulate(config(g, [{ at: 0, type: 'traffic', rps: 2400 }]), g, 1, { servers: 4 });
    expect(s.nodes.db.health).toBe('overloaded');
    expect(s.uptime).toBeLessThan(1);
  });
  it('cache reduces database load and latency, supports zero size and uppercase eviction', () => {
    const g = graph([node('cache', 'cache')], [['web-1', 'cache']]);
    const plain = simulate(config(g), g, 1, { cacheSize: 0 });
    const cached = simulate(config(g), g, 1, { ttl: 300, cacheSize: 50, eviction: 'LRU' });
    expect(cached.nodes.db.rps).toBeLessThan(plain.nodes.db.rps);
    expect(cached.p95).toBeLessThan(plain.p95);
    expect(plain.cacheHitRate).toBe(0);
    expect(cached.cacheHitRate).toBeGreaterThan(0.7);
    expect(simulate(config(g), g, 1, { eviction: 'FIFO' }).cacheHitRate).toBeLessThan(cached.cacheHitRate);
    const sim = createSim(config(g), g); sim.apply({ at: 0, type: 'kill', target: 'cache' });
    expect(sim.step(1).nodes.db.rps).toBeCloseTo(70);
  });
  it('CDN offloads only static traffic, short TTL re-fetches, and outage falls back to origin', () => {
    const g = graph([node('cdn', 'cdn')], [['client', 'cdn']]);
    const sim = createSim(config(g), g);
    expect(sim.state.nodes.cdn.rps).toBe(120);
    expect(sim.state.nodes['web-1'].rps).toBe(80);
    sim.setKnobs({ ttl: 1 });
    expect(sim.state.nodes['web-1'].rps).toBeGreaterThan(80);
    sim.apply({ at: 0, type: 'kill', target: 'cdn' });
    expect(sim.step(1).nodes['web-1'].rps).toBe(200);
    expect(sim.state.uptime).toBe(1);
  });
  it('sticky sessions break on death or scaling, while a connected healthy shared store protects them', () => {
    const g = balanced([node('sessions', 'nosql', 'Shared session store')], [['web-1', 'sessions'], ['web-2', 'sessions']]);
    const protectedSim = createSim(config(g), g, { sticky: true });
    protectedSim.apply({ at: 0, type: 'kill', target: 'web-1' });
    expect(protectedSim.state.sessionLossRate).toBe(0);
    const stickyGraph = balanced();
    const sim = createSim(config(stickyGraph), stickyGraph, { sticky: true });
    sim.apply({ at: 0, type: 'kill', target: 'web-1' });
    expect(sim.state.sessionLossRate).toBe(0.5);
    expect(sim.step(1).uptime).toBe(0.5);
    expect(sim.step(3).sessionLossRate).toBe(0);
    sim.setKnobs({ sticky: true, servers: 3 });
    expect(sim.state.sessionLossRate).toBeGreaterThan(0);
  });
  it('server targets scale down as well as up, charge credits, and do not resurrect a dead pool', () => {
    const g = balanced();
    const cfg = config(g); cfg.knobs = [{ id: 'servers', label: 'Servers', type: 'slider', initial: 2 }];
    const sim = createSim(cfg, g);
    sim.setKnobs({ servers: 1 });
    expect(sim.state.nodes['web-1'].capacity).toBe(500);
    const cost = sim.state.cost;
    sim.setKnobs({ servers: 4 });
    expect(sim.state.cost - cost).toBe(300);
    sim.apply({ at: 0, type: 'kill', target: 'web-1' });
    sim.apply({ at: 0, type: 'kill', target: 'web-2' });
    expect(sim.step(1).recentUptime).toBe(0);
  });
  it('queue grows with too few workers; zero workers and killed producers behave correctly', () => {
    const g = graph([node('queue', 'queue'), node('worker', 'worker')], [['web-1', 'queue'], ['queue', 'worker']]);
    const sim = createSim(config(g, [{ at: 0, type: 'jobs', perSec: 100 }]), g);
    expect(sim.step(2).queueLength).toBe(100);
    sim.setKnobs({ workers: 0 });
    expect(sim.step(2).queueLength).toBe(300);
    sim.setKnobs({ workers: 4 });
    expect(sim.step(2).queueLength).toBe(100);
    sim.apply({ at: 0, type: 'kill', target: 'web-1' });
    expect(sim.step(1).queueLength).toBe(0);
  });
  it('dead or disconnected workers cannot drain; queue decouples job latency', () => {
    const g = graph([node('queue', 'queue'), node('worker', 'worker')], [['web-1', 'queue'], ['queue', 'worker']]);
    const cfg = config(g, [{ at: 0, type: 'jobs', perSec: 80 }]);
    const queued = simulate(cfg, g, 2);
    const sync = simulate(cfg, { ...g, edges: g.edges.filter(e => e.to !== 'queue') }, 2);
    expect(queued.p95).toBeLessThan(sync.p95);
    const sim = createSim(cfg, g, { workers: 8 });
    sim.apply({ at: 0, type: 'kill', target: 'worker' });
    expect(sim.step(1).queueLength).toBe(80);
  });
  it('a celebrity key overloads one shard and cache reduces that hotspot', () => {
    const g = balanced([node('s0', 'shard'), node('s1', 'shard'), node('s2', 'shard'), node('s3', 'shard'), node('cache', 'cache')], [['web-1', 's0'], ['web-1', 's1'], ['web-2', 's2'], ['web-2', 's3'], ['web-1', 'cache'], ['web-2', 'cache']]);
    const cfg = config(g, [{ at: 0, type: 'traffic', rps: 7000 }, { at: 1, type: 'hotkey', share: 0.8 }]);
    const s = simulate(cfg, g, 2, { servers: 10, cacheSize: 0 });
    expect(s.nodes.s0.health).toBe('overloaded');
    expect(s.nodes.s1.health).toBe('healthy');
    expect(simulate(cfg, g, 2, { servers: 10, cacheSize: 100 }).nodes.s0.rps).toBeLessThan(s.nodes.s0.rps);
  });
  it('maps region IDs, keeps cross-DC ownership, applies East split, failover and data loss', () => {
    const g: ArchGraph = { nodes: [node('client', 'client'), node('us-west', 'datacenter', 'DC 2 · US-West'), node('us-east', 'datacenter', 'DC 1 · US-East'), node('ww', 'web'), node('we', 'web'), node('dw', 'db'), node('de', 'db')], edges: [['client', 'us-west'], ['client', 'us-east'], ['us-west', 'ww'], ['us-east', 'we'], ['ww', 'dw'], ['we', 'de'], ['dw', 'de']].map(([from, to]) => ({ from, to })) };
    const sim = createSim(config(g), g, { split: 80 });
    expect(sim.state.nodes.we.rps).toBe(160);
    sim.apply({ at: 0, type: 'region-down', region: 'us-west' });
    expect(sim.state.nodes.dw.health).toBe('down');
    expect(sim.state.nodes.de.health).toBe('healthy');
    expect(sim.state.nodes.we.rps).toBe(200);
    expect(sim.state.dataLoss).toBe(false);
    expect(sim.state.p95).toBeGreaterThan(120);
    sim.setKnobs({ replicas: 0 });
    expect(sim.state.dataLoss).toBe(true);
    sim.apply({ at: 0, type: 'revive', target: 'us-west' });
    expect(sim.state.regionsDown).toEqual([]);
  });
  it('applies scheduled events exactly at their timestamps and handles large steps', () => {
    const g = graph(); const cfg = config(g, [{ at: 1.1, type: 'traffic', rps: 100 }]);
    const sim = createSim(cfg, g);
    expect(sim.step(1.1).rps).toBe(100);
    expect(sim.state.totals.total).toBeCloseTo(220);
    expect(sim.step(0.9).totals.total).toBeCloseTo(310);
    expect(() => sim.step(-1)).toThrow(RangeError);
    expect(() => simulate(cfg, g, Infinity)).toThrow(RangeError);
  });
  it('is deterministic, does not mutate inputs, and preserves elapsed state during live edits', () => {
    const g = graph(); const cfg = config(g, [{ at: 2, type: 'kill', target: 'web-1' }]);
    const snapshot = JSON.stringify({ g, cfg });
    expect(simulate(cfg, g, 12)).toEqual(simulate(cfg, g, 12));
    const sim = createSim(cfg, g); sim.step(1); sim.setGraph({ ...g, nodes: [...g.nodes, node('metrics', 'metrics')] });
    expect(sim.state.t).toBe(1); expect(sim.state.totals.total).toBe(200);
    expect(sim.state.nodes.metrics.rps).toBeGreaterThan(0);
    expect(JSON.stringify({ g, cfg })).toBe(snapshot);
  });
});

// Exercise every authored config, including all event kinds and lab knobs.
const levels = import.meta.glob<{ labConfig: SimConfig; missionConfig: SimConfig }>('../content/ch1/L*/sim.ts', { eager: true });
describe('authored levels', () => {
  it.each(Object.entries(levels))('%s stays finite through its entire timeline', (_, level) => {
    for (const cfg of [level.labConfig, level.missionConfig]) {
      const sim = createSim(cfg, cfg.start);
      while (sim.time < cfg.goals.durationSec) {
        const state = sim.step(Math.min(1, cfg.goals.durationSec - sim.time));
        expect([state.uptime, state.recentUptime, state.p95, state.cost, state.queueLength, state.cacheHitRate].every(Number.isFinite)).toBe(true);
        expect(state.uptime).toBeGreaterThanOrEqual(0);
        expect(state.uptime).toBeLessThanOrEqual(1);
      }
    }
  });
});
