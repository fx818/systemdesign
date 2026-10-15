import type { ArchGraph, QuizQuestion } from '@/types/content';
import { CDN_STEPS } from './data';

const design: ArchGraph = {
  nodes: [
    { id: 'client', kind: 'client', label: 'Users', x: 140, y: 360 },
    { id: 'cdn', kind: 'cdn', label: 'CDN', x: 480, y: 140 },
    { id: 'lb', kind: 'lb', label: 'Load balancer', x: 480, y: 420 },
    { id: 'web', kind: 'web', label: 'Web servers', x: 780, y: 420 },
    { id: 'cache', kind: 'cache', label: 'Cache', x: 1080, y: 260 },
    { id: 'db', kind: 'db', label: 'Database', x: 1080, y: 560 },
  ],
  edges: [
    { from: 'client', to: 'cdn', label: 'static' },
    { from: 'client', to: 'lb' },
    { from: 'lb', to: 'web' },
    { from: 'web', to: 'cache' },
    { from: 'web', to: 'db' },
    { from: 'cdn', to: 'web', label: 'origin' },
  ],
};

export const quiz: QuizQuestion[] = [
  {
    id: 'L07-q1',
    kind: 'order',
    prompt: 'Put the full CDN workflow in order.',
    items: [...CDN_STEPS],
    explanation: 'Request via the CDN URL, miss, fetch from origin, origin returns the file with a TTL, CDN caches and returns it, later requests are served from cache until the TTL expires.',
    page: 18,
  },
  {
    id: 'L07-q2',
    kind: 'bins',
    prompt: 'Which of PixelPost\'s files belong on the CDN?',
    bins: ['Serve from the CDN', 'Keep on the origin'],
    items: [
      { text: 'Logo on every page', bin: 0 },
      { text: 'CSS bundle', bin: 0 },
      { text: 'Popular user photos', bin: 0 },
      { text: 'JavaScript bundle', bin: 0 },
      { text: 'Per-user feed JSON', bin: 1 },
      { text: '2015 press kit, 2 downloads a year', bin: 1 },
    ],
    explanation: 'CDNs cache static content like images, CSS and JS. Rarely used assets bring no real benefit for the transfer cost, and dynamic per-user data is out of scope for the CDN in this chapter.',
    page: 19,
  },
  {
    id: 'L07-q3',
    kind: 'mcq',
    prompt: 'A CDN server does not have image.png yet. Where does it get it?',
    options: [
      'From the user\'s browser cache',
      'From the origin: a web server or online storage like Amazon S3',
      'From the database replica',
      'From another user who downloaded it',
    ],
    answer: 1,
    explanation: 'On a miss, the CDN requests the file from the origin, which can be a web server or online storage such as Amazon S3.',
    page: 18,
  },
  {
    id: 'L07-q4',
    kind: 'truefalse',
    prompt: 'A longer cache expiry is always better because it reduces trips to the origin.',
    answer: false,
    explanation: 'Too long and content might no longer be fresh; too short and files are repeatedly reloaded from the origin. The expiry should be neither too long nor too short.',
    page: 19,
  },
  {
    id: 'L07-q5',
    kind: 'multi',
    prompt: 'You must replace image.png before its TTL expires. Which options work?',
    options: [
      'Invalidate the object with the CDN vendor\'s API',
      'Serve a new version via the URL, e.g. image.png?v=2',
      'Restart the user\'s browser',
      'Increase the TTL',
    ],
    answers: [0, 1],
    explanation: 'Files can be removed early by invalidating them through the vendor\'s API, or by object versioning: adding a version parameter like ?v=2 to the URL.',
    page: 19,
  },
  {
    id: 'L07-q6',
    kind: 'spot',
    prompt: 'In this design, click the component that now serves images, CSS and JavaScript.',
    diagram: design,
    answers: ['cdn'],
    explanation: 'Static assets are no longer served by the web servers; they are fetched from the CDN for better performance.',
    page: 20,
  },
  {
    id: 'L07-q7',
    kind: 'mcq',
    prompt: 'The CDN provider has a temporary outage. What should PixelPost\'s clients do?',
    options: [
      'Show an error page until the CDN is back',
      'Detect the problem and request the resources from the origin',
      'Switch to a different DNS provider',
      'Clear their caches and retry forever',
    ],
    answer: 1,
    explanation: 'Plan for CDN fallback: when the CDN is temporarily down, clients should detect it and request resources from the origin.',
    page: 19,
  },
  {
    id: 'L07-q8',
    kind: 'mcq',
    prompt: 'PixelPost\'s only CDN servers are in San Francisco. Who gets photos fastest?',
    options: ['Users in Los Angeles', 'Users in Europe', 'Everyone equally', 'Users nearest the database'],
    answer: 0,
    explanation: 'The closer a user is to a CDN server, the faster the content loads. Los Angeles is next door to San Francisco; Europe is much further away.',
    page: 17,
  },
];

export const cards = [
  { front: 'What is a CDN?', back: 'A network of geographically dispersed servers that cache and deliver static content (images, videos, CSS, JS) from the server closest to the user.' },
  { front: 'CDN workflow on a miss?', back: 'User requests via the CDN URL → CDN fetches from origin (web server or S3) → origin returns file + optional TTL header → CDN caches it and returns it; later users hit the cache until the TTL expires.' },
  { front: 'Four CDN considerations?', back: 'Cost (pay for transfer, skip rarely used assets), cache expiry (not too long or short), fallback to origin on CDN outage, invalidation (vendor API or ?v=2 versioning).' },
  { front: 'How to replace a cached file early?', back: 'Invalidate it with the CDN vendor\'s API, or version the object URL: image.png?v=2.' },
  { front: 'What changed in Figure 1-11?', back: 'Static assets come from the CDN, not the web servers, and the database load is lightened by the cache.' },
];
