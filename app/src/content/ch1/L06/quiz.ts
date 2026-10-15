import type { ArchGraph, QuizQuestion } from '@/types/content';

const oneCache: ArchGraph = {
  nodes: [
    { id: 'lb', kind: 'lb', label: 'Load balancer', x: 150, y: 360 },
    { id: 'web1', kind: 'web', label: 'Server 1', x: 420, y: 220 },
    { id: 'web2', kind: 'web', label: 'Server 2', x: 420, y: 500 },
    { id: 'cache', kind: 'cache', label: 'Cache', x: 760, y: 360 },
    { id: 'master', kind: 'db', label: 'Master', x: 1080, y: 200 },
    { id: 'replica', kind: 'db-replica', label: 'Replica', x: 1080, y: 520 },
  ],
  edges: [
    { from: 'lb', to: 'web1' },
    { from: 'lb', to: 'web2' },
    { from: 'web1', to: 'cache' },
    { from: 'web2', to: 'cache' },
    { from: 'cache', to: 'master' },
    { from: 'cache', to: 'replica' },
    { from: 'master', to: 'replica' },
  ],
};

export const quiz: QuizQuestion[] = [
  {
    id: 'L06-q1',
    kind: 'order',
    prompt: 'A request arrives and the data is not cached yet. Order the read-through cache steps.',
    items: [
      'Check the cache for the response',
      'Cache miss: query the database',
      'Store the response in the cache',
      'Send the data back to the client',
    ],
    explanation: 'Read-through: check the cache first; on a miss query the database, store the response in the cache and return it.',
    page: 15,
  },
  {
    id: 'L06-q2',
    kind: 'multi',
    prompt: 'Which are benefits of a separate cache tier? Pick all that apply.',
    options: ['Better system performance', 'Reduced database workload', 'The cache tier can scale independently', 'Data survives a server restart', 'Data is always perfectly consistent'],
    answers: [0, 1, 2],
    explanation: 'A cache tier speeds things up, takes load off the database and scales on its own. It is volatile memory, though, and keeping it consistent with the database is hard.',
    page: 15,
  },
  {
    id: 'L06-q3',
    kind: 'bins',
    prompt: 'Good candidate for caching, or not?',
    bins: ['Cache it', 'Do not rely on the cache'],
    items: [
      { text: 'Avatars read millions of times, changed rarely', bin: 0 },
      { text: 'The home feed shown on every visit', bin: 0 },
      { text: 'Terms of service page', bin: 0 },
      { text: 'The only copy of a user\'s uploaded photo', bin: 1 },
      { text: 'Payment records you must never lose', bin: 1 },
    ],
    explanation: 'Cache data that is read frequently and modified infrequently. Cache memory is volatile, so important data belongs in a persistent store.',
    page: 15,
  },
  {
    id: 'L06-q4',
    kind: 'mcq',
    prompt: 'What happens if the cache expiration time is set too short?',
    options: [
      'The system reloads data from the database too frequently',
      'Users see stale data',
      'The cache server runs out of disk',
      'The load balancer stops working',
    ],
    answer: 0,
    explanation: 'Too short: frequent reloads from the database. Too long: stale data.',
    page: 15,
  },
  {
    id: 'L06-q5',
    kind: 'spot',
    prompt: 'Find the single point of failure in this cache setup. Click it.',
    diagram: oneCache,
    answers: ['cache'],
    explanation: 'There is exactly one cache server. Multiple cache servers across data centers are recommended to avoid a SPOF.',
    page: 16,
  },
  {
    id: 'L06-q6',
    kind: 'truefalse',
    prompt: 'Updating the database and the cache always happens in a single transaction, so they never get out of sync.',
    answer: false,
    explanation: 'They are not in a single transaction, so inconsistency can happen, and it is even harder to manage across regions.',
    page: 16,
  },
  {
    id: 'L06-q7',
    kind: 'mcq',
    prompt: 'A 3-slot LRU cache holds A, B, C. The requests are: A, C, then D. Which key is evicted when D arrives?',
    options: ['A', 'B', 'C', 'D is not cached'],
    answer: 1,
    explanation: 'A and C were just used, so B is the least recently used and gets evicted.',
    page: 16,
  },
  {
    id: 'L06-q8',
    kind: 'numeric',
    prompt: 'PixelPost serves 10,000 reads/sec and the cache hit rate is 90%. How many reads/sec still reach the database?',
    answer: 1000,
    unit: 'reads/s',
    explanation: 'Only misses go to the database: 10% of 10,000 = 1,000 reads/sec. That is the "reduce database workload" benefit.',
    page: 15,
  },
];

export const cards = [
  { front: 'What is a cache?', back: 'Temporary in-memory storage for the results of expensive responses or frequently accessed data, so later requests are faster.' },
  { front: 'Read-through cache?', back: 'Check the cache. Hit: return it. Miss: query the DB, store the response in the cache, return it.' },
  { front: 'When to use a cache (and when not)?', back: 'Data read frequently, modified infrequently. Memory is volatile: persist important data in a durable store.' },
  { front: 'TTL too short vs too long?', back: 'Too short: constant reloads from the database. Too long: stale data.' },
  { front: 'Cache SPOF and eviction?', back: 'Use multiple cache servers across data centers and overprovision memory. When full, evict: LRU (most popular), LFU or FIFO.' },
];
