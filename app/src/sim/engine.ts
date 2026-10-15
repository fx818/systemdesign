/**
 * The one shared simulation engine for labs, missions and the boss level.
 * Everything here is PURE and DETERMINISTIC: same config + graph + events +
 * knobs + time always produce the same state. No Math.random, no wall clock.
 */
import type {
  ArchEdge,
  ArchGraph,
  ArchNode,
  CharacterId,
  ComponentKind,
  SimConfig,
  SimEvent,
} from '@/types/content';
import { COMPONENTS } from './components';
import {
  knobBoolean,
  knobNumber,
  type EdgeFlow,
  type Health,
  type KnobValues,
  type NodeState,
  type SimState,
} from './types';

/* ------------------------------ Model constants ---------------------------- */
/** Fraction of traffic that is static content (photos, JS, CSS). */
export const STATIC_SHARE = 0.6;
/** Of the dynamic traffic that reaches the data tier, this fraction reads. */
export const READ_SHARE = 0.9;
/** How much data-tier work one web request causes (queries per request). */
export const DATA_FACTOR = 0.35;
/** A web server that also runs the database loses half its effective capacity. */
export const SELF_HOST_PENALTY = 0.5;
/** Seconds before a healthy replica is promoted after the primary dies. */
export const PROMOTION_DELAY_SEC = 3;
/** Seconds that sticky-session users stay logged out after their server dies. */
export const SESSION_LOSS_SEC = 3;
/** How long a celebrity (hotkey) event lasts. */
export const HOTKEY_SEC = 20;
/** Extra latency when traffic fails over to a far-away data center. */
export const FAILOVER_LATENCY_MS = 120;
/** Uptime is averaged over this trailing window for the "recent" metric. */
export const RECENT_WINDOW_SEC = 5;

/** utilisation -> latency multiplier: gentle to 80%, then queueing bites. */
export function latencyMultiplier(util: number): number {
  if (util <= 0.8) return 1;
  if (util <= 1) return 1 + (util - 0.8) * 10; // -> 3x at 100%
  return Math.min(8, 3 + (util - 1) * 4);
}
/** fraction of incoming requests dropped at a given utilisation. */
export function dropFraction(util: number): number {
  return util > 1 ? 1 - 1 / util : 0;
}

/* --------------------------------- Helpers --------------------------------- */
const DATA_KINDS: ReadonlySet<ComponentKind> = new Set(['db', 'db-replica', 'nosql', 'shard']);
const MASTER_KINDS: ReadonlySet<ComponentKind> = new Set(['db', 'nosql']);
/** kinds traffic may flow THROUGH on the way from a client to a web server. */
const PASS_THROUGH: ReadonlySet<ComponentKind> = new Set(['dns', 'lb', 'datacenter']);

interface Topo {
  nodes: ArchNode[];
  byId: Map<string, ArchNode>;
  out: Map<string, ArchEdge[]>;
  inn: Map<string, ArchEdge[]>;
  regionOf: Map<string, string>;
  regions: string[];
}

function buildTopo(graph: ArchGraph): Topo {
  const byId = new Map<string, ArchNode>();
  const out = new Map<string, ArchEdge[]>();
  const inn = new Map<string, ArchEdge[]>();
  for (const n of graph.nodes) byId.set(n.id, n);
  for (const e of graph.edges) {
    if (!byId.has(e.from) || !byId.has(e.to)) continue;
    (out.get(e.from) ?? out.set(e.from, []).get(e.from)!).push(e);
    (inn.get(e.to) ?? inn.set(e.to, []).get(e.to)!).push(e);
  }
  // Tag every node downstream of a data center with that region (first DC wins).
  const regionOf = new Map<string, string>();
  const regions: string[] = [];
  for (const n of graph.nodes) {
    if (n.kind !== 'datacenter') continue;
    const region = (n.label ?? n.id).trim();
    regions.push(region);
    regionOf.set(n.id, region);
    const queue = [n.id];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const e of out.get(cur) ?? []) {
        if (regionOf.has(e.to)) continue;
        const target = byId.get(e.to)!;
        if (target.kind === 'datacenter') continue;
        regionOf.set(e.to, region);
        queue.push(e.to);
      }
    }
  }
  return { nodes: graph.nodes, byId, out, inn, regionOf, regions };
}

