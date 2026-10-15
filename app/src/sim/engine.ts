/** Deterministic teaching model, shared by labs, missions and headless tests. */
import type { ArchGraph, ArchNode, ComponentKind, SimConfig, SimEvent, CharacterId } from '@/types/content';
import { COMPONENTS } from './components';
import { knobBoolean, knobNumber, type KnobValues, type SimState, type NodeState } from './types';

export const STATIC_SHARE = 0.6;
export const READ_SHARE = 0.9;
export const DATA_FACTOR = 0.35;
export const SELF_HOST_PENALTY = 0.5;
export const PROMOTION_DELAY_SEC = 3;
export const SESSION_LOSS_SEC = 3;
export const HOTKEY_SEC = 20;
export const FAILOVER_LATENCY_MS = 120;
export const RECENT_WINDOW_SEC = 5;
const DATA = new Set<ComponentKind>(['db', 'db-replica', 'nosql', 'shard']);
const TRANSIT = new Set<ComponentKind>(['dns', 'lb', 'datacenter']);
const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
export const latencyMultiplier = (util: number): number => util <= 0.8 ? 1 : Math.min(8, 1 + (util - 0.8) * 10);
export const dropFraction = (util: number): number => util > 1 ? 1 - 1 / util : 0;

interface Topology {
  graph: ArchGraph;
  byId: Map<string, ArchNode>;
  out: Map<string, string[]>;
  regionOf: Map<string, string>;
}
function topology(graph: ArchGraph): Topology {
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const out = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (byId.has(edge.from) && byId.has(edge.to)) out.set(edge.from, [...(out.get(edge.from) ?? []), edge.to]);
  }
  // Multi-source traversal assigns the closest DC first. A replication link must
  // never steal a database from the other region's containment tree.
  const regionOf = new Map<string, string>();
  const pending = graph.nodes.filter(n => n.kind === 'datacenter').map(n => n.id);
  for (const id of pending) regionOf.set(id, id);
  for (let i = 0; i < pending.length; i++) {
    const id = pending[i];
    for (const child of out.get(id) ?? []) {
      if (regionOf.has(child)) continue;
      regionOf.set(child, regionOf.get(id)!);
      pending.push(child);
    }
  }
  return { graph, byId, out, regionOf };
}

export function initialKnobs(config: SimConfig): KnobValues {
  return Object.fromEntries((config.knobs ?? []).map(k => [k.id, k.initial]));
}
export function cacheHitRate(knobs?: KnobValues): number {
  const ttl = Math.max(0, knobNumber(knobs, 'ttl', 300));
  const size = Math.max(0, knobNumber(knobs, 'cacheSize', 50));
  const policy = String(knobs?.eviction ?? 'LRU').toLowerCase();
  const factor = policy === 'fifo' ? 0.82 : policy === 'lfu' ? 0.96 : 1;
  return clamp((ttl / (ttl + 10)) * (size / (size + 10)) * factor, 0, 0.98);
}
export interface SimMessage { at: number; who: CharacterId; text: string }
export interface Sim {
  step(dt: number): SimState;
  readonly state: SimState;
  apply(event: SimEvent): void;
  setKnobs(knobs: KnobValues): void;
  /** Editing the live architecture preserves elapsed time, failures and totals. */
  setGraph(graph: ArchGraph): void;
  drainEvents(): SimEvent[];
  readonly messages: SimMessage[];
  readonly time: number;
}

