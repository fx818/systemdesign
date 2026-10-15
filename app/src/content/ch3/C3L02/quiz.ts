import type { ArchGraph, QuizQuestion } from '@/types/content';

const buildFlow: ArchGraph = {
  nodes: [
    { id: 'user', kind: 'mobile', label: 'User', x: 140, y: 360 },
    { id: 'lb', kind: 'lb', label: 'Load balancer', x: 400, y: 360 },
    { id: 'web', kind: 'web', label: 'Web servers', x: 650, y: 360 },
    { id: 'svc', kind: 'worker', label: 'News feed service', x: 900, y: 360 },
    { id: 'cache', kind: 'cache', label: 'News feed cache', x: 1140, y: 360 },
  ],
  edges: [
    { from: 'user', to: 'lb' },
    { from: 'lb', to: 'web' },
    { from: 'web', to: 'svc' },
    { from: 'svc', to: 'cache' },
  ],
};

export const quiz: QuizQuestion[] = [
  {
    id: 'C3L02-q1',
    kind: 'mcq',
    prompt: 'What is the aim of step 2?',
    options: [
      'Write production-ready code for the hardest component',
      'Develop a high-level design and reach agreement on it with the interviewer',
      'Pick the database vendor and the exact instance sizes',
      'List as many technologies as possible',
    ],
    answer: 1,
    explanation: 'Step 2 is about a high-level blueprint and buy-in: agreement with the interviewer, built collaboratively.',
    page: 44,
  },
  {
    id: 'C3L02-q2',
    kind: 'truefalse',
    prompt: 'You should silently work out back-of-the-envelope numbers before telling the interviewer anything.',
    answer: false,
    explanation: 'Think out loud, and communicate with the interviewer about whether the back-of-the-envelope estimate is necessary before diving into it.',
    page: 44,
  },
  {
    id: 'C3L02-q3',
    kind: 'bins',
    prompt: 'News feed design: does each step belong to feed publishing or news feed building?',
    bins: ['Feed publishing', 'News feed building'],
    items: [
      { text: 'A user makes a new post', bin: 0 },
      { text: 'Post data is written into cache and database', bin: 0 },
      { text: 'The post is populated into friends\' feeds', bin: 0 },
      { text: 'A user opens their feed', bin: 1 },
      { text: 'Friends\' posts are aggregated', bin: 1 },
      { text: 'Posts are sorted newest first', bin: 1 },
    ],
    explanation: 'Publishing writes the post and populates friends\' feeds. Building aggregates friends\' posts in reverse chronological order.',
    page: 45,
  },
  {
    id: 'C3L02-q4',
    kind: 'order',
    prompt: 'Order the feed publishing flow.',
    items: [
      'User publishes a post',
      'The request reaches the web servers through the load balancer',
      'Post data is written into cache and database',
      'The post is populated into friends\' news feeds',
    ],
    explanation: 'The post enters through the load balancer and web servers, is stored, then is spread to friends\' feeds.',
    page: 45,
  },
  {
    id: 'C3L02-q5',
    kind: 'mcq',
    prompt: 'Why walk through a few concrete use cases during step 2?',
    options: [
      'To fill time until the interviewer is ready',
      'They help frame the high-level design and reveal edge cases you had not considered',
      'Use cases replace the need for a box diagram',
      'To prove the design is perfect',
    ],
    answer: 1,
    explanation: 'Going through concrete use cases frames the design and is likely to help you discover edge cases.',
    page: 45,
  },
  {
    id: 'C3L02-q6',
    kind: 'multi',
    prompt: 'Which are good step-2 behaviours?',
    options: [
      'Propose an initial blueprint and ask for feedback',
      'Treat the interviewer as a teammate',
      'Refuse to change the blueprint once drawn',
      'Check the blueprint against the scale constraints',
      'Spend the whole step on one component\'s internals',
    ],
    answers: [0, 1, 3],
    explanation: 'Blueprint, feedback, collaboration and a scale check. Stubbornness is a red flag, and diving into one component belongs to step 3.',
    page: 44,
  },
  {
    id: 'C3L02-q7',
    kind: 'numeric',
    prompt: 'Napkin math: 10 million DAU each open the feed 10 times a day. Roughly how many queries per second is that? (86,400 seconds in a day)',
    answer: 1157,
    tolerance: 200,
    unit: 'QPS',
    explanation: '10M × 10 = 100M requests a day; 100M ÷ 86,400 ≈ 1,157, call it ~1,200 QPS. Rounding is fine at this stage.',
    page: 44,
  },
  {
    id: 'C3L02-q8',
    kind: 'label',
    prompt: 'Label the news feed building flow.',
    diagram: buildFlow,
    labels: [
      { nodeId: 'user', text: 'User' },
      { nodeId: 'lb', text: 'Load balancer' },
      { nodeId: 'web', text: 'Web servers' },
      { nodeId: 'svc', text: 'News feed service' },
      { nodeId: 'cache', text: 'News feed cache' },
    ],
    explanation: 'The user\'s request goes through the load balancer to the web servers, which ask the news feed service; it builds the feed from the news feed cache.',
    page: 46,
  },
];

export const cards = [
  { front: 'Step 2 in one line?', back: 'Propose a high-level design and get buy-in: blueprint, feedback, agreement. Treat the interviewer as a teammate.' },
  { front: 'What goes on the box diagram?', back: 'Key components: clients (mobile/web), APIs, web servers, data stores, cache, CDN, message queue...' },
  { front: 'Back-of-the-envelope in step 2?', back: 'Check the blueprint fits the scale. Think out loud and ask whether the estimate is wanted first.' },
  { front: 'API endpoints and DB schema in step 2?', back: 'Depends on the problem: too low level for a search engine, fair game for a multiplayer poker backend. Ask.' },
  { front: 'The two news feed flows?', back: 'Feed publishing: write the post to cache/DB and populate friends\' feeds. Feed building: aggregate friends\' posts in reverse chronological order.' },
];
