import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 2: PixelPost has 1,000 users, and the Pager will not stop buzzing.'),
  c(5, 10, 'Everything still runs on one server: the web app and the database share it.'),
  c(10, 15, 'When traffic spikes, the web app eats the CPU and database queries slow down.'),
  c(15, 20, 'When the database works hard, page requests wait. They keep starving each other.'),
  c(20, 24, 'The fix: give each job its own server.'),
  c(24, 29, 'We split the system into two tiers: a web tier and a data tier.'),
  c(29, 34, 'The web tier handles web and mobile traffic. The data tier runs the database.'),
  c(34, 38, 'The web servers now send their queries to the database over the network.'),
  c(38, 43, 'The big win: each tier can now scale independently.'),
  c(43, 48, 'More visitors? Add web servers, and the database stays exactly as it is.'),
  c(48, 53, 'More data? Give the database server more power without touching the web tier.'),
  c(53, 58, 'Next question: what kind of database should the data tier run?'),
  c(58, 63, 'Option one: a relational database, also called an RDBMS or SQL database.'),
  c(63, 68, 'Relational databases store data in tables made of rows and columns.'),
  c(68, 73, 'Tables relate to each other. Every photo row stores the id of the user who owns it.'),
  c(73, 78, 'With SQL you can JOIN tables: "give me every photo that belongs to user 3".'),
  c(78, 84, "The join stitches rows together: mom's two cat pictures, with her username."),
  c(84, 90, 'Popular relational databases include MySQL, PostgreSQL and Oracle.'),
  c(90, 95, 'They have been around for over 40 years and have historically worked well.'),
  c(95, 100, 'For most developers, relational is the best option.'),
  c(100, 105, 'Option two: non-relational databases, better known as NoSQL.'),
  c(105, 110, 'NoSQL comes in four families. Key-value stores map a key straight to a value.'),
  c(110, 115, 'Graph stores keep nodes and the links between them, like who follows whom.'),
  c(115, 120, 'Column stores organise data by columns and handle huge, wide datasets.'),
  c(120, 125, 'Document stores save self-contained documents, often JSON-like.'),
  c(125, 129, 'Well-known NoSQL databases: CouchDB, Neo4j, Cassandra, HBase and Amazon DynamoDB.'),
  c(129, 135, 'One big difference: join operations are generally not supported in NoSQL.'),
  c(135, 140, 'So you shape the data around the questions your app will ask.'),
  c(140, 143, 'Checkpoint: can you name the four NoSQL families?'),
  c(143, 150, 'So when should you leave the relational default? Ravi has a short checklist.'),
  c(150, 156, 'One: your application needs super-low latency.'),
  c(156, 162, 'Two: your data is unstructured, or you have no relational data at all.'),
  c(162, 168, 'Three: you only need to serialize and deserialize data, such as JSON, XML or YAML.'),
  c(168, 174, 'Four: you need to store a massive amount of data.'),
  c(174, 180, 'If none of these apply, a relational database is usually the safe choice.'),
  c(180, 185, 'Tiers split, database chosen. On to 10,000 users!'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'web-tier',
    title: 'Web tier',
    body: 'The servers that handle web and mobile traffic. Because they are separate from the database, you can add or remove web servers as traffic changes without touching the data.',
  },
  {
    id: 'data-tier',
    title: 'Data tier',
    body: 'The database server(s). Splitting it from the web tier means each tier gets its own resources and the two can be scaled independently.',
  },
  {
    id: 'sql-join',
    title: 'Tables and joins',
    body: 'Relational databases (MySQL, PostgreSQL, Oracle...) store data in tables and rows. SQL lets you join rows from different tables, here users and photos linked by user_id.',
  },
  {
    id: 'nosql-families',
    title: 'Four NoSQL families',
    body: 'Non-relational databases fall into four groups: key-value stores, graph stores, column stores and document stores. Examples: CouchDB, Neo4j, Cassandra, HBase, Amazon DynamoDB. Joins are generally not supported.',
  },
  {
    id: 'nosql-fit',
    title: 'When NoSQL fits',
    body: 'Consider NoSQL if you need super-low latency, your data is unstructured or not relational, you only need to serialize/deserialize data (JSON, XML, YAML), or you must store a massive amount of data. Otherwise relational is usually the best default.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.sql - 2,
    question: {
      id: 'L02-cp1',
      kind: 'truefalse',
      prompt: 'Once the web tier and the data tier run on separate servers, they can be scaled independently.',
      answer: true,
      explanation: 'That is the whole point of the split: add web servers for traffic, or upgrade the database for data, one without the other.',
      page: 7,
    },
  },
  {
    at: T.fit - 2,
    question: {
      id: 'L02-cp2',
      kind: 'mcq',
      prompt: 'Which of these is NOT one of the four NoSQL families?',
      options: ['Key-value store', 'Graph store', 'Relational table store', 'Document store'],
      answer: 2,
      explanation: 'The four families are key-value, graph, column and document stores. Tables with joins are the relational (SQL) world.',
      page: 7,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'One CPU, two jobs' },
    { at: T.split, title: 'Split the tiers' },
    { at: T.sql, title: 'Relational databases' },
    { at: T.nosql, title: 'NoSQL: four families' },
    { at: T.fit, title: 'When NoSQL fits' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
