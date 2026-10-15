import type { SimConfig } from '@/types/content';

export const labConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web browser', x: 140, y: 240 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 140, y: 480 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 420, y: 100 },
      { id: 'web-1', kind: 'web', label: 'Web tier', x: 560, y: 360 },
      { id: 'db-1', kind: 'db', label: 'Data tier (MySQL)', x: 980, y: 360 },
    ],
    edges: [
      { from: 'client', to: 'dns' },
      { from: 'mobile', to: 'dns' },
      { from: 'client', to: 'web-1', label: 'HTTP' },
      { from: 'mobile', to: 'web-1', label: 'HTTP' },
      { from: 'web-1', to: 'db-1', label: 'SQL' },
    ],
  },
  palette: ['web', 'db'],
  budget: 850,
  events: [{ at: 0, type: 'traffic', rps: 300, label: 'Book club evening' }],
  goals: { minUptime: 0.95, maxP95Ms: 400, durationSec: 180 },
  knobs: [
    { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 0, max: 4000, step: 100, initial: 300 },
    { id: 'servers', label: 'Web servers', type: 'slider', min: 1, max: 4, step: 1, initial: 1 },
  ],
  locked: ['client', 'mobile', 'dns', 'db-1'],
};

export const labTasks = [
  'Look at the two tiers: web traffic hits the web server, which queries the separate database.',
  'Push traffic up until the web tier turns red. Check the database: it is still healthy.',
  'Scale the web tier with the "Web servers" slider. It recovers while the database stays untouched: that is independent scaling. (How traffic gets spread over several servers is a story for Level 4.)',
  'Kill the database. Pages that need data now fail even though the web tier is fine: each tier has its own job.',
  'Revive the database and confirm everything turns green again.',
];

export const missionConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web browser', x: 140, y: 240 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 140, y: 480 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 420, y: 100 },
      { id: 'web-1', kind: 'web', label: 'Web + DB (one box)', x: 560, y: 360 },
    ],
    edges: [
      { from: 'client', to: 'dns' },
      { from: 'mobile', to: 'dns' },
      { from: 'client', to: 'web-1', label: 'HTTP' },
      { from: 'mobile', to: 'web-1', label: 'HTTP' },
    ],
  },
  palette: ['web', 'db', 'nosql'],
  budget: 500,
  locked: ['client', 'mobile', 'dns', 'web-1'],
  events: [
    { at: 0, type: 'traffic', rps: 200, label: 'Normal evening' },
    { at: 4, type: 'message', who: 'maya', text: 'The book club meets at 8. Everybody will open the app at once.' },
    { at: 20, type: 'traffic', rps: 600, label: 'Book club meeting starts' },
    { at: 32, type: 'message', who: 'ravi', text: 'Watch the web tier and the data tier separately. Which one is working harder?' },
    { at: 40, type: 'traffic', rps: 900, label: 'Neighbourhood forum post' },
    { at: 46, type: 'message', who: 'maya', text: 'The forum post went viral. Hold on!' },
    { at: 70, type: 'traffic', rps: 400, label: 'Everyone goes to bed' },
  ],
  goals: { minUptime: 0.97, maxP95Ms: 250, maxCost: 500, durationSec: 90 },
};

export const missionHints = [
  'Place a Database node and connect web-1 to it. Now the web server only does web work and the database gets its own machine.',
  'PixelPost data (users, photos, albums) is relational with lots of joins, so a relational Database is the right pick, not NoSQL.',
  'One database next to the existing server fits comfortably in the 500-credit budget. Extra boxes cost credits and stars. Split the tiers and let it run.',
];
