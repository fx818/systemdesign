import type { ArchGraph, SimConfig } from '@/types/content';

const front: ArchGraph['nodes'] = [
  { id: 'client', kind: 'client', label: 'Web users', x: 90, y: 260 },
  { id: 'mobile', kind: 'mobile', label: 'Mobile users', x: 90, y: 460 },
  { id: 'lb', kind: 'lb', label: 'Load balancer', x: 300, y: 360 },
  { id: 'web-1', kind: 'web', label: 'web-1', x: 500, y: 260 },
  { id: 'web-2', kind: 'web', label: 'web-2', x: 500, y: 460 },
  { id: 'cache', kind: 'cache', label: 'Cache', x: 700, y: 140 },
];
const frontEdges: ArchGraph['edges'] = [
  { from: 'client', to: 'lb' },
  { from: 'mobile', to: 'lb' },
  { from: 'lb', to: 'web-1' },
  { from: 'lb', to: 'web-2' },
  { from: 'web-1', to: 'cache' },
  { from: 'web-2', to: 'cache' },
];

/** Lab: four shards behind the web tier; the shard-count knob re-splits the data. */
export const labConfig: SimConfig = {
  start: {
    nodes: [
      ...front,
      { id: 'shard-0', kind: 'shard', label: 'Shard 0', x: 920, y: 200 },
      { id: 'shard-1', kind: 'shard', label: 'Shard 1', x: 1120, y: 200 },
      { id: 'shard-2', kind: 'shard', label: 'Shard 2', x: 920, y: 420 },
      { id: 'shard-3', kind: 'shard', label: 'Shard 3', x: 1120, y: 420 },
    ],
    edges: [
      ...frontEdges,
      { from: 'web-1', to: 'shard-0', label: 'user_id % N' },
      { from: 'web-1', to: 'shard-1' },
      { from: 'web-2', to: 'shard-2' },
      { from: 'web-2', to: 'shard-3', label: 'user_id % N' },
    ],
  },
  palette: ['shard', 'cache', 'nosql', 'db-replica'],
  budget: 2000,
  events: [
    { at: 0, type: 'traffic', rps: 3000, label: '8M users, normal day' },
    { at: 40, type: 'hotkey', share: 0.6, label: 'Celebrity post!' },
    { at: 70, type: 'hotkey', share: 0.25, label: 'Celebrity buzz fades' },
  ],
  goals: { durationSec: 240 },
  knobs: [
    { id: 'shards', label: 'Shards (user_id % N)', type: 'slider', min: 1, max: 8, step: 1, initial: 4 },
    { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 500, max: 8000, step: 250, initial: 3000 },
    { id: 'cacheSize', label: 'Cache size', type: 'slider', min: 0, max: 100, step: 10, initial: 40 },
  ],
  locked: ['client', 'mobile', 'lb', 'web-1', 'web-2'],
};

export const labTasks = [
  'Drag the Shards slider down to 1. That is vertical scaling: one database carries everything. Push traffic until it saturates.',
  'Go back to 4 shards: each shard now holds about a quarter of the users and a quarter of the load.',
  'Wait for the celebrity post at t=40. Watch one shard light up red while the others stay calm: the hotspot key problem.',
  'Try fixes: add a dedicated Shard for the hot account, or a bigger cache in front. Which one cools it down?',
  'Change the shard count from 4 to 5 and think: with user_id % N, how many users would have to move? (Hint: most of them. That is why resharding hurts.)',
];

/** Mission: data growth + a celebrity post at t=50. Start with one overloaded master. */
export const missionConfig: SimConfig = {
  start: {
    nodes: [...front, { id: 'db', kind: 'db', label: 'Master DB (95% disk)', x: 950, y: 360 }],
    edges: [...frontEdges, { from: 'web-1', to: 'db' }, { from: 'web-2', to: 'db' }, { from: 'cache', to: 'db' }],
  },
  palette: ['shard', 'db', 'db-replica', 'cache', 'nosql', 'web'],
  budget: 1800,
  locked: ['client', 'mobile', 'lb', 'web-1', 'web-2'],
  events: [
    { at: 0, type: 'traffic', rps: 2500, label: 'Normal day' },
    { at: 3, type: 'message', who: 'ravi', text: 'One master can not hold eight million users for long. Shard the data before the traffic grows.' },
    { at: 20, type: 'traffic', rps: 3500, label: 'Data keeps growing' },
    { at: 35, type: 'traffic', rps: 4500, label: 'Evening peak' },
    { at: 45, type: 'message', who: 'maya', text: 'She is about to post. Three million followers. Brace!' },
    { at: 50, type: 'hotkey', share: 0.6, label: 'Celebrity tour photos' },
    { at: 52, type: 'message', who: 'pager', text: 'BZZT! One shard is taking 60% of all reads!' },
    { at: 60, type: 'message', who: 'ravi', text: 'A dedicated shard for the hot account, and a cache in front, will spread that load.' },
    { at: 80, type: 'hotkey', share: 0.3, label: 'Fans calm down a bit' },
    { at: 95, type: 'traffic', rps: 3500, label: 'Late night' },
    { at: 110, type: 'message', who: 'maya', text: 'Her post has 3 million likes and we are still up. I love databases now.' },
  ],
  goals: { minUptime: 0.97, maxP95Ms: 350, maxCost: 1800, durationSec: 120 },
};

export const missionHints = [
  'Replace the single master with shards: place 4 Shard nodes and connect the web servers to them. Each one holds about a quarter of the users (user_id % 4).',
  'At t=50 a celebrity post sends 60% of reads to one shard. Add one more Shard as a dedicated celebrity shard, or grow the cache so most of those reads never reach the database.',
  'Do not overbuild: four shards plus one hot-spot shard fits the budget. Every extra node costs credits and your second star.',
];
