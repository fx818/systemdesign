import type { SimConfig } from '@/types/content';
import { lockedIds, pixelBoard } from '../common/board';

const withCache = pixelBoard({ webs: 4, cache: true });
const diskOnly = pixelBoard({ webs: 4 });

export const labConfig: SimConfig = {
  start: withCache,
  palette: ['cache', 'db-replica'],
  budget: 1500,
  events: [{ at: 0, type: 'traffic', rps: 2400, label: 'Evening feed scroll' }],
  goals: { minUptime: 0.95, maxP95Ms: 400, durationSec: 120 },
  knobs: [
    { id: 'cacheSize', label: 'Memory for the cache (GB)', type: 'slider', min: 0, max: 64, step: 1, initial: 50 },
    { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 0, max: 4000, step: 100, initial: 2400 },
  ],
  locked: lockedIds(withCache),
};

export const labTasks = [
  'Watch p95 latency: most feed reads are answered from memory (the cache), not from the database disk.',
  'Drag the cache memory down to 0 GB. Every read now pays the disk price: watch the database heat up and p95 jump.',
  'Bring memory back to a few GB and see the hit rate (and latency) recover.',
  'Kill the cache. Memory is fast, but it is also where your speed lives: plan a fallback.',
];

export const missionConfig: SimConfig = {
  start: diskOnly,
  palette: ['cache', 'db-replica', 'web'],
  budget: 1200,
  locked: lockedIds(diskOnly),
  events: [
    { at: 0, type: 'traffic', rps: 2400, label: 'Feed traffic from Europe and the US' },
    { at: 5, type: 'message', who: 'maya', text: 'The Amsterdam investor is scrolling the feed right now. Make it snappy.' },
    { at: 20, type: 'message', who: 'ravi', text: 'Every feed read hits the disk. A memory reference is ~100 ns; a disk seek is ~10 ms. Where should hot data live?' },
    { at: 30, type: 'traffic', rps: 3000, label: 'Europe wakes up' },
    { at: 60, type: 'message', who: 'pager', text: 'BZZT. Still here. Still counting milliseconds.' },
  ],
  goals: { minUptime: 0.99, maxP95Ms: 40, maxCost: 1200, durationSec: 80 },
};

export const missionHints = [
  'Disk reads are the slow part. Place a cache (memory) and connect all four web servers to it.',
  'Replicas only spread disk reads across more disks: each read still costs ~15 ms. A cache answers most reads from memory, which is what gets p95 under 40 ms.',
];
