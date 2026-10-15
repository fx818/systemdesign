import type { SimConfig } from '@/types/content';
import { lockedIds, pixelBoard } from '../common/board';

const start = pixelBoard({ webs: 2, cache: true });

export const labConfig: SimConfig = {
  start,
  palette: ['web'],
  budget: 1500,
  events: [{ at: 0, type: 'traffic', rps: 1024, label: '2^10 requests/sec' }],
  goals: { minUptime: 0.95, maxP95Ms: 400, durationSec: 120 },
  knobs: [
    { id: 'rps', label: 'Traffic (requests/sec, steps of 512 = 2^9)', type: 'slider', min: 0, max: 8192, step: 512, initial: 1024 },
    { id: 'servers', label: 'Web servers (~1,000 = 2^10 req/s each)', type: 'slider', min: 1, max: 8, step: 1, initial: 2 },
  ],
  locked: lockedIds(start),
};

export const labTasks = [
  'Traffic starts at 2^10 = 1,024 requests per second. Two servers (about 2^10 each) cope easily.',
  'Double the traffic to 2^11 = 2,048. Each step of the power of two doubles the load: watch the servers turn amber.',
  'Push it to 2^12 = 4,096 with only 4 servers. Close to 4,000 is not the same as under 4,000: requests start dropping.',
  'Add servers until everything is green again. Count how many you needed.',
  'Kill a server and see how much headroom you really had.',
];

export const missionConfig: SimConfig = {
  start,
  palette: ['web'],
  budget: 1300,
  locked: lockedIds(start),
  events: [
    { at: 0, type: 'traffic', rps: 1024, label: '2^10 req/s: warm-up' },
    { at: 4, type: 'message', who: 'maya', text: 'The investors just opened the live demo. Traffic is climbing in powers of two!' },
    { at: 15, type: 'traffic', rps: 2048, label: '2^11 req/s' },
    { at: 25, type: 'message', who: 'ravi', text: 'Peak is 2^12. Each web server takes about 2^10 requests per second. Do the division, then add a spare.' },
    { at: 35, type: 'traffic', rps: 4096, label: '2^12 req/s: investor peak' },
    { at: 37, type: 'message', who: 'pager', text: 'BZZT. 4,096 is not 4,000. Did you round the wrong way?' },
    { at: 70, type: 'traffic', rps: 2048, label: 'Demo over' },
  ],
  goals: { minUptime: 0.99, maxP95Ms: 150, maxCost: 1300, durationSec: 80 },
};

export const missionHints = [
  'Peak traffic is 2^12 = 4,096 requests per second and each web server handles about 1,000 (≈ 2^10). 4,096 / 1,000 ≈ 4.1.',
  'Four servers give 4,000 requests per second: just short of 4,096, so some requests drop. Place five web servers and connect each one to the load balancer, cache and database.',
];
