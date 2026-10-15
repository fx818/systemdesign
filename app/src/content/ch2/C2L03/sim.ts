import type { SimConfig } from '@/types/content';
import { lockedIds, pixelBoard } from '../common/board';

const start = pixelBoard({ webs: 3, cache: true });

export const labConfig: SimConfig = {
  start,
  palette: ['web'],
  budget: 1500,
  events: [{ at: 0, type: 'traffic', rps: 2000, label: 'Business customers online' }],
  goals: { minUptime: 0.95, maxP95Ms: 400, durationSec: 120 },
  knobs: [
    { id: 'servers', label: 'Web servers in the pool', type: 'slider', min: 1, max: 6, step: 1, initial: 3 },
    { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 0, max: 5000, step: 100, initial: 2000 },
  ],
  locked: lockedIds(start),
};

export const labTasks = [
  'Watch the uptime meter: it is the share of requests served successfully, the number an SLA is written against.',
  'Kill one web server. With three servers and 2,000 requests per second there is just enough room: uptime holds.',
  'Push traffic to 3,000 and kill a server again. Now every failure burns your error budget.',
  'Use the servers slider to find the smallest pool that survives one failure at 3,000 requests per second (N + 1).',
];

export const missionConfig: SimConfig = {
  start,
  palette: ['web'],
  budget: 1200,
  locked: lockedIds(start),
  events: [
    { at: 0, type: 'traffic', rps: 2500, label: 'Enterprise customers at work' },
    { at: 5, type: 'message', who: 'ravi', text: '2,500 requests per second ÷ ~1,000 per server ≈ 3 servers. One failure and we are short. Add a spare.' },
    { at: 25, type: 'kill', target: 'web-1', label: 'Server 1 crashes' },
    { at: 27, type: 'message', who: 'pager', text: 'BZZT. Server 1 down. Every dropped request counts against the 99.9% SLA.' },
    { at: 45, type: 'revive', target: 'web-1' },
    { at: 55, type: 'message', who: 'maya', text: 'Deploy time! Server 2 restarts with the new version. Nobody should notice.' },
    { at: 58, type: 'kill', target: 'web-2', label: 'Deploy: server 2 restarting' },
    { at: 70, type: 'revive', target: 'web-2' },
  ],
  goals: { minUptime: 0.999, maxP95Ms: 200, maxCost: 1200, durationSec: 80 },
};

export const missionHints = [
  'Estimate: 2,500 requests per second needs about 3 servers at ~1,000 each. That is the minimum, not the plan.',
  'Add a fourth web server (N + 1) and wire it to the load balancer, cache and database. When one server is down, the other three still carry 2,500 requests per second.',
];
