import type { ArchGraph, QuizQuestion } from '@/types/content';

const multiDc: ArchGraph = {
  nodes: [
    { id: 'users', kind: 'client', label: 'Users', x: 640, y: 80 },
    { id: 'geodns', kind: 'dns', label: 'geoDNS', x: 640, y: 220 },
    { id: 'dc1', kind: 'datacenter', label: 'DC 1 · US-East', x: 950, y: 400 },
    { id: 'dc2', kind: 'datacenter', label: 'DC 2 · US-West', x: 330, y: 400 },
    { id: 'db1', kind: 'db', label: 'DB East', x: 950, y: 600 },
    { id: 'db2', kind: 'db', label: 'DB West', x: 330, y: 600 },
  ],
  edges: [
    { from: 'users', to: 'geodns' },
    { from: 'geodns', to: 'dc1', label: 'x%' },
    { from: 'geodns', to: 'dc2', label: '(100-x)%' },
    { from: 'dc1', to: 'db1' },
    { from: 'dc2', to: 'db2' },
  ],
};

export const quiz: QuizQuestion[] = [
  {
    id: 'L09-q1',
    kind: 'numeric',
    prompt: 'GeoDNS sends x = 70% of traffic to US-East. What percentage goes to US-West?',
    answer: 30,
    tolerance: 0,
    unit: '%',
    explanation: 'Traffic is split x% to US-East and (100 − x)% to US-West: 100 − 70 = 30%.',
    page: 24,
  },
  {
    id: 'L09-q2',
    kind: 'numeric',
    prompt: 'US-West suffers a major outage. What percentage of traffic should US-East receive now?',
    answer: 100,
    tolerance: 0,
    unit: '%',
    explanation: 'During a significant data center outage, all traffic is directed to the healthy data center: 100% to US-East.',
    page: 24,
  },
  {
    id: 'L09-q3',
    kind: 'spot',
    prompt: 'Click the component that decides which data center each user reaches.',
    diagram: multiDc,
    answers: ['geodns'],
    explanation: 'GeoDNS resolves the domain name to the IP of the closest (healthy) data center based on the user\'s location.',
    page: 24,
  },
  {
    id: 'L09-q4',
    kind: 'bins',
    prompt: 'Match each tool or idea to the multi-data-center challenge it solves.',
    bins: ['Traffic redirection', 'Data synchronization', 'Test and deployment'],
    items: [
      { text: 'GeoDNS', bin: 0 },
      { text: 'Send users to the nearest DC', bin: 0 },
      { text: 'Replicate data across DCs', bin: 1 },
      { text: 'Asynchronous multi-DC replication (Netflix)', bin: 1 },
      { text: 'Automated deployment tools', bin: 2 },
      { text: 'Test the app from different locations', bin: 2 },
    ],
    explanation: 'GeoDNS handles redirection, replication handles data sync, and testing in several locations plus automated deployment keep every data center consistent.',
    page: 25,
  },
  {
    id: 'L09-q5',
    kind: 'mcq',
    prompt: 'US-West fails and its users are routed to US-East, but their recent photos are missing. Which challenge was not solved?',
    options: ['Traffic redirection', 'Data synchronization', 'Test and deployment', 'Autoscaling'],
    answer: 1,
    explanation: 'Users in different regions may use different local databases. Without replicating data across data centers, failover can send users where their data is unavailable.',
    page: 25,
  },
  {
    id: 'L09-q6',
    kind: 'order',
    prompt: 'Put the failover story in order.',
    items: [
      'Users are geo-routed to their closest data center',
      'US-West suffers a significant outage',
      'GeoDNS directs all traffic to the healthy US-East',
      'West users keep working because their data was replicated to US-East',
    ],
    explanation: 'Normal geo-routing, outage, 100% of traffic to the healthy data center, and replicated data so failed-over users find what they need.',
    page: 24,
  },
  {
    id: 'L09-q7',
    kind: 'truefalse',
    prompt: 'With several data centers, automated deployment tools matter because they keep services consistent across all of them.',
    answer: true,
    explanation: 'Testing at different locations and automated deployment are vital to keep every data center running the same, consistent services.',
    page: 25,
  },
  {
    id: 'L09-q8',
    kind: 'mcq',
    prompt: 'Why does PixelPost add a second data center at all?',
    options: [
      'To make the database schema simpler',
      'To improve availability and give users across wider regions a better experience',
      'Because geoDNS only works with exactly two data centers',
      'To avoid needing a load balancer',
    ],
    answer: 1,
    explanation: 'As the site attracts users internationally, multiple data centers improve availability and user experience across wider geographic areas.',
    page: 23,
  },
];

export const cards = [
  { front: 'What is geoDNS?', back: 'A DNS service that resolves domain names to IP addresses based on the user\'s location, so users are geo-routed to the closest data center.' },
  { front: 'Normal traffic split between two DCs?', back: 'x% to US-East and (100 − x)% to US-West, each user going to the nearest one.' },
  { front: 'What happens in a data center outage?', back: 'All traffic is directed to a healthy data center (e.g. 100% to US-East when US-West is offline).' },
  { front: 'Three multi-DC challenges?', back: 'Traffic redirection (GeoDNS), data synchronization (replicate across DCs, e.g. Netflix async replication), test & deployment (test in many locations, automated deploys).' },
];
