import type { ArchGraph, QuizQuestion } from '@/types/content';

const feedDesign: ArchGraph = {
  nodes: [
    { id: 'user', kind: 'client', label: 'User', x: 120, y: 360 },
    { id: 'lb', kind: 'lb', label: 'Load balancer', x: 330, y: 360 },
    { id: 'web', kind: 'web', label: 'Web servers', x: 540, y: 360 },
    { id: 'post', kind: 'worker', label: 'Post service', x: 790, y: 180 },
    { id: 'fanout', kind: 'worker', label: 'Fanout service', x: 790, y: 360 },
    { id: 'notify', kind: 'worker', label: 'Notification service', x: 790, y: 540 },
    { id: 'postdb', kind: 'db', label: 'Post DB', x: 1080, y: 180 },
    { id: 'feedcache', kind: 'cache', label: 'News feed cache', x: 1080, y: 360 },
  ],
  edges: [
    { from: 'user', to: 'lb' }, { from: 'lb', to: 'web' }, { from: 'web', to: 'post' }, { from: 'web', to: 'fanout' },
    { from: 'web', to: 'notify' }, { from: 'post', to: 'postdb' }, { from: 'fanout', to: 'feedcache' },
  ],
};

export const quiz: QuizQuestion[] = [
  {
    id: 'C3L03-q1',
    kind: 'multi',
    prompt: 'By the time you start the deep dive, what should you already have?',
    options: [
      'Agreement on the overall goals and feature scope',
      'A sketched high-level blueprint',
      'Feedback from the interviewer on that blueprint',
      'Initial ideas about which areas to focus on',
      'Production-ready code for every component',
    ],
    answers: [0, 1, 2, 3],
    explanation: 'Those four objectives come out of steps 1 and 2. Code is not the goal of a system design interview.',
    page: 46,
  },
  {
    id: 'C3L03-q2',
    kind: 'mcq',
    prompt: 'In an interview for a senior candidate, what might the deep dive focus on?',
    options: ['UI colours', 'System performance characteristics: bottlenecks and resource estimations', 'Variable naming', 'The company\'s history'],
    answer: 1,
    explanation: 'For senior candidates the discussion could be on performance characteristics, likely focusing on bottlenecks and resource estimations.',
    page: 46,
  },
  {
    id: 'C3L03-q3',
    kind: 'bins',
    prompt: 'Good deep dive, or rabbit hole?',
    bins: ['Good deep dive', 'Rabbit hole'],
    items: [
      { text: 'URL shortener: the long-to-short hash function', bin: 0 },
      { text: 'Chat: reducing latency', bin: 0 },
      { text: 'Chat: online/offline status', bin: 0 },
      { text: 'News feed: the EdgeRank formula in full detail', bin: 1 },
      { text: 'News feed: the colour of the Post button', bin: 1 },
      { text: 'Your favourite editor key bindings', bin: 1 },
    ],
    explanation: 'Dig into components that show design skill. Minute details like the full EdgeRank algorithm burn time without proving you can design a scalable system.',
    page: 47,
  },
  {
    id: 'C3L03-q4',
    kind: 'mcq',
    prompt: 'How do you choose which components to dive into?',
    options: [
      'Always pick the one you know best',
      'Work with the interviewer to identify and prioritize components',
      'Go through every component equally',
      'Let the interviewer do the deep dive',
    ],
    answer: 1,
    explanation: 'You work with the interviewer to identify and prioritize components, guided by her feedback and hints.',
    page: 46,
  },
  {
    id: 'C3L03-q5',
    kind: 'truefalse',
    prompt: 'Sometimes the interviewer signals she would rather keep focusing on the high-level design.',
    answer: true,
    explanation: 'Every interview is different. Watch for hints about where the interviewer wants to spend the time.',
    page: 46,
  },
  {
    id: 'C3L03-q6',
    kind: 'order',
    prompt: 'Order the path into a good deep dive.',
    items: [
      'Agree on the goals and feature scope',
      'Sketch the high-level blueprint',
      'Get the interviewer\'s feedback on it',
      'Identify and prioritize components together',
      'Dig into the most critical components first',
    ],
    explanation: 'Steps 1 and 2 produce scope, a blueprint and feedback; step 3 prioritizes and digs into the critical components first.',
    page: 46,
  },
  {
    id: 'C3L03-q7',
    kind: 'mcq',
    prompt: 'In the book\'s news feed example, which two use cases get the deep dive?',
    options: ['Login and logout', 'Feed publishing and news feed retrieval', 'Ads and analytics', 'Search and recommendations'],
    answer: 1,
    explanation: 'After the high-level design is accepted, the example investigates feed publishing and news feed retrieval.',
    page: 47,
  },
  {
    id: 'C3L03-q8',
    kind: 'spot',
    prompt: 'Maya: "Posting is slow for users with 5,000 friends." Click the component to deep-dive into.',
    diagram: feedDesign,
    answers: ['fanout'],
    explanation: 'Spreading a post to thousands of friends\' feeds is the fanout service\'s job, so that is where the bottleneck lives and where to dig.',
    page: 47,
  },
];

export const cards = [
  { front: 'Step 3 starting line?', back: 'Agreed goals and scope, a sketched blueprint, interviewer feedback on it, and initial ideas about where to focus.' },
  { front: 'How to pick deep-dive topics?', back: 'Identify and prioritize components together with the interviewer. Every interview is different: read the hints.' },
  { front: 'Classic deep dives?', back: 'URL shortener: the hash function. Chat system: latency and online/offline status. Senior roles: bottlenecks and resource estimates.' },
  { front: 'Why not explain EdgeRank in detail?', back: 'It burns precious time and does not prove you can design a scalable system. Manage time; show signals.' },
  { front: 'News feed deep dives?', back: 'Feed publishing and news feed retrieval: the two most important use cases.' },
];
