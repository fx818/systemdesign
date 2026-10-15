import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 5, 'Level 3. Step 3: design deep dive. Time to zoom in.'),
  c(5, 11, 'Maya liked the blueprint. Now she wants to see how deep your knowledge goes.'),
  c(11, 18, 'Before diving in, check that you have reached the step-3 starting line.'),
  c(18, 23, 'One: you and the interviewer agreed on the overall goals and the feature scope.'),
  c(23, 28, 'Two: you sketched a high-level blueprint for the overall design.'),
  c(28, 33, 'Three: you got feedback from the interviewer on that blueprint.'),
  c(33, 38, 'Four: based on the feedback, you have initial ideas about where to dig deeper.'),
  c(38, 44, 'Now work with the interviewer to identify and prioritize components in the architecture.'),
  c(44, 49, 'Every interview is different, so read the interviewer.'),
  c(49, 54, 'Sometimes the interviewer hints that she likes focusing on the high-level design.'),
  c(54, 60, 'For a senior candidate, the talk may turn to performance: bottlenecks and resource estimates.'),
  c(60, 65, 'In most cases, the interviewer wants you to dig into the details of some components.'),
  c(65, 70, 'URL shortener? The interesting part is the hash function that turns a long URL into a short one.'),
  c(70, 76, 'Chat system? How to reduce latency, and how to support online and offline status.'),
  c(76, 81, 'Time management is essential. The clock never stops.'),
  c(81, 86, 'It is easy to get carried away with minute details that do not show off your abilities.'),
  c(86, 92, 'Example: explaining Facebook\'s EdgeRank feed-ranking algorithm in detail.'),
  c(92, 97, 'It eats precious time and doesn\'t prove you can design a scalable system.'),
  c(97, 102, 'Come armed with signals to show your interviewer. Skip the unnecessary details.'),
  c(102, 108, 'Spend your minutes where they demonstrate design skill.'),
  c(108, 113, 'Back to the news feed. The interviewer is happy with the high-level design.'),
  c(113, 118, 'Two of the most important use cases deserve a deep dive: feed publishing and news feed retrieval.'),
  c(118, 123, 'Deep dive 1, publishing. A user with 5,000 friends posts a photo.'),
  c(123, 128, 'Writing to 5,000 feeds inside the request would make posting painfully slow.'),
  c(128, 133, 'So the fanout service puts the work on a message queue...'),
  c(133, 138, '...and fanout workers write the new post into each friend\'s news feed cache.'),
  c(138, 143, 'Posting stays fast; the heavy lifting happens in the background.'),
  c(143, 148, 'Deep dive 2, retrieval. A user opens their feed.'),
  c(148, 153, 'The news feed service reads that user\'s list of post IDs from the news feed cache.'),
  c(153, 158, 'It fills in the full posts and user details from their own caches.'),
  c(158, 163, 'Images and videos come from the CDN, close to the user.'),
  c(163, 170, 'Two deep dives on the components that matter most. That is step 3.'),
];

export const hotspots: Hotspot[] = [
  {
    id: 'objectives',
    title: 'The step-3 starting line',
    body: 'By now you should have agreed on goals and feature scope, sketched a high-level blueprint, received feedback on it, and have initial ideas about which areas to focus on. Then identify and prioritize components together with the interviewer.',
  },
  {
    id: 'priorities',
    title: 'Where to dig',
    body: 'Every interview is different. Some interviewers want to stay high level; with senior candidates the talk may be about performance, bottlenecks and resource estimates. Usually you dig into some components: the hash function for a URL shortener, latency and online/offline status for a chat system.',
  },
  {
    id: 'edgerank',
    title: 'Avoid unnecessary detail',
    body: 'Talking about the EdgeRank ranking algorithm in detail takes precious time and does not prove you can design a scalable system. Manage your time and show the signals that matter.',
  },
  {
    id: 'publish-deep',
    title: 'Deep dive: feed publishing',
    body: 'A simplified preview of the detailed design: the fanout service hands work to a message queue, and workers write the new post into friends\' news feed caches, so publishing stays fast even with 5,000 friends. The book covers the full design in its news feed chapter.',
  },
  {
    id: 'retrieval-deep',
    title: 'Deep dive: news feed retrieval',
    body: 'A simplified preview: the news feed service reads the user\'s list of post IDs from the news feed cache, fills in posts and user details from caches, and media is served by the CDN.',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.time - 1,
    question: {
      id: 'C3L03-cp1',
      kind: 'mcq',
      prompt: 'Designing a URL shortener, which component is the classic deep dive?',
      options: ['The login page', 'The hash function that turns a long URL into a short one', 'The office Wi-Fi', 'The logo'],
      answer: 1,
      explanation: 'For a URL shortener, the hash function design that converts a long URL to a short one is the interesting part.',
      page: 46,
    },
  },
  {
    at: T.examples - 1,
    question: {
      id: 'C3L03-cp2',
      kind: 'truefalse',
      prompt: 'Explaining the EdgeRank ranking algorithm in detail is a great use of deep-dive time in a news feed interview.',
      answer: false,
      explanation: 'It takes a lot of precious time and does not prove your ability to design a scalable system. Avoid unnecessary details.',
      page: 47,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'Zoom in' },
    { at: T.checklist, title: 'The starting line' },
    { at: T.priorities, title: 'Read the interviewer' },
    { at: T.time, title: 'Mind the clock' },
    { at: T.examples, title: 'Deep dive: publishing' },
    { at: T.retrieval, title: 'Deep dive: retrieval' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
