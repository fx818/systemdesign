import type { ComponentKind, SimConfig } from '@/types/content';

const EVERYTHING: ComponentKind[] = [
  'dns', 'lb', 'web', 'db', 'db-replica', 'cache', 'cdn', 'session-store', 'nosql', 'queue', 'worker',
  'datacenter', 'shard', 'logging', 'metrics', 'ci', 'storage', 'mobile', 'client',
];

const users: SimConfig['start'] = {
  nodes: [
    { id: 'client', kind: 'client', label: 'Web users', x: 80, y: 260 },
    { id: 'mobile', kind: 'mobile', label: 'Mobile users', x: 80, y: 460 },
  ],
  edges: [],
};

/** Architect playground: every component, every knob, a steady base load. */
export const labConfig: SimConfig = {
  start: users,
  palette: EVERYTHING,
  budget: 6000,
  events: [
    { at: 0, type: 'traffic', rps: 3000, label: 'Pre-game warm-up' },
    { at: 0, type: 'jobs', perSec: 40, label: 'Photo filters' },
  ],
  goals: { durationSec: 600 },
  knobs: [
    { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 0, max: 20000, step: 500, initial: 3000 },
    { id: 'servers', label: 'Web servers', type: 'slider', min: 1, max: 10, step: 1, initial: 2 },
    { id: 'replicas', label: 'DB replicas', type: 'slider', min: 0, max: 5, step: 1, initial: 1 },
    { id: 'shards', label: 'Shards', type: 'slider', min: 1, max: 8, step: 1, initial: 1 },
    { id: 'workers', label: 'Photo workers', type: 'slider', min: 0, max: 10, step: 1, initial: 2 },
    { id: 'ttl', label: 'Cache TTL (s)', type: 'slider', min: 0, max: 600, step: 10, initial: 60 },
    { id: 'cacheSize', label: 'Cache size', type: 'slider', min: 0, max: 100, step: 10, initial: 50 },
    { id: 'eviction', label: 'Eviction policy', type: 'select', options: ['LRU', 'LFU', 'FIFO'], initial: 'LRU' },
    { id: 'split', label: 'US-East share (%)', type: 'slider', min: 0, max: 100, step: 5, initial: 50 },
    { id: 'cdn', label: 'Serve static assets from CDN', type: 'toggle', initial: true },
    { id: 'sticky', label: 'Sticky sessions', type: 'toggle', initial: false },
  ],
  locked: ['client', 'mobile'],
};

export const labTasks = [
  'Free play. Build any architecture you like from the palette: there is no wrong answer here.',
  'Recreate Figure 1-23: DNS, CDN, load balancer, two web servers, a session store, cache, shards, NoSQL, queue + workers, and logging/metrics/CI.',
  'Kill each component one at a time. Anything whose death causes an outage is a single point of failure: add redundancy until nothing does.',
  'Push traffic to 20,000 requests/sec. Find the first bottleneck, fix it, and repeat.',
  'Turn sticky sessions on and kill a web server. Then add a session store and try again.',
];

/** Boss mission: empty canvas (users only), then seven waves over 180 s. */
export const missionConfig: SimConfig = {
  start: users,
  palette: EVERYTHING.filter((k) => k !== 'client' && k !== 'mobile'),
  budget: 3200,
  locked: ['client', 'mobile'],
  events: [
    { at: 0, type: 'traffic', rps: 2000, label: 'Pre-game' },
    { at: 0, type: 'jobs', perSec: 20, label: 'Normal uploads' },
    { at: 3, type: 'message', who: 'ravi', text: 'Seven waves are coming. Stateless web tier, redundancy everywhere, and keep an eye on the budget.' },
    { at: 15, type: 'message', who: 'maya', text: 'The ad is on! THE AD IS ON!' },
    { at: 18, type: 'traffic', rps: 9000, label: 'Wave 1: Super Bowl spike' },
    { at: 38, type: 'message', who: 'pager', text: 'Surprise number two: one of your web servers just died. bzzt.' },
    { at: 40, type: 'kill', target: 'web', label: 'Wave 2: web server crash' },
    { at: 58, type: 'message', who: 'pager', text: 'Number three: a cache server restarts. Everything in its memory is gone.' },
    { at: 60, type: 'kill', target: 'cache', label: 'Wave 3: cache crash' },
    { at: 68, type: 'revive', target: 'web' },
    { at: 75, type: 'revive', target: 'cache' },
    { at: 80, type: 'message', who: 'ravi', text: 'Master database down incoming. I hope you have a replica ready to promote.' },
    { at: 82, type: 'kill', target: 'db', label: 'Wave 4: master DB crash' },
    { at: 100, type: 'message', who: 'pager', text: 'Number five is my favourite. Goodbye, US-West!' },
    { at: 102, type: 'region-down', region: 'us-west', label: 'Wave 5: US-West data center outage' },
    { at: 118, type: 'message', who: 'maya', text: 'A pop star just posted halftime photos. To ALL her fans.' },
    { at: 120, type: 'hotkey', share: 0.55, label: 'Wave 6: celebrity post' },
    { at: 140, type: 'message', who: 'player', text: 'Everyone is applying the new "Touchdown" filter...' },
    { at: 142, type: 'jobs', perSec: 140, label: 'Wave 7: photo-filter burst' },
    { at: 160, type: 'hotkey', share: 0.25, label: 'Celebrity buzz fades' },
    { at: 165, type: 'traffic', rps: 6000, label: 'Final whistle' },
    { at: 175, type: 'message', who: 'maya', text: 'Ten. Million. Users. Do not touch anything.' },
  ],
  goals: { minUptime: 0.98, maxP95Ms: 400, maxCost: 3200, maxQueue: 2000, durationSec: 180 },
};

export const missionHints = [
  'Front door first: DNS, a CDN for static files, a load balancer, and at least two web servers backed by a shared session store (stateless!). Wave 2 kills one web server.',
  'Data tier: a master with at least one replica (wave 4 kills the master), two cache servers (wave 3 kills one), and shards with room for a hot celebrity shard (wave 6).',
  'Waves 5 and 7: add a second data center so US-West traffic can fail over, and a message queue with a few workers to absorb the photo-filter burst. Add metrics so you see it all coming.',
];
