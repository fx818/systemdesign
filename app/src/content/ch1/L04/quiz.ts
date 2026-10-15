import type { ArchGraph, QuizQuestion } from '@/types/content';

const lbDesign: ArchGraph = {
  nodes: [
    { id: 'client', kind: 'client', label: 'User', x: 140, y: 360 },
    { id: 'dns', kind: 'dns', label: 'DNS', x: 380, y: 110 },
    { id: 'lb', kind: 'lb', label: 'Load balancer', x: 520, y: 360 },
    { id: 'web1', kind: 'web', label: 'Server 1', x: 860, y: 220 },
    { id: 'web2', kind: 'web', label: 'Server 2', x: 860, y: 500 },
  ],
  edges: [
    { from: 'client', to: 'dns' },
    { from: 'client', to: 'lb' },
    { from: 'lb', to: 'web1' },
    { from: 'lb', to: 'web2' },
  ],
};

export const quiz: QuizQuestion[] = [
  {
    id: 'L04-q1',
    kind: 'mcq',
    prompt: 'With a load balancer in place, what do users connect to?',
    options: [
      'The public IP of the load balancer',
      'The private IP of a web server',
      'The database directly',
      'Whichever web server is closest',
    ],
    answer: 0,
    explanation: 'Users connect to the public IP of the load balancer. The web servers are no longer reachable directly by clients.',
    page: 10,
  },
  {
    id: 'L04-q2',
    kind: 'truefalse',
    prompt: 'A private IP address can be reached from anywhere on the internet.',
    answer: false,
    explanation: 'A private IP is reachable only between servers in the same network. It is unreachable over the internet.',
    page: 10,
  },
  {
    id: 'L04-q3',
    kind: 'spot',
    prompt: 'Which component do users connect to directly in this design? Click it.',
    diagram: lbDesign,
    answers: ['lb'],
    explanation: 'Users get the load balancer\'s public IP from DNS and connect to it. Web servers sit behind it on private IPs.',
    page: 10,
  },
  {
    id: 'L04-q4',
    kind: 'order',
    prompt: 'Server 1 crashes. Put the failover in order.',
    items: [
      'Server 1 goes offline',
      'The load balancer stops sending traffic to server 1',
      'All traffic is routed to server 2; the site stays online',
      'A new healthy web server is added to the pool',
      'The load is balanced across the healthy servers again',
    ],
    explanation: 'If server 1 goes offline, all traffic goes to server 2, which prevents the site from going offline. Then a new healthy server is added to balance the load.',
    page: 10,
  },
  {
    id: 'L04-q5',
    kind: 'bins',
    prompt: 'Public IP or private IP?',
    bins: ['Public IP', 'Private IP'],
    items: [
      { text: 'The address DNS returns for api.pixelpost.com', bin: 0 },
      { text: 'What users\' browsers connect to', bin: 0 },
      { text: 'Reachable over the internet', bin: 0 },
      { text: 'Server 2\'s 10.0.0.2 address', bin: 1 },
      { text: 'Only reachable inside the same network', bin: 1 },
      { text: 'How the load balancer talks to web servers', bin: 1 },
    ],
    explanation: 'The load balancer has the public IP users connect to. Servers communicate over private IPs, reachable only within the same network, for better security.',
    page: 10,
  },
  {
    id: 'L04-q6',
    kind: 'multi',
    prompt: 'What did adding a load balancer and a second web server achieve? Pick all that apply.',
    options: [
      'Solved the no-failover problem in the web tier',
      'Improved the availability of the web tier',
      'Web servers are no longer reachable directly by clients',
      'The database now has a backup copy',
      'DNS is no longer needed',
    ],
    answers: [0, 1, 2],
    explanation: 'The web tier now has failover and better availability, and clients reach only the load balancer. The database is still a single box (that is the next level), and DNS is still used to find the load balancer.',
    page: 10,
  },
  {
    id: 'L04-q7',
    kind: 'numeric',
    prompt: 'A load balancer evenly spreads 1,200 requests/sec over 4 web servers. One server dies. How many requests/sec does each remaining server now get?',
    answer: 400,
    unit: 'req/s',
    explanation: 'The load balancer sends traffic only to healthy servers: 1,200 / 3 = 400 requests/sec each.',
    page: 10,
  },
  {
    id: 'L04-q8',
    kind: 'label',
    prompt: 'Label the diagram.',
    diagram: lbDesign,
    labels: [
      { nodeId: 'lb', text: 'Public IP: users connect here' },
      { nodeId: 'web1', text: 'Private IP: 10.0.0.1' },
      { nodeId: 'dns', text: 'Returns the load balancer\'s IP' },
    ],
    explanation: 'DNS hands out the load balancer\'s public IP; the load balancer reaches web servers on private IPs.',
    page: 10,
  },
];

export const cards = [
  { front: 'What does a load balancer do?', back: 'Evenly distributes incoming traffic among the web servers in a load-balanced set.' },
  { front: 'Public vs private IP behind a load balancer?', back: 'Users connect to the LB\'s public IP. LB and web servers talk over private IPs: reachable only inside the same network, not over the internet.' },
  { front: 'Server 1 goes offline. Then what?', back: 'All traffic is routed to server 2, so the site stays up. A new healthy server is added to the pool to balance the load.' },
  { front: 'Traffic grows fast. What do you do with a load balancer?', back: 'Add more servers to the web server pool. The load balancer automatically starts sending requests to them.' },
  { front: 'Web tier fixed. What is still weak?', back: 'The data tier: a single database has no failover or redundancy. Fix: database replication.' },
];
