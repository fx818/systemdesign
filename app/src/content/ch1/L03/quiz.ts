import type { ArchGraph, QuizQuestion } from '@/types/content';

const directDesign: ArchGraph = {
  nodes: [
    { id: 'client', kind: 'client', label: 'Web browser', x: 160, y: 220 },
    { id: 'mobile', kind: 'mobile', label: 'Mobile app', x: 160, y: 500 },
    { id: 'dns', kind: 'dns', label: 'DNS', x: 520, y: 110 },
    { id: 'web', kind: 'web', label: 'The only web server', x: 640, y: 380 },
    { id: 'db', kind: 'db', label: 'Database', x: 1060, y: 380 },
  ],
  edges: [
    { from: 'client', to: 'dns' },
    { from: 'mobile', to: 'dns' },
    { from: 'client', to: 'web', label: 'HTTP' },
    { from: 'mobile', to: 'web', label: 'HTTP' },
    { from: 'web', to: 'db' },
  ],
};

export const quiz: QuizQuestion[] = [
  {
    id: 'L03-q1',
    kind: 'mcq',
    prompt: 'What does vertical scaling ("scale up") mean?',
    options: [
      'Adding more power (CPU, RAM, etc.) to your servers',
      'Adding more servers into your pool of resources',
      'Moving the database onto its own server',
      'Putting a load balancer in front of the servers',
    ],
    answer: 0,
    explanation: 'Scale up = a more powerful server. Scale out = more servers in the pool.',
    page: 8,
  },
  {
    id: 'L03-q2',
    kind: 'bins',
    prompt: 'Sort each statement: is it about scaling up or scaling out?',
    bins: ['Scale up (vertical)', 'Scale out (horizontal)'],
    items: [
      { text: 'Add more CPU and RAM to the server', bin: 0 },
      { text: 'Its main advantage is simplicity', bin: 0 },
      { text: 'Has a hard limit', bin: 0 },
      { text: 'If the server dies, the whole site goes down', bin: 0 },
      { text: 'Add more servers into the pool', bin: 1 },
      { text: 'Preferred for large-scale applications', bin: 1 },
      { text: 'One server can die while others keep serving', bin: 1 },
    ],
    explanation: 'Scaling up is simple but has a hard limit and no failover. Scaling out adds servers, which gives redundancy and is preferred at large scale.',
    page: 8,
  },
  {
    id: 'L03-q3',
    kind: 'truefalse',
    prompt: 'With enough money, you can keep adding CPU and memory to a single server forever.',
    answer: false,
    explanation: 'Vertical scaling has a hard limit: it is impossible to add unlimited CPU and memory to a single server.',
    page: 8,
  },
  {
    id: 'L03-q4',
    kind: 'spot',
    prompt: 'Users connect to this web server directly. Click the component whose failure makes the whole site unreachable.',
    diagram: directDesign,
    answers: ['web'],
    explanation: 'With a single web server and direct connections, if that server is offline users cannot access the website. (The database is also a single box, a problem we tackle in Level 5.)',
    page: 9,
  },
  {
    id: 'L03-q5',
    kind: 'multi',
    prompt: 'Users connect straight to one web server. Which problems can happen? Pick all that apply.',
    options: [
      'If the server goes offline, users cannot reach the site',
      'If too many users arrive at once, responses get slow',
      'If too many users arrive at once, some fail to connect',
      'The DNS server refuses to answer',
    ],
    answers: [0, 1, 2],
    explanation: 'Offline server means no website. Hitting the load limit means slower responses or failed connections. DNS is not the problem here.',
    page: 9,
  },
  {
    id: 'L03-q6',
    kind: 'order',
    prompt: 'Put PixelPost\'s scaling story in order.',
    items: [
      'Traffic is low: one server, upgraded now and then (simple!)',
      'Traffic grows: buy ever bigger, ever pricier hardware',
      'Hit the hard limit: there is no bigger machine',
      'Scale out: add more servers to the pool',
      'Put a load balancer in front so users are not tied to one server',
    ],
    explanation: 'Vertical scaling is great while traffic is low, but hits a hard limit. Horizontal scaling takes over, and a load balancer solves the direct-connection problem.',
    page: 9,
  },
  {
    id: 'L03-q7',
    kind: 'numeric',
    prompt: 'PixelPost runs 3 identical web servers that each handle 1,000 requests/sec. One server dies. How many requests/sec can the pool still handle?',
    answer: 2000,
    unit: 'req/s',
    explanation: 'Two healthy servers x 1,000 = 2,000 requests/sec. With a single scaled-up server, the answer would have been 0.',
    page: 8,
  },
  {
    id: 'L03-q8',
    kind: 'mcq',
    prompt: 'According to the chapter, what is the best technique to fix the problems of users connecting to a web server directly?',
    options: ['A load balancer', 'A bigger web server', 'A second DNS provider', 'A NoSQL database'],
    answer: 0,
    explanation: 'A load balancer is the best technique for both problems: a server going offline and a server reaching its load limit.',
    page: 9,
  },
];

export const cards = [
  { front: 'Vertical vs horizontal scaling?', back: 'Vertical = scale up: more CPU/RAM in one server. Horizontal = scale out: more servers in the pool.' },
  { front: 'Main advantage of scaling up?', back: 'Simplicity. A great option while traffic is low.' },
  { front: 'Two limitations of scaling up?', back: 'A hard limit (no unlimited CPU/RAM in one server) and no failover or redundancy (server down = site down).' },
  { front: 'Why do large apps scale out?', back: 'Vertical scaling hits a hard limit and has no redundancy, so large-scale applications prefer adding servers.' },
  { front: 'Problem with users connecting to a web server directly?', back: 'Server offline = site unreachable; server at its load limit = slow responses or failed connections. Fix: a load balancer.' },
];
