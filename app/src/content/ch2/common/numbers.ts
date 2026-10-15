/** Canonical Chapter 2 numbers (book pages 34-40), shared by scenes, quizzes and mini-games. */

/* ----------------------------- Power of two ------------------------------ */
export interface PowerRow { power: number; approx: string; name: string; short: string }
/** Table 2-1: data volume units as powers of two. */
export const POWERS: PowerRow[] = [
  { power: 10, approx: '1 Thousand', name: 'Kilobyte', short: 'KB' },
  { power: 20, approx: '1 Million', name: 'Megabyte', short: 'MB' },
  { power: 30, approx: '1 Billion', name: 'Gigabyte', short: 'GB' },
  { power: 40, approx: '1 Trillion', name: 'Terabyte', short: 'TB' },
  { power: 50, approx: '1 Quadrillion', name: 'Petabyte', short: 'PB' },
];
export const UNIT_LADDER = ['Bit', 'Byte', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

/* ------------------------------ Latency ---------------------------------- */
export interface LatencyOp { id: string; name: string; short: string; ns: number; kind: 'cpu' | 'memory' | 'network' | 'disk' }
/** Dr. Dean's 2010 latency numbers (Table 2-2), in nanoseconds. */
export const LATENCY: LatencyOp[] = [
  { id: 'l1', name: 'L1 cache reference', short: 'L1 cache', ns: 0.5, kind: 'cpu' },
  { id: 'branch', name: 'Branch mispredict', short: 'Branch mispredict', ns: 5, kind: 'cpu' },
  { id: 'l2', name: 'L2 cache reference', short: 'L2 cache', ns: 7, kind: 'cpu' },
  { id: 'mutex', name: 'Mutex lock/unlock', short: 'Mutex', ns: 100, kind: 'cpu' },
  { id: 'mem', name: 'Main memory reference', short: 'Memory ref', ns: 100, kind: 'memory' },
  { id: 'zippy', name: 'Compress 1 KB with a fast compressor', short: 'Compress 1 KB', ns: 10_000, kind: 'cpu' },
  { id: 'send2k', name: 'Send 2 KB over a 1 Gbps network', short: 'Send 2 KB', ns: 20_000, kind: 'network' },
  { id: 'mem1mb', name: 'Read 1 MB sequentially from memory', short: 'Read 1 MB (memory)', ns: 250_000, kind: 'memory' },
  { id: 'dc', name: 'Round trip within the same data center', short: 'Round trip in DC', ns: 500_000, kind: 'network' },
  { id: 'seek', name: 'Disk seek', short: 'Disk seek', ns: 10_000_000, kind: 'disk' },
  { id: 'net1mb', name: 'Read 1 MB sequentially from the network', short: 'Read 1 MB (network)', ns: 10_000_000, kind: 'network' },
  { id: 'disk1mb', name: 'Read 1 MB sequentially from disk', short: 'Read 1 MB (disk)', ns: 30_000_000, kind: 'disk' },
  { id: 'xregion', name: 'Send a packet California → Netherlands → California', short: 'CA → NL → CA', ns: 150_000_000, kind: 'network' },
];
export const latencyOf = (id: string) => LATENCY.find((l) => l.id === id)!;

/** "0.5 ns", "10 µs", "250 µs", "150 ms". */
export function formatNs(ns: number): string {
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(3))));
  if (ns < 1_000) return `${fmt(ns)} ns`;
  if (ns < 1_000_000) return `${fmt(ns / 1_000)} µs`;
  if (ns < 1_000_000_000) return `${fmt(ns / 1_000_000)} ms`;
  return `${fmt(ns / 1_000_000_000)} s`;
}

/** "If 1 ns were 1 second": the same duration scaled by 10^9, in human units. */
export function humanScaled(ns: number): string {
  const s = ns; // 1 ns -> 1 s
  const fmt = (v: number) => String(Number(v.toPrecision(2)));
  if (s < 60) return `${fmt(s)} s`;
  if (s < 3600) return `${fmt(s / 60)} min`;
  if (s < 86400) return `${fmt(s / 3600)} hours`;
  if (s < 86400 * 365) return `${fmt(s / 86400)} days`;
  return `${fmt(s / (86400 * 365.25))} years`;
}

/* ----------------------------- Availability ------------------------------ */
export const DAY_S = 86_400;
export const WEEK_S = 7 * DAY_S;
export const YEAR_S = 365.25 * DAY_S;
/** The book rounds a month to 30.44 days (365.25 / 12). */
export const MONTH_S = 30.44 * DAY_S;
export const NINES = [99, 99.9, 99.99, 99.999, 99.9999] as const;
export const PERIODS = [
  { id: 'day', label: 'per day', seconds: DAY_S },
  { id: 'week', label: 'per week', seconds: WEEK_S },
  { id: 'month', label: 'per month', seconds: MONTH_S },
  { id: 'year', label: 'per year', seconds: YEAR_S },
] as const;

/** Allowed downtime in seconds for an availability percentage over a period. */
export const downtimeSeconds = (availabilityPct: number, periodSeconds: number) => ((100 - availabilityPct) / 100) * periodSeconds;

/** Book-style formatting: "14.4 min", "8.77 h", "3.65 days", "864 ms". */
export function formatDuration(seconds: number): string {
  const p = (v: number) => String(Number(v.toPrecision(3)));
  if (seconds < 1) return `${p(seconds * 1000)} ms`;
  if (seconds < 60) return `${p(seconds)} s`;
  if (seconds < 3600) return `${p(seconds / 60)} min`;
  if (seconds < DAY_S) return `${p(seconds / 3600)} h`;
  return `${p(seconds / DAY_S)} days`;
}
export const ninesLabel = (pct: number) => `${pct}%`;

/* ------------------------ PixelPost napkin math (boss) -------------------- */
/** Assumptions for the boss estimate (our own numbers, shaped like the book's Twitter example). */
export const PIXELPOST = {
  mau: 10_000_000,
  dailyShare: 0.5,
  postsPerUser: 2,
  viewsPerUser: 50,
  photoShare: 0.4,
  photoMB: 2,
  years: 5,
  webRps: 1000,
} as const;
const P = PIXELPOST;
export const BOSS = {
  dau: P.mau * P.dailyShare, // 5,000,000
  postsPerDay: P.mau * P.dailyShare * P.postsPerUser, // 10,000,000
  postQps: (P.mau * P.dailyShare * P.postsPerUser) / DAY_S, // ~116
  readQps: (P.mau * P.dailyShare * P.viewsPerUser) / DAY_S, // ~2,894
  peakReadQps: (2 * P.mau * P.dailyShare * P.viewsPerUser) / DAY_S, // ~5,787
  servers: Math.ceil((2 * P.mau * P.dailyShare * P.viewsPerUser) / DAY_S / P.webRps), // 6
  storagePerDayTB: (P.mau * P.dailyShare * P.postsPerUser * P.photoShare * P.photoMB) / 1_000_000, // 8 TB
  fiveYearPB: ((P.mau * P.dailyShare * P.postsPerUser * P.photoShare * P.photoMB) / 1_000_000) * 365 * P.years / 1000, // 14.6 PB
} as const;
