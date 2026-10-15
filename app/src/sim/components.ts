import type { ComponentKind, ComponentSpec } from '@/types/content';

/**
 * The shop catalogue: what every component costs and can handle.
 * Capacities are requests/sec (jobs/sec for workers). Costs are one-off
 * placement credits — the game teaches trade-offs, not billing.
 */
export const COMPONENTS: Record<ComponentKind, ComponentSpec> = {
  client: {
    kind: 'client',
    name: 'Web browser',
    cost: 0,
    capacity: Number.POSITIVE_INFINITY,
    latencyMs: 0,
    description: 'Your users on desktop browsers. The source of all traffic.',
  },
  mobile: {
    kind: 'mobile',
    name: 'Mobile app',
    cost: 0,
    capacity: Number.POSITIVE_INFINITY,
    latencyMs: 0,
    description: 'Your users on phones. Talks to the same API as the browser.',
  },
  dns: {
    kind: 'dns',
    name: 'DNS',
    cost: 10,
    capacity: 1_000_000,
    latencyMs: 5,
    description: 'Resolves api.pixelpost.com to an IP address. Lookup only — requests then go straight to the server.',
  },
  lb: {
    kind: 'lb',
    name: 'Load balancer',
    cost: 150,
    capacity: 50_000,
    latencyMs: 1,
    description: 'Spreads traffic across a pool of web servers and routes around dead ones.',
  },
  web: {
    kind: 'web',
    name: 'Web server',
    cost: 100,
    capacity: 1_000,
    latencyMs: 20,
    description: 'Serves pages and API requests. Stateless once sessions move out.',
  },
  db: {
    kind: 'db',
    name: 'Database (primary)',
    cost: 300,
    capacity: 800,
    latencyMs: 15,
    description: 'Relational primary. Takes every write; reads too when there is no replica.',
  },
  'db-replica': {
    kind: 'db-replica',
    name: 'DB replica',
    cost: 250,
    capacity: 800,
    latencyMs: 15,
    description: 'Read-only copy of the primary. Takes reads off it and can be promoted on failure.',
  },
  cache: {
    kind: 'cache',
    name: 'Cache',
    cost: 120,
    capacity: 20_000,
    latencyMs: 1,
    description: 'In-memory read-through cache. A hit saves a database trip.',
  },
  cdn: {
    kind: 'cdn',
    name: 'CDN',
    cost: 200,
    capacity: 100_000,
    latencyMs: 5,
    description: 'Edge servers that serve static content (photos!) from close to the user.',
  },
  'session-store': {
    kind: 'session-store',
    name: 'Session store',
    cost: 80,
    capacity: 20_000,
    latencyMs: 2,
    description: 'Shared session data so any web server can serve any user. Kills sticky-session pain.',
  },
  nosql: {
    kind: 'nosql',
    name: 'NoSQL store',
    cost: 250,
    capacity: 1_200,
    latencyMs: 10,
    description: 'Non-relational store: huge scale, no joins. Right tool for some jobs, wrong for relational data.',
  },
  queue: {
    kind: 'queue',
    name: 'Message queue',
    cost: 60,
    capacity: 100_000,
    latencyMs: 2,
    description: 'Buffers async jobs so slow work never blocks a web request.',
  },
  worker: {
    kind: 'worker',
    name: 'Worker',
    cost: 80,
    capacity: 50,
    latencyMs: 5,
    description: 'Drains the queue one job at a time (~50 jobs/sec each).',
  },
  datacenter: {
    kind: 'datacenter',
    name: 'Data center',
    cost: 400,
    capacity: Number.POSITIVE_INFINITY,
    latencyMs: 0,
    description: 'A region (US-East, US-West...). Everything drawn under it lives there.',
  },
  shard: {
    kind: 'shard',
    name: 'DB shard',
    cost: 200,
    capacity: 800,
    latencyMs: 15,
    description: 'One slice of the data, chosen by sharding key. A hot key can melt a single shard.',
  },
  logging: {
    kind: 'logging',
    name: 'Logging',
    cost: 30,
    capacity: 50_000,
    latencyMs: 0,
    description: 'Centralised logs. Does not serve traffic but you will miss it when it is gone.',
  },
  metrics: {
    kind: 'metrics',
    name: 'Metrics',
    cost: 30,
    capacity: 50_000,
    latencyMs: 0,
    description: 'Dashboards and alerts: host, aggregated and business metrics.',
  },
  ci: {
    kind: 'ci',
    name: 'CI pipeline',
    cost: 40,
    capacity: Number.POSITIVE_INFINITY,
    latencyMs: 0,
    description: 'Automated tests and deploys. Ship fast without breaking things.',
  },
  storage: {
    kind: 'storage',
    name: 'Object storage',
    cost: 100,
    capacity: 50_000,
    latencyMs: 10,
    description: 'Durable blobs for the original photo files.',
  },
};

/** Cost of everything currently placed on the board. */
export function graphCost(kinds: Iterable<ComponentKind>): number {
  let total = 0;
  for (const k of kinds) total += COMPONENTS[k].cost;
  return total;
}
