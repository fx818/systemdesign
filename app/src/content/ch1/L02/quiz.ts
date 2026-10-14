import type { ArchGraph, QuizQuestion } from '@/types/content';

const twoTiers: ArchGraph = {
  nodes: [
    { id: 'client', kind: 'client', label: 'Web browser', x: 160, y: 220 },
    { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 160, y: 500 },
    { id: 'dns', kind: 'dns', label: 'DNS', x: 520, y: 110 },
    { id: 'web', kind: 'web', label: 'Web server', x: 640, y: 380 },
    { id: 'db', kind: 'db', label: 'Database', x: 1060, y: 380 },
  ],
  edges: [
    { from: 'client', to: 'dns' },
    { from: 'mobile', to: 'dns' },
    { from: 'client', to: 'web', label: 'HTTP' },
    { from: 'mobile', to: 'web', label: 'HTTP' },
    { from: 'web', to: 'db', label: 'read / write' },
  ],
};

export const quiz: QuizQuestion[] = [
  {
    id: 'L02-q1',
    kind: 'mcq',
    prompt: 'Why move the database onto its own server, separate from web/mobile traffic?',
    options: [
      'So the web tier and data tier can be scaled independently',
      'Because databases cannot run on Linux web servers',
      'So that DNS can find the database directly',
      'To make SQL joins possible',
    ],
    answer: 0,
    explanation: 'Splitting into a web tier and a data tier gives each its own resources and lets them scale independently.',
    page: 7,
  },
  {
    id: 'L02-q2',
    kind: 'bins',
    prompt: 'Sort these databases: relational or non-relational?',
    bins: ['Relational (SQL)', 'Non-relational (NoSQL)'],
    items: [
      { text: 'MySQL', bin: 0 },
      { text: 'PostgreSQL', bin: 0 },
      { text: 'Oracle database', bin: 0 },
      { text: 'Cassandra', bin: 1 },
      { text: 'Neo4j', bin: 1 },
      { text: 'Amazon DynamoDB', bin: 1 },
      { text: 'CouchDB', bin: 1 },
      { text: 'HBase', bin: 1 },
    ],
    explanation: 'MySQL, Oracle and PostgreSQL are popular relational databases. CouchDB, Neo4j, Cassandra, HBase and DynamoDB are popular NoSQL databases.',
    page: 7,
  },
  {
    id: 'L02-q3',
    kind: 'multi',
    prompt: 'Which situations suggest a non-relational database might be the right choice? Pick all that apply.',
    options: [
      'Your application needs super-low latency',
      'Your data is unstructured or has no relations',
      'You need to join many tables in complex reports',
      'You only need to serialize and deserialize data (JSON, XML, YAML)',
      'You need to store a massive amount of data',
    ],
    answers: [0, 1, 3, 4],
    explanation: 'The four cases are super-low latency, unstructured or non-relational data, serialize/deserialize only, and massive data. Joins point the other way: NoSQL generally does not support them.',
    page: 8,
  },
  {
    id: 'L02-q4',
    kind: 'truefalse',
    prompt: 'Join operations are generally supported in non-relational (NoSQL) databases.',
    answer: false,
    explanation: 'Joins are a relational feature. In non-relational databases they are generally not supported.',
    page: 7,
  },
  {
    id: 'L02-q5',
    kind: 'order',
    prompt: 'After the split, put a mobile request for a user profile in order.',
    items: [
      'The mobile app resolves api.pixelpost.com via DNS',
      'The app sends an HTTP request to the web tier',
      'The web server queries the database in the data tier',
      'The web server returns JSON to the app',
    ],
    explanation: 'The flow from Level 1 still holds. The only change is that the web server now reaches a separate database server for data.',
    page: 7,
  },
  {
    id: 'L02-q6',
    kind: 'spot',
    prompt: 'Click the component that belongs to the data tier.',
    diagram: twoTiers,
    answers: ['db'],
    explanation: 'The database server is the data tier. The web server handling web/mobile traffic is the web tier.',
    page: 7,
  },
  {
    id: 'L02-q7',
    kind: 'mcq',
    prompt: 'Which list contains exactly the four NoSQL families?',
    options: [
      'Key-value, graph, column, document',
      'Table, row, column, index',
      'Key-value, relational, cache, queue',
      'Master, slave, replica, shard',
    ],
    answer: 0,
    explanation: 'Non-relational databases are grouped into key-value stores, graph stores, column stores and document stores.',
    page: 7,
  },
  {
    id: 'L02-q8',
    kind: 'truefalse',
    prompt: 'For most developers, a relational database is the best option.',
    answer: true,
    explanation: 'Relational databases have been around for over 40 years and have historically worked well. Explore NoSQL only when they do not suit your use case.',
    page: 8,
  },
];

export const cards = [
  { front: 'Why split web tier and data tier?', back: 'Separate servers for web/mobile traffic and for the database let each tier scale independently.' },
  { front: 'Relational database in one line?', back: 'RDBMS / SQL database (MySQL, PostgreSQL, Oracle). Tables and rows, with SQL joins across tables.' },
  { front: 'The four NoSQL families?', back: 'Key-value, graph, column and document stores. Joins are generally not supported.' },
  { front: 'When might NoSQL fit?', back: 'Super-low latency; unstructured or non-relational data; only serialize/deserialize (JSON, XML, YAML); massive amounts of data.' },
  { front: 'Default database choice?', back: 'Relational, for most developers. 40+ years of working well. Explore NoSQL only when relational does not suit the use case.' },
];
