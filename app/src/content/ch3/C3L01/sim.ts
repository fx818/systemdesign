import type { SimConfig } from '@/types/content';

/** Lab: the same small design under different answers to "how many users?". */
export const labConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web app', x: 160, y: 220 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 160, y: 500 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 480, y: 110 },
      { id: 'web-1', kind: 'web', label: 'Web server', x: 640, y: 360 },
      { id: 'db', kind: 'db', label: 'Database', x: 1000, y: 360 },
    ],
    edges: [
      { from: 'client', to: 'dns', label: 'lookup' },
      { from: 'mobile', to: 'dns', label: 'lookup' },
      { from: 'client', to: 'web-1', label: 'HTTP' },
      { from: 'mobile', to: 'web-1', label: 'HTTP' },
      { from: 'web-1', to: 'db' },
    ],
  },
  palette: [],
  budget: 800,
  events: [
    { at: 0, type: 'traffic', rps: 300, label: 'Answer: "about 300 requests/sec"' },
    { at: 4, type: 'message', who: 'maya', text: 'Interviewer here. Today we have about 300 requests per second.' },
  ],
  goals: { minUptime: 0.95, maxP95Ms: 400, durationSec: 120 },
  knobs: [
    { id: 'rps', label: 'Answer to "how much traffic?" (requests/sec)', type: 'slider', min: 0, max: 4000, step: 50, initial: 300 },
    { id: 'servers', label: 'Web servers', type: 'slider', min: 1, max: 4, step: 1, initial: 1 },
  ],
  locked: ['client', 'mobile', 'dns', 'web-1', 'db'],
};

export const labTasks = [
  'The interviewer said ~300 requests/sec. The simple design is healthy: one web server, one database.',
  'Ask "what scale in a year?" and drag traffic to 3,000. The same design melts: a different answer needs a different design.',
  'Add web servers with the knob. The web tier recovers, but the single database is now the bottleneck.',
  'Drag traffic back to 300. Gold-plating this design for 3,000 would have been over-engineering for today\'s scope.',
  'Kill the web server: a single box is a single point of failure. Worth asking how much downtime is acceptable!',
];

/** Mission: build exactly the clarified scope, no more (over-engineering will not fit the budget). */
export const missionConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web app', x: 160, y: 220 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 160, y: 500 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 480, y: 110 },
    ],
    edges: [
      { from: 'client', to: 'dns', label: 'lookup' },
      { from: 'mobile', to: 'dns', label: 'lookup' },
    ],
  },
  palette: ['web', 'db', 'lb', 'cache', 'cdn', 'queue', 'worker', 'nosql', 'db-replica'],
  budget: 490,
  locked: ['client', 'mobile', 'dns'],
  events: [
    { at: 0, type: 'traffic', rps: 200, label: 'Pilot users trickle in' },
    { at: 4, type: 'message', who: 'maya', text: 'Requirements recap: web and mobile, ~600 requests/sec at peak, data in its own database.' },
    { at: 18, type: 'message', who: 'ravi', text: 'Peak is coming. If you built what was asked, you\'re fine.' },
    { at: 22, type: 'traffic', rps: 600, label: 'Peak: 600 requests/sec' },
    { at: 40, type: 'message', who: 'maya', text: 'Mobile users are half the traffic. Hope you didn\'t forget them.' },
  ],
  goals: { minUptime: 0.97, maxP95Ms: 250, maxCost: 490, durationSec: 60 },
};
