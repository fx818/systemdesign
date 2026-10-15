import type { SimConfig } from '@/types/content';

export const labConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web browser', x: 120, y: 240 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 120, y: 480 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 320, y: 90 },
      { id: 'lb', kind: 'lb', label: 'Load balancer (public 88.88.88.1)', x: 420, y: 360 },
      { id: 'web-1', kind: 'web', label: 'Server 1 (private 10.0.0.1)', x: 760, y: 240 },
      { id: 'web-2', kind: 'web', label: 'Server 2 (private 10.0.0.2)', x: 760, y: 480 },
      { id: 'db-1', kind: 'db', label: 'Database', x: 1120, y: 360 },
    ],
    edges: [
      { from: 'client', to: 'dns' },
      { from: 'mobile', to: 'dns' },
      { from: 'client', to: 'lb', label: 'public IP' },
      { from: 'mobile', to: 'lb', label: 'public IP' },
      { from: 'lb', to: 'web-1', label: 'private IP' },
      { from: 'lb', to: 'web-2', label: 'private IP' },
      { from: 'web-1', to: 'db-1' },
      { from: 'web-2', to: 'db-1' },
    ],
  },
  palette: ['web'],
  budget: 800,
  events: [{ at: 0, type: 'traffic', rps: 1500, label: 'TV audience arriving' }],
  goals: { durationSec: 180 },
  knobs: [
    { id: 'servers', label: 'Web servers in the pool', type: 'slider', min: 1, max: 6, step: 1, initial: 2 },
    { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 0, max: 6000, step: 100, initial: 1500 },
  ],
  locked: ['client', 'mobile', 'dns', 'lb', 'db-1'],
};

export const labTasks = [
  'Watch the request dots: the load balancer spreads them evenly over Server 1 and Server 2.',
  'Kill Server 1. Traffic reroutes to Server 2 and uptime barely moves: failover.',
  'Push traffic to 4,000 req/s. Server 2 alone cannot cope. Raise "Web servers" until the pool is green again.',
  'Notice the labels: clients only know the public IP of the load balancer; servers use private 10.0.0.x addresses.',
  'Bonus: drop to 1 web server and kill it. With nothing behind the load balancer, the site is down.',
];

export const missionConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web browser', x: 120, y: 240 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 120, y: 480 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 320, y: 90 },
      { id: 'web-1', kind: 'web', label: 'Server 1', x: 760, y: 240 },
      { id: 'db-1', kind: 'db', label: 'Database', x: 1120, y: 360 },
    ],
    edges: [
      { from: 'client', to: 'dns' },
      { from: 'mobile', to: 'dns' },
      { from: 'client', to: 'web-1', label: 'HTTP' },
      { from: 'mobile', to: 'web-1', label: 'HTTP' },
      { from: 'web-1', to: 'db-1' },
    ],
  },
  palette: ['lb', 'web'],
  budget: 600,
  locked: ['client', 'mobile', 'dns', 'db-1'],
  events: [
    { at: 0, type: 'traffic', rps: 800, label: 'Pre-show traffic' },
    { at: 6, type: 'message', who: 'maya', text: 'The launch segment starts in 15 seconds. My hands are shaking.' },
    { at: 20, type: 'traffic', rps: 2200, label: 'Launch surge' },
    { at: 24, type: 'message', who: 'pager', text: 'BZZT! 2,200 requests per second and climbing!' },
    { at: 32, type: 'traffic', rps: 2600, label: 'Surge peaks' },
    { at: 40, type: 'kill', target: 'web-1', label: 'Server 1 crashes' },
    { at: 42, type: 'message', who: 'ravi', text: 'Server 1 is gone. If the load balancer has healthy servers left, users will never notice.' },
    { at: 60, type: 'traffic', rps: 1800, label: 'Viewers settle in' },
    { at: 75, type: 'message', who: 'maya', text: 'Did... did we just survive national TV?' },
  ],
  goals: { minUptime: 0.999, maxP95Ms: 300, maxCost: 600, durationSec: 90 },
};

export const missionHints = [
  'Place a load balancer, connect both clients to it, and connect it to the web servers. Clients should not talk to web-1 directly any more.',
  'At 2,600 requests/sec and about 1,000 per server you need 3 servers. But server 1 dies at 40 s, so plan for 3 servers left after the crash: 4 in the pool.',
  'Connect every new web server to the database too. A load balancer plus 3 extra servers fits the 600-credit budget.',
];
