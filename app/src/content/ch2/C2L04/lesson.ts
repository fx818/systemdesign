import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 4, 'Boss level. The investors ask the classic interview question.'),
  c(4, 8, 'Estimate PixelPost\'s peak QPS and its photo storage for the next five years.'),
  c(8, 13, 'Five minutes on the clock. No spreadsheet, no calculator.'),
  c(13, 18, 'Back-of-the-envelope estimation is all about the process. Start with assumptions.'),
  c(18, 22, 'Write them down, where everyone can see them.'),
  c(22, 26, '10 million monthly active users.'),
  c(26, 30, 'Half of them use PixelPost every day.'),
  c(30, 34, 'Each daily user posts twice a day...'),
  c(34, 38, '...and looks at about 50 photos.'),
  c(38, 42, '40% of posts carry a photo of about 2 MB.'),
  c(42, 48, 'And we keep everything for five years. The same recipe the book uses for Twitter.'),
  c(48, 52, 'Step one: daily active users. 10 million times 50% is 5 million.'),
  c(52, 57, 'Queries per second: daily actions divided by the seconds in a day.'),
  c(57, 61, 'A day has 86,400 seconds. Round it to 100,000.'),
  c(61, 66, 'So 10 million posts a day is about 100 posts per second. More closely: about 116.'),
  c(66, 70, 'Close enough. Precision is not the point.'),
  c(70, 75, 'Reads: 5 million users times 50 views, over 86,400 seconds...'),
  c(75, 79, '...is about 2,900 read queries per second.'),
  c(79, 82, 'The book\'s Twitter example lands at about 3,500 tweets per second.'),
  c(82, 86, 'But traffic is not flat. Everyone scrolls in the evening.'),
  c(86, 90, 'A common rule of thumb: peak QPS is about twice the average.'),
  c(90, 94, 'So PixelPost should plan for about 5,800 reads per second.'),
  c(94, 99, 'With roughly 1,000 requests per second per web server...'),
  c(99, 104, '...that is about six web servers at peak, before any spare.'),
  c(104, 109, 'Now storage. We only estimate media: photos dwarf everything else.'),
  c(109, 114, '10 million posts a day, 40% with a photo: 4 million photos.'),
  c(114, 119, 'At 2 MB each, that is 8 million MB: about 8 terabytes per day.'),
  c(119, 124, 'Over five years: 8 TB times 365 times 5.'),
  c(124, 130, 'About 14,600 terabytes. Call it 15 petabytes.'),
  c(130, 135, 'For Twitter the book gets 30 TB a day and about 55 PB over five years.'),
  c(135, 140, 'Different numbers, same steps: assumptions, DAU, QPS, peak, storage.'),
  c(140, 145, 'Interviewers care more about your process than your result. Four tips.'),
  c(145, 149, 'One: round and approximate. 99,987 divided by 9.1 becomes 100,000 divided by 10.'),
  c(149, 155, 'Two: write down your assumptions, so you can reference them later.'),
  c(155, 161, 'Three: label your units. "5 MB" is clear. A bare "5" is a trap.'),
  c(161, 167, 'Four: practise the usual estimates: QPS, peak QPS, storage, cache and number of servers.'),
  c(167, 171, 'Solving the problem matters more than the exact answer.'),
  c(171, 176, 'Maya gave the numbers without blinking. PixelPost is funded!'),
];

export const hotspots: Hotspot[] = [
  { id: 'assumptions', title: 'Assumptions', body: '10M MAU, 50% daily, 2 posts and 50 photo views per user per day, 40% of posts with a 2 MB photo, 5-year retention. Writing them down lets you and the interviewer check every later step.' },
  { id: 'qps', title: 'QPS', body: 'QPS = daily actions ÷ 86,400 s. Posts: 5M × 2 / 86,400 ≈ 116 (≈ 100 when you round a day to 10^5 s). Reads: 5M × 50 / 86,400 ≈ 2,900.' },
  { id: 'peak', title: 'Peak QPS and servers', body: 'Peak QPS ≈ 2 × QPS ≈ 5,800. At ~1,000 requests per second per web server, that is about 6 servers, plus a spare for failures.' },
  { id: 'storage', title: 'Media storage', body: '10M posts × 40% × 2 MB = 8 TB per day. 8 TB × 365 × 5 ≈ 14,600 TB ≈ 15 PB. (Book, Twitter: 30 TB/day, ~55 PB in 5 years.)' },
  { id: 'tips', title: 'Estimation tips', body: 'Round and approximate; write down your assumptions; label your units; practise the common estimates: QPS, peak QPS, storage, cache, number of servers.' },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.peak - 2,
    question: {
      id: 'C2L04-cp1',
      kind: 'numeric',
      prompt: '5 million daily users each post 2 times a day. About how many posts per second is that?',
      answer: 116,
      tolerance: 20,
      unit: 'posts/s',
      explanation: '10 million posts ÷ 86,400 s ≈ 116 per second. Rounding the day to 100,000 s gives ~100, which is also fine.',
      page: 39,
    },
  },
  {
    at: T.tips - 2,
    question: {
      id: 'C2L04-cp2',
      kind: 'numeric',
      prompt: 'The book\'s Twitter example stores 30 TB of media per day. About how many PB is that over 5 years?',
      answer: 55,
      tolerance: 3,
      unit: 'PB',
      explanation: '30 TB × 365 × 5 = 54,750 TB ≈ 55 PB.',
      page: 39,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: 'The final question' },
    { at: T.assume, title: 'Assumptions' },
    { at: T.qps, title: 'QPS' },
    { at: T.peak, title: 'Peak QPS' },
    { at: T.storage, title: 'Storage' },
    { at: T.tips, title: 'Tips' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
