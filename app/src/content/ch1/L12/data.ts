/** Shared data for Level 12 (scene, quiz and mini-games). */

/** The book's hash function: user_id % n picks the shard (Figure 1-21). */
export const shardOf = (userId: number, shards: number) => ((userId % shards) + shards) % shards;

/** Users table rows from the Figure 1-22 idea: ids 0..15 spread over 4 shards. */
export const USERS: { id: number; name: string }[] = [
  { id: 0, name: 'maya' }, { id: 1, name: 'ravi' }, { id: 2, name: 'mom' }, { id: 3, name: 'you' },
  { id: 4, name: 'zoe' }, { id: 5, name: 'arjun' }, { id: 6, name: 'li' }, { id: 7, name: 'sam' },
  { id: 8, name: 'noor' }, { id: 9, name: 'kai' }, { id: 10, name: 'ana' }, { id: 11, name: 'ben' },
  { id: 12, name: 'ivy' }, { id: 13, name: 'omar' }, { id: 14, name: 'yuki' }, { id: 15, name: 'leo' },
];

/** Celebrity accounts that all hash to the same shard (17 % 4 = 25 % 4 = 33 % 4 = 1). */
export const CELEBS = [
  { id: 17, name: 'Katy Perry' },
  { id: 25, name: 'Justin Bieber' },
  { id: 33, name: 'Lady Gaga' },
];

/** How many of ids 0..n-1 change shard when going from `a` to `b` shards (resharding pain). */
export function movedWhenResharding(ids: number[], a: number, b: number): number {
  return ids.filter((id) => shardOf(id, a) !== shardOf(id, b)).length;
}

/* ------------------------------ Pick the Key ------------------------------ */
export interface KeyOption {
  id: string;
  key: string;
  /** Share of rows (or traffic) per shard, sums to ~1. */
  dist: number[];
  verdict: string;
}
export interface KeyScenario {
  id: string;
  title: string;
  story: string;
  options: KeyOption[];
  best: string;
}

export const KEY_SCENARIOS: KeyScenario[] = [
  {
    id: 'users',
    title: 'The users table',
    story: '8 million PixelPost accounts must be spread over 4 shards. Every request already knows the user_id.',
    best: 'user_id',
    options: [
      { id: 'user_id', key: 'user_id % 4', dist: [0.25, 0.25, 0.25, 0.25], verdict: 'Even spread, and every query can be routed straight to one shard. This is the book\'s example key.' },
      { id: 'country', key: 'country', dist: [0.58, 0.24, 0.12, 0.06], verdict: 'Most users live in a couple of countries, so one shard holds more than half of everything.' },
      { id: 'signup', key: 'signup year', dist: [0.06, 0.12, 0.26, 0.56], verdict: 'The newest-year shard gets all the fresh sign-ups and fills up first: shard exhaustion.' },
      { id: 'letter', key: 'first letter of name', dist: [0.41, 0.27, 0.2, 0.12], verdict: 'Names are not spread evenly over the alphabet, so the "A-F" shard runs hot.' },
    ],
  },
  {
    id: 'photos',
    title: 'The photos table',
    story: 'Billions of photos. The feed shows "all photos of user X" and every photo row has an owner_id.',
    best: 'owner',
    options: [
      { id: 'month', key: 'upload month', dist: [0.04, 0.06, 0.1, 0.8], verdict: 'Every new upload lands on the current month\'s shard. One shard takes all the writes.' },
      { id: 'owner', key: 'owner user_id % 4', dist: [0.26, 0.25, 0.24, 0.25], verdict: 'Even, and all of a user\'s photos sit on one shard, so "photos of user X" hits a single server.' },
      { id: 'camera', key: 'camera brand', dist: [0.52, 0.3, 0.12, 0.06], verdict: 'Two phone brands dominate. Very uneven.' },
      { id: 'filter', key: 'filter name', dist: [0.64, 0.18, 0.1, 0.08], verdict: 'Most photos use "none" or one popular filter. One shard gets most rows.' },
    ],
  },
  {
    id: 'likes',
    title: 'Like events (read heavy)',
    story: 'Users read like counts all day. Celebrities get millions of reads. You want reads spread out.',
    best: 'photo',
    options: [
      { id: 'region', key: 'liker region', dist: [0.5, 0.3, 0.15, 0.05], verdict: 'Traffic follows time zones and population. Uneven.' },
      { id: 'hour', key: 'hour of day', dist: [0.1, 0.15, 0.3, 0.45], verdict: 'Evening hours dominate, so one shard melts every night.' },
      { id: 'celeb', key: 'is_celebrity flag', dist: [0.82, 0.18, 0, 0], verdict: 'Two values for four shards, and the celebrity value is the hottest key of all.' },
      { id: 'photo', key: 'photo_id % 4', dist: [0.25, 0.26, 0.24, 0.25], verdict: 'Spreads evenly. A single viral celebrity photo can still be hot: give it a dedicated shard or cache it.' },
    ],
  },
];

/* ------------------------------ Shard Router ------------------------------ */
/** Deterministic id streams for the two rounds of the Shard Router (round 2 uses 5 shards). */
export const ROUTER_ROUNDS: { shards: number; ids: number[] }[] = [
  { shards: 4, ids: [1003, 42, 517, 2024, 77, 1336, 905, 64] },
  { shards: 5, ids: [1003, 42, 517, 2024, 77, 1336, 905, 64] },
];
