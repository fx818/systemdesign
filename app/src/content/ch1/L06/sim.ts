import type { SimConfig } from '@/types/content';

const base = {
  nodes: [
    { id: 'client', kind: 'client' as const, label: 'Users', x: 100, y: 360 },
    { id: 'dns', kind: 'dns' as const, label: 'DNS', x: 250, y: 110 },
    { id: 'lb', kind: 'lb' as const, label: 'Load balancer', x: 300, y: 360 },
    { id: 'web-1', kind: 'web' as const, label: 'Server 1', x: 520, y: 240 },
    { id: 'web-2', kind: 'web' as const, label: 'Server 2', x: 520, y: 480 },
    { id: 'db-1', kind: 'db' as const, label: 'Master', x: 1000, y: 200 },
    { id: 'replica-1', kind: 'db-replica' as const, label: 'Replica', x: 1000, y: 500 },
  ],
  edges: [
    { from: 'client', to: 'dns' },
    { from: 'client', to: 'lb' },
    { from: 'lb', to: 'web-1' },
    { from: 'lb', to: 'web-2' },
    { from: 'web-1', to: 'db-1', label: 'writes' },
    { from: 'web-2', to: 'db-1', label: 'writes' },
    { from: 'web-1', to: 'replica-1', label: 'reads' },
    { from: 'web-2', to: 'replica-1', label: 'reads' },
    { from: 'db-1', to: 'replica-1', label: 'replication' },
  ],
};

export const labConfig: SimConfig = {
  start: {
    nodes: [...base.nodes, { id: 'cache-1', kind: 'cache', label: 'Cache', x: 760, y: 360 }],
    edges: [...base.edges, { from: 'web-1', to: 'cache-1', label: 'get/set' }, { from: 'web-2', to: 'cache-1', label: 'get/set' }],
  },
  palette: ['cache'],
  budget: 800,
  events: [{ at: 0, type: 'traffic', rps: 2500, label: 'Feed rush hour' }],
  goals: { durationSec: 180 },
  knobs: [
    { id: 'ttl', label: 'TTL (seconds)', type: 'slider', min: 1, max: 86400, step: 1, initial: 300 },
    { id: 'cacheSize', label: 'Cache memory (GB)', type: 'slider', min: 1, max: 64, step: 1, initial: 8 },
    { id: 'eviction', label: 'Eviction policy', type: 'select', options: ['LRU', 'LFU', 'FIFO'], initial: 'LRU' },
    { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 0, max: 6000, step: 100, initial: 2500 },
  ],
  locked: ['client', 'dns', 'lb', 'web-1', 'web-2', 'db-1', 'replica-1'],
};

export const labTasks = [
  'Watch the cache hit meter and the database load: most reads never reach the database.',
  'Drag TTL down to a few seconds. Entries expire constantly, the hit rate drops and the database heats up.',
  'Drag TTL up to a day. The database relaxes, but the stale-data indicator lights up.',
  'Shrink the cache memory and compare LRU, LFU and FIFO: more evictions mean more misses.',
  'Kill the cache. Every read falls through to the database: one cache server is a single point of failure. Add a second cache and try again.',
];

export const missionConfig: SimConfig = {
  start: base,
  palette: ['cache', 'db-replica'],
  budget: 450,
  locked: ['client', 'dns', 'lb', 'web-1', 'web-2', 'db-1', 'replica-1'],
  knobs: [{ id: 'ttl', label: 'TTL (seconds)', type: 'slider', min: 1, max: 86400, step: 1, initial: 300 }],
  events: [
    { at: 0, type: 'traffic', rps: 2000, label: 'Evening scroll' },
    { at: 6, type: 'message', who: 'maya', text: 'A big influencer just shared her PixelPost feed. Brace yourselves.' },
    { at: 20, type: 'traffic', rps: 3200, label: 'Influencer traffic' },
    { at: 30, type: 'message', who: 'ravi', text: 'The same feed and avatars are being read thousands of times. Perfect cache material.' },
    { at: 45, type: 'kill', target: 'cache', label: 'A cache node crashes' },
    { at: 47, type: 'message', who: 'pager', text: 'BZZT! Cache node down! Did you have a spare, or is the database about to melt?' },
    { at: 70, type: 'traffic', rps: 2200, label: 'Things calm down' },
  ],
  goals: { minUptime: 0.98, maxP95Ms: 200, minCacheHit: 0.7, maxCost: 450, durationSec: 90 },
};

export const missionHints = [
  'Place a cache and connect both web servers to it. Reads check the cache first, so the database only sees misses.',
  'A single cache server is a single point of failure, and one crashes at 45 s. Place two caches so one can carry on.',
  'Keep the TTL moderate (a few minutes). Too short and the hit rate drops below 70%; replicas cannot fix latency the way a cache can.',
];
