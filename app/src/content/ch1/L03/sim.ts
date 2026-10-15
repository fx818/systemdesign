import type { SimConfig } from '@/types/content';

export const labConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web browser', x: 140, y: 240 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 140, y: 480 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 420, y: 100 },
      { id: 'web-1', kind: 'web', label: 'web-1 (15.125.23.214)', x: 600, y: 360 },
      { id: 'db-1', kind: 'db', label: 'Database', x: 1000, y: 360 },
    ],
    edges: [
      { from: 'client', to: 'dns' },
      { from: 'mobile', to: 'dns' },
      { from: 'client', to: 'web-1', label: 'HTTP' },
      { from: 'mobile', to: 'web-1', label: 'HTTP' },
      { from: 'web-1', to: 'db-1', label: 'SQL' },
    ],
  },
  palette: ['web'],
  budget: 500,
  events: [{ at: 0, type: 'traffic', rps: 600, label: '10,000 users online' }],
  goals: { durationSec: 180 },
  knobs: [
    { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 0, max: 4000, step: 100, initial: 600 },
    { id: 'servers', label: 'Web servers in the pool', type: 'slider', min: 1, max: 3, step: 1, initial: 1 },
  ],
  locked: ['client', 'mobile', 'dns', 'web-1', 'db-1'],
};

export const labTasks = [
  'Push the traffic slider up until web-1 turns red. One box has a ceiling: that is the hard limit of scaling up.',
  'Kill web-1. Every request fails, even though the database is fine: no failover, no redundancy.',
  'Revive web-1, then set "Web servers" to 3. Total capacity triples: that is scaling out.',
  'Kill web-1 again. Notice that clients still connect straight to web-1\'s IP, so the extra servers cannot save them yet. (Level 4 fixes this.)',
  'Bonus: play the "Hardware Wall" mini-game to feel how fast vertical upgrades get expensive.',
];

export const missionConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web browser', x: 140, y: 240 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 140, y: 480 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 420, y: 100 },
      { id: 'web-1', kind: 'web', label: 'web-1', x: 600, y: 300 },
      { id: 'db-1', kind: 'db', label: 'Database', x: 1000, y: 360 },
    ],
    edges: [
      { from: 'client', to: 'dns' },
      { from: 'mobile', to: 'dns' },
      { from: 'client', to: 'web-1', label: 'HTTP' },
      { from: 'mobile', to: 'web-1', label: 'HTTP' },
      { from: 'web-1', to: 'db-1', label: 'SQL' },
    ],
  },
  palette: ['web'],
  budget: 300,
  locked: ['client', 'mobile', 'dns', 'web-1', 'db-1'],
  events: [
    { at: 0, type: 'traffic', rps: 500, label: 'Evening traffic' },
    { at: 5, type: 'message', who: 'maya', text: 'Segment airs in 20 seconds. I am refreshing the app nonstop. Sorry.' },
    { at: 15, type: 'message', who: 'ravi', text: 'One box tops out around 1,000 requests/sec. Do the math before the spike lands.' },
    { at: 25, type: 'traffic', rps: 1800, label: 'Prime-time TV spike' },
    { at: 30, type: 'message', who: 'pager', text: 'BZZT! Traffic x3.6! BZZZT!' },
    { at: 45, type: 'traffic', rps: 2400, label: 'Viewers tell their friends' },
    { at: 50, type: 'message', who: 'maya', text: 'The host just said "download it now". On live TV.' },
    { at: 70, type: 'traffic', rps: 900, label: 'Segment over' },
    { at: 75, type: 'message', who: 'ravi', text: 'Notice: you never needed one giant server. You needed more of them.' },
  ],
  goals: { minUptime: 0.95, maxP95Ms: 400, maxCost: 300, durationSec: 90 },
};

export const missionHints = [
  'There is no "bigger server" in the palette on purpose: you are already near the top tier. The only way up is more web servers.',
  'At 2,400 requests/sec and about 1,000 per server, you need at least 3 web servers in total. Connect the clients to each new server, and each server to the database.',
  'Two extra web servers (about 200 credits) fit the 300-credit budget. Place them before the spike at 25 s.',
];
