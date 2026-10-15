/** Shared data for Level 11 (scene, quiz and mini-games). */

/* ------------------------------ Metric types ------------------------------ */
export type MetricType = 'host' | 'aggregated' | 'business';

export const METRIC_TYPES: { id: MetricType; title: string; blurb: string; color: string }[] = [
  { id: 'host', title: 'Host level', blurb: 'One machine: CPU, memory, disk I/O', color: '#22d3ee' },
  { id: 'aggregated', title: 'Aggregated level', blurb: 'A whole tier: database tier, cache tier', color: '#a78bfa' },
  { id: 'business', title: 'Key business', blurb: 'The company: DAU, retention, revenue', color: '#fbbf24' },
];

export interface MetricItem {
  id: string;
  text: string;
  type: MetricType;
  why: string;
}

/** Items for the "Metric Sorter" mini-game. */
export const METRIC_ITEMS: MetricItem[] = [
  { id: 'cpu', text: 'CPU usage of web-3', type: 'host', why: 'CPU of a single server is a host-level metric.' },
  { id: 'dau', text: 'Daily active users', type: 'business', why: 'DAU tells you how the business is doing, not how a server feels.' },
  { id: 'dbtier', text: 'p95 query time across the whole DB tier', type: 'aggregated', why: 'It rolls up every database server into one number for the tier.' },
  { id: 'mem', text: 'Free memory on cache-1', type: 'host', why: 'Memory on one specific machine is host level.' },
  { id: 'revenue', text: 'Pro subscription revenue today', type: 'business', why: 'Revenue is a key business metric.' },
  { id: 'diskio', text: 'Disk I/O on db-2', type: 'host', why: 'Disk I/O of a single box is a host-level metric.' },
  { id: 'hitrate', text: 'Hit rate of the entire cache tier', type: 'aggregated', why: 'Performance of the whole cache tier is an aggregated metric.' },
  { id: 'retention', text: '30-day retention of new users', type: 'business', why: 'Retention is one of the book\'s example business metrics.' },
  { id: 'weberr', text: 'Error rate across all web servers', type: 'aggregated', why: 'Summed over the whole web tier, so it is aggregated.' },
  { id: 'uploads', text: 'Photos uploaded per day', type: 'business', why: 'A product/business health number for PixelPost.' },
];

/* ---------------------------- Incident Detective --------------------------- */
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export interface LogLine {
  ts: string;
  host: string;
  level: LogLevel;
  msg: string;
  /** Marks a line that points at the real root cause. */
  clue?: boolean;
}

/** Centralised log stream for the mystery outage (03:00-03:12). */
export const LOGS: LogLine[] = [
  { ts: '02:58:10', host: 'web-1', level: 'INFO', msg: 'GET /feed 200 41ms' },
  { ts: '02:58:12', host: 'web-2', level: 'INFO', msg: 'POST /upload 201 180ms' },
  { ts: '02:58:40', host: 'db-1', level: 'INFO', msg: 'checkpoint complete' },
  { ts: '02:59:03', host: 'web-3', level: 'WARN', msg: 'disk usage 91% on /var', clue: true },
  { ts: '02:59:30', host: 'cache-1', level: 'INFO', msg: 'evicted 1,204 keys (LRU)' },
  { ts: '03:00:01', host: 'ci', level: 'INFO', msg: 'nightly build #812 passed all tests' },
  { ts: '03:00:02', host: 'web-1', level: 'INFO', msg: 'GET /photo/77 200 12ms' },
  { ts: '03:01:15', host: 'web-3', level: 'WARN', msg: 'disk usage 97% on /var', clue: true },
  { ts: '03:01:44', host: 'db-1', level: 'WARN', msg: 'slow query 220ms: SELECT * FROM likes' },
  { ts: '03:02:20', host: 'web-2', level: 'INFO', msg: 'GET /feed 200 38ms' },
  { ts: '03:03:05', host: 'web-3', level: 'ERROR', msg: 'write /var/tmp/upload-9f2.jpg: no space left on device', clue: true },
  { ts: '03:03:06', host: 'web-3', level: 'ERROR', msg: 'POST /upload 500 Internal Server Error' },
  { ts: '03:03:09', host: 'lb', level: 'WARN', msg: 'backend web-3 returned 5xx (12 in 10s)' },
  { ts: '03:03:30', host: 'cache-1', level: 'INFO', msg: 'hit rate 93%' },
  { ts: '03:04:00', host: 'web-3', level: 'ERROR', msg: 'log rotation failed: no space left on device', clue: true },
  { ts: '03:04:12', host: 'web-1', level: 'INFO', msg: 'POST /upload 201 175ms' },
  { ts: '03:05:00', host: 'db-1', level: 'INFO', msg: 'replication lag 40ms' },
  { ts: '03:06:41', host: 'web-3', level: 'ERROR', msg: 'POST /upload 500 Internal Server Error' },
  { ts: '03:07:02', host: 'web-2', level: 'WARN', msg: 'retrying session write (1/3)' },
  { ts: '03:08:15', host: 'cache-1', level: 'INFO', msg: 'evicted 980 keys (LRU)' },
];

