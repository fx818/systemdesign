import type { ArchGraph, QuizQuestion } from '@/types/content';
import { IP } from './data';

const firstDeploy: ArchGraph = {
  nodes: [
    { id: 'client', kind: 'client', label: 'Web browser', x: 200, y: 200 },
    { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 200, y: 520 },
    { id: 'dns', kind: 'dns', label: 'DNS', x: 640, y: 130 },
    { id: 'server', kind: 'web', label: 'Web app + DB + cache', x: 1000, y: 380 },
  ],
  edges: [
    { from: 'client', to: 'dns' },
    { from: 'mobile', to: 'dns' },
    { from: 'client', to: 'server', label: 'HTTP' },
    { from: 'mobile', to: 'server', label: 'HTTP' },
  ],
};

export const quiz: QuizQuestion[] = [
  {
    id: 'L01-q1',
    kind: 'mcq',
    prompt: 'Who usually runs the DNS that resolves api.pixelpost.com?',
    options: ['Our own web server', 'A paid third-party DNS provider', 'The user\'s browser', 'Our database'],
    answer: 1,
    explanation: 'DNS is usually a paid service from a third party and is not hosted on our own servers.',
    page: 6,
  },
  {
    id: 'L01-q2',
    kind: 'order',
    prompt: 'A user opens PixelPost. Put the request flow in the right order.',
    items: [
      'The user types api.pixelpost.com and DNS is asked to resolve it',
      `DNS returns the IP address (${IP})`,
      'The browser sends an HTTP request directly to the web server',
      'The web server responds with HTML or JSON',
    ],
    explanation: 'Domain name, DNS lookup, IP address, then HTTP straight to the server, which returns HTML pages or JSON for rendering.',
    page: 6,
  },
  {
    id: 'L01-q3',
    kind: 'truefalse',
    prompt: 'The mobile app needs a special protocol to talk to the web server instead of HTTP.',
    answer: false,
    explanation: 'HTTP is the protocol between the mobile app and the web server, just like with the browser. The difference is usually the response format: JSON instead of HTML.',
    page: 7,
  },
  {
    id: 'L01-q4',
    kind: 'bins',
    prompt: 'In a web application, where does each piece run? Sort them.',
    bins: ['Server-side', 'Client-side (browser)'],
    items: [
      { text: 'Java', bin: 0 },
      { text: 'Python', bin: 0 },
      { text: 'Business logic & storage', bin: 0 },
      { text: 'HTML', bin: 1 },
      { text: 'JavaScript for the page', bin: 1 },
      { text: 'Presentation / layout', bin: 1 },
    ],
    explanation: 'A web app combines server-side languages (Java, Python...) for business logic and storage with client-side HTML and JavaScript for presentation.',
    page: 6,
  },
  {
    id: 'L01-q5',
    kind: 'spot',
    prompt: 'PixelPost runs on this setup. Click the component that takes the whole product down if it dies.',
    diagram: firstDeploy,
    answers: ['server'],
    explanation: 'Web app, database and cache all live on one server. If it goes down, there is nothing left to serve web or mobile traffic: a single point of failure.',
    page: 5,
  },
  {
    id: 'L01-q6',
    kind: 'multi',
    prompt: 'In the single-server setup, which of these run on that one server?',
    options: ['Web app', 'Database', 'Cache', 'DNS'],
    answers: [0, 1, 2],
    explanation: 'Everything we operate (web app, database, cache) is on one box. DNS is normally a third-party service.',
    page: 5,
  },
  {
    id: 'L01-q7',
    kind: 'mcq',
    prompt: 'The mobile app calls GET /users/12. What does it get back?',
    options: [
      'An HTML page listing all users',
      'The user object with id 12, typically as JSON',
      'The IP address of user 12',
      'The 12th row of every table',
    ],
    answer: 1,
    explanation: 'GET /users/12 retrieves the user object whose id is 12. JSON is the common API response format because it is simple.',
    page: 7,
  },
  {
    id: 'L01-q8',
    kind: 'label',
    prompt: 'Label the first PixelPost deployment.',
    diagram: firstDeploy,
    labels: [
      { nodeId: 'client', text: 'Web browser' },
      { nodeId: 'mobile', text: 'Mobile app' },
      { nodeId: 'dns', text: 'DNS' },
      { nodeId: 'server', text: 'Single server' },
    ],
    explanation: 'Both clients first look up the IP via DNS, then talk HTTP directly to the single server.',
    page: 6,
  },
];

export const cards = [
  { front: 'The request flow in 4 steps?', back: `1) Domain name goes to DNS. 2) DNS returns the IP (e.g. ${IP}). 3) HTTP request goes straight to the web server. 4) Server returns HTML or JSON.` },
  { front: 'Who usually hosts DNS?', back: 'A paid third-party provider, not our own servers.' },
  { front: 'Single-server setup?', back: 'Web app, database, cache, etc. all on one machine. Simple to start, but everything shares one box.' },
  { front: 'Two sources of traffic?', back: 'Web app (server-side code + HTML/JS in the browser) and mobile app (HTTP, usually JSON responses).' },
  { front: 'Why JSON for mobile APIs?', back: 'It is simple, which makes it the common format for API responses, e.g. GET /users/12.' },
];
