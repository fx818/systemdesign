import type { ArchGraph, SimConfig } from '@/types/content';

/** Starting board: browser + mobile app, DNS, and the single server. */
const singleServer: ArchGraph = {
  nodes: [
    { id: 'client', kind: 'client', label: 'Web browser', x: 180, y: 220 },
    { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 180, y: 500 },
    { id: 'dns', kind: 'dns', label: 'DNS', x: 560, y: 120 },
    { id: 'web-1', kind: 'web', label: 'Single server', x: 860, y: 360 },
  ],
  edges: [
    { from: 'client', to: 'dns', label: 'lookup' },
    { from: 'mobile', to: 'dns', label: 'lookup' },
    { from: 'client', to: 'web-1', label: 'HTTP' },
    { from: 'mobile', to: 'web-1', label: 'HTTP' },
  ],
};

export const labConfig: SimConfig = {
  start: singleServer,
  palette: [],
  budget: 200,
  events: [{ at: 0, type: 'traffic', rps: 20, label: 'Launch day: Maya\'s mom' }],
  goals: { minUptime: 0.95, maxP95Ms: 400, durationSec: 120 },
  knobs: [{ id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 0, max: 3000, step: 1, initial: 20 }],
  locked: ['client', 'mobile', 'dns', 'web-1'],
};

export const labTasks = [
  'Watch requests flow from the browser and the mobile app to the single server.',
  'Drag the traffic slider up until the server turns red and starts dropping requests.',
  'Bring traffic back down and notice that it recovers.',
  'Kill the server. Every request fails: one box means one point of failure.',
  'Revive it and check that the site comes back.',
];

export const missionConfig: SimConfig = {
  start: {
    nodes: [
      { id: 'client', kind: 'client', label: 'Web browser', x: 180, y: 220 },
      { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 180, y: 500 },
      { id: 'dns', kind: 'dns', label: 'DNS', x: 560, y: 120 },
    ],
    edges: [
      { from: 'client', to: 'dns', label: 'lookup' },
      { from: 'mobile', to: 'dns', label: 'lookup' },
    ],
  },
  palette: ['web'],
  budget: 130,
  locked: ['client', 'mobile', 'dns'],
  events: [
    { at: 0, type: 'traffic', rps: 1, label: 'Mom signs up' },
    { at: 3, type: 'message', who: 'maya', text: 'She\'s in! She is uploading a picture of her cat.' },
    { at: 20, type: 'traffic', rps: 60, label: 'The book club arrives' },
    { at: 24, type: 'message', who: 'maya', text: 'The book club is here. Sixty of them, all at once!' },
    { at: 40, type: 'traffic', rps: 200, label: 'Book club tells their kids' },
    { at: 44, type: 'message', who: 'ravi', text: 'One server can easily take this. Watch the request dots flow.' },
  ],
  goals: { minUptime: 0.95, maxP95Ms: 300, maxCost: 130, durationSec: 60 },
};

export const missionHints = [
  'Drag a Web server from the palette onto the board. A single box is all you need at this stage.',
  'Connect both the Web browser and the Mobile app to your server. DNS only gives them its address; the HTTP requests then go straight to the server.',
  'One web server costs well under the 130-credit budget. Don\'t add extras: this level is about the simplest possible setup.',
];
