import type { ArchGraph, QuizQuestion } from '@/types/content';

const fig119: ArchGraph = {
  nodes: [
    { id: 'users', kind: 'client', label: 'Users', x: 110, y: 300 },
    { id: 'lb', kind: 'lb', label: 'Load balancer', x: 340, y: 300 },
    { id: 'web', kind: 'web', label: 'Web servers', x: 560, y: 300 },
    { id: 'db', kind: 'db', label: 'Database', x: 800, y: 180 },
    { id: 'queue', kind: 'queue', label: 'Message queue', x: 800, y: 420 },
    { id: 'workers', kind: 'worker', label: 'Workers', x: 1040, y: 420 },
    { id: 'logs', kind: 'logging', label: 'Log aggregator', x: 420, y: 600 },
    { id: 'metrics', kind: 'metrics', label: 'Metrics dashboard', x: 680, y: 600 },
    { id: 'ci', kind: 'ci', label: 'CI pipeline', x: 940, y: 600 },
  ],
  edges: [
    { from: 'users', to: 'lb' },
    { from: 'lb', to: 'web' },
    { from: 'web', to: 'db' },
    { from: 'web', to: 'queue' },
    { from: 'queue', to: 'workers' },
    { from: 'web', to: 'logs', label: 'logs' },
    { from: 'web', to: 'metrics', label: 'stats' },
    { from: 'ci', to: 'web', label: 'deploy' },
  ],
};

const toolsDiagram: ArchGraph = {
  nodes: [
    { id: 'web', kind: 'web', label: 'Web tier', x: 640, y: 200 },
    { id: 't-logs', kind: 'logging', x: 300, y: 480 },
    { id: 't-metrics', kind: 'metrics', x: 640, y: 480 },
    { id: 't-ci', kind: 'ci', x: 980, y: 480 },
  ],
  edges: [
    { from: 'web', to: 't-logs' },
    { from: 'web', to: 't-metrics' },
    { from: 't-ci', to: 'web' },
  ],
};

export const quiz: QuizQuestion[] = [
  {
    id: 'L11-q1',
    kind: 'truefalse',
    prompt: 'For a small website running on a few servers, logging, metrics and automation are a strict necessity.',
    answer: false,
    explanation: 'For a small site they are good practice but not a necessity. Once the site serves a large business, investing in them becomes essential.',
    page: 26,
  },
  {
    id: 'L11-q2',
    kind: 'bins',
    prompt: 'Sort each metric into its type.',
    bins: ['Host level', 'Aggregated level', 'Key business'],
    items: [
      { text: 'CPU of web-3', bin: 0 },
      { text: 'Memory of cache-1', bin: 0 },
      { text: 'Disk I/O of db-2', bin: 0 },
      { text: 'Performance of the whole database tier', bin: 1 },
      { text: 'Performance of the whole cache tier', bin: 1 },
      { text: 'Daily active users', bin: 2 },
      { text: 'Retention', bin: 2 },
      { text: 'Revenue', bin: 2 },
    ],
    explanation: 'Host metrics describe one machine (CPU, memory, disk I/O). Aggregated metrics describe a whole tier (database tier, cache tier). Key business metrics are DAU, retention, revenue.',
    page: 27,
  },
  {
    id: 'L11-q3',
    kind: 'order',
    prompt: 'Put a change through an automated continuous-integration pipeline, in order.',
    items: ['A developer checks in code', 'The code is built automatically', 'Automated tests verify the check-in', 'The verified build is deployed'],
    explanation: 'In CI every check-in is verified through automation, so problems are caught before deployment. Automating build, test and deploy boosts productivity.',
    page: 27,
  },
  {
    id: 'L11-q4',
    kind: 'mcq',
    prompt: 'What is the main benefit of aggregating error logs into a centralized service?',
    options: [
      'Logs from every server are easy to search and view in one place',
      'Servers stop producing errors',
      'It replaces the need for metrics',
      'It makes the database faster',
    ],
    answer: 0,
    explanation: 'You can monitor logs per server, but aggregating them in a centralized service makes them easy to search and view.',
    page: 26,
  },
  {
    id: 'L11-q5',
    kind: 'spot',
    prompt: 'Uploads fail on one of many servers. Click the component where you would search every server\'s error logs at once.',
    diagram: fig119,
    answers: ['logs'],
    explanation: 'The log aggregator collects logs from every server in one searchable place. That is the fastest way to find which machine is failing.',
    page: 26,
  },
  {
    id: 'L11-q6',
    kind: 'multi',
    prompt: 'Which additions does the updated design in Figure 1-19 include? Pick all that apply.',
    options: [
      'A message queue',
      'Logging tools',
      'Monitoring and metrics tools',
      'Automation tools',
      'Database sharding',
      'A second CDN provider',
    ],
    answers: [0, 1, 2, 3],
    explanation: 'Figure 1-19 adds a message queue (loosely coupled, failure resilient) plus logging, monitoring, metrics and automation tools. Sharding comes in the next step.',
    page: 27,
  },
  {
    id: 'L11-q7',
    kind: 'label',
    prompt: 'Drag each tool onto its box.',
    diagram: toolsDiagram,
    labels: [
      { nodeId: 't-logs', text: 'Logging (searchable error logs)' },
      { nodeId: 't-metrics', text: 'Metrics (host, aggregated, business)' },
      { nodeId: 't-ci', text: 'Automation (CI: build, test, deploy)' },
    ],
    explanation: 'Logging finds errors, metrics show health and business insight, and automation verifies and ships every check-in.',
    page: 27,
  },
  {
    id: 'L11-q8',
    kind: 'numeric',
    prompt: 'Due to space constraints, how many data centers does Figure 1-19 actually draw?',
    answer: 1,
    unit: 'data center(s)',
    explanation: 'Only one data center is shown in the figure to save space. The multi-data-center setup from earlier still applies.',
    page: 27,
  },
];

export const cards = [
  { front: 'When do logging, metrics and automation become essential?', back: 'Small site on a few servers: nice to have. A site serving a large business: essential.' },
  { front: 'Two ways to monitor error logs?', back: 'Per server, or aggregated into a centralized service that is easy to search and view.' },
  { front: 'Three useful kinds of metrics?', back: 'Host level (CPU, memory, disk I/O), aggregated level (whole DB tier, cache tier), key business (DAU, retention, revenue).' },
  { front: 'What is continuous integration?', back: 'Every code check-in is verified through automation, so teams detect problems early. Automate build, test and deploy too.' },
  { front: 'What does Figure 1-19 add?', back: 'A message queue (loosely coupled, failure resilient) plus logging, monitoring, metrics and automation tools.' },
];
