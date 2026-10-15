import type { SimConfig } from '@/types/content';

/** Lab: the agreed blueprint with napkin-math knobs. Does it fit 1,200 QPS? 2,400 at peak? */
export const labConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web', x: 110, y: 230 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile', x: 110, y: 490 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 300, y: 90 },
      { id: 'lb', kind: 'lb', label: 'Load balancer', x: 320, y: 360 },
      { id: 'web-1', kind: 'web', label: 'Web servers', x: 560, y: 360 },
      { id: 'cache', kind: 'cache', label: 'Cache', x: 830, y: 220 },
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
      { from: 'web-1', to: 'cache' },
      { from: 'cache', to: 'db' },
      { from: 'web-1', to: 'queue', label: 'fan-out jobs' },
      { from: 'queue', to: 'worker-1' },
    ],
  },
  palette: [],
  budget: 2000,
  events: [
    { at: 0, type: 'traffic', rps: 1200, label: 'Napkin estimate: ~1,200 QPS' },
    { at: 0, type: 'jobs', perSec: 60, label: 'Fan-out jobs' },
    { at: 3, type: 'message', who: 'ravi', text: '10M DAU × 10 views ÷ 86,400 s ≈ 1,200 QPS. The blueprint has 2 web servers. Does it fit?' },
  ],
  goals: { minUptime: 0.95, maxP95Ms: 400, maxQueue: 2000, durationSec: 150 },
  knobs: [
    { id: 'rps', label: 'Feed traffic (QPS)', type: 'slider', min: 0, max: 6000, step: 100, initial: 1200 },
    { id: 'servers', label: 'Web servers', type: 'slider', min: 1, max: 8, step: 1, initial: 2 },
    { id: 'workers', label: 'Fan-out workers', type: 'slider', min: 0, max: 8, step: 1, initial: 2 },
  ],
  locked: ['client', 'mobile', 'dns', 'lb', 'web-1', 'cache', 'db', 'queue', 'worker-1'],
};

export const labTasks = [
  'Napkin math says ~1,200 QPS. With 2 web servers (about 1,000 rps each) the blueprint fits. Check the meters.',
  'Peak is about 2x: drag traffic to 2,400. The web tier turns red. The estimate just told you to add servers.',
  'Raise the web server knob until peak traffic is healthy again, with some headroom.',
  'Drop the fan-out workers to 1 and watch the queue grow. Each worker drains ~50 jobs/sec.',
  'Kill the cache and watch the post DB take every feed read. Box diagrams are cheap; capacity is not.',
];

/** Mission: build the news-feed high-level design within budget so it meets the agreed scale. */
export const missionConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web', x: 110, y: 230 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile', x: 110, y: 490 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 300, y: 90 },
    ],
    edges: [
      { from: 'client', to: 'dns', label: 'lookup' },
      { from: 'mobile', to: 'dns', label: 'lookup' },
    ],
  },
  palette: ['lb', 'web', 'db', 'db-replica', 'cache', 'cdn', 'queue', 'worker'],
  budget: 1650,
  locked: ['client', 'mobile', 'dns'],
  events: [
    { at: 0, type: 'traffic', rps: 800, label: 'Morning scroll' },
    { at: 0, type: 'jobs', perSec: 50, label: 'Posts fan out to friends' },
    { at: 4, type: 'message', who: 'maya', text: 'Walk me through it while it runs. Where does a new post go?' },
    { at: 12, type: 'traffic', rps: 1600, label: 'Lunch break' },
    { at: 25, type: 'traffic', rps: 2500, label: 'Evening peak' },
    { at: 25, type: 'jobs', perSec: 150, label: 'Everyone posts dinner photos' },
    { at: 30, type: 'message', who: 'ravi', text: 'Peak traffic and peak fan-out at once. This is what the napkin math was for.' },
    { at: 45, type: 'kill', target: 'web', label: 'Maya unplugs a web server' },
    { at: 47, type: 'message', who: 'maya', text: 'Oops. Did your blueprint have a spare?' },
    { at: 75, type: 'traffic', rps: 1500, label: 'Night owls' },
  ],
  goals: { minUptime: 0.97, maxP95Ms: 250, maxQueue: 300, maxCost: 1650, durationSec: 90 },
};
