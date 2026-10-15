import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 2. The scope is agreed. Step 2: propose a high-level design and get buy-in.'),
  c(5, 10, 'The goal: develop a high-level design and reach agreement with the interviewer on it.'),
  c(10, 14, 'Ravi\'s tip: collaborate with the interviewer during the whole process.'),
  c(14, 18, 'Many good interviewers love to talk and get involved. Let them.'),
  c(18, 23, 'Start by coming up with an initial blueprint for the design.'),
  c(23, 28, 'Then ask for feedback. Treat your interviewer as a teammate and work together.'),
  c(28, 33, 'Maya asks where mobile users connect. You add them to the sketch together.'),
  c(33, 38, 'Propose, get feedback, refine. Each loop brings you closer to agreement.'),
  c(38, 43, 'Buy-in means you both agree on the high-level design before going deeper.'),
  c(43, 48, 'Now let\'s draw it properly.'),
  c(48, 53, 'Draw box diagrams with the key components on the whiteboard or paper.'),
  c(53, 58, 'Clients, mobile and web. Then the APIs and the web servers behind them.'),
  c(58, 63, 'Data stores for what must persist. A cache for data that is read again and again.'),
  c(63, 68, 'A CDN for static media. A message queue for slow work that can happen later.'),
  c(68, 74, 'Boxes and arrows, not class diagrams. Keep it high level.'),
  c(74, 80, 'And only draw what the requirements need: every box should have a reason.'),
  c(80, 85, 'Does the blueprint fit the scale? A back-of-the-envelope calculation will tell you.'),
  c(85, 90, 'Think out loud, and check with the interviewer whether the math is needed before diving in.'),
  c(90, 95, 'Assume 10 million DAU, each opening the feed about 10 times a day.'),
  c(95, 100, '100 million views over 86,400 seconds: roughly 1,200 queries per second.'),
  c(100, 104, 'Peak could be twice that, about 2,400. Two web servers would not be enough.'),
  c(104, 109, 'If possible, walk through a few concrete use cases.'),
  c(109, 114, '"A user with 5,000 friends posts a video." Following it through frames the design.'),
  c(114, 119, 'Use cases also expose edge cases you had not considered yet.'),
  c(119, 124, 'Should you add API endpoints and a database schema now? It depends on the problem.'),
  c(124, 128, 'Too low level for "design Google search". Fair game for a multiplayer poker backend.'),
  c(128, 133, 'At a high level, the news feed design has two flows. First: feed publishing.'),
  c(133, 138, 'A user publishes a post. The request passes the load balancer to the web servers.'),
  c(138, 143, 'The post data is written into the cache and the database.'),
  c(143, 148, 'Then the post is populated into friends\' news feeds, and friends are notified.'),
  c(148, 152, 'Write once, then spread the news. That is publishing.'),
  c(152, 157, 'Second flow: news feed building. A user opens their feed.'),
  c(157, 162, 'The web servers ask the news feed service to build that user\'s feed.'),
  c(162, 167, 'It aggregates friends\' posts, in reverse chronological order.'),
  c(167, 174, 'Two flows, a box diagram, napkin math and a nod from the interviewer. Blueprint approved.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'buy-in',
    title: 'Get buy-in',
    body: 'Step 2 is a conversation. Propose an initial blueprint, ask for feedback, and treat the interviewer as a teammate. You want to agree on the high-level design before you dive deeper.',
  },
  {
    id: 'box-diagram',
    title: 'Box diagrams',
    body: 'Draw the key components: clients (mobile and web), APIs, web servers, data stores, cache, CDN, message queue and so on. Boxes and arrows, kept high level.',
  },
  {
    id: 'envelope',
    title: 'Back-of-the-envelope check',
    body: 'Do quick calculations to see whether the blueprint fits the scale constraints. Think out loud, and check with the interviewer that the estimate is wanted before diving into it. (The 10 views per user per day here is our own illustrative assumption.)',
  },
  {
    id: 'publishing',
    title: 'Feed publishing',
    body: 'When a user publishes a post, its data is written into cache and database, and the post is populated into friends\' news feeds. The book explains the detailed design in its news feed chapter; here we keep it simplified.',
  },
  {
    id: 'building',
    title: 'News feed building',
    body: 'The news feed is built by aggregating friends\' posts in reverse chronological order, which is exactly the ordering agreed in step 1.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.envelope - 1,
    question: {
      id: 'C3L02-cp1',
      kind: 'multi',
      prompt: 'Which belong on a step-2 box diagram?',
      options: ['Clients (mobile / web)', 'Web servers and APIs', 'Data stores and cache', 'Every class and method name', 'Message queue'],
      answers: [0, 1, 2, 4],
      explanation: 'Box diagrams show key components: clients, APIs, web servers, data stores, cache, CDN, message queue. Class and method names are far too low level here.',
      page: 44,
    },
  },
  {
    at: T.publish - 1,
    question: {
      id: 'C3L02-cp2',
      kind: 'mcq',
      prompt: 'Should your high-level design include API endpoints and a database schema?',
      options: ['Always', 'Never', 'It depends on the problem. Communicate with the interviewer', 'Only if you have time left at the end'],
      answer: 2,
      explanation: 'For a huge problem like a search engine it is too low level; for a multiplayer poker backend it is fair game. Talk to your interviewer.',
      page: 45,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'Design with, not at' },
    { at: T.buyin, title: 'Blueprint and buy-in' },
    { at: T.boxes, title: 'Box diagrams' },
    { at: T.envelope, title: 'Does it fit the scale?' },
    { at: T.usecases, title: 'Use cases, APIs and schema' },
    { at: T.publish, title: 'Flow 1: feed publishing' },
    { at: T.build, title: 'Flow 2: news feed building' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
