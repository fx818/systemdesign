/** Shared literals for Chapter 3 (A framework for system design interviews, pp. 42-50). */
import { C } from '@/scenekit';

export const CH3_PAGES: [number, number] = [42, 50];

export interface FrameworkStep {
  n: 1 | 2 | 3 | 4;
  title: string;
  short: string;
  /** Rough guide for a 45-minute session (p. 50). */
  min: number;
  max: number;
  color: string;
}

export const STEPS: FrameworkStep[] = [
  { n: 1, title: 'Understand the problem and establish design scope', short: 'Clarify', min: 3, max: 10, color: C.cyan },
  { n: 2, title: 'Propose high-level design and get buy-in', short: 'Blueprint', min: 10, max: 15, color: C.violet },
  { n: 3, title: 'Design deep dive', short: 'Deep dive', min: 10, max: 25, color: C.amber },
  { n: 4, title: 'Wrap up', short: 'Wrap up', min: 3, max: 5, color: C.emerald },
];

export const SESSION_MIN = 45;

/** The news-feed clarification dialogue from the book (p. 44), paraphrased. */
export const NEWS_FEED_QA: { q: string; a: string; key: string }[] = [
  { key: 'platform', q: 'Is this a mobile app, a web app, or both?', a: 'Both.' },
  { key: 'features', q: 'What are the most important features?', a: 'Making a post and seeing your friends’ news feed.' },
  { key: 'order', q: 'Is the feed reverse chronological, or ranked by weight?', a: 'Keep it simple: reverse chronological.' },
  { key: 'friends', q: 'How many friends can a user have?', a: '5,000.' },
  { key: 'traffic', q: 'What is the traffic volume?', a: '10 million daily active users.' },
  { key: 'media', q: 'Can the feed contain images and videos, or just text?', a: 'Media too: images and videos.' },
];

/** The generic starter questions (p. 43). */
export const STARTER_QUESTIONS = [
  'What specific features are we going to build?',
  'How many users does the product have?',
  'How fast will it scale? What scale in 3 months, 6 months, a year?',
  'What is the tech stack? Which existing services can we leverage?',
];

export const DOS = [
  'Always ask for clarification; do not assume your assumption is correct',
  'Understand the requirements of the problem',
  'Remember there is no single right or best answer',
  'Let the interviewer know what you are thinking',
  'Suggest multiple approaches if possible',
  'Agree on the blueprint, then design the most critical components first',
  'Bounce ideas off the interviewer like a teammate',
  'Never give up',
];

export const DONTS = [
  'Be unprepared for typical interview questions',
  'Jump into a solution without clarifying requirements and assumptions',
  'Go deep on a single component at the very beginning',
  'Hesitate to ask for a hint when you are stuck',
  'Think in silence',
  'Assume you are done once you give the design',
];
