import type { ArchGraph, SimConfig } from '@/types/content';

/** PixelPost at 5M users (one data center shown, like Figure 1-19), before the tooling. */
const base: ArchGraph = {
  nodes: [
    { id: 'client', kind: 'client', label: 'Web users', x: 90, y: 250 },
    { id: 'mobile', kind: 'mobile', label: 'Mobile users', x: 90, y: 470 },
    { id: 'dns', kind: 'dns', label: 'DNS', x: 300, y: 90 },
    { id: 'cdn', kind: 'cdn', label: 'CDN', x: 300, y: 630 },
    { id: 'lb', kind: 'lb', label: 'Load balancer', x: 330, y: 360 },
    { id: 'web-1', kind: 'web', label: 'web-1', x: 540, y: 230 },
    { id: 'web-2', kind: 'web', label: 'web-2', x: 540, y: 360 },
    { id: 'web-3', kind: 'web', label: 'web-3', x: 540, y: 490 },
    { id: 'cache', kind: 'cache', label: 'Cache', x: 760, y: 230 },
    { id: 'db', kind: 'db', label: 'Master DB', x: 960, y: 230 },
    { id: 'replica', kind: 'db-replica', label: 'Replica', x: 1150, y: 230 },
    { id: 'sessions', kind: 'session-store', label: 'Session store', x: 760, y: 420 },
    { id: 'queue', kind: 'queue', label: 'Photo queue', x: 960, y: 490 },
    { id: 'worker', kind: 'worker', label: 'Photo workers', x: 1150, y: 490 },
  ],
  edges: [
    { from: 'client', to: 'dns' },
    { from: 'mobile', to: 'dns' },
    { from: 'client', to: 'cdn', label: 'static' },
    { from: 'mobile', to: 'cdn', label: 'static' },
    { from: 'client', to: 'lb' },
    { from: 'mobile', to: 'lb' },
    { from: 'lb', to: 'web-1' },
    { from: 'lb', to: 'web-2' },
    { from: 'lb', to: 'web-3' },
    { from: 'web-1', to: 'cache' },
    { from: 'web-2', to: 'cache' },
    { from: 'web-3', to: 'cache' },
    { from: 'cache', to: 'db' },
    { from: 'db', to: 'replica', label: 'replicate' },
    { from: 'web-1', to: 'sessions' },
    { from: 'web-2', to: 'sessions' },
    { from: 'web-3', to: 'sessions' },
    { from: 'web-1', to: 'queue', label: 'photo jobs' },
    { from: 'web-2', to: 'queue', label: 'photo jobs' },
    { from: 'web-3', to: 'queue', label: 'photo jobs' },
    { from: 'queue', to: 'worker' },
  ],
};

const LOCKED = base.nodes.map((n) => n.id);

/** Lab: the same system with the three tool kinds available, and chaos to investigate. */
export const labConfig: SimConfig = {
  start: base,
  palette: ['logging', 'metrics', 'ci', 'web'],
  budget: 2000,
  events: [
    { at: 0, type: 'traffic', rps: 2400, label: 'Normal evening' },
    { at: 0, type: 'jobs', perSec: 30, label: 'Photo filters' },
  ],
  goals: { minUptime: 0.95, maxP95Ms: 400, durationSec: 240 },
  knobs: [
    { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 500, max: 6000, step: 100, initial: 2400 },
    { id: 'servers', label: 'Web servers', type: 'slider', min: 1, max: 6, step: 1, initial: 3 },
    { id: 'workers', label: 'Photo workers', type: 'slider', min: 1, max: 6, step: 1, initial: 2 },
  ],
  locked: LOCKED,
};

export const labTasks = [
  'Without any tools, kill web-3. You see a red node on the canvas, but at 3 AM nobody is watching the canvas: in real life you would only hear "uploads fail".',
  'Place a Logging node and connect the web servers to it. That is your centralized, searchable log service.',
  'Place a Metrics node. Push traffic up and watch host metrics (one server), aggregated metrics (the whole web tier) and the business numbers react.',
  'Place a CI node next to the web tier: every check-in now gets built and tested automatically before it can reach a server.',
  'Kill the cache, then revive it. Which metric type would have warned you first: host, aggregated or business?',
];

/** Mission: deploy day. Three releases go out; one of them is bad. */
export const missionConfig: SimConfig = {
  start: base,
  palette: ['logging', 'metrics', 'ci', 'web', 'cache', 'worker'],
  budget: 2200,
  locked: LOCKED,
  events: [
    { at: 0, type: 'traffic', rps: 2400, label: 'Morning traffic' },
    { at: 0, type: 'jobs', perSec: 30, label: 'Photo filters' },
    { at: 4, type: 'message', who: 'ravi', text: 'Three releases today. Make sure logs, metrics and CI are in place before the first one.' },
    { at: 15, type: 'message', who: 'player', text: 'Release 1 is rolling out to web-1.' },
    { at: 30, type: 'message', who: 'pager', text: 'bzzt. Release 2 is... interesting. web-2 starts throwing 500s.' },
    { at: 31, type: 'kill', target: 'web-2', label: 'Bad release on web-2' },
    { at: 38, type: 'message', who: 'ravi', text: 'Logs show the 500s come from web-2 only, and the tests for release 2 failed in CI. Roll it back!' },
    { at: 42, type: 'revive', target: 'web-2' },
    { at: 50, type: 'message', who: 'maya', text: 'Memories launch in 3, 2, 1...' },
    { at: 52, type: 'traffic', rps: 6500, label: '"Memories" launch' },
    { at: 70, type: 'jobs', perSec: 60, label: 'Everyone re-filters old photos' },
    { at: 78, type: 'message', who: 'pager', text: 'BZZT. web-3 disk at 97%... 99%...' },
    { at: 82, type: 'kill', target: 'web-3', label: 'web-3: disk full' },
    { at: 88, type: 'message', who: 'player', text: 'Host metrics flagged web-3 before it died. Cleaning the disk now.' },
    { at: 96, type: 'revive', target: 'web-3' },
    { at: 105, type: 'traffic', rps: 3000, label: 'Evening calm' },
    { at: 112, type: 'message', who: 'maya', text: 'Three releases, zero angry tweets. Is this what "boring" feels like?' },
  ],
  goals: { minUptime: 0.97, maxP95Ms: 300, maxQueue: 200, maxCost: 2200, durationSec: 120 },
};

export const missionHints = [
  'Place one Logging node, one Metrics node and one CI node, and connect the web servers to them. Tools are cheap compared with a 3 AM outage.',
  'The bad release and the full disk each take out one web server. With only three, the other two run hot during the Memories launch: one extra web server gives you headroom.',
  'Photo jobs double at t=70. If the queue grows, add a photo worker. Keep the whole board under 2,200 credits (the pre-built system counts too).',
];