/** BFS from entry nodes through pass-through kinds; returns reachable node ids of `kinds`. */
function reachableOfKind(topo: Topo, entries: string[], kinds: ReadonlySet<ComponentKind>): Set<string> {
  const found = new Set<string>();
  const visited = new Set<string>(entries);
  const queue = [...entries];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const e of topo.out.get(cur) ?? []) {
      if (visited.has(e.to)) continue;
      visited.add(e.to);
      const target = topo.byId.get(e.to)!;
      if (kinds.has(target.kind)) found.add(e.to);
      if (PASS_THROUGH.has(target.kind)) queue.push(e.to);
    }
  }
  return found;
}

/** BFS from web servers (through caches) to find the data tier. */
function reachableData(topo: Topo, webIds: string[], kinds: ReadonlySet<ComponentKind>): Set<string> {
  const found = new Set<string>();
  const visited = new Set<string>(webIds);
  const queue = [...webIds];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const e of topo.out.get(cur) ?? []) {
      if (visited.has(e.to)) continue;
      visited.add(e.to);
      const target = topo.byId.get(e.to)!;
      if (kinds.has(target.kind)) found.add(e.to);
      if (target.kind === 'cache') queue.push(e.to);
    }
  }
  return found;
}

/** Deterministic cache hit rate from the lab knobs. */
export function cacheHitRate(knobs: KnobValues | undefined): number {
  const ttl = Math.max(0, knobNumber(knobs, 'ttl', 30));
  const size = Math.max(1, knobNumber(knobs, 'cacheSize', 100));
  const policy = knobs?.eviction;
  const ttlF = ttl / (ttl + 30);
  const sizeF = size / (size + 100);
  const evictF = policy === 'fifo' ? 0.82 : policy === 'lfu' ? 0.92 : 1; // lru default
  return Math.min(0.98, (0.35 + 0.45 * ttlF + 0.25 * sizeF) * evictF);
}

/** Knob values initialised from the config's knob definitions. */
export function initialKnobs(config: SimConfig): KnobValues {
  const out: KnobValues = {};
  for (const k of config.knobs ?? []) out[k.id] = k.initial;
  return out;
}

/* ---------------------------------- Engine --------------------------------- */
export interface SimMessage {
  at: number;
  who: CharacterId;
  text: string;
}

export interface Sim {
  /** Advance the simulation by dt seconds and return the new state. */
  step(dt: number): SimState;
  /** The most recently computed state (valid after construction, t=0). */
  readonly state: SimState;
  /** Fire an event right now (chaos buttons in the lab). `at` is ignored. */
  apply(event: SimEvent): void;
  /** Replace the knob values (lab sliders moved). */
  setKnobs(knobs: KnobValues): void;
  /** Events fired since the last drain (for banners); does not include manual applies. */
  drainEvents(): SimEvent[];
  /** Every message event fired so far. */
  readonly messages: SimMessage[];
  /** Current simulation time. */
  readonly time: number;
}

