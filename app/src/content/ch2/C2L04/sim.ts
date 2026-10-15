import type { SimConfig } from '@/types/content';
import { lockedIds, pixelBoard } from '../common/board';

const labStart = pixelBoard({ webs: 3, cache: true });
const missionStart = pixelBoard({ webs: 1 });

export const labConfig: SimConfig = {
  start: labStart,
  palette: ['web', 'cache', 'db-replica'],
  budget: 1800,
  events: [{ at: 0, type: 'traffic', rps: 2900, label: 'Average: ~2,900 read QPS' }],
  goals: { minUptime: 0.95, maxP95Ms: 400, durationSec: 120 },
  knobs: [
    { id: 'rps', label: 'Traffic (QPS)', type: 'slider', min: 0, max: 8000, step: 100, initial: 2900 },
    { id: 'servers', label: 'Web servers', type: 'slider', min: 1, max: 10, step: 1, initial: 3 },
  ],
  locked: lockedIds(labStart),
};

export const labTasks = [
  'Your napkin says ~2,900 QPS on average. Three servers just about cope: check their load.',
  'Slide traffic to the estimated peak, 5,800 QPS (2 × average). Watch requests drop.',
  'Use the servers slider to find the smallest pool that carries the peak. Does it match 5,800 ÷ 1,000?',
  'Kill the cache at peak traffic. The database (~800 QPS) cannot take the reads: estimate cache needs too, not just servers.',
];

export const missionConfig: SimConfig = {
  start: missionStart,
  palette: ['web', 'cache', 'db-replica'],
  budget: 1450,
  locked: lockedIds(missionStart),
  events: [
    { at: 0, type: 'traffic', rps: 2900, label: 'Average day: ~2,900 QPS' },
    { at: 4, type: 'message', who: 'maya', text: 'The investors are watching the live dashboard. Your napkin is on the screen next to it.' },
    { at: 15, type: 'message', who: 'ravi', text: 'Peak arrives at 30 seconds: about 2 × average. Size for the peak, not for the average.' },
    { at: 30, type: 'traffic', rps: 5800, label: 'Evening peak: 2 × average' },
    { at: 32, type: 'message', who: 'pager', text: 'BZZT. 5,800 QPS. Was your napkin right?' },
    { at: 60, type: 'traffic', rps: 2900, label: 'Back to average' },
  ],
  goals: { minUptime: 0.99, maxP95Ms: 150, maxCost: 1450, durationSec: 75 },
};

export const missionHints = [
  'Peak QPS ≈ 5,800 and one web server handles ~1,000: place web servers until the pool has 6, each wired from the load balancer to the database.',
  'At peak the web tier sends ~1,900 reads per second to a database that handles ~800. A single cache (wired from every web server) absorbs most reads for 120 credits; three replicas would cost 750.',
  'Budget check: 6 web servers + 1 cache + LB, DNS and database fits in 1,450 credits. A 5-server pool drops requests at the peak.',
];
