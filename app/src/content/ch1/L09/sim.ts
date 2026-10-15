import type { ArchGraph, SimConfig } from '@/types/content';

/**
 * Two data centers behind geoDNS. Region names ('us-east', 'us-west') are the node ids of the
 * datacenter nodes, so `region-down` events and the `split` knob can find them.
 */
const twoDcs: ArchGraph = {
  nodes: [
    { id: 'client', kind: 'client', label: 'Users · West', x: 160, y: 110 },
    { id: 'mobile', kind: 'mobile', label: 'Users · East', x: 1120, y: 110 },
    { id: 'dns', kind: 'dns', label: 'geoDNS', x: 640, y: 110 },
    { id: 'cdn', kind: 'cdn', label: 'CDN', x: 400, y: 80 },
    { id: 'us-west', kind: 'datacenter', label: 'DC 2 · US-West', x: 330, y: 300 },
    { id: 'us-east', kind: 'datacenter', label: 'DC 1 · US-East', x: 950, y: 300 },
    { id: 'web-w', kind: 'web', label: 'Web (West)', x: 330, y: 450 },
    { id: 'web-e', kind: 'web', label: 'Web (East)', x: 950, y: 450 },
    { id: 'db-w', kind: 'db', label: 'DB (West)', x: 330, y: 610 },
    { id: 'db-e', kind: 'db', label: 'DB (East)', x: 950, y: 610 },
  ],
  edges: [
    { from: 'client', to: 'dns' },
    { from: 'mobile', to: 'dns' },
    { from: 'client', to: 'cdn', label: 'static' },
    { from: 'mobile', to: 'cdn', label: 'static' },
    { from: 'dns', to: 'us-west', label: 'geo-routed' },
    { from: 'dns', to: 'us-east', label: 'geo-routed' },
    { from: 'us-west', to: 'web-w' },
    { from: 'us-east', to: 'web-e' },
    { from: 'web-w', to: 'db-w' },
    { from: 'web-e', to: 'db-e' },
  ],
};

export const labConfig: SimConfig = {
  start: {
    nodes: twoDcs.nodes,
    edges: [...twoDcs.edges, { from: 'db-w', to: 'db-e', label: 'replication' }],
  },
  palette: ['web', 'db-replica'],
  budget: 3000,
  events: [
    { at: 0, type: 'traffic', rps: 4000, label: 'Two coasts, one PixelPost' },
    { at: 5, type: 'message', who: 'ravi', text: 'Drag the split slider: that is the x% geoDNS sends to US-East.' },
  ],
  goals: { minUptime: 0.95, maxP95Ms: 400, durationSec: 240 },
  knobs: [
    { id: 'split', label: 'geoDNS split: % to US-East', type: 'slider', min: 0, max: 100, step: 5, initial: 50 },
    { id: 'replicas', label: 'Cross-DC replication (0 = off)', type: 'slider', min: 0, max: 2, step: 1, initial: 1 },
    { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 500, max: 10000, step: 500, initial: 4000 },
  ],
  locked: ['client', 'mobile', 'dns', 'us-west', 'us-east'],
};

export const labTasks = [
  'Move the split slider from 50% to 80%. US-East gets busier and US-West quieter: geoDNS decides who goes where.',
  'Set it back to about 50% and press region-down on US-West. GeoDNS sends 100% of the traffic to US-East.',
  'Bring US-West back. Now turn cross-DC replication off (0) and take US-West down again: failed-over users find their data missing.',
  'Turn replication back on and repeat. Same outage, but no data loss this time.',
  'Push traffic up during the outage. Does US-East have enough web capacity to carry everyone alone?',
];

export const missionConfig: SimConfig = {
  start: twoDcs,
  palette: ['web', 'db-replica', 'cache'],
  budget: 2250,
  locked: ['client', 'mobile', 'dns', 'us-west', 'us-east', 'db-w', 'db-e'],
  knobs: [{ id: 'split', label: 'geoDNS split: % to US-East', type: 'slider', min: 0, max: 100, step: 5, initial: 50 }],
  events: [
    { at: 0, type: 'traffic', rps: 3500, label: 'Morning on both coasts' },
    { at: 3, type: 'message', who: 'maya', text: 'Both data centers are live. Please tell me the photos exist in both.' },
    { at: 20, type: 'message', who: 'pager', text: 'bzzt. Radar shows the storm turning back toward US-West. 20 seconds.' },
    { at: 30, type: 'traffic', rps: 4500, label: 'West Coast wakes up' },
    { at: 40, type: 'region-down', region: 'us-west', label: 'Storm: US-West offline' },
    { at: 41, type: 'message', who: 'ravi', text: 'US-West is down. GeoDNS is moving 100% of traffic to US-East. Can it carry the load?' },
    { at: 70, type: 'message', who: 'maya', text: 'West Coast users are posting from US-East. Are their old photos there?!' },
    { at: 85, type: 'message', who: 'ravi', text: 'Hold steady. The storm is moving on.' },
  ],
  goals: { minUptime: 0.995, maxP95Ms: 400, maxCost: 2250, durationSec: 100 },
};

export const missionHints = [
  'Connect db-w directly to db-e with a replication link; both databases already exist, so this costs no extra credits. Without it, failed-over users find their data missing.',
  'After the outage US-East carries 100% of the traffic. Add a web server in US-East before 40 s. Connect us-east to the new server and the server to db-e so it belongs to the surviving region.',
  'One replication path and one extra East web server are enough. Anything more eats the budget.',
];