export function createSim(config: SimConfig, graph: ArchGraph, knobs?: KnobValues): Sim {
  const topo = buildTopo(graph);
  let knobValues: KnobValues = { ...initialKnobs(config), ...knobs };
  const events = [...config.events].sort((a, b) => a.at - b.at);
  let nextEvent = 0;

  /* ------------------------------- mutable state --------------------------- */
  let t = 0;
  let trafficLevel = 0;
  let jobsPerSec = 0;
  let queueLength = 0;
  const downSince = new Map<string, number>();
  const downRegions = new Set<string>();
  const promoted = new Set<string>();
  let promotedAt = -Infinity;
  let masterDownSince: number | null = null;
  let dataLoss = false;
  let hotkeyUntil = -Infinity;
  let hotkeyShare = 0;
  let sessionLossUntil = -Infinity;
  let sessionLossRate = 0;
  let okCum = 0;
  let totalCum = 0;
  const window: { t: number; ok: number; total: number }[] = [];
  let drainQueue: SimEvent[] = [];
  const firedMessages: SimMessage[] = [];
  let current: SimState;

  /* -------------------------------- lookups -------------------------------- */
  const entries = topo.nodes.filter((n) => n.kind === 'client' || n.kind === 'mobile').map((n) => n.id);
  const entryShare = entries.length > 0 ? 1 / entries.length : 0;
  const hasSessionStore = topo.nodes.some((n) => n.kind === 'session-store');
  const replicaIdsOnBoard = topo.nodes.filter((n) => n.kind === 'db-replica').map((n) => n.id);
  // the queue only decouples jobs if a web server can actually reach it
  const queueOnBoard = (() => {
    const webIds = topo.nodes.filter((n) => n.kind === 'web').map((n) => n.id);
    const visited = new Set<string>(webIds);
    const queueIds = [...webIds];
    while (queueIds.length > 0) {
      const cur = queueIds.shift()!;
      for (const e of topo.out.get(cur) ?? []) {
        if (visited.has(e.to)) continue;
        visited.add(e.to);
        const kind = topo.byId.get(e.to)?.kind;
        if (kind === 'queue') return true;
        if (kind === 'web') queueIds.push(e.to);
      }
    }
    return false;
  })();

  const isDown = (id: string): boolean => downSince.has(id) || downRegions.has(topo.regionOf.get(id) ?? '\0');

  const labelOf = (id: string): string => {
    const n = topo.byId.get(id);
    return n?.label ?? n?.id ?? id;
  };

  /** web servers receive traffic only if connected (through lb/dns/dc) to a client. */
  function healthyWebs(): string[] {
    const reachable = reachableOfKind(topo, entries, new Set(['web']));
    return topo.nodes.filter((n) => n.kind === 'web' && reachable.has(n.id) && !isDown(n.id)).map((n) => n.id);
  }

  function applyEvent(ev: SimEvent): void {
    switch (ev.type) {
      case 'traffic':
        trafficLevel = ev.rps;
        break;
      case 'jobs':
        jobsPerSec = ev.perSec;
        break;
      case 'kill': {
        for (const id of resolveTarget(ev.target)) {
          if (isDown(id)) continue;
          downSince.set(id, t);
          onKilled(id);
        }
        break;
      }
      case 'revive': {
        for (const id of resolveTarget(ev.target)) {
          downSince.delete(id);
          if (MASTER_KINDS.has(topo.byId.get(id)?.kind ?? 'web')) {
            dataLoss = false;
            masterDownSince = null;
          }
        }
        break;
      }
      case 'region-down': {
        const name = ev.region.trim().toLowerCase();
        const match = topo.regions.find((r) => r.toLowerCase() === name);
        if (match) downRegions.add(match);
        break;
      }
      case 'hotkey':
        hotkeyShare = ev.share;
        hotkeyUntil = t + HOTKEY_SEC;
        break;
      case 'message':
        firedMessages.push({ at: t, who: ev.who, text: ev.text });
        break;
    }
  }

  function resolveTarget(target: ComponentKind | string): string[] {
    if (topo.byId.has(target)) return [target];
    return topo.nodes.filter((n) => n.kind === (target as ComponentKind)).map((n) => n.id);
  }

  function onKilled(id: string): void {
    const kind = topo.byId.get(id)?.kind;
    if (kind !== 'web') return;
    // Sticky sessions: the dead server's share of users loses their session,
    // unless a shared session store exists. (Level 8, "Forget Me Not".)
    const sticky = knobBoolean(knobValues, 'sticky', false);
    if (!sticky || hasSessionStore) return;
    const alive = healthyWebs().length + 1; // +1: the one that just died
    sessionLossRate = Math.max(sessionLossRate, 1 / Math.max(1, alive));
    sessionLossUntil = t + SESSION_LOSS_SEC;
  }

  /* ------------------------------ per-tick model --------------------------- */
  function computeTick(dt: number): SimState {
    const rps = knobNumber(knobValues, 'rps', NaN);
    const offered = Number.isFinite(rps) ? rps : trafficLevel;

    const alerts: string[] = [];
    const nodeRps = new Map<string, number>();
    const nodeCap = new Map<string, number>();
    const nodeDown = new Map<string, boolean>();
    for (const n of topo.nodes) {
      nodeRps.set(n.id, 0);
      nodeCap.set(n.id, COMPONENTS[n.kind].capacity);
      nodeDown.set(n.id, isDown(n.id));
    }

    /* --- entry & static share --------------------------------------------- */
    for (const id of entries) nodeRps.set(id, offered * entryShare);
    const dnsIds = topo.nodes.filter((n) => n.kind === 'dns').map((n) => n.id);
    for (const id of dnsIds) nodeRps.set(id, offered);

    const cdnAllowed = knobBoolean(knobValues, 'cdn', true);
    const cdnReachable = reachableOfKind(topo, entries, new Set(['cdn']));
    const cdnHealthy = topo.nodes.filter((n) => n.kind === 'cdn' && cdnReachable.has(n.id) && !isDown(n.id));
    const cdnServing = cdnAllowed && cdnHealthy.length > 0;
    const cdnRps = cdnServing ? offered * STATIC_SHARE : 0;
    const cdnCap = cdnHealthy.reduce((s, n) => s + COMPONENTS.cdn.capacity, 0);
    const cdnUtil = cdnCap > 0 ? cdnRps / cdnCap : 0;
    const cdnDrop = dropFraction(cdnUtil);
    for (const n of cdnHealthy) nodeRps.set(n.id, cdnRps / cdnHealthy.length);
    const staticOk = cdnRps * (1 - cdnDrop);

    /* --- web tier ---------------------------------------------------------- */
    const webs = healthyWebs();
    const webIn = offered * (cdnServing ? 1 - STATIC_SHARE : 1);

    // group webs by region (untagged webs form one global group)
    const groups = new Map<string, string[]>();
    for (const id of webs) {
      const region = topo.regionOf.get(id) ?? '';
      (groups.get(region) ?? groups.set(region, []).get(region)!).push(id);
    }
    const groupNames = [...groups.keys()];
    const splitPct = Math.min(100, Math.max(0, knobNumber(knobValues, 'split', 50))) / 100;
    const shareOf = new Map<string, number>();
    if (groupNames.length <= 1) {
      for (const g of groupNames) shareOf.set(g, 1);
    } else {
      shareOf.set(groupNames[0], splitPct);
      const rest = (1 - splitPct) / (groupNames.length - 1);
      for (let i = 1; i < groupNames.length; i++) shareOf.set(groupNames[i], rest);
    }
    // failover: empty groups hand their share to groups that still have servers
    const liveGroups = groupNames.filter((g) => (groups.get(g) ?? []).length > 0);
    const deadShare = groupNames.filter((g) => !liveGroups.includes(g)).reduce((s, g) => s + (shareOf.get(g) ?? 0), 0);
    const failoverActive = deadShare > 0 && liveGroups.length > 0;
    for (const g of liveGroups) shareOf.set(g, (shareOf.get(g) ?? 0) + deadShare / liveGroups.length);
    if (failoverActive) {
      const dead = groupNames.filter((g) => !liveGroups.includes(g)).join(', ');
      alerts.push(`Region ${dead || 'primary'} unreachable — failing over (+${FAILOVER_LATENCY_MS} ms)`);
    }

    // does each web server talk to a data tier? If not it self-hosts (penalty).
    const hasDataEdge = new Map<string, boolean>();
    for (const id of webs) {
      const data = (topo.out.get(id) ?? []).some((e) => DATA_KINDS.has(topo.byId.get(e.to)?.kind ?? 'web') || topo.byId.get(e.to)?.kind === 'cache');
      hasDataEdge.set(id, data);
    }
    const dataNeeded = webs.some((id) => hasDataEdge.get(id));

    // capacity, incl. the "servers" knob that virtually scales the pool
    let poolCap = 0;
    const effCap = new Map<string, number>();
    for (const id of webs) {
      const base = COMPONENTS.web.capacity * (hasDataEdge.get(id) ? 1 : SELF_HOST_PENALTY);
      effCap.set(id, base);
      poolCap += base;
    }
    const knobServers = knobNumber(knobValues, 'servers', NaN);
    let boost = 1;
    if (Number.isFinite(knobServers) && webs.length > 0) {
      const virtualCap = knobServers * COMPONENTS.web.capacity;
      if (virtualCap > poolCap) boost = virtualCap / poolCap;
    }
    poolCap *= boost;

    // background jobs that are NOT decoupled by a queue tie up web capacity
    const queueHealthy = queueOnBoard && topo.nodes.some((n) => n.kind === 'queue' && !isDown(n.id));
    const syncJobs = jobsPerSec > 0 && !queueHealthy ? jobsPerSec : 0;

    const webLoad = webIn + syncJobs;
    const webUtil = poolCap > 0 ? webLoad / poolCap : webLoad > 0 ? Infinity : 0;
    const webDrop = dropFraction(webUtil);
    const webServedGross = webIn * (1 - webDrop);

    // sticky-session logout spike
    const sessionLossActive = t < sessionLossUntil;
    const sessionLost = sessionLossActive ? webServedGross * sessionLossRate : 0;
    if (sessionLossActive && sessionLost > 0) {
      alerts.push(`Sticky sessions lost — ${Math.round(sessionLossRate * 100)}% of users logged out`);
    }
    const webServed = webServedGross - sessionLost;

    for (const id of webs) {
      const region = topo.regionOf.get(id) ?? '';
      const members = groups.get(region) ?? [];
      const share = shareOf.get(region) ?? 0;
      nodeRps.set(id, members.length > 0 ? (webIn * share) / members.length : 0);
      nodeCap.set(id, (effCap.get(id) ?? COMPONENTS.web.capacity) * boost);
    }

    /* --- load balancer (display + latency) --------------------------------- */
    const lbReachable = reachableOfKind(topo, entries, new Set(['lb']));
    const lbHealthy = topo.nodes.filter((n) => n.kind === 'lb' && lbReachable.has(n.id) && !isDown(n.id));
    const lbCap = lbHealthy.length * COMPONENTS.lb.capacity;
    const lbUtil = lbCap > 0 ? webIn / lbCap : 0;
    for (const n of lbHealthy) nodeRps.set(n.id, webIn / lbHealthy.length);

    /* --- data centers (display) -------------------------------------------- */
    for (const n of topo.nodes) {
      if (n.kind !== 'datacenter') continue;
      const region = topo.regionOf.get(n.id)!;
      nodeRps.set(n.id, webIn * (shareOf.get(region) ?? 0));
    }

    /* --- data tier ---------------------------------------------------------- */
    let dataDropFrac = 0;
    let dbReadLat = COMPONENTS.db.latencyMs;
    let dbWriteLat = COMPONENTS.db.latencyMs;
    const dataLoad = dataNeeded ? webServed * DATA_FACTOR : 0;
    const reads = dataLoad * READ_SHARE;
    const writes = dataLoad - reads;

    const cacheIds = reachableData(topo, webs, new Set(['cache']));
    const cacheHealthy = [...cacheIds].filter((id) => !isDown(id));
    const cacheOk = dataNeeded && cacheHealthy.length > 0;
    const hitRate = cacheOk ? cacheHitRate(knobValues) : 0;
    const misses = reads * (1 - hitRate);
    for (const id of cacheHealthy) nodeRps.set(id, reads / cacheHealthy.length);

    if (dataNeeded) {
      const dataReachable = reachableData(topo, webs, DATA_KINDS);
      const shardIds = topo.nodes
        .filter((n) => n.kind === 'shard' && dataReachable.has(n.id) && !isDown(n.id))
        .map((n) => n.id);
      const replicaIds = topo.nodes
        .filter((n) => n.kind === 'db-replica' && dataReachable.has(n.id) && !isDown(n.id))
        .map((n) => n.id);
      const masterIds = topo.nodes
        .filter((n) => MASTER_KINDS.has(n.kind) && dataReachable.has(n.id) && !isDown(n.id))
        .map((n) => n.id);

      if (shardIds.length > 0 || knobNumber(knobValues, 'shards', 0) > 1) {
        /* ---- sharded: split by key, hotkey concentrates on shard zero ----- */
        const n = Math.max(shardIds.length, Math.floor(knobNumber(knobValues, 'shards', 0)), 1);
        const hot = t < hotkeyUntil ? hotkeyShare : 0;
        const perShardCap = COMPONENTS.shard.capacity;
        let dropped = 0;
        let hottest = 0;
        for (let i = 0; i < n; i++) {
          const readShare = i === 0 ? hot + (1 - hot) / n : (1 - hot) / n;
          const load = reads * readShare + writes / n;
          const util = perShardCap > 0 ? load / perShardCap : Infinity;
          dropped += load * dropFraction(util);
          if (i < shardIds.length) {
            nodeRps.set(shardIds[i], load);
            nodeCap.set(shardIds[i], perShardCap);
          }
          hottest = Math.max(hottest, util);
        }
        dbReadLat = COMPONENTS.shard.latencyMs * latencyMultiplier(hottest);
        dbWriteLat = dbReadLat;
        dataDropFrac = dataLoad > 0 ? dropped / dataLoad : 0;
        if (hot > 0 && shardIds.length > 0) {
          alerts.push(
            `Celebrity post: ${Math.round(hot * 100)}% of reads hammer ${labelOf(shardIds[0])}`,
          );
        }
      } else {
        /* ---- classic primary/replica -------------------------------------- */
        const knobReplicas = Math.floor(knobNumber(knobValues, 'replicas', 0));
        const replicaCount = Math.max(replicaIds.length, knobReplicas);
        const readCap = replicaCount > 0 ? replicaCount * COMPONENTS['db-replica'].capacity : 0;

        // promotion bookkeeping: is every primary dead?
        const anyMasterOnBoard = topo.nodes.some((n) => MASTER_KINDS.has(n.kind) && dataReachable.has(n.id));
        const mastersGone = anyMasterOnBoard && masterIds.length === 0 && promoted.size === 0;
        if (mastersGone && masterDownSince === null) masterDownSince = t;
        if (masterDownSince !== null && t - masterDownSince >= PROMOTION_DELAY_SEC && promoted.size === 0) {
          const candidate = replicaIds[0];
          if (candidate !== undefined) {
            promoted.add(candidate);
            promotedAt = t;
            masterDownSince = null;
          } else if (replicaIdsOnBoard.length === 0) {
            dataLoss = true;
          }
        }
        const activeMasters = [...masterIds, ...promoted];
        const masterCap = activeMasters.length * COMPONENTS.db.capacity;

        // reads: replicas first, primary only when no replica exists
        const readTargetCap = replicaCount > 0 ? readCap : masterCap;
        const readUtil = readTargetCap > 0 ? misses / readTargetCap : misses > 0 ? Infinity : 0;
        const readDrop = dropFraction(readUtil);
        const writeUtil = masterCap > 0 ? writes / masterCap : writes > 0 ? Infinity : 0;
        const writeDrop = dropFraction(writeUtil);
        const mastersAlive = activeMasters.length > 0;
        const dataReachableAny = dataReachable.size > 0;

        if (!dataReachableAny) {
          // edges point at a data tier that is entirely dead/unreachable
          dataDropFrac = 1;
        } else if (!mastersAlive && replicaCount === 0) {
          dataDropFrac = 1; // nothing can serve anything
        } else {
          const readDropped = readDrop * misses;
          const writeDropped = mastersAlive ? writeDrop * writes : writes; // dead primary => all writes fail
          dataDropFrac = dataLoad > 0 ? (readDropped + writeDropped) / dataLoad : 0;
        }

        dbReadLat = COMPONENTS.db.latencyMs * latencyMultiplier(Math.max(readUtil, 0));
        dbWriteLat = COMPONENTS.db.latencyMs * latencyMultiplier(Math.max(writeUtil, 0));

        for (const id of replicaIds) {
          nodeRps.set(id, replicaIds.length > 0 ? misses / replicaIds.length : 0);
        }
        if (replicaIds.length === 0) {
          for (const id of activeMasters) nodeRps.set(id, (misses + writes) / activeMasters.length);
        } else {
          for (const id of activeMasters) nodeRps.set(id, writes / activeMasters.length);
        }
        if (t - promotedAt < 3 && promoted.size > 0) {
          alerts.push(`${labelOf([...promoted][0])} promoted to primary`);
        }
        if (mastersGone && promoted.size === 0) {
          alerts.push('Primary database is DOWN — waiting for a replica to promote');
        }
      }
      if (dataLoss) alerts.push('DATA LOSS — the primary died and there is no replica');
    }

    /* --- queue & workers ----------------------------------------------------- */
    const workerCount = Math.max(
      topo.nodes.filter((n) => n.kind === 'worker' && !isDown(n.id)).length,
      Math.floor(knobNumber(knobValues, 'workers', 0)),
    );
    if (queueHealthy && jobsPerSec > 0) {
      const drain = workerCount * COMPONENTS.worker.capacity;
      queueLength = Math.max(0, queueLength + (jobsPerSec - drain) * dt);
      const q = topo.nodes.find((n) => n.kind === 'queue');
      if (q) nodeRps.set(q.id, jobsPerSec);
      if (queueLength > 100) alerts.push(`Queue backlog: ${Math.round(queueLength).toLocaleString()} jobs waiting`);
    }
    if (workerCount > 0 && jobsPerSec > 0) {
      const perWorker = Math.min(COMPONENTS.worker.capacity, jobsPerSec / workerCount + queueLength * 0.1);
      for (const n of topo.nodes) if (n.kind === 'worker') nodeRps.set(n.id, perWorker);
    }

    /* --- roll up ------------------------------------------------------------ */
    const dataOk = webServed * (1 - dataDropFrac);
    const ok = staticOk + dataOk;
    okCum += ok * dt;
    totalCum += offered * dt;
    window.push({ t, ok: ok * dt, total: offered * dt });
    while (window.length > 0 && window[0].t < t - RECENT_WINDOW_SEC) window.shift();
    const wTotal = window.reduce((s, w) => s + w.total, 0);
    const wOk = window.reduce((s, w) => s + w.ok, 0);

    /* --- per-node health / states ------------------------------------------- */
    const nodes: Record<string, NodeState> = {};
    for (const n of topo.nodes) {
      const rpsN = nodeRps.get(n.id) ?? 0;
      const capN = nodeCap.get(n.id) ?? COMPONENTS[n.kind].capacity;
      const down = nodeDown.get(n.id) ?? false;
      // web nodes also carry undecoupled background jobs on their utilisation
      const jobsShare = n.kind === 'web' && webs.length > 0 ? syncJobs / webs.length : 0;
      const finalUtil =
        !down && Number.isFinite(capN) && capN > 0 ? (rpsN + jobsShare) / capN : 0;
      const health: Health = down
        ? 'down'
        : finalUtil > 1
          ? 'overloaded'
          : finalUtil > 0.8
            ? 'degraded'
            : 'healthy';
      if (!down && finalUtil > 1 && rpsN > 0) {
        alerts.push(`${labelOf(n.id)} overloaded ${Math.round(finalUtil * 100)}%`);
      }
      if (down && n.kind !== 'datacenter' && (downSince.has(n.id) || downRegions.size > 0)) {
        if (downSince.has(n.id)) alerts.push(`${labelOf(n.id)} is DOWN`);
      }
      nodes[n.id] = {
        id: n.id,
        kind: n.kind,
        label: labelOf(n.id),
        capacity: capN,
        rps: rpsN,
        util: finalUtil,
        droppedRps: rpsN * dropFraction(finalUtil),
        health,
        downSince: downSince.get(n.id),
        promoted: promoted.has(n.id) || undefined,
      };
    }

    /* --- latency roll-up ------------------------------------------------------ */
    const lbLat = lbHealthy.length > 0 ? COMPONENTS.lb.latencyMs * latencyMultiplier(lbUtil) : 0;
    const webLat = COMPONENTS.web.latencyMs * latencyMultiplier(Number.isFinite(webUtil) ? webUtil : 8);
    const jobPenalty = syncJobs > 0 ? Math.min(500, syncJobs * 2) : 0;
    const failoverPenalty = failoverActive ? FAILOVER_LATENCY_MS : 0;
    let p95: number;
    if (offered > 0 && webs.length === 0 && webIn > 0) {
      p95 = 2500; // everything is timing out
    } else if (webIn <= 0) {
      p95 = cdnServing ? COMPONENTS.cdn.latencyMs * latencyMultiplier(cdnUtil) : 0;
    } else {
      const dataLat = dataNeeded ? Math.max(dbReadLat, dbWriteLat) : COMPONENTS.db.latencyMs; // self-hosted db work
      p95 = lbLat + webLat + dataLat + jobPenalty + failoverPenalty;
    }

    /* --- edge flows for the canvas ------------------------------------------- */
    const flows: EdgeFlow[] = topo.nodes.flatMap((n) => {
      const inn = topo.inn.get(n.id) ?? [];
      if (inn.length === 0) return [];
      const targetRps = nodeRps.get(n.id) ?? 0;
      const targetUtil = nodes[n.id]?.util ?? 0;
      const per = targetRps / inn.length;
      return inn.map((e) => ({
        from: e.from,
        to: e.to,
        rps: per,
        errorRate: nodeDown.get(n.id) ? (targetRps > 0 ? 1 : 0) : dropFraction(targetUtil),
      }));
    });

    const cost = topo.nodes.reduce((s, n) => s + COMPONENTS[n.kind].cost, 0);

    return {
      t,
      rps: offered,
      uptime: totalCum > 0 ? okCum / totalCum : 1,
      recentUptime: wTotal > 0 ? wOk / wTotal : 1,
      p95,
      cost,
      cacheHitRate: hitRate,
      queueLength,
      jobsPerSec,
      nodes,
      flows,
      alerts,
      regionsDown: [...downRegions],
      sessionLossRate: sessionLossActive ? sessionLossRate : 0,
      dataLoss,
      totals: { ok: okCum, total: totalCum },
    };
  }

  /* ------------------------------- public API ------------------------------- */
  function fireDueEvents(): void {
    while (nextEvent < events.length && events[nextEvent].at <= t + 1e-9) {
      const ev = events[nextEvent++];
      applyEvent(ev);
      drainQueue.push(ev);
    }
  }

  fireDueEvents(); // t=0 events apply before the first tick
  current = computeTick(0);

  return {
    step(dt: number): SimState {
      fireDueEvents(); // events scheduled at or before now apply to this tick
      const state = computeTick(dt);
      t += dt;
      current = { ...state, t };
      return current;
    },
    get state(): SimState {
      return current;
    },
    apply(event: SimEvent): void {
      applyEvent(event);
      current = computeTick(0);
    },
    setKnobs(next: KnobValues): void {
      knobValues = { ...next };
    },
    drainEvents(): SimEvent[] {
      const out = drainQueue;
      drainQueue = [];
      return out;
    },
    get messages(): SimMessage[] {
      return firedMessages;
    },
    get time(): number {
      return t;
    },
  };
}

/**
 * Run a full headless simulation: apply config.events on schedule and step at
 * a fixed 0.25 s until tSec. Pure and deterministic.
 */
export function simulate(config: SimConfig, graph: ArchGraph, tSec: number, knobs?: KnobValues): SimState {
  const sim = createSim(config, graph, knobs);
  const dt = 0.25;
  let t = 0;
  while (t < tSec - 1e-9) {
    const step = Math.min(dt, tSec - t);
    sim.step(step);
    t += step;
  }
  return sim.state;
}