export function createSim(config: SimConfig, graph: ArchGraph, knobs?: KnobValues): Sim {
  let topo = topology(graph);
  let values = { ...initialKnobs(config), ...knobs };
  const events = [...config.events].sort((a, b) => a.at - b.at);
  let eventIndex = 0;
  let t = 0;
  let traffic = 0;
  let jobs = 0;
  let backlog = 0;
  let okTotal = 0;
  let total = 0;
  let primaryLost = false;
  const dead = new Map<string, number>();
  const regionsDown = new Set<string>();
  const promoted = new Set<string>();
  let primaryDownAt: number | null = null;
  let promotedAt = -Infinity;
  let hotUntil = -Infinity;
  let hotShare = 0;
  let sessionUntil = -Infinity;
  let sessionShare = 0;
  let fired: SimEvent[] = [];
  const messages: SimMessage[] = [];
  const recent: { at: number; ok: number; total: number }[] = [];
  const nodesOf = (kind: ComponentKind) => topo.graph.nodes.filter(n => n.kind === kind);
  const down = (id: string) => dead.has(id) || regionsDown.has(topo.regionOf.get(id) ?? '');
  const sessionNode = (n: ArchNode) => n.kind === 'session-store' || (n.kind === 'nosql' && /session/i.test(n.label ?? ''));
  const isData = (n: ArchNode) => DATA.has(n.kind) && !sessionNode(n);
  const label = (id: string) => topo.byId.get(id)?.label ?? id;

  function walk(starts: string[], accept: (n: ArchNode) => boolean, through: (n: ArchNode) => boolean, healthy = true): string[] {
    const visited = new Set(starts);
    const pending = [...starts];
    const found: string[] = [];
    for (let i = 0; i < pending.length; i++) {
      for (const id of topo.out.get(pending[i]) ?? []) {
        if (visited.has(id)) continue;
        visited.add(id);
        const n = topo.byId.get(id)!;
        if (healthy && down(id)) continue;
        if (accept(n)) found.push(id);
        if (through(n)) pending.push(id);
      }
    }
    return found;
  }
  const webPaths = (entry: string, healthy: boolean) => walk([entry], n => n.kind === 'web', n => TRANSIT.has(n.kind), healthy);
  // DB -> replica links also discover the read endpoint. Traversal through a
  // failed cache/primary is intentional: clients reconnect directly on failover.
  const dataPaths = (webs: string[]) => walk(webs, isData, n => n.kind === 'cache' || isData(n), false);
  function sharedSessions(): boolean {
    const webs = nodesOf('web').filter(n => !down(n.id));
    return webs.length > 0 && webs.every(n => walk([n.id], sessionNode, () => false).length > 0);
  }
  function loseSessions(share: number): void {
    if (!knobBoolean(values, 'sticky', false) || sharedSessions()) return;
    sessionShare = clamp(Math.max(sessionShare, share));
    sessionUntil = t + SESSION_LOSS_SEC;
  }
  /** Sliders set the total pool size; manually added nodes extend that target.
   * Each visible node represents a share of the virtual pool, including deaths. */
  function scale(kind: ComponentKind, id: 'servers' | 'replicas' | 'workers' | 'shards'): number {
    const physical = nodesOf(kind).length;
    if (physical === 0) return 0;
    const initialCount = config.start.nodes.filter(n => n.kind === kind).length;
    const target = Math.max(0, knobNumber(values, id, physical) + (values[id] === undefined ? 0 : physical - initialCount));
    return target / physical;
  }
  function regionMatch(target: string): string | undefined {
    const key = target.trim().toLowerCase();
    return nodesOf('datacenter').find(n => n.id.toLowerCase() === key || n.label?.trim().toLowerCase() === key)?.id;
  }
  function apply(event: SimEvent): void {
    fired.push(event);
    switch (event.type) {
      case 'traffic': traffic = Math.max(0, event.rps); break;
      case 'jobs': jobs = Math.max(0, event.perSec); break;
      case 'hotkey': hotShare = clamp(event.share); hotUntil = t + HOTKEY_SEC; break;
      case 'message': messages.push({ at: t, who: event.who, text: event.text }); break;
      case 'region-down': {
        const region = regionMatch(event.region);
        if (region) regionsDown.add(region);
        break;
      }
      case 'kill': {
        // Kind targets mean "one component crashes", as in the boss waves.
        // Prefer a read replica over a promoted primary for a replica failure.
        const target = topo.byId.get(event.target) ?? topo.graph.nodes.find(n => n.kind === event.target && !down(n.id) && !promoted.has(n.id))
          ?? topo.graph.nodes.find(n => n.kind === event.target && !down(n.id));
        if (target && !down(target.id)) {
          const healthyCount = nodesOf('web').filter(n => !down(n.id)).length;
          dead.set(target.id, t);
          if (target.kind === 'datacenter') regionsDown.add(target.id);
          if (target.kind === 'web') loseSessions(1 / Math.max(1, healthyCount));
        }
        break;
      }
      case 'revive': {
        const targets = topo.byId.has(event.target) ? [topo.byId.get(event.target)!] : topo.graph.nodes.filter(n => n.kind === event.target);
        for (const n of targets) {
          dead.delete(n.id);
          if (n.kind === 'datacenter') regionsDown.delete(n.id);
          if (n.kind === 'db' || n.kind === 'nosql') primaryLost = false;
        }
        break;
      }
    }
  }
  function due(): void {
    while (eventIndex < events.length && events[eventIndex].at <= t + 1e-9) apply(events[eventIndex++]);
  }

  function tick(dt: number): SimState {
    const alerts: string[] = [];
    const offered = Math.max(0, knobNumber(values, 'rps', traffic));
    const load = new Map<string, number>();
    const capacity = new Map(topo.graph.nodes.map(n => [n.id, COMPONENTS[n.kind].capacity]));
    const add = (id: string, rps: number) => load.set(id, (load.get(id) ?? 0) + rps);
    const entries = topo.graph.nodes.filter(n => n.kind === 'client' || n.kind === 'mobile');
    const allWebs = nodesOf('web');
    const serverScale = scale('web', 'servers');
    const replicaScale = scale('db-replica', 'replicas');
    const workerScale = scale('worker', 'workers');
    const shardScale = scale('shard', 'shards');
    for (const n of allWebs) {
      const separateData = dataPaths([n.id]).length > 0;
      capacity.set(n.id, COMPONENTS.web.capacity * serverScale * (separateData ? 1 : SELF_HOST_PENALTY));
    }
    for (const n of nodesOf('db-replica')) capacity.set(n.id, COMPONENTS['db-replica'].capacity * replicaScale);
    for (const n of nodesOf('worker')) capacity.set(n.id, COMPONENTS.worker.capacity * workerScale);
    for (const n of nodesOf('shard')) capacity.set(n.id, COMPONENTS.shard.capacity * shardScale);
    const served = (id: string, rps: number) => down(id) ? 0 : Math.min(rps, capacity.get(id) ?? 0);
    let staticOk = 0;
    let webIncoming = 0;
    const webTraffic = new Map<string, number>();
    let cdnUsed = false;
    let failover = false;
    for (const entry of entries) {
      if (down(entry.id)) continue;
      const share = offered / entries.length;
      add(entry.id, share);
      const cdns = knobBoolean(values, 'cdn', true) ? walk([entry.id], n => n.kind === 'cdn', n => TRANSIT.has(n.kind)) : [];
      // Short TTLs make edge misses return to the origin. No CDN means full fallback.
      const edgeHit = values.ttl === undefined ? 1 : clamp(knobNumber(values, 'ttl', 300) / (knobNumber(values, 'ttl', 300) + 5));
      const edgeTraffic = cdns.length ? share * STATIC_SHARE * edgeHit : 0;
      cdnUsed ||= edgeTraffic > 0;
      for (const id of cdns) { add(id, edgeTraffic / cdns.length); staticOk += served(id, edgeTraffic / cdns.length); }
      let incoming = share - edgeTraffic;
      webIncoming += incoming;
      const paths = webPaths(entry.id, true);
      const balancers = walk([entry.id], n => n.kind === 'lb', n => TRANSIT.has(n.kind));
      for (const id of balancers) add(id, incoming / balancers.length);
      if (balancers.length) incoming = Math.min(incoming, balancers.reduce((sum, id) => sum + (capacity.get(id) ?? 0), 0));
      const original = webPaths(entry.id, false);
      const geo = original.some(id => topo.regionOf.has(id));
      const reroute = balancers.length > 0 || geo;
      const candidates = reroute ? paths : original.filter(id => paths.includes(id) || dead.has(id));
      const groups = new Map<string, string[]>();
      for (const id of candidates) {
        const region = topo.regionOf.get(id) ?? '';
        groups.set(region, [...(groups.get(region) ?? []), id]);
      }
      const names = [...groups.keys()].sort((a, b) => Number(/east/i.test(label(b))) - Number(/east/i.test(label(a))) || a.localeCompare(b));
      const hasDeadRegion = original.some(id => regionsDown.has(topo.regionOf.get(id) ?? ''));
      failover ||= hasDeadRegion && paths.length > 0;
      for (let i = 0; i < names.length; i++) {
        const members = groups.get(names[i])!;
        const split = clamp(knobNumber(values, 'split', 50) / 100);
        const weight = names.length === 1 ? 1 : i === 0 ? split : (1 - split) / (names.length - 1);
        for (const id of members) webTraffic.set(id, (webTraffic.get(id) ?? 0) + incoming * weight / members.length);
      }
    }
    if (failover) alerts.push(`GeoDNS failover: traffic rerouted (+${FAILOVER_LATENCY_MS} ms)`);
    const liveWebs = [...webTraffic.keys()].filter(id => !down(id));
    const queueIds = walk(liveWebs, n => n.kind === 'queue', () => false);
    const queueHealthy = queueIds.length > 0;
    const syncJobs = queueHealthy ? 0 : jobs;
    let webOk = 0;
    let webLatency = 0;
    for (const [id, rps] of webTraffic) {
      add(id, rps + (liveWebs.length ? syncJobs / liveWebs.length : 0));
      const nodeLoad = load.get(id) ?? 0;
      const cap = capacity.get(id) ?? 0;
      webOk += down(id) ? 0 : rps * (1 - dropFraction(cap > 0 ? nodeLoad / cap : Infinity));
      webLatency = Math.max(webLatency, down(id) ? 0 : COMPONENTS.web.latencyMs * latencyMultiplier(cap > 0 ? nodeLoad / cap : Infinity));
    }
    const sessionLoss = t < sessionUntil && !sharedSessions() ? sessionShare : 0;
    webOk *= 1 - sessionLoss;
    if (sessionLoss > 0) alerts.push(`Sticky sessions lost: ${Math.round(sessionLoss * 100)}% of users logged out`);
    const dataIds = dataPaths(liveWebs);
    const dataNeeded = dataIds.length > 0;
    const dataLoad = webOk * DATA_FACTOR;
    const reads = dataLoad * READ_SHARE;
    const writes = dataLoad - reads;
    const cacheIds = walk(liveWebs, n => n.kind === 'cache', () => false);
    const cacheCapacity = cacheIds.reduce((sum, id) => sum + (capacity.get(id) ?? 0), 0);
    const hitRate = dataNeeded && cacheIds.length ? cacheHitRate(values) * Math.min(1, cacheCapacity / Math.max(1, reads)) : 0;
    const misses = reads * (1 - hitRate);
    for (const id of cacheIds) add(id, reads / cacheIds.length);
    if ((cacheIds.length || cdnUsed) && knobNumber(values, 'ttl', 300) > 3600) alerts.push('Stale-data risk: long TTL keeps old copies around after a write');
    let droppedData = 0;
    let dataLatency = dataNeeded ? 0 : COMPONENTS.db.latencyMs;
    const shards = dataIds.filter(id => topo.byId.get(id)?.kind === 'shard');
    const usableShards = shards.filter(id => !down(id) && (capacity.get(id) ?? 0) > 0);
    if (shards.length) {
      const hot = t < hotUntil ? hotShare : 0;
      // Never redistribute a dead shard's keys silently: it owns unique data.
      for (let i = 0; i < shards.length; i++) {
        const id = shards[i];
        const count = Math.max(1, shards.length * shardScale);
        const normalShare = shardScale / count;
        const rps = misses * (i === 0 ? hot + (1 - hot) * normalShare : (1 - hot) * normalShare) + writes * normalShare;
        add(id, rps);
        droppedData += rps - served(id, rps);
        dataLatency = Math.max(dataLatency, COMPONENTS.shard.latencyMs * latencyMultiplier(rps / Math.max(1, capacity.get(id) ?? 0)));
      }
      if (!usableShards.length) droppedData = misses + writes;
      if (hot > 0) alerts.push(`Celebrity post: ${Math.round(hot * 100)}% of reads hammer ${label(shards[0])}`);
    } else if (dataNeeded) {
      const masters = dataIds.filter(id => ['db', 'nosql'].includes(topo.byId.get(id)!.kind) && !down(id));
      for (const id of [...promoted]) if (down(id) || !dataIds.includes(id)) promoted.delete(id);
      if (masters.length) { primaryDownAt = null; promoted.clear(); }
      if (!masters.length && !promoted.size && primaryDownAt === null) primaryDownAt = t;
      const replicas = dataIds.filter(id => topo.byId.get(id)?.kind === 'db-replica' && !down(id) && (capacity.get(id) ?? 0) > 0);
      if (primaryDownAt !== null && t - primaryDownAt >= PROMOTION_DELAY_SEC && !promoted.size) {
        if (replicas.length) { promoted.add(replicas[0]); promotedAt = t; }
        else primaryLost = true;
      }
      const activeMasters = [...masters, ...promoted];
      const readReplicas = replicas.filter(id => !promoted.has(id));
      const readTargets = readReplicas.length ? readReplicas : activeMasters;
      const loads = new Map<string, number>();
      for (const id of readTargets) loads.set(id, misses / readTargets.length);
      for (const id of activeMasters) loads.set(id, (loads.get(id) ?? 0) + writes / activeMasters.length);
      if (!readTargets.length) droppedData += misses;
      if (!activeMasters.length) { droppedData += writes; alerts.push('Primary database is DOWN — waiting 3s for replica promotion'); }
      for (const [id, rps] of loads) {
        add(id, rps);
        droppedData += rps - served(id, rps);
        dataLatency = Math.max(dataLatency, COMPONENTS[topo.byId.get(id)!.kind].latencyMs * latencyMultiplier(rps / Math.max(1, capacity.get(id) ?? 0)));
      }
      if (!activeMasters.length && !readTargets.length) dataLatency = 2500;
      else if (!activeMasters.length) dataLatency = Math.max(dataLatency, 250);
      if (t - promotedAt < 3 && promoted.size) alerts.push(`${label([...promoted][0])} promoted to primary — recent writes may be stale`);
    }
    const crossLinks = topo.graph.edges.some(e => {
      const a = topo.byId.get(e.from)!; const b = topo.byId.get(e.to)!;
      return a && b && isData(a) && isData(b) && topo.regionOf.has(a.id) && topo.regionOf.has(b.id) && topo.regionOf.get(a.id) !== topo.regionOf.get(b.id);
    });
    const crossReplicas = nodesOf('db-replica').some(n => !down(n.id) && dataIds.includes(n.id));
    const replication = values.replicas === undefined ? crossLinks || crossReplicas : knobNumber(values, 'replicas', 0) > 0 && (crossLinks || crossReplicas);
    const regionLoss = regionsDown.size > 0 && topo.graph.nodes.some(n => isData(n) && regionsDown.has(topo.regionOf.get(n.id) ?? '')) && !replication;
    const dataLoss = primaryLost || regionLoss;
    if (dataLoss) alerts.push('DATA LOSS — no surviving synchronized copy of the failed data');
    let dataOk = dataNeeded ? webOk * (1 - clamp(droppedData / Math.max(1e-9, dataLoad))) : webOk;
    if (regionLoss) dataOk *= 0.5;
    const workers = walk(queueIds, n => n.kind === 'worker', () => false);
    const workerCapacity = workers.reduce((sum, id) => sum + (capacity.get(id) ?? 0), 0);
    // Producers disappearing stops new jobs; consumers can still drain old ones.
    const allQueues = nodesOf('queue').filter(n => !down(n.id)).map(n => n.id);
    const drainingWorkers = walk(allQueues, n => n.kind === 'worker', () => false);
    const drainCapacity = drainingWorkers.reduce((sum, id) => sum + (capacity.get(id) ?? 0), 0);
    const arrivals = queueHealthy && webOk > 0 ? jobs * Math.min(1, webOk / Math.max(1, webIncoming)) : 0;
    const drain = dt > 0 ? Math.min(drainCapacity, arrivals + backlog / dt) : Math.min(drainCapacity, arrivals + backlog);
    if (dt > 0) backlog = Math.max(0, backlog + (arrivals - drain) * dt);
    for (const id of queueIds) add(id, arrivals / queueIds.length);
    for (const id of drainingWorkers) add(id, drainCapacity > 0 ? drain * (capacity.get(id) ?? 0) / drainCapacity : 0);
    if (backlog > 100) alerts.push(`Queue backlog: ${Math.round(backlog)} jobs waiting (${Math.round(workerCapacity)} jobs/s consumer capacity)`);
    const ok = Math.min(offered, staticOk + dataOk);
    if (dt > 0) {
      okTotal += ok * dt; total += offered * dt;
      recent.push({ at: t + dt, ok: ok * dt, total: offered * dt });
    }
    while (recent.length && recent[0].at <= t - RECENT_WINDOW_SEC + 1e-9) recent.shift();
    const recentTotal = recent.reduce((sum, w) => sum + w.total, 0);
    const recentOk = recent.reduce((sum, w) => sum + w.ok, 0);
    const nodes: Record<string, NodeState> = {};
    for (const n of topo.graph.nodes) {
      if (n.kind === 'dns') add(n.id, offered / Math.max(1, nodesOf('dns').length));
      if (n.kind === 'datacenter') add(n.id, liveWebs.filter(id => topo.regionOf.get(id) === n.id).reduce((sum, id) => sum + (webTraffic.get(id) ?? 0), 0));
      // Tooling observes traffic but never adds latency or capacity to the path.
      if (n.kind === 'logging' || n.kind === 'metrics') add(n.id, down(n.id) ? 0 : webOk);
      const rps = load.get(n.id) ?? 0;
      const cap = capacity.get(n.id) ?? COMPONENTS[n.kind].capacity;
      const util = Number.isFinite(cap) ? (cap > 0 ? rps / cap : rps > 0 ? 10 : 0) : 0;
      const health = down(n.id) ? 'down' : util > 1 ? 'overloaded' : util > 0.8 ? 'degraded' : 'healthy';
      if (health === 'overloaded') alerts.push(`${label(n.id)} overloaded ${Math.round(util * 100)}%`);
      if (health === 'down') alerts.push(`${label(n.id)} is DOWN`);
      nodes[n.id] = { id: n.id, kind: n.kind, label: label(n.id), capacity: cap, rps, util, health, droppedRps: down(n.id) ? rps : rps * dropFraction(util), downSince: dead.get(n.id), promoted: promoted.has(n.id) || undefined };
    }
    let cost = topo.graph.nodes.reduce((sum, n) => sum + COMPONENTS[n.kind].cost, 0);
    for (const [kind, multiplier] of [['web', serverScale], ['db-replica', replicaScale], ['worker', workerScale], ['shard', shardScale]] as const) cost += nodesOf(kind).length * (multiplier - 1) * COMPONENTS[kind].cost;
    const flows = topo.graph.edges.map(e => {
      const from = nodes[e.from]; const to = nodes[e.to];
      const incoming = topo.graph.edges.filter(other => other.to === e.to && nodes[other.from]?.health !== 'down').length;
      const rps = !from || !to || from.health === 'down' || to.health === 'down' ? 0 : to.rps / Math.max(1, incoming);
      return { from: e.from, to: e.to, rps, errorRate: !to || to.health === 'down' ? 1 : dropFraction(to.util) };
    });
    const p95 = offered === 0 ? 0 : webIncoming === 0 ? COMPONENTS.cdn.latencyMs : webOk === 0 ? 2500 : Math.min(2500, webLatency + dataLatency * (1 - hitRate * READ_SHARE) + (syncJobs ? Math.min(1500, syncJobs * 5) : 0) + (failover ? FAILOVER_LATENCY_MS : 0) + (nodesOf('lb').some(n => !down(n.id)) ? COMPONENTS.lb.latencyMs : 0));
    return { t, rps: offered, uptime: total > 0 ? okTotal / total : offered > 0 ? ok / offered : 1, recentUptime: recentTotal > 0 ? recentOk / recentTotal : offered > 0 ? ok / offered : 1, p95, cost, cacheHitRate: hitRate, queueLength: backlog, jobsPerSec: jobs, nodes, flows, alerts, regionsDown: [...regionsDown], sessionLossRate: sessionLoss, dataLoss, totals: { ok: okTotal, total } };
  }
  due();
  let current = tick(0);
  return {
    step(dt) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Simulation dt must be finite and non-negative');
      const end = t + dt;
      while (t < end - 1e-9) {
        due();
        const nextAt = events[eventIndex]?.at ?? Infinity;
        const duration = Math.min(0.25, end - t, nextAt - t);
        tick(duration);
        t += duration;
        due();
      }
      current = tick(0);
      return current;
    },
    get state() { return current; },
    get time() { return t; },
    apply(event) { apply(event); current = tick(0); },
    setKnobs(next) {
      const previousServers = values.servers;
      values = { ...initialKnobs(config), ...next };
      if (previousServers !== values.servers) loseSessions(0.25);
      current = tick(0);
    },
    setGraph(next) { topo = topology(next); current = tick(0); },
    drainEvents() { const out = fired; fired = []; return out; },
    get messages() { return [...messages]; },
  };
}
export function simulate(config: SimConfig, graph: ArchGraph, tSec: number, knobs?: KnobValues): SimState {
  const sim = createSim(config, graph, knobs);
  return sim.step(tSec);
}
