import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 6: 300,000 users, and the feed takes 2.4 seconds to load.'),
  c(5, 10, 'Every time a page loads, the web servers run one or more database calls.'),
  c(10, 14, 'Calling the database again and again for the same data drags performance down.'),
  c(14, 18, 'The reviews are brutal. Time for a cache.'),
  c(18, 23, 'A cache is a temporary storage area kept in memory.'),
  c(23, 28, 'It stores the results of expensive responses, or data that is accessed often.'),
  c(28, 31, 'So the next request for the same data is served much faster.'),
  c(31, 36, 'The cache tier is a temporary data layer, much faster than the database.'),
  c(36, 40, 'A separate cache tier gives better performance and reduces the database workload.'),
  c(40, 44, 'And you can scale the cache tier independently, by adding cache servers.'),
  c(44, 49, 'How does a web server use it? A request for photo 7 arrives. First, check the cache.'),
  c(49, 54, 'Miss! The cache does not have it, so the web server queries the database...'),
  c(54, 59, '...stores the response in the cache, and sends it back to the user.'),
  c(59, 64, 'The next request for photo 7: check the cache. Hit! Returned straight from memory.'),
  c(64, 70, 'This strategy is called a read-through cache. Other strategies exist for other access patterns.'),
  c(70, 76, 'With most reads served from memory, database load drops and p95 falls to 120 ms.'),
  c(76, 82, 'Talking to a cache is simple: most cache servers offer APIs for common languages.'),
  c(82, 88, "With Memcached-style APIs, set stores 'hi there' under myKey, with a 3,600-second expiry."),
  c(88, 94, 'And get reads it back, for as long as the entry has not expired.'),
  c(94, 99, 'Consideration one: when to use a cache. When data is read frequently but modified infrequently.'),
  c(99, 103, 'But cached data lives in volatile memory. If the cache server restarts, it is all gone.'),
  c(103, 106, 'So important data must be saved in a persistent data store.'),
  c(106, 110, 'Consideration two: an expiration policy. Expired data is removed from the cache.'),
  c(110, 113, 'Too short, and the system reloads data from the database far too often.'),
  c(113, 117, 'Too long, and the data becomes stale.'),
  c(117, 120, 'Without any expiration, data would stay in memory forever. Pick something in between.'),
  c(120, 124, 'Consideration three: consistency. The data store and the cache must stay in sync.'),
  c(124, 128, 'They can drift, because updating the store and the cache is not a single transaction.'),
  c(128, 134, 'Across multiple regions this gets even harder. Facebook wrote a whole paper about it.'),
  c(134, 138, 'Consideration four: mitigating failures.'),
  c(138, 142, 'A single point of failure is a part that stops the entire system when it fails. One cache server is one.'),
  c(142, 146, 'The fix: multiple cache servers across different data centers.'),
  c(146, 150, 'Also overprovision memory by a certain percentage, as a buffer while usage grows.'),
  c(150, 154, 'Consideration five: the eviction policy.'),
  c(154, 159, 'Our cache has four slots, and they are all full. A was just used again.'),
  c(159, 163, 'E arrives. Adding it means removing an existing item. That is cache eviction.'),
  c(163, 167, 'Least recently used, LRU, is the most popular policy. B has waited longest, so B goes.'),
  c(167, 171, 'Least frequently used (LFU) and first in, first out (FIFO) fit other use cases.'),
  c(171, 176, 'Feed loads fast, the database can breathe. 300,000 happy users.'),
  c(176, 182, 'But the photos themselves still travel a long way to reach Europe. Next: the CDN.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'cache-tier',
    title: 'Cache tier',
    body: 'A temporary data store layer, much faster than the database. A separate cache tier means better performance, less database workload, and the ability to scale the cache independently.',
  },
  {
    id: 'read-through',
    title: 'Read-through cache',
    body: 'The web server first checks the cache. If the response is there, it returns it. If not, it queries the database, stores the response in the cache and sends it back.',
  },
  {
    id: 'ttl',
    title: 'Expiration (TTL)',
    body: 'Expired data is removed from the cache. Too short an expiry makes the system reload from the database too often; too long and the data becomes stale.',
  },
  {
    id: 'spof',
    title: 'Single point of failure',
    body: 'A SPOF is a part of a system that, if it fails, stops the entire system from working. Avoid it with multiple cache servers across data centers, and overprovision memory as a buffer.',
  },
  {
    id: 'eviction',
    title: 'Eviction',
    body: 'When the cache is full, adding an item may remove an existing one. LRU (least recently used) is the most popular policy; LFU (least frequently used) and FIFO (first in, first out) suit other cases.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.api - 2,
    question: {
      id: 'L06-cp1',
      kind: 'order',
      prompt: 'Put the read-through cache steps in order (for a cache miss).',
      items: [
        'The web server receives a request',
        'It checks whether the cache has the response',
        'Miss: it queries the database',
        'It stores the response in the cache',
        'It sends the data back to the client',
      ],
      explanation: 'Check the cache first; on a miss, query the database, store the result in the cache, then return it.',
      page: 15,
    },
  },
  {
    at: T.evict - 2,
    question: {
      id: 'L06-cp2',
      kind: 'mcq',
      prompt: 'What is a single point of failure (SPOF)?',
      options: [
        'A part of a system that, if it fails, stops the entire system from working',
        'The slowest component in the system',
        'A server that only handles failed requests',
        'The first item evicted from a cache',
      ],
      answer: 0,
      explanation: 'A SPOF is a part whose failure stops the entire system. One cache server can be one; use several across data centers.',
      page: 16,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'The slow feed' },
    { at: T.tier, title: 'The cache tier' },
    { at: T.flow, title: 'Read-through' },
    { at: T.api, title: 'Cache API' },
    { at: T.use, title: 'When to cache' },
    { at: T.ttl, title: 'Expiration' },
    { at: T.consistency, title: 'Consistency' },
    { at: T.spof, title: 'Failures' },
    { at: T.evict, title: 'Eviction' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