/** Host-level metric series per server (12 samples, 03:00-03:11). Values 0..100 (%). */
export const HOSTS = ['web-1', 'web-2', 'web-3', 'db-1', 'cache-1'] as const;
export type HostId = (typeof HOSTS)[number];
export const HOST_METRICS: Record<HostId, { cpu: number[]; mem: number[]; disk: number[] }> = {
  'web-1': { cpu: [41, 44, 40, 46, 43, 45, 47, 44, 42, 46, 45, 43], mem: [55, 56, 55, 57, 56, 58, 57, 56, 57, 58, 57, 56], disk: [42, 42, 42, 43, 43, 43, 43, 43, 44, 44, 44, 44] },
  'web-2': { cpu: [43, 45, 44, 48, 47, 49, 50, 48, 49, 51, 50, 49], mem: [58, 58, 59, 60, 59, 60, 61, 60, 61, 61, 60, 61], disk: [39, 39, 39, 39, 40, 40, 40, 40, 40, 40, 41, 41] },
  'web-3': { cpu: [40, 42, 31, 22, 18, 15, 14, 13, 12, 12, 11, 11], mem: [54, 55, 54, 53, 52, 52, 51, 51, 50, 50, 50, 50], disk: [88, 91, 94, 97, 100, 100, 100, 100, 100, 100, 100, 100] },
  'db-1': { cpu: [52, 55, 58, 54, 53, 56, 55, 54, 53, 55, 54, 53], mem: [71, 71, 72, 72, 72, 73, 73, 73, 73, 74, 74, 74], disk: [61, 61, 61, 61, 61, 61, 62, 62, 62, 62, 62, 62] },
  'cache-1': { cpu: [18, 19, 18, 20, 19, 21, 20, 19, 20, 21, 20, 19], mem: [80, 81, 80, 82, 81, 82, 81, 82, 81, 82, 82, 81], disk: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12] },
};

/** Aggregated + business series for the dashboard tab (12 samples). */
export const DASH_SERIES: { id: string; title: string; kind: 'aggregated' | 'business'; unit: string; values: number[]; note: string }[] = [
  { id: 'err', title: 'Web tier error rate', kind: 'aggregated', unit: '%', values: [0.1, 0.1, 0.3, 8, 33, 33, 34, 33, 33, 34, 33, 33], note: 'About a third of requests fail. One web server out of three?' },
  { id: 'dbq', title: 'DB tier p95 query time', kind: 'aggregated', unit: 'ms', values: [30, 31, 33, 35, 32, 31, 32, 30, 31, 32, 31, 30], note: 'Flat. The database tier looks healthy.' },
  { id: 'hit', title: 'Cache tier hit rate', kind: 'aggregated', unit: '%', values: [93, 93, 92, 93, 94, 93, 93, 92, 93, 93, 94, 93], note: 'Steady. The cache is fine.' },
  { id: 'up', title: 'Photo uploads / min', kind: 'business', unit: '', values: [420, 431, 398, 290, 270, 268, 272, 266, 270, 268, 271, 269], note: 'Uploads dropped by about a third and stayed there.' },
];

export interface Suspect {
  id: string;
  title: string;
  detail: string;
  correct: boolean;
  rebuttal: string;
}

export const SUSPECTS: Suspect[] = [
  {
    id: 'db',
    title: 'The database is overloaded',
    detail: 'db-1 logged a slow query at 03:01.',
    correct: false,
    rebuttal: 'One slow query is normal noise. The DB tier p95 stays flat around 30 ms and db-1 CPU never moves.',
  },
  {
    id: 'deploy',
    title: 'A bad deploy broke the app',
    detail: 'The nightly build ran at 03:00.',
    correct: false,
    rebuttal: 'CI says build #812 passed every test, and web-1 and web-2 run the same code without a single error.',
  },
  {
    id: 'disk',
    title: 'web-3 ran out of disk space',
    detail: 'Something on web-3 keeps growing.',
    correct: true,
    rebuttal: 'Disk on web-3 climbs to 100%, then every upload it handles fails with "no space left on device". One of three servers failing = a third of uploads lost.',
  },
  {
    id: 'cache',
    title: 'The cache crashed',
    detail: 'cache-1 is evicting thousands of keys.',
    correct: false,
    rebuttal: 'Evictions are routine LRU housekeeping. The cache tier hit rate holds at 93%.',
  },
];

/* --------------------------------- CI flow -------------------------------- */
export const CI_STEPS = ['Check in code', 'Automated build', 'Automated tests', 'Deploy'] as const;
