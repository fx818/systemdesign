import type { ArchGraph, SimConfig } from '@/types/content';

/** Level 6 end state: LB, two web servers, cache, master + replica, users in two regions. */
const base: ArchGraph = {
  nodes: [
    { id: 'client', kind: 'client', label: 'Users · Europe', x: 120, y: 200 },
    { id: 'mobile', kind: 'mobile', label: 'Users · Asia', x: 120, y: 520 },
    { id: 'dns', kind: 'dns', label: 'DNS', x: 360, y: 80 },
    { id: 'lb', kind: 'lb', label: 'Load balancer', x: 480, y: 360 },
    { id: 'web-1', kind: 'web', label: 'Web 1 (origin)', x: 760, y: 250 },
    { id: 'web-2', kind: 'web', label: 'Web 2 (origin)', x: 760, y: 470 },
    { id: 'cache', kind: 'cache', label: 'Cache', x: 1030, y: 200 },
    { id: 'db', kind: 'db', label: 'DB master', x: 1030, y: 420 },
    { id: 'db-r1', kind: 'db-replica', label: 'Replica', x: 1180, y: 600 },
  ],
  edges: [
    { from: 'client', to: 'dns' },
    { from: 'mobile', to: 'dns' },
    { from: 'client', to: 'lb', label: 'HTTP' },
    { from: 'mobile', to: 'lb', label: 'HTTP' },
    { from: 'lb', to: 'web-1' },
    { from: 'lb', to: 'web-2' },
    { from: 'web-1', to: 'cache' },
    { from: 'web-2', to: 'cache' },
    { from: 'web-1', to: 'db' },
    { from: 'web-2', to: 'db' },
    { from: 'db', to: 'db-r1', label: 'replication' },
  ],
};

const withCdn: ArchGraph = {
  nodes: [...base.nodes, { id: 'cdn', kind: 'cdn', label: 'CDN edges', x: 480, y: 120 }],
  edges: [
    ...base.edges,
    { from: 'client', to: 'cdn', label: 'static' },
    { from: 'mobile', to: 'cdn', label: 'static' },
    { from: 'cdn', to: 'web-1', label: 'origin pull' },
  ],
};

export const labConfig: SimConfig = {
  start: withCdn,
  palette: ['web', 'cdn'],
  budget: 1500,
  events: [
    { at: 0, type: 'traffic', rps: 1800, label: 'Morning in Europe and Asia' },
    { at: 5, type: 'message', who: 'ravi', text: 'Flip the CDN toggle off and on. Watch where the static share of traffic goes.' },
  ],
  goals: { durationSec: 240 },
  knobs: [
    { id: 'cdn', label: 'CDN on', type: 'toggle', initial: false },
    { id: 'ttl', label: 'CDN cache TTL (seconds)', type: 'slider', min: 5, max: 3600, step: 5, initial: 300 },
    { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 200, max: 5000, step: 100, initial: 1800 },
    { id: 'servers', label: 'Origin web servers', type: 'slider', min: 1, max: 6, step: 1, initial: 2 },
  ],
  locked: ['client', 'mobile', 'dns', 'lb', 'db', 'cache'],
};

export const labTasks = [
  'With the CDN off, every image and CSS file goes through the load balancer to the origin web servers. Note the p95 latency.',
  'Turn the CDN on. The static share (images, CSS, JS) is now served by the edges, and the web servers cool down.',
  'Drag the TTL slider very low: the edges keep re-fetching from the origin, so origin load creeps back up. Then try a very long TTL and think about stale photos.',
  'Kill the CDN node. Clients fall back to the origin: the site stays up but the web servers suddenly carry all the static traffic.',
  'Add origin web servers until the site survives a CDN outage comfortably, then revive the CDN.',
];

export const missionConfig: SimConfig = {
  start: base,
  palette: ['cdn', 'web', 'cache'],
  budget: 1100,
  locked: ['client', 'mobile', 'dns', 'lb', 'db', 'db-r1'],
  events: [
    { at: 0, type: 'traffic', rps: 1500, label: 'Europe wakes up' },
    { at: 4, type: 'message', who: 'maya', text: 'London says photos take six seconds. Six! Fix it before their lunch break.' },
    { at: 20, type: 'traffic', rps: 2600, label: 'Mumbai joins the party' },
    { at: 24, type: 'message', who: 'ravi', text: 'Most of these requests are static photos. They should never reach the web tier.' },
    { at: 45, type: 'message', who: 'pager', text: 'bzzt... CDN vendor status page just turned orange.' },
    { at: 50, type: 'kill', target: 'cdn', label: 'CDN provider outage' },
    { at: 52, type: 'message', who: 'ravi', text: 'CDN down! Clients fall back to the origin. Can your web tier take the static load for a while?' },
    { at: 70, type: 'revive', target: 'cdn' },
    { at: 72, type: 'message', who: 'maya', text: 'CDN is back. Did anyone in Berlin notice? Please say no.' },
    { at: 80, type: 'traffic', rps: 3200, label: 'Tokyo evening rush' },
  ],
  goals: { minUptime: 0.98, maxP95Ms: 250, maxCost: 1100, durationSec: 100 },
};

export const missionHints = [
  'Drop a CDN node and connect the users to it for static files, plus a link from the CDN to a web server as the origin.',
  'The CDN outage at 50 s sends all static traffic back to the origin. One extra web server behind the load balancer is enough to absorb it.',
  'Don\'t overbuild: one CDN plus one extra web server fits the budget. More web servers than that only burn credits and stars.',
];
