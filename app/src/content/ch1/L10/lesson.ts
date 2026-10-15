import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 10: PixelPost launches photo filters. Crop, sharpen, blur.'),
  c(5, 9, 'Every upload now asks a web server to run the filters before it answers.'),
  c(9, 13, 'Those tasks take time, and the user just watches a spinner.'),
  c(13, 18, 'Uploads pile up, the CPU maxes out, and even simple pages slow down.'),
  c(18, 22, 'The web tier is doing slow work that the user does not need to wait for.'),
  c(22, 27, 'To scale further, we decouple parts of the system so they can scale independently.'),
  c(27, 32, 'The tool for that is a message queue.'),
  c(32, 38, 'A message queue is durable, stored in memory, and supports asynchronous communication.'),
  c(38, 43, 'It acts as a buffer and distributes asynchronous requests.'),
  c(43, 48, 'Input services, called producers or publishers, create messages and publish them to the queue.'),
  c(48, 52, 'Other services, called consumers or subscribers, connect to the queue…'),
  c(52, 56, '…and perform the actions defined by the messages.'),
  c(56, 60, 'Why is this so useful? Decoupling. Watch what happens when the consumer goes down.'),
  c(60, 65, 'The producer keeps posting. Messages simply wait in the queue.'),
  c(65, 70, 'Nothing is lost, and the producer never has to wait for the consumer.'),
  c(70, 76, 'The consumer comes back and works through the backlog.'),
  c(76, 81, 'Now the producer goes down. The consumer can still read the messages already queued.'),
  c(81, 86, 'Neither side depends on the other being up. Check-in time!'),
  c(86, 91, 'Back to PixelPost. Photo customization is slow work, so let\'s move it to a queue.'),
  c(91, 95, 'The web servers publish photo processing jobs to the message queue…'),
  c(95, 100, '…and reply to the user straight away. The upload feels instant.'),
  c(100, 106, 'Photo processing workers pick up jobs from the queue.'),
  c(106, 112, 'They crop, sharpen and blur asynchronously, while the web servers keep serving pages.'),
  c(112, 118, 'The web servers are producers; the workers are consumers. Quick check!'),
  c(118, 123, 'Producers and consumers can be scaled independently.'),
  c(123, 129, 'Here comes a burst of uploads. Two workers cannot keep up…'),
  c(129, 135, '…so the queue grows, and processing takes longer and longer.'),
  c(135, 140, 'When the queue gets large, add more workers.'),
  c(140, 146, 'Five workers drain the backlog and cut the processing time.'),
  c(146, 151, 'If the queue stays empty most of the time, the number of workers can be reduced.'),
  c(151, 156, 'Pay for the workers you need, when you need them.'),
  c(156, 162, 'Three million users. But do we even know what is happening inside all these boxes?'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'queue',
    title: 'Message queue',
    body: 'A durable component, stored in memory, that supports asynchronous communication. It serves as a buffer and distributes asynchronous requests: producers publish messages to it, consumers connect to it and act on them.',
  },
  {
    id: 'decoupling',
    title: 'Decoupling',
    body: 'With a queue in the middle, the producer can post a message when the consumer is unavailable, and the consumer can read messages even when the producer is unavailable. That makes the system more scalable and reliable.',
  },
  {
    id: 'workers',
    title: 'Photo processing workers',
    body: 'Photo customization (cropping, sharpening, blurring) takes time. Web servers publish processing jobs to the queue; workers pick them up and process them asynchronously, so the upload request returns immediately.',
  },
  {
    id: 'scale',
    title: 'Scaling workers',
    body: 'Producers and consumers scale independently. When the queue becomes large, add workers to reduce processing time. When it is empty most of the time, reduce the number of workers.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.photo - 1,
    question: {
      id: 'L10-cp1',
      kind: 'truefalse',
      prompt: 'If the consumer is down, the producer can still publish messages to the queue.',
      answer: true,
      explanation: 'Decoupling: the producer posts messages even when the consumer is unavailable; they wait in the queue until it comes back.',
      page: 26,
    },
  },
  {
    at: T.scale - 1,
    question: {
      id: 'L10-cp2',
      kind: 'mcq',
      prompt: 'In PixelPost\'s photo pipeline, who are the producers?',
      options: ['The photo processing workers', 'The web servers that publish jobs', 'The users\' phones', 'The database'],
      answer: 1,
      explanation: 'Web servers publish photo processing jobs to the queue (producers); photo processing workers consume them.',
      page: 26,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'Filters freeze the web tier' },
    { at: T.what, title: 'Producers, queue, consumers' },
    { at: T.decouple, title: 'Decoupling' },
    { at: T.photo, title: 'Async photo processing' },
    { at: T.scale, title: 'Scaling the workers' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
