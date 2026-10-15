import type { SimConfig } from '@/types/content';

export const labConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Users', x: 110, y: 360 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 260, y: 110 },
      { id: 'lb', kind: 'lb', label: 'Load balancer', x: 330, y: 360 },
      { id: 'web-1', kind: 'web', label: 'Server 1', x: 560, y: 240 },
      { id: 'web-2', kind: 'web', label: 'Server 2', x: 560, y: 480 },
      { id: 'db-1', kind: 'db', label: 'Master (writes)', x: 880, y: 160 },
      { id: 'replica-1', kind: 'db-replica', label: 'Replica 1 (reads)', x: 880, y: 400 },
      { id: 'replica-2', kind: 'db-replica', label: 'Replica 2 (reads)', x: 1100, y: 400 },
    ],
    edges: [
      { from: 'client', to: 'dns' },
      { from: 'client', to: 'lb' },
      { from: 'lb', to: 'web-1' },
      { from: 'lb', to: 'web-2' },
      { from: 'web-1', to: 'db-1', label: 'writes' },
      { from: 'web-2', to: 'db-1', label: 'writes' },
      { from: 'web-1', to: 'replica-1', label: 'reads' },
      { from: 'web-2', to: 'replica-1', label: 'reads' },
      { from: 'web-1', to: 'replica-2', label: 'reads' },
      { from: 'web-2', to: 'replica-2', label: 'reads' },
      { from: 'db-1', to: 'replica-1', label: 'replication' },
      { from: 'db-1', to: 'replica-2', label: 'replication' },
    ],
  },
  palette: ['db-replica'],
  budget: 800,
  events: [{ at: 0, type: 'traffic', rps: 1500, label: 'Evening scrolling' }],
  goals: { durationSec: 180 },
  knobs: [
    { id: 'replicas', label: 'Read replicas', type: 'slider', min: 0, max: 4, step: 1, initial: 2 },
    { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 0, max: 5000, step: 100, initial: 1500 },
  ],
  locked: ['client', 'dns', 'lb', 'web-1', 'web-2', 'db-1'],
};

export const labTasks = [
  'Watch the flow: writes go to the master, reads are spread over the replicas, and the master copies data to them.',
  'Set "Read replicas" to 0. Every read now lands on the master: watch it heat up. Then bring them back.',
  'Kill one replica. Reads move to the healthy replica: nothing breaks.',
  'Kill every replica. Reads fall back to the master temporarily.',
  'Kill the master. A replica is promoted after a few seconds: watch for the stale-data warning.',
];

export const missionConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Users', x: 110, y: 360 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 260, y: 110 },
      { id: 'lb', kind: 'lb', label: 'Load balancer', x: 330, y: 360 },
      { id: 'web-1', kind: 'web', label: 'Server 1', x: 560, y: 240 },
      { id: 'web-2', kind: 'web', label: 'Server 2', x: 560, y: 480 },
      { id: 'db-1', kind: 'db', label: 'Master', x: 880, y: 160 },
    ],
    edges: [
      { from: 'client', to: 'dns' },
      { from: 'client', to: 'lb' },
      { from: 'lb', to: 'web-1' },
      { from: 'lb', to: 'web-2' },
      { from: 'web-1', to: 'db-1' },
      { from: 'web-2', to: 'db-1' },
    ],
  },
  palette: ['db-replica'],
  budget: 400,
  locked: ['client', 'dns', 'lb', 'web-1', 'web-2', 'db-1'],
  events: [
    { at: 0, type: 'traffic', rps: 1200, label: 'Normal evening' },
    { at: 5, type: 'message', who: 'ravi', text: 'Reads are about 90% of our traffic. Give them somewhere to go besides the master.' },
    { at: 18, type: 'traffic', rps: 1600, label: 'Photo contest starts' },
    { at: 30, type: 'kill', target: 'db-1', label: 'Master crashes' },
    { at: 32, type: 'message', who: 'pager', text: 'BZZZT! Master down! Who is taking the writes now?' },
    { at: 45, type: 'message', who: 'maya', text: 'Uploads are working again? Someone got promoted, I hear. Congrats, replica!' },
    { at: 60, type: 'kill', target: 'db-replica', label: 'A replica fails' },
    { at: 62, type: 'message', who: 'ravi', text: 'Reads should shift to the healthy replicas. Nothing to see here, hopefully.' },
    { at: 75, type: 'traffic', rps: 1000, label: 'Contest closes' },
  ],
  goals: { minUptime: 0.97, maxP95Ms: 300, maxCost: 400, durationSec: 90 },
};

export const missionHints = [
  'Place replicas and connect each web server to them for reads, plus the master to each replica for replication.',
  'When the master dies at 30 s, one replica gets promoted. When another dies at 60 s, you still need a replica left to serve reads: plan for 3.',
  'Three replicas fit inside the 400-credit budget. Place them all before 30 s so they are synced before the crash.',
];
