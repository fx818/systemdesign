import type { ArchGraph, SimConfig } from '@/types/content';

/** Stateless web tier from Level 8; photo filters still run inside the web servers. */
const noQueue: ArchGraph = {
  nodes: [
    { id: 'client', kind: 'client', label: 'Web browser', x: 110, y: 230 },
    { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 110, y: 490 },
    { id: 'lb', kind: 'lb', label: 'Load balancer', x: 340, y: 360 },
    { id: 'web-1', kind: 'web', label: 'Web 1', x: 590, y: 250 },
    { id: 'web-2', kind: 'web', label: 'Web 2', x: 590, y: 470 },
    { id: 'nosql', kind: 'nosql', label: 'Session store', x: 860, y: 110 },
    { id: 'db', kind: 'db', label: 'Database', x: 1120, y: 620 },
    { id: 'storage', kind: 'storage', label: 'Photo storage', x: 1120, y: 110 },
  ],
  edges: [
    { from: 'client', to: 'lb', label: 'HTTP' },
    { from: 'mobile', to: 'lb', label: 'HTTP' },
    { from: 'lb', to: 'web-1' },
    { from: 'lb', to: 'web-2' },
    { from: 'web-1', to: 'nosql' },
    { from: 'web-2', to: 'nosql' },
    { from: 'web-1', to: 'db' },
    { from: 'web-2', to: 'db' },
    { from: 'web-1', to: 'storage' },
  ],
};

const withQueue: ArchGraph = {
  nodes: [
    ...noQueue.nodes,
    { id: 'queue', kind: 'queue', label: 'Photo jobs queue', x: 860, y: 360 },
    { id: 'worker-1', kind: 'worker', label: 'Worker 1', x: 1120, y: 300 },
    { id: 'worker-2', kind: 'worker', label: 'Worker 2', x: 1120, y: 440 },
  ],
  edges: [
    ...noQueue.edges,
    { from: 'web-1', to: 'queue', label: 'publish' },
    { from: 'web-2', to: 'queue', label: 'publish' },
    { from: 'queue', to: 'worker-1', label: 'consume' },
    { from: 'queue', to: 'worker-2', label: 'consume' },
    { from: 'worker-1', to: 'storage' },
    { from: 'worker-2', to: 'storage' },
  ],
};

export const labConfig: SimConfig = {
  start: withQueue,
  palette: ['worker', 'web'],
  budget: 2000,
  events: [
    { at: 0, type: 'traffic', rps: 1800, label: 'Filter launch' },
    { at: 0, type: 'jobs', perSec: 80, label: 'Photo jobs' },
    { at: 5, type: 'message', who: 'ravi', text: 'Photo jobs are flowing in. Turn the workers knob down and watch the queue length graph climb, then fix it.' },
  ],
  goals: { minUptime: 0.95, maxP95Ms: 400, durationSec: 240 },
  knobs: [
    { id: 'rps', label: 'Page traffic (requests/sec)', type: 'slider', min: 500, max: 8000, step: 100, initial: 1800 },
    { id: 'workers', label: 'Photo workers', type: 'slider', min: 0, max: 10, step: 1, initial: 2 },
  ],
  locked: ['client', 'mobile', 'lb', 'web-1', 'web-2', 'queue', 'db', 'nosql', 'storage'],
};

export const labTasks = [
  'Look at the flow: web servers publish photo jobs to the queue, workers consume them. Upload requests return immediately.',
  'Lower the workers knob below what the jobs need. The queue length graph climbs: jobs are waiting, but the web p95 stays low.',
  'Kill both workers (consumers). The web servers keep publishing and nothing is lost: the jobs wait in the queue.',
  'Revive the workers and raise the workers knob. Watch the backlog drain.',
  'Kill web-1 and web-2 (the producers). The workers keep processing the queued jobs until the queue is empty.',
];

export const missionConfig: SimConfig = {
  start: noQueue,
  palette: ['queue', 'worker', 'web'],
  budget: 1850,
  locked: ['client', 'mobile', 'lb', 'web-1', 'web-2', 'db', 'nosql', 'storage'],
  // Place real workers so one crash leaves other consumers running.
  knobs: [],
  events: [
    { at: 0, type: 'traffic', rps: 2200, label: 'Filters are live' },
    { at: 0, type: 'jobs', perSec: 40, label: 'Normal uploads' },
    { at: 3, type: 'message', who: 'maya', text: 'Uploads with filters take 20 seconds. Make it stop!' },
    { at: 15, type: 'message', who: 'ravi', text: 'Put a queue between the web servers and the slow work, and let workers consume it.' },
    { at: 30, type: 'jobs', perSec: 160, label: '"Blur Your Boss" contest' },
    { at: 31, type: 'message', who: 'maya', text: 'The contest is live! Everyone is blurring their boss!' },
    { at: 45, type: 'kill', target: 'worker', label: 'A worker crashes' },
    { at: 46, type: 'message', who: 'pager', text: 'bzzt. One worker down. Did the queue even flinch?' },
    { at: 60, type: 'revive', target: 'worker' },
    { at: 65, type: 'jobs', perSec: 30, label: 'Contest over' },
    { at: 67, type: 'message', who: 'ravi', text: 'The queue is nearly empty. Do we still need all those workers?' },
  ],
  goals: { maxP95Ms: 300, maxQueue: 400, minUptime: 0.98, maxCost: 1850, durationSec: 90 },
};

export const missionHints = [
  'Add a third web server behind the LB and connect it to the database and session store. Place a Message queue node. Connect the web servers to it (they publish) and the queue to workers (they consume). Uploads stop blocking the web tier.',
  'When the contest starts at 30 s, the jobs per second quadruple. Place five connected workers before the contest: four survivors still process 200 jobs/sec when one crashes.',
  'After the contest (65 s) the queue is almost empty. Remove surplus workers after the contest; idle workers waste credits and cost you a star.',
];
