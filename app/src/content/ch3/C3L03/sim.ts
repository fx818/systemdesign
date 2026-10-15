import type { ArchGraph, SimConfig } from '@/types/content';

/** Lab: the full news-feed design with deep-dive knobs (fan-out workers, feed cache). */
const fullDesign: ArchGraph = {
  nodes: [
    { id: 'client', kind: 'client', label: 'Web', x: 110, y: 230 },
    { id: 'mobile', kind: 'mobile', label: 'Mobile', x: 110, y: 490 },
    { id: 'dns', kind: 'dns', label: 'DNS', x: 300, y: 90 },
    { id: 'lb', kind: 'lb', label: 'Load balancer', x: 320, y: 360 },
    { id: 'web-1', kind: 'web', label: 'Web servers', x: 560, y: 360 },
    { id: 'cache', kind: 'cache', label: 'Feed cache', x: 830, y: 220 },
    { id: 'db', kind: 'db', label: 'Post DB', x: 1080, y: 220 },
    { id: 'queue', kind: 'queue', label: 'Fan-out queue', x: 830, y: 520 },
    { id: 'worker-1', kind: 'worker', label: 'Fan-out workers', x: 1080, y: 520 },
  ],
  edges: [
    { from: 'client', to: 'dns', label: 'lookup' },
    { from: 'mobile', to: 'dns', label: 'lookup' },
    { from: 'client', to: 'lb' },
    { from: 'mobile', to: 'lb' },
    { from: 'lb', to: 'web-1' },
    { from: 'web-1', to: 'cache', label: 'retrieval' },
    { from: 'cache', to: 'db' },
    { from: 'web-1', to: 'queue', label: 'publishing' },
    { from: 'queue', to: 'worker-1' },
  ],
};

export const labConfig: SimConfig = {
  start: fullDesign,
  palette: [],
  budget: 2500,
  events: [
    { at: 0, type: 'traffic', rps: 2500, label: 'Feed reads' },
    { at: 0, type: 'jobs', perSec: 100, label: 'Fan-out jobs' },
    { at: 3, type: 'message', who: 'ravi', text: 'Two deep dives, two knobs each. Break them, then fix them.' },
  ],
  goals: { minUptime: 0.95, maxP95Ms: 400, maxQueue: 3000, durationSec: 150 },
  knobs: [
    { id: 'rps', label: 'Feed reads (requests/sec)', type: 'slider', min: 0, max: 5000, step: 100, initial: 2500 },
    { id: 'servers', label: 'Web servers', type: 'slider', min: 1, max: 6, step: 1, initial: 3 },
    { id: 'workers', label: 'Fan-out workers', type: 'slider', min: 0, max: 8, step: 1, initial: 3 },
    { id: 'cacheSize', label: 'Feed cache memory (GB)', type: 'slider', min: 0, max: 64, step: 1, initial: 32 },
    { id: 'ttl', label: 'Feed cache TTL (seconds)', type: 'slider', min: 1, max: 3600, step: 1, initial: 300 },
  ],
  locked: ['client', 'mobile', 'dns', 'lb', 'web-1', 'cache', 'db', 'queue', 'worker-1'],
};

export const labTasks = [
  'Retrieval deep dive: drag the feed cache memory to 0. Every read hits the post DB, which overloads.',
  'Bring the cache back and try a tiny TTL: entries expire before anyone reuses them.',
  'Publishing deep dive: drop fan-out workers to 1 and watch the queue pile up (each worker drains ~50 jobs/sec).',
  'Raise web servers to 6 while the cache is off. Does it help the post DB? (No: wrong component.)',
  'Restore the healthy settings. Two targeted deep dives beat ten random tweaks.',
];

/** Mission: the interviewer points at two bottlenecks; deep-dive fix exactly those within budget. */
export const missionConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web', x: 110, y: 230 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile', x: 110, y: 490 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 300, y: 90 },
      { id: 'lb', kind: 'lb', label: 'Load balancer', x: 320, y: 360 },
      { id: 'web-1', kind: 'web', label: 'Web 1', x: 560, y: 200 },
      { id: 'web-2', kind: 'web', label: 'Web 2', x: 560, y: 360 },
      { id: 'web-3', kind: 'web', label: 'Web 3', x: 560, y: 520 },
      { id: 'db', kind: 'db', label: 'Post DB', x: 1080, y: 220 },
      { id: 'queue', kind: 'queue', label: 'Fan-out queue', x: 830, y: 560 },
      { id: 'worker-1', kind: 'worker', label: 'Worker 1', x: 1080, y: 500 },
      { id: 'worker-2', kind: 'worker', label: 'Worker 2', x: 1080, y: 620 },
    ],
    edges: [
      { from: 'client', to: 'dns', label: 'lookup' },
      { from: 'mobile', to: 'dns', label: 'lookup' },
      { from: 'client', to: 'lb' },
      { from: 'mobile', to: 'lb' },
      { from: 'lb', to: 'web-1' },
      { from: 'lb', to: 'web-2' },
      { from: 'lb', to: 'web-3' },
      { from: 'web-1', to: 'db' },
      { from: 'web-2', to: 'db' },
      { from: 'web-3', to: 'db' },
      { from: 'web-1', to: 'queue' },
      { from: 'web-2', to: 'queue' },
      { from: 'web-3', to: 'queue' },
      { from: 'queue', to: 'worker-1' },
      { from: 'queue', to: 'worker-2' },
    ],
  },
  palette: ['cache', 'worker', 'web', 'db-replica', 'cdn'],
  budget: 1500,
  locked: ['client', 'mobile', 'dns', 'lb', 'web-1', 'web-2', 'web-3', 'db', 'queue', 'worker-1', 'worker-2'],
  events: [
    { at: 0, type: 'traffic', rps: 1600, label: 'Feed reads' },
    { at: 0, type: 'jobs', perSec: 80, label: 'Normal posting' },
    { at: 5, type: 'message', who: 'maya', text: 'Deep dive #1, retrieval: feed traffic is about to grow and every read lands on the post DB.' },
    { at: 15, type: 'traffic', rps: 2400, label: 'Everyone refreshes their feed' },
    { at: 35, type: 'message', who: 'maya', text: 'Deep dive #2, publishing: a user with 5,000 friends is about to post. Then another. Then another.' },
    { at: 40, type: 'jobs', perSec: 180, label: 'Popular users post: fan-out storm' },
    { at: 55, type: 'message', who: 'ravi', text: 'Watch the queue meter. Fan-out work must drain as fast as it arrives.' },
  ],
  goals: { minUptime: 0.97, maxP95Ms: 250, maxQueue: 400, maxCost: 1500, durationSec: 90 },
};
