import type { ArchGraph, QuizQuestion } from '@/types/content';

const shards4: ArchGraph = {
  nodes: [
    { id: 'web', kind: 'web', label: 'Web tier', x: 640, y: 120 },
    { id: 'shard0', kind: 'shard', label: 'Shard 0', x: 220, y: 450 },
    { id: 'shard1', kind: 'shard', label: 'Shard 1', x: 500, y: 450 },
    { id: 'shard2', kind: 'shard', label: 'Shard 2', x: 780, y: 450 },
    { id: 'shard3', kind: 'shard', label: 'Shard 3', x: 1060, y: 450 },
  ],
  edges: [
    { from: 'web', to: 'shard0', label: 'user_id % 4 = 0' },
    { from: 'web', to: 'shard1', label: '= 1' },
    { from: 'web', to: 'shard2', label: '= 2' },
    { from: 'web', to: 'shard3', label: '= 3' },
  ],
};

export const quiz: QuizQuestion[] = [
  {
    id: 'L12-q1',
    kind: 'numeric',
    prompt: 'PixelPost uses 4 shards and the hash function user_id % 4. Which shard stores user 1003?',
    answer: 3,
    tolerance: 0,
    unit: 'shard #',
    explanation: '1003 = 4 × 250 + 3, so 1003 % 4 = 3. The user lives on shard 3.',
    page: 29,
  },
  {
    id: 'L12-q2',
    kind: 'spot',
    prompt: 'Katy Perry is user 17, Justin Bieber is user 25 and Lady Gaga is user 33. With user_id % 4, click the shard that gets overwhelmed.',
    diagram: shards4,
    answers: ['shard1'],
    explanation: '17 % 4, 25 % 4 and 33 % 4 all equal 1. All three celebrities land on shard 1, which is flooded with reads: the celebrity (hotspot key) problem.',
    page: 31,
  },
  {
    id: 'L12-q3',
    kind: 'multi',
    prompt: 'Which are drawbacks of scaling a database vertically? Pick all that apply.',
    options: [
      'There are hardware limits: one server is not enough for a large user base',
      'A greater risk of a single point of failure',
      'High overall cost: powerful servers are much more expensive',
      'Joins become impossible',
      'Data must be split by a sharding key',
    ],
    answers: [0, 1, 2],
    explanation: 'The book lists hardware limits, greater SPOF risk and high cost. Join trouble and sharding keys are challenges of horizontal scaling (sharding).',
    page: 28,
  },
  {
    id: 'L12-q4',
    kind: 'bins',
    prompt: 'Sort each statement: vertical scaling (scale up) or horizontal scaling (sharding)?',
    bins: ['Vertical (scale up)', 'Horizontal (sharding)'],
    items: [
      { text: 'Add CPU, RAM and disk to the existing database server', bin: 0 },
      { text: 'Amazon RDS server with 24 TB of RAM', bin: 0 },
      { text: 'Stack Overflow 2013: 10M+ monthly visitors on 1 master', bin: 0 },
      { text: 'Same schema on every server, unique data on each', bin: 1 },
      { text: 'A hash function picks the server for each user', bin: 1 },
      { text: 'Needs resharding when one part fills up', bin: 1 },
    ],
    explanation: 'Scaling up makes one machine stronger (RDS 24 TB, Stack Overflow on one master). Sharding adds servers that share a schema but hold different data, chosen by a hash of the sharding key.',
    page: 29,
  },
  {
    id: 'L12-q5',
    kind: 'mcq',
    prompt: 'What is the most important factor when implementing a sharding strategy?',
    options: ['The choice of sharding key', 'The brand of the database servers', 'The number of web servers', 'The cache eviction policy'],
    answer: 0,
    explanation: 'The sharding (partition) key decides how data is distributed and how queries are routed. Pick one that spreads data evenly.',
    page: 30,
  },
  {
    id: 'L12-q6',
    kind: 'order',
    prompt: 'A shard is running out of space faster than the others. Put the resharding response in order.',
    items: [
      'Notice shard exhaustion: one shard fills up because data is uneven or growing fast',
      'Update the sharding function (e.g. more shards)',
      'Move data to the shard the new function points to',
      'Route queries with the new function',
    ],
    explanation: 'Resharding means updating the sharding function and moving data around. Consistent hashing (Chapter 5) is a common way to make this less painful.',
    page: 30,
  },
  {
    id: 'L12-q7',
    kind: 'truefalse',
    prompt: 'After sharding across multiple servers, join operations across shards are still easy.',
    answer: false,
    explanation: 'Joins across shards are hard. A common workaround is to de-normalize the database so queries can be answered from a single table.',
    page: 31,
  },
  {
    id: 'L12-q8',
    kind: 'mcq',
    prompt: 'In Figure 1-23, why is some functionality moved to a NoSQL data store?',
    options: [
      'To reduce the load on the (sharded) relational database',
      'Because NoSQL supports cross-shard joins',
      'To replace the cache',
      'Because sharding requires NoSQL',
    ],
    answer: 0,
    explanation: 'Non-relational functionality moves to a NoSQL store to reduce database load, while the relational data is sharded.',
    page: 32,
  },
];

export const cards = [
  { front: 'Vertical DB scaling: example and drawbacks?', back: 'RDS servers up to 24 TB RAM; Stack Overflow 2013 ran 10M+ monthly visitors on 1 master. Drawbacks: hardware limits, SPOF risk, high cost.' },
  { front: 'What is sharding?', back: 'Horizontal DB scaling: split a large database into smaller shards. Same schema on every shard, unique data on each.' },
  { front: 'What is a sharding (partition) key?', back: 'One or more columns that decide how data is distributed (e.g. user_id % 4). Choose one that spreads data evenly.' },
  { front: 'Three sharding challenges?', back: 'Resharding (shard full / shard exhaustion → new function + move data; consistent hashing helps), celebrity hotspot (dedicated shards), joins (de-normalize).' },
  { front: 'Which shard holds user 1003 with 4 shards?', back: '1003 % 4 = 3 → shard 3.' },
];
