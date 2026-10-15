import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 5: 100,000 users. Then, at 2 a.m., the database hiccups.'),
  c(5, 10, 'There is one database. When it stops, every web server stops with it.'),
  c(10, 14, 'Maya is not worried about uptime. She is worried about the photos.'),
  c(14, 18, "Ravi's answer: never keep just one copy of your data."),
  c(18, 23, 'Database replication: keep copies of the database on several servers.'),
  c(23, 28, 'The book describes a master/slave relationship: the original is the master, the copies are slaves.'),
  c(28, 33, "In PixelPost we call them the primary and its replicas. Same idea."),
  c(33, 38, 'A master database generally supports only write operations.'),
  c(38, 43, 'Replicas get copies of the data from the master, and they only support reads.'),
  c(43, 48, 'Every data-modifying command, INSERT, UPDATE or DELETE, must be sent to the master.'),
  c(48, 53, 'Most apps read far more than they write. Scrolling a feed is all reads.'),
  c(53, 58, 'So a system usually has many more replicas than masters.'),
  c(58, 63, 'Why bother? Advantage one: better performance.'),
  c(63, 68, 'Writes happen on the master while reads spread across replicas, so more queries run in parallel.'),
  c(68, 73, 'Advantage two: reliability. Our copies live in different cities.'),
  c(73, 78, 'A typhoon or an earthquake destroys one database server...'),
  c(78, 83, '...but no data is lost, because it is replicated across multiple locations.'),
  c(83, 88, 'Advantage three: high availability. The site keeps running even if a database is offline.'),
  c(88, 92, 'You simply access the data stored on another database server.'),
  c(92, 97, "Let's break things on purpose. What if a database goes offline?"),
  c(97, 102, 'Case one: there is only one replica, and it goes offline.'),
  c(102, 108, 'Reads are sent to the master temporarily. A new replica soon replaces the old one.'),
  c(108, 113, 'Case two: there are several replicas, and one of them fails.'),
  c(113, 118, 'Reads are redirected to the other healthy replicas, and a new server replaces the broken one.'),
  c(118, 123, 'Case three, the scary one: the master goes offline. Writes have nowhere to go.'),
  c(123, 128, 'A replica is promoted to be the new master. All database operations temporarily run on it.'),
  c(128, 133, 'A new replica immediately replaces the old one, so replication continues.'),
  c(133, 137, "Catch: the replica's data might not be up to date. Data recovery scripts add what is missing."),
  c(137, 140, 'Multi-master and circular replication exist, but they are more complicated.'),
  c(140, 145, 'Now the full picture: load balancer and replication together.'),
  c(145, 150, "One: the user gets the load balancer's IP address from DNS."),
  c(150, 155, 'Two: the user connects to the load balancer with that IP.'),
  c(155, 160, 'Three: the HTTP request is routed to either server 1 or server 2.'),
  c(160, 165, 'Four: the web server reads user data from a replica.'),
  c(165, 170, 'Five: any data-modifying operation, a write, update or delete, goes to the master.'),
  c(170, 175, 'Both the web tier and the data tier are redundant now. 100,000 users!'),
  c(175, 180, 'Next: making every page faster with a cache.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'master',
    title: 'Master (primary)',
    body: 'The master database generally supports only write operations. Every data-modifying command (insert, update, delete) must be sent to it. Its data is copied to the replicas.',
  },
  {
    id: 'replicas',
    title: 'Replicas (slaves)',
    body: 'Replicas get copies of the data from the master and only support read operations. Because apps read much more than they write, systems usually have more replicas than masters.',
  },
  {
    id: 'advantages',
    title: 'Why replicate?',
    body: 'Better performance (reads run in parallel on replicas), reliability (data survives a destroyed server because it is copied to multiple locations) and high availability (the site keeps working when one database is offline).',
  },
  {
    id: 'promotion',
    title: 'Promoting a replica',
    body: 'If the master goes offline, a replica is promoted to be the new master and a new replica replaces the old one. In production this is tricky: the replica may be behind, so data recovery scripts fill in the missing data. Multi-master and circular replication are more complicated alternatives.',
  },
  {
    id: 'full-flow',
    title: 'The full request flow',
    body: 'DNS gives the user the load balancer IP; the user connects to the load balancer; the request goes to server 1 or 2; the server reads from a replica; writes, updates and deletes go to the master.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.why - 2,
    question: {
      id: 'L05-cp1',
      kind: 'truefalse',
      prompt: 'An UPDATE statement may be sent to a replica (slave) database.',
      answer: false,
      explanation: 'All data-modifying commands (insert, delete, update) must be sent to the master. Replicas only support reads.',
      page: 12,
    },
  },
  {
    at: T.flow - 2,
    question: {
      id: 'L05-cp2',
      kind: 'mcq',
      prompt: 'The master database goes offline. What happens?',
      options: [
        'A replica is promoted to be the new master',
        'All reads and writes fail until the master is repaired',
        'The load balancer becomes the database',
        'Writes are split evenly across all replicas',
      ],
      answer: 0,
      explanation: 'A replica is promoted to master and handles operations temporarily, while a new replica replaces the old one. Its data may need recovery scripts if it was behind.',
      page: 13,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'One database down' },
    { at: T.roles, title: 'Master and replicas' },
    { at: T.why, title: 'Why replicate' },
    { at: T.failures, title: 'When databases fail' },
    { at: T.flow, title: 'The full picture' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
