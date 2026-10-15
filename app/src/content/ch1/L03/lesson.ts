import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 3: PixelPost hits 10,000 users, and our single web server is at 98% CPU.'),
  c(5, 10, 'Pages are crawling. The Pager has opinions.'),
  c(10, 15, 'Maya has a plan: "Just buy a bigger server!"'),
  c(15, 20, "She is not wrong. That is one of the two ways to scale. Let's look at both."),
  c(20, 25, 'Option one: vertical scaling, also called "scale up".'),
  c(25, 30, 'Scaling up means adding more power, like CPU and RAM, to the server you already have.'),
  c(30, 35, 'Upgrade again: more cores, more memory, and the CPU load drops.'),
  c(35, 40, 'Notice the price: every step up the ladder costs far more than the last one.'),
  c(40, 45, 'The big advantage of scaling up is simplicity. Still one server, nothing new to run.'),
  c(45, 50, 'When traffic is low, vertical scaling is a great option.'),
  c(50, 55, 'But it comes with serious limitations. Watch what happens as PixelPost keeps growing.'),
  c(55, 60, 'Traffic climbs again, and we are already on the biggest machine there is.'),
  c(60, 65, 'Limitation one: vertical scaling has a hard limit.'),
  c(65, 70, 'It is impossible to add unlimited CPU and memory to a single server.'),
  c(70, 75, 'Limitation two shows up the moment that one server dies.'),
  c(75, 80, 'Vertical scaling has no failover and no redundancy.'),
  c(80, 86, 'If the one server goes down, the website and the app go down with it, completely.'),
  c(86, 92, 'Because of these limits, horizontal scaling is more desirable for large-scale applications.'),
  c(92, 97, 'Option two: horizontal scaling, also called "scale out".'),
  c(97, 102, 'Instead of a bigger server, you add more servers into your pool of resources.'),
  c(102, 107, 'Need more capacity? Add another server. You are not stuck under one machine\'s ceiling.'),
  c(107, 112, 'And if one server dies, the others keep serving. That is redundancy.'),
  c(112, 118, 'Scale up: simple, but it has a hard limit and no failover.'),
  c(118, 125, 'Scale out: more machines to run, but it keeps growing and survives failures.'),
  c(125, 130, 'There is still a catch. Today, users connect to the web server directly.'),
  c(130, 135, 'DNS hands out the server\'s IP, and every user talks straight to that one machine.'),
  c(135, 140, 'Problem one: if that web server goes offline, users cannot reach the website at all.'),
  c(140, 145, 'A second server standing by does not help. Nobody is sending traffic to it.'),
  c(145, 150, 'Problem two: when many users hit the server at once, it reaches its load limit.'),
  c(150, 155, 'Users then get slower responses, or fail to connect at all.'),
  c(155, 160, 'The best technique to fix both problems is a load balancer.'),
  c(160, 165, "That is the next level. 10,000 users and counting!"),
];

export const hotspots: Hotspot[] = [
  {
    id: 'scale-up',
    title: 'Vertical scaling (scale up)',
    body: 'Add more power (CPU, RAM, etc.) to an existing server. Its main advantage is simplicity, which makes it a great option when traffic is low.',
  },
  {
    id: 'hard-limit',
    title: 'The hard limit',
    body: 'You cannot add unlimited CPU and memory to a single server. Sooner or later you are on the biggest machine available, and it is still not enough.',
  },
  {
    id: 'no-failover',
    title: 'No failover, no redundancy',
    body: 'With one server there is nothing to fail over to. If it goes down, the website or app goes down with it completely.',
  },
  {
    id: 'scale-out',
    title: 'Horizontal scaling (scale out)',
    body: 'Add more servers into your pool of resources. Because vertical scaling hits a hard limit and has no redundancy, horizontal scaling is preferred for large-scale applications.',
  },
  {
    id: 'direct-connection',
    title: 'Users connect directly',
    body: 'In this design users talk to the web server directly. If it is offline, nobody can reach the site; if too many users arrive at once, responses slow down or connections fail. A load balancer is the best fix.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.limits - 2,
    question: {
      id: 'L03-cp1',
      kind: 'truefalse',
      prompt: 'The main advantage of vertical scaling is its simplicity.',
      answer: true,
      explanation: 'When traffic is low, scaling up is a great option, and simplicity is its main advantage. Its limitations show up as you grow.',
      page: 8,
    },
  },
  {
    at: T.direct - 2,
    question: {
      id: 'L03-cp2',
      kind: 'multi',
      prompt: 'Which are limitations of vertical scaling? Pick all that apply.',
      options: [
        'It has a hard limit on CPU and memory',
        'It has no failover or redundancy',
        'It needs a load balancer to work',
        'It is too complicated for small sites',
      ],
      answers: [0, 1],
      explanation: 'Scaling up hits a hard limit (no unlimited CPU/RAM in one box) and has no failover: one server down means the whole site is down. It is actually the simple option.',
      page: 8,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'One server at 98%' },
    { at: T.up, title: 'Scale up' },
    { at: T.limits, title: 'Hitting the wall' },
    { at: T.out, title: 'Scale out' },
    { at: T.direct, title: 'The direct-connection problem' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
