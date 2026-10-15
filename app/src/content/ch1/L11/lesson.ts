import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 11: PixelPost has 5 million users. It is 3 AM, and the Pager is buzzing.'),
  c(5, 10, 'Uploads are failing, but nobody can tell which of the many servers is sick.'),
  c(10, 15, 'Logging into each server and reading its log file, one by one, takes forever.'),
  c(15, 20, 'Ravi explains: when a small website runs on a few servers, logging, metrics and automation are good practice...'),
  c(20, 25, '...but not a necessity. You can get by without them for a while.'),
  c(25, 30, 'PixelPost now serves a large business. At this size, investing in these tools is essential.'),
  c(30, 35, 'Three toolboxes: logging, metrics and automation.'),
  c(35, 38, "Let's open them one at a time."),
  c(38, 43, 'Logging first. Monitoring error logs helps you identify errors and problems in the system.'),
  c(43, 48, 'You can monitor error logs per server: each machine keeps its own log file.'),
  c(48, 53, 'With dozens of servers, that means hunting through dozens of files.'),
  c(53, 58, 'Or use tools that aggregate the logs into one centralized service.'),
  c(58, 63, 'Now every log line, from every machine, flows to the same place.'),
  c(63, 68, 'A central service makes logs easy to search and view. Filter for errors...'),
  c(68, 73, '...and the culprit pops out: web-3 has no space left on its disk.'),
  c(73, 78, 'One search instead of forty logins. That is why centralized logging pays off at scale.'),
  c(78, 83, 'Next: metrics. Collecting different types of metrics shows the health of the system...'),
  c(83, 88, '...and gives you business insights. A few kinds are especially useful.'),
  c(88, 93, 'Host-level metrics describe a single machine: CPU, memory, disk I/O and so on.'),
  c(93, 98, "Look: web-3's disk is pinned at 100%. Host metrics point at the exact box."),
  c(98, 103, 'Aggregated-level metrics describe a whole tier, such as the performance of the entire database tier...'),
  c(103, 108, '...or the entire cache tier. They show which layer of the system is in trouble.'),
  c(108, 113, 'Key business metrics: daily active users, retention and revenue.'),
  c(113, 118, 'They tell you whether the system is serving the business, not just whether it is up.'),
  c(118, 123, 'Last toolbox: automation. A big, complex system needs automation tools to stay productive.'),
  c(123, 128, 'Continuous integration is a good practice: every code check-in is verified automatically.'),
  c(128, 133, 'Here comes a check-in with a bug. The automated tests fail...'),
  c(133, 138, '...so the team detects the problem early, long before it reaches users.'),
  c(138, 143, 'Automating your build, test and deploy process can improve developer productivity significantly.'),
  c(143, 146, 'Machines do the repetitive checks; engineers build features.'),
  c(146, 151, "Let's update the big picture. This is the design from Figure 1-19."),
  c(151, 156, 'Because of space, only one data center is drawn. The others look the same.'),
  c(156, 161, 'The design includes a message queue, which makes the system more loosely coupled and failure resilient.'),
  c(161, 166, 'And it now includes logging, monitoring, metrics and automation tools.'),
  c(166, 171, 'With them, PixelPost can spot and fix problems fast, even at 5 million users.'),
  c(171, 176, 'One warning sign remains: the data grows every day and the database is getting overloaded.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'central-logs',
    title: 'Centralized logging',
    body: 'You can read error logs on each server, or use tools that aggregate them into one centralized service. Central logs are easy to search and view, so you find the broken server in seconds instead of logging into every machine.',
  },
  {
    id: 'metric-types',
    title: 'Three kinds of metrics',
    body: 'Host level: CPU, memory, disk I/O of one machine. Aggregated level: performance of a whole tier, like the database tier or the cache tier. Key business: daily active users, retention, revenue. Together they show system health and give business insight.',
  },
  {
    id: 'ci',
    title: 'Continuous integration',
    body: 'Each code check-in is verified through automation (build + tests), so teams detect problems early. Automating build, test and deploy can improve developer productivity significantly.',
  },
  {
    id: 'tools',
    title: 'Figure 1-19: queue + tools',
    body: 'The updated design adds a message queue (loosely coupled, failure resilient) and logging, monitoring, metrics and automation tools. Only one data center is drawn to save space.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.metrics - 2,
    question: {
      id: 'L11-cp1',
      kind: 'mcq',
      prompt: 'PixelPost runs dozens of web servers. What makes it easiest to find which one is logging errors?',
      options: [
        'SSH into each server and read its log file',
        'Aggregate all logs into a centralized service you can search',
        'Turn off logging to save disk space',
        'Add more web servers',
      ],
      answer: 1,
      explanation: 'Per-server logs work for a few machines. Aggregating logs into a centralized service makes them easy to search and view.',
      page: 26,
    },
  },
  {
    at: T.fig - 2,
    question: {
      id: 'L11-cp2',
      kind: 'truefalse',
      prompt: 'With continuous integration, each code check-in is verified through automation, so teams detect problems early.',
      answer: true,
      explanation: 'That is exactly what CI is for: automated checks on every check-in catch problems early.',
      page: 27,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: '3 AM: which server?' },
    { at: T.scale, title: 'Nice to have vs essential' },
    { at: T.logging, title: 'Logging' },
    { at: T.metrics, title: 'Metrics' },
    { at: T.automation, title: 'Automation & CI' },
    { at: T.fig, title: 'Figure 1-19' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
