import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 12: 8 million users. The master database disk is at 95% and climbing every day.'),
  c(5, 10, 'As data grows, a single database gets more and more overloaded.'),
  c(10, 15, 'There are two broad ways to scale a database: vertical scaling and horizontal scaling.'),
  c(15, 20, 'Vertical scaling, or scaling up, adds more power to the existing machine: CPU, RAM, disk.'),
  c(20, 25, 'Some database servers are enormous: Amazon RDS offers one with 24 TB of RAM.'),
  c(25, 30, 'A server like that can store and handle a lot of data.'),
  c(30, 36, 'Real example: in 2013, stackoverflow.com had over 10 million monthly unique visitors...'),
  c(36, 41, '...and only one master database.'),
  c(41, 46, 'But vertical scaling has serious drawbacks. First: hardware limits.'),
  c(46, 51, 'You can keep adding CPU and RAM, but with a large user base one server is not enough.'),
  c(51, 55, 'Second: a greater risk of a single point of failure.'),
  c(55, 58, 'Third: high cost. Powerful servers are much more expensive.'),
  c(58, 63, 'Horizontal scaling, also known as sharding, is the practice of adding more servers.'),
  c(63, 68, 'Sharding separates a large database into smaller, more easily managed parts called shards.'),
  c(68, 73, 'Every shard shares the same schema...'),
  c(73, 78, '...but the actual data on each shard is unique to that shard.'),
  c(78, 83, 'Which shard holds a user? A hash function decides. Here it is user_id % 4.'),
  c(83, 88, 'If user_id % 4 equals 0, shard 0 stores and serves the data.'),
  c(88, 93, 'A result of 1 means shard 1, and so on. User 1003: 1003 % 4 = 3, so shard 3.'),
  c(93, 98, 'Every time you access data, the same function finds the right shard.'),
  c(98, 103, 'The most important factor in a sharding strategy is the choice of sharding key.'),
  c(103, 108, 'The sharding key, also called a partition key, is one or more columns that decide how data is distributed.'),
  c(108, 113, 'Here user_id is the sharding key. It routes each query to the correct database.'),
  c(113, 118, 'So retrieving and modifying data stays efficient: one query, one shard.'),
  c(118, 123, 'One of the most important criteria: choose a key that distributes data evenly.'),
  c(123, 128, 'Shard by country instead, and one shard swells while others sit nearly empty.'),
  c(128, 133, 'Sharding is a great technique, but far from perfect. Challenge one: resharding data.'),
  c(133, 138, 'Resharding is needed when a single shard can no longer hold more data because of rapid growth...'),
  c(138, 142, '...or when uneven data makes some shards fill up faster: shard exhaustion.'),
  c(142, 147, 'Then you update the sharding function and move data around. Consistent hashing, in Chapter 5, helps.'),
  c(147, 152, 'Challenge two: the celebrity problem, also called the hotspot key problem.'),
  c(152, 157, 'Imagine Katy Perry, Justin Bieber and Lady Gaga all ending up on the same shard.'),
  c(157, 162, 'That shard is overwhelmed with reads. One fix: give each celebrity a shard of their own.'),
  c(162, 166, 'A celebrity shard might even need to be partitioned further.'),
  c(166, 171, 'Challenge three: once data is spread across servers, joins across shards are hard.'),
  c(171, 176, 'A common workaround is to de-normalize, so queries can be performed in a single table.'),
  c(176, 181, 'Figure 1-23: the databases are sharded to keep up with rapidly growing data traffic.'),
  c(181, 186, 'Some non-relational functionality moves into a NoSQL data store to reduce database load.'),
  c(186, 190, 'PixelPost now handles 8 million users. Next up: launch night.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'vertical-limits',
    title: 'Why not just scale up?',
    body: 'Vertical scaling adds CPU, RAM and disk to one server (Amazon RDS offers 24 TB of RAM; Stack Overflow in 2013 ran 10M+ monthly visitors on 1 master). Drawbacks: hardware limits, greater single-point-of-failure risk, and high cost.',
  },
  {
    id: 'hash-fn',
    title: 'The hash function',
    body: 'Every read or write runs user_id % 4 to find the shard: result 0 → shard 0, 1 → shard 1, and so on. Each shard has the same schema but its own unique rows.',
  },
  {
    id: 'shard-key',
    title: 'Sharding (partition) key',
    body: 'One or more columns that decide how data is distributed, here user_id. It lets you route each query to the correct database. Choose a key that spreads data evenly.',
  },
  {
    id: 'celebrity',
    title: 'Hotspot keys',
    body: 'If several celebrities land on one shard, it is overwhelmed with reads. Allocate a shard per celebrity; a celebrity shard may even need further partitioning.',
  },
  {
    id: 'fig-1-23',
    title: 'Figure 1-23',
    body: 'The data tier is sharded to support rapidly growing data traffic, and some non-relational functionality moves to a NoSQL store to reduce database load.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.key - 1,
    question: {
      id: 'L12-cp1',
      kind: 'numeric',
      prompt: 'With 4 shards and the hash function user_id % 4, which shard stores user 2026?',
      answer: 2,
      tolerance: 0,
      unit: 'shard #',
      explanation: '2026 = 4 × 506 + 2, so 2026 % 4 = 2: shard 2.',
      page: 29,
    },
  },
  {
    at: T.fig - 1,
    question: {
      id: 'L12-cp2',
      kind: 'mcq',
      prompt: 'Three celebrities all land on shard 1, and it melts under read traffic. What does the book suggest?',
      options: ['Allocate a shard for each celebrity', 'Delete the celebrity accounts', 'Switch to vertical scaling', 'Turn off the hash function'],
      answer: 0,
      explanation: 'Give each celebrity their own shard, and partition a celebrity shard further if needed.',
      page: 31,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'Disk at 95%' },
    { at: T.vertical, title: 'Vertical scaling' },
    { at: T.sharding, title: 'Sharding' },
    { at: T.key, title: 'The sharding key' },
    { at: T.reshard, title: 'Resharding' },
    { at: T.celeb, title: 'Celebrity problem' },
    { at: T.joins, title: 'Joins & de-normalization' },
    { at: T.fig, title: 'Figure 1-23' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
