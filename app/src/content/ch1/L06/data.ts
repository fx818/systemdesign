/** Shared data for Level 6 (scene, quiz and mini-games). */

export const MEMCACHED_CODE = `SECONDS = 1
cache.set('myKey', 'hi there', 3600 * SECONDS)
cache.get('myKey')`;

/* --------------------------------- Evict! --------------------------------- */
export type Policy = 'LRU' | 'LFU' | 'FIFO';
export const CACHE_SLOTS = 4;

export interface EvictRound {
  policy: Policy;
  blurb: string;
  /** Keys accessed in order. */
  stream: string[];
}

export const EVICT_ROUNDS: EvictRound[] = [
  {
    policy: 'LRU',
    blurb: 'Least Recently Used: throw out the key that has gone unused the longest. The most popular policy.',
    stream: ['cat', 'dog', 'sun', 'sea', 'cat', 'dog', 'owl', 'cat', 'fox', 'sun', 'dog'],
  },
  {
    policy: 'LFU',
    blurb: 'Least Frequently Used: throw out the key with the fewest hits (ties: the least recently used one).',
    stream: ['cat', 'cat', 'dog', 'sun', 'sun', 'sea', 'cat', 'owl', 'sea', 'fox', 'dog'],
  },
  {
    policy: 'FIFO',
    blurb: 'First In, First Out: throw out the key that entered the cache first, no matter how popular.',
    stream: ['cat', 'dog', 'sun', 'sea', 'cat', 'cat', 'owl', 'cat', 'fox', 'dog'],
  },
];

export const KEY_EMOJI: Record<string, string> = { cat: '🐱', dog: '🐶', sun: '🌅', sea: '🌊', owl: '🦉', fox: '🦊' };

/* ----------------------------- TTL Goldilocks ----------------------------- */
export const TTL_OPTIONS = ['10 seconds', '5 minutes', '1 hour', '1 day', '1 week'] as const;

export interface TtlItem {
  id: string;
  name: string;
  emoji: string;
  detail: string;
  /** Index into TTL_OPTIONS that fits best. */
  best: number;
  /** Other acceptable answers (half credit). */
  ok: number[];
  /** How often it changes, 0 (never) .. 1 (constantly): drives the staleness meter. */
  churn: number;
  /** How often it is read, 0..1: drives the DB-load meter. */
  reads: number;
  why: string;
}

export const TTL_ITEMS: TtlItem[] = [
  {
    id: 'avatar', name: 'Profile picture URL', emoji: '🖼️', detail: 'Shown next to every post. People change it maybe twice a year.',
    best: 3, ok: [2, 4], churn: 0.1, reads: 0.9,
    why: 'Read constantly, changed rarely: the perfect cache candidate. A long TTL saves tons of DB reads, and a day-old avatar hurts nobody.',
  },
  {
    id: 'likes', name: 'Like counter', emoji: '❤️', detail: 'Changes every few seconds on a popular photo. Users expect it to feel live.',
    best: 0, ok: [1], churn: 0.9, reads: 1,
    why: 'It changes constantly, so a long TTL shows stale numbers. A very short TTL still absorbs the read storm without going too stale.',
  },
  {
    id: 'tos', name: 'Terms of service page', emoji: '📜', detail: 'Updated once a year by the lawyers.',
    best: 4, ok: [3], churn: 0.02, reads: 0.3,
    why: 'Almost never changes. Cache it for a long time; a too-short TTL just reloads the same text from the database again and again.',
  },
  {
    id: 'feed', name: 'Trending photos list', emoji: '🔥', detail: 'Recomputed by a job every few minutes; the home page reads it on every visit.',
    best: 1, ok: [0, 2], churn: 0.5, reads: 1,
    why: 'It only changes every few minutes, so a TTL in that range is just right: fresh enough, and the DB is spared.',
  },
  {
    id: 'balance', name: 'Pro credits balance', emoji: '💳', detail: 'Changes when the user buys or spends credits. Must be accurate at checkout.',
    best: 0, ok: [], churn: 0.7, reads: 0.4,
    why: 'Money must be right. Keep the TTL tiny (or read from the database at checkout): consistency matters more than speed here.',
  },
];
