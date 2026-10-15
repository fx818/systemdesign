import type { ArchGraph, SimConfig } from '@/types/content';

/** Level 7 end state with a third web server: still stateful, still sticky. */
const stateful: ArchGraph = {
  nodes: [
    { id: 'client', kind: 'client', label: 'Web browser', x: 110, y: 230 },
    { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 110, y: 500 },
    { id: 'dns', kind: 'dns', label: 'DNS', x: 330, y: 80 },
    { id: 'cdn', kind: 'cdn', label: 'CDN', x: 580, y: 80 },
    { id: 'lb', kind: 'lb', label: 'Load balancer', x: 380, y: 370 },
    { id: 'web-1', kind: 'web', label: 'Web 1', x: 680, y: 210 },
    { id: 'web-2', kind: 'web', label: 'Web 2', x: 680, y: 370 },
    { id: 'web-3', kind: 'web', label: 'Web 3', x: 680, y: 530 },
    { id: 'cache', kind: 'cache', label: 'Cache', x: 980, y: 250 },
    { id: 'db', kind: 'db', label: 'DB master', x: 980, y: 480 },
    { id: 'db-r1', kind: 'db-replica', label: 'Replica', x: 1180, y: 610 },
  ],
  edges: [
    { from: 'client', to: 'dns' },
    { from: 'mobile', to: 'dns' },
    { from: 'client', to: 'cdn', label: 'static' },
    { from: 'client', to: 'lb', label: 'HTTP' },
    { from: 'mobile', to: 'lb', label: 'HTTP' },
    { from: 'lb', to: 'web-1' },
    { from: 'lb', to: 'web-2' },
    { from: 'lb', to: 'web-3' },
    { from: 'web-1', to: 'cache' },
    { from: 'web-2', to: 'cache' },
    { from: 'web-3', to: 'cache' },
    { from: 'web-1', to: 'db' },
    { from: 'web-2', to: 'db' },
    { from: 'web-3', to: 'db' },
    { from: 'db', to: 'db-r1', label: 'replication' },
  ],
};

export const labConfig: SimConfig = {
  start: stateful,
  palette: ['session-store', 'nosql', 'web'],
  budget: 2000,
  events: [
    { at: 0, type: 'traffic', rps: 2000, label: 'Normal evening' },
    { at: 5, type: 'message', who: 'ravi', text: 'Sticky sessions are on. Kill a web server and count the logouts.' },
  ],
  goals: { durationSec: 240 },
  knobs: [
    { id: 'sticky', label: 'Sticky sessions (state on servers)', type: 'toggle', initial: true },
    { id: 'servers', label: 'Web servers', type: 'slider', min: 1, max: 8, step: 1, initial: 3 },
    { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 200, max: 8000, step: 200, initial: 2000 },
  ],
  locked: ['client', 'mobile', 'dns', 'cdn', 'lb', 'db', 'cache'],
};

export const labTasks = [
  'Sticky sessions are on and each server holds its own users\' sessions. Kill web-2 and watch the logout spike: its users lost their state.',
  'Revive web-2. Change the "Web servers" slider: with sticky sessions, users get reshuffled and more of them are logged out.',
  'Drop a Session store (or a NoSQL node) on the board and connect every web server to it.',
  'Turn sticky sessions off. Kill a web server again: no logouts this time, because any server can fetch any session.',
  'Push traffic up and down and move the server slider with it. That is what autoscaling does for you automatically.',
];

export const missionConfig: SimConfig = {
  start: stateful,
  palette: ['session-store', 'nosql', 'web'],
  budget: 1400,
  locked: ['client', 'mobile', 'dns', 'cdn', 'lb', 'db', 'db-r1', 'cache'],
  knobs: [
    { id: 'sticky', label: 'Sticky sessions', type: 'toggle', initial: true },
    { id: 'servers', label: 'Web servers (autoscaling target)', type: 'slider', min: 2, max: 8, step: 1, initial: 3 },
  ],
  events: [
    { at: 0, type: 'traffic', rps: 2000, label: 'Before the livestream' },
    { at: 3, type: 'message', who: 'maya', text: 'The livestream starts in 20 seconds. Please, nobody get logged out.' },
    { at: 20, type: 'traffic', rps: 4500, label: 'Livestream starts' },
    { at: 22, type: 'message', who: 'ravi', text: 'Traffic wave! Scale the web tier out. Easy, as long as no server holds state.' },
    { at: 40, type: 'traffic', rps: 6500, label: 'Influencer shouts out PixelPost' },
    { at: 50, type: 'kill', target: 'web-2', label: 'Server 2 unplugged' },
    { at: 51, type: 'message', who: 'pager', text: 'bzzt! Unplugged web-2. How many sessions did it take with it?' },
    { at: 70, type: 'traffic', rps: 2500, label: 'Stream ends' },
    { at: 72, type: 'message', who: 'maya', text: 'Stream\'s over. Can we stop paying for all those servers now?' },
    { at: 85, type: 'traffic', rps: 1500, label: 'Bedtime' },
  ],
  goals: { minUptime: 0.99, maxP95Ms: 300, maxCost: 1400, durationSec: 100 },
};

export const missionHints = [
  'Place a Session store (or NoSQL) node and connect every web server to it. Then switch sticky sessions off: state no longer lives on the servers.',
  'When the wave hits at 20 s and 40 s, raise the web server count. When traffic drops at 70 s, lower it again, just like an autoscaler would.',
  'You only need one session store. Leaving extra servers running after the wave costs credits and stars.',
];
