import type { ArchGraph, QuizQuestion } from '@/types/content';

const photoPipeline: ArchGraph = {
  nodes: [
    { id: 'users', kind: 'mobile', label: 'Users', x: 110, y: 360 },
    { id: 'web', kind: 'web', label: 'Web servers', x: 400, y: 360 },
    { id: 'queue', kind: 'queue', label: 'Message queue', x: 700, y: 360 },
    { id: 'w1', kind: 'worker', label: 'Worker', x: 1000, y: 220 },
    { id: 'w2', kind: 'worker', label: 'Worker', x: 1000, y: 500 },
  ],
  edges: [
    { from: 'users', to: 'web', label: 'upload' },
    { from: 'web', to: 'queue', label: 'publish' },
    { from: 'queue', to: 'w1', label: 'consume' },
    { from: 'queue', to: 'w2', label: 'consume' },
  ],
};

export const quiz: QuizQuestion[] = [
  {
    id: 'L10-q1',
    kind: 'multi',
    prompt: 'Which describe a message queue, as defined in the chapter?',
    options: ['Durable', 'Stored in memory', 'Supports asynchronous communication', 'Requires producer and consumer to be online at the same time'],
    answers: [0, 1, 2],
    explanation: 'A message queue is a durable component, stored in memory, that supports asynchronous communication. It buffers messages, so producer and consumer do not need to be up at the same time.',
    page: 25,
  },
  {
    id: 'L10-q2',
    kind: 'label',
    prompt: 'Label the photo processing pipeline.',
    diagram: photoPipeline,
    labels: [
      { nodeId: 'web', text: 'Producer / publisher' },
      { nodeId: 'queue', text: 'Message queue (buffer)' },
      { nodeId: 'w1', text: 'Consumer / subscriber' },
    ],
    explanation: 'Web servers publish photo processing jobs (producers), the queue buffers them, and workers consume them (consumers).',
    page: 26,
  },
  {
    id: 'L10-q3',
    kind: 'order',
    prompt: 'A user uploads a photo with a blur filter. Put the steps in order.',
    items: [
      'The user uploads the photo to a web server',
      'The web server publishes a photo processing job to the queue',
      'The web server replies to the user without waiting for the filter',
      'A worker picks up the job from the queue',
      'The worker blurs the photo asynchronously',
    ],
    explanation: 'Web servers publish jobs and reply right away; workers pick jobs up from the queue and process them asynchronously.',
    page: 26,
  },
  {
    id: 'L10-q4',
    kind: 'mcq',
    prompt: 'The photo queue keeps getting longer and processing takes ages. What should you do?',
    options: ['Add more workers', 'Add more web servers', 'Delete the queue', 'Make the queue smaller'],
    answer: 0,
    explanation: 'When the queue becomes large, more workers are added to reduce the processing time.',
    page: 26,
  },
  {
    id: 'L10-q5',
    kind: 'truefalse',
    prompt: 'If the queue is empty most of the time, you can reduce the number of workers.',
    answer: true,
    explanation: 'Consumers scale independently: fewer workers when the queue is usually empty saves resources.',
    page: 26,
  },
  {
    id: 'L10-q6',
    kind: 'bins',
    prompt: 'Producer or consumer?',
    bins: ['Producer / publisher', 'Consumer / subscriber'],
    items: [
      { text: 'Creates messages', bin: 0 },
      { text: 'Publishes to the queue', bin: 0 },
      { text: 'PixelPost web server posting a job', bin: 0 },
      { text: 'Connects to the queue to read', bin: 1 },
      { text: 'Performs the action in the message', bin: 1 },
      { text: 'Photo processing worker', bin: 1 },
    ],
    explanation: 'Producers create and publish messages; consumers connect to the queue and perform the actions the messages define.',
    page: 25,
  },
  {
    id: 'L10-q7',
    kind: 'spot',
    prompt: 'All the workers crash. Which component keeps the uploaded jobs safe until they come back?',
    diagram: photoPipeline,
    answers: ['queue'],
    explanation: 'The producer can still post messages when the consumer is unavailable; the messages wait in the queue.',
    page: 26,
  },
  {
    id: 'L10-q8',
    kind: 'numeric',
    prompt: '120 photo jobs arrive per second and each worker processes 15 jobs per second. How many workers do you need so the queue does not grow?',
    answer: 8,
    tolerance: 0,
    unit: 'workers',
    explanation: '120 / 15 = 8 workers. Fewer and the queue grows; when it grows, the book says to add workers.',
    page: 26,
  },
];

export const cards = [
  { front: 'What is a message queue?', back: 'A durable, in-memory component that supports asynchronous communication. It buffers messages and distributes asynchronous requests.' },
  { front: 'Producers vs consumers?', back: 'Producers (publishers) create and publish messages to the queue. Consumers (subscribers) connect to the queue and perform the actions the messages define.' },
  { front: 'Why does a queue make systems more reliable?', back: 'Decoupling: the producer can post while the consumer is down, and the consumer can read while the producer is down.' },
  { front: 'PixelPost photo filters with a queue?', back: 'Web servers publish crop/sharpen/blur jobs; workers process them asynchronously. Add workers when the queue grows, remove them when it is usually empty.' },
];
