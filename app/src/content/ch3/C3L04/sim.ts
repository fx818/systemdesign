import type { SimConfig } from '@/types/content';

/** Lab: a solid design to stress during the wrap-up (error cases, next scale curve). */
export const labConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web', x: 110, y: 230 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile', x: 110, y: 490 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 300, y: 90 },
      { id: 'lb', kind: 'lb', label: 'Load balancer', x: 320, y: 360 },
      { id: 'web-1', kind: 'web', label: 'Web servers', x: 560, y: 360 },
      { id: 'cache', kind: 'cache', label: 'Cache', x: 820, y: 200 },
      { id: 'db', kind: 'db', label: 'Primary DB', x: 1080, y: 200 },
      { id: 'replica', kind: 'db-replica', label: 'Replica', x: 1080, y: 420 },
      { id: 'metrics', kind: 'metrics', label: 'Metrics', x: 820, y: 560 },
      { id: 'logging', kind: 'logging', label: 'Error logs', x: 1040, y: 600 },
    ],
    edges: [
      { from: 'client', to: 'dns', label: 'lookup' },
      { from: 'mobile', to: 'dns', label: 'lookup' },
      { from: 'client', to: 'lb' },
      { from: 'mobile', to: 'lb' },
      { from: 'lb', to: 'web-1' },
      { from: 'web-1', to: 'cache' },
      { from: 'cache', to: 'db' },
      { from: 'db', to: 'replica', label: 'replication' },
      { from: 'web-1', to: 'metrics' },
      { from: 'web-1', to: 'logging' },
    ],
  },
  palette: [],
  budget: 3000,
  events: [
    { at: 0, type: 'traffic', rps: 1500, label: 'Today: 1M users' },
    { at: 3, type: 'message', who: 'maya', text: 'Wrap-up time. Break it: kill things, push traffic, and talk me through what happens.' },
  ],
  goals: { minUptime: 0.95, maxP95Ms: 400, durationSec: 150 },
  knobs: [
    { id: 'rps', label: 'Traffic: the next scale curve (requests/sec)', type: 'slider', min: 0, max: 10000, step: 100, initial: 1500 },
    { id: 'servers', label: 'Web servers', type: 'slider', min: 1, max: 10, step: 1, initial: 3 },
    { id: 'replicas', label: 'DB replicas', type: 'slider', min: 0, max: 4, step: 1, initial: 1 },
  ],
  locked: ['client', 'mobile', 'dns', 'lb', 'web-1', 'cache', 'db', 'replica', 'metrics', 'logging'],
};

export const labTasks = [
  'Error case: kill the primary DB. After a few seconds the replica is promoted and the site recovers.',
  'Set replicas to 0 and kill the primary again: no copy, no data. That is the bottleneck to mention.',
  'Next scale curve: drag traffic from 1,500 to 10x. Which component turns red first?',
  'Raise web servers until the web tier copes, and notice what becomes the next bottleneck.',
  'Kill the cache. Watch the metrics: operations is how you would notice this in production.',
];

/** Mission: survive the interviewer's wrap-up questions (server failure, 2x traffic, primary DB failure). */
export const missionConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web', x: 110, y: 230 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile', x: 110, y: 490 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 300, y: 90 },
      { id: 'lb', kind: 'lb', label: 'Load balancer', x: 320, y: 360 },
      { id: 'web-1', kind: 'web', label: 'Web 1', x: 560, y: 260 },
      { id: 'web-2', kind: 'web', label: 'Web 2', x: 560, y: 460 },
      { id: 'cache', kind: 'cache', label: 'Cache', x: 820, y: 200 },
      { id: 'db', kind: 'db', label: 'Primary DB', x: 1080, y: 200 },
    ],
    edges: [
      { from: 'client', to: 'dns', label: 'lookup' },
      { from: 'mobile', to: 'dns', label: 'lookup' },
      { from: 'client', to: 'lb' },
      { from: 'mobile', to: 'lb' },
      { from: 'lb', to: 'web-1' },
      { from: 'lb', to: 'web-2' },
      { from: 'web-1', to: 'cache' },
      { from: 'web-2', to: 'cache' },
      { from: 'cache', to: 'db' },
    ],
  },
  palette: ['web', 'db-replica', 'cache', 'metrics', 'logging', 'ci'],
  budget: 1650,
  locked: ['client', 'mobile', 'dns', 'lb', 'web-1', 'web-2', 'cache', 'db'],
  events: [
    { at: 0, type: 'traffic', rps: 1500, label: 'Today: 1M users' },
    { at: 5, type: 'message', who: 'maya', text: 'Follow-up 1: what happens if a web server fails?' },
    { at: 30, type: 'kill', target: 'web', label: 'Error case: a web server fails' },
    { at: 42, type: 'message', who: 'maya', text: 'Follow-up 2: the next scale curve. Traffic doubles. Then what?' },
    { at: 50, type: 'traffic', rps: 3000, label: 'Next scale curve: 2x traffic' },
    { at: 62, type: 'message', who: 'maya', text: 'Follow-up 3: and if the primary database dies?' },
    { at: 70, type: 'kill', target: 'db', label: 'Error case: the primary DB fails' },
    { at: 80, type: 'message', who: 'ravi', text: 'Now recap the design and name the next bottleneck. Never say perfect.' },
  ],
  goals: { minUptime: 0.95, maxP95Ms: 300, maxCost: 1650, durationSec: 100 },
};
